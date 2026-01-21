const logger = require('../utils/logger');
const { Branch, Sale, SaleItem, SalePayment, Customer, PaymentMethod, Invoice } = require('../database/models');
const { formatDecimal } = require('../utils/helpers');

/**
 * Thermal Printer Service
 * Generates ESC/POS commands for 80mm thermal receipt printers
 *
 * ESC/POS Reference: https://reference.epson-biz.com/modules/ref_escpos/index.php
 */

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: `${ESC}@`,                    // Initialize printer
  ALIGN_LEFT: `${ESC}a\x00`,          // Left align
  ALIGN_CENTER: `${ESC}a\x01`,        // Center align
  ALIGN_RIGHT: `${ESC}a\x02`,         // Right align
  BOLD_ON: `${ESC}E\x01`,             // Bold on
  BOLD_OFF: `${ESC}E\x00`,            // Bold off
  UNDERLINE_ON: `${ESC}-\x01`,        // Underline on
  UNDERLINE_OFF: `${ESC}-\x00`,       // Underline off
  DOUBLE_WIDTH: `${GS}!\x10`,         // Double width
  DOUBLE_HEIGHT: `${GS}!\x01`,        // Double height
  DOUBLE_SIZE: `${GS}!\x11`,          // Double size (width + height)
  NORMAL_SIZE: `${GS}!\x00`,          // Normal size
  LINE_FEED: '\n',                    // Line feed
  FEED_LINES: (n) => `${ESC}d${String.fromCharCode(n)}`, // Feed N lines
  CUT_PAPER: `${GS}V\x00`,            // Full cut
  CUT_PAPER_PARTIAL: `${GS}V\x01`,   // Partial cut
  OPEN_DRAWER: `${ESC}p\x00\x19\xFA`, // Open cash drawer (if connected)
};

// Receipt formatting constants (for 80mm paper, ~40 chars per line)
const CHARS_PER_LINE = 40;
const SEPARATOR = '-'.repeat(CHARS_PER_LINE);
const SEPARATOR_THICK = '='.repeat(CHARS_PER_LINE);

/**
 * Generate receipt content with ESC/POS commands
 * @param {UUID} saleId - Sale ID to generate receipt for
 * @returns {Promise<Object>} Receipt data with ESC/POS commands and structured data
 */
const generateReceipt = async (saleId) => {
  try {
    // Fetch complete sale data
    const sale = await Sale.findByPk(saleId, {
      include: [
        { model: SaleItem, as: 'items' },
        {
          model: SalePayment,
          as: 'payments',
          include: [{ model: PaymentMethod, as: 'payment_method' }]
        },
        { model: Customer, as: 'customer' },
        { model: Invoice, as: 'invoice' }
      ]
    });

    if (!sale) {
      throw new Error(`Sale not found: ${saleId}`);
    }

    const branch = await Branch.findByPk(sale.branch_id);
    if (!branch) {
      throw new Error(`Branch not found: ${sale.branch_id}`);
    }

    // Generate ESC/POS content
    const escposContent = generateESCPOS(sale, branch);

    // Return structured data
    return {
      escposContent,
      structuredData: {
        sale: sale.toJSON(),
        branch: branch.toJSON(),
        items: sale.items.map(item => item.toJSON()),
        payments: sale.payments.map(payment => ({
          ...payment.toJSON(),
          payment_method_name: payment.payment_method.name
        })),
        customer: sale.customer ? sale.customer.toJSON() : null,
        invoice: sale.invoice ? sale.invoice.toJSON() : null
      }
    };

  } catch (error) {
    logger.error('Error generating receipt:', error);
    throw error;
  }
};

/**
 * Generate ESC/POS command string
 */
const generateESCPOS = (sale, branch) => {
  let receipt = '';

  // Initialize printer
  receipt += CMD.INIT;

  // === HEADER ===
  receipt += CMD.ALIGN_CENTER;
  receipt += CMD.DOUBLE_SIZE;
  receipt += CMD.BOLD_ON;
  receipt += `${truncate(branch.name, 20)}\n`;
  receipt += CMD.NORMAL_SIZE;
  receipt += CMD.BOLD_OFF;

  // Branch info
  if (branch.address) {
    receipt += `${truncate(branch.address, CHARS_PER_LINE)}\n`;
  }
  if (branch.phone) {
    receipt += `Tel: ${branch.phone}\n`;
  }
  receipt += CMD.LINE_FEED;
  receipt += SEPARATOR + '\n';

  // === SALE INFO ===
  receipt += CMD.ALIGN_LEFT;
  receipt += `Ticket: ${sale.ticket_number || sale.sale_number}\n`;

  const saleDate = new Date(sale.created_at);
  receipt += `Fecha: ${formatDate(saleDate)}\n`;
  receipt += `Hora: ${formatTime(saleDate)}\n`;

  // Customer info
  if (sale.customer) {
    const customerName = sale.customer.company_name ||
                        `${sale.customer.first_name || ''} ${sale.customer.last_name || ''}`.trim();
    if (customerName) {
      receipt += `Cliente: ${truncate(customerName, 32)}\n`;
    }
    if (sale.customer.document_number) {
      receipt += `DNI/CUIT: ${sale.customer.document_number}\n`;
    }
  }

  receipt += SEPARATOR + '\n';

  // === ITEMS ===
  receipt += CMD.BOLD_ON;
  receipt += padEnd('Producto', 22) + padStart('Cant', 6) + '  ' + padStart('Total', 10) + '\n';
  receipt += CMD.BOLD_OFF;
  receipt += SEPARATOR + '\n';

  for (const item of sale.items) {
    const productName = truncate(item.product_name, 38);
    const quantity = formatQuantity(item.quantity);
    const unitPrice = formatMoney(item.unit_price);
    const total = formatMoney(item.line_total);

    // Product name (full line)
    receipt += `${productName}\n`;

    // Quantity x Price = Total (second line)
    receipt += `  ${quantity} x ${unitPrice}` + padStart(total, CHARS_PER_LINE - 2 - quantity.length - 3 - unitPrice.length) + '\n';

    // Show discount if any
    if (parseFloat(item.discount_amount) > 0) {
      receipt += `  Desc. ${item.discount_percent}%: -${formatMoney(item.discount_amount)}\n`;
    }
  }

  receipt += SEPARATOR + '\n';

  // === TOTALS ===
  receipt += CMD.ALIGN_RIGHT;
  receipt += `Subtotal: ${formatMoney(sale.subtotal)}\n`;

  if (parseFloat(sale.discount_amount) > 0) {
    receipt += `Descuento: -${formatMoney(sale.discount_amount)}\n`;
  }

  if (parseFloat(sale.tax_amount) > 0) {
    receipt += `IVA: ${formatMoney(sale.tax_amount)}\n`;
  }

  receipt += SEPARATOR + '\n';
  receipt += CMD.DOUBLE_WIDTH;
  receipt += CMD.BOLD_ON;
  receipt += `TOTAL: ${formatMoney(sale.total_amount)}\n`;
  receipt += CMD.NORMAL_SIZE;
  receipt += CMD.BOLD_OFF;
  receipt += SEPARATOR + '\n';

  // === PAYMENTS ===
  receipt += CMD.ALIGN_LEFT;
  receipt += CMD.BOLD_ON;
  receipt += 'FORMA DE PAGO:\n';
  receipt += CMD.BOLD_OFF;

  for (const payment of sale.payments) {
    const methodName = payment.payment_method.name;
    const amount = formatMoney(payment.amount);

    receipt += padEnd(methodName, 24) + padStart(amount, 16) + '\n';

    // Payment details
    if (payment.reference_number) {
      receipt += `  Referencia: ${payment.reference_number}\n`;
    }
    if (payment.authorization_code) {
      receipt += `  Autorizacion: ${payment.authorization_code}\n`;
    }
    if (payment.card_last_four) {
      const cardInfo = `****${payment.card_last_four}`;
      if (payment.card_brand) {
        receipt += `  Tarjeta: ${payment.card_brand} ${cardInfo}\n`;
      } else {
        receipt += `  Tarjeta: ${cardInfo}\n`;
      }
    }
  }

  // Change
  if (parseFloat(sale.change_amount) > 0) {
    receipt += SEPARATOR + '\n';
    receipt += CMD.BOLD_ON;
    receipt += padEnd('CAMBIO:', 24) + padStart(formatMoney(sale.change_amount), 16) + '\n';
    receipt += CMD.BOLD_OFF;
  }

  receipt += SEPARATOR + '\n';

  // === INVOICE INFO ===
  if (sale.invoice) {
    receipt += CMD.ALIGN_CENTER;
    receipt += CMD.BOLD_ON;
    receipt += CMD.UNDERLINE_ON;
    receipt += `FACTURA ${sale.invoice.invoice_type} ${sale.invoice.invoice_number}\n`;
    receipt += CMD.UNDERLINE_OFF;
    receipt += CMD.BOLD_OFF;
    receipt += `CAE: ${sale.invoice.cae}\n`;

    const expDate = new Date(sale.invoice.cae_expiration);
    receipt += `Vencimiento CAE: ${formatDate(expDate)}\n`;
    receipt += SEPARATOR + '\n';
  }

  // === FOOTER ===
  receipt += CMD.ALIGN_CENTER;
  receipt += CMD.LINE_FEED;
  receipt += CMD.BOLD_ON;
  receipt += 'GRACIAS POR SU COMPRA\n';
  receipt += CMD.BOLD_OFF;
  receipt += 'Conserve este ticket\n';
  receipt += CMD.LINE_FEED;

  // Feed and cut
  receipt += CMD.FEED_LINES(3);
  receipt += CMD.CUT_PAPER_PARTIAL;

  return receipt;
};

/**
 * Generate test receipt
 */
const generateTestReceipt = async (branchId) => {
  try {
    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      throw new Error(`Branch not found: ${branchId}`);
    }

    let receipt = '';
    receipt += CMD.INIT;
    receipt += CMD.ALIGN_CENTER;
    receipt += CMD.DOUBLE_SIZE;
    receipt += CMD.BOLD_ON;
    receipt += `${branch.name}\n`;
    receipt += CMD.NORMAL_SIZE;
    receipt += CMD.BOLD_OFF;
    receipt += CMD.LINE_FEED;
    receipt += SEPARATOR + '\n';
    receipt += CMD.BOLD_ON;
    receipt += 'IMPRESION DE PRUEBA\n';
    receipt += CMD.BOLD_OFF;
    receipt += SEPARATOR + '\n';
    receipt += CMD.ALIGN_LEFT;
    receipt += `Fecha: ${formatDate(new Date())}\n`;
    receipt += `Hora: ${formatTime(new Date())}\n`;
    receipt += SEPARATOR + '\n';
    receipt += CMD.ALIGN_CENTER;
    receipt += 'Impresora configurada correctamente\n';
    receipt += CMD.LINE_FEED;
    receipt += CMD.FEED_LINES(3);
    receipt += CMD.CUT_PAPER_PARTIAL;

    return {
      escposContent: receipt,
      structuredData: {
        branch: branch.toJSON(),
        test: true
      }
    };

  } catch (error) {
    logger.error('Error generating test receipt:', error);
    throw error;
  }
};

// === Helper Functions ===

const formatMoney = (amount) => {
  const num = parseFloat(amount);
  return `$${formatDecimal(num)}`;
};

const formatQuantity = (quantity) => {
  const num = parseFloat(quantity);
  // If integer, show without decimals
  if (num === Math.floor(num)) {
    return `${num}`;
  }
  // Otherwise show with 2 decimals
  return num.toFixed(2);
};

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const truncate = (str, maxLength) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 2) + '..';
};

const padEnd = (str, length) => {
  str = String(str);
  if (str.length >= length) return str.substring(0, length);
  return str + ' '.repeat(length - str.length);
};

const padStart = (str, length) => {
  str = String(str);
  if (str.length >= length) return str.substring(0, length);
  return ' '.repeat(length - str.length) + str;
};

module.exports = {
  generateReceipt,
  generateTestReceipt,
  CMD
};

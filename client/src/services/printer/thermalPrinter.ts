/**
 * Thermal Printer Service (Client-side)
 *
 * This service handles communication with thermal printers using:
 * 1. WebUSB API for USB printers
 * 2. Network sockets for network printers
 * 3. Bluetooth API for Bluetooth printers
 *
 * For initial implementation, we support:
 * - Browser printing (fallback)
 * - Network printer via fetch/WebSocket (if supported)
 */

import type { ReceiptData, Printer } from '../../types/printer';

/**
 * Print receipt using available printer
 *
 * Current implementation: Opens print dialog with formatted receipt
 * Future: Add WebUSB, Network, Bluetooth printer support
 */
export const printReceipt = async (receiptData: ReceiptData): Promise<void> => {
  try {
    // For now, use browser print dialog with HTML version
    await printToBrowser(receiptData);

    // TODO: Future implementations
    // - await printToUSB(receiptData.escposContent);
    // - await printToNetwork(receiptData.escposContent, networkPrinterUrl);
    // - await printToBluetooth(receiptData.escposContent, bluetoothDevice);

  } catch (error) {
    console.error('Print error:', error);
    throw new Error('Failed to print receipt');
  }
};

/**
 * Print using browser print dialog (fallback method)
 */
const printToBrowser = async (receiptData: ReceiptData): Promise<void> => {
  const { structuredData } = receiptData;

  // Create printable HTML
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  const html = generatePrintHTML(structuredData);

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load
  printWindow.onload = () => {
    printWindow.print();
    // Close after printing
    setTimeout(() => printWindow.close(), 500);
  };
};

/**
 * Generate HTML for browser printing
 */
const generatePrintHTML = (data: ReceiptData['structuredData']): string => {
  const { sale, branch, items, payments, customer, invoice } = data;

  const saleDate = new Date(sale.created_at);
  const formatMoney = (amount: number | string) => `$${parseFloat(String(amount)).toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString('es-AR');
  const formatTime = (date: Date) => date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Recibo - ${sale.sale_number}</title>
      <style>
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 10mm; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          margin: 0 auto;
          padding: 10mm;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .separator { border-top: 1px dashed #000; margin: 5px 0; }
        .separator-thick { border-top: 2px solid #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; }
        .right { text-align: right; }
        .item-name { font-weight: bold; }
        .item-detail { padding-left: 10px; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="center bold large">${branch.name}</div>
      ${branch.address ? `<div class="center">${branch.address}</div>` : ''}
      ${branch.phone ? `<div class="center">Tel: ${branch.phone}</div>` : ''}

      <div class="separator"></div>

      <div><strong>Ticket:</strong> ${sale.sale_number}</div>
      <div><strong>Fecha:</strong> ${formatDate(saleDate)}</div>
      <div><strong>Hora:</strong> ${formatTime(saleDate)}</div>

      ${customer ? `
        <div><strong>Cliente:</strong> ${customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()}</div>
        ${customer.document_number ? `<div><strong>DNI/CUIT:</strong> ${customer.document_number}</div>` : ''}
      ` : ''}

      <div class="separator"></div>

      <table>
        <thead>
          <tr class="bold">
            <td>Producto</td>
            <td class="right">Cant</td>
            <td class="right">Total</td>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td colspan="3" class="item-name">${item.product?.name || item.product?.short_name || 'Producto'}</td>
            </tr>
            <tr class="item-detail">
              <td>${parseFloat(String(item.quantity))} x ${formatMoney(item.unit_price)}</td>
              <td colspan="2" class="right">${formatMoney(item.line_total)}</td>
            </tr>
            ${parseFloat(String(item.discount_amount)) > 0 ? `
              <tr class="item-detail">
                <td colspan="3">Desc. ${item.discount_percent}%: -${formatMoney(item.discount_amount)}</td>
              </tr>
            ` : ''}
          `).join('')}
        </tbody>
      </table>

      <div class="separator"></div>

      <table>
        <tr>
          <td>Subtotal:</td>
          <td class="right">${formatMoney(sale.subtotal)}</td>
        </tr>
        ${parseFloat(String(sale.discount_amount)) > 0 ? `
          <tr>
            <td>Descuento:</td>
            <td class="right">-${formatMoney(sale.discount_amount)}</td>
          </tr>
        ` : ''}
        ${parseFloat(String(sale.tax_amount)) > 0 ? `
          <tr>
            <td>IVA:</td>
            <td class="right">${formatMoney(sale.tax_amount)}</td>
          </tr>
        ` : ''}
        <tr class="bold large">
          <td>TOTAL:</td>
          <td class="right">${formatMoney(sale.total_amount)}</td>
        </tr>
      </table>

      <div class="separator"></div>

      <div class="bold">FORMA DE PAGO:</div>
      ${payments.map(payment => `
        <div>
          <table>
            <tr>
              <td>${payment.payment_method_name}</td>
              <td class="right">${formatMoney(payment.amount)}</td>
            </tr>
          </table>
          ${payment.reference_number ? `<div class="item-detail">Ref: ${payment.reference_number}</div>` : ''}
          ${payment.authorization_code ? `<div class="item-detail">Aut: ${payment.authorization_code}</div>` : ''}
          ${payment.card_last_four ? `<div class="item-detail">Tarjeta: ****${payment.card_last_four}${payment.card_brand ? ` (${payment.card_brand})` : ''}</div>` : ''}
        </div>
      `).join('')}

      ${parseFloat(String(sale.change_amount)) > 0 ? `
        <div class="separator"></div>
        <table class="bold">
          <tr>
            <td>CAMBIO:</td>
            <td class="right">${formatMoney(sale.change_amount)}</td>
          </tr>
        </table>
      ` : ''}

      ${invoice ? `
        <div class="separator"></div>
        <div class="center bold">FACTURA ${invoice.invoice_type} ${invoice.invoice_number}</div>
        <div class="center">CAE: ${invoice.cae}</div>
        <div class="center">Vencimiento CAE: ${invoice.cae_expiration_date ? formatDate(new Date(invoice.cae_expiration_date)) : '-'}</div>
      ` : ''}

      <div class="separator"></div>

      <div class="center bold">GRACIAS POR SU COMPRA</div>
      <div class="center">Conserve este ticket</div>

      <script>
        // Auto-print when loaded
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
};

/**
 * Detect available printers
 * TODO: Implement USB, Network, Bluetooth detection
 */
export const detectPrinters = async (): Promise<Printer[]> => {
  const printers: Printer[] = [];

  // Browser print is always available
  printers.push({
    id: 'browser',
    name: 'Navegador (PDF)',
    type: 'USB', // Placeholder
    status: 'ready'
  });

  // TODO: Detect USB printers via WebUSB
  // TODO: Detect network printers
  // TODO: Detect Bluetooth printers

  return printers;
};

/**
 * Test print functionality
 */
export const testPrint = async (branchId: string): Promise<void> => {
  // This will call the backend test print endpoint
  // For now, just show alert
  console.log('Test print for branch:', branchId);
  alert('Función de prueba de impresión. Implementación completa próximamente.');
};

export default {
  printReceipt,
  detectPrinters,
  testPrint
};

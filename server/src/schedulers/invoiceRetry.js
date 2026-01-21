/**
 * Invoice Retry Scheduler
 * Automatically retries failed invoices every 5 minutes
 * Only retries invoices with status PENDING and retry_count < 3
 */

const { Op } = require('sequelize');
const { Invoice, Sale, Branch, Customer, InvoiceType, SaleItem, Product } = require('../database/models');
const factuHoyService = require('../services/factuhoy.service');
const logger = require('../utils/logger');

// Maximum number of retry attempts before marking as FAILED
const MAX_RETRY_ATTEMPTS = 3;

// Retry interval in milliseconds (5 minutes)
const RETRY_INTERVAL = 5 * 60 * 1000;

let retryIntervalId = null;

/**
 * Retry a single pending invoice
 */
async function retryInvoice(invoice) {
  try {
    logger.info(`Retrying invoice ${invoice.id}`, {
      invoice_id: invoice.id,
      sale_id: invoice.sale_id,
      retry_count: invoice.retry_count
    });

    // Load sale with items
    const sale = await Sale.findByPk(invoice.sale_id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        { model: Branch, as: 'branch' },
        { model: Customer, as: 'customer' }
      ]
    });

    if (!sale) {
      throw new Error(`Sale ${invoice.sale_id} not found`);
    }

    // Get invoice type code
    const invoiceTypeRecord = await InvoiceType.findByPk(invoice.invoice_type_id);
    if (!invoiceTypeRecord) {
      throw new Error(`Invoice type ${invoice.invoice_type_id} not found`);
    }

    const branch = sale.branch;
    const customer = sale.customer;

    // Calculate amounts
    const totalAmount = parseFloat(invoice.total_amount);
    const taxAmount = parseFloat(invoice.tax_amount);
    const netAmount = parseFloat(invoice.net_amount);

    // Prepare data for FactuHoy using invoice's stored customer data (preserves overrides)
    const invoiceData = {
      invoice_type: invoiceTypeRecord.code,
      point_of_sale: invoice.point_of_sale,
      customer: {
        name: invoice.customer_name,
        document_type: invoice.customer_document_type,
        document_number: invoice.customer_document_number || '0',
        tax_condition: invoice.customer_tax_condition,
        address: invoice.customer_address || ''
      },
      items: sale.items.map(item => ({
        description: item.product_name,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate) || 21,
        total: parseFloat(item.total)
      })),
      totals: {
        subtotal: netAmount,
        tax_21: taxAmount,
        tax_10_5: 0,
        tax_27: 0,
        total: totalAmount
      },
      branch: branch
    };

    // Call FactuHoy API
    const result = await factuHoyService.createInvoice(invoiceData);

    if (result.success) {
      // Update invoice with CAE and success status
      await invoice.update({
        cae: result.cae,
        cae_expiration_date: result.cae_expiration,
        factuhoy_id: result.invoice_number?.toString() || null,
        factuhoy_response: result.afip_response,
        pdf_url: result.afip_response?.pdf_url || null,
        status: 'ISSUED',
        issued_at: new Date(),
        error_message: null,
        last_retry_at: new Date()
      });

      logger.info(`Invoice ${invoice.id} issued successfully on retry - CAE: ${result.cae}`, {
        invoice_id: invoice.id,
        sale_id: invoice.sale_id,
        cae: result.cae,
        retry_count: invoice.retry_count
      });

      return { success: true, invoice_id: invoice.id };
    } else {
      // Increment retry count
      const newRetryCount = invoice.retry_count + 1;
      const newStatus = (result.retryable && newRetryCount < MAX_RETRY_ATTEMPTS) ? 'PENDING' : 'FAILED';

      // Update invoice with error status
      await invoice.update({
        status: newStatus,
        error_message: result.error,
        factuhoy_response: result.afip_response,
        retry_count: newRetryCount,
        last_retry_at: new Date()
      });

      logger.error(`Invoice ${invoice.id} retry failed - ${result.error}`, {
        invoice_id: invoice.id,
        sale_id: invoice.sale_id,
        error: result.error,
        retryable: result.retryable,
        retry_count: newRetryCount,
        new_status: newStatus
      });

      return {
        success: false,
        invoice_id: invoice.id,
        error: result.error,
        final_status: newStatus
      };
    }
  } catch (error) {
    logger.error(`Error retrying invoice ${invoice.id}`, {
      invoice_id: invoice.id,
      error: error.message,
      stack: error.stack
    });

    // Mark as failed after max retries
    const newRetryCount = invoice.retry_count + 1;
    if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
      await invoice.update({
        status: 'FAILED',
        error_message: error.message,
        retry_count: newRetryCount,
        last_retry_at: new Date()
      });
      logger.warn(`Invoice ${invoice.id} marked as FAILED after ${newRetryCount} attempts`);
    } else {
      await invoice.update({
        retry_count: newRetryCount,
        last_retry_at: new Date(),
        error_message: error.message
      });
    }

    return {
      success: false,
      invoice_id: invoice.id,
      error: error.message
    };
  }
}

/**
 * Process all pending invoices
 */
async function processPendingInvoices() {
  try {
    logger.info('[Invoice Retry Scheduler] Starting retry process...');

    // Find all pending invoices with retry_count < MAX_RETRY_ATTEMPTS
    const pendingInvoices = await Invoice.findAll({
      where: {
        status: 'PENDING',
        retry_count: {
          [Op.lt]: MAX_RETRY_ATTEMPTS
        }
      },
      include: [
        { model: Sale, as: 'sale', attributes: ['sale_number'] }
      ],
      order: [['created_at', 'ASC']], // Oldest first
      limit: 50 // Process max 50 invoices per run to avoid overload
    });

    if (pendingInvoices.length === 0) {
      logger.info('[Invoice Retry Scheduler] No pending invoices to retry');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    logger.info(`[Invoice Retry Scheduler] Found ${pendingInvoices.length} pending invoice(s) to retry`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0
    };

    // Retry each invoice sequentially with 1-second delay between attempts
    for (const invoice of pendingInvoices) {
      const result = await retryInvoice(invoice);
      results.processed++;

      if (result.success) {
        results.succeeded++;
      } else {
        results.failed++;
      }

      // Add 1-second delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`[Invoice Retry Scheduler] Retry process completed`, results);

    return results;
  } catch (error) {
    logger.error('[Invoice Retry Scheduler] Error in processPendingInvoices', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Start the invoice retry scheduler
 */
function start() {
  // Check if FactuHoy integration is enabled
  if (process.env.FACTUHOY_ENABLED === 'false') {
    logger.info('[Invoice Retry Scheduler] FactuHoy integration disabled - scheduler not started');
    logger.info('[Invoice Retry Scheduler] Invoicing is done manually in FactuHoy by cashiers');
    return;
  }

  if (retryIntervalId) {
    logger.warn('[Invoice Retry Scheduler] Already running');
    return;
  }

  logger.info(`[Invoice Retry Scheduler] Starting - will run every ${RETRY_INTERVAL / 1000 / 60} minutes`);

  // Run immediately on startup
  processPendingInvoices().catch(error => {
    logger.error('[Invoice Retry Scheduler] Error in initial run', error);
  });

  // Schedule to run every RETRY_INTERVAL
  retryIntervalId = setInterval(() => {
    processPendingInvoices().catch(error => {
      logger.error('[Invoice Retry Scheduler] Error in scheduled run', error);
    });
  }, RETRY_INTERVAL);

  logger.info('[Invoice Retry Scheduler] Started successfully');
}

/**
 * Stop the invoice retry scheduler
 */
function stop() {
  if (retryIntervalId) {
    clearInterval(retryIntervalId);
    retryIntervalId = null;
    logger.info('[Invoice Retry Scheduler] Stopped');
  } else {
    logger.warn('[Invoice Retry Scheduler] Not running');
  }
}

module.exports = {
  start,
  stop,
  processPendingInvoices,
  retryInvoice
};

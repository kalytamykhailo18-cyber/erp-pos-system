const { Invoice, Sale, Branch, InvoiceType } = require('../database/models');
const factuHoyService = require('../services/factuhoy.service');
const pdfService = require('../services/pdf.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Retry failed invoice generation
 * This job processes PENDING invoices and retries FactuHoy submission
 */
class InvoiceRetryJob {
  constructor() {
    this.maxRetries = 5;
    this.retryIntervalMs = 60000; // 1 minute
  }

  /**
   * Process pending invoices
   */
  async processPendingInvoices() {
    try {
      logger.info('Starting invoice retry job');

      // Find PENDING invoices that need retry
      const pendingInvoices = await Invoice.findAll({
        where: {
          status: 'PENDING',
          retry_count: {
            [Op.lt]: this.maxRetries
          },
          [Op.or]: [
            { last_retry_at: null },
            {
              last_retry_at: {
                [Op.lt]: new Date(Date.now() - this.retryIntervalMs)
              }
            }
          ]
        },
        include: [
          {
            model: Sale,
            as: 'sale',
            include: [
              { model: Branch, as: 'branch' }
            ]
          },
          {
            model: InvoiceType,
            as: 'invoice_type'
          }
        ],
        limit: 10 // Process 10 at a time
      });

      if (pendingInvoices.length === 0) {
        logger.info('No pending invoices to retry');
        return { processed: 0, succeeded: 0, failed: 0 };
      }

      logger.info(`Found ${pendingInvoices.length} pending invoices to retry`);

      let succeeded = 0;
      let failed = 0;

      for (const invoice of pendingInvoices) {
        try {
          await this.retryInvoice(invoice);
          succeeded++;
        } catch (error) {
          logger.error(`Failed to retry invoice ${invoice.id}:`, error);
          failed++;
        }
      }

      logger.info(`Invoice retry job complete: ${succeeded} succeeded, ${failed} failed`);

      return {
        processed: pendingInvoices.length,
        succeeded,
        failed
      };

    } catch (error) {
      logger.error('Error in invoice retry job:', error);
      throw error;
    }
  }

  /**
   * Retry single invoice
   * @param {Invoice} invoice - Invoice to retry
   */
  async retryInvoice(invoice) {
    const sale = invoice.sale;
    const branch = sale.branch;
    const invoiceType = invoice.invoice_type;

    logger.info(`Retrying invoice ${invoice.id} (attempt ${invoice.retry_count + 1}/${this.maxRetries})`);

    // Prepare invoice data for FactuHoy
    const invoiceData = {
      invoice_type: invoiceType.code,
      point_of_sale: invoice.point_of_sale,
      customer: {
        name: invoice.customer_name,
        document_type: invoice.customer_document_type,
        document_number: invoice.customer_document_number,
        tax_condition: invoice.customer_tax_condition,
        address: invoice.customer_address
      },
      items: await sale.getSaleItems(),
      totals: {
        subtotal: invoice.net_amount,
        tax: invoice.tax_amount,
        total: invoice.total_amount
      },
      branch: {
        name: branch.name,
        address: branch.address,
        tax_id: branch.tax_id,
        tax_condition: branch.tax_condition
      }
    };

    // Call FactuHoy API
    const result = await factuHoyService.createInvoice(invoiceData);

    if (result.success) {
      // Generate local PDF as fallback if needed
      let pdfUrl = result.afip_response?.pdf_url || null;

      if (!pdfUrl) {
        try {
          const localPdfPath = await pdfService.generateInvoicePDF({
            invoice,
            sale,
            branch,
            items: await sale.getSaleItems(),
            invoiceType
          });
          pdfUrl = localPdfPath;
        } catch (pdfError) {
          logger.error(`Failed to generate local PDF for invoice ${invoice.id}:`, pdfError);
        }
      }

      // Update invoice with success
      await invoice.update({
        cae: result.cae,
        cae_expiration_date: result.cae_expiration,
        factuhoy_id: result.invoice_number?.toString() || null,
        factuhoy_response: result.afip_response,
        pdf_url: pdfUrl,
        status: 'ISSUED',
        issued_at: new Date(),
        error_message: null
      });

      logger.info(`Invoice ${invoice.id} successfully issued on retry - CAE: ${result.cae}`);
    } else {
      // Update retry count
      const newRetryCount = invoice.retry_count + 1;
      const shouldFail = !result.retryable || newRetryCount >= this.maxRetries;

      await invoice.update({
        status: shouldFail ? 'FAILED' : 'PENDING',
        error_message: result.error,
        factuhoy_response: result.afip_response,
        retry_count: newRetryCount,
        last_retry_at: new Date()
      });

      if (shouldFail) {
        logger.error(`Invoice ${invoice.id} permanently failed after ${newRetryCount} attempts`);
      } else {
        logger.warn(`Invoice ${invoice.id} retry failed (attempt ${newRetryCount}/${this.maxRetries}), will retry later`);
      }
    }
  }

  /**
   * Start the job on interval
   * @param {number} intervalMs - Interval in milliseconds
   */
  start(intervalMs = 300000) { // Default: 5 minutes
    logger.info(`Starting invoice retry job with ${intervalMs}ms interval`);
    this.interval = setInterval(() => {
      this.processPendingInvoices().catch(error => {
        logger.error('Error in scheduled invoice retry:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop the job
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      logger.info('Stopped invoice retry job');
    }
  }
}

module.exports = new InvoiceRetryJob();

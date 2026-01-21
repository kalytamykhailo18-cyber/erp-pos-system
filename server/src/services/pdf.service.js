const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const logger = require('../utils/logger');

class PDFService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../uploads/invoices');
    this.ensureOutputDirectory();
  }

  /**
   * Ensure the output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.info(`Created PDF output directory: ${this.outputDir}`);
    }
  }

  /**
   * Generate invoice PDF locally
   * @param {Object} invoiceData - Complete invoice data
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateInvoicePDF(invoiceData) {
    try {
      const {
        invoice,
        sale,
        branch,
        items,
        invoiceType
      } = invoiceData;

      // Generate filename: INV-{POS}-{TYPE}-{NUMBER}-{TIMESTAMP}.pdf
      const timestamp = Date.now();
      const filename = `INV-${invoice.point_of_sale}-${invoiceType.code}-${invoice.invoice_number}-${timestamp}.pdf`;
      const filepath = path.join(this.outputDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(filepath);

      doc.pipe(writeStream);

      // Header
      doc.fontSize(20).text(branch.name, { align: 'center' });
      doc.fontSize(10).text(branch.address || '', { align: 'center' });
      doc.fontSize(10).text(`Tel: ${branch.phone || 'N/A'}`, { align: 'center' });
      doc.moveDown();

      // Invoice Type Box
      doc.fontSize(30).text(invoiceType.code, 50, 120, { align: 'center' });
      doc.fontSize(12).text(invoiceType.name, { align: 'center' });
      doc.moveDown();

      // Invoice Details
      doc.fontSize(10);
      doc.text(`Factura N°: ${String(invoice.point_of_sale).padStart(4, '0')}-${String(invoice.invoice_number).padStart(8, '0')}`);
      doc.text(`Fecha: ${format(new Date(invoice.issued_at || invoice.created_at), 'dd/MM/yyyy HH:mm')}`);

      if (invoice.cae) {
        doc.text(`CAE: ${invoice.cae}`);
        doc.text(`Venc. CAE: ${format(new Date(invoice.cae_expiration_date), 'dd/MM/yyyy')}`);
      }
      doc.moveDown();

      // Customer Data
      doc.fontSize(12).text('DATOS DEL CLIENTE', { underline: true });
      doc.fontSize(10);
      doc.text(`Nombre: ${invoice.customer_name || 'Consumidor Final'}`);

      if (invoice.customer_document_number) {
        doc.text(`${invoice.customer_document_type}: ${invoice.customer_document_number}`);
      }

      if (invoice.customer_tax_condition) {
        doc.text(`Condición Fiscal: ${invoice.customer_tax_condition}`);
      }

      if (invoice.customer_address) {
        doc.text(`Dirección: ${invoice.customer_address}`);
      }
      doc.moveDown();

      // Items Table
      doc.fontSize(12).text('DETALLE', { underline: true });
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 350;
      const col4 = 430;
      const col5 = 500;

      doc.fontSize(9);
      doc.text('Producto', col1, tableTop);
      doc.text('Cant.', col2, tableTop);
      doc.text('P. Unit.', col3, tableTop);
      doc.text('IVA', col4, tableTop);
      doc.text('Subtotal', col5, tableTop);

      // Draw line under headers
      doc.moveTo(col1, doc.y + 2)
         .lineTo(550, doc.y + 2)
         .stroke();

      doc.moveDown(0.5);

      // Items
      items.forEach((item) => {
        const y = doc.y;
        doc.text(item.product_name || 'Producto', col1, y, { width: 180 });
        doc.text(item.quantity.toString(), col2, y);
        doc.text(`$${Number(item.unit_price).toFixed(2)}`, col3, y);
        doc.text(`${item.tax_rate}%`, col4, y);
        doc.text(`$${Number(item.subtotal).toFixed(2)}`, col5, y);
        doc.moveDown(0.8);
      });

      // Draw line before totals
      doc.moveTo(col1, doc.y + 2)
         .lineTo(550, doc.y + 2)
         .stroke();

      doc.moveDown();

      // Totals
      doc.fontSize(10);
      const totalsX = 400;
      doc.text('Subtotal:', totalsX, doc.y);
      doc.text(`$${Number(invoice.net_amount).toFixed(2)}`, 500, doc.y, { align: 'right' });

      doc.text('IVA:', totalsX, doc.y);
      doc.text(`$${Number(invoice.tax_amount).toFixed(2)}`, 500, doc.y, { align: 'right' });

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', totalsX, doc.y);
      doc.text(`$${Number(invoice.total_amount).toFixed(2)}`, 500, doc.y, { align: 'right' });

      // Footer
      doc.font('Helvetica').fontSize(8);
      doc.text('Este documento es válido como factura electrónica AFIP', 50, 700, {
        align: 'center',
        width: 500
      });

      // Finalize PDF
      doc.end();

      // Wait for write stream to finish
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      logger.info(`Generated local PDF for invoice ${invoice.id}: ${filename}`);
      return `/uploads/invoices/${filename}`;

    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Delete PDF file
   * @param {string} pdfPath - Relative path to PDF
   */
  async deletePDF(pdfPath) {
    try {
      const fullPath = path.join(__dirname, '../..', pdfPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`Deleted PDF: ${pdfPath}`);
      }
    } catch (error) {
      logger.error('Error deleting PDF:', error);
    }
  }
}

module.exports = new PDFService();

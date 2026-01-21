// Printer types for thermal receipt printing
import { Sale, SaleItem, SalePayment, Customer, Branch, Invoice } from './';
import { UUID } from './common';

export interface PrinterConfig {
  type: 'USB' | 'NETWORK' | 'BLUETOOTH';
  connection_string: string;
  paper_width: 58 | 80; // millimeters
  encoding: 'UTF-8' | 'ISO-8859-1';
  characters_per_line: number;
}

export interface ReceiptData {
  escposContent: string; // Raw ESC/POS commands for thermal printer
  structuredData: ReceiptStructuredData; // For PDF/preview rendering
}

export interface ReceiptStructuredData {
  sale: Sale;
  branch: Branch;
  items: SaleItem[];
  payments: Array<SalePayment & { payment_method_name: string }>;
  customer: Customer | null;
  invoice: Invoice | null;
}

export interface PrintJobRequest {
  sale_id: UUID;
  printer_type?: 'THERMAL' | 'PDF';
}

export interface PrintJobResponse {
  success: boolean;
  receipt_data: ReceiptData;
  message?: string;
}

export interface TestPrintRequest {
  branch_id: UUID;
  printer_config?: PrinterConfig;
}

// Printer types for thermal receipt printing
import { UUID, ISODateString } from './index';
import type { Sale, SaleItem, SalePayment, Customer, Branch, Invoice } from './index';

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

export interface PrintJob {
  id: string;
  sale_id: UUID;
  status: 'pending' | 'printing' | 'success' | 'error';
  error?: string;
  created_at: ISODateString;
}

export interface Printer {
  id: string;
  name: string;
  type: 'USB' | 'NETWORK' | 'BLUETOOTH';
  status: 'ready' | 'busy' | 'offline' | 'error';
  connection_string?: string;
}

export interface PrinterState {
  availablePrinters: Printer[];
  selectedPrinter: Printer | null;
  printQueue: PrintJob[];
  loading: boolean;
  error: string | null;
}

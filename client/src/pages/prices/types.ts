// This type is deprecated - use PriceImportItem from services/api/price.service.ts instead
export interface ExtractedPrice {
  row_number?: number;
  extracted_code: string; // Changed from supplier_code
  extracted_description: string; // Changed from description
  extracted_price: number; // Changed from unit_price
  product_id: string | null | undefined; // Changed from matched_product_id
  product?: {
    name: string;
    sku: string;
    cost_price: number;
    selling_price: number;
  };
  match_type: 'EXACT_CODE' | 'FUZZY_NAME' | 'MANUAL' | 'UNMATCHED'; // Changed from match_status enum
  match_confidence?: number; // Changed from confidence
  price_change_percent?: number | null;
  current_cost_price?: number | null;
  current_selling_price?: number | null; // Changed from current_price
  new_cost_price: number;
  new_selling_price?: number; // Changed from suggested_price
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'SKIPPED';
}

export interface ImportPreview {
  file_name?: string;
  supplier_id?: string | null;
  supplier?: {
    name: string;
    code: string;
  };
  total_rows_extracted?: number; // Changed from total_rows and total_items
  rows_matched?: number; // Changed from matched_count
  rows_unmatched?: number; // Changed from unmatched_count
  items: ExtractedPrice[];
}

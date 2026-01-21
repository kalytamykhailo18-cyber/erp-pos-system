import { get, post } from './client';
import type { ApiResponse, UUID } from '../../types';
import type { ReceiptData } from '../../types/printer';

export const printerService = {
  /**
   * Get receipt data for a sale
   * @param saleId - Sale ID to print
   * @returns Receipt data with ESC/POS commands and structured data
   */
  getReceipt: (saleId: UUID): Promise<ApiResponse<ReceiptData>> => {
    return get<ReceiptData>(`/printer/receipt/${saleId}`);
  },

  /**
   * Generate test print for a branch
   * @param branchId - Branch ID to test
   * @returns Test receipt data
   */
  testPrint: (branchId: UUID): Promise<ApiResponse<ReceiptData>> => {
    return post<ReceiptData>(`/printer/test/${branchId}`, {});
  },
};

export default printerService;

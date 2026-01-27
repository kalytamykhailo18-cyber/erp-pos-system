import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  uploadPriceFile,
  loadBatchItems,
  applyPrices,
  toggleItemSelection,
  selectAllItems,
  matchItem,
  setCurrentBatch,
  loadSuppliers,
} from '../../store/slices/priceSlice';
import { Card } from '../../components/ui';
import { FileUploadSection } from './FileUploadSection';
import { PricePreviewTable } from './PricePreviewTable';
import { ConfirmModal } from './ConfirmModal';

const PriceImportPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentBatch, batchItems, suppliers } = useAppSelector((state) => state.price);
  const loading = useAppSelector((state) => state.ui.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [marginPercent, setMarginPercent] = useState('30');
  const [roundingRule, setRoundingRule] = useState('NEAREST');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load suppliers on mount
  useEffect(() => {
    dispatch(loadSuppliers({ is_active: true }));
  }, [dispatch]);

  // Load batch items when currentBatch changes
  useEffect(() => {
    if (currentBatch?.id) {
      dispatch(loadBatchItems({ batchId: currentBatch.id }));
    }
  }, [currentBatch?.id, dispatch]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Parse rounding rule from combined format to separate rule and value
  const parseRoundingRule = (value: string): { rule: 'NONE' | 'UP' | 'DOWN' | 'NEAREST', value: number } => {
    if (value === 'none' || !value) {
      return { rule: 'NONE', value: 0 };
    }

    // Format: "nearest_10", "up_50", "down_100"
    const parts = value.split('_');
    const ruleStr = parts[0];
    const roundValue = parseInt(parts[1]) || 0;

    let rule: 'NEAREST' | 'UP' | 'DOWN' = 'NEAREST';
    if (ruleStr === 'up') rule = 'UP';
    else if (ruleStr === 'down') rule = 'DOWN';
    else rule = 'NEAREST';

    return { rule, value: roundValue };
  };

  // Process file with OCR/extraction
  const handleProcessFile = async () => {
    if (!selectedFile) return;

    const { rule, value } = parseRoundingRule(roundingRule);

    try {
      await dispatch(uploadPriceFile({
        file: selectedFile,
        supplier_id: selectedSupplier || undefined,
        margin_percentage: parseFloat(marginPercent),
        rounding_rule: rule,
        rounding_value: value,
      })).unwrap();
    } catch (error) {
      // Error handled in slice
    }
  };

  // Apply price changes
  const handleApplyPrices = async () => {
    if (!currentBatch?.id) return;

    try {
      await dispatch(applyPrices(currentBatch.id)).unwrap();

      // Reset
      setShowConfirmModal(false);
      setSelectedFile(null);
      dispatch(setCurrentBatch(null));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handled in slice
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-down duration-fast">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Importar Precios (OCR)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 animate-fade-up duration-normal">
            Extrae precios de listas de proveedores (PDF/Excel) y actualiza productos
          </p>
        </div>

        {/* Upload Section */}
        <Card className="p-6 animate-fade-up duration-normal">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 animate-fade-right duration-fast">
            1. Subir Lista de Precios
          </h2>

          <FileUploadSection
            selectedFile={selectedFile}
            selectedSupplier={selectedSupplier}
            marginPercent={marginPercent}
            roundingRule={roundingRule}
            loading={loading}
            fileInputRef={fileInputRef}
            suppliers={suppliers}
            onFileSelect={handleFileSelect}
            onSupplierChange={setSelectedSupplier}
            onMarginChange={setMarginPercent}
            onRoundingChange={setRoundingRule}
            onProcessFile={handleProcessFile}
          />
        </Card>

        {/* Preview Section */}
        {currentBatch && batchItems.length > 0 && (
          <Card className="overflow-hidden animate-zoom-in duration-normal">
            <PricePreviewTable
              preview={{
                items: batchItems.map(item => ({
                  row_number: item.row_number,
                  extracted_code: item.extracted_code,
                  extracted_description: item.extracted_description,
                  extracted_price: item.extracted_price,
                  product_id: item.product_id,
                  product: item.product,
                  match_type: item.match_type,
                  match_confidence: item.match_confidence,
                  current_cost_price: item.current_cost_price,
                  current_selling_price: item.current_selling_price,
                  new_cost_price: item.new_cost_price,
                  new_selling_price: item.new_selling_price,
                  price_change_percent: item.price_change_percent,
                  status: item.status,
                })),
                total_rows_extracted: batchItems.length,
                rows_matched: batchItems.filter(i => i.match_type !== 'UNMATCHED' && i.match_type !== 'NOT_FOUND' && i.product_id).length,
                rows_unmatched: batchItems.filter(i => i.match_type === 'UNMATCHED' || i.match_type === 'NOT_FOUND' || !i.product_id).length,
              }}
              selectedItems={new Set(
                batchItems
                  .map((item, index) => item.status === 'APPROVED' ? index : -1)
                  .filter(i => i >= 0)
              )}
              marginPercent={marginPercent}
              roundingRule={roundingRule}
              onToggleItem={(index: number) => {
                const item = batchItems[index];
                if (item?.id) {
                  dispatch(toggleItemSelection({
                    itemId: item.id,
                    selected: item.status !== 'APPROVED',
                  }));
                }
              }}
              onToggleAllMatched={() => {
                if (currentBatch?.id) {
                  const allMatchedSelected = batchItems
                    .filter(i => i.match_type !== 'UNMATCHED' && i.match_type !== 'NOT_FOUND' && i.product_id)
                    .every(i => i.status === 'APPROVED');

                  dispatch(selectAllItems({
                    batchId: currentBatch.id,
                    selected: !allMatchedSelected,
                  })).then(() => {
                    // Reload items after selection
                    if (currentBatch?.id) {
                      dispatch(loadBatchItems({ batchId: currentBatch.id }));
                    }
                  });
                }
              }}
              onApply={() => setShowConfirmModal(true)}
              onManualMatch={(index: number, productId: string) => {
                const item = batchItems[index];
                if (item?.id) {
                  dispatch(matchItem({
                    itemId: item.id,
                    productId: productId,
                  })).then(() => {
                    // Reload items after matching
                    if (currentBatch?.id) {
                      dispatch(loadBatchItems({ batchId: currentBatch.id }));
                    }
                  });
                }
              }}
            />
          </Card>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleApplyPrices}
        selectedCount={batchItems.filter(i => i.status === 'APPROVED').length}
        marginPercent={marginPercent}
        roundingRule={roundingRule}
        loading={loading}
      />
    </>
  );
};

export default PriceImportPage;

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  enterPaymentMode,
  exitPaymentMode,
  addPayment,
  removePayment,
  completeSale,
  setLoyaltyPointsToRedeem,
  setCreditToUse,
} from '../../store/slices/posSlice';
import { loadConfig } from '../../store/slices/loyaltySlice';
import { loadZones, loadNeighborhoods, calculateShipping, clearCalculation, createSaleShipping } from '../../store/slices/shippingSlice';
import type { SalePayment } from '../../types';
import DiscountModal from './DiscountModal';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CloseIcon from '@mui/icons-material/Close';
import RedeemPointsModal from './RedeemPointsModal';
import OfferCreditModal from './OfferCreditModal';

const PaymentPanel: React.FC = () => {
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { currentSession } = useAppSelector((state) => state.registers);
  const { cart, isPaymentMode, payments, paymentMethods, loyaltyPointsToRedeem, creditToUse } = useAppSelector((state) => state.pos);
  const { config: loyaltyConfig } = useAppSelector((state) => state.loyalty);
  const { neighborhoods, calculation } = useAppSelector((state) => state.shipping);
  const loading = useAppSelector((state) => state.ui.loading);

  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showRedeemPointsModal, setShowRedeemPointsModal] = useState(false);
  const [showOfferCreditModal, setShowOfferCreditModal] = useState(false);
  const [changeAsCredit, setChangeAsCredit] = useState(false);

  // PART 15: Delivery/Shipping state
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isExpressDelivery, setIsExpressDelivery] = useState(false);

  // Load loyalty config on mount
  useEffect(() => {
    dispatch(loadConfig());
  }, [dispatch]);

  // PART 15: Load shipping zones and neighborhoods
  useEffect(() => {
    dispatch(loadZones());
    dispatch(loadNeighborhoods());
  }, [dispatch]);

  // PART 15: Auto-calculate shipping when delivery data changes
  useEffect(() => {
    if (isDelivery && deliveryNeighborhood && cart.items.length > 0) {
      const subtotal = Number(cart.subtotal);
      const weight = 0; // Default to 0 since Product model doesn't have weight_kg field yet

      dispatch(
        calculateShipping({
          neighborhood: deliveryNeighborhood,
          postal_code: deliveryPostalCode || undefined,
          subtotal: subtotal,
          weight: weight > 0 ? weight : undefined,
          is_express: isExpressDelivery,
        })
      );
    } else if (!isDelivery) {
      // Clear calculation when delivery is turned off
      dispatch(clearCalculation());
    }
  }, [isDelivery, deliveryNeighborhood, deliveryPostalCode, isExpressDelivery, cart.subtotal, cart.items.length, dispatch]);

  // Calculate loyalty deductions
  const pointsRedemptionValue = loyaltyPointsToRedeem * (loyaltyConfig?.peso_per_point_redemption || 0.1);
  const creditUsedAmount = creditToUse;

  // PART 15: Include shipping cost in total
  const shippingCost = isDelivery && calculation ? Number(calculation.total_shipping_cost) : 0;
  const subtotal = Number(cart.total);
  const total = subtotal + shippingCost;

  // Calculate total after loyalty deductions
  const totalAfterLoyalty = Math.max(0, total - pointsRedemptionValue - creditUsedAmount);

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, totalAfterLoyalty - totalPaid);
  const change = Math.max(0, totalPaid - totalAfterLoyalty);

  const handleEnterPaymentMode = () => {
    if (cart.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    dispatch(enterPaymentMode());
  };

  const handleAddPayment = () => {
    if (!selectedMethodId) {
      alert('Seleccione un método de pago');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Ingrese un monto válido');
      return;
    }

    const method = paymentMethods.find((m) => m.id === selectedMethodId);
    if (!method) return;

    // CRITICAL: Validate reference number if required by payment method
    if (method.requires_reference && !referenceNumber.trim()) {
      alert(`${method.name} requiere un número de comprobante`);
      return;
    }

    const payment: SalePayment = {
      payment_method_id: selectedMethodId,
      payment_method: method,
      amount: String(amount),
      reference_number: referenceNumber || undefined,
    };

    dispatch(addPayment(payment));

    // Reset form
    setPaymentAmount('');
    setReferenceNumber('');

    // If fully paid, auto-select same method for convenience
    if (totalPaid + amount < total) {
      setPaymentAmount(String(remaining - amount));
    }
  };

  const handleRemovePayment = (index: number) => {
    dispatch(removePayment(index));
  };

  const handleRedeemPoints = (points: number) => {
    dispatch(setLoyaltyPointsToRedeem(points));
    setShowRedeemPointsModal(false);
  };

  const handleUseCredit = () => {
    if (!cart.customer) return;

    const availableCredit = Number(cart.customer.credit_balance || 0);
    const amountToUse = Math.min(availableCredit, totalAfterLoyalty);

    dispatch(setCreditToUse(amountToUse));
    alert(`Se aplicarán $${amountToUse.toLocaleString('es-AR')} de crédito del cliente`);
  };

  const handleCompleteSale = async () => {
    if (!currentSession || !user) {
      alert('No hay sesión activa');
      return;
    }

    if (totalPaid < totalAfterLoyalty) {
      alert(`Falta pagar $${remaining.toLocaleString('es-AR')}`);
      return;
    }

    // Check if should offer change as credit
    const minChangeForCredit = loyaltyConfig?.min_change_for_credit || 10;
    const shouldOfferCredit = cart.customer && change > 0 && change >= minChangeForCredit;

    // If should offer credit and haven't decided yet, show modal
    if (shouldOfferCredit && !changeAsCredit && change > 0) {
      setShowOfferCreditModal(true);
      return; // Wait for user decision
    }

    if (window.confirm(`¿Confirmar venta por $${total.toLocaleString('es-AR')}?`)) {
      try {
        const sale = await dispatch(completeSale({
          branch_id: currentSession.branch_id,
          register_id: currentSession.register_id,
          session_id: currentSession.id,
          user_id: user.id,
          points_to_redeem: loyaltyPointsToRedeem,
          credit_to_use: creditToUse,
          change_as_credit: changeAsCredit,
        })).unwrap();

        // PART 15: Create shipping record if delivery
        if (isDelivery && sale && sale.id && deliveryNeighborhood) {
          try {
            await dispatch(
              createSaleShipping({
                saleId: String(sale.id),
                data: {
                  customer_id: cart.customer?.id,
                  delivery_address: deliveryAddress,
                  delivery_neighborhood: deliveryNeighborhood,
                  delivery_city: undefined,
                  delivery_postal_code: deliveryPostalCode || undefined,
                  delivery_notes: deliveryNotes || undefined,
                  weight_kg: undefined, // Weight calculation not implemented yet (Product model doesn't have weight_kg)
                  is_express: isExpressDelivery,
                },
              })
            ).unwrap();
          } catch (shippingError) {
            console.error('[POS] Failed to create shipping record:', shippingError);
            // Don't fail the sale if shipping record creation fails
            // The sale is already complete, just log the error
          }
        }

        // Success - cart is cleared by the slice
        alert('Venta completada exitosamente');
        dispatch(exitPaymentMode());

        // PART 15: Reset delivery state
        setIsDelivery(false);
        setDeliveryNeighborhood('');
        setDeliveryAddress('');
        setDeliveryPostalCode('');
        setDeliveryNotes('');
        setIsExpressDelivery(false);
        dispatch(clearCalculation());

        // Reset loyalty state
        setChangeAsCredit(false);
      } catch (error) {
        // Error handled by slice (shows toast)
      }
    }
  };

  const handleAcceptCredit = () => {
    setChangeAsCredit(true);
    setShowOfferCreditModal(false);
    // Continue with sale completion
    handleCompleteSale();
  };

  const handleDeclineCredit = () => {
    setChangeAsCredit(false);
    setShowOfferCreditModal(false);
    // Continue with sale completion
    handleCompleteSale();
  };

  const getPaymentMethodColor = (type: string) => {
    const colors: { [key: string]: string } = {
      CASH: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      TRANSFER: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      CARD: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      QR: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      CREDIT: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Cart Summary */}
      <div className="mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-sm p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ${Number(cart.subtotal).toLocaleString('es-AR')}
            </span>
          </div>

          {Number(cart.discount_amount) > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Descuento</span>
              <span>-${Number(cart.discount_amount).toLocaleString('es-AR')}</span>
            </div>
          )}

          {Number(cart.tax_amount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">IVA</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${Number(cart.tax_amount).toLocaleString('es-AR')}
              </span>
            </div>
          )}

          {/* PART 15: Shipping Cost Display */}
          {isDelivery && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Envío</span>
              <span className={`font-semibold ${shippingCost === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toLocaleString('es-AR')}`}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900 dark:text-white">TOTAL</span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ${total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Loyalty Deductions */}
          {loyaltyPointsToRedeem > 0 && (
            <div className="flex justify-between text-sm text-primary-600 dark:text-primary-400">
              <span>Puntos Canjeados ({loyaltyPointsToRedeem})</span>
              <span>-${pointsRedemptionValue.toLocaleString('es-AR')}</span>
            </div>
          )}

          {creditToUse > 0 && (
            <div className="flex justify-between text-sm text-primary-600 dark:text-primary-400">
              <span>Crédito Usado</span>
              <span>-${creditToUse.toLocaleString('es-AR')}</span>
            </div>
          )}

          {(loyaltyPointsToRedeem > 0 || creditToUse > 0) && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">TOTAL A PAGAR</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalAfterLoyalty.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isPaymentMode ? (
        /* Before Payment Mode - Show Discount & Checkout Buttons */
        <div className="space-y-3">
          <button
            onClick={() => setShowDiscountModal(true)}
            disabled={cart.items.length === 0 || loading}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <LocalOfferIcon sx={{ fontSize: 20 }} />
            Aplicar Descuento
          </button>

          {/* Loyalty Buttons - Only show if customer is selected */}
          {cart.customer && (
            <>
              {/* Redeem Points Button */}
              {cart.customer.loyalty_points > 0 && (
                <button
                  onClick={() => setShowRedeemPointsModal(true)}
                  disabled={cart.items.length === 0 || loading || loyaltyPointsToRedeem > 0}
                  className="w-full py-3 bg-purple-600 text-white font-semibold rounded-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <AttachMoneyIcon sx={{ fontSize: 20 }} />
                  {loyaltyPointsToRedeem > 0 ?
                    `${loyaltyPointsToRedeem} Puntos Canjeados` :
                    `Canjear Puntos (${cart.customer.loyalty_points})`
                  }
                </button>
              )}

              {/* Use Credit Button */}
              {Number(cart.customer.credit_balance) > 0 && creditToUse === 0 && (
                <button
                  onClick={handleUseCredit}
                  disabled={cart.items.length === 0 || loading}
                  className="w-full py-3 bg-pink-600 text-white font-semibold rounded-sm hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCardIcon sx={{ fontSize: 20 }} />
                  Usar Crédito (${Number(cart.customer.credit_balance).toLocaleString('es-AR')})
                </button>
              )}
            </>
          )}

          {/* PART 15: Delivery Toggle & Form */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-sm border border-blue-200 dark:border-blue-700">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={isDelivery}
                onChange={(e) => {
                  setIsDelivery(e.target.checked);
                  if (!e.target.checked) {
                    // Clear delivery data when unchecked
                    setDeliveryNeighborhood('');
                    setDeliveryAddress('');
                    setDeliveryPostalCode('');
                    setDeliveryNotes('');
                    setIsExpressDelivery(false);
                  } else if (cart.customer?.neighborhood) {
                    // Pre-fill neighborhood from customer if available
                    setDeliveryNeighborhood(cart.customer.neighborhood);
                  }
                }}
                className="w-5 h-5 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="font-semibold text-gray-900 dark:text-white">
                🚚 ¿Es para envío a domicilio?
              </span>
            </label>

            {isDelivery && (
              <div className="space-y-3 mt-3">
                {/* Neighborhood Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Barrio <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryNeighborhood}
                    onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                    list="neighborhoods-autocomplete"
                    placeholder="Ej: Villa del Parque"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                  <datalist id="neighborhoods-autocomplete">
                    {Array.from(new Set(neighborhoods.filter((n) => n.is_active).map((n) => n.neighborhood_name)))
                      .sort()
                      .map((name) => (
                        <option key={name} value={name} />
                      ))}
                  </datalist>
                </div>

                {/* Address Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Calle y número"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Postal Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={deliveryPostalCode}
                    onChange={(e) => setDeliveryPostalCode(e.target.value)}
                    placeholder="Ej: 1416"
                    maxLength={20}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas de entrega
                  </label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Ej: Timbre 3B, portón verde"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Express Delivery Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isExpressDelivery}
                    onChange={(e) => setIsExpressDelivery(e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Entrega Express
                  </span>
                </label>

                {/* Shipping Cost Indicator */}
                {deliveryNeighborhood && calculation && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-600">
                    <div className="text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Zona:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{calculation.zone_name}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600 dark:text-gray-400">Costo de envío:</span>
                        <span className={`font-bold ${shippingCost === 0 ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'}`}>
                          {shippingCost === 0 ? '¡GRATIS!' : `$${shippingCost.toLocaleString('es-AR')}`}
                        </span>
                      </div>
                      {calculation.free_shipping_applied && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Envío gratis por compra mayor a ${Number(calculation.free_shipping_threshold).toLocaleString('es-AR')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error if neighborhood not found */}
                {deliveryNeighborhood && !calculation && cart.items.length > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    No se encontró zona de envío para este barrio. Verifique el nombre.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleEnterPaymentMode}
            disabled={cart.items.length === 0 || loading || (isDelivery && !deliveryNeighborhood)}
            className="w-full py-4 bg-primary-600 text-white text-lg font-bold rounded-sm hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Proceder al Pago
          </button>
        </div>
      ) : (
        /* Payment Mode Active */
        <div className="flex-1 flex flex-col">
          {/* Payment Status */}
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {(loyaltyPointsToRedeem > 0 || creditToUse > 0) ? 'A Pagar' : 'Total'}
                </p>
                <p className="font-bold text-gray-900 dark:text-white">
                  ${totalAfterLoyalty.toLocaleString('es-AR')}
                </p>
                {(loyaltyPointsToRedeem > 0 || creditToUse > 0) && (
                  <p className="text-xs text-gray-500 line-through">
                    ${total.toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Pagado</p>
                <p className="font-bold text-green-600 dark:text-green-400">
                  ${totalPaid.toLocaleString('es-AR')}
                </p>
              </div>
              <div className={`p-2 rounded ${remaining > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {remaining > 0 ? 'Falta' : 'Vuelto'}
                </p>
                <p className={`font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  ${(remaining > 0 ? remaining : change).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pago
            </label>
            <select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccione método...</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                min="0"
                step="0.01"
              />
              <button
                onClick={() => setPaymentAmount(String(remaining))}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Total
              </button>
            </div>
          </div>

          {/* Reference Number for Bank Transfer */}
          {selectedMethodId && paymentMethods.find(m => m.id === selectedMethodId)?.type === 'TRANSFER' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nº Comprobante <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Número de transferencia"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Obligatorio para transferencias
              </p>
            </div>
          )}

          {/* Add Payment Button */}
          <button
            onClick={handleAddPayment}
            disabled={!selectedMethodId || !paymentAmount || loading}
            className="w-full py-2 mb-4 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Agregar Pago
          </button>

          {/* Payment List */}
          {payments.length > 0 && (
            <div className="mb-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pagos Registrados
              </h3>
              {payments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getPaymentMethodColor(payment.payment_method?.type || 'CASH')}`}>
                      {payment.payment_method?.name}
                    </span>
                    {payment.reference_number && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Ref: {payment.reference_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${Number(payment.amount).toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => handleRemovePayment(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto space-y-2">
            <button
              onClick={handleCompleteSale}
              disabled={totalPaid < totalAfterLoyalty || loading}
              className="w-full py-4 bg-green-600 text-white text-lg font-bold rounded-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Procesando...' : 'Completar Venta'}
            </button>

            <button
              onClick={() => dispatch(exitPaymentMode())}
              disabled={loading}
              className="w-full py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
      />

      {/* Redeem Points Modal */}
      <RedeemPointsModal
        isOpen={showRedeemPointsModal}
        onClose={() => setShowRedeemPointsModal(false)}
        customer={cart.customer || null}
        onRedeem={handleRedeemPoints}
        loading={loading}
        loyaltyConfig={loyaltyConfig}
      />

      {/* Offer Credit Modal */}
      <OfferCreditModal
        isOpen={showOfferCreditModal}
        onClose={() => setShowOfferCreditModal(false)}
        customer={cart.customer || null}
        changeAmount={change}
        onAccept={handleAcceptCredit}
        onDecline={handleDeclineCredit}
        loading={loading}
      />
    </div>
  );
};

export default PaymentPanel;

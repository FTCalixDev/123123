import React, { useState } from 'react';
import {
  X, Plus, Minus, Trash2, ShoppingBag, ArrowRight,
  MapPin, Phone, User, QrCode, CreditCard, DollarSign, Check
} from 'lucide-react';
import { CartItem, Order } from '../types/restaurant';
import { sound } from '../utils/audio';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
  currentTable: number | null;
  deliveryFee?: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
  currentTable,
  deliveryFee: customDeliveryFee = 60,
}) => {
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway' | 'table'>(
    currentTable ? 'table' : 'delivery'
  );
  const [tableNum, setTableNum] = useState<number>(currentTable || 4);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const actualDeliveryFee = orderType === 'delivery' ? customDeliveryFee : 0;
  const total = subtotal + actualDeliveryFee;

  const handleCheckout = async (viaWhatsapp: boolean = false) => {
    setErrorMessage(null);
    if (items.length === 0) return;
    if (!customerName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setErrorMessage('Por favor ingresa un número de teléfono/WhatsApp válido (mínimo 8 dígitos)');
      return;
    }

    if (orderType === 'delivery' && (!customerAddress.trim() || customerAddress.trim().length < 4)) {
      setErrorMessage('Por favor ingresa tu dirección completa para el delivery en Tacuarembó');
      return;
    }

    sound.playChime();
    setIsSubmitting(true);

    const payload = {
      type: orderType,
      tableNumber: orderType === 'table' ? tableNum : undefined,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: orderType === 'delivery' ? customerAddress.trim() : 'Retiro en Local',
        notes: orderNotes.trim(),
      },
      items,
      paymentMethod,
      notes: orderNotes.trim(),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.order) {
        onOrderCompleted(data.order);
        onClearCart();
        onClose();

        if (viaWhatsapp) {
          // Format WhatsApp text
          let text = `🔥 *NUEVO PEDIDO BRASA & LÚPULO* (${data.order.orderNumber})\n\n`;
          text += `👤 *Cliente:* ${customerName}\n`;
          text += `📱 *Teléfono:* ${customerPhone}\n`;
          text += `📍 *Tipo:* ${orderType === 'delivery' ? `Delivery a ${customerAddress}` : orderType === 'table' ? `Mesa #${tableNum}` : 'Para Llevar / Takeaway'}\n`;
          text += `💳 *Pago:* ${paymentMethod}\n\n`;
          text += `*PRODUCTOS:*\n`;
          items.forEach((it) => {
            text += `• ${it.quantity}x ${it.name} ($${it.price * it.quantity} $U)\n`;
            if (it.customNotes) text += `   _${it.customNotes}_\n`;
          });
          text += `\n*TOTAL:* $${total} $U\n`;
          if (orderNotes) text += `📝 *Notas:* ${orderNotes}\n`;

          window.open(`https://wa.me/59899887766?text=${encodeURIComponent(text)}`, '_blank');
        }
      } else {
        setErrorMessage(data.error || 'Error al procesar el pedido. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de conexión al enviar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-stone-900 border-l border-stone-800 h-full flex flex-col justify-between shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <h2 className="font-display text-xl font-bold uppercase text-white tracking-wide">
              Tu Pedido ({items.reduce((a, b) => a + b.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-950 flex items-center justify-center mx-auto text-stone-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-stone-300 font-bold text-sm">Tu pedido está vacío</p>
              <p className="text-stone-500 text-xs max-w-xs mx-auto">
                Elegí tus smash burgers, pizzas al horno de leña o pintas tiradas de la carta.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white uppercase">{item.name}</h4>
                    <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                      ${item.price} <span className="text-[10px] text-stone-400">$U c/u</span>
                    </div>
                    {item.customNotes && (
                      <p className="text-[10px] text-stone-400 mt-1 line-clamp-2">
                        {item.customNotes}
                      </p>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1 text-stone-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1 text-stone-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-stone-500 hover:text-rose-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order Details Form */}
          {items.length > 0 && (
            <div className="pt-4 border-t border-stone-800 space-y-4">
              {/* Order Type Tabs */}
              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1.5">
                  Tipo de Entrega:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      orderType === 'delivery'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🛵 Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      orderType === 'takeaway'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🛍️ Llevar
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('table')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      orderType === 'table'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🍽️ En Mesa
                  </button>
                </div>
              </div>

              {/* Table number if in table mode */}
              {orderType === 'table' && (
                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                    Número de Mesa en el Local:
                  </label>
                  <select
                    value={tableNum}
                    onChange={(e) => setTableNum(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-bold focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16].map((num) => (
                      <option key={num} value={num} className="bg-stone-900 text-white">
                        Mesa #{num}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Info */}
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tu Nombre completo *"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs placeholder-stone-500 focus:border-orange-500 focus:outline-none"
                />

                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Teléfono / WhatsApp *"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs placeholder-stone-500 focus:border-orange-500 focus:outline-none"
                />

                {orderType === 'delivery' && (
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Dirección en Tacuarembó (Calle y N°) *"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs placeholder-stone-500 focus:border-orange-500 focus:outline-none"
                  />
                )}

                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Aclaraciones (ej. punto de la carne, sin hielo)"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs placeholder-stone-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                  Medio de Pago:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Efectivo" className="bg-stone-900">💵 Efectivo (Pago al recibir)</option>
                  <option value="Transferencia Prex / BROU" className="bg-stone-900">📲 Transferencia Prex / BROU</option>
                  <option value="Tarjeta Débito/Crédito (Pos)" className="bg-stone-900">💳 Tarjeta Débito / Crédito con POS</option>
                  <option value="Pago en Barra o Mesa" className="bg-stone-900">🍽️ Pago en Barra o Mesa</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer with Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-stone-800 bg-stone-950 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal productos:</span>
                <span className="font-mono text-white">${subtotal} $U</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between text-stone-400">
                  <span>Envío a Tacuarembó:</span>
                  <span className="font-mono text-white">${actualDeliveryFee} $U</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-stone-800/80">
                <span className="uppercase font-display">Total a Pagar:</span>
                <span className="font-display text-2xl text-amber-400 ember-glow">
                  ${total} <span className="text-xs font-sans text-stone-400">$U</span>
                </span>
              </div>
            </div>

            {/* Error Message if Validation or Server Fails */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-600/80 text-rose-200 text-xs font-medium animate-pulse">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleCheckout(false)}
                disabled={isSubmitting}
                className="py-3 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/30"
              >
                <span>Confirmar Pedido</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleCheckout(true)}
                disabled={isSubmitting}
                className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
              >
                <span>Pedir por WhatsApp ➔</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

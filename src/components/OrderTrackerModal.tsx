import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, ChefHat, Flame, Truck,
  ShoppingBag, Bell, Receipt
} from 'lucide-react';
import { Order } from '../types/restaurant';
import { sound } from '../utils/audio';

interface OrderTrackerModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order,
  onClose,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [waiterMessage, setWaiterMessage] = useState<string | null>(null);
  const [sendingCall, setSendingCall] = useState(false);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  // Poll order status in real time while modal is open
  useEffect(() => {
    if (!currentOrder?.id) return;
    const syncOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${currentOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) setCurrentOrder(data.order);
        }
      } catch (e) {}
    };
    const interval = setInterval(syncOrder, 4000);
    return () => clearInterval(interval);
  }, [currentOrder?.id]);

  if (!currentOrder) return null;

  const steps = [
    { key: 'received', label: 'Recibido', desc: 'Comanda registrada en caja central', icon: CheckCircle2 },
    { key: 'kitchen', label: 'En Plancha', desc: 'Smash burgers aplastándose al hierro', icon: ChefHat },
    { key: 'oven', label: 'Horno de Barro', desc: 'Cocción a leña a 420°C', icon: Flame },
    { key: 'ready', label: 'Listo / En Camino', desc: 'Despachado hacia tu mesa o domicilio', icon: Truck },
    { key: 'delivered', label: 'Entregado', desc: 'Pedido finalizado', icon: ShoppingBag },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'received': return 0;
      case 'kitchen': return 1;
      case 'oven': return 2;
      case 'ready':
      case 'in_transit': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const activeIdx = getStepIndex(currentOrder.status);
  const requiresPin = currentOrder.type === 'delivery' || currentOrder.type === 'takeaway';

  const handleCallWaiter = async (reason: string) => {
    setSendingCall(true);
    setWaiterMessage(null);
    try {
      const res = await fetch('/api/table/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: currentOrder.tableNumber || 1,
          reason,
          customerName: currentOrder.customer.name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        sound.playChime();
        setWaiterMessage(data.message || `Aviso enviado a los mozos (${reason})`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingCall(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-950/80 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="font-bold uppercase text-orange-400">Seguimiento en Tiempo Real</span>
            <span>·</span>
            <span className="font-mono">Comanda {currentOrder.orderNumber}</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            Estado de tu Comanda
          </h2>
          <p className="text-xs text-stone-400">
            {currentOrder.type === 'delivery'
              ? `Delivery a domicilio: ${currentOrder.customer.address}`
              : currentOrder.type === 'table'
              ? `Servicio en Salón · Mesa #${currentOrder.tableNumber || 1}`
              : 'Retiro en Mostrador del Local (Takeaway)'}
          </p>
        </div>

        {/* 4-Digit Security PIN Box for Delivery and Takeaway */}
        {requiresPin && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/40 space-y-1.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Código PIN de Seguridad (4 Dígitos)
            </span>
            <div className="font-mono text-3xl font-black tracking-widest text-white ember-glow tabular-nums">
              {currentOrder.verificationCode || '4921'}
            </div>
            <p className="text-[11px] text-stone-300">
              {currentOrder.type === 'delivery'
                ? 'Díctale este PIN único al repartidor en tu puerta para que pueda confirmar la entrega.'
                : 'Presenta este PIN único en mostrador al retirar tu pedido.'}
            </p>
            {currentOrder.assignedToName && (
              <div className="pt-2 text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>Personal asignado: {currentOrder.assignedToName}</span>
              </div>
            )}
          </div>
        )}

        {/* Table Service Actions (Llamar al Mozo / Pedir la Cuenta) */}
        {currentOrder.type === 'table' && (
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
            <div className="text-xs text-stone-300 font-semibold">
              Atención en Mesa #{currentOrder.tableNumber || 1}:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCallWaiter('Llamado al Mozo')}
                disabled={sendingCall}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Llamar al Mozo</span>
              </button>
              <button
                onClick={() => handleCallWaiter('Pedir la Cuenta')}
                disabled={sendingCall}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Pedir la Cuenta</span>
              </button>
            </div>
            {waiterMessage && (
              <div className="text-xs text-emerald-400 font-semibold text-center">
                {waiterMessage}
              </div>
            )}
          </div>
        )}

        {/* Progress Pipeline */}
        <div className="space-y-4 py-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeIdx;
            const isCurrent = idx === activeIdx;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-3.5 relative">
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 w-0.5 h-10 ${
                      idx < activeIdx ? 'bg-orange-500' : 'bg-stone-800'
                    }`}
                  ></div>
                )}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                    isCurrent
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40 ring-4 ring-orange-500/20'
                      : isCompleted
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-950 border border-stone-800 text-stone-600'
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                </div>

                <div>
                  <div
                    className={`text-xs font-bold uppercase tracking-wide ${
                      isCurrent ? 'text-orange-400' : isCompleted ? 'text-white' : 'text-stone-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Items summary */}
        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
          <div className="font-bold text-stone-300 pb-2 border-b border-stone-800 flex justify-between">
            <span>Detalle de tu Pedido ({currentOrder.paymentMethod})</span>
            <span className="font-mono tabular-nums text-amber-400">${currentOrder.total} $U</span>
          </div>
          <div className="space-y-1.5 text-stone-400">
            {currentOrder.items.map((it, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="text-stone-200">{it.quantity}x {it.name}</span>
                  <span className="font-mono tabular-nums text-stone-300">${it.price * it.quantity} $U</span>
                </div>
                {it.customNotes && (
                  <div className="text-[10px] text-amber-400/90 pl-3">
                    {it.customNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Direct WhatsApp Inquiry */}
        <div className="pt-1">
          <a
            href={`https://wa.me/59899887766?text=Hola%20Brasa%20%26%20L%C3%BApulo!%20Quería%20consultar%20por%20mi%20pedido%20${currentOrder.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center transition-colors"
          >
            Contactar al Local por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

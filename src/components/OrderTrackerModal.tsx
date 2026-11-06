import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Clock, ChefHat, Flame, Truck,
  ShoppingBag, Phone, RefreshCw, AlertCircle
} from 'lucide-react';
import { Order } from '../types/restaurant';

interface OrderTrackerModalProps {
  order: Order | null;
  onClose: () => void;
  onRefreshOrder?: (orderId: string) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order,
  onClose,
  onRefreshOrder,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  if (!currentOrder) return null;

  // Status mapping
  const steps = [
    { key: 'received', label: 'Recibido', desc: 'Comanda confirmada en caja', icon: CheckCircle2 },
    { key: 'kitchen', label: 'En Plancha', desc: 'Smash burgers aplastándose al hierro', icon: ChefHat },
    { key: 'oven', label: 'Horno de Barro', desc: 'Pizzas cociéndose a la leña', icon: Flame },
    { key: 'ready', label: 'Listo / En Camino', desc: 'Saliendo para tu mesa o domicilio', icon: Truck },
    { key: 'delivered', label: 'Entregado', desc: '¡A disfrutar con una birra!', icon: ShoppingBag },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'received': return 0;
      case 'kitchen': return 1;
      case 'oven': return 2;
      case 'ready': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const activeIdx = getStepIndex(currentOrder.status);

  // Advance status simulation
  const handleAdvanceStatus = async () => {
    const nextStatuses = ['received', 'kitchen', 'oven', 'ready', 'delivered'];
    const nextIdx = Math.min(nextStatuses.length - 1, activeIdx + 1);
    const nextStatus = nextStatuses[nextIdx];

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setCurrentOrder(data.order);
        if (onRefreshOrder) onRefreshOrder(currentOrder.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
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
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-950/80 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Seguimiento en Vivo
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Comanda {currentOrder.orderNumber}
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            Estado de tu Comanda
          </h2>
          <p className="text-xs text-stone-400">
            {currentOrder.type === 'delivery'
              ? `Delivery a Tacuarembó (${currentOrder.customer.address})`
              : currentOrder.type === 'table'
              ? `Servicio en Mesa #${currentOrder.tableNumber}`
              : 'Retiro en Local'}
          </p>
        </div>

        {/* Verification Code Box for Delivery */}
        {currentOrder.type === 'delivery' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/40 space-y-1.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              🔑 Tu Código Secreto de Entrega
            </span>
            <div className="font-mono text-3xl font-black tracking-widest text-white ember-glow">
              {currentOrder.verificationCode || '4921'}
            </div>
            <p className="text-[11px] text-stone-300">
              Menciónale este código al repartidor al recibir tu pedido para que confirme la entrega en su app.
            </p>
            {currentOrder.assignedToName && (
              <div className="pt-2 text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>Repartidor en camino: {currentOrder.assignedToName}</span>
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
            <span>Resumen del Pedido</span>
            <span className="font-mono text-amber-400">${currentOrder.total} $U</span>
          </div>
          <div className="space-y-1 text-stone-400">
            {currentOrder.items.map((it, i) => (
              <div key={i} className="flex justify-between">
                <span>{it.quantity}x {it.name}</span>
                <span className="font-mono text-stone-300">${it.price * it.quantity} $U</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo / Kitchen Simulation Action */}
        <div className="pt-2 flex flex-col gap-2">
          {activeIdx < steps.length - 1 && (
            <button
              onClick={handleAdvanceStatus}
              disabled={isUpdating}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Simular Avance de Cocina (Etapa Siguiente)</span>
            </button>
          )}

          <a
            href={`https://wa.me/59899887766?text=Hola%20Brasa%20%26%20L%C3%BApulo!%20Quería%20consultar%20por%20mi%20pedido%20${currentOrder.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs text-center transition-colors"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

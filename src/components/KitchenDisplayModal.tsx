import React, { useState, useEffect } from 'react';
import {
  ChefHat, X, Flame, Clock, Check, RefreshCw, AlertCircle,
  Truck, Utensils, QrCode, Filter
} from 'lucide-react';
import { Order } from '../types/restaurant';

interface KitchenDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KitchenDisplayModal: React.FC<KitchenDisplayModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'ready'>('active');
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return ['received', 'kitchen', 'oven'].includes(o.status);
    if (filter === 'ready') return ['ready', 'delivered'].includes(o.status);
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-6xl bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-black uppercase text-white tracking-wide">
                  Panel KDS de Cocina & Plancha
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Gestión de comandas en tiempo real para plancha, horno de barro y barra.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-semibold">
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'active' ? 'bg-orange-600 text-white' : 'text-stone-400'
                }`}
              >
                En Marcha ({orders.filter((o) => ['received', 'kitchen', 'oven'].includes(o.status)).length})
              </button>
              <button
                onClick={() => setFilter('ready')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'ready' ? 'bg-orange-600 text-white' : 'text-stone-400'
                }`}
              >
                Listos ({orders.filter((o) => ['ready', 'delivered'].includes(o.status)).length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-orange-600 text-white' : 'text-stone-400'
                }`}
              >
                Todos ({orders.length})
              </button>
            </div>

            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-950">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-24 text-stone-500">
              <Flame className="w-12 h-12 mx-auto mb-3 opacity-40 text-orange-500" />
              <p className="font-bold text-base text-stone-300">No hay comandas pendientes</p>
              <p className="text-xs">Los nuevos pedidos de la web y mesas aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOrders.map((order) => {
                const isTable = order.type === 'table';
                const isDelivery = order.type === 'delivery';

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                        <div>
                          <span className="font-display font-black text-2xl text-amber-400">
                            {order.orderNumber}
                          </span>
                          <div className="text-xs font-bold text-white mt-0.5">
                            {isTable ? `Mesa #${order.tableNumber}` : isDelivery ? 'Delivery' : 'Takeaway'}
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'received'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : order.status === 'kitchen'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : order.status === 'oven'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {order.status === 'received'
                            ? 'Nuevo'
                            : order.status === 'kitchen'
                            ? 'Plancha'
                            : order.status === 'oven'
                            ? 'Horno Barro'
                            : order.status === 'ready'
                            ? 'Listo'
                            : 'Entregado'}
                        </span>
                      </div>

                      {/* Customer / Address info */}
                      <div className="py-2.5 text-xs text-stone-400 border-b border-stone-800/80">
                        <div><strong>Cliente:</strong> {order.customer.name} ({order.customer.phone})</div>
                        {isDelivery && <div><strong>Dirección:</strong> {order.customer.address}</div>}
                        {order.notes && <div className="text-amber-400 mt-1"><strong>Nota:</strong> {order.notes}</div>}
                      </div>

                      {/* Items list */}
                      <div className="py-3 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="font-bold text-white flex items-center justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-mono text-stone-400">${item.price * item.quantity}</span>
                            </div>
                            {item.customNotes && (
                              <div className="text-[11px] text-amber-400/90 pl-3 border-l-2 border-amber-500/40 mt-0.5">
                                {item.customNotes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons to advance stage */}
                    <div className="pt-3 border-t border-stone-800 space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'kitchen')}
                          className="py-1.5 px-2 rounded-lg bg-orange-600/30 hover:bg-orange-600 text-orange-200 text-[11px] font-bold transition-colors"
                        >
                          A la Plancha 🔥
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'oven')}
                          className="py-1.5 px-2 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 text-[11px] font-bold transition-colors"
                        >
                          Al Horno Leña 🍕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="py-1.5 px-2 rounded-lg bg-emerald-600/40 hover:bg-emerald-600 text-emerald-200 text-[11px] font-bold transition-colors"
                        >
                          Listo / Despacho ✓
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold transition-colors"
                        >
                          Finalizar 🏁
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

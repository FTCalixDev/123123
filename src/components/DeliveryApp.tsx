import React, { useState, useEffect } from 'react';
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  AlertCircle,
  LogOut,
  RefreshCw,
  KeyRound,
  Navigation,
  Check,
  Map as MapIcon,
  Bell,
  ChefHat,
  Beer,
  Wallet,
  Flame,
  Utensils,
  ShoppingBag,
} from 'lucide-react';
import { Order, Employee, WaiterCall, TapBeer } from '../types/restaurant';
import { sound } from '../utils/audio';
import { InteractiveMap } from './InteractiveMap';

interface DeliveryAppProps {
  currentUser: Employee;
  onLogout: () => void;
  onBackToStore: () => void;
  embeddedInStaffApp?: boolean;
  onOpenKds?: () => void;
}

export const DeliveryApp: React.FC<DeliveryAppProps> = ({
  currentUser,
  onLogout,
  onBackToStore,
  embeddedInStaffApp = false,
  onOpenKds,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [taps, setTaps] = useState<TapBeer[]>([]);
  const [loading, setLoading] = useState(false);

  // Per-order 4-digit PIN input state
  const [verificationInputs, setVerificationInputs] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Navigation tabs optimized for one-handed thumb usage on mobile & desktop
  const [activeTab, setActiveTab] = useState<
    'available' | 'my_orders' | 'tables_bar' | 'map' | 'wallet'
  >('available');

  // Filter for Bolsa de Pedidos (Todos / Delivery / Takeaway / Mesa)
  const [poolFilter, setPoolFilter] = useState<'all' | 'delivery' | 'takeaway' | 'table'>('all');

  const fetchStaffData = async () => {
    try {
      const [resOrders, resCalls, resTaps] = await Promise.all([
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/table/call-waiter').then((r) => r.json()).catch(() => ({ calls: [] })),
        fetch('/api/taps').then((r) => r.json()).catch(() => ({ taps: [] })),
      ]);
      if (resOrders.orders) setOrders(resOrders.orders);
      if (resCalls.calls) setWaiterCalls(resCalls.calls);
      if (resTaps.taps) setTaps(resTaps.taps);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Available unassigned orders (Bolsa de Pedidos)
  const availableOrders = orders.filter(
    (o) =>
      o.status !== 'delivered' &&
      o.status !== 'cancelled' &&
      !o.isFraudBlocked &&
      !o.assignedTo
  );

  const filteredAvailableOrders = availableOrders.filter((o) => {
    if (poolFilter === 'all') return true;
    return o.type === poolFilter;
  });

  // Active orders locked by current employee
  const myActiveOrders = orders.filter(
    (o) =>
      o.assignedTo === currentUser.id &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled'
  );

  // Pending waiter calls from tables
  const pendingWaiterCalls = waiterCalls.filter((c) => c.status === 'pending');

  // Employee's own delivery statistics (Today, Week, Month, Total)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStr = now.toISOString().slice(0, 7);

  const myDeliveredAll = orders.filter(
    (o) => o.assignedTo === currentUser.id && o.status === 'delivered'
  );

  const myDeliveredToday = myDeliveredAll.filter(
    (o) => (o.deliveredAt || o.createdAt || '').slice(0, 10) === todayStr
  );

  const myDeliveredWeek = myDeliveredAll.filter((o) => {
    const d = new Date(o.deliveredAt || o.createdAt || '');
    return d >= sevenDaysAgo;
  });

  const myDeliveredMonth = myDeliveredAll.filter(
    (o) => (o.deliveredAt || o.createdAt || '').slice(0, 7) === monthStr
  );

  const rate = currentUser.commissionPerDelivery || 60;
  const earningsToday = myDeliveredToday.length * rate;
  const earningsWeek = myDeliveredWeek.length * rate;
  const earningsMonth = myDeliveredMonth.length * rate;
  const earningsTotal = myDeliveredAll.length * rate;

  // Claim order (Atomic Mutex Lock)
  const handleClaimOrder = async (orderId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentUser.id,
          employeeName: currentUser.name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playChime();
        setActionSuccess(
          `¡Pedido ${data.order.orderNumber} asignado y bloqueado exclusivamente para ti!`
        );
        await fetchStaffData();
        setActiveTab('my_orders');
      } else {
        setActionError(data.error || 'No se pudo tomar el pedido');
        await fetchStaffData();
      }
    } catch (e) {
      setActionError('Error de red al intentar tomar el pedido');
    } finally {
      setLoading(false);
    }
  };

  // Update Kitchen / KDS Stage from active order
  const handleUpdateKitchenStage = async (orderId: string, status: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        sound.playClick();
        setActionSuccess(`Estado de cocina actualizado a: ${status.toUpperCase()}`);
        await fetchStaffData();
      }
    } catch (e) {
      setActionError('Error al actualizar estado de cocina');
    }
  };

  // Confirm Delivery (PIN required for Delivery & Takeaway; Instant for Table)
  const handleDeliverOrder = async (order: Order) => {
    setActionError(null);
    setActionSuccess(null);

    const requiresPin = order.type === 'delivery' || order.type === 'takeaway';
    const codeForOrder = (verificationInputs[order.id] || '').trim();

    if (requiresPin && codeForOrder.length < 4) {
      setActionError(
        `Debes ingresar el Código PIN de 4 dígitos que te dicta el cliente para confirmar el pedido ${order.orderNumber}.`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeForOrder,
          employeeId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playChime();
        setActionSuccess(
          `¡Entrega de comanda ${order.orderNumber} confirmada! +$${rate} $U acreditados en tu billetera del día.`
        );
        setVerificationInputs((prev) => ({ ...prev, [order.id]: '' }));
        await fetchStaffData();
      } else {
        setActionError(data.error || 'Código PIN incorrecto. Verifica con el cliente.');
        await fetchStaffData();
      }
    } catch (e) {
      setActionError('Error de red al confirmar la entrega');
    } finally {
      setLoading(false);
    }
  };

  // Attend table waiter call
  const handleAttendWaiterCall = async (callId: string) => {
    try {
      const res = await fetch(`/api/table/call-waiter/${callId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: currentUser.name }),
      });
      if (res.ok) {
        sound.playChime();
        setActionSuccess('Llamado de mesa atendido');
        await fetchStaffData();
      }
    } catch (e) {}
  };

  // Dispatch beer pour from bar tap
  const handleBarPour = async (tapId: string, size: 'pinta' | 'growler') => {
    try {
      const res = await fetch(`/api/taps/${tapId}/pour`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size }),
      });
      if (res.ok) {
        sound.playPour();
        setActionSuccess(
          `Despacho de ${size === 'growler' ? 'Growler 1.9L (-5%)' : 'Pinta (-2%)'} descontado del barril en vivo.`
        );
        await fetchStaffData();
      }
    } catch (e) {}
  };

  return (
    <div className="bg-stone-950 text-stone-100 flex flex-col font-sans pb-20">
      {/* Standalone Header only if not embedded in StaffApp */}
      {!embeddedInStaffApp && (
        <header className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 px-4 py-3 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-600/30">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-white text-base tracking-wide uppercase">
                  Portal de Repartidores y Mozos
                </span>
                <p className="text-[11px] text-stone-400">
                  {currentUser.name} (ID: {currentUser.id}) · Tarifa: ${rate} $U/entrega
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onBackToStore}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
              >
                Web Clientes
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-5">
        {/* Live Waiter Call Banner if any table is calling */}
        {pendingWaiterCalls.length > 0 && (
          <div className="p-4 rounded-3xl bg-amber-500/15 border-2 border-amber-500/60 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Llamados de Salón Activos ({pendingWaiterCalls.length})</span>
              </div>
              <span className="text-[11px] text-amber-200">Prioridad de Atención en Mesa</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pendingWaiterCalls.map((call) => (
                <div
                  key={call.id}
                  className="p-3 rounded-2xl bg-stone-950 border border-amber-500/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-display font-black text-base text-white">
                      Mesa #{call.tableNumber} — <span className="text-amber-400">{call.reason}</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {call.customerName ? `Cliente: ${call.customerName} · ` : ''}
                      Hora: {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAttendWaiterCall(call.id)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Atender Mesa
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Wallet & Quick Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-stone-800 flex items-center justify-between shadow-xl sm:col-span-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                Acumulado a Cobrar Hoy ({currentUser.name})
              </span>
              <div className="font-display text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">
                ${earningsToday}{' '}
                <span className="text-sm font-sans text-stone-400 font-bold">$U</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 tabular-nums">
                {myDeliveredToday.length} entregas hoy × ${rate} $U · Semana: {myDeliveredWeek.length} (${earningsWeek} $U) · Mes: {myDeliveredMonth.length} (${earningsMonth} $U)
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenKds && (
                <button
                  onClick={onOpenKds}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Abrir Monitor KDS de Cocina"
                >
                  <ChefHat className="w-4 h-4" />
                  <span className="hidden sm:inline">KDS Cocina</span>
                </button>
              )}
              <button
                onClick={fetchStaffData}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Sincronizar pedidos en vivo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-stone-400">
              Credencial de Personal Activa
            </span>
            <div className="text-sm font-bold text-white mt-0.5 truncate">
              @{currentUser.username} · <span className="font-mono text-xs text-stone-400">{currentUser.id}</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">
              Tarifa asignada: ${rate} $U por entrega confirmada
            </div>
          </div>
        </div>

        {/* Action Feedback Alerts */}
        {actionError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-300 font-bold text-xs cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-300 font-bold text-xs cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Primary Mobile & Desktop Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-stone-900 p-1.5 rounded-2xl border border-stone-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('available')}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'available'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Bolsa Pedidos ({availableOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'my_orders'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Hoja de Ruta ({myActiveOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('tables_bar')}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'tables_bar'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Beer className="w-3.5 h-3.5" />
            <span>Salón & Barra ({pendingWaiterCalls.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'map'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Mapa GPS</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 col-span-2 sm:col-span-1 cursor-pointer ${
              activeTab === 'wallet'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Mi Billetera ({myDeliveredToday.length})</span>
          </button>
        </div>

        {/* TAB 1: BOLSA DE PEDIDOS Y BLOQUEO DE CONCURRENCIA (MUTEX LOCK) */}
        {activeTab === 'available' && (
          <div className="space-y-4 animate-fade-in">
            {/* Sub-filter by Order Modality */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900/70 p-2.5 rounded-2xl border border-stone-800">
              <span className="text-xs font-bold text-stone-400 px-2">
                Filtrar por modalidad:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: `Todos (${availableOrders.length})` },
                  {
                    id: 'delivery',
                    label: `Delivery (${availableOrders.filter((o) => o.type === 'delivery').length})`,
                  },
                  {
                    id: 'takeaway',
                    label: `Retiro en Local (${availableOrders.filter((o) => o.type === 'takeaway').length})`,
                  },
                  {
                    id: 'table',
                    label: `Mesas #1-#16 (${availableOrders.filter((o) => o.type === 'table').length})`,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPoolFilter(f.id as any)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      poolFilter === f.id
                        ? 'bg-stone-800 text-amber-400 border border-amber-500/40'
                        : 'bg-stone-950 text-stone-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredAvailableOrders.length === 0 ? (
              <div className="text-center py-14 bg-stone-900/50 rounded-3xl border border-stone-800 text-stone-500 space-y-2">
                <Bike className="w-10 h-10 mx-auto opacity-30 text-stone-400" />
                <p className="font-bold text-white text-sm">
                  No hay pedidos pendientes de asignar en esta categoría
                </p>
                <p className="text-xs">
                  Cuando ingrese un pedido desde la web de clientes, sonará la alerta y aparecerá aquí al instante.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAvailableOrders.map((order) => {
                  const isDelivery = order.type === 'delivery';
                  const isTable = order.type === 'table';

                  return (
                    <div
                      key={order.id}
                      className="p-4 sm:p-5 rounded-3xl bg-stone-900 border border-stone-800 hover:border-orange-500/50 transition-all shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-black text-2xl text-amber-400 tabular-nums">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs font-bold uppercase text-orange-400">
                                ·{' '}
                                {isDelivery
                                  ? 'Delivery a Domicilio'
                                  : isTable
                                  ? `Servicio en Mesa #${order.tableNumber || 1}`
                                  : 'Retiro en Local (Takeaway)'}
                              </span>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                              Cliente: <strong className="text-white">{order.customer.name}</strong> · Tel:{' '}
                              <span className="font-mono text-stone-300">{order.customer.phone}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-400 block tabular-nums">
                              Comisión: +${rate} $U
                            </span>
                            <span className="text-xs font-mono text-stone-300 tabular-nums">
                              Total: ${order.total} $U ({order.paymentMethod})
                            </span>
                          </div>
                        </div>

                        {/* Destination / Table Info */}
                        <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 text-xs space-y-1">
                          <div className="flex items-center gap-2 text-stone-200">
                            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                            <span className="font-bold">
                              {isDelivery
                                ? `Dirección: ${order.customer.address}`
                                : isTable
                                ? `Salón / Patio: Mesa #${order.tableNumber || 1} (Confirmación directa en mesa)`
                                : 'Retiro en Mostrador del Local (Requiere PIN del cliente)'}
                            </span>
                          </div>
                          {order.notes && (
                            <p className="text-[11px] text-amber-400/90 pl-6">
                              Nota de cocina: {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Items breakdown including Smash Lab layers */}
                        <div className="text-xs text-stone-300 space-y-1.5 bg-stone-950/60 p-3 rounded-2xl border border-stone-800/70">
                          {order.items.map((it, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between">
                                <span>
                                  <strong>{it.quantity}x</strong> {it.name}
                                </span>
                                <span className="font-mono tabular-nums text-stone-400">
                                  ${it.price * it.quantity} $U
                                </span>
                              </div>
                              {it.customNotes && (
                                <div className="text-[11px] text-amber-400/90 pl-3">
                                  Detalle / Capas: {it.customNotes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mutex Lock Claim Button */}
                      <button
                        onClick={() => handleClaimOrder(order.id)}
                        disabled={loading}
                        className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Tomar Pedido (Bloquear Asignación)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HOJA DE RUTA Y GESTIÓN DEL PEDIDO ACTIVO */}
        {activeTab === 'my_orders' && (
          <div className="space-y-4 animate-fade-in">
            {myActiveOrders.length === 0 ? (
              <div className="text-center py-14 bg-stone-900/50 rounded-3xl border border-stone-800 text-stone-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto opacity-30 text-stone-400" />
                <p className="font-bold text-white text-sm">
                  No tienes pedidos activos asignados en este momento
                </p>
                <p className="text-xs">
                  Ingresa a "Bolsa Pedidos" para tomar una orden de Delivery, Takeaway o Mesa.
                </p>
              </div>
            ) : (
              myActiveOrders.map((order) => {
                const isDelivery = order.type === 'delivery';
                const isTable = order.type === 'table';
                const requiresPin = order.type === 'delivery' || order.type === 'takeaway';
                const currentInput = verificationInputs[order.id] || '';

                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-6 rounded-3xl bg-stone-900 border-2 border-orange-500/80 shadow-2xl space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-2xl sm:text-3xl text-amber-400 tabular-nums">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs font-bold uppercase text-emerald-400">
                            · Bloqueado por {currentUser.name}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">
                          Modalidad:{' '}
                          <strong className="text-white">
                            {isDelivery
                              ? 'Delivery a Domicilio'
                              : isTable
                              ? `Servicio en Mesa #${order.tableNumber || 1} (Salón)`
                              : 'Retiro en Local (Takeaway)'}
                          </strong>{' '}
                          · Medio de Pago: <strong className="text-amber-300">{order.paymentMethod}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">
                          Total a Cobrar
                        </span>
                        <span className="font-display text-2xl font-black text-white tabular-nums">
                          ${order.total}{' '}
                          <span className="text-xs font-sans text-amber-400">$U</span>
                        </span>
                      </div>
                    </div>

                    {/* Customer Route Info & GPS / WhatsApp Actions */}
                    <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-white text-sm">
                            Cliente: {order.customer.name}
                          </div>
                          <div className="text-stone-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>
                              {isDelivery
                                ? `Dirección en Tacuarembó: ${order.customer.address}`
                                : isTable
                                ? `Ubicación: Mesa #${order.tableNumber || 1} en el Salón / Patio`
                                : 'Ubicación: Retiro en Mostrador del Local'}
                            </span>
                          </div>
                          {order.customer.phone && (
                            <div className="text-stone-400">
                              Teléfono: <span className="font-mono text-stone-200">{order.customer.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {order.customer.phone && (
                            <a
                              href={`https://wa.me/${order.customer.phone.replace(
                                /[^0-9]/g,
                                ''
                              )}?text=Hola%20${encodeURIComponent(
                                order.customer.name
                              )}!%20Soy%20${encodeURIComponent(
                                currentUser.name
                              )}%20de%20Brasa%20%26%20Lúpulo,%20estoy%20gestionando%20tu%20pedido%20${
                                order.orderNumber
                              }.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>WhatsApp Cliente</span>
                            </a>
                          )}

                          {isDelivery && order.customer.address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${order.customer.address}, Tacuarembó, Uruguay`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[42px] px-3 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>Abrir Ruta GPS</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {order.notes && (
                        <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          <strong>Notas de Cocina / Entrega:</strong> {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Kitchen Stage Controls (KDS) */}
                    <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-400 uppercase text-[10px]">
                          Control de Estado de Cocina (KDS):
                        </span>
                        <span className="font-mono text-amber-400 text-xs font-bold uppercase">
                          Estado actual: {order.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'kitchen', label: 'En Plancha' },
                          { key: 'oven', label: 'Horno de Barro' },
                          { key: 'ready', label: 'Listo Despacho' },
                          { key: 'in_transit', label: 'En Camino' },
                        ].map((st) => (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => handleUpdateKitchenStage(order.id, st.key)}
                            className={`min-h-[38px] py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              order.status === st.key
                                ? 'bg-orange-600 text-white border-orange-500'
                                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Items Breakdown (including Laboratorio Smash layers) */}
                    <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 text-xs space-y-2">
                      <div className="font-bold text-stone-400 pb-1 border-b border-stone-800 uppercase text-[10px]">
                        Desglose de Productos y Capas:
                      </div>
                      {order.items.map((it, idx) => (
                        <div key={idx} className="py-1 border-b border-stone-900 last:border-0">
                          <div className="flex justify-between text-stone-200 font-semibold">
                            <span>
                              <strong>{it.quantity}x</strong> {it.name}
                            </span>
                            <span className="font-mono tabular-nums">${it.price * it.quantity} $U</span>
                          </div>
                          {it.customNotes && (
                            <div className="text-[11px] text-amber-400 mt-0.5 pl-3">
                              Capas / Notas: {it.customNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Verification Section: 4-Digit Security PIN for Delivery & Takeaway; Direct Confirmation for Table */}
                    {requiresPin ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-950 to-stone-900 border-2 border-amber-500/40 space-y-3">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <label className="text-xs font-bold uppercase text-white tracking-wider">
                            Verificación de Seguridad con PIN de 4 Dígitos:
                          </label>
                        </div>

                        <p className="text-xs text-stone-400">
                          Solicita al cliente el <strong className="text-amber-300">Código PIN de 4 dígitos</strong> que figura en su pantalla de seguimiento para liberar y cerrar la entrega.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={currentInput}
                            onChange={(e) =>
                              setVerificationInputs((prev) => ({
                                ...prev,
                                [order.id]: e.target.value.replace(/\D/g, '').slice(0, 4),
                              }))
                            }
                            placeholder="PIN 4 dígitos"
                            className="w-full sm:w-44 min-h-[48px] text-center font-mono font-black text-xl tracking-widest px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-amber-400 focus:border-orange-500 focus:outline-none tabular-nums"
                          />
                          <button
                            onClick={() => handleDeliverOrder(order)}
                            disabled={loading || currentInput.trim().length < 4}
                            className="flex-1 min-h-[48px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Validar PIN y Confirmar Entrega (+${rate} $U)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                        <p className="text-xs text-emerald-300 font-medium">
                          Servicio en Mesa #{order.tableNumber || 1} ({order.customer.name}): No requiere PIN de seguridad. Confirma al entregar los platos en la mesa.
                        </p>
                        <button
                          onClick={() => handleDeliverOrder(order)}
                          disabled={loading}
                          className="w-full min-h-[48px] py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            Confirmar Entrega en Mesa #{order.tableNumber || 1} (+${rate} $U)
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: SALÓN (LLAMADOS AL MOZO) & BARRA (DESPACHO DE CANILLAS EN VIVO) */}
        {activeTab === 'tables_bar' && (
          <div className="space-y-6 animate-fade-in">
            {/* Waiter Calls Section */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <span>Alertas de Salón: Llamado al Mozo / Pedir la Cuenta</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Avisos enviados por los comensales desde las mesas (#1 a #16).
                  </p>
                </div>
              </div>

              {pendingWaiterCalls.length === 0 ? (
                <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 text-center text-xs text-stone-500">
                  No hay llamados de mesa pendientes en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingWaiterCalls.map((call) => (
                    <div
                      key={call.id}
                      className="p-4 rounded-2xl bg-stone-950 border border-amber-500/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-display font-black text-lg text-white">
                          Mesa #{call.tableNumber} · <span className="text-amber-400">{call.reason}</span>
                        </div>
                        <div className="text-xs text-stone-400">
                          {call.customerName ? `Cliente: ${call.customerName} · ` : ''}
                          Solicitado a las{' '}
                          {new Date(call.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAttendWaiterCall(call.id)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Marcar Atendido
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bar Taproom Dispatch Control */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                  <Beer className="w-5 h-5 text-amber-400" />
                  <span>Control de Barra: Despacho Real de Canillas (8 Grifos)</span>
                </h3>
                <p className="text-xs text-stone-400">
                  El nivel de barril se descuenta automáticamente con cada orden web o cuando el bartender despacha una pinta o growler en barra.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {taps.map((tap) => (
                  <div
                    key={tap.id}
                    className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-amber-400">
                          CANILLA #{tap.tapNumber}
                        </span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {tap.kegPercentage}%
                        </span>
                      </div>
                      <div className="font-display font-bold text-white text-sm uppercase truncate">
                        {tap.name}
                      </div>
                      <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden mt-2 border border-stone-800">
                        <div
                          className={`h-full ${
                            tap.kegPercentage <= 25 ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${tap.kegPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-2">
                      <button
                        onClick={() => handleBarPour(tap.id, 'pinta')}
                        className="min-h-[38px] py-1.5 px-2 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Tirar Pinta (-2%)
                      </button>
                      <button
                        onClick={() => handleBarPour(tap.id, 'growler')}
                        className="min-h-[38px] py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Growler (-5%)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MAPA GPS DE REPARTOS */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
              <div>
                <h3 className="text-sm font-bold uppercase text-white">
                  Mapa Logístico GPS en Tiempo Real — Tacuarembó
                </h3>
                <p className="text-xs text-stone-400">
                  Ubicación central de Brasa & Lúpulo (18 de Julio 245) y coordenadas de entregas activas.
                </p>
              </div>
              <InteractiveMap
                orders={orders}
                heightClass="h-80 sm:h-96"
                showOrderPins={true}
              />
            </div>
          </div>
        )}

        {/* TAB 5: BILLETERA Y ESTADÍSTICAS DEL EMPLEADO */}
        {activeTab === 'wallet' && (
          <div className="space-y-5 animate-fade-in">
            {/* 4 Period Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                <span className="text-[10px] font-bold uppercase text-stone-400">
                  Entregas de Hoy
                </span>
                <div className="font-display text-2xl font-black text-amber-400 tabular-nums mt-1">
                  ${earningsToday} $U
                </div>
                <div className="text-xs text-stone-400 tabular-nums">
                  {myDeliveredToday.length} pedidos × ${rate} $U
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                <span className="text-[10px] font-bold uppercase text-stone-400">
                  Esta Semana (7 días)
                </span>
                <div className="font-display text-2xl font-black text-white tabular-nums mt-1">
                  ${earningsWeek} $U
                </div>
                <div className="text-xs text-stone-400 tabular-nums">
                  {myDeliveredWeek.length} pedidos entregados
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                <span className="text-[10px] font-bold uppercase text-stone-400">
                  Este Mes
                </span>
                <div className="font-display text-2xl font-black text-white tabular-nums mt-1">
                  ${earningsMonth} $U
                </div>
                <div className="text-xs text-stone-400 tabular-nums">
                  {myDeliveredMonth.length} pedidos entregados
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                <span className="text-[10px] font-bold uppercase text-stone-400">
                  Total Histórico
                </span>
                <div className="font-display text-2xl font-black text-emerald-400 tabular-nums mt-1">
                  ${earningsTotal} $U
                </div>
                <div className="text-xs text-stone-400 tabular-nums">
                  {myDeliveredAll.length} entregas históricas
                </div>
              </div>
            </div>

            {/* Detailed History List */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="font-display text-base font-bold uppercase text-white">
                Historial de Entregas Confirmadas ({myDeliveredAll.length})
              </h3>

              {myDeliveredAll.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">
                  Aún no registras entregas finalizadas. Cada pedido entregado acreditará +${rate} $U en tu liquidación.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myDeliveredAll.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            {order.orderNumber}
                          </span>
                          <span className="text-stone-500">·</span>
                          <span className="text-white font-semibold">{order.customer.name}</span>
                          <span className="text-stone-400">
                            ·{' '}
                            {order.type === 'delivery'
                              ? 'Delivery'
                              : order.type === 'table'
                              ? `Mesa #${order.tableNumber || 1}`
                              : 'Takeaway'}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 tabular-nums">
                          Finalizado:{' '}
                          {new Date(order.deliveredAt || order.createdAt).toLocaleString([], {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · Total orden: ${order.total} $U ({order.paymentMethod})
                        </div>
                      </div>

                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 font-mono font-black border border-emerald-500/30 shrink-0 tabular-nums">
                        +${order.deliveryCommission || rate} $U
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

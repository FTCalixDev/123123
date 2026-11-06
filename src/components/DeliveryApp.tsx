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
  Eye,
} from 'lucide-react';
import { Order, Employee } from '../types/restaurant';
import { sound } from '../utils/audio';
import { InteractiveMap } from './InteractiveMap';

interface DeliveryAppProps {
  currentUser: Employee;
  onLogout: () => void;
  onBackToStore: () => void;
  embeddedInStaffApp?: boolean;
}

export const DeliveryApp: React.FC<DeliveryAppProps> = ({
  currentUser,
  onLogout,
  onBackToStore,
  embeddedInStaffApp = false,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  // Per-order verification code input dictionary to avoid state collision across multiple orders
  const [verificationInputs, setVerificationInputs] = useState<Record<string, string>>({});
  const [showDemoCodeHint, setShowDemoCodeHint] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'my_orders' | 'map' | 'history'>('available');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Available orders: not delivered, not cancelled, not fraud-blocked, and not assigned to anyone yet
  const availableOrders = orders.filter(
    (o) =>
      o.status !== 'delivered' &&
      o.status !== 'cancelled' &&
      !o.isFraudBlocked &&
      !o.assignedTo
  );

  // Orders claimed by current employee
  const myActiveOrders = orders.filter(
    (o) =>
      o.assignedTo === currentUser.id &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled'
  );

  // Delivered by current employee today
  const todayStr = new Date().toISOString().slice(0, 10);
  const myDeliveredToday = orders.filter(
    (o) =>
      o.assignedTo === currentUser.id &&
      o.status === 'delivered' &&
      (o.deliveredAt || o.createdAt || '').slice(0, 10) === todayStr
  );

  const myDeliveredTotal = orders.filter(
    (o) => o.assignedTo === currentUser.id && o.status === 'delivered'
  );

  const rate = currentUser.commissionPerDelivery || 60;
  const earningsToday = myDeliveredToday.length * rate;
  const earningsTotal = myDeliveredTotal.length * rate;

  // Claim order (Atomic exclusive lock)
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
          `¡Tomaste el pedido ${data.order.orderNumber}! Quedó bloqueado exclusivamente para ti.`
        );
        await fetchOrders();
        setActiveTab('my_orders');
      } else {
        setActionError(data.error || 'No se pudo tomar el pedido');
        await fetchOrders();
      }
    } catch (e) {
      setActionError('Error de red al intentar tomar el pedido');
    } finally {
      setLoading(false);
    }
  };

  // Deliver order with per-order 4-digit verification code
  const handleDeliverOrder = async (order: Order) => {
    setActionError(null);
    setActionSuccess(null);

    const codeForOrder = (verificationInputs[order.id] || '').trim();

    if (order.type === 'delivery' && !codeForOrder) {
      setActionError(
        `Debes ingresar el código de 4 dígitos del cliente para confirmar el pedido ${order.orderNumber}.`
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
          `¡Entrega de comanda ${order.orderNumber} confirmada! +$${rate} $U acreditados en tu cuenta.`
        );
        setVerificationInputs((prev) => ({ ...prev, [order.id]: '' }));
        await fetchOrders();
      } else {
        setActionError(data.error || 'Código de verificación incorrecto');
        await fetchOrders();
      }
    } catch (e) {
      setActionError('Error de red al confirmar la entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-950 text-stone-100 flex flex-col font-sans pb-16">
      {/* Standalone Header only if not embedded in StaffApp */}
      {!embeddedInStaffApp && (
        <header className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 px-4 py-3 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-600/30">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-white text-base tracking-wide uppercase">
                    App Encargados & Repartidores
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    En Línea
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {currentUser.name} (ID: {currentUser.id}) • Tarifa: ${rate} $U/envío
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onBackToStore}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
              >
                Ir a Web Clientes
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

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-5">
        {/* Earnings & Performance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-stone-800 flex items-center justify-between shadow-xl sm:col-span-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                Liquidación a Cobrar Hoy ({currentUser.name})
              </span>
              <div className="font-display text-3xl sm:text-4xl font-black text-amber-400">
                ${earningsToday}{' '}
                <span className="text-sm font-sans text-stone-400 font-bold">$U</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {myDeliveredToday.length} entregas hoy × ${rate} $U por entrega • Acumulado histórico: ${earningsTotal} $U ({myDeliveredTotal.length} envíos)
              </p>
            </div>

            <button
              onClick={fetchOrders}
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors shrink-0"
              title="Refrescar pedidos en vivo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-stone-400">
              Tu Cuenta de Empleado
            </span>
            <div className="text-sm font-bold text-white mt-0.5 truncate">
              @{currentUser.username}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">
              Estado: Aprobado • Rol: {currentUser.role === 'admin' ? 'Admin / Reparto' : 'Repartidor / Mozo'}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {actionError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-300 font-bold text-xs">
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
            <button onClick={() => setActionSuccess(null)} className="text-emerald-300 font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-stone-900 p-1.5 rounded-2xl border border-stone-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2.5 px-2 rounded-xl transition-all ${
              activeTab === 'available'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            📦 Disponibles ({availableOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`py-2.5 px-2 rounded-xl transition-all relative ${
              activeTab === 'my_orders'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            🛵 Mis Pedidos ({myActiveOrders.length})
            {myActiveOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2 animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'map'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Mapa GPS</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-2 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            ✅ Entregados ({myDeliveredToday.length})
          </button>
        </div>

        {/* TAB 1: AVAILABLE ORDERS */}
        {activeTab === 'available' && (
          <div className="space-y-4 animate-fade-in">
            {availableOrders.length === 0 ? (
              <div className="text-center py-14 bg-stone-900/50 rounded-3xl border border-stone-800 text-stone-500 space-y-2">
                <Bike className="w-10 h-10 mx-auto opacity-30 text-stone-400" />
                <p className="font-bold text-white text-sm">
                  No hay pedidos pendientes de asignar
                </p>
                <p className="text-xs">
                  Cuando un cliente pida por Delivery, Para Llevar o desde una Mesa, aparecerá aquí al instante.
                </p>
              </div>
            ) : (
              availableOrders.map((order) => {
                const isDelivery = order.type === 'delivery';
                const isTable = order.type === 'table';

                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 rounded-3xl bg-stone-900 border border-stone-800 hover:border-orange-500/50 transition-all shadow-xl space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-2xl text-amber-400">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isDelivery
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : isTable
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isDelivery
                              ? '🛵 Delivery a Domicilio'
                              : isTable
                              ? `🍽️ Mesa #${order.tableNumber || 1} (Salón)`
                              : '🛍️ Para Llevar (Takeaway)'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">
                          Cliente: <strong className="text-white">{order.customer.name}</strong> • Total: <strong className="text-amber-400">${order.total} $U</strong> ({order.paymentMethod})
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        Ganancia: +${rate} $U
                      </span>
                    </div>

                    {/* Destination / Table Info */}
                    <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 text-xs space-y-1">
                      <div className="flex items-center gap-2 text-stone-200">
                        <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="font-bold">
                          {isDelivery
                            ? `Dirección: ${order.customer.address}`
                            : isTable
                            ? `Llevar a: Mesa #${order.tableNumber || 1} (Sin código requerido)`
                            : 'Retiro en Barra del Local'}
                        </span>
                      </div>
                      {order.notes && (
                        <p className="text-[11px] text-amber-400/90 pl-6">
                          Nota del cliente: {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Items preview */}
                    <div className="text-xs text-stone-300 space-y-1 bg-stone-950/60 p-3 rounded-2xl border border-stone-800/70">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            <strong>{it.quantity}x</strong> {it.name}
                          </span>
                          <span className="font-mono text-stone-400">
                            ${it.price * it.quantity} $U
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Lock/Claim Order Button */}
                    <button
                      onClick={() => handleClaimOrder(order.id)}
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aceptar y Tomar Pedido (Bloquear para mí)</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: MY ACTIVE ORDERS */}
        {activeTab === 'my_orders' && (
          <div className="space-y-4 animate-fade-in">
            {myActiveOrders.length === 0 ? (
              <div className="text-center py-14 bg-stone-900/50 rounded-3xl border border-stone-800 text-stone-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto opacity-30 text-stone-400" />
                <p className="font-bold text-white text-sm">
                  No tienes pedidos tomados en curso
                </p>
                <p className="text-xs">
                  Ve a la pestaña "Disponibles" para aceptar un pedido de delivery o mesa.
                </p>
              </div>
            ) : (
              myActiveOrders.map((order) => {
                const isDelivery = order.type === 'delivery';
                const isTable = order.type === 'table';
                const currentInput = verificationInputs[order.id] || '';
                const expectedCode = order.verificationCode || '4921';

                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-6 rounded-3xl bg-stone-900 border-2 border-orange-500/80 shadow-2xl space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-2xl sm:text-3xl text-amber-400">
                            {order.orderNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-stone-950 text-[10px] font-black uppercase">
                            Asignado a {currentUser.name}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">
                          Modalidad:{' '}
                          <strong className="text-white">
                            {isDelivery
                              ? 'Delivery a Domicilio'
                              : isTable
                              ? `Mesa #${order.tableNumber || 1} (Salón)`
                              : 'Para Llevar (Takeaway)'}
                          </strong>{' '}
                          • Pago: {order.paymentMethod}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">
                          Total del Pedido
                        </span>
                        <span className="font-display text-2xl font-black text-white">
                          ${order.total}{' '}
                          <span className="text-xs font-sans text-amber-400">$U</span>
                        </span>
                      </div>
                    </div>

                    {/* Customer Info & Navigation */}
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
                                ? `Ubicación: ${order.customer.address}`
                                : isTable
                                ? `Ubicación: Mesa #${order.tableNumber || 1} en el Local`
                                : 'Ubicación: Retiro en Mostrador'}
                            </span>
                          </div>
                          {order.customer.phone && (
                            <div className="text-stone-400">
                              Teléfono: <span className="font-mono text-stone-200">{order.customer.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {order.customer.phone && (
                            <a
                              href={`https://wa.me/${order.customer.phone.replace(
                                /[^0-9]/g,
                                ''
                              )}?text=Hola%20${encodeURIComponent(
                                order.customer.name
                              )}!%20Soy%20${encodeURIComponent(
                                currentUser.name
                              )}%20de%20Brasa%20%26%20Lúpulo,%20estoy%20en%20camino%20con%20tu%20pedido%20${
                                order.orderNumber
                              }.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {isDelivery && order.customer.address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${order.customer.address}, Tacuarembó, Uruguay`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>Ruta GPS</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {order.notes && (
                        <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          <strong>Notas del Pedido:</strong> {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 text-xs space-y-1.5">
                      <div className="font-bold text-stone-400 pb-1 border-b border-stone-800 uppercase text-[10px]">
                        Productos a Entregar:
                      </div>
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-stone-200 py-0.5">
                          <span>
                            <strong>{it.quantity}x</strong> {it.name}
                            {it.customNotes && (
                              <span className="block text-[10px] text-amber-400">
                                ({it.customNotes})
                              </span>
                            )}
                          </span>
                          <span className="font-mono">${it.price * it.quantity} $U</span>
                        </div>
                      ))}
                    </div>

                    {/* Confirmation Section: Delivery requires 4-digit code; Table/Takeaway confirms directly */}
                    {isDelivery ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-950 to-stone-900 border-2 border-amber-500/40 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-amber-400" />
                            <label className="text-xs font-bold uppercase text-white tracking-wider">
                              Código de Verificación de Entrega (4 dígitos):
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setShowDemoCodeHint((prev) => ({
                                ...prev,
                                [order.id]: !prev[order.id],
                              }))
                            }
                            className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>
                              {showDemoCodeHint[order.id]
                                ? `Código del cliente: ${expectedCode}`
                                : 'Ver código del cliente (Modo Testeo)'}
                            </span>
                          </button>
                        </div>

                        <p className="text-[11px] text-stone-400">
                          Pídele al cliente el código de 4 dígitos que le dio la página web al hacer su pedido.
                        </p>

                        {showDemoCodeHint[order.id] && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                            <span className="text-amber-200">
                              Código asignado a este pedido ({order.orderNumber}):{' '}
                              <strong className="font-mono text-base text-amber-400">
                                {expectedCode}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setVerificationInputs((prev) => ({
                                  ...prev,
                                  [order.id]: expectedCode,
                                }))
                              }
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-[11px] cursor-pointer"
                            >
                              Autocompletar {expectedCode}
                            </button>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            maxLength={10}
                            value={currentInput}
                            onChange={(e) =>
                              setVerificationInputs((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                            placeholder="Ej: 4921"
                            className="w-full sm:w-40 text-center font-mono font-black text-2xl tracking-widest px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-amber-400 focus:border-orange-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleDeliverOrder(order)}
                            disabled={loading || currentInput.trim().length < 4}
                            className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Confirmar Envío (+${rate} $U)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                        <p className="text-xs text-emerald-300 font-medium">
                          {isTable
                            ? `🍽️ Pedido en Mesa #${order.tableNumber || 1} (${order.customer.name}): No requiere código de verificación.`
                            : `🛍️ Pedido Para Llevar (${order.customer.name}): Confirmación directa en mostrador.`}
                        </p>
                        <button
                          onClick={() => handleDeliverOrder(order)}
                          disabled={loading}
                          className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {isTable
                              ? `Confirmar Entrega en Mesa #${order.tableNumber || 1} (+$${rate} $U)`
                              : `Confirmar Retiro en Local (+$${rate} $U)`}
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

        {/* TAB 3: INTERACTIVE GOOGLE MAP FOR DRIVERS */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase text-white">
                    Mapa GPS de Repartos en Tacuarembó
                  </h3>
                  <p className="text-xs text-stone-400">
                    Visualiza el local central (pin naranja) y los pedidos de delivery activos (pines ámbar).
                  </p>
                </div>
              </div>
              <InteractiveMap
                orders={orders}
                heightClass="h-80 sm:h-96"
                showOrderPins={true}
              />
            </div>
          </div>
        )}

        {/* TAB 4: DELIVERED HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-fade-in">
            {myDeliveredToday.length === 0 ? (
              <div className="text-center py-14 bg-stone-900/50 rounded-3xl border border-stone-800 text-stone-500 space-y-2">
                <Clock className="w-10 h-10 mx-auto opacity-30 text-stone-400" />
                <p className="font-bold text-white text-sm">
                  Aún no has registrado entregas hoy
                </p>
                <p className="text-xs">
                  Cada pedido que entregues sumará +${rate} $U a tu liquidación del día.
                </p>
              </div>
            ) : (
              myDeliveredToday.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400">{order.orderNumber}</span>
                      <span className="text-stone-500">•</span>
                      <span className="text-white font-semibold">{order.customer.name}</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] text-stone-300">
                        {order.type === 'delivery'
                          ? 'Delivery'
                          : order.type === 'table'
                          ? `Mesa #${order.tableNumber || 1}`
                          : 'Takeaway'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Entregado a las{' '}
                      {new Date(order.deliveredAt || order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • Total cobrado al cliente: ${order.total} $U
                    </div>
                  </div>

                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 font-black border border-emerald-500/30 shrink-0">
                    +${order.deliveryCommission || rate} $U
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

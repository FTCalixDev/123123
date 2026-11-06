import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Truck,
  Lock,
  UserPlus,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Smartphone,
  Flame,
  ChefHat,
  Bell,
  X,
  ArrowLeft,
} from 'lucide-react';
import { Employee, Order, WaiterCall } from '../types/restaurant';
import { DeliveryApp } from './DeliveryApp';
import { AdminPanel } from './AdminPanel';
import { KitchenDisplayModal } from './KitchenDisplayModal';
import { sound } from '../utils/audio';

interface StaffAppProps {
  currentUser: Employee | null;
  onLoginSuccess: (user: Employee) => void;
  onLogout: () => void;
  onBackToCustomerWeb: () => void;
  onRefreshStoreData: () => void;
}

export const StaffApp: React.FC<StaffAppProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onBackToCustomerWeb,
  onRefreshStoreData,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Internal 2-section switcher once logged in: 'delivery' (Portal del Personal) vs 'admin' (Panel de Administración)
  const [activeSection, setActiveSection] = useState<'delivery' | 'admin'>(() =>
    currentUser?.role === 'admin' ? 'admin' : 'delivery'
  );
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(
    currentUser?.role === 'admin'
  );
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKeyError, setAdminKeyError] = useState<string | null>(null);
  const [unlockingAdmin, setUnlockingAdmin] = useState(false);
  const [isKdsOpen, setIsKdsOpen] = useState(false);

  // Real-time visual & sound notifications for new orders and table waiter calls
  const [liveAlertToast, setLiveAlertToast] = useState<{
    title: string;
    subtitle: string;
    detail: string;
    type: 'order' | 'waiter';
  } | null>(null);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const knownCallIdsRef = useRef<Set<string>>(new Set());
  const initialLoadedRef = useRef(false);

  useEffect(() => {
    if (!currentUser) return;

    const checkLiveEvents = async () => {
      try {
        const [resOrders, resCalls] = await Promise.all([
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/table/call-waiter').then((r) => r.json()).catch(() => ({ calls: [] })),
        ]);

        const ordersList: Order[] = Array.isArray(resOrders.orders) ? resOrders.orders : [];
        const callsList: WaiterCall[] = Array.isArray(resCalls.calls) ? resCalls.calls : [];

        const currentOrderIds = new Set<string>(ordersList.map((o) => o.id));
        const currentCallIds = new Set<string>(callsList.map((c) => c.id));

        if (!initialLoadedRef.current) {
          knownOrderIdsRef.current = currentOrderIds;
          knownCallIdsRef.current = currentCallIds;
          initialLoadedRef.current = true;
        } else {
          // Check new orders
          const newOrders = ordersList.filter((o) => !knownOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0) {
            const latest = newOrders[0];
            sound.playChime();
            setLiveAlertToast({
              title: '¡Nuevo Pedido Entrante!',
              subtitle: `Comanda ${latest.orderNumber} (${latest.type === 'delivery' ? 'Delivery' : latest.type === 'table' ? `Mesa #${latest.tableNumber}` : 'Takeaway'})`,
              detail: `Cliente: ${latest.customer.name} · Total: $${latest.total} $U`,
              type: 'order',
            });
            setTimeout(() => setLiveAlertToast(null), 7000);
          }

          // Check new waiter calls
          const newCalls = callsList.filter(
            (c) => c.status === 'pending' && !knownCallIdsRef.current.has(c.id)
          );
          if (newCalls.length > 0) {
            const latestCall = newCalls[0];
            sound.playChime();
            setLiveAlertToast({
              title: `¡Alerta de Salón — Mesa #${latestCall.tableNumber}!`,
              subtitle: latestCall.reason,
              detail: latestCall.customerName
                ? `Solicitado por ${latestCall.customerName}`
                : 'Atención requerida en salón',
              type: 'waiter',
            });
            setTimeout(() => setLiveAlertToast(null), 7000);
          }

          knownOrderIdsRef.current = currentOrderIds;
          knownCallIdsRef.current = currentCallIds;
        }
      } catch (err) {}
    };

    checkLiveEvents();
    const interval = setInterval(checkLiveEvents, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.user) {
        sound.playChime();
        if (data.user.role === 'admin') {
          setIsAdminUnlocked(true);
          setActiveSection('admin');
        } else {
          setIsAdminUnlocked(false);
          setActiveSection('delivery');
        }
        onLoginSuccess(data.user);
      } else {
        setAuthError(data.error || 'Usuario o contraseña inválidos');
      }
    } catch (err) {
      setAuthError('Error de comunicación con el servidor POS');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          username,
          password,
          phone,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sound.playChime();
        setAuthSuccess(
          data.message ||
            'Tu solicitud de alta fue registrada con estado PENDIENTE. La gerencia revisará tu cuenta para autorizar tu ingreso.'
        );
        setFullName('');
        setUsername('');
        setPassword('');
        setPhone('');
        setAuthMode('login');
      } else {
        setAuthError(data.error || 'No se pudo procesar la solicitud');
      }
    } catch (err) {
      setAuthError('Error de red al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKeyError(null);
    setUnlockingAdmin(true);

    try {
      const res = await fetch('/api/auth/verify-admin-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKeyInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playChime();
        setIsAdminUnlocked(true);
        setAdminKeyInput('');
      } else {
        setAdminKeyError(data.error || 'Clave de autorización incorrecta.');
      }
    } catch (err) {
      setAdminKeyError('Error al verificar la clave en el servidor.');
    } finally {
      setUnlockingAdmin(false);
    }
  };

  // 1. CLOSED LOGIN & REGISTRATION SCREEN (ZERO CREDENTIAL HINTS)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between p-4">
        <div className="max-w-7xl w-full mx-auto pt-2">
          <button
            onClick={onBackToCustomerWeb}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>Volver a la Web del Local</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* App Branding */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-orange-600/30">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <div className="inline-flex items-center gap-1.5 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                <Flame className="w-3 h-3" />
                <span>Sistema POS & Logística Gastronómica</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
                Acceso Personal / Staff
              </h1>
              <p className="text-xs text-stone-400">
                Portal cerrado para Repartidores, Mozos de Salón y Administración de Brasa & Lúpulo
              </p>
            </div>

            {/* Mode Switcher: Iniciar Sesión vs Solicitar Alta de Empleado */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-950 rounded-2xl border border-stone-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`min-h-[42px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`min-h-[42px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Solicitar Alta de Empleado</span>
              </button>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs" autoComplete="off">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1.5">
                    Usuario:
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu nombre de usuario"
                    className="w-full px-3.5 py-3 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1.5">
                    Contraseña:
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-3.5 py-3 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                >
                  {loading ? 'Validando Credenciales...' : 'Ingresar al Portal'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs" autoComplete="off">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">
                    Nombre y Apellido:
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre completo del trabajador"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-stone-400 font-bold uppercase mb-1">
                      Usuario Deseado:
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Usuario"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold uppercase mb-1">
                      Contraseña:
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+598 99 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400">
                  Las nuevas cuentas de personal se registran en estado <strong className="text-amber-400">pendiente</strong> hasta ser autorizadas por la gerencia en el Panel de Administración.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {loading ? 'Enviando Solicitud...' : 'Solicitar Alta de Personal'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center text-[11px] text-stone-600 pb-2">
          Brasa & Lúpulo · Sistema POS Interno · Tacuarembó, Uruguay
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED STAFF & ADMIN PORTAL
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Live incoming order or waiter call toast with sound alert */}
      {liveAlertToast && (
        <div
          className={`fixed top-20 right-4 z-50 bg-stone-900/95 border-2 px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce max-w-sm ${
            liveAlertToast.type === 'waiter'
              ? 'border-amber-500 text-amber-200'
              : 'border-emerald-500 text-emerald-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              liveAlertToast.type === 'waiter'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div className="text-xs flex-1">
            <div className="font-bold text-white uppercase">{liveAlertToast.title}</div>
            <div className="font-semibold text-amber-300 mt-0.5">{liveAlertToast.subtitle}</div>
            <div className="text-stone-300 text-[11px] mt-0.5">{liveAlertToast.detail}</div>
          </div>
          <button
            onClick={() => setLiveAlertToast(null)}
            className="p-1 text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unified Staff App Top Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 sm:px-6 py-3 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* App Title & Active Employee Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToCustomerWeb}
              className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Volver a la vista pública de clientes"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-600/20 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-black uppercase text-white tracking-wide">
                  Portal POS · Brasa & Lúpulo
                </h1>
                <span className="text-xs font-bold text-emerald-400">
                  · {currentUser.name}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                ID: <span className="font-mono text-stone-300">{currentUser.id}</span> · Tarifa asignada:{' '}
                <strong className="text-amber-400 font-mono tabular-nums">
                  ${currentUser.commissionPerDelivery || 60} $U/entrega
                </strong>
              </p>
            </div>
          </div>

          {/* 2 Core Apartados Switcher + KDS Monitor */}
          <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
            <button
              onClick={() => setActiveSection('delivery')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'delivery'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>1. Repartos & Salón</span>
            </button>

            <button
              onClick={() => setActiveSection('admin')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'admin'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>2. Administración</span>
              {!isAdminUnlocked && <Lock className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => setIsKdsOpen(true)}
              className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold text-stone-300 hover:text-amber-400 bg-stone-900 border border-stone-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Monitor KDS de Cocina en Tiempo Real"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Monitor KDS</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: PORTAL DEL PERSONAL (REPARTIDORES Y MOZOS) */}
      {activeSection === 'delivery' && (
        <DeliveryApp
          currentUser={currentUser}
          onLogout={onLogout}
          onBackToStore={onBackToCustomerWeb}
          embeddedInStaffApp={true}
          onOpenKds={() => setIsKdsOpen(true)}
        />
      )}

      {/* SECTION 2: PANEL DE ADMINISTRACIÓN TOTAL (Backend-Verified Master Key) */}
      {activeSection === 'admin' && (
        <>
          {!isAdminUnlocked ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 mx-auto flex items-center justify-center text-orange-400">
                  <KeyRound className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-black uppercase text-white">
                    Autorización de Gerencia
                  </h2>
                  <p className="text-xs text-stone-400">
                    Este apartado requiere validación de la clave maestra de Administración en el servidor.
                  </p>
                </div>

                {adminKeyError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                    {adminKeyError}
                  </div>
                )}

                <form onSubmit={handleUnlockAdmin} className="space-y-3" autoComplete="off">
                  <input
                    type="password"
                    required
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    placeholder="Clave maestra de administrador"
                    className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-center font-mono text-base text-amber-400 focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection('delivery')}
                      className="flex-1 min-h-[44px] py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
                    >
                      Volver a Repartos
                    </button>
                    <button
                      type="submit"
                      disabled={unlockingAdmin}
                      className="flex-1 min-h-[44px] py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 cursor-pointer"
                    >
                      {unlockingAdmin ? 'Validando...' : 'Desbloquear Panel'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <AdminPanel
              currentUser={currentUser}
              onLogout={onLogout}
              onBackToStore={onBackToCustomerWeb}
              onRefreshData={onRefreshStoreData}
              embeddedInStaffApp={true}
            />
          )}
        </>
      )}

      {/* Kitchen Display Modal (KDS) - Exclusively inside Authenticated Staff/Admin Portal */}
      <KitchenDisplayModal
        isOpen={isKdsOpen}
        onClose={() => setIsKdsOpen(false)}
      />
    </div>
  );
};

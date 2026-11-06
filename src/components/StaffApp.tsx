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
} from 'lucide-react';
import { Employee, Order } from '../types/restaurant';
import { DeliveryApp } from './DeliveryApp';
import { AdminPanel } from './AdminPanel';
import { KitchenDisplayModal } from './KitchenDisplayModal';
import { sound } from '../utils/audio';

interface StaffAppProps {
  currentUser: Employee | null;
  onLoginSuccess: (user: Employee) => void;
  onLogout: () => void;
  onRefreshStoreData: () => void;
}

export const StaffApp: React.FC<StaffAppProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onRefreshStoreData,
}) => {
  // Login / Register state when not authenticated
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Internal 2-section switcher once logged in: 'delivery' (Encargados) vs 'admin' (Administradores)
  const [activeSection, setActiveSection] = useState<'delivery' | 'admin'>(() =>
    currentUser?.role === 'admin' ? 'admin' : 'delivery'
  );
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(
    currentUser?.role === 'admin'
  );
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKeyError, setAdminKeyError] = useState<string | null>(null);
  const [isKdsOpen, setIsKdsOpen] = useState(false);

  // Live incoming order toast exclusively inside the Staff & Admin Web
  const [incomingOrderToast, setIncomingOrderToast] = useState<{
    id: string;
    number: string;
    total: number;
  } | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialOrdersLoadedRef = useRef(false);

  useEffect(() => {
    const checkOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          const currentIds = new Set<string>(data.orders.map((o: Order) => o.id));
          if (!initialOrdersLoadedRef.current) {
            knownOrderIdsRef.current = currentIds;
            initialOrdersLoadedRef.current = true;
          } else {
            const newOrders = data.orders.filter(
              (o: Order) => !knownOrderIdsRef.current.has(o.id)
            );
            if (newOrders.length > 0) {
              const latest = newOrders[0];
              sound.playChime();
              setIncomingOrderToast({
                id: latest.id,
                number: latest.orderNumber,
                total: latest.total,
              });
              setTimeout(() => setIncomingOrderToast(null), 6000);
            }
            knownOrderIdsRef.current = currentIds;
          }
        }
      } catch (err) {}
    };
    checkOrders();
    const interval = setInterval(checkOrders, 5000);
    return () => clearInterval(interval);
  }, []);

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
        setAuthError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setAuthError('Error de conexión con el servidor');
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
          '¡Solicitud enviada! Tu cuenta quedó registrada como PENDIENTE. El Administrador (Calix) verá tu usuario y clave en su panel y deberá aceptarte para que puedas iniciar sesión.'
        );
        setFullName('');
        setUsername('');
        setPassword('');
        setPhone('');
        setAuthMode('login');
      } else {
        setAuthError(data.error || 'No se pudo registrar la cuenta');
      }
    } catch (err) {
      setAuthError('Error de conexión al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKeyInput.trim() === 'calixdev') {
      sound.playChime();
      setIsAdminUnlocked(true);
      setAdminKeyError(null);
      setAdminKeyInput('');
    } else {
      setAdminKeyError('Clave incorrecta. La clave maestra de administrador es "calixdev".');
    }
  };

  // 1. IF NOT LOGGED IN -> DEDICATED STAFF & ADMIN LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-44px)] bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-stone-900 border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* App Branding */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest">
              <Flame className="w-3 h-3" />
              <span>Aplicación Interna Independiente</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
              Brasa & Lúpulo Staff
            </h1>
            <p className="text-xs text-stone-400">
              Plataforma exclusiva para Encargados de Reparto, Mozos y Administración General
            </p>
          </div>

          {/* Mode Switcher: Login vs Register */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-950 rounded-2xl border border-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Solicitar Cuenta</span>
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
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 font-bold uppercase mb-1">
                  Nombre de Usuario:
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. Calix o gonzalo"
                  className="w-full px-3.5 py-3 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold uppercase mb-1">
                  Clave de Acceso:
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-3 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
              >
                {loading ? 'Verificando...' : 'Entrar a la App de Personal'}
              </button>

              {/* Quick Demo Credentials Box */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">
                  Accesos Rápidos (Cuentas Creadas):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('Calix');
                      setPassword('calixdev');
                    }}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/30 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Calix</span>
                    </div>
                    <div className="text-[10px] font-mono text-stone-400">
                      User: Calix / Clave: calixdev
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUsername('gonzalo');
                      setPassword('123');
                    }}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-emerald-500/30 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Repartidor</span>
                    </div>
                    <div className="text-[10px] font-mono text-stone-400">
                      User: gonzalo / Clave: 123
                    </div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-400 font-bold uppercase mb-1">
                  Nombre y Apellido:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Martín Rodríguez"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">
                    Usuario:
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="martin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">
                    Clave:
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu clave"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold uppercase mb-1">
                  Teléfono / WhatsApp:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+598 99 111 222"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                🔒 <strong>Seguridad:</strong> Tu cuenta no se activará hasta que el Administrador (Calix) revise tu usuario y clave en su panel y la apruebe.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud de Alta'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. LOGGED IN -> STANDALONE STAFF & ADMIN APP WITH 2 APARTADOS
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Live incoming order toast with sound alert for Staff & Admin */}
      {incomingOrderToast && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900/95 border-2 border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white uppercase flex items-center gap-1.5">
              <span>¡Nuevo Pedido Entrante!</span>
              <span className="font-mono text-emerald-400">
                {incomingOrderToast.number}
              </span>
            </div>
            <div className="text-stone-300 text-[11px]">
              Total: ${incomingOrderToast.total} $U • Disponible para tomar
            </div>
          </div>
          <button
            onClick={() => setIncomingOrderToast(null)}
            className="p-1 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unified Staff App Top Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 sm:px-6 py-3 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* App Title & Active Employee Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-600/20 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-black uppercase text-white tracking-wide">
                  App Interna • Brasa & Lúpulo
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {currentUser.name}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                ID: <span className="font-mono text-stone-300">{currentUser.id}</span> • Tarifa asignada: <strong className="text-amber-400">${currentUser.commissionPerDelivery || 60} $U/entrega</strong>
              </p>
            </div>
          </div>

          {/* 2 Core Apartados Switcher: (1) Encargados de Llevar Comida vs (2) Administradores */}
          <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
            <button
              onClick={() => setActiveSection('delivery')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'delivery'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>1. Encargados / Reparto</span>
            </button>

            <button
              onClick={() => setActiveSection('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'admin'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>2. Administradores</span>
              {!isAdminUnlocked && <Lock className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => setIsKdsOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-stone-300 hover:text-amber-400 bg-stone-900 border border-stone-800 flex items-center gap-1.5 cursor-pointer"
              title="Monitor de Cocina KDS"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Monitor Cocina</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: ENCARGADOS DE LLEVAR LA COMIDA / REPARTIDORES */}
      {activeSection === 'delivery' && (
        <DeliveryApp
          currentUser={currentUser}
          onLogout={onLogout}
          onBackToStore={() => {}}
          embeddedInStaffApp={true}
        />
      )}

      {/* SECTION 2: ADMINISTRADORES (Protected by Clave "calixdev") */}
      {activeSection === 'admin' && (
        <>
          {!isAdminUnlocked ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-stone-900 border-2 border-orange-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 mx-auto flex items-center justify-center text-orange-400">
                  <KeyRound className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-black uppercase text-white">
                    Apartado de Administrador
                  </h2>
                  <p className="text-xs text-stone-400">
                    Para entrar a la configuración total del restaurante y control de sueldos, ingresa la clave maestra (<span className="font-mono text-amber-400 font-bold">calixdev</span>).
                  </p>
                </div>

                {adminKeyError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                    {adminKeyError}
                  </div>
                )}

                <form onSubmit={handleUnlockAdmin} className="space-y-3">
                  <input
                    type="password"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    placeholder="Ingresa la clave (calixdev)"
                    className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-center font-mono text-base text-amber-400 focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection('delivery')}
                      className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
                    >
                      Ir a Repartos
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 cursor-pointer"
                    >
                      Desbloquear Panel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <AdminPanel
              currentUser={currentUser}
              onLogout={onLogout}
              onBackToStore={() => {}}
              onRefreshData={onRefreshStoreData}
              embeddedInStaffApp={true}
            />
          )}
        </>
      )}

      {/* Kitchen Display Modal */}
      <KitchenDisplayModal
        isOpen={isKdsOpen}
        onClose={() => setIsKdsOpen(false)}
      />
    </div>
  );
};

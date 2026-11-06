import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShoppingBag,
  Beer,
  Volume2,
  VolumeX,
  Clock,
  Menu,
  X,
  Sparkles,
  QrCode,
  KeyRound,
  Lock,
  Bell,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { Order } from '../types/restaurant';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenSommelier: () => void;
  currentTable: number | null;
  onSelectTable: (table: number | null) => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenStaffPortal: () => void;
  activeCustomerOrder: Order | null;
  onOpenOrderTracker: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenSommelier,
  currentTable,
  onSelectTable,
  currentPath,
  onNavigate,
  onOpenStaffPortal,
  activeCustomerOrder,
  onOpenOrderTracker,
}) => {
  const [isAmbienceOn, setIsAmbienceOn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('Happy Hour hoy 19:30 hs');
  const [waiterNotified, setWaiterNotified] = useState(false);

  const toggleSound = () => {
    const active = sound.toggleAmbience();
    setIsAmbienceOn(active);
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 19 && currentHour < 22) {
        setTimeRemaining('¡En Happy Hour ahora! ($150)');
      } else {
        setTimeRemaining('Happy Hour hoy 19:30 hs');
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickCallWaiter = async () => {
    if (!currentTable) return;
    try {
      await fetch('/api/table/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: currentTable,
          reason: 'Llamado al Mozo',
        }),
      });
      sound.playChime();
      setWaiterNotified(true);
      setTimeout(() => setWaiterNotified(false), 4000);
    } catch (e) {}
  };

  return (
    <>
      {/* Top Status & Utility Bar */}
      <div className="bg-gradient-to-r from-stone-950 via-zinc-900 to-stone-950 border-b border-stone-800/80 px-4 py-2 text-xs text-stone-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-200">
              Abierto hoy 19:30 a 01:30 hs
            </span>
            <span className="text-stone-600 hidden sm:inline">·</span>
            <span className="text-amber-400 font-medium hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Table selector indicator for customers dining in */}
            <div className="flex items-center gap-1 text-[11px] bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-lg">
              <QrCode className="w-3 h-3 text-orange-400" />
              <span className="text-stone-400 hidden sm:inline">Modalidad:</span>
              <select
                value={currentTable ?? ''}
                onChange={(e) =>
                  onSelectTable(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="bg-transparent text-stone-200 font-semibold focus:outline-none cursor-pointer text-[11px]"
              >
                <option value="" className="bg-stone-900 text-stone-200">
                  Delivery / Para Llevar
                </option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => (
                  <option key={num} value={num} className="bg-stone-900 text-stone-200">
                    Mesa #{num} (Salón/Patio)
                  </option>
                ))}
              </select>
            </div>

            {currentTable && (
              <button
                onClick={handleQuickCallWaiter}
                className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Bell className="w-3 h-3 text-amber-400" />
                <span>{waiterNotified ? '¡Mozo en camino!' : `Llamar Mozo (#${currentTable})`}</span>
              </button>
            )}

            {/* Fire ambience toggle */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                isAmbienceOn
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
              title="Sonido ambiente de brasas y plancha"
            >
              {isAmbienceOn ? (
                <Volume2 className="w-3 h-3 text-orange-400" />
              ) : (
                <VolumeX className="w-3 h-3" />
              )}
              <span className="hidden md:inline">
                Ambiente {isAmbienceOn ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Discrete Staff Login Button (Closed Authentication Only) */}
            <button
              onClick={onOpenStaffPortal}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Acceso cerrado exclusivo para personal y administración"
            >
              <Lock className="w-3 h-3 text-stone-500" />
              <span>Acceso Personal / Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Customer Header */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 sm:gap-3 group text-left min-w-0 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 p-[1.5px] shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              </div>
            </div>
            <span className="font-display text-lg sm:text-2xl font-bold tracking-wider text-white uppercase leading-none whitespace-nowrap">
              Brasa <span className="text-orange-500">&</span> Lúpulo
            </span>
          </button>

          {/* Navigation Links - Customer Subpages */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-stone-300">
            <button
              onClick={() => onNavigate('/')}
              className={`hover:text-orange-400 transition-colors py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                currentPath === '/'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => onNavigate('/menu')}
              className={`hover:text-orange-400 transition-colors py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                currentPath === '/menu'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Carta Completa
            </button>
            <button
              onClick={() => onNavigate('/promos')}
              className={`hover:text-orange-400 transition-colors py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                currentPath === '/promos'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Promociones
            </button>
            <button
              onClick={() => onNavigate('/canillas')}
              className={`hover:text-orange-400 transition-colors py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                currentPath === '/canillas'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Canillas
            </button>
            <button
              onClick={() => onNavigate('/armar-burger')}
              className={`hover:text-amber-400 text-amber-300 transition-colors py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                currentPath === '/armar-burger'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Laboratorio Smash
            </button>
            <button
              onClick={() => onNavigate('/reservas')}
              className={`hover:text-orange-400 transition-colors py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                currentPath === '/reservas'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Reservas
            </button>
          </nav>

          {/* Customer Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Active Order & Secret Verification PIN Button for Customer */}
            {activeCustomerOrder && (
              <button
                onClick={onOpenOrderTracker}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                title="Ver estado de tu pedido y tu código PIN de 4 dígitos"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                {activeCustomerOrder.type !== 'table' ? (
                  <>
                    <span className="hidden md:inline">PIN Entrega:</span>
                    <span className="font-mono font-black text-amber-400 tabular-nums">
                      {activeCustomerOrder.verificationCode || '4921'}
                    </span>
                  </>
                ) : (
                  <span>Mesa #{activeCustomerOrder.tableNumber || 1}</span>
                )}
              </button>
            )}

            {/* AI Sommelier button */}
            <button
              onClick={onOpenSommelier}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer whitespace-nowrap"
              title="Recomendador de maridaje con Inteligencia Artificial"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Sommelier IA</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/25 transition-all active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-orange-600 font-black text-[11px] flex items-center justify-center shadow tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Customer Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-stone-950 border-b border-stone-800 px-4 py-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-stone-300">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/');
                }}
                className={`p-2.5 rounded-xl text-left transition-colors ${
                  currentPath === '/'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-900/60 hover:bg-stone-800'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/menu');
                }}
                className={`p-2.5 rounded-xl text-left transition-colors ${
                  currentPath === '/menu'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-900/60 hover:bg-stone-800'
                }`}
              >
                Carta Completa
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/promos');
                }}
                className={`p-2.5 rounded-xl text-left transition-colors ${
                  currentPath === '/promos'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-900/60 hover:bg-stone-800'
                }`}
              >
                Promociones
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/canillas');
                }}
                className={`p-2.5 rounded-xl text-left flex items-center gap-1.5 transition-colors ${
                  currentPath === '/canillas'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-900/60 hover:bg-stone-800'
                }`}
              >
                <Beer className="w-3.5 h-3.5 text-amber-400" />
                <span>Canillas (8)</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/armar-burger');
                }}
                className={`p-2.5 rounded-xl text-left transition-colors ${
                  currentPath === '/armar-burger'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                Laboratorio Smash
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/reservas');
                }}
                className={`p-2.5 rounded-xl text-left transition-colors ${
                  currentPath === '/reservas'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-900/60 hover:bg-stone-800'
                }`}
              >
                Reservar Mesa
              </button>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex justify-end">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStaffPortal();
                }}
                className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Acceso Personal / Staff</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

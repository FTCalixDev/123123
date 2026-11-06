import React, { useState } from 'react';
import {
  X, ShieldCheck, User, Lock, Phone, ArrowRight,
  Sparkles, AlertCircle, CheckCircle2, KeyRound
} from 'lucide-react';
import { Employee } from '../types/restaurant';
import { sound } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Employee) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        sound.playChime();
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, phone }),
      });

      const data = await res.json();
      if (res.ok) {
        sound.playChime();
        setSuccessMsg(data.message || 'Cuenta creada. Espera la aprobación del administrador.');
        setMode('login');
      } else {
        setErrorMsg(data.error || 'No se pudo crear la cuenta');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-950/80 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 p-[1.5px] mx-auto shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center text-orange-500">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-black uppercase text-white tracking-wide">
            {mode === 'login' ? 'Acceso al Personal' : 'Registro de Repartidor / Mozo'}
          </h2>
          <p className="text-xs text-stone-400">
            {mode === 'login'
              ? 'Ingresá con tu usuario para gestionar pedidos y entregas'
              : 'Completá tus datos para solicitar una cuenta en Brasa & Lúpulo'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-orange-600 text-white shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-orange-600 text-white shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Solicitar Cuenta
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white placeholder-stone-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white placeholder-stone-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{isLoading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Martín Rodríguez"
                className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Nombre de Usuario *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Para iniciar sesión (ej. martin22)"
                className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Creá una clave segura"
                className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+598 99 000 000"
                className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-stone-500 leading-tight">
              Al registrarte, tu cuenta quedará en espera hasta que la Administración del local la autorice.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all"
            >
              {isLoading ? 'Registrando...' : 'Solicitar Acceso ➔'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

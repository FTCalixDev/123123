import React, { useState } from 'react';
import { QrCode, Bell, Check, Sparkles, AlertCircle, Utensils, Receipt } from 'lucide-react';
import { sound } from '../utils/audio';

interface TableQRSectionProps {
  currentTable: number | null;
  onSelectTable: (table: number | null) => void;
}

export const TableQRSection: React.FC<TableQRSectionProps> = ({
  currentTable,
  onSelectTable,
}) => {
  const [activeTable, setActiveTable] = useState<number>(currentTable || 4);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCalledMsg, setWaiterCalledMsg] = useState<string | null>(null);

  const handleCallWaiter = async (reason: string) => {
    sound.playChime();
    setCallingWaiter(true);
    setWaiterCalledMsg(null);

    try {
      const res = await fetch('/api/table/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: activeTable, reason }),
      });
      const data = await res.json();
      setWaiterCalledMsg(data.message || `Mozo notificado para Mesa ${activeTable}`);
    } catch (e) {
      setWaiterCalledMsg(`¡Mozo notificado para la Mesa ${activeTable}! En instantes se acerca.`);
    } finally {
      setCallingWaiter(false);
    }
  };

  return (
    <section id="qr-mesa" className="py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Explanation (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">
                <QrCode className="w-3.5 h-3.5" />
                <span>Servicio Digital sin Esperas</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight leading-tight">
                Pedí Desde Tu Mesa Con <span className="text-orange-500">Código QR</span>
              </h2>
            </div>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              En cada mesa de nuestro salón y patio cervecero encontrás un soporte con código QR.
              Al escanearlo, abrís la carta completa en tu celular, agregás lo que querés y tu pedido marcha directo a la plancha de hierro y al horno de barro.
            </p>

            {/* Interactive Table Picker Simulator */}
            <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
              <label className="text-xs font-bold uppercase text-stone-400 tracking-wider flex items-center justify-between">
                <span>Simular que estás sentado en:</span>
                <span className="text-orange-400 font-bold">Mesa #{activeTable} Seleccionada</span>
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setActiveTable(num);
                      onSelectTable(num);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      activeTable === num
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/30'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-white'
                    }`}
                  >
                    M#{num}
                  </button>
                ))}
              </div>

              {/* Call Waiter Buttons */}
              <div className="pt-3 border-t border-stone-800 flex flex-wrap gap-2">
                <button
                  onClick={() => handleCallWaiter('Atención / Consulta de Menú')}
                  disabled={callingWaiter}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Llamar al Mozo</span>
                </button>

                <button
                  onClick={() => handleCallWaiter('Pedir la Cuenta')}
                  disabled={callingWaiter}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Pedir la Cuenta</span>
                </button>
              </div>

              {waiterCalledMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{waiterCalledMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Stand Mockup (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-72 p-6 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/60 shadow-2xl text-center space-y-4 animate-flame">
              {/* Stand Header */}
              <div>
                <div className="font-display text-xl font-black text-amber-400 uppercase tracking-wider">
                  Brasa & Lúpulo
                </div>
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                  Mesa #{activeTable} • Salón & Patio
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-2xl shadow-inner mx-auto w-48 h-48 flex items-center justify-center">
                <svg width="150" height="150" viewBox="0 0 100 100" fill="#0c0a09">
                  <rect x="8" y="8" width="26" height="26" fill="none" stroke="#0c0a09" strokeWidth="6" />
                  <rect x="15" y="15" width="12" height="12" />
                  <rect x="66" y="8" width="26" height="26" fill="none" stroke="#0c0a09" strokeWidth="6" />
                  <rect x="73" y="15" width="12" height="12" />
                  <rect x="8" y="66" width="26" height="26" fill="none" stroke="#0c0a09" strokeWidth="6" />
                  <rect x="15" y="73" width="12" height="12" />
                  <rect x="42" y="10" width="8" height="8" />
                  <rect x="42" y="24" width="8" height="16" />
                  <rect x="54" y="16" width="6" height="12" />
                  <rect x="10" y="44" width="14" height="8" />
                  <rect x="30" y="44" width="22" height="8" />
                  <rect x="60" y="42" width="10" height="14" />
                  <rect x="78" y="44" width="14" height="8" />
                  <rect x="42" y="60" width="14" height="12" />
                  <rect x="64" y="64" width="12" height="8" />
                  <rect x="82" y="60" width="10" height="18" />
                  <rect x="44" y="80" width="18" height="12" />
                  <rect x="68" y="82" width="16" height="10" />
                </svg>
              </div>

              <div className="text-xs font-black uppercase text-white tracking-wider">
                Escaneá • Mirá • Pedí
              </div>
              <p className="text-[11px] text-stone-400">
                Tu pedido llega con número de comanda sin levantarte del asiento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

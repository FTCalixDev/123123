import React, { useState } from 'react';
import { Beer, Droplets, Thermometer, Sparkles, Plus, ShoppingBag, Check } from 'lucide-react';
import { TapBeer } from '../types/restaurant';
import { sound } from '../utils/audio';

interface TaproomVisualizerProps {
  taps: TapBeer[];
  onOrderBeer: (item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }) => void;
  onPourTap?: (tapId: string) => void;
}

export const TaproomVisualizer: React.FC<TaproomVisualizerProps> = ({
  taps,
  onOrderBeer,
  onPourTap,
}) => {
  const [pouringTapId, setPouringTapId] = useState<string | null>(null);

  const handlePour = async (tap: TapBeer) => {
    sound.playPour();
    setPouringTapId(tap.id);

    try {
      await fetch(`/api/taps/${tap.id}/pour`, { method: 'POST' });
      if (onPourTap) onPourTap(tap.id);
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setPouringTapId(null);
    }, 1200);
  };

  return (
    <section id="canillas" className="py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
              <Beer className="w-3.5 h-3.5" />
              <span>Taproom & Pizarra Digital en Vivo</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              8 Canillas de <span className="text-amber-400">Cerveza Artesanal</span>
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-stone-400 max-w-md">
            Barriles frescos pinchados y servidos a temperatura de cámara (-2.8°C). Podés pedir pintas para el salón o recargar tu botellón growler.
          </div>
        </div>

        {/* Taps Grid (8 taps) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {taps.map((tap) => {
            const isPouring = pouringTapId === tap.id;
            const isLowKeg = tap.kegPercentage <= 30;

            return (
              <div
                key={tap.id}
                className="group relative bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Badge & Tap Number */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-display font-black text-sm flex items-center justify-center">
                        #{tap.tapNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Canilla Rotativa
                      </span>
                    </div>

                    {isLowKeg ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 animate-pulse">
                        Últimas Pintas
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                        Barril Fresco
                      </span>
                    )}
                  </div>

                  {/* Beer Name & Style */}
                  <h3 className="font-display text-xl font-bold text-white group-hover:text-amber-300 transition-colors uppercase leading-snug">
                    {tap.name}
                  </h3>
                  <p className="text-xs text-amber-500/90 font-semibold mb-3">
                    {tap.style} • {tap.brewery}
                  </p>

                  {/* Visual Keg Level Fluid Gauge */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-400 font-medium">Nivel de Barril:</span>
                      <span className={`font-mono font-bold ${isLowKeg ? 'text-rose-400' : 'text-amber-400'}`}>
                        {tap.kegPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden p-0.5 border border-stone-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLowKeg
                            ? 'bg-rose-500'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                        style={{ width: `${tap.kegPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Technical Specs: ABV, IBU, Temp */}
                  <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 rounded-xl bg-stone-950 border border-stone-800/80 text-center mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-500">Graduación</div>
                      <div className="text-xs font-mono font-bold text-white">{tap.abv}% <span className="text-[10px] text-stone-400">ABV</span></div>
                    </div>
                    <div className="border-x border-stone-800/80">
                      <div className="text-[10px] uppercase font-bold text-stone-500">Amargor</div>
                      <div className="text-xs font-mono font-bold text-amber-400">{tap.ibu} <span className="text-[10px] text-stone-400">IBU</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-500">Servido</div>
                      <div className="text-xs font-mono font-bold text-stone-300">{tap.temperature}</div>
                    </div>
                  </div>

                  {/* Tasting Notes */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tap.tastingNotes.map((note) => (
                      <span
                        key={note}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800/80 text-stone-300 border border-stone-700/60"
                      >
                        {note}
                      </span>
                    ))}
                  </div>

                  {/* Food Pairing note */}
                  <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-stone-300 mb-4">
                    <span className="font-bold text-amber-400">Maridaje ideal: </span>
                    <span>{tap.foodPairing}</span>
                  </div>
                </div>

                {/* Interactive Pour & Order Buttons */}
                <div className="space-y-2 pt-3 border-t border-stone-800">
                  {/* Interactive Pour Simulator */}
                  <button
                    onClick={() => handlePour(tap)}
                    disabled={isPouring}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isPouring
                        ? 'bg-amber-500 text-stone-950 border-amber-400 scale-95'
                        : 'bg-stone-950 text-amber-400 hover:bg-stone-800 border-amber-500/30'
                    }`}
                  >
                    <Droplets className={`w-3.5 h-3.5 ${isPouring ? 'animate-bounce' : ''}`} />
                    <span>{isPouring ? '¡Tirando pinta helada...!' : 'Simular Tirada de Grifo 🍺'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        sound.playChime();
                        onOrderBeer({
                          id: `${tap.id}-pinta`,
                          name: `Pinta ${tap.name}`,
                          price: tap.pricePinta,
                          quantity: 1,
                          category: 'bebidas',
                        });
                      }}
                      className="py-2.5 px-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pinta ${tap.pricePinta}</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playChime();
                        onOrderBeer({
                          id: `${tap.id}-growler`,
                          name: `Growler (1.9L) ${tap.name}`,
                          price: tap.priceGrowler,
                          quantity: 1,
                          category: 'bebidas',
                        });
                      }}
                      className="py-2.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 transition-colors flex items-center justify-center gap-1"
                      title="Botellón recargable de 1.9 litros para llevar a casa"
                    >
                      <span>Growler ${tap.priceGrowler}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

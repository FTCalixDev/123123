import React from 'react';
import { Beer, Plus, ShoppingBag, Thermometer } from 'lucide-react';
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
}

export const TaproomVisualizer: React.FC<TaproomVisualizerProps> = ({
  taps,
  onOrderBeer,
}) => {
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
            Nivel de barril conectado en tiempo real desde nuestra cámara de frío (-2.8°C). Pedí tu pinta tirada para la mesa o recargá tu botellón growler.
          </div>
        </div>

        {/* Taps Grid (8 taps) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {taps.map((tap) => {
            const isLowKeg = tap.kegPercentage <= 30;
            const isEmpty = tap.kegPercentage <= 0;

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
                        Canilla #{tap.tapNumber}
                      </span>
                    </div>

                    {isEmpty ? (
                      <span className="text-[11px] font-semibold text-stone-500">
                        Cambiando Barril
                      </span>
                    ) : isLowKeg ? (
                      <span className="text-[11px] font-semibold text-rose-400">
                        Últimas Pintas
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Barril Conectado
                      </span>
                    )}
                  </div>

                  {/* Beer Name & Style */}
                  <h3 className="font-display text-xl font-bold text-white group-hover:text-amber-300 transition-colors uppercase leading-snug">
                    {tap.name}
                  </h3>
                  <p className="text-xs text-amber-500/90 font-semibold mb-3">
                    {tap.style} · {tap.brewery}
                  </p>

                  {/* Live Keg Level Fluid Gauge */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-400 font-medium">Nivel de Barril en Vivo:</span>
                      <span className={`font-mono tabular-nums font-bold ${isLowKeg ? 'text-rose-400' : 'text-amber-400'}`}>
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
                      <div className="text-xs font-mono tabular-nums font-bold text-white">
                        {tap.abv}% <span className="text-[10px] text-stone-400">ABV</span>
                      </div>
                    </div>
                    <div className="border-x border-stone-800/80">
                      <div className="text-[10px] uppercase font-bold text-stone-500">Amargor</div>
                      <div className="text-xs font-mono tabular-nums font-bold text-amber-400">
                        {tap.ibu} <span className="text-[10px] text-stone-400">IBU</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-500">Cámara</div>
                      <div className="text-xs font-mono tabular-nums font-bold text-stone-300 flex items-center justify-center gap-0.5">
                        <Thermometer className="w-3 h-3 text-sky-400" />
                        <span>{tap.temperature}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tasting Notes (clean unboxed metadata with separators) */}
                  <div className="text-[11px] text-stone-400 mb-3">
                    {tap.tastingNotes.join(' · ')}
                  </div>

                  {/* Food Pairing note */}
                  <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-stone-300 mb-4">
                    <span className="font-bold text-amber-400">Maridaje ideal: </span>
                    <span>{tap.foodPairing}</span>
                  </div>
                </div>

                {/* Real Customer Order Buttons (No Simulation Button) */}
                <div className="space-y-2 pt-3 border-t border-stone-800">
                  <button
                    disabled={isEmpty}
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
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Pedir Pinta (${tap.pricePinta} $U)</span>
                  </button>

                  <button
                    disabled={isEmpty}
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
                    className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 font-semibold text-xs border border-stone-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Botellón recargable de 1.9 litros para llevar"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recargar Growler 1.9L (${tap.priceGrowler} $U)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

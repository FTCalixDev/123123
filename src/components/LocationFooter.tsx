import React from 'react';
import { MapPin, Clock, Truck, CreditCard, Phone, Instagram } from 'lucide-react';
import { InteractiveMap } from './InteractiveMap';

export const LocationFooter: React.FC = () => {
  return (
    <>
      <section id="contacto" className="py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Info Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500 block mb-2">
                  Dónde Encontrarnos
                </span>
                <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
                  Ubicación & <span className="text-orange-500">Horarios</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 mt-2">
                  Te esperamos en el corazón de Tacuarembó para compartir la mejor mesa cervecera.
                </p>
              </div>

              {/* Specs list */}
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm font-bold">Dirección en Tacuarembó</strong>
                    <span className="text-stone-400">18 de Julio 245 esq. 25 de Mayo, Tacuarembó, Uruguay.</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-start gap-3.5">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm font-bold">Horarios de Cocina y Barra</strong>
                    <div className="text-stone-400 mt-0.5">
                      <div>Martes a Jueves: 19:30 a 00:30 hs</div>
                      <div>Viernes a Domingo: 19:30 a 02:00 hs (Lunes cerrado por descanso)</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-start gap-3.5">
                  <Truck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm font-bold">Envíos a Domicilio (Delivery)</strong>
                    <span className="text-stone-400">Pedidos web y por WhatsApp a todo Tacuarembó (Costo de envío $60 $U).</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-start gap-3.5">
                  <CreditCard className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm font-bold">Medios de Pago</strong>
                    <span className="text-stone-400">Efectivo, Transferencia Prex / BROU, Tarjetas de Débito y Crédito con POS.</span>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="https://wa.me/59899887766"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp: +598 99 887 766</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-rose-400" />
                  <span>@brasaylupulo.uy</span>
                </a>
              </div>
            </div>

            {/* Interactive Google Map (7 cols) */}
            <div className="lg:col-span-7">
              <InteractiveMap heightClass="h-[420px]" showOrderPins={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Action Button */}
      <a
        href="https://wa.me/59899887766?text=Hola%20Brasa%20%26%20L%C3%BApulo!%20Quiero%20hacer%20un%20pedido%20o%20consulta"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 animate-ring"
      >
        <Phone className="w-4 h-4 fill-stone-950" />
        <span>WhatsApp Pedidos ➔</span>
      </a>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-10 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="font-display font-bold text-white uppercase text-sm tracking-wider">
              Brasa & Lúpulo
            </span>
            <span>•</span>
            <span>Tacuarembó, Uruguay</span>
          </div>

          <p className="text-stone-400 max-w-md mx-auto text-[11px] leading-relaxed">
            Smash burgers hechas a mano, masas de fermentación natural al horno de leña y cervezas artesanales tiradas al instante.
          </p>

          {/* CalixDev Original Author Credit */}
          <div className="pt-2">
            <div className="inline-block px-4 py-2 rounded-full bg-stone-900 border border-stone-800 text-[11px] text-stone-300">
              Desarrollado y optimizado por <strong className="text-sky-400 font-bold">CalixDev</strong> • Landing Page Pro Ultra
            </div>
          </div>

          <div className="text-[10px] text-stone-600">
            © 2026 Brasa & Lúpulo. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  );
};

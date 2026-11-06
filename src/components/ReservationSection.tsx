import React, { useState } from 'react';
import {
  Calendar, Users, Clock, Sparkles, MapPin, CheckCircle2,
  ArrowRight, ShieldCheck, Check, Heart
} from 'lucide-react';
import { sound } from '../utils/audio';

export const ReservationSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('2026-11-06');
  const [time, setTime] = useState('21:00');
  const [guests, setGuests] = useState('4');
  const [zone, setZone] = useState('Patio Cervecero');
  const [occasion, setOccasion] = useState('Amigos / Festejo');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedRes, setConfirmedRes] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    sound.playChime();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          date,
          time,
          guests,
          zone,
          occasion,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reservation) {
        setConfirmedRes(data.reservation);
      }
    } catch (err) {
      console.error(err);
      // Fallback local simulation
      setConfirmedRes({
        resNumber: `#RES-${Math.floor(100 + Math.random() * 900)}`,
        name,
        date,
        time,
        guests,
        zone,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reservas" className="py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Viernes, Sábados & Festejos</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Reservar <span className="text-amber-400">Tu Mesa</span>
            </h2>
          </div>
          <p className="text-stone-400 text-xs sm:text-sm max-w-md">
            Asegurá tu lugar en el salón o en el patio cervecero sin demoras. Recibí confirmación inmediata en pantalla y por WhatsApp.
          </p>
        </div>

        {/* Split Grid: Form (7 cols) + Quick Whatsapp Cards (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Reservation Booking Form */}
          <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {confirmedRes ? (
              <div className="text-center py-8 space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-white uppercase">
                    ¡Mesa Reservada con Éxito!
                  </h3>
                  <p className="text-stone-400 text-xs mt-1">
                    Código de Reserva: <strong className="text-amber-400">{confirmedRes.resNumber}</strong>
                  </p>
                </div>

                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 max-w-md mx-auto text-left text-xs space-y-1.5 text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Titular:</span>
                    <strong className="text-white">{confirmedRes.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Fecha y Hora:</span>
                    <strong className="text-white">{confirmedRes.date} a las {confirmedRes.time} hs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Personas:</span>
                    <strong className="text-white">{confirmedRes.guests} comensales</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Zona Asignada:</span>
                    <strong className="text-amber-400">{confirmedRes.zone}</strong>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/59899887766?text=Hola%20Brasa%20%26%20L%C3%BApulo!%20Tengo%20la%20reserva%20${confirmedRes.resNumber}%20a%20nombre%20de%20${encodeURIComponent(confirmedRes.name)}%20para%20el%20${confirmedRes.date}%20a%20las%20${confirmedRes.time}%20hs.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all"
                  >
                    Confirmar por WhatsApp ➔
                  </a>
                  <button
                    onClick={() => setConfirmedRes(null)}
                    className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-all"
                  >
                    Nueva Reserva
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Lucas Pereira"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. +598 99 123 456"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                      Horario
                    </label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      {['19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'].map((h) => (
                        <option key={h} value={h} className="bg-stone-900 text-white">{h} hs</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                      Personas
                    </label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      {['1', '2', '3', '4', '5', '6', '8', '10', '12+'].map((g) => (
                        <option key={g} value={g} className="bg-stone-900 text-white">{g} personas</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                      Zona Preferida
                    </label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Patio Cervecero">Patio Cervecero (Aire libre / Luces)</option>
                      <option value="Cerca del Horno de Barro">Cerca del Horno de Barro (Cálido)</option>
                      <option value="Barra de Canillas">Barra de Canillas</option>
                      <option value="Salón Principal">Salón Principal Rústico</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                      Ocasión
                    </label>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Cena Casual">Cena Casual</option>
                      <option value="Cumpleaños / Festejo">Cumpleaños / Festejo</option>
                      <option value="Reunión de Amigos">Reunión de Amigos</option>
                      <option value="Cena Romántica">Cena Romántica / Pareja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                    Comentarios o Pedidos Especiales (Opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Cerca de una ventana, silleta para niños, etc."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-98"
                >
                  {isSubmitting ? 'Confirmando Reserva...' : 'Confirmar Reserva de Mesa ➔'}
                </button>
              </form>
            )}
          </div>

          {/* Quick 1-Click WhatsApp Reservation Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              O Reservá al Instante por WhatsApp:
            </h3>

            {[
              {
                title: 'Mesa para 2 Personas',
                desc: 'Salón interior o barra cervecera',
                msg: 'Hola Brasa & Lúpulo! Quiero reservar una mesa para 2 personas.',
              },
              {
                title: 'Mesa para 3 a 4 Personas',
                desc: 'Salón principal o patio exterior con luces',
                msg: 'Hola Brasa & Lúpulo! Quiero reservar una mesa para 4 personas.',
              },
              {
                title: 'Mesa para 5 a 6 Personas',
                desc: 'Mesas amplias junto al horno de barro',
                msg: 'Hola Brasa & Lúpulo! Quiero reservar una mesa para 6 personas.',
              },
              {
                title: 'Grupos o Cumpleaños (+7 pers)',
                desc: 'Promociones especiales en pintas y pizzas',
                msg: 'Hola Brasa & Lúpulo! Quiero consultar por reserva para un grupo o festejo de cumpleaños.',
              },
            ].map((card, i) => (
              <a
                key={i}
                href={`https://wa.me/59899887766?text=${encodeURIComponent(card.msg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-orange-500/50 hover:bg-stone-850 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                    {card.title}
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="text-xs text-stone-400 mt-1">{card.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

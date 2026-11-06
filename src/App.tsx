/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroPromos } from './components/HeroPromos';
import { SpecialtiesCarousel } from './components/SpecialtiesCarousel';
import { BurgerBuilder } from './components/BurgerBuilder';
import { TaproomVisualizer } from './components/TaproomVisualizer';
import { DigitalMenu } from './components/DigitalMenu';
import { ReservationSection } from './components/ReservationSection';
import { ReviewsSection } from './components/ReviewsSection';
import { LocationFooter } from './components/LocationFooter';

import { CartDrawer } from './components/CartDrawer';
import { AiSommelierModal } from './components/AiSommelierModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { StaffApp } from './components/StaffApp';

import {
  MenuItem,
  TapBeer,
  Promo,
  CartItem,
  Order,
  Review,
  Employee,
  RestaurantSettings,
} from './types/restaurant';
import { sound } from './utils/audio';
import {
  Globe,
  Utensils,
  Beer,
  Sparkles,
  Calendar,
  ArrowRight,
  Flame,
  ChevronRight,
  KeyRound,
  Eye,
} from 'lucide-react';

function isStaffRoute(pathname: string, search: string): boolean {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  return (
    clean === '/staff' ||
    clean === '/app' ||
    clean === '/empleados' ||
    clean === '/personal' ||
    clean === '/repartos' ||
    clean === '/admin' ||
    params.get('app') === 'staff' ||
    params.get('mode') === 'staff'
  );
}

export default function App() {
  // Determine whether the browser is on the Independent Staff/Admin Web (/staff) or the Public Customer Web (/)
  const [isStaffWeb, setIsStaffWeb] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isStaffRoute(window.location.pathname, window.location.search);
    }
    return false;
  });

  // Customer Subpage Routing ('/', '/menu', '/promos', '/canillas', '/armar-burger', '/reservas')
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (['/menu', '/promos', '/canillas', '/armar-burger', '/reservas'].includes(p)) {
        return p;
      }
    }
    return '/';
  });

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // Google Maps Platform Demo Key Quota Warning Banner State
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Secret keyboard sequence ("calixdev") so the owner can also jump to /staff inside an iframe without any visible button
  useEffect(() => {
    let buffer = '';
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      buffer = (buffer + e.key.toLowerCase()).slice(-8);
      if (buffer === 'calixdev') {
        buffer = '';
        window.history.pushState({}, '', '/staff');
        setIsStaffWeb(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Application Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [taps, setTaps] = useState<TapBeer[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurantName: 'Brasa & Lúpulo',
    tagline: 'Smash Burgers • Horno de Barro • Birra Artesanal',
    address: '18 de Julio 245 esq. 25 de Mayo, Tacuarembó, Uruguay',
    phone: '+598 99 887 766',
    whatsapp: '59899887766',
    openingHours: 'Miércoles a Domingos 19:30 a 01:30 hs',
    happyHour: '19:30 a 21:30 hs ($150 la pinta)',
    deliveryFee: 60,
    isOpen: true,
    minOrderAmount: 200,
    requirePhoneValidation: true,
    maxFailedCodeAttempts: 5,
  });

  // Cart & Customer's Own Order (stored locally for this customer only)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTable, setCurrentTable] = useState<number | null>(null);
  const [activeTrackerOrder, setActiveTrackerOrder] = useState<Order | null>(null);
  const [myCustomerOrder, setMyCustomerOrder] = useState<Order | null>(null);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSommelierOpen, setIsSommelierOpen] = useState(false);

  // Navigate customer subpages
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    }
    setIsStaffWeb(false);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sound.playClick();
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      const staff = isStaffRoute(p, window.location.search);
      setIsStaffWeb(staff);
      if (!staff) {
        setCurrentPath(p);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update document title depending on which independent web is loaded
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = isStaffWeb
        ? 'Brasa & Lúpulo — Portal Interno de Personal y Administración'
        : `${settings.restaurantName} — Smash Burgers, Pizzas & Cerveza Artesanal`;
    }
  }, [isStaffWeb, settings.restaurantName]);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      const [resMenu, resTaps, resPromos, resReviews, resSettings] =
        await Promise.all([
          fetch('/api/menu').then((r) => r.json()),
          fetch('/api/taps').then((r) => r.json()),
          fetch('/api/promos').then((r) => r.json()),
          fetch('/api/reviews').then((r) => r.json()),
          fetch('/api/settings')
            .then((r) => r.json())
            .catch(() => ({ success: false })),
        ]);

      if (resMenu.items) setMenuItems(resMenu.items);
      if (resTaps.taps) setTaps(resTaps.taps);
      if (resPromos.promos) setPromos(resPromos.promos);
      if (resReviews.reviews) setReviews(resReviews.reviews);
      if (resSettings.settings) setSettings(resSettings.settings);
    } catch (err) {
      console.error('Error fetching initial restaurant data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();

    try {
      const savedUser = localStorage.getItem('bl_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {}

    try {
      const savedCart = localStorage.getItem('bl_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {}

    try {
      const savedCustomerOrder = localStorage.getItem('bl_my_customer_order');
      if (savedCustomerOrder) {
        setMyCustomerOrder(JSON.parse(savedCustomerOrder));
      }
    } catch (e) {}
  }, []);

  // Keep customer's own active order synced with backend status
  useEffect(() => {
    if (!myCustomerOrder || isStaffWeb) return;
    const syncMyOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${myCustomerOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setMyCustomerOrder(data.order);
            localStorage.setItem('bl_my_customer_order', JSON.stringify(data.order));
          }
        }
      } catch (e) {}
    };
    const interval = setInterval(syncMyOrder, 6000);
    return () => clearInterval(interval);
  }, [myCustomerOrder?.id, isStaffWeb]);

  const handleLoginSuccess = (user: Employee) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('bl_user', JSON.stringify(user));
    } catch (e) {}
    sound.playChime();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('bl_user');
    } catch (e) {}
    sound.playClick();
  };

  // Cart persistence
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('bl_cart', JSON.stringify(newCart));
    } catch (e) {}
  };

  const handleAddToCart = (item: MenuItem, notes?: string) => {
    const existingIdx = cart.findIndex(
      (i) => i.id === item.id && (!notes || i.customNotes === notes)
    );
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        customNotes: notes,
        category: item.category,
      };
      saveCart([...cart, newItem]);
    }
    setIsCartOpen(true);
  };

  const handleAddCustomBurger = (burger: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    customNotes: string;
    image: string;
  }) => {
    const newItem: CartItem = {
      id: burger.id,
      name: burger.name,
      price: burger.price,
      quantity: burger.quantity,
      customNotes: burger.customNotes,
      image: burger.image,
      category: 'burgers',
    };
    saveCart([...cart, newItem]);
    setIsCartOpen(true);
  };

  const handleOrderBeer = (beer: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }) => {
    const existingIdx = cart.findIndex((i) => i.id === beer.id);
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        id: beer.id,
        name: beer.name,
        price: beer.price,
        quantity: 1,
        category: 'bebidas',
      };
      saveCart([...cart, newItem]);
    }
    setIsCartOpen(true);
  };

  const handleOrderPromo = (promo: Promo) => {
    const newItem: CartItem = {
      id: promo.id,
      name: promo.title,
      price: promo.priceNow,
      quantity: 1,
      customNotes: promo.description,
      image: promo.image,
      category: 'promos',
    };
    saveCart([...cart, newItem]);
    setIsCartOpen(true);
  };

  const handleAddSommelierCombo = (beerName: string, dishName: string) => {
    const matchedDish = menuItems.find((m) =>
      m.name.toLowerCase().includes(dishName.toLowerCase())
    );
    const dishPrice = matchedDish ? matchedDish.price : 390;
    const dishItem: CartItem = {
      id: matchedDish ? matchedDish.id : `dish-${Date.now()}`,
      name: matchedDish ? matchedDish.name : dishName,
      price: dishPrice,
      quantity: 1,
      customNotes: 'Selección de Maridaje Recomendado',
    };

    const beerItem: CartItem = {
      id: `beer-${Date.now()}`,
      name: `Pinta ${beerName}`,
      price: 220,
      quantity: 1,
      customNotes: 'Maridaje ideal',
    };

    saveCart([...cart, dishItem, beerItem]);
    setIsCartOpen(true);
  };

  const handlePourTap = (tapId: string) => {
    setTaps((prev) =>
      prev.map((t) =>
        t.id === tapId ? { ...t, kegPercentage: Math.max(0, t.kegPercentage - 2) } : t
      )
    );
  };

  const handleAddReview = async (review: {
    name: string;
    rating: number;
    dish: string;
    comment: string;
  }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      });
      const data = await res.json();
      if (data.review) {
        setReviews([data.review, ...reviews]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const updated = cart
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((item) => item.quantity > 0);
    saveCart(updated);
  };

  const handleRemoveItem = (id: string) => {
    saveCart(cart.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // ============================================================================
  // WEB 2: APLICACIÓN INDEPENDIENTE DE EMPLEADOS Y ADMINISTRADORES (/staff)
  // ============================================================================
  if (isStaffWeb) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-white">
        {gmpQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}
        <StaffApp
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onRefreshStoreData={fetchInitialData}
        />
      </div>
    );
  }

  // ============================================================================
  // WEB 1: PÁGINA WEB PÚBLICA DE CLIENTES (100% PURA PARA COMENSALES)
  // ============================================================================
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-white pb-16">
      {/* Google Maps Platform Demo Key Quota Warning Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Customer Restaurant Header (Zero Staff/Admin Buttons) */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSommelier={() => setIsSommelierOpen(true)}
        currentTable={currentTable}
        onSelectTable={(table) => setCurrentTable(table)}
        currentPath={currentPath}
        onNavigate={navigate}
        activeCustomerOrder={
          myCustomerOrder && myCustomerOrder.status !== 'delivered'
            ? myCustomerOrder
            : null
        }
        onOpenOrderTracker={() => setActiveTrackerOrder(myCustomerOrder)}
      />

      {/* Customer's Own Active Order Banner (Only shown if this customer placed an order) */}
      {myCustomerOrder && myCustomerOrder.status !== 'delivered' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Tu pedido {myCustomerOrder.orderNumber} está en curso:</strong>{' '}
                {myCustomerOrder.type === 'delivery'
                  ? 'Entrégale este código de 4 dígitos al repartidor al recibir tu pedido:'
                  : `Preparando para Mesa #${myCustomerOrder.tableNumber || 1}`}
              </span>
            </div>
            <button
              onClick={() => setActiveTrackerOrder(myCustomerOrder)}
              className="px-3 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {myCustomerOrder.type === 'delivery' && (
                <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-mono font-black">
                  Código: {myCustomerOrder.verificationCode || '4921'}
                </span>
              )}
              <span>Ver Seguimiento</span>
              <Eye className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* SUBPAGE CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {currentPath !== '/' && (
          <div className="mb-6 flex items-center justify-between bg-stone-900/60 border border-stone-800 rounded-2xl p-3 px-4 text-xs">
            <div className="flex items-center gap-2 text-stone-400">
              <button
                onClick={() => navigate('/')}
                className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
              >
                Inicio
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
              <span className="text-white font-bold uppercase tracking-wider">
                {currentPath === '/menu' && 'Carta Gastronómica Completa'}
                {currentPath === '/promos' && 'Promociones & Combos'}
                {currentPath === '/canillas' && 'Pizarra de Canillas Artesanales'}
                {currentPath === '/armar-burger' && 'Armá tu Burger Personalizada'}
                {currentPath === '/reservas' && 'Reserva de Mesas'}
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-amber-400 hover:text-amber-300 font-bold text-xs cursor-pointer"
            >
              ← Volver al Inicio
            </button>
          </div>
        )}

        {/* SUBPAGE 1: INICIO */}
        {currentPath === '/' && (
          <div className="space-y-12">
            <div className="relative rounded-3xl overflow-hidden border border-stone-800 bg-stone-900 shadow-2xl p-6 sm:p-12 text-center space-y-6">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{settings.restaurantName} • Tacuarembó</span>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-tight">
                  Smash Burgers al Hierro <br className="hidden sm:inline" />
                  <span className="text-orange-500">& Horno de Barro a Leña</span>
                </h1>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl mx-auto">
                  Carne seleccionada con costra perfecta, pizzas a la piedra cocidas a 450°C y 8 canillas de cerveza artesanal tirada bajo cero.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/menu')}
                    className="py-3 px-6 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Explorar Carta Completa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate('/promos')}
                    className="py-3 px-6 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>🔥 Promociones del Día</span>
                  </button>

                  <button
                    onClick={() => navigate('/canillas')}
                    className="py-3 px-6 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Beer className="w-4 h-4 text-amber-400" />
                    <span>Pizarra Canillas (8)</span>
                  </button>
                </div>
              </div>
            </div>

            <SpecialtiesCarousel onAddToCart={handleAddToCart} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => navigate('/armar-burger')}
                className="cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-stone-900 to-stone-950 border border-amber-500/30 hover:border-amber-500/60 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-lg uppercase">
                      Armá tu Smash Burger
                    </h3>
                    <p className="text-xs text-amber-300">
                      Personaliza medallones, panes y quesos fundidos
                    </p>
                  </div>
                </div>
                <p className="text-xs text-stone-400 mb-4">
                  Elige tipo de pan brioche o papa, cantidad de carne smash, aderezos ahumados y toppings crujientes con cálculo de precio en vivo.
                </p>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Entrar al Laboratorio de Burgers ➔
                </span>
              </div>

              <div
                onClick={() => navigate('/reservas')}
                className="cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 via-stone-900 to-stone-950 border border-orange-500/30 hover:border-orange-500/60 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-lg uppercase">
                      Reserva tu Mesa
                    </h3>
                    <p className="text-xs text-orange-300">
                      Patio cervecero, salón o cerca del horno de leña
                    </p>
                  </div>
                </div>
                <p className="text-xs text-stone-400 mb-4">
                  Asegura tu lugar para cumpleaños, cenas en pareja o previas con amigos en 18 de Julio y 25 de Mayo.
                </p>
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Hacer Reserva Online ➔
                </span>
              </div>
            </div>

            <ReviewsSection reviews={reviews} onAddReview={handleAddReview} />
            <LocationFooter />
          </div>
        )}

        {/* SUBPAGE 2: CARTA COMPLETA (/menu) */}
        {currentPath === '/menu' && (
          <div className="space-y-8">
            <DigitalMenu items={menuItems} onAddToCart={handleAddToCart} />
            <LocationFooter />
          </div>
        )}

        {/* SUBPAGE 3: PROMOCIONES (/promos) */}
        {currentPath === '/promos' && (
          <div className="space-y-8">
            <HeroPromos promos={promos} onOrderPromo={handleOrderPromo} />
            <LocationFooter />
          </div>
        )}

        {/* SUBPAGE 4: CANILLAS EN VIVO (/canillas) */}
        {currentPath === '/canillas' && (
          <div className="space-y-8">
            <TaproomVisualizer
              taps={taps}
              onOrderBeer={handleOrderBeer}
              onPourTap={handlePourTap}
            />
            <LocationFooter />
          </div>
        )}

        {/* SUBPAGE 5: ARMAR BURGER (/armar-burger) */}
        {currentPath === '/armar-burger' && (
          <div className="space-y-8">
            <BurgerBuilder onAddCustomBurger={handleAddCustomBurger} />
            <LocationFooter />
          </div>
        )}

        {/* SUBPAGE 6: RESERVAS (/reservas) */}
        {currentPath === '/reservas' && (
          <div className="space-y-8">
            <ReservationSection />
            <LocationFooter />
          </div>
        )}
      </main>

      {/* Customer-Only Floating Bottom Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1 max-w-[calc(100vw-24px)] overflow-x-auto scrollbar-none">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
            currentPath === '/'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-stone-950 text-stone-300 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => navigate('/menu')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
            currentPath === '/menu'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-stone-950 text-stone-300 hover:text-white'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Carta</span>
        </button>

        <button
          onClick={() => navigate('/promos')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
            currentPath === '/promos'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-stone-950 text-stone-300 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>Promos</span>
        </button>

        <button
          onClick={() => navigate('/canillas')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
            currentPath === '/canillas'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-stone-950 text-stone-300 hover:text-white'
          }`}
        >
          <Beer className="w-3.5 h-3.5 text-amber-400" />
          <span>Canillas</span>
        </button>

        <button
          onClick={() => navigate('/reservas')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
            currentPath === '/reservas'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-stone-950 text-stone-300 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span>Reservas</span>
        </button>
      </div>

      {/* Sliding Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderCompleted={(order) => {
          setMyCustomerOrder(order);
          try {
            localStorage.setItem('bl_my_customer_order', JSON.stringify(order));
          } catch (e) {}
          setActiveTrackerOrder(order);
          fetchInitialData();
        }}
        currentTable={currentTable}
        deliveryFee={settings.deliveryFee}
      />

      {/* AI Sommelier Food & Craft Beer Pairing Modal */}
      <AiSommelierModal
        isOpen={isSommelierOpen}
        onClose={() => setIsSommelierOpen(false)}
        onAddComboToCart={handleAddSommelierCombo}
      />

      {/* Real-time Order Tracking Modal with Secret Verification Code */}
      <OrderTrackerModal
        order={activeTrackerOrder}
        onClose={() => setActiveTrackerOrder(null)}
      />
    </div>
  );
}

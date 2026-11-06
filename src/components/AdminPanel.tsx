import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, LayoutDashboard, UtensilsCrossed, Tag, Users, DollarSign,
  Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, Truck,
  ArrowLeft, Search, RefreshCw, AlertTriangle, Eye, ChefHat, Flame,
  LogOut, Save, ShieldAlert, Sparkles, TrendingUp, Beer, Settings,
  Lock, Unlock, Phone, MapPin, Sliders, ToggleLeft, ToggleRight, Cloud
} from 'lucide-react';
import { Order, MenuItem, Promo, Employee, TapBeer, RestaurantSettings } from '../types/restaurant';
import { WorkspaceSyncPanel } from './WorkspaceSyncPanel';

interface AdminPanelProps {
  currentUser: Employee;
  onLogout: () => void;
  onBackToStore: () => void;
  onRefreshData?: () => void;
  embeddedInStaffApp?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onLogout,
  onBackToStore,
  onRefreshData,
  embeddedInStaffApp = false,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'taps' | 'promos' | 'staff' | 'settings' | 'finances' | 'workspace'>('orders');

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [taps, setTaps] = useState<TapBeer[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    maxFailedCodeAttempts: 3
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter states
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'in_transit' | 'delivered' | 'fraud'>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Modals for Dishes
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isCreatingMenuItem, setIsCreatingMenuItem] = useState(false);

  // Modals for Beer Taps
  const [editingTap, setEditingTap] = useState<TapBeer | null>(null);
  const [isCreatingTap, setIsCreatingTap] = useState(false);

  // Modals for Promos
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);

  // Form states for Menu
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({
    name: '',
    category: 'burgers',
    price: 380,
    description: '',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    badge: '',
    cookingTime: '12-15 min',
    ingredients: ['Carne smash', 'Queso cheddar'],
    pairingSuggestion: 'Furia Citra IPA',
    isPopular: true,
    isSpicy: false,
    isVeggie: false,
    isGlutenFree: false
  });

  // Form states for Tap Beer
  const [tapForm, setTapForm] = useState<Partial<TapBeer>>({
    name: '',
    brewery: 'Brasa & Lúpulo Brewing Co.',
    style: 'American IPA',
    tapNumber: 1,
    abv: 6.2,
    ibu: 50,
    temperature: '2.8°C',
    kegPercentage: 80,
    pricePinta: 220,
    priceGrowler: 590,
    status: 'activa',
    color: 'dorado-ambar',
    tastingNotes: ['Cítrico', 'Lúpulo fresco', 'Amargor seco'],
    foodPairing: 'Smash burgers y papas con panceta'
  });

  // Form states for Promo
  const [promoForm, setPromoForm] = useState<Partial<Promo>>({
    title: '',
    subtitle: '',
    description: '',
    priceNow: 590,
    priceOld: 740,
    discount: '-20%',
    pill: 'PROMO HOY',
    badge: 'Fuego & Cerveza',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [resOrders, resMenu, resTaps, resPromos, resStaff, resSettings] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/menu').then(r => r.json()),
        fetch('/api/taps').then(r => r.json()),
        fetch('/api/promos').then(r => r.json()),
        fetch('/api/staff/employees').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()).catch(() => ({ success: false })),
      ]);

      if (resOrders.orders) setOrders(resOrders.orders);
      if (resMenu.items) setMenuItems(resMenu.items);
      if (resTaps.taps) setTaps(resTaps.taps);
      if (resPromos.promos) setPromos(resPromos.promos);
      if (resStaff.employees) setEmployees(resStaff.employees);
      if (resSettings.settings) setSettings(resSettings.settings);
    } catch (e) {
      console.error(e);
      showToast('Error cargando datos del servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'fraud') return o.isFraudBlocked || o.status === 'fraud_alert';
    if (orderFilter === 'active') return ['received', 'kitchen', 'oven', 'ready'].includes(o.status);
    if (orderFilter === 'in_transit') return o.status === 'in_transit';
    if (orderFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Pedido actualizado a: ${newStatus}`);
        fetchAllData();
      } else {
        showToast(data.error || 'Error al actualizar pedido');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Unblock fraud order
  const handleUnblockOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/unblock-fraud`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Pedido desbloqueado exitosamente');
        fetchAllData();
      } else {
        showToast(data.error || 'Error al desbloquear pedido');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Staff approvals & commission
  const handleUpdateEmployee = async (empId: string, updates: Partial<Employee>) => {
    try {
      const res = await fetch(`/api/staff/employees/${empId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Empleado actualizado exitosamente');
        fetchAllData();
      } else {
        showToast(data.error || 'Error al actualizar empleado');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cuenta de empleado?')) return;
    try {
      const res = await fetch(`/api/staff/employees/${empId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cuenta eliminada');
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Menu item CRUD
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingMenuItem;
      const url = isEdit ? `/api/menu/${editingMenuItem.id}` : '/api/menu';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuForm),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Plato actualizado en la carta' : 'Plato agregado a la carta');
        setEditingMenuItem(null);
        setIsCreatingMenuItem(false);
        fetchAllData();
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Error al guardar plato');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('¿Seguro que deseas quitar este plato de la carta?')) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plato eliminado de la carta');
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick price adjuster
  const handleQuickPriceAdjust = async (id: string, currentPrice: number, delta: number) => {
    const newPrice = Math.max(10, currentPrice + delta);
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });
      if (res.ok) {
        showToast(`Precio actualizado: $${newPrice} $U`);
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Beer Taps CRUD
  const handleSaveTap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingTap;
      const url = isEdit ? `/api/taps/${editingTap.id}` : '/api/taps';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tapForm),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Canilla actualizada en pizarra' : 'Nueva canilla agregada');
        setEditingTap(null);
        setIsCreatingTap(false);
        fetchAllData();
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Error al guardar canilla');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTap = async (id: string) => {
    if (!confirm('¿Seguro que deseas quitar esta canilla de la pizarra?')) return;
    try {
      const res = await fetch(`/api/taps/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Canilla eliminada');
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Promos CRUD
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingPromo;
      const url = isEdit ? `/api/promos/${editingPromo.id}` : '/api/promos';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoForm),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Promoción actualizada' : 'Promoción creada');
        setEditingPromo(null);
        setIsCreatingPromo(false);
        fetchAllData();
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Error al guardar promo');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta promoción?')) return;
    try {
      const res = await fetch(`/api/promos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Promoción eliminada');
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Store Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Configuración del restaurante guardada');
        fetchAllData();
      } else {
        showToast(data.error || 'Error al guardar configuración');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Financial metrics
  const totalGrossRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + o.total, 0);

  const totalCommissionsOwed = employees
    .reduce((acc, e) => acc + (e.earningsToday || 0), 0);

  const pendingSignups = employees.filter((e) => e.status === 'pending');
  const approvedDrivers = employees.filter((e) => e.role === 'delivery' && e.status === 'approved');
  const fraudOrders = orders.filter((o) => o.isFraudBlocked || o.status === 'fraud_alert');

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border-2 border-orange-500/80 text-orange-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce text-xs font-bold max-w-sm">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="break-words">{toastMessage}</span>
        </div>
      )}

      {/* Top Header (Hidden when embedded in unified StaffApp) */}
      {!embeddedInStaffApp && (
        <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 px-3 sm:px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={onBackToStore}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
                title="Volver a la web del restaurante"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Web Cliente</span>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-lg shadow-orange-600/20 shrink-0">
                  <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <div className="truncate">
                  <h1 className="font-display text-sm sm:text-lg font-black uppercase text-white tracking-wide flex items-center gap-1.5">
                    <span className="truncate">Panel Calix</span>
                    <span className="text-[9px] sm:text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                      MASTER
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
                    Admin: <span className="font-bold text-amber-400">{currentUser.name}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchAllData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors"
                title="Refrescar datos del servidor"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={onLogout}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Sub-header Navigation Tabs */}
      <div className="bg-stone-900/80 border-b border-stone-800 px-3 sm:px-4 py-2 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Comandas ({orders.length})</span>
            {fraudOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                !
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Carta / Menú ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('taps')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'taps'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Beer className="w-3.5 h-3.5 text-amber-400" />
            <span>Canillas Birra ({taps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'promos'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promos ({promos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 relative ${
              activeTab === 'staff'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Repartidores</span>
            {pendingSignups.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {pendingSignups.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración Local</span>
          </button>

          <button
            onClick={() => setActiveTab('finances')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'finances'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Finanzas</span>
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'workspace'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Sheets & Drive</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 w-full flex-1">
        {/* TAB 1: COMANDAS & PEDIDOS EN VIVO */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                  Comandas & Monitor Antifraude
                </h2>
                <p className="text-xs text-stone-400">
                  Visualiza pedidos en vivo, bloqueos de seguridad por código erróneo y asignación exclusiva.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs overflow-x-auto max-w-full">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    orderFilter === 'all' ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  onClick={() => setOrderFilter('active')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    orderFilter === 'active' ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Cocina ({orders.filter(o => ['received', 'kitchen', 'oven', 'ready'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setOrderFilter('in_transit')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    orderFilter === 'in_transit' ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  En Reparto ({orders.filter(o => o.status === 'in_transit').length})
                </button>
                <button
                  onClick={() => setOrderFilter('fraud')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    orderFilter === 'fraud' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  Alertas Fraude ({fraudOrders.length})
                </button>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.length === 0 ? (
                <div className="col-span-full py-16 text-center text-stone-500 bg-stone-900/30 rounded-3xl border border-stone-800">
                  No hay pedidos con el filtro seleccionado.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isFraud = order.isFraudBlocked || order.status === 'fraud_alert';
                  const isDelivered = order.status === 'delivered';
                  const isInTransit = order.status === 'in_transit';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isFraud
                          ? 'bg-rose-950/30 border-rose-600/80 ring-2 ring-rose-500/30 shadow-xl shadow-rose-950/50'
                          : isDelivered
                          ? 'bg-stone-950/40 border-stone-800/60 opacity-80'
                          : isInTransit
                          ? 'bg-stone-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : 'bg-stone-900 border-stone-800'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Security Alert Header if Fraud Blocked */}
                        {isFraud && (
                          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs font-bold flex items-start gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                            <div className="flex-1">
                              <div>ALERTA DE SEGURIDAD / FRAUDE</div>
                              <p className="text-[11px] font-normal text-rose-300 mt-0.5">
                                {order.fraudReason || 'Se superaron los 3 intentos fallidos del código de entrega. Pedido bloqueado.'}
                              </p>
                              <button
                                onClick={() => handleUnblockOrder(order.id)}
                                className="mt-2 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Desbloquear y Restablecer Código</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Card Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                          <div>
                            <span className="font-mono text-sm font-black text-amber-400">
                              {order.orderNumber}
                            </span>
                            <div className="text-[10px] text-stone-500">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isFraud
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : order.status === 'delivered'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : order.status === 'in_transit'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              }`}
                            >
                              {isFraud ? 'BLOQUEADO' : order.status}
                            </span>

                            <span className="text-[10px] font-bold text-stone-400 uppercase">
                              {order.type === 'delivery' ? '🛵 Delivery' : order.type === 'table' ? `🍽️ Mesa #${order.tableNumber}` : '🛍️ Llevar'}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Location */}
                        <div className="text-xs space-y-1">
                          <div className="font-bold text-white flex justify-between">
                            <span className="truncate">{order.customer.name}</span>
                            <span className="text-stone-400 font-normal shrink-0">{order.customer.phone}</span>
                          </div>
                          {order.type === 'delivery' && (
                            <p className="text-stone-300 text-[11px] bg-stone-950 p-2 rounded-xl border border-stone-800/80 break-words">
                              📍 {order.customer.address}
                            </p>
                          )}
                          {order.notes && (
                            <p className="text-stone-400 italic text-[10px] break-words">
                              Nota: {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Items list */}
                        <div className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-800/60 space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-stone-300">
                              <span className="truncate">{it.quantity}x {it.name}</span>
                              <span className="font-mono text-stone-400 shrink-0">${it.price * it.quantity}</span>
                            </div>
                          ))}
                          <div className="pt-1.5 border-t border-stone-800 flex justify-between font-bold text-white text-xs">
                            <span>Total a cobrar ({order.paymentMethod}):</span>
                            <span className="font-mono text-amber-400">${order.total} $U</span>
                          </div>
                        </div>

                        {/* Verification code & Driver Assigned Info */}
                        <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400 text-[11px]">Repartidor asignado:</span>
                            {order.assignedToName ? (
                              <span className="font-bold text-emerald-400 flex items-center gap-1 truncate">
                                <Truck className="w-3 h-3 shrink-0" />
                                <span className="truncate">{order.assignedToName}</span>
                              </span>
                            ) : (
                              <span className="text-amber-400/80 italic text-[11px]">Sin asignar</span>
                            )}
                          </div>

                          {order.type === 'delivery' && (
                            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
                              <span className="text-stone-400 text-[11px]">Código Verificación Secreto:</span>
                              <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                {order.verificationCode || '---'}
                              </span>
                            </div>
                          )}

                          {order.failedCodeAttempts ? (
                            <div className="text-[10px] text-rose-400 font-bold">
                              Intentos erróneos de código: {order.failedCodeAttempts} / 3
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Status changer buttons */}
                      <div className="pt-3 border-t border-stone-800 mt-3 flex items-center gap-1.5 flex-wrap">
                        {order.status !== 'delivered' && !isFraud && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'kitchen')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                order.status === 'kitchen' ? 'bg-orange-500 text-stone-950 border-orange-500' : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              Plancha
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                order.status === 'ready' ? 'bg-orange-500 text-stone-950 border-orange-500' : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              Listo
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 ml-auto flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Entregar</span>
                            </button>
                          </>
                        )}
                        {order.status === 'delivered' && (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Comanda finalizada con éxito</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GESTIÓN DE CARTA (MENU CMS) */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                  Carta & Precios en Vivo (CMS)
                </h2>
                <p className="text-xs text-stone-400">
                  Personaliza al 100% cada plato: agrega nuevos, modifica ingredientes, descripciones, fotos, insignias y precios.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingMenuItem(null);
                  setMenuForm({
                    name: '',
                    category: 'burgers',
                    price: 380,
                    description: '',
                    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                    badge: 'Nuevo',
                    cookingTime: '12-15 min',
                    ingredients: ['Carne smash', 'Queso cheddar'],
                    pairingSuggestion: 'Furia Citra IPA',
                    isPopular: true,
                    isSpicy: false,
                    isVeggie: false,
                    isGlutenFree: false
                  });
                  setIsCreatingMenuItem(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Plato</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Buscar plato por nombre o ingrediente..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
                {['todos', 'burgers', 'pizzas', 'picadas', 'bebidas', 'postres'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-stone-800 text-orange-400 border border-orange-500/30'
                        : 'text-stone-400 hover:text-white bg-stone-900/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menuItems
                .filter(item => {
                  const matchCat = selectedCategory === 'todos' || item.category === selectedCategory;
                  const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                    item.description.toLowerCase().includes(menuSearch.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((dish) => (
                  <div
                    key={dish.id}
                    className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-orange-500/40 transition-colors"
                  >
                    <div>
                      <div className="relative h-40 w-full overflow-hidden bg-stone-950">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-sm text-stone-200 border border-stone-700">
                            {dish.category}
                          </span>
                          {dish.badge && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-600 text-white">
                              {dish.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display font-bold text-white text-base leading-tight truncate">
                            {dish.name}
                          </h3>
                          <div className="font-mono font-black text-amber-400 text-base shrink-0">
                            ${dish.price} <span className="text-[10px] font-sans text-stone-400">$U</span>
                          </div>
                        </div>

                        {/* Quick Price Adjuster Buttons */}
                        <div className="flex items-center gap-1.5 py-1 text-[11px] text-stone-400">
                          <span>Ajuste rápido:</span>
                          <button
                            onClick={() => handleQuickPriceAdjust(dish.id, dish.price, -10)}
                            className="px-2 py-0.5 bg-stone-950 rounded border border-stone-800 hover:text-white"
                          >
                            -$10
                          </button>
                          <button
                            onClick={() => handleQuickPriceAdjust(dish.id, dish.price, +10)}
                            className="px-2 py-0.5 bg-stone-950 rounded border border-stone-800 hover:text-white"
                          >
                            +$10
                          </button>
                        </div>

                        <p className="text-xs text-stone-400 line-clamp-2">
                          {dish.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {dish.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-[10px] bg-stone-950 text-stone-400 px-2 py-0.5 rounded-md border border-stone-800">
                              {ing}
                            </span>
                          ))}
                          {dish.ingredients.length > 3 && (
                            <span className="text-[10px] text-stone-500">
                              +{dish.ingredients.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-stone-800/80 mt-2">
                      <button
                        onClick={() => {
                          setEditingMenuItem(dish);
                          setMenuForm(dish);
                          setIsCreatingMenuItem(true);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMenuItem(dish.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Eliminar plato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal: Create / Edit Dish */}
            {isCreatingMenuItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <h3 className="font-display text-lg font-bold uppercase text-white">
                      {editingMenuItem ? 'Editar Plato del Menú' : 'Nuevo Plato en la Carta'}
                    </h3>
                    <button
                      onClick={() => setIsCreatingMenuItem(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-white"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">Nombre del Plato:</label>
                      <input
                        type="text"
                        required
                        value={menuForm.name || ''}
                        onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                        placeholder="Ej. Doble Smash Bacon Calix"
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Categoría:</label>
                        <select
                          value={menuForm.category || 'burgers'}
                          onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none"
                        >
                          <option value="burgers">Burgers</option>
                          <option value="pizzas">Pizzas Horno Barro</option>
                          <option value="picadas">Picadas & Tapeos</option>
                          <option value="bebidas">Bebidas & Birras</option>
                          <option value="postres">Postres</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Precio ($U):</label>
                        <input
                          type="number"
                          required
                          value={menuForm.price || ''}
                          onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) || 0 })}
                          placeholder="380"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">Descripción:</label>
                      <textarea
                        rows={2}
                        value={menuForm.description || ''}
                        onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                        placeholder="Doble medallón 110g, queso cheddar fundido, panceta crujiente y pan brioche..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">URL de Imagen:</label>
                      <input
                        type="url"
                        required
                        value={menuForm.image || ''}
                        onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Insignia / Badge:</label>
                        <input
                          type="text"
                          value={menuForm.badge || ''}
                          onChange={(e) => setMenuForm({ ...menuForm, badge: e.target.value })}
                          placeholder="Ej. 🔥 Más Vendida"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Tiempo Cocina:</label>
                        <input
                          type="text"
                          value={menuForm.cookingTime || ''}
                          onChange={(e) => setMenuForm({ ...menuForm, cookingTime: e.target.value })}
                          placeholder="12-15 min"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">Ingredientes (sep. por comas):</label>
                      <input
                        type="text"
                        value={(menuForm.ingredients || []).join(', ')}
                        onChange={(e) => setMenuForm({ ...menuForm, ingredients: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Smash 110g, Cheddar inglés, Bacon, Salsa de la casa"
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Flags */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.isPopular || false}
                          onChange={(e) => setMenuForm({ ...menuForm, isPopular: e.target.checked })}
                          className="rounded text-orange-600"
                        />
                        <span>Destacado</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.isVeggie || false}
                          onChange={(e) => setMenuForm({ ...menuForm, isVeggie: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>Vegetariano</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.isSpicy || false}
                          onChange={(e) => setMenuForm({ ...menuForm, isSpicy: e.target.checked })}
                          className="rounded text-rose-600"
                        />
                        <span>Picante</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.isGlutenFree || false}
                          onChange={(e) => setMenuForm({ ...menuForm, isGlutenFree: e.target.checked })}
                          className="rounded text-amber-600"
                        />
                        <span>Sin TACC</span>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingMenuItem(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold hover:bg-stone-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/30"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Plato</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GESTIÓN DE CANILLAS DE BIRRA (TAPS CMS) */}
        {activeTab === 'taps' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white flex items-center gap-2">
                  <Beer className="w-5 h-5 text-amber-400" />
                  <span>Pizarra de Canillas de Birra (CMS)</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Modifica las cervezas en canilla, estilos, porcentaje de barril restante, graduación alcohólica (ABV), IBU y precios de pinta/growler.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTap(null);
                  setTapForm({
                    name: '',
                    brewery: 'Brasa & Lúpulo Brewing Co.',
                    style: 'American IPA',
                    tapNumber: taps.length + 1,
                    abv: 6.0,
                    ibu: 45,
                    temperature: '2.8°C',
                    kegPercentage: 100,
                    pricePinta: 220,
                    priceGrowler: 590,
                    status: 'activa',
                    color: 'dorado-ambar',
                    tastingNotes: ['Cítrico', 'Lúpulo'],
                    foodPairing: 'Hamburguesa smash'
                  });
                  setIsCreatingTap(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nueva Canilla</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {taps.map((tap) => (
                <div
                  key={tap.id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        TAP #{tap.tapNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        tap.status === 'activa' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {tap.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-white text-base leading-tight truncate">
                        {tap.name}
                      </h3>
                      <p className="text-[11px] text-amber-300 font-medium">
                        {tap.style} • {tap.brewery}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-1 bg-stone-950 p-2 rounded-xl border border-stone-800">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase block">ABV / IBU</span>
                        <span className="font-bold text-white">{tap.abv}% / {tap.ibu} IBU</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase block">Temp.</span>
                        <span className="font-bold text-white">{tap.temperature}</span>
                      </div>
                    </div>

                    {/* Barril restante */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-stone-400 mb-1">
                        <span>Barril restante:</span>
                        <span className="text-amber-400">{tap.kegPercentage}%</span>
                      </div>
                      <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all ${
                            tap.kegPercentage < 20 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${tap.kegPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <div>
                        <span className="text-[10px] text-stone-500 block">Pinta</span>
                        <span className="font-mono font-black text-amber-400 text-sm">${tap.pricePinta} $U</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 block">Growler 1.9L</span>
                        <span className="font-mono font-bold text-stone-300 text-xs">${tap.priceGrowler} $U</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingTap(tap);
                        setTapForm(tap);
                        setIsCreatingTap(true);
                      }}
                      className="py-1 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTap(tap.id)}
                      className="p-1 rounded-lg text-stone-500 hover:text-rose-400 transition-colors"
                      title="Eliminar canilla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Create / Edit Tap */}
            {isCreatingTap && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                      <Beer className="w-4 h-4 text-amber-400" />
                      <span>{editingTap ? `Editar Canilla #${editingTap.tapNumber}` : 'Nueva Canilla en Pizarra'}</span>
                    </h3>
                    <button
                      onClick={() => setIsCreatingTap(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-white"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTap} className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">N° Canilla:</label>
                        <input
                          type="number"
                          value={tapForm.tapNumber || 1}
                          onChange={(e) => setTapForm({ ...tapForm, tapNumber: parseInt(e.target.value, 10) || 1 })}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-stone-400 font-bold uppercase mb-1">Nombre Cerveza:</label>
                        <input
                          type="text"
                          required
                          value={tapForm.name || ''}
                          onChange={(e) => setTapForm({ ...tapForm, name: e.target.value })}
                          placeholder="Ej. Furia Citra IPA"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Estilo:</label>
                        <input
                          type="text"
                          value={tapForm.style || ''}
                          onChange={(e) => setTapForm({ ...tapForm, style: e.target.value })}
                          placeholder="American IPA"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Cervecería:</label>
                        <input
                          type="text"
                          value={tapForm.brewery || ''}
                          onChange={(e) => setTapForm({ ...tapForm, brewery: e.target.value })}
                          placeholder="Brasa & Lúpulo Brewing Co."
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">ABV (%):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={tapForm.abv || 5.0}
                          onChange={(e) => setTapForm({ ...tapForm, abv: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">IBU:</label>
                        <input
                          type="number"
                          value={tapForm.ibu || 25}
                          onChange={(e) => setTapForm({ ...tapForm, ibu: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Temp:</label>
                        <input
                          type="text"
                          value={tapForm.temperature || '2.8°C'}
                          onChange={(e) => setTapForm({ ...tapForm, temperature: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Precio Pinta ($U):</label>
                        <input
                          type="number"
                          required
                          value={tapForm.pricePinta || 220}
                          onChange={(e) => setTapForm({ ...tapForm, pricePinta: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Precio Growler ($U):</label>
                        <input
                          type="number"
                          value={tapForm.priceGrowler || 590}
                          onChange={(e) => setTapForm({ ...tapForm, priceGrowler: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-stone-400 font-bold uppercase">Nivel de Barril Restante:</label>
                        <span className="font-mono font-bold text-amber-400">{tapForm.kegPercentage || 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tapForm.kegPercentage || 80}
                        onChange={(e) => setTapForm({ ...tapForm, kegPercentage: parseInt(e.target.value, 10) })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">Maridaje Recomendado:</label>
                      <input
                        type="text"
                        value={tapForm.foodPairing || ''}
                        onChange={(e) => setTapForm({ ...tapForm, foodPairing: e.target.value })}
                        placeholder="Smash Brasa Doble y papas con panceta"
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                      />
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingTap(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold hover:bg-stone-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Canilla</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GESTIÓN DE PROMOCIONES (CMS) */}
        {activeTab === 'promos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                  Promociones & Combos (CMS)
                </h2>
                <p className="text-xs text-stone-400">
                  Crea y edita ofertas destacadas en la subpágina /promos y en la portada.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPromo(null);
                  setPromoForm({
                    title: '',
                    subtitle: '',
                    description: '',
                    priceNow: 490,
                    priceOld: 650,
                    discount: '-25%',
                    pill: 'OFERTA LIMITADA',
                    badge: 'Especial Fin de Semana',
                    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
                  });
                  setIsCreatingPromo(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Promoción</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {promos.map((pr) => (
                <div
                  key={pr.id}
                  className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-amber-500/40 transition-colors"
                >
                  <div className="relative h-44 overflow-hidden bg-stone-950">
                    <img
                      src={pr.image}
                      alt={pr.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-orange-600 text-white font-bold text-[10px] uppercase shadow">
                        {pr.discount}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-sm text-amber-300 font-bold text-[10px] uppercase border border-amber-500/30">
                        {pr.pill}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                        {pr.subtitle}
                      </span>
                      <h3 className="font-display font-black text-xl text-white truncate">
                        {pr.title}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-400 line-clamp-2">
                      {pr.description}
                    </p>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="font-display text-2xl font-black text-amber-400">
                        ${pr.priceNow} <span className="text-xs font-sans text-stone-400">$U</span>
                      </span>
                      <span className="text-xs text-stone-500 line-through">
                        ${pr.priceOld} $U
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-950/60 border-t border-stone-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingPromo(pr);
                        setPromoForm(pr);
                        setIsCreatingPromo(true);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar Promo</span>
                    </button>

                    <button
                      onClick={() => handleDeletePromo(pr.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 transition-colors"
                      title="Eliminar promo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Create / Edit Promo */}
            {isCreatingPromo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <h3 className="font-display text-lg font-bold uppercase text-white">
                      {editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}
                    </h3>
                    <button
                      onClick={() => setIsCreatingPromo(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-white"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePromo} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">Título de la Promo:</label>
                      <input
                        type="text"
                        required
                        value={promoForm.title || ''}
                        onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                        placeholder="Ej. Combo Amigos: 2 Smashes + 2 Pintas"
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Subtítulo:</label>
                        <input
                          type="text"
                          value={promoForm.subtitle || ''}
                          onChange={(e) => setPromoForm({ ...promoForm, subtitle: e.target.value })}
                          placeholder="Jueves y Viernes"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Etiqueta Descuento:</label>
                        <input
                          type="text"
                          value={promoForm.discount || ''}
                          onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })}
                          placeholder="-25% OFF"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Precio Ahora ($U):</label>
                        <input
                          type="number"
                          required
                          value={promoForm.priceNow || ''}
                          onChange={(e) => setPromoForm({ ...promoForm, priceNow: parseFloat(e.target.value) || 0 })}
                          placeholder="590"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">Precio Normal ($U):</label>
                        <input
                          type="number"
                          value={promoForm.priceOld || ''}
                          onChange={(e) => setPromoForm({ ...promoForm, priceOld: parseFloat(e.target.value) || 0 })}
                          placeholder="740"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">Descripción:</label>
                      <textarea
                        rows={2}
                        value={promoForm.description || ''}
                        onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                        placeholder="Descripción de la promo..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">URL de Imagen:</label>
                      <input
                        type="url"
                        required
                        value={promoForm.image || ''}
                        onChange={(e) => setPromoForm({ ...promoForm, image: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                      />
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingPromo(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Promo</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: REPARTIDORES & NÓMINA (STAFF APPROVAL & PAYOUTS) */}
        {activeTab === 'staff' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                Gestión de Repartidores & Nómina de Pagos
              </h2>
              <p className="text-xs text-stone-400">
                Aprueba cuentas de nuevos repartidores, asigna su tarifa individual por pedido y calcula el pago del día.
              </p>
            </div>

            {/* PENDING APPROVALS QUEUE */}
            <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="font-display text-sm font-bold uppercase text-white truncate">
                    Solicitudes de Registro Pendientes ({pendingSignups.length})
                  </h3>
                </div>
                {pendingSignups.length === 0 && (
                  <span className="text-xs text-stone-400 hidden sm:inline">No hay solicitudes pendientes</span>
                )}
              </div>

              {pendingSignups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingSignups.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{emp.name} (ID: {emp.id})</div>
                        <div className="text-[11px] text-stone-300 mt-0.5">
                          Usuario: <span className="font-mono font-bold text-amber-400">@{emp.username}</span> • Clave: <span className="font-mono font-bold text-emerald-400 bg-stone-900 px-1.5 py-0.5 rounded">{emp.password || '123'}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Tel: {emp.phone || 'Sin tel'} • Solicitado: {new Date(emp.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => handleUpdateEmployee(emp.id, { status: 'approved' })}
                          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="px-2 py-1.5 rounded-xl bg-rose-950 text-rose-300 hover:bg-rose-900 text-xs font-bold transition-colors"
                          title="Rechazar y borrar"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">
                  Cuando un nuevo trabajador se registra en la app, aparecerá aquí para que lo apruebes antes de que pueda iniciar sesión.
                </p>
              )}
            </div>

            {/* APPROVED DRIVERS & STATS */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-5 space-y-4">
              <h3 className="font-display text-sm font-bold uppercase text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-500" />
                <span>Equipo de Repartidores Activos & Ganancias Calculadas</span>
              </h3>

              {/* Mobile Card Layout */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {approvedDrivers.map((emp) => {
                  const payToday = (emp.deliveriesToday || 0) * (emp.commissionPerDelivery || 60);
                  return (
                    <div key={emp.id} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white text-sm">{emp.name}</div>
                          <div className="text-xs font-mono text-stone-400">@{emp.username}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block uppercase">A pagar hoy:</span>
                          <span className="font-mono font-black text-amber-400 text-base">${payToday} $U</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-stone-900/60 p-2 rounded-xl text-center text-xs">
                        <div>
                          <span className="text-[10px] text-stone-500 block">Hoy</span>
                          <span className="font-bold text-white">{emp.deliveriesToday || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">Semana</span>
                          <span className="font-bold text-stone-300">{emp.deliveriesWeek || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">Total</span>
                          <span className="font-bold text-stone-300">{emp.deliveriesTotal || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-stone-400">Tarifa: $</span>
                          <input
                            type="number"
                            defaultValue={emp.commissionPerDelivery || 60}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                handleUpdateEmployee(emp.id, { commissionPerDelivery: val });
                              }
                            }}
                            className="w-16 px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-amber-400 font-mono font-bold text-xs"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="text-stone-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                      <th className="pb-3 px-3">Repartidor</th>
                      <th className="pb-3 px-3">Tarifa x Pedido</th>
                      <th className="pb-3 px-3 text-center">Hoy</th>
                      <th className="pb-3 px-3 text-center">Semana</th>
                      <th className="pb-3 px-3 text-center">Mes</th>
                      <th className="pb-3 px-3 text-center">Total Hist.</th>
                      <th className="pb-3 px-3 text-right">Pagar Hoy</th>
                      <th className="pb-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {approvedDrivers.map((emp) => {
                      const payToday = (emp.deliveriesToday || 0) * (emp.commissionPerDelivery || 60);

                      return (
                        <tr key={emp.id} className="hover:bg-stone-950/40">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{emp.name}</div>
                            <div className="text-[10px] font-mono text-stone-400">
                              @{emp.username} • Clave: <span className="text-amber-400">{emp.password || '123'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-400">$U</span>
                              <input
                                type="number"
                                defaultValue={emp.commissionPerDelivery || 60}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    handleUpdateEmployee(emp.id, { commissionPerDelivery: val });
                                  }
                                }}
                                className="w-16 px-2 py-1 rounded-lg bg-stone-950 border border-stone-800 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-white">
                            {emp.deliveriesToday || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-stone-300">
                            {emp.deliveriesWeek || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-stone-300">
                            {emp.deliveriesMonth || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-stone-400">
                            {emp.deliveriesTotal || 0}
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-black text-amber-400 text-sm">
                            ${payToday} <span className="text-[10px] font-sans font-normal text-stone-400">$U</span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="text-stone-500 hover:text-rose-400 p-1 transition-colors"
                              title="Dar de baja"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONFIGURACIÓN GENERAL DEL LOCAL (SETTINGS) */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                <span>Configuración General del Negocio</span>
              </h2>
              <p className="text-xs text-stone-400">
                Ajusta tarifas de envío, horarios de atención, apertura o pausa de la cocina y parámetros de seguridad.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-5 text-xs">
              {/* Emergency Switch: Kitchen Open / Paused */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Estado de la Cocina / Recepción de Pedidos</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {settings.isOpen ? '🟢 Aceptando pedidos normalmente por la web' : '🔴 Cocina en pausa: los clientes verán que no se están tomando pedidos'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, isOpen: !settings.isOpen })}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    settings.isOpen
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                  }`}
                >
                  {settings.isOpen ? 'Abierto (Activo)' : 'En Pausa (Cerrado)'}
                </button>
              </div>

              {/* Delivery and Pricing Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Costo de Envío Delivery ($U):</label>
                  <input
                    type="number"
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-sm"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Se suma automáticamente al carrito cuando el cliente elige delivery</p>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Monto Mínimo de Pedido ($U):</label>
                  <input
                    type="number"
                    value={settings.minOrderAmount}
                    onChange={(e) => setSettings({ ...settings, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-sm"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Evita pedidos insignificantes o spam</p>
                </div>
              </div>

              {/* Hours and Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Horario de Atención:</label>
                  <input
                    type="text"
                    value={settings.openingHours}
                    onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Horario Happy Hour:</label>
                  <input
                    type="text"
                    value={settings.happyHour}
                    onChange={(e) => setSettings({ ...settings, happyHour: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">WhatsApp del Local:</label>
                  <input
                    type="text"
                    value={settings.whatsapp}
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Dirección del Local:</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                  />
                </div>
              </div>

              {/* Security parameters */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Parámetros de Seguridad y Control de Repartidores</span>
                </h4>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-stone-300">
                    Intentos máximos de código secreto antes de bloqueo de seguridad por fraude:
                  </div>
                  <input
                    type="number"
                    min="2"
                    max="5"
                    value={settings.maxFailedCodeAttempts}
                    onChange={(e) => setSettings({ ...settings, maxFailedCodeAttempts: parseInt(e.target.value, 10) || 3 })}
                    className="w-16 px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-amber-400 font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/30"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Configuración General</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: FINANZAS & BALANCE */}
        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                Finanzas & Balance en Vivo
              </h2>
              <p className="text-xs text-stone-400">
                Control de facturación, comisiones de repartidores y balance del negocio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-xs text-stone-400 uppercase font-bold">Ventas Totales Entregadas</span>
                <div className="font-display text-2xl font-black text-emerald-400">
                  ${totalGrossRevenue} <span className="text-xs font-sans text-stone-400">$U</span>
                </div>
                <div className="text-[10px] text-stone-500">
                  {orders.filter(o => o.status === 'delivered').length} pedidos finalizados
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-xs text-stone-400 uppercase font-bold">Nómina Repartidores Hoy</span>
                <div className="font-display text-2xl font-black text-amber-400">
                  ${totalCommissionsOwed} <span className="text-xs font-sans text-stone-400">$U</span>
                </div>
                <div className="text-[10px] text-stone-500">
                  A liquidar al finalizar el turno
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-xs text-stone-400 uppercase font-bold">Margen Bruto Estimado</span>
                <div className="font-display text-2xl font-black text-orange-400">
                  ${Math.max(0, totalGrossRevenue - totalCommissionsOwed)} <span className="text-xs font-sans text-stone-400">$U</span>
                </div>
                <div className="text-[10px] text-stone-500">
                  Ingreso neto restando fletes de delivery
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-xs text-stone-400 uppercase font-bold">Total Pedidos en Sistema</span>
                <div className="font-display text-2xl font-black text-white">
                  {orders.length}
                </div>
                <div className="text-[10px] text-stone-500">
                  Delivery, Takeaway y Mesas
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: GOOGLE WORKSPACE (SHEETS & DRIVE) + FIREBASE CLOUD */}
        {activeTab === 'workspace' && (
          <WorkspaceSyncPanel orders={orders} employees={employees} />
        )}
      </main>
    </div>
  );
};

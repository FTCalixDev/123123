import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, LayoutDashboard, UtensilsCrossed, Tag, Users, DollarSign,
  Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, Truck,
  ArrowLeft, Search, RefreshCw, AlertTriangle, ChefHat, Flame,
  LogOut, Save, ShieldAlert, Sparkles, TrendingUp, Beer, Settings,
  Unlock, Phone, Sliders, ToggleLeft, ToggleRight, Cloud, UserCheck,
  Wallet, CreditCard, Banknote, KeyRound, Eye, EyeOff, RotateCcw
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
  const [activeTab, setActiveTab] = useState<'orders' | 'staff' | 'finances' | 'menu' | 'taps' | 'promos' | 'settings' | 'workspace'>('orders');

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
    maxFailedCodeAttempts: 3,
    featuredAnnouncement: '🔥 Happy Hour Artesanal de 19:30 a 21:30 hs — Pintas seleccionadas $150 $U'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Order Monitor Filter states
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_assign' | 'kitchen' | 'in_transit' | 'delivered' | 'fraud'>('all');
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

  // Modal for Employee Edit / Creation
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const [employeeForm, setEmployeeForm] = useState<{
    name: string;
    username: string;
    password: string;
    phone: string;
    role: 'staff' | 'delivery' | 'admin';
    status: 'pending' | 'active' | 'approved' | 'rejected';
    commissionPerDelivery: number;
  }>({
    name: '',
    username: '',
    password: '',
    phone: '+598 9',
    role: 'staff',
    status: 'active',
    commissionPerDelivery: 60,
  });

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
    isGlutenFree: false,
    available: true,
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
    kegPercentage: 100,
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
    active: true,
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
      showToast('Error sincronizando datos con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filtered orders for Global Order Monitor
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'fraud') return o.isFraudBlocked || o.status === 'fraud_alert';
    if (orderFilter === 'pending_assign') return !o.assignedTo && o.status !== 'delivered';
    if (orderFilter === 'kitchen') return ['received', 'kitchen', 'oven', 'ready'].includes(o.status);
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
        showToast(`Estado de pedido actualizado: ${newStatus}`);
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
        showToast('Pedido desbloqueado y PIN restablecido');
        fetchAllData();
      } else {
        showToast(data.error || 'Error al desbloquear pedido');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Staff approvals & updates
  const handleUpdateEmployee = async (empId: string, updates: Partial<Employee>) => {
    try {
      const res = await fetch(`/api/staff/employees/${empId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Ficha de personal actualizada');
        fetchAllData();
      } else {
        showToast(data.error || 'Error al actualizar empleado');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEmployeeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const payload: Partial<Employee> = {
          name: employeeForm.name,
          username: employeeForm.username,
          phone: employeeForm.phone,
          role: employeeForm.role,
          status: employeeForm.status,
          commissionPerDelivery: employeeForm.commissionPerDelivery,
        };
        if (employeeForm.password.trim()) {
          payload.password = employeeForm.password.trim();
        }
        const res = await fetch(`/api/staff/employees/${editingEmployee.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Datos y credenciales del empleado actualizados');
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
          fetchAllData();
        } else {
          showToast(data.error || 'Error al guardar cambios');
        }
      } else {
        // Create new employee directly from Admin and activate immediately
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: employeeForm.name,
            username: employeeForm.username,
            password: employeeForm.password,
            phone: employeeForm.phone,
          }),
        });
        const data = await res.json();
        if (res.ok && data.employee) {
          await fetch(`/api/staff/employees/${data.employee.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: employeeForm.role,
              status: employeeForm.status,
              commissionPerDelivery: employeeForm.commissionPerDelivery,
            }),
          });
          showToast('Nuevo integrante de personal dado de alta');
          setIsEmployeeModalOpen(false);
          fetchAllData();
        } else {
          showToast(data.error || 'Error al crear empleado');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    try {
      const res = await fetch(`/api/staff/employees/${empId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Cuenta de empleado eliminada');
        fetchAllData();
      } else {
        showToast(data.error || 'No se pudo eliminar la cuenta');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Menu item CRUD & Stock Toggle
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
        showToast(isEdit ? 'Plato actualizado en la carta' : 'Nuevo plato publicado en la carta');
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

  const handleToggleDishAvailability = async (dish: MenuItem) => {
    const nextAvailable = dish.available === false ? true : false;
    try {
      const res = await fetch(`/api/menu/${dish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: nextAvailable }),
      });
      if (res.ok) {
        showToast(
          nextAvailable
            ? `"${dish.name}" habilitado nuevamente en stock`
            : `"${dish.name}" pausado (Sin Stock en la carta pública)`
        );
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
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

  // Beer Taps CRUD & 100% Refill
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

  const handleRefillTapKeg = async (tap: TapBeer) => {
    try {
      const res = await fetch(`/api/taps/${tap.id}/refill`, { method: 'POST' });
      if (res.ok) {
        showToast(`Barril de Canilla #${tap.tapNumber} (${tap.name}) recargado al 100%`);
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTap = async (id: string) => {
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

  // Promos CRUD & Active Toggle
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
        showToast(data.error || 'Error al guardar promoción');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePromoActive = async (promo: Promo) => {
    const nextActive = promo.active === false ? true : false;
    try {
      const res = await fetch(`/api/promos/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      if (res.ok) {
        showToast(
          nextActive
            ? `Promoción "${promo.title}" activada en la web`
            : `Promoción "${promo.title}" ocultada temporalmente`
        );
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePromo = async (id: string) => {
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
        showToast('Configuración general del restaurante guardada');
        fetchAllData();
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Error al guardar configuración');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic Real-Time Financial Calculations
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const deliveredToday = deliveredOrders.filter((o) => {
    const t = new Date(o.deliveredAt || o.createdAt).getTime();
    return t >= startOfToday;
  });
  const deliveredThisMonth = deliveredOrders.filter((o) => {
    const t = new Date(o.deliveredAt || o.createdAt).getTime();
    return t >= startOfMonth;
  });

  const grossRevenueToday = deliveredToday.reduce((acc, o) => acc + o.total, 0);
  const grossRevenueMonth = deliveredThisMonth.reduce((acc, o) => acc + o.total, 0);
  const totalGrossRevenueAllTime = deliveredOrders.reduce((acc, o) => acc + o.total, 0);

  // Payment method breakdown ( across all delivered orders )
  const revenueByCash = deliveredOrders
    .filter((o) => o.paymentMethod.toLowerCase().includes('efectivo'))
    .reduce((acc, o) => acc + o.total, 0);

  const revenueByTransfer = deliveredOrders
    .filter((o) => {
      const m = o.paymentMethod.toLowerCase();
      return m.includes('prex') || m.includes('brou') || m.includes('transferencia');
    })
    .reduce((acc, o) => acc + o.total, 0);

  const revenueByPOS = deliveredOrders
    .filter((o) => {
      const m = o.paymentMethod.toLowerCase();
      return m.includes('pos') || m.includes('tarjeta') || m.includes('débito') || m.includes('crédito');
    })
    .reduce((acc, o) => acc + o.total, 0);

  const revenueByLocalTable = deliveredOrders
    .filter((o) => {
      const m = o.paymentMethod.toLowerCase();
      return !m.includes('efectivo') && !m.includes('prex') && !m.includes('brou') && !m.includes('transferencia') && !m.includes('pos') && !m.includes('tarjeta');
    })
    .reduce((acc, o) => acc + o.total, 0);

  const staffMembers = employees.filter((e) => e.role !== 'admin');
  const pendingSignups = employees.filter((e) => e.status === 'pending');
  const activeStaff = employees.filter((e) => e.status === 'active' || e.status === 'approved');
  const fraudOrders = orders.filter((o) => o.isFraudBlocked || o.status === 'fraud_alert');

  const totalCommissionsToday = staffMembers.reduce((acc, e) => acc + (e.earningsToday || 0), 0);
  const totalCommissionsMonth = staffMembers.reduce((acc, e) => acc + (e.earningsMonth || 0), 0);
  const totalCommissionsAllTime = staffMembers.reduce((acc, e) => acc + (e.earningsTotal || 0), 0);

  const netProfitToday = grossRevenueToday - totalCommissionsToday;
  const netProfitMonth = grossRevenueMonth - totalCommissionsMonth;
  const netProfitAllTime = totalGrossRevenueAllTime - totalCommissionsAllTime;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border-2 border-orange-500/80 text-orange-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold max-w-sm">
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
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
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
                    <span className="truncate">Dirección General POS</span>
                    <span className="text-[9px] sm:text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                      ADMIN
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
                    Sesión activa: <span className="font-bold text-amber-400">{currentUser.name}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchAllData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
                title="Refrescar datos del servidor"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={onLogout}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>1. Monitor Pedidos ({orders.length})</span>
            {fraudOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                !
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 relative cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Personal & Liquidación ({employees.length})</span>
            {pendingSignups.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {pendingSignups.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('finances')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'finances'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Finanzas & Caja en Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>4A. Carta / Stock ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('taps')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'taps'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Beer className="w-3.5 h-3.5 text-amber-400" />
            <span>4B. Canillas Birra ({taps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'promos'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>4C. Promociones ({promos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-stone-400 hover:text-white bg-stone-950/60 hover:bg-stone-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración Local</span>
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
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
        {/* =====================================================================
            TAB 1: MONITOR GLOBAL DE PEDIDOS
        ===================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                  1. Monitor Global de Pedidos & KDS
                </h2>
                <p className="text-xs text-stone-400">
                  Supervisión en tiempo real de pedidos pendientes de asignar, en cocina, en reparto con conductor asignado y finalizados.
                </p>
              </div>

              {/* Exact requested filters */}
              <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs overflow-x-auto max-w-full">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    orderFilter === 'all' ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  onClick={() => setOrderFilter('pending_assign')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    orderFilter === 'pending_assign' ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Pendientes de Asignar ({orders.filter(o => !o.assignedTo && o.status !== 'delivered').length})
                </button>
                <button
                  onClick={() => setOrderFilter('kitchen')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    orderFilter === 'kitchen' ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  En Preparación ({orders.filter(o => ['received', 'kitchen', 'oven', 'ready'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setOrderFilter('in_transit')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    orderFilter === 'in_transit' ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  En Camino ({orders.filter(o => o.status === 'in_transit').length})
                </button>
                <button
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    orderFilter === 'delivered' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Entregados ({orders.filter(o => o.status === 'delivered').length})
                </button>
                {fraudOrders.length > 0 && (
                  <button
                    onClick={() => setOrderFilter('fraud')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      orderFilter === 'fraud' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-rose-300'
                    }`}
                  >
                    Alertas Seguridad ({fraudOrders.length})
                  </button>
                )}
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.length === 0 ? (
                <div className="col-span-full py-16 text-center text-stone-500 bg-stone-900/30 rounded-3xl border border-stone-800">
                  No hay pedidos bajo el filtro seleccionado.
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
                          ? 'bg-stone-950/40 border-stone-800/60 opacity-85'
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
                              <div>BLOQUEO DE SEGURIDAD POR PIN</div>
                              <p className="text-[11px] font-normal text-rose-300 mt-0.5">
                                {order.fraudReason || 'Se superaron los intentos fallidos del PIN de entrega.'}
                              </p>
                              <button
                                onClick={() => handleUnblockOrder(order.id)}
                                className="mt-2 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Desbloquear Orden</span>
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
                              {isFraud
                                ? 'BLOQUEADO'
                                : order.status === 'received'
                                ? 'RECIBIDO'
                                : order.status === 'kitchen'
                                ? 'EN PLANCHA'
                                : order.status === 'oven'
                                ? 'HORNO DE BARRO'
                                : order.status === 'ready'
                                ? 'LISTO DESPACHO'
                                : order.status === 'in_transit'
                                ? 'EN CAMINO'
                                : 'ENTREGADO'}
                            </span>

                            <span className="text-[10px] font-bold text-stone-400 uppercase">
                              {order.type === 'delivery'
                                ? '🛵 Delivery'
                                : order.type === 'table'
                                ? `🍽️ Mesa #${order.tableNumber}`
                                : '🛍️ Retiro en Local'}
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
                              Nota cocina: {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Items list */}
                        <div className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-800/60 space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex justify-between text-stone-200 font-medium">
                                <span className="truncate">{it.quantity}x {it.name}</span>
                                <span className="font-mono text-stone-400 shrink-0">${it.price * it.quantity}</span>
                              </div>
                              {it.customNotes && (
                                <p className="text-[10px] text-amber-400/90 pl-3 italic">
                                  ↳ {it.customNotes}
                                </p>
                              )}
                            </div>
                          ))}
                          <div className="pt-1.5 border-t border-stone-800 flex justify-between font-bold text-white text-xs">
                            <span>Total ({order.paymentMethod}):</span>
                            <span className="font-mono text-amber-400">${order.total} $U</span>
                          </div>
                        </div>

                        {/* Driver Assigned Info */}
                        <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400 text-[11px]">Personal asignado:</span>
                            {order.assignedToName ? (
                              <span className="font-bold text-emerald-400 flex items-center gap-1 truncate">
                                <Truck className="w-3 h-3 shrink-0" />
                                <span className="truncate">{order.assignedToName}</span>
                              </span>
                            ) : (
                              <span className="text-amber-400/80 italic text-[11px]">Pendiente de asignar</span>
                            )}
                          </div>

                          {(order.type === 'delivery' || order.type === 'takeaway') && (
                            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
                              <span className="text-stone-400 text-[11px]">Verificación PIN 4 dígitos:</span>
                              <span className="font-mono font-bold text-stone-300 text-[11px]">
                                {order.status === 'delivered' ? '✓ Verificado' : 'Requerido al entregar'}
                              </span>
                            </div>
                          )}

                          {order.failedCodeAttempts ? (
                            <div className="text-[10px] text-rose-400 font-bold">
                              Intentos fallidos de PIN: {order.failedCodeAttempts} / 3
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* KDS & Status changer buttons */}
                      <div className="pt-3 border-t border-stone-800 mt-3 flex items-center gap-1.5 flex-wrap">
                        {order.status !== 'delivered' && !isFraud && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'kitchen')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                order.status === 'kitchen' ? 'bg-orange-500 text-stone-950 border-orange-500' : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              Plancha
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'oven')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                order.status === 'oven' ? 'bg-orange-500 text-stone-950 border-orange-500' : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              Horno Barro
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                order.status === 'ready' ? 'bg-orange-500 text-stone-950 border-orange-500' : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              Listo
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 ml-auto flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Finalizar</span>
                            </button>
                          </>
                        )}
                        {order.status === 'delivered' && (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Orden completada y contabilizada en Caja</span>
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

        {/* =====================================================================
            TAB 2: GESTIÓN DE PERSONAL, SUELDOS POR ENTREGA Y LIQUIDACIÓN DIARIA
        ===================================================================== */}
        {activeTab === 'staff' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                  2. Gestión de Personal, Sueldos por Entrega y Liquidación Diaria
                </h2>
                <p className="text-xs text-stone-400">
                  Autoriza solicitudes de alta, administra credenciales e IDs únicos, configura la tarifa por entrega y liquida los pagos del día.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setEmployeeForm({
                    name: '',
                    username: '',
                    password: '',
                    phone: '+598 9',
                    role: 'staff',
                    status: 'active',
                    commissionPerDelivery: 60,
                  });
                  setIsEmployeeModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dar de Alta Empleado</span>
              </button>
            </div>

            {/* 2.1 SOLICITUDES DE ALTA PENDIENTES */}
            <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="font-display text-sm font-bold uppercase text-white">
                    Solicitudes de Alta de Personal Pendientes ({pendingSignups.length})
                  </h3>
                </div>
                {pendingSignups.length === 0 && (
                  <span className="text-xs text-stone-400 hidden sm:inline">Sin solicitudes pendientes</span>
                )}
              </div>

              {pendingSignups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingSignups.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-4 rounded-2xl bg-stone-950 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{emp.name}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-800">
                            ID: {emp.id}
                          </span>
                        </div>
                        <div className="text-xs text-stone-300">
                          Usuario: <span className="font-mono font-bold text-amber-300">@{emp.username}</span> • Tel: {emp.phone || 'No especificado'}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Solicitud enviada: {new Date(emp.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleUpdateEmployee(emp.id, { status: 'active' })}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar y Activar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="px-3 py-2 rounded-xl bg-rose-950 text-rose-300 hover:bg-rose-900 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Rechazar solicitud"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  Cuando un repartidor o mozo complete el formulario de "Solicitar Alta de Empleado", aparecerá aquí bloqueado hasta que autorices su ingreso.
                </p>
              )}
            </div>

            {/* 2.2 TABLA DE RENDIMIENTO, SUELDOS POR ENTREGA Y LIQUIDACIÓN DIARIA */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold uppercase text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-500" />
                    <span>Directorio de Personal, Tarifa por Entrega y Liquidación en $U</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Ajusta la comisión individual por pedido entregado y consulta el monto exacto a abonar en el cierre del día.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-bold text-amber-400">
                  Total a Liquidar Hoy: <span className="font-mono text-sm">${totalCommissionsToday} $U</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-[10px] uppercase text-stone-400">
                      <th className="py-3 px-3">ID / Empleado</th>
                      <th className="py-3 px-3">Credenciales / Estado</th>
                      <th className="py-3 px-3">Tarifa x Entrega ($U)</th>
                      <th className="py-3 px-3 text-center">Hoy</th>
                      <th className="py-3 px-3 text-center">Semana</th>
                      <th className="py-3 px-3 text-center">Mes</th>
                      <th className="py-3 px-3 text-center">Histórico</th>
                      <th className="py-3 px-3 text-right">Liquidación Hoy ($U)</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/70">
                    {employees.map((emp) => {
                      const rate = emp.commissionPerDelivery ?? 60;
                      const delToday = emp.deliveriesToday || 0;
                      const delWeek = emp.deliveriesWeek || 0;
                      const delMonth = emp.deliveriesMonth || 0;
                      const delTotal = emp.deliveriesTotal || 0;
                      const payoutToday = emp.earningsToday ?? delToday * rate;
                      const isPassVisible = !!revealedPasswords[emp.id];

                      return (
                        <tr key={emp.id} className="hover:bg-stone-950/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              {emp.role === 'admin' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase font-black">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              ID: {emp.id} • {emp.phone || 'Sin tel'}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-amber-400 font-bold">@{emp.username}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                  emp.status === 'active' || emp.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : emp.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {emp.status === 'active' || emp.status === 'approved' ? 'Activo' : emp.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                              <span>Clave:</span>
                              <span className="font-mono text-stone-300">
                                {isPassVisible ? emp.password || '---' : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedPasswords((prev) => ({ ...prev, [emp.id]: !prev[emp.id] }))
                                }
                                className="text-stone-500 hover:text-amber-400 cursor-pointer"
                                title={isPassVisible ? 'Ocultar clave' : 'Ver clave configurada'}
                              >
                                {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {emp.role === 'admin' ? (
                              <span className="text-stone-500 text-[11px]">Dirección</span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-stone-400 font-mono">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={10}
                                  value={rate}
                                  onChange={(e) =>
                                    handleUpdateEmployee(emp.id, {
                                      commissionPerDelivery: Math.max(0, parseInt(e.target.value, 10) || 0),
                                    })
                                  }
                                  className="w-20 px-2 py-1 rounded-lg bg-stone-950 border border-stone-800 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                                />
                                <span className="text-[10px] text-stone-500">$U</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center font-mono font-bold text-white">
                            {delToday}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-stone-300">
                            {delWeek}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-stone-300">
                            {delMonth}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-amber-400 font-bold">
                            {delTotal}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {emp.role === 'admin' ? (
                              <span className="text-stone-500">—</span>
                            ) : (
                              <div>
                                <span className="font-mono font-black text-emerald-400 text-sm">
                                  ${payoutToday} $U
                                </span>
                                <div className="text-[10px] text-stone-500 font-mono">
                                  Acum. Mes: ${emp.earningsMonth ?? delMonth * rate} $U
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setEmployeeForm({
                                    name: emp.name,
                                    username: emp.username,
                                    password: emp.password || '',
                                    phone: emp.phone || '+598 9',
                                    role: emp.role,
                                    status: emp.status,
                                    commissionPerDelivery: emp.commissionPerDelivery ?? 60,
                                  });
                                  setIsEmployeeModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-amber-400" />
                                <span>Editar</span>
                              </button>

                              {emp.username.toLowerCase() !== 'calix' && (
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  title="Eliminar empleado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Create / Edit Employee & Credentials */}
            {isEmployeeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
                <div
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <h3 className="font-display text-base font-bold uppercase text-white">
                      {editingEmployee
                        ? `Modificar Personal (${editingEmployee.id})`
                        : 'Alta Directa de Personal'}
                    </h3>
                    <button
                      onClick={() => setIsEmployeeModalOpen(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEmployeeModal} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-stone-400 font-bold uppercase mb-1">
                        Nombre y Apellido:
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeForm.name}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                        placeholder="Nombre completo del trabajador"
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">
                          Usuario de Acceso:
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeForm.username}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, username: e.target.value })
                          }
                          placeholder="usuario.staff"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">
                          Contraseña / Clave:
                        </label>
                        <input
                          type="text"
                          required={!editingEmployee}
                          value={employeeForm.password}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, password: e.target.value })
                          }
                          placeholder={editingEmployee ? 'Sin cambios si vacío' : 'Asignar clave'}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">
                          Teléfono / Celular:
                        </label>
                        <input
                          type="text"
                          value={employeeForm.phone}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, phone: e.target.value })
                          }
                          placeholder="+598 99 000 000"
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">
                          Tarifa x Entrega ($U):
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={employeeForm.commissionPerDelivery}
                          onChange={(e) =>
                            setEmployeeForm({
                              ...employeeForm,
                              commissionPerDelivery: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">
                          Rol en el Sistema:
                        </label>
                        <select
                          value={employeeForm.role}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, role: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                        >
                          <option value="staff">Staff (Repartidor / Mozo)</option>
                          <option value="delivery">Repartidor Exclusivo</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-stone-400 font-bold uppercase mb-1">
                          Estado de Cuenta:
                        </label>
                        <select
                          value={employeeForm.status}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, status: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                        >
                          <option value="active">Activo (Autorizado)</option>
                          <option value="pending">Pendiente de Aprobación</option>
                          <option value="rejected">Suspendido / Bloqueado</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEmployeeModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Ficha</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 3: FINANZAS Y CAJA EN VIVO
        ===================================================================== */}
        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                3. Finanzas y Arqueo de Caja en Vivo ($U)
              </h2>
              <p className="text-xs text-stone-400">
                Contabilidad dinámica en tiempo real calculada sobre órdenes reales entregadas, métodos de cobro y comisiones de reparto.
              </p>
            </div>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-bold">
                  Ingresos Brutos (Hoy / Mes)
                </span>
                <div className="font-mono text-2xl font-black text-white">
                  ${grossRevenueToday} <span className="text-xs font-sans text-stone-400">$U hoy</span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono">
                  Mes actual: <strong className="text-stone-200">${grossRevenueMonth} $U</strong> • Histórico: ${totalGrossRevenueAllTime} $U
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-bold">
                  Costo Comisiones Repartidores
                </span>
                <div className="font-mono text-2xl font-black text-amber-400">
                  -${totalCommissionsToday} <span className="text-xs font-sans text-stone-400">$U hoy</span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono">
                  Acumulado Mes: -${totalCommissionsMonth} $U • Total: -${totalCommissionsAllTime} $U
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-emerald-950/25 border border-emerald-500/40 space-y-1">
                <span className="text-[11px] text-emerald-300 uppercase font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ganancia Neta Real (Hoy)</span>
                </span>
                <div className="font-mono text-2xl font-black text-emerald-400">
                  ${netProfitToday} <span className="text-xs font-sans text-emerald-300">$U</span>
                </div>
                <p className="text-[11px] text-emerald-300/80 font-mono">
                  Neta Mes: <strong>${netProfitMonth} $U</strong> • Neta Total: <strong>${netProfitAllTime} $U</strong>
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-bold">
                  Órdenes Contabilizadas
                </span>
                <div className="font-mono text-2xl font-black text-orange-400">
                  {deliveredOrders.length} <span className="text-xs font-sans text-stone-400">entregadas</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  En curso ahora: {orders.filter(o => o.status !== 'delivered').length} comandas
                </p>
              </div>
            </div>

            {/* Breakdown by Payment Method */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
              <h3 className="font-display text-sm font-bold uppercase text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Desglose de Caja por Método de Pago (Órdenes Entregadas)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Efectivo en Caja</span>
                    <span className="font-mono text-lg font-black text-emerald-400">${revenueByCash} $U</span>
                  </div>
                  <Banknote className="w-6 h-6 text-emerald-500/50" />
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Transferencia Prex / BROU</span>
                    <span className="font-mono text-lg font-black text-amber-400">${revenueByTransfer} $U</span>
                  </div>
                  <Wallet className="w-6 h-6 text-amber-500/50" />
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">POS / Débito / Crédito</span>
                    <span className="font-mono text-lg font-black text-orange-400">${revenueByPOS} $U</span>
                  </div>
                  <CreditCard className="w-6 h-6 text-orange-500/50" />
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Salón / Barra Directa</span>
                    <span className="font-mono text-lg font-black text-stone-200">${revenueByLocalTable} $U</span>
                  </div>
                  <Beer className="w-6 h-6 text-stone-500/50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4A: CMS DINÁMICO DE LA CARTA (CON PAUSA DE STOCK)
        ===================================================================== */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                  4A. Gestor de Carta, Precios y Stock en Vivo
                </h2>
                <p className="text-xs text-stone-400">
                  Crea nuevos platos, ajusta precios e ingredientes o pausa platos agotados sin borrarlos de la base de datos.
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
                    isGlutenFree: false,
                    available: true,
                  });
                  setIsCreatingMenuItem(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all shrink-0 cursor-pointer"
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
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
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
                .map((dish) => {
                  const isAvailable = dish.available !== false;
                  return (
                    <div
                      key={dish.id}
                      className={`bg-stone-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-colors ${
                        isAvailable
                          ? 'border-stone-800 hover:border-orange-500/40'
                          : 'border-rose-900/60 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="relative h-40 w-full overflow-hidden bg-stone-950">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className={`w-full h-full object-cover transition-transform duration-300 ${
                              isAvailable ? 'group-hover:scale-105' : 'grayscale'
                            }`}
                          />
                          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-sm text-stone-200 border border-stone-700">
                              {dish.category}
                            </span>
                            {!isAvailable ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                                PAUSADO / SIN STOCK
                              </span>
                            ) : (
                              dish.badge && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-600 text-white">
                                  {dish.badge}
                                </span>
                              )
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
                          <div className="flex items-center justify-between gap-1.5 py-1 text-[11px] text-stone-400">
                            <span>Ajuste rápido:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuickPriceAdjust(dish.id, dish.price, -20)}
                                className="px-2 py-0.5 bg-stone-950 rounded border border-stone-800 hover:text-white cursor-pointer"
                              >
                                -$20
                              </button>
                              <button
                                onClick={() => handleQuickPriceAdjust(dish.id, dish.price, +20)}
                                className="px-2 py-0.5 bg-stone-950 rounded border border-stone-800 hover:text-white cursor-pointer"
                              >
                                +$20
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-stone-400 line-clamp-2">
                            {dish.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-2 flex items-center justify-between border-t border-stone-800/80 gap-2">
                        <button
                          onClick={() => handleToggleDishAvailability(dish)}
                          className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            isAvailable
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                          title="Pausar o activar stock de este plato"
                        >
                          {isAvailable ? (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              <span>En Stock</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              <span>Agotado</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingMenuItem(dish);
                              setMenuForm({ ...dish, available: dish.available !== false });
                              setIsCreatingMenuItem(true);
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleDeleteMenuItem(dish.id)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Eliminar plato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal: Create / Edit Dish */}
            {isCreatingMenuItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
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
                      className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
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
                        placeholder="Ej. Doble Smash Bacon"
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
                        placeholder="Doble medallón 110g, queso cheddar fundido, panceta crujiente..."
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-emerald-400 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.available !== false}
                          onChange={(e) => setMenuForm({ ...menuForm, available: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>Disponible en Stock</span>
                      </label>
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
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold hover:bg-stone-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/30 cursor-pointer"
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

        {/* =====================================================================
            TAB 4B: GESTIÓN DE CANILLAS DE BIRRA (CON RECARGA 100%)
        ===================================================================== */}
        {activeTab === 'taps' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white flex items-center gap-2">
                  <Beer className="w-5 h-5 text-amber-400" />
                  <span>4B. Pizarra de Canillas & Control de Barriles</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Recarga barriles al 100% con un clic, cambia la cerveza conectada en cada canilla y ajusta ABV, IBU y precios.
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
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all shrink-0 cursor-pointer"
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
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        CANILLA #{tap.tapNumber}
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
                      <p className="text-[11px] text-amber-300 font-medium truncate">
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

                    {/* Barril restante + Botón Recargar al 100% */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-stone-400">
                        <span>Nivel de Barril:</span>
                        <span className={tap.kegPercentage < 20 ? 'text-rose-400' : 'text-amber-400'}>
                          {tap.kegPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all ${
                            tap.kegPercentage < 20 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${tap.kegPercentage}%` }}
                        />
                      </div>

                      <button
                        onClick={() => handleRefillTapKeg(tap)}
                        disabled={tap.kegPercentage === 100}
                        className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          tap.kegPercentage === 100
                            ? 'bg-stone-950 text-stone-600 border border-stone-800 cursor-not-allowed'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{tap.kegPercentage === 100 ? 'Barril al 100%' : 'Recargar Barril al 100%'}</span>
                      </button>
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
                      className="py-1 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Cambiar / Editar</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTap(tap.id)}
                      className="p-1 rounded-lg text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
                <div
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <h3 className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                      <Beer className="w-4 h-4 text-amber-400" />
                      <span>{editingTap ? `Configurar Canilla #${editingTap.tapNumber}` : 'Nueva Canilla en Pizarra'}</span>
                    </h3>
                    <button
                      onClick={() => setIsCreatingTap(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
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
                        <label className="block text-stone-400 font-bold uppercase mb-1">Cerveza Conectada:</label>
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
                        <span className="font-mono font-bold text-amber-400">{tapForm.kegPercentage ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tapForm.kegPercentage ?? 100}
                        onChange={(e) => setTapForm({ ...tapForm, kegPercentage: parseInt(e.target.value, 10) })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingTap(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold hover:bg-stone-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
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

        {/* =====================================================================
            TAB 4C: GESTIÓN DE PROMOCIONES Y BANNERS (CON ACTIVAR/DESACTIVAR)
        ===================================================================== */}
        {activeTab === 'promos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                  4C. Gestor de Promociones & Combos (CMS)
                </h2>
                <p className="text-xs text-stone-400">
                  Crea, edita y activa o desactiva promociones dinámicamente en la web pública de clientes.
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
                    active: true,
                  });
                  setIsCreatingPromo(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Promoción</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {promos.map((pr) => {
                const isActive = pr.active !== false;
                return (
                  <div
                    key={pr.id}
                    className={`bg-stone-900 border rounded-3xl overflow-hidden flex flex-col justify-between group transition-colors ${
                      isActive ? 'border-stone-800 hover:border-amber-500/40' : 'border-rose-900/50 opacity-70'
                    }`}
                  >
                    <div className="relative h-44 overflow-hidden bg-stone-950">
                      <img
                        src={pr.image}
                        alt={pr.title}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isActive ? 'group-hover:scale-105' : 'grayscale'
                        }`}
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-orange-600 text-white font-bold text-[10px] uppercase shadow">
                          {pr.discount}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-sm text-amber-300 font-bold text-[10px] uppercase border border-amber-500/30">
                          {isActive ? pr.pill : 'INACTIVA / OCULTA'}
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

                    <div className="p-4 bg-stone-950/60 border-t border-stone-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTogglePromoActive(pr)}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>Activa</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>Inactiva</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingPromo(pr);
                            setPromoForm({ ...pr, active: pr.active !== false });
                            setIsCreatingPromo(true);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDeletePromo(pr.id)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar promo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal: Create / Edit Promo */}
            {isCreatingPromo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
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
                      className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
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
                        placeholder="Descripción detallada..."
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

                    <label className="flex items-center gap-2 text-emerald-400 font-bold cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={promoForm.active !== false}
                        onChange={(e) => setPromoForm({ ...promoForm, active: e.target.checked })}
                      />
                      <span>Promoción activa y visible para clientes</span>
                    </label>

                    <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingPromo(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
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

        {/* =====================================================================
            TAB 5: CONFIGURACIÓN DEL LOCAL Y ANUNCIOS DESTACADOS
        ===================================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                <span>Configuración Operativa & Banner Destacado</span>
              </h2>
              <p className="text-xs text-stone-400">
                Configura anuncios destacados, costo de envío, horarios de atención y parámetros de seguridad PIN.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-amber-400 font-bold uppercase mb-1">
                  Anuncio / Banner Destacado en Portada Web:
                </label>
                <input
                  type="text"
                  value={settings.featuredAnnouncement || ''}
                  onChange={(e) => setSettings({ ...settings, featuredAnnouncement: e.target.value })}
                  placeholder="Ej. 🔥 Happy Hour Artesanal de 19:30 a 21:30 hs — Pintas seleccionadas $150 $U"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-amber-500/40 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Nombre Comercial:</label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Eslogan:</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Dirección Física:</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Tarifa Envío ($U):</label>
                  <input
                    type="number"
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings({ ...settings, deliveryFee: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Compra Mínima ($U):</label>
                  <input
                    type="number"
                    value={settings.minOrderAmount}
                    onChange={(e) => setSettings({ ...settings, minOrderAmount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase mb-1">Intentos Máx. PIN:</label>
                  <input
                    type="number"
                    value={settings.maxFailedCodeAttempts}
                    onChange={(e) => setSettings({ ...settings, maxFailedCodeAttempts: parseInt(e.target.value, 10) || 3 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Configuración</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: GOOGLE WORKSPACE (SHEETS & DRIVE) */}
        {activeTab === 'workspace' && (
          <WorkspaceSyncPanel
            orders={orders}
            employees={employees}
          />
        )}
      </main>
    </div>
  );
};

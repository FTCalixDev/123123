export type MenuCategory = 'todos' | 'burgers' | 'pizzas' | 'picadas' | 'bebidas' | 'postres';
export type AppViewMode = 'customer' | 'delivery' | 'admin';

export interface MenuItem {
  id: string;
  name: string;
  category: 'burgers' | 'pizzas' | 'picadas' | 'bebidas' | 'postres';
  price: number;
  description: string;
  image: string;
  badge?: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  isVeggie?: boolean;
  isGlutenFree?: boolean;
  cookingTime?: string;
  ingredients: string[];
  pairingSuggestion?: string;
}

export interface TapBeer {
  id: string;
  tapNumber: number;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  ibu: number;
  temperature: string;
  kegPercentage: number;
  pricePinta: number;
  priceGrowler: number;
  status: 'activa' | 'ultimas_pintas' | 'proximo_barril';
  color: string;
  tastingNotes: string[];
  foodPairing: string;
}

export interface Promo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  priceNow: number;
  priceOld: number;
  discount: string;
  pill: string;
  image: string;
  badge: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  customNotes?: string;
  category?: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  openingHours: string;
  happyHour: string;
  deliveryFee: number;
  isOpen: boolean;
  minOrderAmount: number;
  requirePhoneValidation: boolean;
  maxFailedCodeAttempts: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'delivery' | 'takeaway' | 'table';
  tableNumber?: number;
  verificationCode?: string; // Secret 4-digit verification code
  assignedTo?: string; // Employee ID claiming the order
  assignedToName?: string; // Driver / Waiter name
  claimedAt?: string;
  deliveredAt?: string;
  deliveryCommission?: number;
  failedCodeAttempts?: number;
  isFraudBlocked?: boolean;
  fraudReason?: string;
  customer: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'received' | 'kitchen' | 'oven' | 'ready' | 'in_transit' | 'delivered' | 'cancelled' | 'fraud_alert';
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  estimatedMinutes?: number;
  clientIp?: string;
}

export interface Employee {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'delivery' | 'staff';
  status: 'pending' | 'approved' | 'rejected';
  commissionPerDelivery: number;
  phone?: string;
  createdAt: string;
  deliveriesToday?: number;
  deliveriesWeek?: number;
  deliveriesMonth?: number;
  deliveriesTotal?: number;
  earningsToday?: number;
  earningsTotal?: number;
}

export interface Reservation {
  id: string;
  resNumber: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  zone: string;
  occasion: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  dish: string;
  comment: string;
  verified: boolean;
  avatar: string;
}

export interface SommelierRecommendation {
  beerName: string;
  dishName: string;
  whyItWorks: string;
  tastingNotes: string[];
  servingTemp: string;
}

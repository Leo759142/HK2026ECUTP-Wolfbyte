export type Category = 
  | 'food' 
  | 'shop' 
  | 'leisure' 
  | 'health' 
  | 'service' 
  | 'culture' 
  | 'nature';

export interface CategoryMeta {
  id: Category;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORIES_CONFIG: Record<Category, CategoryMeta> = {
  food: {
    id: 'food',
    label: 'Comida & Bebida',
    emoji: '🍔',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
  },
  shop: {
    id: 'shop',
    label: 'Tiendas & Mercado',
    emoji: '🛍️',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/40',
  },
  leisure: {
    id: 'leisure',
    label: 'Ocio & Entretenimiento',
    emoji: '🎉',
    color: '#ec4899',
    bgColor: 'bg-pink-500/15',
    borderColor: 'border-pink-500/40',
  },
  health: {
    id: 'health',
    label: 'Salud & Bienestar',
    emoji: '💊',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
  },
  service: {
    id: 'service',
    label: 'Servicios & Oficinas',
    emoji: '🔧',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/40',
  },
  culture: {
    id: 'culture',
    label: 'Cultura & Turismo',
    emoji: '🏛️',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
  },
  nature: {
    id: 'nature',
    label: 'Parques & Naturaleza',
    emoji: '🌳',
    color: '#14b8a6',
    bgColor: 'bg-teal-500/15',
    borderColor: 'border-teal-500/40',
  },
};

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number; // en metros
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1 a 5
  comment: string;
  date: string;
}

export interface POI {
  id: string;
  name: string;
  category: Category;
  description: string;
  coords: Coordinates;
  address?: string;
  phone?: string;
  website?: string;
  rating: number; // 1 a 5 con precisión decimal (ej. 4.8)
  reviewsCount?: number;
  reviews?: Review[];
  tags?: string[];
  isFavorite?: boolean;
  createdAt: number;
  updatedAt?: number;
  distance?: number; // calculado dinámicamente respecto al usuario (en km)
}

export type GeoProvider = 'gps' | 'ip' | 'manual' | 'simulated';

export interface UserLocation {
  coords: Coordinates;
  provider: GeoProvider;
  timestamp: number;
  city?: string;
  country?: string;
  ip?: string;
}

export type SortOption = 'distance' | 'rating' | 'newest' | 'name';

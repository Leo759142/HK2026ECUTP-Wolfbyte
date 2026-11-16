export type Category =
  | 'food'
  | 'shop'
  | 'leisure'
  | 'health'
  | 'service'
  | 'culture'
  | 'nature';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
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
  rating: number;
  reviewsCount?: number;
  reviews?: Review[];
  tags?: string[];
  isFavorite?: boolean;
  createdAt: number;
  updatedAt?: number;
  distance?: number;
}

export type GeoProvider = 'gps' | 'ip' | 'manual' | 'cached';

export interface UserLocation {
  coords: Coordinates;
  provider: GeoProvider;
  timestamp: number;
  city?: string;
  country?: string;
  ip?: string;
  fullAddress?: string;
  provinciaId?: string;
  distritoId?: string;
}

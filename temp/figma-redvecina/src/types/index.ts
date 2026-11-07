/**
 * Core type definitions for RedVecina PWA
 */

export type UserRole = 'vecino' | 'oficio' | 'coordinador';

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: UserRole;
  neighborhood: string;
  streetAddress?: string;
  bio?: string;
  verifiedNeighbor: boolean;
  solidarityPoints: number; // Puntos de buena vecindad
  tradeSpecialty?: string;
}

export type ServiceCategory = 
  | 'gasfiteria' 
  | 'electricidad' 
  | 'carpinteria' 
  | 'cerrajeria' 
  | 'cuidados' 
  | 'clases' 
  | 'costura' 
  | 'tecnologia' 
  | 'otros';

export interface NeighborReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerNeighborhood: string;
  date: string;
  comment: string;
  rating: number; // 1 to 5 stars
  workDone: string;
}

export interface NeighborhoodService {
  id: string;
  userId: string;
  providerName: string;
  providerPhone: string;
  providerAvatar: string;
  neighborhood: string;
  category: ServiceCategory;
  title: string;
  description: string;
  experienceYears: number;
  vistoBuenoCount: number; // Conteo de Visto Bueno Vecinal
  reviews: NeighborReview[];
  emergencyAvailable: boolean; // Disponible para emergencias críticas
  distanceBlocks: number; // Cuadras de distancia aproximadas
  coordinates: { x: number; y: number }; // Posición relativa en mapa barrial (0-100)
  createdAt: string;
}

export type FavorCategory = 
  | 'herramientas' 
  | 'ayuda_temporal' 
  | 'donacion' 
  | 'habilidades' 
  | 'movilidad' 
  | 'alimentos_botiquin';

export type FavorType = 'necesito' | 'ofrezco';
export type FavorStatus = 'abierto' | 'en_curso' | 'completado';

export interface SolidarityFavor {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAvatar: string;
  neighborhood: string;
  type: FavorType;
  category: FavorCategory;
  title: string;
  description: string;
  status: FavorStatus;
  urgency: 'baja' | 'media' | 'alta';
  acceptedBy?: {
    userId: string;
    userName: string;
    message?: string;
    acceptedAt: string;
  };
  thankYouMessage?: string;
  distanceBlocks: number;
  coordinates: { x: number; y: number };
  createdAt: string;
}

export type AlertUrgency = 'critica' | 'alta' | 'media';
export type AlertCategory = 
  | 'adulto_vulnerable' 
  | 'agua_potable' 
  | 'medica' 
  | 'danos_vivienda' 
  | 'centro_acopio' 
  | 'olla_comun';

export interface HumanitarianAlert {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  neighborhood: string;
  title: string;
  description: string;
  urgency: AlertUrgency;
  category: AlertCategory;
  locationReference: string;
  peopleAffected?: number;
  resourcesNeeded: string[];
  resourcesProvided: string[];
  resolved: boolean;
  officialValidation: boolean; // Validado por Coordinador Comunal
  coordinates: { x: number; y: number };
  createdAt: string;
}

export interface OfflineAction {
  id: string;
  type: 'create_service' | 'create_favor' | 'create_alert' | 'visto_bueno' | 'accept_favor';
  payload: any;
  timestamp: number;
}

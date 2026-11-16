import type { Coordinates, POI, Review } from '../types/poi';

const STORAGE_KEY = 'geosocial_pois_v2';

// POIs iniciales predeterminados (Lima histórica / Centro) con datos ricos
const BASE_DEFAULT_POIS: POI[] = [
  {
    id: 'poi-1',
    name: 'Café & Tostaduría La Casona',
    category: 'food',
    description: 'Café de especialidad peruano de origen Cuzco y Cajamarca, repostería artesanal y terraza.',
    coords: { lat: -12.04752, lng: -77.03985 },
    address: 'Jirón Carabaya 450, Centro',
    rating: 4.9,
    reviewsCount: 38,
    tags: ['café', 'artesanal', 'brunch', 'wifi'],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'poi-2',
    name: 'Mercado Ecológico San Martín',
    category: 'shop',
    description: 'Frutas orgánicas, granos andinos, quesos madurados y artesanías locales directo del productor.',
    coords: { lat: -12.04912, lng: -77.04321 },
    address: 'Av. Nicolás de Piérola 780',
    rating: 4.7,
    reviewsCount: 24,
    tags: ['orgánico', 'mercado', 'frutas', 'vegano'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'poi-3',
    name: 'Teatro & Centro Cultural Colón',
    category: 'culture',
    description: 'Teatro restaurado con cartelera de música en vivo, cine independiente y exposiciones de arte.',
    coords: { lat: -12.04515, lng: -77.0381 },
    address: 'Plaza San Martín 120',
    rating: 4.8,
    reviewsCount: 52,
    tags: ['teatro', 'arte', 'conciertos', 'historia'],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'poi-4',
    name: 'Farmacia & Botica Central',
    category: 'health',
    description: 'Atención farmacéutica 24 horas, productos dermatológicos y botiquín de primeros auxilios.',
    coords: { lat: -12.04618, lng: -77.04105 },
    address: 'Jirón Huancavelica 210',
    rating: 4.5,
    reviewsCount: 19,
    tags: ['24h', 'medicinas', 'urgencias'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'poi-5',
    name: 'Parque de la Alameda & Fuentes',
    category: 'nature',
    description: 'Área verde arbolada con ciclovía, bancas para lectura, juegos infantiles y fuentes iluminadas.',
    coords: { lat: -12.0429, lng: -77.0425 },
    address: 'Alameda de los Descalzos',
    rating: 4.6,
    reviewsCount: 41,
    tags: ['parque', 'árboles', 'mascotas', 'aire libre'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'poi-6',
    name: 'Club Bowling & Arcade Retro',
    category: 'leisure',
    description: 'Pistas de bowling, máquinas arcade de los 90s, billar y cervezas artesanales.',
    coords: { lat: -12.05105, lng: -77.03795 },
    address: 'Av. Tacna 890',
    rating: 4.4,
    reviewsCount: 30,
    tags: ['bowling', 'juegos', 'amigos', 'noche'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'poi-7',
    name: 'Taller & Cerrajería Exprés',
    category: 'service',
    description: 'Duplicado de llaves magnéticas, cerrajería automotriz y reparación rápida de cerraduras.',
    coords: { lat: -12.0488, lng: -77.0459 },
    address: 'Jirón Ica 340',
    rating: 4.8,
    reviewsCount: 16,
    tags: ['cerrajería', 'urgencias', 'llaves'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 1,
  },
];

export class PoiStorageService {
  /**
   * Obtiene todos los POIs desde LocalStorage
   */
  public static getAll(): POI[] {
    if (typeof window === 'undefined') return BASE_DEFAULT_POIS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Manejar error silenciosamente
    }
    // Guardar los predeterminados en primera ejecución
    this.saveAll(BASE_DEFAULT_POIS);
    return BASE_DEFAULT_POIS;
  }

  /**
   * Persiste la lista completa en LocalStorage
   */
  public static saveAll(pois: POI[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pois));
    } catch (e) {
      console.error('Error al guardar POIs en LocalStorage:', e);
    }
  }

  /**
   * Crear un nuevo POI (RF-04)
   */
  public static create(item: Omit<POI, 'id' | 'createdAt'>): POI {
    const pois = this.getAll();
    const newPoi: POI = {
      ...item,
      id: `poi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      rating: item.rating ?? 5,
      reviewsCount: item.reviewsCount ?? 1,
      isFavorite: item.isFavorite ?? false,
      tags: item.tags ?? [],
    };
    const updated = [newPoi, ...pois];
    this.saveAll(updated);
    return newPoi;
  }

  /**
   * Actualizar un POI existente (RF-04)
   */
  public static update(id: string, partial: Partial<POI>): POI | null {
    const pois = this.getAll();
    const index = pois.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedPoi: POI = {
      ...pois[index],
      ...partial,
      updatedAt: Date.now(),
    };
    pois[index] = updatedPoi;
    this.saveAll(pois);
    return updatedPoi;
  }

  /**
   * Eliminar un POI (RF-04)
   */
  public static delete(id: string): boolean {
    const pois = this.getAll();
    const filtered = pois.filter((p) => p.id !== id);
    if (filtered.length !== pois.length) {
      this.saveAll(filtered);
      return true;
    }
    return false;
  }

  /**
   * Alternar favorito
   */
  public static toggleFavorite(id: string): boolean {
    const pois = this.getAll();
    const item = pois.find((p) => p.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      this.saveAll(pois);
      return item.isFavorite;
    }
    return false;
  }

  /**
   * Añadir una reseña comunitaria y recalcular promedio de estrellas sin anomalías (CU-05)
   */
  public static addReview(poiId: string, reviewData: Omit<Review, 'id' | 'date'>): POI | null {
    const pois = this.getAll();
    const poi = pois.find((p) => p.id === poiId);
    if (!poi) return null;

    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userName: reviewData.userName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: 'Hoy',
    };

    const currentReviews = poi.reviews || [];
    const updatedReviews = [newReview, ...currentReviews];

    // Recalcular promedio de estrellas exacto acotado en [1.0, 5.0]
    const totalScore = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newRating = Math.round((totalScore / updatedReviews.length) * 10) / 10;

    poi.reviews = updatedReviews;
    poi.reviewsCount = updatedReviews.length;
    poi.rating = Math.max(1, Math.min(5, newRating));
    poi.updatedAt = Date.now();

    this.saveAll(pois);
    return poi;
  }

  /**
   * Genera puntos de muestra adaptativos alrededor de las coordenadas del usuario
   * para que el mapa muestre inmediatamente lugares relevantes sin importar en qué ciudad esté.
   */
  public static seedAroundCoordinates(center: Coordinates, labelCity: string = 'Local'): POI[] {
    const delta = 0.007; // ~700m a 1km de radio
    const seeded: POI[] = [
      {
        id: `poi-seed-1-${Date.now()}`,
        name: `Bistró & Café Central (${labelCity})`,
        category: 'food',
        description: 'Desayunos campestres, café recién tostado y platos del día con ingredientes frescos.',
        coords: { lat: center.lat + delta * 0.4, lng: center.lng + delta * 0.3 },
        address: `Zona Centro, ${labelCity}`,
        rating: 4.9,
        reviewsCount: 15,
        tags: ['café', 'brunch', 'terraza'],
        isFavorite: true,
        createdAt: Date.now(),
      },
      {
        id: `poi-seed-2-${Date.now()}`,
        name: `Supermercado & Delicatessen`,
        category: 'shop',
        description: 'Abarrotes, panadería del día, productos gourmet y artículos de primera necesidad.',
        coords: { lat: center.lat - delta * 0.5, lng: center.lng - delta * 0.4 },
        address: `Avenida Principal, ${labelCity}`,
        rating: 4.7,
        reviewsCount: 22,
        tags: ['mercado', 'alimentos', 'compras'],
        isFavorite: false,
        createdAt: Date.now(),
      },
      {
        id: `poi-seed-3-${Date.now()}`,
        name: `Parque de la Paz & Paseo Arbolado`,
        category: 'nature',
        description: 'Sendero peatonal con árboles centenarios, bancas de descanso y zona para trotar.',
        coords: { lat: center.lat + delta * 0.6, lng: center.lng - delta * 0.5 },
        address: `Paseo Ecológico, ${labelCity}`,
        rating: 4.8,
        reviewsCount: 31,
        tags: ['parque', 'naturaleza', 'deportes'],
        isFavorite: false,
        createdAt: Date.now(),
      },
      {
        id: `poi-seed-4-${Date.now()}`,
        name: `Farmacia Comunitaria 24h`,
        category: 'health',
        description: 'Medicamentos genéricos y de marca, toma de presión y atención farmacéutica continuada.',
        coords: { lat: center.lat - delta * 0.3, lng: center.lng + delta * 0.6 },
        address: `Calle Salud 102, ${labelCity}`,
        rating: 4.6,
        reviewsCount: 18,
        tags: ['farmacia', 'salud', '24h'],
        isFavorite: false,
        createdAt: Date.now(),
      },
      {
        id: `poi-seed-5-${Date.now()}`,
        name: `Centro Cultural & Galería`,
        category: 'culture',
        description: 'Espacio de exposiciones de artes plásticas, talleres de lectura y presentaciones acústicas.',
        coords: { lat: center.lat + delta * 0.2, lng: center.lng - delta * 0.7 },
        address: `Calle Mayor 45, ${labelCity}`,
        rating: 4.9,
        reviewsCount: 27,
        tags: ['cultura', 'arte', 'libros'],
        isFavorite: true,
        createdAt: Date.now(),
      },
    ];

    const current = this.getAll();
    const merged = [...seeded, ...current];
    this.saveAll(merged);
    return merged;
  }

  /**
   * Exporta todos los POIs a formato JSON para backup o compartir
   */
  public static exportJson(): string {
    const pois = this.getAll();
    return JSON.stringify(pois, null, 2);
  }

  /**
   * Importa POIs desde un JSON
   */
  public static importJson(jsonStr: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'El archivo no contiene un arreglo válido de POIs.' };
      }
      // Validar estructura básica
      const validPois: POI[] = parsed.filter(
        (p) => p && typeof p.name === 'string' && p.coords && typeof p.coords.lat === 'number' && typeof p.coords.lng === 'number'
      );
      if (validPois.length === 0) {
        return { success: false, count: 0, error: 'No se encontraron POIs con formato válido (nombre y coordenadas).' };
      }
      this.saveAll(validPois);
      return { success: true, count: validPois.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Error al procesar JSON.' };
    }
  }

  /**
   * Restablece los datos a los predeterminados de fábrica
   */
  public static resetToDefaults(): POI[] {
    this.saveAll(BASE_DEFAULT_POIS);
    return BASE_DEFAULT_POIS;
  }
}

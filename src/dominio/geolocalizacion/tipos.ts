/* ==================================================================
 *  AYNI · Tipo de dominio: geolocalización de emergencia
 *  ---------------------------------------------------------------------
 *  Capas puras de dominio sin dependencias externas.
 *  Serán consumidos por aplicacion/service y repositorios.
 *  ================================================================== */

/** Departamentos de Perú (25 regiones). */
export type DepartamentoPeru =
  | 'amazonas'
  | 'ancash'
  | 'apurimac'
  | 'arequipa'
  | 'ayacucho'
  | 'cajamarca'
  | 'callao'
  | 'cusco'
  | 'huancavelica'
  | 'huanuco'
  | 'ica'
  | 'junin'
  | 'la libertad'
  | 'lambayeque'
  | 'lima ciudad'
  | 'lima provincias'
  | 'loreto'
  | 'madre de dios'
  | 'moquegua'
  | 'pasco'
  | 'piura'
  | 'puno'
  | 'san martin'
  | 'tacna'
  | 'tumbes'
  | 'ucayali';

/** Coordenadas geográficas (WGS84). */
export interface Coordenadas {
  lat: number;
  lng: number;
  fuente: 'gps' | 'ip' | 'osm' | 'offline';
}

/** Resultado de la detección de ubicación. */
export interface UbicacionResuelta {
  departamento: DepartamentoPeru;
  coordenadas: Coordenadas;
  fuente: 'gps' | 'ip' | 'osm' | 'offline';
  timestamp: number;
}

/** Tipo de emergencia (nacional). */
export type TipoEmergencia = 'bomberos' | 'policia' | 'samu' | 'otro';

/** Número de emergencia (label, código, tipo, emoji). */
export interface NumeroEmergencia {
  label: string;
  numero: string;
  tipo: TipoEmergencia;
  emoji: string;
}

/** Catálogo de emergencia para un departamento. */
export interface CatalogoRegion {
  departamento: string;
  pais: 'Peru';
  numeros: NumeroEmergencia[];
}

/** Errores de geolocalización. */
export class GeolocalizacionError extends Error {
  constructor(
    mensaje: string,
    public codigo: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'RED_NO_DISPONIBLE' | 'DEPARTAMENTO_NO_ENCONTRADO',
    public fuente?: 'gps' | 'ip' | 'osm' | 'offline'
  ) {
    super(mensaje);
    this.name = 'GeolocalizacionError';
  }
}

/** Opciones de geolocalización para el navegador. */
export interface OpcionesGeolocalizacion {
  timeout?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
}
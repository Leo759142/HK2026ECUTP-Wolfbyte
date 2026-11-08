/* ==================================================================
 *  AYNI · Repositorio Compuesto (cadena de fallback)
 *  ---------------------------------------------------------------------
 *  Encadena GPS -> IP -> OSM -> Offline con estrategia de fallback.
 *  Cada repositorio se intenta en orden; si falla, pasa al siguiente.
 *  ================================================================== */
import type { Coordenadas, DepartamentoPeru, UbicacionResuelta } from '../../dominio/geolocalizacion/tipos';

export interface UbicacionResultado {
  departamento: string;
  coordenadas: { lat: number; lng: number; fuente: string };
  fuente: 'gps' | 'ip' | 'osm' | 'offline';
  error: string | null;
}

export class CompuestoRepository {
  private gps: GPSRepository;
  private ip: IPRepository;
  private osm: OSMRepository;
  private offline: OfflineRepository;

  constructor() {
    this.gps = new GPSRepository();
    this.ip = new IPRepository();
    this.osm = new OSMRepository();
    this.offline = new OfflineRepository();
  }

  /** Detectar ubicacion intentando fuentes en orden de prioridad */
  async detectarUbicacion(): Promise<UbicacionResuelta> {
    return new Promise((resolve, reject) => {
      // 1. Intentar GPS
      this.gps.detectarUbicacion()
        .then((coords) => {
          const dep = this._obtenerDepartamentoGPS(coords);
          resolve({
            departamento: dep || 'desconocido',
            coordenadas: coords,
            fuente: 'gps',
            error: null,
          });
        })
        .catch(async (error) => {
          // 2. Intentar IP
          try {
            const coordsIP = await this.ip.detectarUbicacion();
            const depIP = this._obtenerDepartamentoGPS(coordsIP);
            resolve({
              departamento: depIP || 'desconocido',
              coordenadas: coordsIP,
              fuente: 'ip',
              error: error.message || 'GPS falló, usó IP',
            });
          } catch (err: any) {
            // 3. Intentar OSM
            try {
              const { departamento } = await this.osm.resolverDepartamento(coords.lat, coords.lng);
              if (departamento !== 'desconocido') {
                resolve({
                  departamento,
                  coordenadas: { lat: coords.lat, lng: coords.lng, fuente: 'ip' },
                  fuente: 'osm',
                  error: error.message || 'GPS e IP fallaron, OSM usó coordenadas',
                });
              } else {
                // 4. Fallback offline
                const depOffline = this.offline.detectarDepartamento(coords.lat, coords.lng);
                resolve({
                  departamento: depOffline || 'desconocido',
                  coordenadas: { lat: coords.lat, lng: coords.lng, fuente: 'offline' },
                  fuente: 'offline',
                  error: error.message || 'GPS, IP e OSM fallaron, uso offline',
                });
              }
            } catch (osmError: any) {
              // 5. Fallback offline
              const depOffline = this.offline.detectarDepartamento(coords.lat, coords.lng);
              resolve({
                departamento: depOffline || 'desconocido',
                coordenadas: { lat: coords.lat, lng: coords.lng, fuente: 'offline' },
                fuente: 'offline',
                error: error.message || 'GPS, IP e OSM fallaron, uso offline',
              });
            }
          }
        });
    });
  }

  private _obtenerDepartamentoGPS(coords: { lat: number; lng: number }): string | null {
    // Simula obtener departamento del repositorio offline
    const estrategiaOffline = new OfflineRepository();
    return estrategiaOffline.detectarDepartamento(coords.lat, coords.lng);
  }
}


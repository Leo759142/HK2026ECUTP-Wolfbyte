/* ==================================================================
 *  AYNI · Servicio de geolocalización (Casos de uso)
 *  ---------------------------------------------------------------------
 *  Orquestación de los repositorios compuestos y caché local.
 *  Este es el coordinator que encadena GPS -> IP -> OSM -> Offline.
 *  ================================================================== */
import { GPSRepository } from '../../repositorios/geolocalizacion/gps.repository';
import { IPRepository } from '../../repositorios/geolocalizacion/ip.repository';
import { OSMRepository } from '../../repositorios/geolocalizacion/osm.repository';
import { OfflineRepository } from '../../repositorios/geolocalizacion/offline.repository';
import {
  obtenerDesdeCache,
  guardarEnCache,
  limpiarCache
} from '../../datos/geolocalizacion/dao';
import {
  DepartamentoPeru,
  Coordenadas,
  UbicacionResuelta,
  GeolocalizacionError,
  TipoEmergencia,
} from '../../dominio/geolocalizacion/tipos';

export class ServicioGeolocalizacion {
  private gps: GPSRepository;
  private ip: IPRepository;
  private osm: OSMRepository;
  private offline: OfflineRepository;
  private caché: { obtener: () => Promise<any>; guardar: (u: any) => Promise<void>; limpiar: () => Promise<void>; };

  constructor() {
    this.gps = new GPSRepository();
    this.ip = new IPRepository();
    this.osm = new OSMRepository();
    this.offline = new OfflineRepository();
    this.caché = { obtener: obtenerDesdeCache, guardar: guardarEnCache, limpiar: limpiarCache };
  }

  async detectarUbicacion(): Promise<UbicacionResuelta> {
    // 1. Intentar usar caché si existe
    const caché = await this.caché.obtener();
    if (caché) {
      const now = Date.now();
      const edad = now - caché.timestamp;
      const MAX_AGE_MIN = 5 * 60 * 1000; // 5 minutos
      if (edad < MAX_AGE_MIN) {
        return {
          departamento: caché.departamento as DepartamentoPeru,
          coordenadas: { lat: caché.coordenadas.lat, lng: caché.coordenadas.lng, fuente: caché.fuente },
          fuente: caché.fuente,
          timestamp: caché.timestamp,
        };
      }
    }

    try {
      // 1. GPS
      const coordsGPS = await this.gps.detectarUbicacion();
      const dep = this._obtenerDepartamentoGPS(coordsGPS);
      const resultado = {
        departamento: dep || 'desconocido',
        coordenadas: coordsGPS,
        fuente: 'gps',
        error: null,
      };
      await this.guardarEnCache(resultado);
      return resultado;
    } catch (error: any) {
      // 2. IP
      try {
        const coordsIP = await this.ip.detectarUbicacion();
        const depIP = this._obtenerDepartamentoGPS(coordsIP);
        const resultado = {
          departamento: depIP || 'desconocido',
          coordenadas: coordsIP,
          fuente: 'ip',
          error: error.message || 'GPS falló, usó IP',
        };
        await this.guardarEnCache(resultado);
        return resultado;
      } catch (err: any) {
        // 3. OSM
        try {
          const { departamento } = await this.osm.resolverDepartamento(coordsGPS.lat, coordsGPS.lng);
          if (departamento !== 'desconocido') {
            const resultado = {
              departamento,
              coordenadas: { lat: coordsGPS.lat, lng: coordsGPS.lng, fuente: 'ip' },
              fuente: 'osm',
              error: error.message || 'GPS e IP fallaron, OSM usó coordenadas',
            };
            await this.guardarEnCache(resultado);
            return resultado;
          }
        } catch (osmError: any) {
          // 4. Fallback offline
          const depOffline = this.offline.detectarDepartamento(coordsGPS.lat, coordsGPS.lng);
          const resultado = {
            departamento: depOffline || 'desconocido',
            coordenadas: { lat: coordsGPS.lat, lng: coordsGPS.lng, fuente: 'offline' },
            fuente: 'offline',
            error: error.message || 'GPS, IP e OSM fallaron, uso offline',
          };
          await this.guardarEnCache(resultado);
          return resultado;
        }
      }
    }
  }

  private _obtenerDepartamentoGPS(coords: { lat: number; lng: number }): string | null {
    return this.offline.detectarDepartamento(coords.lat, coords.lng);
  }
}


/* ==================================================================
 *  AYNI · Repositorio OSM Nominatim (reverse geocoding)
 *  ---------------------------------------------------------------------
 *  Usa Nominatim para convertir coordenadas en nombre de localidad.
 *  Requiere encabezado User-Agent y tiene lAmites de uso.
 *  ================================================================== */

import type { Coordenadas, UbicacionResuelta } from '../../dominio/geolocalizacion/tipos';

const TIMEOUT_MS = 10000;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&limit=1';
const USER_AGENT = 'AYNI-Emergencia/1.0';

export class OSMRepository {
  async resolverDepartamento(lat: number, lng: number): Promise<{ departamento: string; fuente: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS * 2);

    try {
      const response = await fetch(NOMINATIM_URL + '&lat=' + lat + '&lon=' + lng + '&format=jsonv2&addressdetails=1', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const data = await response.json();
      const address = data.address || {};

      let region = address.state || address.region || address.county || address.city || address.town || address.village || address.province || address.district || address.municipality;

      if (region) {
        const lowerRegion = region.toLowerCase();
        const regions = [
          'amazonas', 'ancash', 'apurimac', 'arequipa', 'ayacucho', 'cajamarca', 'callao', 'cusco',
          'huancavelica', 'huanuco', 'ica', 'junin', 'la libertad', 'lambayeque', 'lima ciudad',
          'lima provincias', 'loreto', 'madre de dios', 'moquegua', 'pasco', 'piura', 'puno',
          'san martin', 'tacna', 'tumbes', 'ucayali',
        ];

        for (const dept of regions) {
          if (lowerRegion.includes(dept)) {
            return { departamento: dept, fuente: 'osm' };
          }
        }
      }

      return { departamento: 'desconocido', fuente: 'osm' };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout en OSM Nominatim');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export { OSMRepository };


// Mapa de regiones a departamentos peruanos
const REGION_MAP: Record<string, string> = {
  'amazonas': 'amazonas',
  'ancash': 'ancash',
  'apurimac': 'apurimac',
  'arequipa': 'arequipa',
  'ayacucho': 'ayacucho',
  'cajamarca': 'cajamarca',
  'callao': 'callao',
  'cusco': 'cusco',
  'huancavelica': 'huancavelica',
  'huanuco': 'huanuco',
  'ica': 'ica',
  'junin': 'junin',
  'la libertad': 'la libertad',
  'lambayeque': 'lambayeque',
  'lima ciudad': 'lima ciudad',
  'lima provincias': 'lima provincias',
  'loreto': 'loreto',
  'madre de dios': 'madre de dios',
  'moquegua': 'moquegua',
  'pasco': 'pasco',
  'piura': 'piura',
  'puno': 'puno',
  'san martin': 'san martin',
  'tacna': 'tacna',
  'tumbes': 'tumbes',
  'ucayali': 'ucayali',
};

export class OSMRepository {
  async resolverDepartamento(lat: number, lng: number): Promise<{ departamento: string; fuente: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS * 2);

    try {
      const response = await fetch(NOMINATIM_URL + '&lat=' + lat + '&lon=' + lng + '&format=jsonv2&addressdetails=1', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const data = await response.json();
      const address = data.address || {};

      let region = address.state || address.region || address.county || address.city || address.town || address.village || address.province || address.district || address.municipality;

      if (region) {
        const lowerRegion = region.toLowerCase();
        const mapped = REGION_MAP[lowerRegion] || null;
        if (mapped) {
          return { departamento: mapped, fuente: 'osm' };
        }
      }

      return { departamento: 'desconocido', fuente: 'osm' };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout en OSM Nominatim');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}





// Mapa de regiones a departamentos peruanos
const REGION_MAP: Record<string, string> = {
  'amazonas': 'amazonas',
  'ancash': 'ancash',
  'apurimac': 'apurimac',
  'arequipa': 'arequipa',
  'ayacucho': 'ayacucho',
  'cajamarca': 'cajamarca',
  'callao': 'callao',
  'cusco': 'cusco',
  'huancavelica': 'huancavelica',
  'huanuco': 'huanuco',
  'ica': 'ica',
  'junin': 'junin',
  'la libertad': 'la libertad',
  'lambayeque': 'lambayeque',
  'lima ciudad': 'lima ciudad',
  'lima provincias': 'lima provincias',
  'loreto': 'loreto',
  'madre de dios': 'madre de dios',
  'moquegua': 'moquegua',
  'pasco': 'pasco',
  'piura': 'piura',
  'puno': 'puno',
  'san martin': 'san martin',
  'tacna': 'tacna',
  'tumbes': 'tumbes',
  'ucayali': 'ucayali',
};

export class OSMRepository {
  async resolverDepartamento(lat: number, lng: number): Promise<{ departamento: string; fuente: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS * 2);

    try {
      const response = await fetch(NOMINATIM_URL + '&lat=' + lat + '&lon=' + lng + '&format=jsonv2&addressdetails=1', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const data = await response.json();
      const address = data.address || {};

      let region = address.state || address.region || address.county || address.city || address.town || address.village || address.province || address.district || address.municipality;

      if (region) {
        const lowerRegion = region.toLowerCase();
        const mapped = REGION_MAP[lowerRegion] || null;
        if (mapped) {
          return { departamento: mapped, fuente: 'osm' };
        }
      }

      return { departamento: 'desconocido', fuente: 'osm' };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout en OSM Nominatim');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}


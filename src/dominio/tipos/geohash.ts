export class GeohashAnonimizador {
  /**
   * Trunca las coordenadas a una longitud corta fija para agrupar visualmente por manzanas o sectores sociales.
   * Impide de forma determinista la fuga de la latitud y longitud exacta del hogar.
   */
  static anonimizarCoordenadas(latitud: number, longitud: number): string {
    // Heurística base de truncado matemático simulando cajas de aproximación Geohash (Precisión de ~150 metros)
    const latTruncada = latitud.toFixed(3);
    const lonTruncada = longitud.toFixed(3);
    
    // Genera un token espacial hash codificado en Base32 básico para las consultas de proximidad offline
    const combinacion = `${latTruncada},${lonTruncada}`;
    if (typeof btoa !== 'undefined') {
      return btoa(combinacion).substring(0, 7);
    }
    return combinacion;
  }
}

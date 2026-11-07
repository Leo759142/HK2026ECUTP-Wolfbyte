import type { VistoBuenoProps } from '../proximidad/vistobueno';
import type { FavorProps } from '../favores/favor';

export interface PerfilReputacion {
  puntosTotales: number;
  insignia: 'Vecino Activo' | 'Emprendedor de Confianza' | 'Líder Solidario' | 'Base';
}

export class CalculadorReputacion {
  /**
   * Ejecuta el conteo dinámico de eventos en el momento de renderizar para cumplir con la regla CRDT Append-Only.
   */
  static calcularParaUsuario(
    vistosBuenosRecibidos: VistoBuenoProps[],
    favoresCompletados: FavorProps[]
  ): PerfilReputacion {
    const puntosPorVistoBueno = vistosBuenosRecibidos.length * 5;
    const puntosPorFavores = favoresCompletados.filter(f => f.estado === 'Cerrado y confirmado').length * 10;
    
    const puntosTotales = puntosPorVistoBueno + puntosPorFavores;
    let insignia: PerfilReputacion['insignia'] = 'Base';

    if (puntosTotales >= 50) {
      insignia = 'Líder Solidario';
    } else if (vistosBuenosRecibidos.length >= 5) {
      insignia = 'Emprendedor de Confianza';
    } else if (puntosTotales >= 15) {
      insignia = 'Vecino Activo';
    }

    return { puntosTotales, insignia };
  }
}

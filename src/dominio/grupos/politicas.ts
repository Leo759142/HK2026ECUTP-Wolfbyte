import { puede, Accion } from '../roles/rbac.ts/rbac';

export class PoliticasGrupo {
  /**
   * Valida si un miembro específico de un grupo tiene permitido ejecutar una acción de moderación o publicación
   */
  static puedeEjecutarAccion(membresia: Membresia, grupo: Grupo, accion: Accion): boolean {
    // Si la membresía no pertenece al grupo o no está activa, denegar inmediatamente
    if (membresia.grupoId !== grupo.id || membresia.estado !== 'activa') {
      return false;
    }

    // Si el grupo está en modo de emergencia, ciertas acciones normales podrían bloquearse aquí si fuera necesario
    return puede(membresia.rol, accion);
  }

  /**
   * Política específica para activar o desactivar el modo de crisis del vecindario
   */
  static puedeGestionarEmergencia(membresia: Membresia, grupo: Grupo): boolean {
    if (membresia.grupoId !== grupo.id || membresia.estado !== 'activa') {
      return false;
    }
    return puede(membresia.rol, 'activar_emergencia');
  }

  /**
   * Política para validar quién puede moderar u ocultar contenido dentro del grupo
   */
  static puedeModerarContenido(membresia: Membresia, grupo: Grupo): boolean {
    if (membresia.grupoId !== grupo.id || membresia.estado !== 'activa') {
      return false;
    }
    return puede(membresia.rol, 'moderar_contenido');
  }
}

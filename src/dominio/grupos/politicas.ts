import { Grupo } from './grupos';
import { Membresia } from './membresia';
import { puede, type AccionRbac } from '../roles/rbac';

export class PoliticasGrupo {
	static puedeEjecutarAccion(membresia: Membresia, grupo: Grupo, accion: AccionRbac): boolean {
		if (membresia.grupo_id !== grupo.id || !membresia.esActiva()) return false;
		return puede(membresia.rol, accion);
	}

	static puedeGestionarEmergencia(membresia: Membresia, grupo: Grupo): boolean {
		return this.puedeEjecutarAccion(membresia, grupo, 'activar_emergencia');
	}

	static puedeModerarContenido(membresia: Membresia, grupo: Grupo): boolean {
		return this.puedeEjecutarAccion(membresia, grupo, 'moderar_contenido');
	}
}


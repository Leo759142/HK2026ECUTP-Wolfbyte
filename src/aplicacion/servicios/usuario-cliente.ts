/**
 * Identificador de cliente estable mientras no exista sesión real (`hooks.server.ts` pendiente).
 * Se genera una vez por pestaña/sesión y se reutiliza en las escrituras offline para que
 * las operaciones del mismo usuario sean trazables y sincronicen correctamente.
 */
let _id: string | null = null;

export function obtenerUsuarioCliente(): string {
	if (!_id) _id = crypto.randomUUID();
	return _id;
}

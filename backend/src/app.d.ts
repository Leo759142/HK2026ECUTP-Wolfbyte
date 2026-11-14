import type { SesionActual } from '#server/auth/sesion.ts';

declare global {
	namespace App {
		interface Error {
			codigo: string;
			mensaje: string;
		}
		interface Locals {
			/** Sesión válida (cuenta creada) o null. */
			sesion: SesionActual | null;
			/** Token de registro: teléfono verificado que aún no tiene cuenta. */
			registro: { sesionId: string; telefono: string } | null;
		}
	}
}

export {};

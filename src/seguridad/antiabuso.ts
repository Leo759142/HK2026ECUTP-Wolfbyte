// src/seguridad/antiabuso.ts

export interface ControlSpam {
	usuarioId: string;
	ultimaPublicacionTimestamp: number;
	conteoMensajesMinuto: number;
}

export class ControlAntiAbuso {
	/** Rate-limiting cliente: máximo 3 publicaciones por minuto. */
	static puedePublicar(registro: ControlSpam, ahora = Date.now()): boolean {
		const unMinuto = 60_000;
		if (ahora - registro.ultimaPublicacionTimestamp > unMinuto) return true;
		return registro.conteoMensajesMinuto < 3;
	}

	static registrarPublicacion(registro: ControlSpam, ahora = Date.now()): ControlSpam {
		const unMinuto = 60_000;
		if (ahora - registro.ultimaPublicacionTimestamp > unMinuto) {
			return { ...registro, ultimaPublicacionTimestamp: ahora, conteoMensajesMinuto: 1 };
		}
		return { ...registro, conteoMensajesMinuto: registro.conteoMensajesMinuto + 1 };
	}

	static generarEnlaceInvitacionWhatsApp(
		grupoId: string,
		nombreGrupo: string,
		base = 'https://mi-barrio.pe'
	): string {
		const enlaceInvitacion = `${base}?grupo=${encodeURIComponent(grupoId)}`;
		const texto = `¡Hola! Te invito a unirte al grupo vecinal de nuestra manzana: *${nombreGrupo}*. Regístrate ingresando aquí: ${enlaceInvitacion}`;
		return `https://wa.me/?text=${encodeURIComponent(texto)}`;
	}
}

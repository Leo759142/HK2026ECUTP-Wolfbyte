import { browser } from '$app/environment';

export type EmergenciaActiva = {
	activa: boolean;
	tipo: string;
	lugar: string;
	titulo: string;
	confirmadaPor: string;
	iniciadaEn: number | null;
};

const CLAVE = 'ayni:v1:modo-emergencia';

const inicial = (): EmergenciaActiva => ({
	activa: false,
	tipo: '',
	lugar: '',
	titulo: '',
	confirmadaPor: '',
	iniciadaEn: null
});

function leerGuardado(): EmergenciaActiva {
	if (!browser) return inicial();
	try {
		const raw = localStorage.getItem(CLAVE);
		return raw ? { ...inicial(), ...(JSON.parse(raw) as Partial<EmergenciaActiva>) } : inicial();
	} catch {
		return inicial();
	}
}

function tiempoRelativo(iniciadaEn: number): string {
	const ahora = Date.now();
	const segundos = Math.floor((ahora - iniciadaEn) / 1000);
	if (segundos < 60) return 'ahora';
	const minutos = Math.floor(segundos / 60);
	if (minutos < 60) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
	const horas = Math.floor(minutos / 60);
	return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
}

class EstadoEmergencia {
	activa = $state(false);
	tipo = $state('');
	lugar = $state('');
	titulo = $state('');
	confirmadaPor = $state('');
	iniciadaEn = $state<number | null>(null);

	constructor() {
		if (browser) {
			const g = leerGuardado();
			this.activa = g.activa;
			this.tipo = g.tipo;
			this.lugar = g.lugar;
			this.titulo = g.titulo;
			this.confirmadaPor = g.confirmadaPor;
			this.iniciadaEn = g.iniciadaEn;

			// Sincronizar entre pestañas
			window.addEventListener('storage', (e) => {
				if (e.key === CLAVE && e.newValue) {
					try {
						const g = JSON.parse(e.newValue) as Partial<EmergenciaActiva>;
						this.activa = g.activa ?? false;
						this.tipo = g.tipo ?? '';
						this.lugar = g.lugar ?? '';
						this.titulo = g.titulo ?? '';
						this.confirmadaPor = g.confirmadaPor ?? '';
						this.iniciadaEn = g.iniciadaEn ?? null;
					} catch {
						// ignorar
					}
				}
			});
		}
	}

	private persistir() {
		if (!browser) return;
		localStorage.setItem(
			CLAVE,
			JSON.stringify({
				activa: this.activa,
				tipo: this.tipo,
				lugar: this.lugar,
				titulo: this.titulo,
				confirmadaPor: this.confirmadaPor,
				iniciadaEn: this.iniciadaEn
			})
		);
	}

	activar(datos: { tipo: string; lugar?: string; confirmadaPor?: string }) {
		const lugar = datos.lugar?.trim() || 'tu sector';
		this.activa = true;
		this.tipo = datos.tipo;
		this.lugar = lugar;
		this.titulo = `${datos.tipo} · ${lugar}`;
		this.confirmadaPor = datos.confirmadaPor?.trim() || 'un Guardián';
		this.iniciadaEn = Date.now();
		this.persistir();
	}

	desactivar() {
		this.activa = false;
		this.tipo = '';
		this.lugar = '';
		this.titulo = '';
		this.confirmadaPor = '';
		this.iniciadaEn = null;
		this.persistir();
	}

	recargar() {
		if (!browser) return;
		const g = leerGuardado();
		this.activa = g.activa;
		this.tipo = g.tipo;
		this.lugar = g.lugar;
		this.titulo = g.titulo;
		this.confirmadaPor = g.confirmadaPor;
		this.iniciadaEn = g.iniciadaEn;
	}

	get inicioFormateado(): string {
		if (!this.iniciadaEn) return '';
		return tiempoRelativo(this.iniciadaEn);
	}
}

export const modoEmergencia = new EstadoEmergencia();

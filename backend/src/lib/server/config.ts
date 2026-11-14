/**
 * Configuración del backend leída de variables de entorno (ver backend/.env.example).
 * Se usa desde SvelteKit y desde los scripts de consola (node scripts/db.ts), por eso
 * lee process.env directamente y carga backend/.env si existe.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

let envCargado = false;

function cargarEnv(): void {
	if (envCargado) return;
	envCargado = true;
	const archivo = resolve(process.cwd(), '.env');
	if (existsSync(archivo) && typeof process.loadEnvFile === 'function') {
		try {
			process.loadEnvFile(archivo);
		} catch (e) {
			console.warn('[AYNI] No se pudo leer .env:', e);
		}
	}
}

export interface Config {
	produccion: boolean;
	/** postgres://usuario:clave@host:5432/ayni (obligatoria). */
	databaseUrl: string | null;
	/** Modo demostración: código SMS fijo, datos de ejemplo y herramientas del jurado. */
	demo: boolean;
	otpDemo: string;
	/** Secreto del servidor para derivar hashes de los códigos SMS. Obligatorio en producción. */
	secreto: string;
	confirmacionesRequeridas: 1 | 2;
	sesionDias: number;
	corsOrigins: string[];
	cookieSegura: boolean;
	migracionesDir: string;
}

let cache: Config | null = null;

export function config(): Config {
	if (cache) return cache;
	cargarEnv();
	const env = process.env;
	const produccion = env.NODE_ENV === 'production';
	const demo = (env.AYNI_DEMO ?? (produccion ? 'false' : 'true')).toLowerCase() === 'true';
	const secreto = env.AYNI_SECRETO ?? '';
	if (produccion && secreto.length < 32) {
		throw new Error('AYNI_SECRETO es obligatorio en producción (mínimo 32 caracteres). Ver backend/.env.example');
	}
	const requeridas = Number(env.CONFIRMACIONES_REQUERIDAS ?? 1) === 2 ? 2 : 1;
	cache = {
		produccion,
		databaseUrl: env.DATABASE_URL?.trim() || null,
		demo,
		otpDemo: env.AYNI_OTP_DEMO ?? '1234',
		secreto: secreto || 'solo-desarrollo-no-usar-en-produccion',
		confirmacionesRequeridas: requeridas,
		sesionDias: Number(env.SESION_DIAS ?? 30),
		corsOrigins: (env.CORS_ORIGINS ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean),
		cookieSegura: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : produccion,
		migracionesDir: resolve(process.cwd(), env.MIGRACIONES_DIR ?? 'migraciones')
	};
	return cache;
}

/** Solo para tests: fuerza valores. */
export function configurarParaTests(parcial: Partial<Config>): void {
	cache = { ...config(), ...parcial };
}

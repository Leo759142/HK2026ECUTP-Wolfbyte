/**
 * Código de verificación por SMS (tabla `otp_codigos`). El código nunca se guarda en claro.
 * - Modo demo (AYNI_DEMO=true): el código es AYNI_OTP_DEMO (1234 por defecto), como en el prototipo.
 * - Producción: hace falta un proveedor de SMS (no configurado todavía → 503 SMS_NO_CONFIGURADO).
 */
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../config.ts';
import { err } from '../http.ts';
import type { Consulta } from '../db/index.ts';

const VIGENCIA_MS = 10 * 60 * 1000;
const MAX_POR_HORA = 5;
const MAX_INTENTOS = 5;

const hashCodigo = (telefono: string, codigo: string) =>
	createHmac('sha256', config().secreto).update(`${telefono}:${codigo}`).digest('hex');

export interface EnvioOtp {
	demo: boolean;
}

export async function solicitarCodigo(db: Consulta, telefono: string): Promise<EnvioOtp> {
	const [{ n }] = await db.query<{ n: number }>(
		`SELECT count(*)::int AS n FROM otp_codigos WHERE telefono = $1 AND creado_en > now() - interval '1 hour'`,
		[telefono]
	);
	if (n >= MAX_POR_HORA) throw err.limite('Pediste muchos códigos. Espera una hora e inténtalo otra vez.');

	const cfg = config();
	if (!cfg.demo) {
		// Aquí se integra el proveedor de SMS (ver docs/INTEGRACION.md → Configuración pendiente).
		throw err.noDisponible('El envío de SMS aún no está configurado en este servidor.', 'SMS_NO_CONFIGURADO');
	}
	const codigo = cfg.demo ? cfg.otpDemo : String(randomInt(0, 10000)).padStart(4, '0');
	// El código anterior deja de servir: solo vale el último.
	await db.query('UPDATE otp_codigos SET usado = true WHERE telefono = $1 AND NOT usado', [telefono]);
	await db.query('INSERT INTO otp_codigos (telefono, codigo_hash, expira_en) VALUES ($1, $2, $3)', [
		telefono,
		hashCodigo(telefono, codigo),
		new Date(Date.now() + VIGENCIA_MS)
	]);
	return { demo: cfg.demo };
}

/** Devuelve true si el código es correcto (y lo marca como usado). */
export async function verificarCodigo(db: Consulta, telefono: string, codigo: string): Promise<boolean> {
	const [otp] = await db.query<{ id: string; codigo_hash: string; intentos: number }>(
		`SELECT id, codigo_hash, intentos FROM otp_codigos
		  WHERE telefono = $1 AND NOT usado AND expira_en > now()
		  ORDER BY creado_en DESC LIMIT 1`,
		[telefono]
	);
	if (!otp) throw err.noAutorizado('El código venció o no lo pediste. Toca "Cambiar número" y pide uno nuevo.', 'CODIGO_VENCIDO');
	if (otp.intentos >= MAX_INTENTOS) {
		await db.query('UPDATE otp_codigos SET usado = true WHERE id = $1', [otp.id]);
		throw err.limite('Demasiados intentos. Pide un código nuevo.');
	}
	const esperado = Buffer.from(otp.codigo_hash, 'hex');
	const recibido = Buffer.from(hashCodigo(telefono, codigo), 'hex');
	const ok = esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
	if (!ok) {
		await db.query('UPDATE otp_codigos SET intentos = intentos + 1 WHERE id = $1', [otp.id]);
		return false;
	}
	await db.query('UPDATE otp_codigos SET usado = true WHERE id = $1', [otp.id]);
	return true;
}

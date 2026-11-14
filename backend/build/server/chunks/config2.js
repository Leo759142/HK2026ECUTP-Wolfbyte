import { existsSync } from "node:fs";
import { resolve } from "node:path";
// src/lib/server/config.ts
/**
* Configuración del backend leída de variables de entorno (ver backend/.env.example).
* Se usa desde SvelteKit y desde los scripts de consola (node scripts/db.ts), por eso
* lee process.env directamente y carga backend/.env si existe.
*/
var envCargado = false;
function cargarEnv() {
	if (envCargado) return;
	envCargado = true;
	const archivo = resolve(process.cwd(), ".env");
	if (existsSync(archivo) && typeof process.loadEnvFile === "function") try {
		process.loadEnvFile(archivo);
	} catch (e) {
		console.warn("[AYNI] No se pudo leer .env:", e);
	}
}
var cache = null;
function config() {
	if (cache) return cache;
	cargarEnv();
	const env = process.env;
	const produccion = env.NODE_ENV === "production";
	const demo = (env.AYNI_DEMO ?? (produccion ? "false" : "true")).toLowerCase() === "true";
	const secreto = env.AYNI_SECRETO ?? "";
	if (produccion && secreto.length < 32) throw new Error("AYNI_SECRETO es obligatorio en producción (mínimo 32 caracteres). Ver backend/.env.example");
	const requeridas = Number(env.CONFIRMACIONES_REQUERIDAS ?? 1) === 2 ? 2 : 1;
	cache = {
		produccion,
		databaseUrl: env.DATABASE_URL?.trim() || null,
		demo,
		otpDemo: env.AYNI_OTP_DEMO ?? "1234",
		secreto: secreto || "solo-desarrollo-no-usar-en-produccion",
		confirmacionesRequeridas: requeridas,
		sesionDias: Number(env.SESION_DIAS ?? 30),
		corsOrigins: (env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
		cookieSegura: env.COOKIE_SECURE ? env.COOKIE_SECURE === "true" : produccion,
		migracionesDir: resolve(process.cwd(), env.MIGRACIONES_DIR ?? "migraciones")
	};
	return cache;
}
export { config as t };

//# sourceMappingURL=config2.js.map
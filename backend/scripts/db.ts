/**
 * Herramientas de base de datos (Node ≥ 22.6 ejecuta TypeScript directamente).
 *   node scripts/db.ts migrar          → aplica las migraciones pendientes
 *   node scripts/db.ts seed            → carga los datos de demostración si la base está vacía (requiere AYNI_DEMO=true)
 *   node scripts/db.ts reiniciar-demo  → BORRA todo y vuelve a cargar la demostración (requiere AYNI_DEMO=true)
 * Usa DATABASE_URL de backend/.env.
 */
import { config } from '../src/lib/server/config.ts';
import { crearDb } from '../src/lib/server/db/index.ts';
import { asegurarDatosDemo, reiniciarDemo } from '../src/lib/server/db/seed-demo.ts';

const orden = process.argv[2];
const db = await crearDb({ migrar: true });
console.info(`[AYNI] Conectado a: ${db.descripcion}`);
try {
	if (orden === 'migrar') {
		console.info('[AYNI] Migraciones al día.');
	} else if (orden === 'seed') {
		if (!config().demo) throw new Error('El seed de demostración requiere AYNI_DEMO=true.');
		console.info((await asegurarDatosDemo(db)) ? '[AYNI] Datos de demostración cargados.' : '[AYNI] La base ya tenía datos: no se cargó nada.');
	} else if (orden === 'reiniciar-demo') {
		await reiniciarDemo(db);
		console.info('[AYNI] Base reiniciada con los datos de demostración.');
	} else {
		console.error('Uso: node scripts/db.ts <migrar|seed|reiniciar-demo>');
		process.exitCode = 1;
	}
} catch (e) {
	console.error('[AYNI]', (e as Error).message);
	process.exitCode = 1;
} finally {
	await db.cerrar();
}

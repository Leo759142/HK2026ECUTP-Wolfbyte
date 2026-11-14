/**
 * `npm run dev` desde la raíz: levanta backend (API, puerto 5180) y frontend (app, puerto 5173).
 * El frontend reenvía /api al backend con el proxy de Vite. Ctrl+C detiene ambos.
 */
import { spawn } from 'node:child_process';

const servicios = [
	{ nombre: 'backend ', dir: 'backend', color: '\x1b[36m' },
	{ nombre: 'frontend', dir: 'frontend', color: '\x1b[35m' }
];
const hijos = [];

for (const s of servicios) {
	const hijo = spawn('npm run dev', { cwd: s.dir, shell: true, env: process.env });
	const prefijo = `${s.color}[${s.nombre}]\x1b[0m `;
	const escribir = (flujo) => (datos) => {
		for (const linea of datos.toString().split(/\r?\n/)) if (linea.trim()) flujo.write(prefijo + linea + '\n');
	};
	hijo.stdout.on('data', escribir(process.stdout));
	hijo.stderr.on('data', escribir(process.stderr));
	hijo.on('exit', (codigo) => {
		console.log(`${prefijo}terminó (código ${codigo})`);
		detener();
	});
	hijos.push(hijo);
}

console.log('\nAYNI en desarrollo → app: http://localhost:5173  ·  API: http://localhost:5180/api/v1/estado\n');

let deteniendo = false;
function detener() {
	if (deteniendo) return;
	deteniendo = true;
	for (const h of hijos) if (!h.killed) h.kill();
	process.exit();
}
process.on('SIGINT', detener);
process.on('SIGTERM', detener);

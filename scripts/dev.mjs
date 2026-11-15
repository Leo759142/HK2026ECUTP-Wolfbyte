/**
 * `pnpm run dev` desde la raíz: levanta backend (API 5180), frontend (app 5173) y raíz (5175).
 * El frontend reenvía /api al backend con el proxy de Vite. Ctrl+C detiene todos.
 */
import { spawn } from 'node:child_process';

const servicios = [
	{ nombre: 'backend ', dir: 'backend', cmd: 'pnpm run dev', color: '\x1b[36m' },
	{ nombre: 'frontend', dir: 'frontend', cmd: 'pnpm run dev', color: '\x1b[35m' },
	{ nombre: 'root    ', dir: '.', cmd: 'pnpm run dev:root', color: '\x1b[33m' }
];
const hijos = [];

for (const s of servicios) {
	const hijo = spawn(s.cmd, { cwd: s.dir, shell: true, env: process.env });
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

console.log('\nAYNI en desarrollo');
console.log('  frontend: http://localhost:5173  (app, proxy /api -> backend)');
console.log('  backend : http://localhost:5180/api/v1/estado');
console.log('  root    : http://localhost:5175  (proyecto raíz)\n');

let deteniendo = false;
function detener() {
	if (deteniendo) return;
	deteniendo = true;
	for (const h of hijos) if (!h.killed) h.kill();
	process.exit();
}
process.on('SIGINT', detener);
process.on('SIGTERM', detener);

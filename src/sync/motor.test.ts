import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { outboxDAO } from '../datos/outbox';
import { vaciarColaOutbox, esperaReintento } from './motor';
import { pendientesEnvio, requierenAtencion, refrescarOutbox, programarSiguienteReintento, sincronizarAhora } from './outbox.svelte';

const respuesta = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function limpiarCola() {
	for (const op of await outboxDAO.listarTodas()) await outboxDAO.descartar(op.op_id);
}

async function encolar(id: string) {
	await outboxDAO.encolar({ op_id: id, entidad: 'favores', operacion: 'crear', payload: { titulo: 'x' } });
}

describe('Paso 5 · cola honesta', () => {
	beforeEach(async () => {
		vi.stubGlobal('navigator', { onLine: true });
		await limpiarCola();
	});
	afterEach(async () => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		await limpiarCola();
	});

	it('esperaReintento crece y se limita a 30s', () => {
		expect(esperaReintento(0)).toBe(1000);
		expect(esperaReintento(1)).toBe(2000);
		expect(esperaReintento(10)).toBe(30000);
	});

	it('un 5xx deja la operación pendiente con reintento y sigue contando', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(503)));
		await encolar('op-5xx');
		const r = await vaciarColaOutbox();
		expect(r.enviadas).toBe(0);
		expect(r.pendientes).toBe(1);
		// El motor no la vuelve a tomar hasta que venza el reintento…
		expect(await outboxDAO.pendientes()).toHaveLength(0);
		// …pero la UI sí la cuenta como pendiente.
		await refrescarOutbox();
		expect(get(pendientesEnvio).map((o) => o.op_id)).toEqual(['op-5xx']);
		const op = (await outboxDAO.listarTodas())[0];
		expect(op.intentos).toBe(1); // antes se contaba dos veces
		expect(op.next_attempt_at).toBeGreaterThan(Date.now());
		expect(await outboxDAO.proximoReintento()).toBe(op.next_attempt_at);
	});

	it('un 4xx queda como "Requiere atención" y no como pendiente', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(422, { title: 'Datos inválidos', detail: 'titulo es requerido.' })));
		await encolar('op-422');
		await vaciarColaOutbox();
		await refrescarOutbox();
		expect(get(pendientesEnvio)).toHaveLength(0);
		const atencion = get(requierenAtencion);
		expect(atencion.map((o) => o.op_id)).toEqual(['op-422']);
		expect(atencion[0].estado).toBe('rechazada');
		expect(atencion[0].error).toContain('titulo es requerido');
	});

	it('un 409 queda en conflicto (también requiere atención)', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(409)));
		await encolar('op-409');
		const r = await vaciarColaOutbox();
		expect(r.conflicto).toBe(true);
		await refrescarOutbox();
		expect(get(requierenAtencion)[0].estado).toBe('conflicto');
	});

	it('un 2xx borra la operación de la cola', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(201)));
		await encolar('op-ok');
		const r = await vaciarColaOutbox();
		expect(r).toMatchObject({ enviadas: 1, pendientes: 0 });
		expect(await outboxDAO.listarTodas()).toHaveLength(0);
	});

	it('sin conexión no intenta enviar', async () => {
		vi.stubGlobal('navigator', { onLine: false });
		const f = vi.fn();
		vi.stubGlobal('fetch', f);
		await encolar('op-offline');
		const r = await vaciarColaOutbox();
		expect(f).not.toHaveBeenCalled();
		expect(r.pendientes).toBe(1);
	});

	it('el temporizador reintenta solo cuando vence el plazo', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('window', {});
		const f = vi.fn().mockResolvedValueOnce(respuesta(503)).mockResolvedValue(respuesta(201));
		vi.stubGlobal('fetch', f);
		await encolar('op-timer');
		await sincronizarAhora(); // falla y programa el reintento
		expect(f).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(500);
		expect(f).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1000);
		await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(2));
		await vi.waitFor(async () => expect(await outboxDAO.listarTodas()).toHaveLength(0));
		expect(await programarSiguienteReintento()).toBeNull();
	});
});

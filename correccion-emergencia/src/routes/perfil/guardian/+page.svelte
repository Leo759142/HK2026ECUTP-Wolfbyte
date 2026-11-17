<script lang="ts">
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	import Icono from '../../../lib/iconos/Icono.svelte';
	import { modoEmergencia } from '../../../lib/emergencia/estado.svelte';
	let emergencias = $state<Array<Record<string, unknown>>>([]);
	let reportes = $state<Array<Record<string, unknown>>>([]);
	let esGuardian = $state(false);
	let estoyBienCount = $state(0);
	function leer<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(`ayni:v1:${key}`);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}
	function guardar(key: string, value: unknown) {
		localStorage.setItem(`ayni:v1:${key}`, JSON.stringify(value));
	}
	function cargar() {
		const users = leer<Array<{ id?: string }>>('users', []);
		const id = users[0]?.id;
		esGuardian = leer<Array<{ guardianIds?: string[] }>>('sectors', []).some((s) =>
			s.guardianIds?.includes(id ?? '')
		);
		emergencias = leer<Array<Record<string, unknown>>>('emergencies', []).filter(
			(e) => (e.status ?? e.estado) === 'pendiente'
		);
		reportes = leer<Array<Record<string, unknown>>>('reports', []);
		const listaBien = JSON.parse(localStorage.getItem('ayni:v1:estoy-bien') ?? '[]') as string[];
		estoyBienCount = listaBien.length;
	}
	function obtenerUsuarioManzana(): string {
		try {
			const users = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
				manzana?: string;
			}>;
			return users[0]?.manzana ? `Mz. ${users[0].manzana}` : 'tu sector';
		} catch {
			return 'tu sector';
		}
	}

	const TIPO_ETIQUETA: Record<string, string> = {
		persona_vulnerable: 'Persona vulnerable',
		zona_inundada: 'Zona inundada',
		via_bloqueada: 'Vía bloqueada',
		sin_servicios_basicos: 'Sin servicios básicos',
		riesgo_estructural: 'Riesgo estructural',
		otro: 'Otra situación',
		posto_salud: 'Emergencia médica'
	};

	function etiquetaTipo(valor?: string): string {
		if (!valor) return 'Situación reportada';
		return TIPO_ETIQUETA[valor] ?? valor;
	}

	function atender(index: number) {
		const emergencia = emergencias[index];
		const id = emergencia?.id;
		emergencias = emergencias.filter((_, i) => i !== index);
		guardar(
			'emergencies',
			leer<Array<Record<string, unknown>>>('emergencies', []).map((e) =>
				e.id === id ? { ...e, status: 'confirmada' } : e
			)
		);
		// Al confirmar, se enciende el modo emergencia para todo el sector
		modoEmergencia.activar({
			tipo: etiquetaTipo(String(emergencia?.tipo ?? 'Emergencia')),
			lugar: obtenerUsuarioManzana(),
			confirmadaPor: 'un Guardián'
		});
	}
	function resolverReporte(index: number, ocultar: boolean) {
		const reporte = reportes[index];
		const clave = reporte?.collection === 'services' ? 'services' : 'favors';
		const items = leer<Array<Record<string, unknown>>>(clave, []);
		guardar(
			clave,
			items.map((item) => (item.id === reporte?.targetId ? { ...item, hidden: ocultar } : item))
		);
		reportes = reportes.filter((_, i) => i !== index);
		guardar('reports', reportes);
	}
</script>

<svelte:head><title>Panel del Guardián | AYNI</title></svelte:head>
<Screen>
	<Header title="Panel del Guardián" />
	{#if !esGuardian}
		<div class="empty">
			<strong><Icono name="guardian" /> Solo para Guardianes</strong>
			<p>Acepta la invitación desde tu perfil para acceder.</p>
		</div>
	{:else}
		<div class="guardian-banner">
			<Icono name="guardian" /> <span
				><strong>Panel del Guardián</strong><small>Ayuda a mantener segura tu zona.</small></span
			>
		</div>
		{#if estoyBienCount > 0}
			<div class="guardian-cerrar guardian-cerrar--bien">
				<p><strong>{estoyBienCount} vecino{estoyBienCount === 1 ? 'a' : 'as'} marcó: estoy bien</strong></p>
			</div>
		{/if}
		<h2>Emergencias por confirmar</h2>
		{#if !emergencias.length}<div class="empty"><Icono name="favores" /> No hay reportes pendientes.</div>{/if}
		{#each emergencias as emergencia, i}
			<article class="guardian-item guardian-item--danger">
				<strong><Icono name="alerta" /> {emergencia.tipo ?? 'Situación reportada'}</strong>
				<p>{emergencia.descripcion ?? emergencia.texto ?? 'Un vecino pidió ayuda.'}</p>
				<button class="mobile-btn mobile-btn--primary" onclick={() => atender(i)}
					>Confirmar reporte</button
				>
			</article>
		{/each}
		{#if modoEmergencia.activa}
			<div class="guardian-cerrar">
				<p>La emergencia está activa. Cuando esté controlada, avisa a tus vecinos.</p>
				<button class="mobile-btn mobile-btn--primary" type="button" onclick={() => modoEmergencia.desactivar()}>
					✓ Marcar emergencia como atendida
				</button>
			</div>
		{/if}
		<h2>Publicaciones reportadas ({reportes.length})</h2>
		{#if !reportes.length}<div class="empty"><Icono name="check" /> Todo en orden</div>{/if}
		{#each reportes as reporte, i}
			<article class="guardian-item">
				<strong>En revisión · {reporte.reason ?? 'Motivo no indicado'}</strong>
				<p>Publicación: {reporte.targetId}</p>
				<div class="guardian-actions">
					<button class="detail-secondary" onclick={() => resolverReporte(i, false)}>Aprobar</button
					><button class="mobile-btn mobile-btn--primary" onclick={() => resolverReporte(i, true)}
						>Ocultar</button
					>
				</div>
			</article>
		{/each}
	{/if}
</Screen>

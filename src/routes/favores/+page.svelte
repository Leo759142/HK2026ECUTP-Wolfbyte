<script lang="ts">
	import { onMount } from 'svelte';
	import { accionesCierre, construirConfirmacion, type FavorVista } from '$lib/favores';
	import type { RolEnFavor } from '../../dominio/tipos/tipos';

	let items = $state<FavorVista[]>([]);
	let estado = $state<'cargando' | 'ok' | 'error'>('cargando');
	let aviso = $state('');
	let error = $state('');
	let enviando = $state<string | null>(null);

	async function cargar() {
		try {
			const r = await fetch('/api/v1/favores');
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			items = (await r.json()).items ?? [];
			estado = 'ok';
		} catch {
			estado = 'error';
		}
	}

	async function seCumplio(f: FavorVista, rol: RolEnFavor) {
		aviso = '';
		error = '';
		enviando = `${f.id}:${rol}`;
		try {
			const { url, init } = construirConfirmacion(f, rol, crypto.randomUUID());
			const r = await fetch(url, init);
			const data = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(data.detail ?? data.title ?? 'No se pudo confirmar.');
			aviso = data.favor_estado === 'cerrado'
				? `“${f.titulo}”: cerrado y confirmado por ambas partes.`
				: `Confirmación del ${rol} registrada. Falta que confirme la otra parte.`;
			await cargar();
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudo confirmar.';
		} finally {
			enviando = null;
		}
	}

	onMount(cargar);
</script>

<svelte:head><title>Favores | ProyectoOneDrive</title></svelte:head>
<h1 class="text-xl font-bold">Cadena de favores</h1>
<p class="mt-1 text-sm text-stone-600">RF09-RF11: Abierto → Acordado/en_curso → Cerrado con confirmación mutua “Se cumplió”.</p>
<a class="mt-3 inline-block rounded bg-amber-700 px-4 py-3 font-medium text-white" href="/publicar?tipo=favor">Pedir u ofrecer favor</a>

{#if aviso}<p class="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm" role="status">{aviso}</p>{/if}
{#if error}<p class="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm" role="alert">{error}</p>{/if}

{#if estado === 'cargando'}
	<p class="mt-4" role="status">Cargando favores…</p>
{:else if estado === 'error'}
	<p class="mt-4 rounded border border-red-200 bg-red-50 p-3" role="alert">No se pudo cargar la lista de favores.</p>
{:else}
	<ul class="mt-4 grid gap-3">
		{#if items.length === 0}<li class="rounded border bg-white p-4">Sin favores publicados.</li>{/if}
		{#each items as f (f.id)}
			{@const accion = accionesCierre(f)}
			<li class="rounded-xl border bg-white p-4">
				<h2 class="font-semibold">{f.titulo}</h2>
				<p class="text-sm">{f.descripcion}</p>
				<p class="mt-1 text-xs">Estado: <strong>{f.estado}</strong></p>
				{#if accion === 'confirmar'}
					<div class="mt-2 flex flex-wrap gap-2">
						<button class="rounded border px-3 py-2 text-sm" disabled={enviando !== null} onclick={() => seCumplio(f, 'solicitante')}>
							Se cumplió · solicitante ({f.creador_id})
						</button>
						<button class="rounded border px-3 py-2 text-sm" disabled={enviando !== null} onclick={() => seCumplio(f, 'ayudante')}>
							Se cumplió · ayudante ({f.ayudante_id})
						</button>
					</div>
				{:else if accion === 'esperando_ayudante'}
					<p class="mt-2 text-xs text-stone-600">Esperando que un vecino se ofrezca a ayudar.</p>
				{:else if accion === 'cerrado'}
					<p class="mt-2 text-xs font-medium text-green-800">Cerrado y confirmado por ambas partes.</p>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

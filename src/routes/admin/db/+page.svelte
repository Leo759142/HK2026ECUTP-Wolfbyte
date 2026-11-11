<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '../../lib/ui/Header.svelte';
	import Screen from '../../lib/ui/Screen.svelte';

	type EntidadInfo = { entidad: string; total: number; ultimo_actualizado?: string };
	type Registro = Record<string, unknown>;

	let entidades = $state<EntidadInfo[]>([]);
	let entidadSeleccionada = $state<string>('');
	let registros = $state<Registro[]>([]);
	let cargando = $state(false);
	let error = $state('');
	let mensaje = $state('');
	let verRegistro = $state<Registro | null>(null);
	let editando = $state<Registro | null>(null);

	async function cargarEntidades() {
		cargando = true;
		error = '';
		try {
			const res = await fetch('/api/v1/admin?seccion=db');
			if (!res.ok) throw new Error('No se pudo cargar la base de datos');
			const data = await res.json();
			entidades = data.entidades ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error desconocido';
		} finally {
			cargando = false;
		}
	}

	async function cargarRegistros(entidad: string) {
		entidadSeleccionada = entidad;
		cargando = true;
		error = '';
		try {
			const res = await fetch(`/api/v1/admin/db/${entidad}`);
			if (!res.ok) throw new Error('No se pudo cargar los registros');
			const data = await res.json();
			registros = data.items ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error desconocido';
		} finally {
			cargando = false;
		}
	}

	async function eliminarRegistro(id: string) {
		if (!confirm('¿Eliminar este registro?')) return;
		try {
			const res = await fetch(`/api/v1/admin/db/${entidadSeleccionada}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ accion: 'eliminar', id })
			});
			if (!res.ok) throw new Error('No se pudo eliminar');
			mensaje = 'Registro eliminado.';
			await cargarRegistros(entidadSeleccionada);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al eliminar';
		}
	}

	function editarRegistro(registro: Registro) {
		editando = { ...registro };
		verRegistro = null;
	}

	function cancelarEdicion() {
		editando = null;
	}

	async function guardarEdicion() {
		if (!editando) return;
		const id = String(editando.id ?? '');
		try {
			const res = await fetch(`/api/v1/admin/db/${entidadSeleccionada}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ accion: 'actualizar', id, ...editando })
			});
			if (!res.ok) throw new Error('No se pudo actualizar');
			mensaje = 'Registro actualizado.';
			editando = null;
			await cargarRegistros(entidadSeleccionada);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al actualizar';
		}
	}

	onMount(cargarEntidades);
</script>

<Screen>
	<Header title="Base de datos local" />

	{#if error}
		<p class="notice notice--error" role="alert">{error}</p>
	{/if}
	{#if mensaje}
		<p class="notice notice--ok" role="status">{mensaje}</p>
	{/if}

	{#if cargando}
		<p>Cargando…</p>
	{:else if entidadSeleccionada === ''}
		<h2>Entidades en la base de datos</h2>
		<p>Total de entidades: {entidades.length}</p>

		<table class="admin-table">
			<thead>
				<tr>
					<th>Entidad</th>
					<th>Registros</th>
					<th>Última actualización</th>
					<th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each entidades as e}
					<tr>
						<td><strong>{e.entidad}</strong></td>
						<td>{e.total}</td>
						<td>{e.ultimo_actualizado ?? '—'}</td>
						<td>
							<button class="mobile-btn mobile-btn--outline" type="button" onclick={() => cargarRegistros(e.entidad)}
								>Ver registros</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if entidades.length === 0}
			<p class="muted">No hay entidades en la base de datos.</p>
		{/if}

	{:else}
		<div class="admin-header-bar">
			<button class="mobile-btn mobile-btn--outline" type="button" onclick={() => {
				entidadSeleccionada = '';
				registros = [];
			}}>← Volver a entidades</button>
			<h2>{entidadSeleccionada} ({registros.length})</h2>
		</div>

		{#if editando}
			<div class="admin-card">
				<h3>Editar registro</h3>
				{#each Object.entries(editando) as [clave, valor]}
					<label class="setting-row">
						<span>{clave}</span>
						<input bind:value={editando[clave]} type="text" />
					</label>
				{/each}
				<div class="admin-actions">
					<button class="mobile-btn mobile-btn--outline" type="button" onclick={cancelarEdicion}>Cancelar</button>
					<button class="mobile-btn mobile-btn--primary" type="button" onclick={guardarEdicion}>Guardar</button>
					<button class="mobile-btn mobile-btn--danger" type="button" onclick={() => eliminarRegistro(String(editando.id))}>Eliminar</button>
				</div>
			</div>
		{:else if verRegistro}
			<div class="admin-card">
				<h3>Detalle del registro</h3>
				<pre>{JSON.stringify(verRegistro, null, 2)}</pre>
				<div class="admin-actions">
					<button class="mobile-btn mobile-btn--outline" type="button" onclick={() => { verRegistro = null; }} >Cerrar</button>
					<button class="mobile-btn mobile-btn--primary" type="button" onclick={() => { editarRegistro(verRegistro); }} >Editar</button>
					<button class="mobile-btn mobile-btn--danger" type="button" onclick={() => { verRegistro = null; eliminarRegistro(String(verRegistro.id)); }} >Eliminar</button>
				</div>
			</div>
		{:else}
			<table class="admin-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Datos</th>
						<th>Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each registros as r}
						<tr>
							<td><code>{String(r.id ?? '—')}</code></td>
							<td>
								{#if Object.keys(r).length <= 3}
									<pre class="preview-json">{JSON.stringify(r)}</pre>
								{:else}
									<pre class="preview-json">{JSON.stringify(r).slice(0, 120)}…</pre>
								{/if}
							</td>
							<td>
								<button class="mobile-btn mobile-btn--outline" type="button" onclick={() => { verRegistro = r; }}
									>Ver</button
								>
								<button class="mobile-btn mobile-btn--primary" type="button" onclick={() => editarRegistro(r)}
									>Editar</button
								>
								<button class="mobile-btn mobile-btn--danger" type="button" onclick={() => eliminarRegistro(String(r.id))}
									>Eliminar</button
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			{#if registros.length === 0}
				<p class="muted">No hay registros en esta entidad.</p>
			{/if}
		{/if}
</Screen>

<style>
	.admin-table {
		width: 100%;
		border-collapse: collapse;
		margin: 12px 0;
		font-size: 0.9rem;
	}

	.admin-table th,
	.admin-table td {
		border: 1px solid #ddd;
		padding: 8px 10px;
		text-align: left;
	}

	.admin-table tr:nth-child(even) {
		background: #f9f9f9;
	}

	.admin-header-bar {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.admin-card {
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 16px;
		margin: 12px 0;
	}

	.admin-actions {
		display: flex;
		gap: 8px;
		margin-top: 12px;
		flex-wrap: wrap;
	}

	.setting-row input {
		width: 100%;
		padding: 6px 8px;
		margin-top: 4px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.preview-json {
		font-size: 0.8rem;
		background: #f5f5f5;
		padding: 8px;
		border-radius: 4px;
		overflow: auto;
		max-height: 120px;
		margin: 4px 0;
	}

	code {
		background: #eee;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.85rem;
	}
</style>
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	const motivos = ['Parece estafa', 'Información falsa', 'Contenido ofensivo', 'Otro'];
	let motivo = $state(motivos[0]);
	let enviado = $state(false);
	function leer<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(`ayni:v1:${key}`);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}
	function enviar() {
		const id = page.url.searchParams.get('id') ?? '';
		const collection = page.url.searchParams.get('collection') ?? 'services';
		const userId = leer<Array<{ id?: string }>>('users', [])[0]?.id ?? 'local';
		const reportes = leer<Array<Record<string, unknown>>>('reports', []);
		if (!reportes.some((r) => r.targetId === id && r.userId === userId)) {
			reportes.push({
				id: crypto.randomUUID(),
				collection,
				targetId: id,
				userId,
				reason: motivo,
				createdAt: Date.now()
			});
			localStorage.setItem('ayni:v1:reports', JSON.stringify(reportes));
		}
		enviado = true;
	}
</script>

<Screen
	><Header title="Reportar" />
	<h1>¿Por qué reportas esta publicación?</h1>
	{#if enviado}<div class="empty">
			✅ Ya enviaste el reporte.
			<p>Un Guardián lo revisará. Tu nombre no se muestra a quien publicó.</p>
		</div>
		<button class="mobile-btn mobile-btn--primary" onclick={() => goto('/perfil')}
			>Volver al perfil</button
		>
	{:else}<div class="report-options" role="radiogroup">
			{#each motivos as item}<button
					class:active={motivo === item}
					role="radio"
					aria-checked={motivo === item}
					onclick={() => (motivo = item)}
					>{item}{#if motivo === item}<span>✓</span>{/if}</button
				>{/each}
		</div>
		<p class="muted">Con varios reportes, la publicación puede ocultarse mientras se revisa.</p>
		<button class="mobile-btn mobile-btn--primary" onclick={enviar}>Enviar reporte</button>{/if}
</Screen>

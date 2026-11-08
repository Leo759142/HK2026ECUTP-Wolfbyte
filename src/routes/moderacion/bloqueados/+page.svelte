<script lang="ts">
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	let bloqueados = $state<string[]>([]);
	function leer() {
		try {
			bloqueados = JSON.parse(localStorage.getItem('ayni:v1:blocked') ?? '[]') as string[];
		} catch {
			bloqueados = [];
		}
	}
	function quitar(item: string) {
		bloqueados = bloqueados.filter((x) => x !== item);
		localStorage.setItem('ayni:v1:blocked', JSON.stringify(bloqueados));
	}
	$effect(() => leer());
</script>

<Screen
	><Header title="Personas bloqueadas" />
	<h1>Personas bloqueadas</h1>
	{#if !bloqueados.length}<div class="empty">
			No has bloqueado a nadie.
		</div>{:else}{#each bloqueados as item}<div class="blocked-row">
				<span>{item}</span><button class="detail-secondary" onclick={() => quitar(item)}
					>Desbloquear</button
				>
			</div>{/each}{/if}</Screen
>

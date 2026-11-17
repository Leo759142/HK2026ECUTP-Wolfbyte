<script lang="ts">
	import { goto } from '$app/navigation';
	import { cerrarSesionLocal } from '../onboarding';
	import Icono from '../iconos/Icono.svelte';

	async function salir() {
		await fetch('/api/v1/auth', { method: 'DELETE' }).catch(() => undefined);
		cerrarSesionLocal();
		await goto('/acceso');
	}
</script>

<button class="logout-btn" type="button" aria-label="Cerrar sesión" onclick={salir}>
	<Icono name="salir" />
</button>

<style>
	.logout-btn {
		display: inline-grid;
		width: 40px;
		height: 40px;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: white;
		color: #d7263d;
		cursor: pointer;
	}
	.logout-btn:focus-visible {
		outline: 3px solid #7b2cbf;
		outline-offset: 2px;
	}
</style>

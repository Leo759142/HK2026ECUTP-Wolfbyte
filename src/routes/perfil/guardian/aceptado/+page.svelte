<script lang="ts">
	import { goto } from '$app/navigation';
	import Screen from '../../../../lib/ui/Screen.svelte';
</script>

<Screen>
	<div class="guardian-accepted">
		<div class="guardian-invite__icon">🛡️</div>
		<h1>¡Ya eres Guardián!</h1>
		<p>
			Te avisaremos cuando un vecino reporte una emergencia o una publicación necesite revisión.
		</p>
		<button class="mobile-btn mobile-btn--primary" onclick={() => goto('/perfil/guardian')}
			>Ir a mi panel</button
		>
		<button class="detail-secondary" onclick={() => goto('/perfil')}>Volver al perfil</button>
	</div>
</Screen>

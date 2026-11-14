<!-- 1.6 Nombre -->
<script>
  import { app } from '../../estado.svelte.js';
  import { load, save } from '../../storage.js';
  import { nombreVisible } from '../../util.js';
  import Avatar from '../../ui/Avatar.svelte';
  import Btn from '../../ui/Btn.svelte';
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Input from '../../ui/Input.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import Progreso from './Progreso.svelte';

  const draft = load('registro', {});
  let firstName = $state(draft.firstName ?? '');
  let lastName = $state(draft.lastName ?? '');
  const valido = $derived(firstName.trim().length >= 2 && lastName.trim().length >= 2);
</script>

<Screen>
  <Header title="Paso 3 de 4" />
  <Progreso paso={3} />
  <H1>¿Cómo te llamas?</H1>
  <Sub>Así tus vecinos sabrán quién recomienda, presta o pide ayuda.</Sub>
  <Field label="Nombre"><Input autocomplete="given-name" bind:value={firstName} placeholder="Rosa" /></Field>
  <Field label="Apellido"><Input autocomplete="family-name" bind:value={lastName} placeholder="Mendoza" /></Field>
  {#if valido}
    <div class="flex flex-col gap-2 rounded-[20px] bg-petroleo-claro p-3.5">
      <div class="text-sm font-extrabold text-petroleo-osc">Así te verán tus vecinos:</div>
      <div class="flex items-center gap-3">
        <Avatar letter={firstName.trim()[0].toUpperCase()} class="h-10 w-10 bg-ambar" />
        <div>
          <div class="font-black">{nombreVisible({ firstName: firstName.trim(), lastName })}</div>
          <div class="text-xs font-semibold text-gris">Vecino(a) nuevo(a)</div>
        </div>
      </div>
    </div>
  {/if}
  <p class="text-sm font-semibold text-gris">🔒 Tu apellido completo no se muestra. Si ofreces un oficio, podrás elegir mostrarlo. No pedimos DNI.</p>
  <div class="flex-1"></div>
  <Btn
    disabled={!valido}
    onclick={() => {
      save('registro', { ...load('registro', {}), firstName: firstName.trim(), lastName: lastName.trim() });
      app.go('ubicacion');
    }}>Continuar</Btn>
</Screen>

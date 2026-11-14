<!-- 2.4, 5.5–5.9 · Publicar en 3 clics: "+" → elegir tipo → Publicar. Sirve para CREAR y EDITAR (editCol + editId).
     Sin señal queda "Pendiente de enviar" en la cola y se publica al volver la conexión. -->
<script>
  import { app } from '../../estado.svelte.js';
  import { db } from '../../storage.js';
  import { guardarFavor, guardarServicio } from '../../acciones.js';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Screen from '../../ui/Screen.svelte';
  import FormFavor from './FormFavor.svelte';
  import FormPido from './FormPido.svelte';
  import FormServicio from './FormServicio.svelte';

  let { kind: kindInicial, editCol, editId } = $props();
  const OPCIONES = [
    { id: 'servicio', emoji: '🛠️', titulo: 'Ofrezco producto o servicio', sub: 'Tu oficio, profesión o lo que vendes', bg: 'bg-ambar-claro' },
    { id: 'favor', emoji: '🤝', titulo: 'Ofrezco un favor', sub: 'Presto, regalo o intercambio', bg: 'bg-morado-claro' },
    { id: 'pido', emoji: '🙋', titulo: 'Necesito ayuda', sub: 'Pide algo a tus vecinos', bg: 'bg-petroleo-claro' },
  ];
  const existente = editId ? db.get(editCol, editId) : null;
  const kindDe = (col, item) => (!item ? null : col === 'services' ? 'servicio' : item.tipo === 'pido' ? 'pido' : 'favor');
  let kind = $state(kindDe(editCol, existente) ?? kindInicial ?? null);

  async function guardar(col, data) {
    const enviado = col === 'services' ? await guardarServicio(data, existente) : await guardarFavor(data, existente);
    if (existente) app.notify(enviado ? '✅ Cambios guardados' : '🕓 Cambios guardados en tu celular. Se enviarán al volver la señal');
    else app.notify(enviado ? '✅ ¡Publicado! Tus vecinos ya lo pueden ver' : '🕓 Guardado. Se publicará cuando vuelvas a tener señal');
    app.replace('misPublicaciones');
  }
  const onBack = existente || kindInicial ? undefined : () => (kind = null);
</script>

{#if !kind}
  <Screen>
    <Header title="Clic 2 de 3" />
    <div class="flex gap-1.5" aria-hidden="true">
      <span class="h-1.5 flex-1 rounded-full bg-morado"></span>
      <span class="h-1.5 flex-1 rounded-full bg-morado"></span>
      <span class="h-1.5 flex-1 rounded-full bg-linea"></span>
    </div>
    <H1>¿Qué quieres publicar?</H1>
    {#each OPCIONES as o (o.id)}
      <button type="button" onclick={() => (kind = o.id)} class="flex min-h-[84px] items-center gap-3.5 rounded-[20px] border-2 border-linea bg-white p-4 text-left active:border-morado">
        <span class="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-2xl {o.bg}" aria-hidden="true">{o.emoji}</span>
        <span>
          <span class="block text-base font-black">{o.titulo}</span>
          <span class="block text-sm font-semibold text-gris">{o.sub}</span>
        </span>
      </button>
    {/each}
    <p class="text-sm font-semibold text-gris">📍 Se usará tu zona: Mz. {app.user.manzana}. Nunca tu dirección exacta.</p>
  </Screen>
{:else if kind === 'servicio'}
  <FormServicio item={existente} onSave={guardar} {onBack} editando={Boolean(existente)} />
{:else if kind === 'favor'}
  <FormFavor item={existente} onSave={guardar} {onBack} editando={Boolean(existente)} />
{:else}
  <FormPido item={existente} onSave={guardar} {onBack} editando={Boolean(existente)} />
{/if}

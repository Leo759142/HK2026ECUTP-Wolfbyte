<!-- 6.4 Favor cerrado + Balance de Ayni -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { balanceAyni } from '../../util.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import H1 from '../../ui/H1.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';

  let { id } = $props();
  const f = $derived(datos.favors.find((x) => x.id === id));
  const otro = $derived(app.users.find((u) => u.id === (f?.ownerId === app.user.id ? f?.takerId : f?.ownerId)));
  const balance = $derived(balanceAyni(app.user.id, datos.favors));
</script>

<Screen class="text-center">
  <div class="flex-1"></div>
  <Circle emoji="🤝" class="bg-morado-claro" />
  <H1>¡Favor cerrado y confirmado!</H1>
  <Sub>Tú y {otro?.firstName ?? 'tu vecino'} confirmaron: {f?.titulo}.</Sub>
  <div class="flex flex-col gap-3 rounded-3xl border-2 border-morado bg-white p-4">
    <div class="text-lg font-black text-morado-osc">Tu Balance de Ayni</div>
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-2xl bg-morado-claro p-3 text-morado-osc"><div class="text-3xl font-black">{balance.dados}</div><div class="text-xs font-extrabold">favores dados</div></div>
      <div class="rounded-2xl bg-morado-claro p-3 text-morado-osc"><div class="text-3xl font-black">{balance.recibidos}</div><div class="text-xs font-extrabold">favores recibidos</div></div>
    </div>
    <div class="text-sm font-bold text-gris">Hoy por ti, mañana por mí 💜</div>
  </div>
  <div class="flex-1"></div>
  <Btn onclick={() => app.reset('favores')}>Volver a Favores</Btn>
</Screen>

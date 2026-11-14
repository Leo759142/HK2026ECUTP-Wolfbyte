<script>
  let { checked, onChange, label, hint = '' } = $props();
</script>

<button type="button" role="switch" aria-checked={checked} onclick={() => onChange(!checked)} class="flex min-h-[56px] w-full items-center gap-3 text-left">
  <span class="flex-1">
    <span class="block text-base font-bold">{label}</span>
    {#if hint}<span class="block text-xs font-semibold text-gris">{hint}</span>{/if}
  </span>
  <span class="flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition {checked ? 'justify-end bg-morado' : 'justify-start bg-linea'}">
    <span class="h-[26px] w-[26px] rounded-full bg-white shadow"></span>
  </span>
</button>

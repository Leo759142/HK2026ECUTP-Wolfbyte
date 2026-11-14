<script>
  let { emoji, class: clase = 'bg-petroleo-claro' } = $props();
</script>

<div class="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-5xl {clase}" aria-hidden="true">{emoji}</div>

<script lang="ts">
	import { fa } from './fa';

	interface Props {
		name: string;
		class?: string;
		brand?: boolean;
		label?: string;
	}

	let { name, class: className = '', brand = false, label }: Props = $props();
	let cls = $derived(fa(name));
	let base = $derived(brand || cls.startsWith('fa-brands') ? 'fa-brands' : 'fa-solid');
	let icon = $derived(cls.startsWith('fa-brands ') ? cls.slice('fa-brands '.length) : cls);
</script>

<i
	class={`${base} ${icon} ${className}`.trim()}
	aria-hidden={label ? undefined : 'true'}
	aria-label={label}
></i>

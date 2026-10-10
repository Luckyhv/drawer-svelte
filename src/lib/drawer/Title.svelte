<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	let { children, ...rest }: HTMLAttributes<HTMLHeadingElement> = $props();
	const drawer = getDrawerContext();
</script>

<h2 {...rest} id={drawer.titleId}>{@render children?.()}</h2>

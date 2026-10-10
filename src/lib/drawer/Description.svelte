<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	let { children, ...rest }: HTMLAttributes<HTMLParagraphElement> = $props();
	const drawer = getDrawerContext();
</script>

<p {...rest} id={drawer.descriptionId}>{@render children?.()}</p>

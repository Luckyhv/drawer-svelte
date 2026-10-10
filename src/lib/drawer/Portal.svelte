<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getDrawerContext } from './state.svelte.js';
	import { portal, type PortalTarget } from './dom.js';

	/** `to`: element or selector to render into (default `body`); `false` renders in place. */
	let { to = undefined, children }: { to?: PortalTarget; children?: Snippet } = $props();
	const drawer = getDrawerContext();
</script>

{#if drawer.mounted}
	{#key to}
		<div style="display: contents" data-drawer-portal {@attach portal(to)}>
			{@render children?.()}
		</div>
	{/key}
{/if}

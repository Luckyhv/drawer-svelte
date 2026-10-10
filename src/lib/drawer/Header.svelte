<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		title?: string;
		description?: string;
		/** Show a close button (default true). */
		closeButton?: boolean;
		/** Extra controls next to the close button. */
		actions?: Snippet;
	};

	/** Optional header: a drag handle row with title, description and close button. */
	let { title, description, closeButton = true, actions, children, ...rest }: Props = $props();
	const drawer = getDrawerContext();
</script>

<div {...rest} data-drawer-header data-drawer-handle style="touch-action: none;">
	<div data-drawer-header-text>
		{#if title}<h2 id={drawer.titleId} data-drawer-title>{title}</h2>{/if}
		{#if description}<p id={drawer.descriptionId} data-drawer-description>{description}</p>{/if}
		{@render children?.()}
	</div>
	{@render actions?.()}
	{#if closeButton}
		<button type="button" data-drawer-close aria-label="Close" onclick={() => drawer.close()}>
			<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
				><path
					d="M6 6l12 12M18 6L6 18"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/></svg
			>
		</button>
	{/if}
</div>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	/** Optional footer row (actions), kept above the home indicator. */
	let { children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...rest} data-drawer-footer>{@render children?.()}</div>

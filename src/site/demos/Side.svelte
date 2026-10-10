<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { direction = 'right', card = false }: { direction?: 'left' | 'right' | 'top'; card?: boolean } = $props();
	let open = $state(false);
	const copy = {
		right: ['Right panel', 'A side panel for navigation or details. Swipe it back to the right edge.'],
		left: ['Left panel', 'The classic navigation drawer. Swipe it back to the left edge.'],
		top: ['Top sheet', 'Drops down from the top. Swipe up to send it back.']
	};
</script>

<DemoTrigger {card} kind={direction} title={copy[direction][0]} text={copy[direction][1]} onclick={() => (open = true)} />
<Drawer.Root bind:open {direction}>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant={direction === 'top' ? 'sheet' : 'side'}>
			<Drawer.Handle />
			<Drawer.Header title="Menu" description="Swipe it back toward the {direction} edge." />
			<Drawer.Body>
				{#each ['Overview', 'Projects', 'Team', 'Settings'] as item (item)}
					<button class="demo-option" onclick={() => (open = false)}>{item}</button>
				{/each}
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

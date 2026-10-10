<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let open = $state(false);
</script>

<DemoTrigger
	{card}
	kind="bottom"
	title="Bottom sheet"
	text="The default. Drag it down, flick it away, tap outside or press Esc."
	onclick={() => (open = true)}
/>
<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="sheet">
			<Drawer.Handle />
			<Drawer.Header title="Share" description="Drag down, flick, tap outside or press Esc." />
			<Drawer.Body>
				<div class="demo-grid">
					{#each ['Copy link', 'Messages', 'Mail', 'Notes', 'Reminders', 'More'] as label (label)}
						<button class="demo-tile" onclick={() => (open = false)}>{label}</button>
					{/each}
				</div>
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

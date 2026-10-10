<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let open = $state(false);
	let picked = $state('Newest first');
</script>

<DemoTrigger
	{card}
	kind="floating"
	title="Floating picker"
	text="Detached from the screen edges and sized to its content. Good for short choices."
	onclick={() => (open = true)}
/>
<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay blur />
		<Drawer.Content variant="floating">
			<Drawer.Handle />
			<Drawer.Header title="Sort by" closeButton={false} />
			<Drawer.Body>
				{#each ['Newest first', 'Oldest first', 'Most replies', 'Recently edited', 'Alphabetical'] as option (option)}
					<button
						class="demo-option"
						aria-pressed={picked === option}
						onclick={() => {
							picked = option;
							open = false;
						}}>{option}</button
					>
				{/each}
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

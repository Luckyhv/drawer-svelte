<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let outer = $state(false);
	let inner = $state(false);
	let priority = $state('Medium');
</script>

<DemoTrigger
	{card}
	kind="nested"
	title="Nested drawers"
	text="A picker opened from a sheet. Esc and outside taps close only the top one."
	onclick={() => (outer = true)}
/>
<Drawer.Root bind:open={outer}>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="sheet">
			<Drawer.Handle />
			<Drawer.Header title="New task" description="Tap Priority to stack a second drawer on top of this one." />
			<Drawer.Body>
				<label class="demo-field">Title<input placeholder="Write the release notes" /></label>
				<button class="demo-option" onclick={() => (inner = true)}>Priority <span>{priority}</span></button>
			</Drawer.Body>
			<Drawer.Footer>
				<Drawer.Close class="demo-btn ghost">Cancel</Drawer.Close>
				<Drawer.Close class="demo-btn">Create</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
<Drawer.Root bind:open={inner}>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="floating">
			<Drawer.Handle />
			<Drawer.Header title="Priority" closeButton={false} />
			<Drawer.Body>
				{#each ['Low', 'Medium', 'High', 'Urgent'] as level (level)}
					<button
						class="demo-option"
						aria-pressed={priority === level}
						onclick={() => {
							priority = level;
							inner = false;
						}}>{level}</button
					>
				{/each}
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let open = $state(false);
	let snap = $state(0);
	const people = ['Priya Raman', 'Tomás Vidal', 'Hana Okafor', 'Leon Brandt', 'Mei Castellanos', 'Idris Novak'];
	const actions = [
		'left a comment on the launch checklist',
		'moved Billing page to In review',
		'uploaded four files to Brand assets',
		'invited two people to the workspace',
		'closed three tasks in Onboarding',
		'renamed the planning doc'
	];
	const activity = Array.from({ length: 30 }, (_, i) => ({ id: i, name: people[i % 6], text: actions[(i * 5) % 6] }));
</script>

<DemoTrigger
	{card}
	kind="snap"
	title="Snap points"
	text="Rests at half height, expands to full. The list inside scrolls normally."
	onclick={() => (open = true)}
/>
<Drawer.Root bind:open snapPoints={[0.5, 0.92]} bind:activeSnap={snap}>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="sheet">
			<Drawer.Handle />
			<Drawer.Header title="Activity" description="Snap {snap + 1} of 2. Flick up to expand (it springs slightly past), drag slowly to settle with no bounce." />
			<Drawer.Body>
				{#each activity as a (a.id)}
					<div class="demo-row"><b>{a.name}</b><span>{a.text}</span></div>
				{/each}
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let open = $state(false);
	let count = $state(0);
	const places = [
		['Kiln Coffee', 'Coffee, open until 7 pm'],
		['Marlow Books', 'Bookshop, open until 9 pm'],
		['Tide Pool Bakery', 'Bakery, closes soon'],
		['Fern and Flint', 'Plants and pots'],
		['Lantern Noodle Bar', 'Noodles, open late'],
		['Cobalt Records', 'Vinyl and tapes'],
		['Juniper Deli', 'Sandwiches, open until 4 pm'],
		['North Dock Cinema', 'Two screens, late shows'],
		['Atlas Cycles', 'Bike repair'],
		['Saffron Table', 'Indian, dinner only'],
		['Paper Kite', 'Stationery'],
		['Low Tide Gym', 'Open 24 hours']
	];
</script>

{#snippet counter()}
	<button class="demo-btn ghost" class:small={card} onclick={() => count++}>Page taps: {count}</button>
{/snippet}

<div class={card ? undefined : 'demo-inline'} style:display={card ? 'contents' : undefined}>
	<DemoTrigger
		{card}
		kind="nonmodal"
		title="Non-modal"
		text="No overlay and no scroll lock. The page behind stays fully usable."
		action={open ? 'Close' : 'Open'}
		onclick={() => (open = !open)}
		extra={counter}
	/>
</div>
<Drawer.Root bind:open modal={false} snapPoints={[0.35, 0.8]}>
	<Drawer.Portal>
		<Drawer.Content variant="sheet">
			<Drawer.Handle />
			<Drawer.Header title="Nearby" description="No overlay, no scroll lock, the page stays usable." />
			<Drawer.Body>
				{#each places as [name, detail] (name)}<div class="demo-row"><b>{name}</b><span>{detail}</span></div>{/each}
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

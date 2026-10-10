<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let open = $state(false);
</script>

<DemoTrigger
	{card}
	kind="scale"
	title="Scaled background"
	text="The page behind shrinks back as the sheet opens, and follows your finger."
	onclick={() => (open = true)}
/>
<Drawer.Root bind:open scaleBackground>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="sheet">
			<Drawer.Handle />
			<Drawer.Header title="Scaled background" description="The page behind shrinks; it follows your finger as you drag." />
			<Drawer.Footer>
				<Drawer.Close class="demo-btn">Done</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

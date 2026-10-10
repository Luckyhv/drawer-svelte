<script lang="ts">
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let open = $state(false);
</script>

<DemoTrigger
	{card}
	kind="form"
	title="Form and keyboard"
	text="Inputs never start a drag. On phones the sheet lifts above the keyboard."
	onclick={() => (open = true)}
/>
<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="sheet">
			<Drawer.Handle />
			<Drawer.Header title="Invite a teammate" description="Fields never start a drag. On phones the sheet lifts above the keyboard." />
			<Drawer.Body>
				<label class="demo-field">Email<input type="email" placeholder="name@company.com" /></label>
				<label class="demo-field">Note<input placeholder="Optional message" /></label>
			</Drawer.Body>
			<Drawer.Footer>
				<Drawer.Close class="demo-btn ghost">Cancel</Drawer.Close>
				<Drawer.Close class="demo-btn">Send invite</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

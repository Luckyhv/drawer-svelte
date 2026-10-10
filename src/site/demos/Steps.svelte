<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Drawer } from '$lib/index.js';
	import DemoTrigger from '$site/DemoTrigger.svelte';
	let { card = false }: { card?: boolean } = $props();
	let open = $state(false);
	let view = $state<'menu' | 'rename' | 'delete'>('menu');
	let name = $state('Spring campaign');
	let height = $state(0);

	function show() {
		view = 'menu';
		open = true;
	}
</script>

<DemoTrigger
	{card}
	kind="steps"
	title="Multi-step"
	text="Views swap inside one drawer, and its height follows whatever is showing."
	onclick={show}
/>
<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="floating">
			<Drawer.Handle />
			<!-- The outer box animates to the measured height of the current view. -->
			<div class="steps" style:height={height ? `${height}px` : undefined}>
				<div bind:clientHeight={height}>
					{#key view}
						<div in:fade={{ duration: 200, delay: 80 }}>
							{#if view === 'menu'}
								<Drawer.Header title={name} closeButton={false} />
								<Drawer.Body>
									<button class="demo-option" onclick={() => (view = 'rename')}>Rename</button>
									<button class="demo-option" onclick={() => (open = false)}>Duplicate</button>
									<button class="demo-option" onclick={() => (view = 'delete')}>Delete project</button>
								</Drawer.Body>
							{:else if view === 'rename'}
								<Drawer.Header title="Rename project" closeButton={false} />
								<Drawer.Body>
									<label class="demo-field">Name<input bind:value={name} /></label>
								</Drawer.Body>
								<Drawer.Footer>
									<button class="demo-btn ghost" onclick={() => (view = 'menu')}>Back</button>
									<button class="demo-btn" onclick={() => (view = 'menu')}>Save</button>
								</Drawer.Footer>
							{:else}
								<Drawer.Header
									title="Delete this project?"
									description="Its files are removed for everyone on the team. This cannot be undone."
									closeButton={false}
								/>
								<Drawer.Footer>
									<button class="demo-btn ghost" onclick={() => (view = 'menu')}>Back</button>
									<button class="demo-btn" onclick={() => (open = false)}>Delete</button>
								</Drawer.Footer>
							{/if}
						</div>
					{/key}
				</div>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

<style>
	.steps {
		overflow: hidden;
		transition: height 0.35s cubic-bezier(0.32, 0.72, 0, 1);
	}
	@media (prefers-reduced-motion: reduce) {
		.steps {
			transition: none;
		}
	}
</style>

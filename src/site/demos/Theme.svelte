<script lang="ts">
	import { Drawer, type DrawerTheme } from '$lib/index.js';
	let open = $state(false);
	let theme = $state<DrawerTheme>('auto');
	let bg = $state('#10241b');
	let fg = $state('#eaf6ef');
	let accent = $state('#5fd39a');
	let useCustom = $state(false);
	let radius = $state(20);
	const colors = $derived(useCustom ? { bg, fg, accent, border: `${accent}40`, handle: `${accent}80` } : undefined);

	const presets = [
		{ name: 'Forest', bg: '#10241b', fg: '#eaf6ef', accent: '#5fd39a' },
		{ name: 'Clay', bg: '#fbf3ec', fg: '#2b1a12', accent: '#c2542d' },
		{ name: 'Harbour', bg: '#0c1a2b', fg: '#e8f1fb', accent: '#5aa9f0' }
	];
	const isPreset = (p: (typeof presets)[number]) => useCustom && p.bg === bg && p.fg === fg && p.accent === accent;
	function apply(p: (typeof presets)[number]) {
		({ bg, fg, accent } = p);
		useCustom = true;
	}
</script>

<div class="playground">
	<div class="group">
		<span class="label">Theme</span>
		<div class="seg">
			{#each ['auto', 'light', 'dark'] as const as t (t)}
				<button type="button" aria-pressed={theme === t} onclick={() => (theme = t)}>{t}</button>
			{/each}
		</div>
	</div>
	<div class="group">
		<span class="label">Colours</span>
		<div class="seg">
			<button type="button" aria-pressed={!useCustom} onclick={() => (useCustom = false)}>Default</button>
			{#each presets as p (p.name)}
				<button type="button" aria-pressed={isPreset(p)} onclick={() => apply(p)}>
					<i style="background: {p.bg}; border-color: {p.accent}"></i>{p.name}
				</button>
			{/each}
		</div>
	</div>
	<div class="group pickers">
		<label><input type="color" bind:value={bg} oninput={() => (useCustom = true)} />Background</label>
		<label><input type="color" bind:value={fg} oninput={() => (useCustom = true)} />Text</label>
		<label><input type="color" bind:value={accent} oninput={() => (useCustom = true)} />Accent</label>
		<label class="range">Radius <b>{radius}px</b><input type="range" min="0" max="36" bind:value={radius} /></label>
	</div>
	<div><button class="demo-btn" onclick={() => (open = true)}>Open themed drawer</button></div>
</div>

<Drawer.Root bind:open {theme} {colors}>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content variant="sheet" style="--drawer-radius: {radius}px">
			<Drawer.Handle />
			<Drawer.Header title="Your colours" description="Set with the colors prop, or any --drawer-* CSS variable." />
			<Drawer.Body>
				<button class="demo-accent" onclick={() => (open = false)}>Looks good</button>
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

<style>
	.playground {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 16px;
	}
	.label {
		width: 64px;
		font-size: 13px;
		color: var(--muted);
	}
	.seg {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.seg button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 32px;
		padding: 0 12px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 13px;
		text-transform: capitalize;
		cursor: pointer;
	}
	.seg button:hover {
		color: var(--fg);
	}
	.seg button[aria-pressed='true'] {
		border-color: var(--fg);
		color: var(--fg);
	}
	.seg i {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid;
	}
	.pickers label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--muted);
	}
	.pickers b {
		font: 500 12px var(--mono);
		color: var(--fg);
		min-width: 4ch;
	}
	input[type='color'] {
		appearance: none;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: none;
		overflow: hidden;
		cursor: pointer;
	}
	input[type='color']::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	input[type='color']::-webkit-color-swatch {
		border: 0;
	}
	input[type='color']::-moz-color-swatch {
		border: 0;
	}
	input[type='range'] {
		width: 120px;
		accent-color: var(--fg);
	}
	@media (pointer: coarse) {
		.seg button {
			height: 40px;
			padding: 0 14px;
			font-size: 14px;
		}
		input[type='color'] {
			width: 36px;
			height: 36px;
		}
		.pickers {
			gap: 14px 20px;
		}
		input[type='range'] {
			width: 160px;
		}
	}
	@media (max-width: 520px) {
		.label {
			width: 100%;
		}
	}
	.demo-accent {
		width: 100%;
		padding: 12px;
		border: 0;
		border-radius: 12px;
		font: inherit;
		font-weight: 500;
		background: var(--drawer-accent, var(--_accent));
		color: var(--drawer-bg, var(--_bg));
		cursor: pointer;
	}
</style>

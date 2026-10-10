<script lang="ts">
	import { base } from '$app/paths';
	import Code from '$site/Code.svelte';
	import Sheet from '$site/demos/Sheet.svelte';
	import Snap from '$site/demos/Snap.svelte';
	import Floating from '$site/demos/Floating.svelte';
	import Side from '$site/demos/Side.svelte';
	import Nested from '$site/demos/Nested.svelte';
	import Steps from '$site/demos/Steps.svelte';
	import NonModal from '$site/demos/NonModal.svelte';
	import Scale from '$site/demos/Scale.svelte';
	import Form from '$site/demos/Form.svelte';
	import Theme from '$site/demos/Theme.svelte';
	import { install, quick } from '$site/snippets.js';

	let copied = $state(false);
	async function copyInstall() {
		try {
			await navigator.clipboard.writeText(install);
			copied = true;
			setTimeout(() => (copied = false), 1400);
		} catch {
			/* blocked */
		}
	}

	const features = [
		['Feels native', 'Follows your finger, flicks on velocity and rubber-bands at the edges. Transform-only, so it stays smooth.'],
		['Scroll that works', 'Lists scroll normally. Pull down at the top and the sheet takes over. No stolen or cancelled drags on touch.'],
		['Live snap points', 'Fractions, pixels or functions. Recomputed on resize, never cached from the first frame.'],
		['Nested drawers', 'Open a picker from a sheet. Escape, outside taps and the focus trap only act on the top one.'],
		['No page jumps', 'Scroll lock without pinning the body. Focus returns without scrolling. Your page stays where it was.'],
		['Themeable', 'Headless by default. Opt into the stylesheet for light and dark presets, then override any colour.'],
		['Accessible', 'A labelled dialog. Focus moves in and back, Esc closes, and Tab is trapped in modal drawers.'],
		['No dependencies', 'Svelte 5 runes only. No component kit, no positioning library, no animation library.']
	];
</script>

<svelte:head>
	<title>drawer-svelte - drawers and bottom sheets for Svelte 5</title>
	<meta name="description" content="An accessible, gesture-driven drawer for Svelte 5: snap points, touch-safe scrolling, nested drawers, theming." />
</svelte:head>

<main>
	<section class="hero">
		<div class="pitch">
			<h1>Drawers that feel native.</h1>
			<p class="lead">
				Bottom sheets, side panels and floating pickers for Svelte 5, with snap points, nested drawers and touch-safe
				scrolling.
			</p>
			<div class="cta">
				<a class="demo-btn" href="{base}/docs/">Read the docs</a>
				<button class="install" onclick={copyInstall} aria-label="Copy install command">
					<span class="dollar">$</span>{install}<span class="copy">{copied ? 'Copied' : 'Copy'}</span>
				</button>
			</div>
		</div>
		<div class="sample"><Code code={quick} title="App.svelte" /></div>
	</section>

	<section class="try">
		<h2>Try it</h2>
		<p class="sub">Every card opens a real drawer. They feel best on a phone.</p>
		<div class="demo-cards">
			<Sheet card />
			<Snap card />
			<Floating card />
			<Nested card />
			<Steps card />
			<Side card direction="right" />
			<Side card direction="left" />
			<Side card direction="top" />
			<NonModal card />
			<Form card />
			<Scale card />
		</div>
	</section>

	<section>
		<h2>What you get</h2>
		<div class="features">
			{#each features as [title, text] (title)}
				<div class="feature">
					<h3>{title}</h3>
					<p>{text}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="theming">
		<div>
			<h2>Your colours</h2>
			<p class="sub">
				Light, dark, auto, or exactly what your users picked. Unstyled by default, so Tailwind or plain CSS work too.
			</p>
			<a href="{base}/docs/theming/">Theming guide</a>
		</div>
		<div class="panel"><Theme /></div>
	</section>
</main>

<footer>
	<span>MIT licensed. Inspired by vaul.</span>
	<span><a href="{base}/docs/">Docs</a><a href="{base}/docs/examples/">Examples</a><a href="{base}/docs/api/">API</a></span>
</footer>

<style>
	main {
		max-width: 1120px;
		margin: 0 auto;
		padding: 0 20px 96px;
	}
	section {
		margin-top: 88px;
	}
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: center;
		gap: 56px;
		margin-top: 0;
		padding-top: 72px;
	}
	h1 {
		margin: 0 0 20px;
		font-size: clamp(40px, 5.6vw, 64px);
		font-weight: 600;
		letter-spacing: -0.05em;
		line-height: 1;
		text-wrap: balance;
	}
	.lead {
		max-width: 46ch;
		margin: 0;
		color: var(--muted);
		font-size: 17px;
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 28px;
	}
	.install {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		height: 40px;
		padding: 0 6px 0 14px;
		border-radius: 10px;
		border: 1px solid var(--line-strong);
		background: transparent;
		color: var(--fg);
		font: 13px var(--mono);
		cursor: pointer;
	}
	.dollar {
		color: var(--muted);
	}
	.copy {
		min-width: 54px;
		padding: 4px 8px;
		border-radius: 6px;
		background: var(--raised);
		color: var(--muted);
		font: 500 12px/1.4 var(--sans);
		transition: color 0.15s;
	}
	.install:hover .copy {
		color: var(--fg);
	}
	.sample :global(.code) {
		margin: 0;
	}
	h2 {
		margin: 0 0 6px;
		font-size: 28px;
		letter-spacing: -0.035em;
	}
	.sub {
		max-width: 52ch;
		margin: 0 0 24px;
		color: var(--muted);
	}
	/* Hairline grid: the gaps show the line colour, so there are no boxes to draw. */
	.features {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1px;
		margin-top: 24px;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--line);
		overflow: hidden;
	}
	.feature {
		padding: 22px 20px 24px;
		background: var(--bg);
	}
	.feature h3 {
		margin: 0 0 6px;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.feature p {
		margin: 0;
		color: var(--muted);
		font-size: 13.5px;
		line-height: 1.55;
	}
	.theming {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
		align-items: start;
		gap: 40px;
	}
	.theming a {
		font-size: 14px;
	}
	.panel {
		padding: 24px;
		border-radius: 14px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 12px 24px;
		max-width: 1120px;
		margin: 0 auto;
		padding: 24px 20px 40px;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: 13px;
	}
	footer span:last-child {
		display: flex;
		gap: 18px;
	}
	footer a {
		text-decoration: none;
	}
	footer a:hover {
		color: var(--fg);
	}
	@media (max-width: 900px) {
		/* Phones lead with the live demos; the code sample moves below them. */
		main {
			display: flex;
			flex-direction: column;
			padding: 0 16px 72px;
		}
		section {
			order: 3;
			margin-top: 56px;
		}
		.hero {
			display: contents;
		}
		.pitch {
			padding-top: 40px;
		}
		.try {
			order: 1;
			margin-top: 48px;
		}
		.sample {
			order: 2;
			margin-top: 48px;
		}
		.lead {
			font-size: 16px;
		}
		.cta > * {
			flex: 1 1 auto;
			justify-content: center;
		}
		.install {
			height: 46px;
			justify-content: flex-start;
		}
		.copy {
			margin-left: auto;
		}
		h2 {
			font-size: 24px;
		}
		.panel {
			padding: 18px 16px;
		}
		footer {
			padding: 24px 16px max(32px, env(safe-area-inset-bottom));
		}
		.features {
			grid-template-columns: repeat(2, 1fr);
		}
		.theming {
			grid-template-columns: 1fr;
			gap: 16px;
		}
	}
	@media (max-width: 520px) {
		.features {
			grid-template-columns: 1fr;
		}
	}
</style>

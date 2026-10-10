<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	let { children } = $props();
	const links = [
		['', 'Getting started'],
		['usage/', 'Usage'],
		['api/', 'API reference'],
		['theming/', 'Theming'],
		['examples/', 'Examples'],
		['how-it-works/', 'How it works'],
		['migrating/', 'Migrating from vaul']
	];
	const here = (href: string) => page.url.pathname === `${base}/docs/${href}`;

	// On phones the links are one scrolling row: keep the current page in view.
	let nav = $state<HTMLElement>();
	$effect(() => {
		void page.url.pathname;
		const active = nav?.querySelector<HTMLElement>('.active');
		if (nav && active) nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
	});
</script>

<div class="docs">
	<aside>
		<nav aria-label="Docs" bind:this={nav}>
			{#each links as [href, label] (href)}
				<a href="{base}/docs/{href}" class:active={here(href)} aria-current={here(href) ? 'page' : undefined}
					>{label}</a
				>
			{/each}
		</nav>
	</aside>
	<article>
		{@render children()}
	</article>
</div>

<style>
	.docs {
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr);
		gap: 40px;
		max-width: 1100px;
		margin: 0 auto;
		padding: 32px 20px 96px;
	}
	aside nav {
		position: sticky;
		top: 84px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	aside a {
		padding: 7px 12px;
		border-radius: 10px;
		text-decoration: none;
		color: var(--muted);
		font-size: 14px;
	}
	aside a:hover {
		color: var(--fg);
	}
	aside a.active {
		background: var(--raised);
		color: var(--fg);
		font-weight: 500;
	}
	article {
		min-width: 0;
		max-width: 760px;
	}
	article :global(h1) {
		font-size: 34px;
		letter-spacing: -0.035em;
		margin: 0 0 8px;
	}
	article :global(h2) {
		font-size: 22px;
		margin: 44px 0 8px;
		padding-top: 8px;
	}
	article :global(h3) {
		font-size: 16px;
		margin: 24px 0 6px;
	}
	article :global(p),
	article :global(li) {
		color: color-mix(in srgb, var(--fg) 82%, var(--muted));
	}
	article :global(.lead) {
		font-size: 17px;
		color: var(--muted);
	}
	article :global(.callout) {
		padding: 12px 16px;
		border-radius: 12px;
		background: var(--raised);
		border: 1px solid var(--line);
		font-size: 14px;
	}
	article :global(.row) {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 12px 0;
	}
	article :global(.demo-card p) {
		color: var(--muted);
	}
	article :global(.demo-cards) {
		margin: 14px 0 8px;
	}
	@media (max-width: 820px) {
		.docs {
			grid-template-columns: minmax(0, 1fr);
			gap: 16px;
			padding-top: 16px;
		}
		.docs {
			padding: 0 16px 72px;
		}
		/* A sticky row of pills under the top bar, bleeding to the screen edges. */
		aside {
			position: sticky;
			top: 56px;
			z-index: 10;
			margin: 0 -16px;
			background: color-mix(in srgb, var(--bg) 88%, transparent);
			backdrop-filter: blur(12px);
			border-bottom: 1px solid var(--line);
		}
		aside nav {
			position: relative;
			top: 0;
			flex-direction: row;
			gap: 6px;
			overflow-x: auto;
			padding: 10px 16px;
			scrollbar-width: none;
			scroll-behavior: smooth;
		}
		aside nav::-webkit-scrollbar {
			display: none;
		}
		aside a {
			flex-shrink: 0;
			padding: 8px 14px;
			border: 1px solid var(--line);
			border-radius: 999px;
			white-space: nowrap;
		}
		aside a.active {
			border-color: transparent;
			background: var(--fg);
			color: var(--bg);
		}
		article :global(h1) {
			font-size: 28px;
		}
		article :global(h2) {
			font-size: 20px;
			margin-top: 36px;
			scroll-margin-top: 120px;
		}
	}
</style>

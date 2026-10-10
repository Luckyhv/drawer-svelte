<script lang="ts">
	import '@fontsource-variable/geist';
	import '@fontsource-variable/geist-mono';
	import '$lib/styles.css';
	import '$site/site.css';
	import { base } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();
	let dark = $state(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

	function toggleTheme() {
		dark = !dark;
		const root = document.documentElement;
		root.classList.toggle('dark', dark);
		root.classList.toggle('light', !dark);
		try {
			localStorage.setItem('theme', dark ? 'dark' : 'light');
		} catch {
			/* private mode */
		}
	}
	const onDocs = $derived(page.url.pathname.startsWith(`${base}/docs`));
</script>

<div data-drawer-wrapper class="app">
	<header class="top">
		<a class="wordmark" href="{base}/">drawer-svelte</a>
		<nav>
			<a href="{base}/docs/" class:active={onDocs}>Docs</a>
			<a href="{base}/docs/examples/">Examples</a>
			<a href="https://github.com/Luckyhv/drawer-svelte" rel="noreferrer">GitHub</a>
			<button type="button" class="theme" onclick={toggleTheme} aria-label="Toggle colour theme">
				{#if dark}
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
						><circle cx="12" cy="12" r="4" fill="currentColor" /><path
							d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/></svg
					>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
						><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" fill="currentColor" /></svg
					>
				{/if}
			</button>
		</nav>
	</header>
	{@render children()}
</div>
<style>
	.app {
		min-height: 100dvh;
		background: var(--bg);
	}
	.top {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		height: 56px;
		padding: 0 max(20px, env(safe-area-inset-right)) 0 max(20px, env(safe-area-inset-left));
		background: color-mix(in srgb, var(--bg) 84%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--line);
	}
	.wordmark {
		font: 500 14px var(--mono);
		letter-spacing: -0.02em;
		text-decoration: none;
		white-space: nowrap;
	}
	nav {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	nav a {
		padding: 6px 10px;
		border-radius: 8px;
		text-decoration: none;
		color: var(--muted);
		font-size: 14px;
		transition: color 0.15s;
	}
	nav a:hover,
	nav a.active {
		color: var(--fg);
	}
	.theme {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--fg);
		cursor: pointer;
		margin-left: 6px;
		transition: border-color 0.15s;
	}
	.theme:hover {
		border-color: var(--line-strong);
	}
	@media (pointer: coarse) {
		nav a {
			padding: 10px;
		}
		.theme {
			width: 40px;
			height: 40px;
		}
	}
	@media (max-width: 480px) {
		.top {
			padding-inline: max(16px, env(safe-area-inset-left)) max(12px, env(safe-area-inset-right));
		}
		nav a:nth-child(3) {
			display: none;
		}
	}
</style>

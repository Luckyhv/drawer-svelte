<script lang="ts">
	let { code, lang = 'svelte', title }: { code: string; lang?: string; title?: string } = $props();
	let copied = $state(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(code.trim());
			copied = true;
			setTimeout(() => (copied = false), 1400);
		} catch {
			/* clipboard blocked */
		}
	}

	// Monochrome highlighting: comments recede, everything else stays plain.
	const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const html = $derived(
		escape(code.trim()).replace(
			/(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/|(?<![:\w])\/\/.*$|^#.*$)/gm,
			'<span class="c">$1</span>'
		)
	);
</script>

<figure class="code">
	<figcaption>
		<span>{title ?? lang}</span>
		<button type="button" onclick={copy} aria-label="Copy code">{copied ? 'Copied' : 'Copy'}</button>
	</figcaption>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- escaped above -->
	<pre><code>{@html html}</code></pre>
</figure>

<style>
	.code {
		margin: 16px 0;
		border: 1px solid var(--line);
		border-radius: 14px;
		overflow: hidden;
		background: var(--code-bg);
	}
	figcaption {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 8px 6px 16px;
		font: 12px var(--mono);
		color: var(--muted);
		border-bottom: 1px solid var(--line);
	}
	button {
		border: 1px solid transparent;
		background: transparent;
		color: var(--muted);
		border-radius: 8px;
		padding: 4px 10px;
		font: 12px var(--sans);
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	button:hover {
		color: var(--fg);
		border-color: var(--line);
	}
	pre {
		margin: 0;
		padding: 16px;
		overflow-x: auto;
		font: 13px/1.7 var(--mono);
		color: var(--code-fg);
		tab-size: 2;
	}
	pre :global(.c) {
		color: var(--muted);
	}
</style>

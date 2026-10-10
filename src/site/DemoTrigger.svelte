<script lang="ts">
	import type { Snippet } from 'svelte';

	type Kind = 'bottom' | 'snap' | 'floating' | 'nested' | 'left' | 'right' | 'top' | 'nonmodal' | 'form' | 'scale' | 'steps';

	let {
		card = false,
		kind = 'bottom',
		title,
		text,
		action = 'Open',
		onclick,
		extra
	}: {
		/** Card with a description (landing, examples) instead of a plain button (inline in docs). */
		card?: boolean;
		kind?: Kind;
		title: string;
		text: string;
		action?: string;
		onclick: () => void;
		extra?: Snippet;
	} = $props();
</script>

{#if card}
	<div class="demo-card">
		<!-- Where the drawer sits on screen. -->
		<svg class="demo-glyph" viewBox="0 0 64 44" aria-hidden="true">
			<clipPath id="demo-glyph-clip"><rect x="1" y="1" width="62" height="42" rx="5" /></clipPath>
			<g clip-path="url(#demo-glyph-clip)">
				{#if kind === 'left'}
					<rect class="sheet" style="--tx: -26px" x="1" y="1" width="25" height="42" />
				{:else if kind === 'right'}
					<rect class="sheet" style="--tx: 26px" x="38" y="1" width="25" height="42" />
				{:else if kind === 'top'}
					<rect class="sheet" style="--ty: -20px" x="1" y="1" width="62" height="19" />
				{:else if kind === 'floating'}
					<rect class="sheet" style="--ty: 24px" x="6" y="21" width="52" height="17" rx="4" />
				{:else if kind === 'steps'}
					<rect class="ghost" x="6.5" y="9.5" width="51" height="28" rx="4" />
					<rect class="sheet" style="--ty: 22px" x="6" y="23" width="52" height="15" rx="4" />
				{:else if kind === 'nested'}
					<rect class="back" x="1" y="14" width="62" height="30" rx="5" />
					<rect class="sheet" style="--ty: 22px" x="6" y="24" width="52" height="14" rx="4" />
				{:else if kind === 'snap'}
					<rect class="ghost" x="1.5" y="8.5" width="61" height="40" rx="5" />
					<rect class="sheet" style="--ty: 22px" x="1" y="24" width="62" height="24" rx="5" />
				{:else if kind === 'nonmodal'}
					<rect class="back" x="8" y="8" width="26" height="3" rx="1.5" />
					<rect class="back" x="8" y="15" width="40" height="3" rx="1.5" />
					<rect class="sheet" style="--ty: 18px" x="1" y="28" width="62" height="20" rx="5" />
				{:else if kind === 'form'}
					<rect class="sheet" style="--ty: 30px" x="1" y="14" width="62" height="34" rx="5" />
				{:else if kind === 'scale'}
					<rect class="back" x="7" y="6" width="50" height="40" rx="4" />
					<rect class="sheet" style="--ty: 22px" x="1" y="24" width="62" height="24" rx="5" />
				{:else}
					<rect class="sheet" style="--ty: 24px" x="1" y="22" width="62" height="26" rx="5" />
				{/if}
			</g>
			<rect class="frame" x="0.5" y="0.5" width="63" height="43" rx="5.5" />
		</svg>
		<div class="demo-card-text">
			<h3>{title}</h3>
			<p>{text}</p>
		</div>
		<div class="demo-card-actions">
			<button type="button" class="demo-btn small demo-card-open" aria-label="{action} {title}" {onclick}>{action}</button>
			{@render extra?.()}
		</div>
	</div>
{:else}
	<button type="button" class="demo-btn" {onclick}>{action === 'Open' ? title : `${action} ${title.toLowerCase()}`}</button>
	{@render extra?.()}
{/if}

# drawer-svelte

An accessible, gesture-driven drawer (bottom sheet) for **Svelte 5.29+**, built with runes.
Inspired by [vaul](https://vaul.emilkowal.ski/); written from scratch, with no runtime dependencies.

- Drag to close, velocity flicks, rubber-banding, snap points measured live (no stale sizes)
- Touch-safe scroll handoff: lists scroll, and pulling down at the top drags the sheet
- Nested drawers: only the top one reacts to Escape / overlay taps / focus trap
- Scroll lock without `position: fixed` on `<body>` (no page jump on close)
- Focus moves in on open and back (with `preventScroll`) on close
- Keyboard-aware bottom drawers, all four directions, margins ("floating" drawers) handled
- Portal to `body`, any element (e.g. a fullscreen player), or render in place
- Headless by default, plus an optional stylesheet: `sheet` / `floating` / `side` presets,
  light / dark / auto themes, and every colour overridable with `--drawer-*` CSS variables or a `colors` prop
- Header / Body / Footer parts, overlay blur, custom easing, background scaling, persisted state

Docs and live demos: run `npm run dev` (or deploy the site, see below).

## Install

```sh
npm i drawer-svelte
```

## Usage

```svelte
<script>
	import { Drawer } from 'drawer-svelte';
	let open = $state(false);
</script>

<Drawer.Root bind:open snapPoints={[0.5, 0.92]}>
	<Drawer.Trigger>Open</Drawer.Trigger>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/50" />
		<Drawer.Content class="fixed inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-zinc-900">
			<Drawer.Handle class="flex justify-center py-2"><div class="h-1 w-10 rounded bg-white/30"></div></Drawer.Handle>
			<Drawer.Title>Comments</Drawer.Title>
			<!-- keeps the part below the screen reachable at a smaller snap -->
			<div class="overflow-y-auto" style="padding-bottom: var(--drawer-hidden)">…</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
```

### `Drawer.Root` props

| prop | default | |
| --- | --- | --- |
| `open` (bindable) | `false` | |
| `direction` | `'bottom'` | `'bottom' \| 'top' \| 'left' \| 'right'` |
| `modal` | `true` | overlay, scroll lock, focus trap, Escape / overlay tap to close |
| `dismissible` | `true` | allow closing by drag, Escape and overlay |
| `snapPoints` | - | visible sizes: fraction `(0,1]`, px number, `"300px"`, or `(viewport) => px` |
| `defaultSnap` | `0` | snap used on each open |
| `activeSnap` (bindable) | - | controlled snap index |
| `closeThreshold` | `0.25` | fraction of the size to drag past before a slow release closes |
| `velocityThreshold` | `0.4` | px/ms that counts as a flick |
| `handleOnly` | `false` | only `Drawer.Handle` starts drags |
| `lockScroll` | `modal` | |
| `restoreFocus` | `true` | |
| `keyboardAware` | `true` | lift bottom drawers above the on-screen keyboard |
| `scaleNested` | `true` | recede slightly while another drawer is open on top |
| `snapToSequentialPoint` | `false` | every flick moves exactly one snap, instead of travelling further the harder it is |
| `scrollLockTimeout` | `100` | ms after the content last scrolled during which a touch scrolls instead of dragging |
| `duration` | `450` | ms (0 with `prefers-reduced-motion`) |
| `onOpenChange`, `onSnapChange`, `onAnimationEnd` | | |

### Parts

`Trigger`, `Portal` (`to`: element / selector / `false`), `Overlay` (modal only), `Content`
(`data-state`, `data-direction`, `data-dragging`, `data-snap`; CSS var `--drawer-hidden`),
`Handle`, `Title`, `Description`, `Close`.

Add `data-drawer-no-drag` to any element that must never start a drag.

## Theming

```svelte
<script>
	import 'drawer-svelte/styles.css';
</script>

<Drawer.Root bind:open theme="auto" colors={{ bg: '#101014', fg: '#f4f4f5', accent: '#5fd39a' }}>
	<Drawer.Portal>
		<Drawer.Overlay blur />
		<Drawer.Content variant="floating" style="--drawer-radius: 24px">…</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
```

Variables: `--drawer-bg --drawer-fg --drawer-muted --drawer-border --drawer-handle --drawer-overlay
--drawer-shadow --drawer-accent --drawer-hover --drawer-radius --drawer-gap --drawer-width
--drawer-max-height --drawer-z`. See `/docs/theming` on the site.

How it's built: [ARCHITECTURE.md](./ARCHITECTURE.md) (also `/docs/how-it-works`).

## Mobile integration

Use the default `snapSizing="translate"` for smooth dragging. It paints transforms and
opacity at most once per animation frame; `snapSizing="height"` also changes layout
while expanding and is useful when a footer must stay visible.

Use `Drawer.Body` for scrollable content, and keep `touch-action: auto` on content and
scroll areas. `Drawer.Handle` and `Drawer.Header` reserve their gestures for dragging.
For long lists or embedded players, `handleOnly` keeps content gestures dedicated to
scrolling and interaction. Avoid overlay blur and background scaling on busy screens
until you have profiled them on the phones you support. Virtualize very long lists in
the consuming app.

With the optional presets, the host page should use
`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
to enable the safe-area padding. Headless content should use `box-sizing: border-box`
when combining explicit snap sizes with padding or borders. Ensure your CSS max-size
allows the largest snap; a smaller `max-height` / `max-width` changes the rendered size
without changing the snap geometry.

The tests simulate touch events in a DOM environment; they do not measure mobile frame
rates or native scrolling. Before releasing, verify on iOS Safari and Android Chrome:
list momentum scrolling, dragging at the scroll edge, quick close/reopen, nested sheets,
keyboard show/hide, portrait/landscape rotation, safe areas and reduced motion. Also
check page scroll stays locked on the iOS versions you support. Modal drawers currently
trap Tab but do not make the rest of the document inert; full screen-reader isolation
still needs implementation or an integration-level dialog primitive.

## Develop

```sh
npm install
npm run dev      # demo at http://localhost:5173 (also on your LAN for phone testing)
npm test         # geometry, lifecycle, scroll-lock and gesture regression tests
npm run package  # builds dist/ and runs publint
```

## Docs site

The repo doubles as the docs site (SvelteKit + adapter-static).

```sh
npm run build          # static site in build/ + the package in dist/
```

- **Vercel / Netlify / Cloudflare Pages:** build command `npm run build`, output directory `build`.
- **GitHub Pages** (served under `/<repo>`): `BASE_PATH=/drawer-svelte npm run build`, publish `build/`.

## Publishing

`drawer-svelte` is taken on npm, so publish under a scope: set `"name": "@your-scope/drawer-svelte"`
in package.json, then `npm publish --access public` (runs type checks, tests, packaging and publint first).

## License

MIT

// Code samples shown on the site (strings, so braces need no escaping).

export const install = `npm i drawer-svelte`;

export const quick = `<script>
  import { Drawer } from 'drawer-svelte';
  import 'drawer-svelte/styles.css'; // optional preset look

  let open = $state(false);
</script>

<button onclick={() => (open = true)}>Open</button>

<Drawer.Root bind:open>
  <Drawer.Portal>
    <Drawer.Overlay />
    <Drawer.Content variant="sheet">
      <Drawer.Handle />
      <Drawer.Header title="Hello" description="Drag me down." />
      <Drawer.Body>…</Drawer.Body>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>`;

export const headless = `<Drawer.Root bind:open>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/50" />
    <Drawer.Content class="fixed inset-x-0 bottom-0 rounded-t-2xl bg-zinc-900 text-white">
      <Drawer.Handle class="flex justify-center py-2">
        <div class="h-1 w-10 rounded-full bg-white/30"></div>
      </Drawer.Handle>
      <Drawer.Title class="px-4 font-semibold">Headless</Drawer.Title>
      <Drawer.Description class="px-4 text-sm text-zinc-400">
        Style every part yourself (Tailwind, CSS, anything).
      </Drawer.Description>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>`;

export const anatomy = `<Drawer.Root>            <!-- state, gestures, options -->
  <Drawer.Trigger />      <!-- optional toggle button -->
  <Drawer.Portal>         <!-- renders into <body> (or "to") -->
    <Drawer.Overlay />    <!-- modal drawers only -->
    <Drawer.Content>      <!-- the sheet: role="dialog" -->
      <Drawer.Handle />   <!-- grab area / bar -->
      <Drawer.Header />   <!-- optional: title, description, close -->
      <Drawer.Title />
      <Drawer.Description />
      <Drawer.Body />     <!-- optional scroll area -->
      <Drawer.Footer />   <!-- optional action row -->
      <Drawer.Close />
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>`;

export const snaps = `<script>
  let open = $state(false);
  let snap = $state(0);
</script>

<!-- 50% of the screen, then 92% -->
<Drawer.Root bind:open snapPoints={[0.5, 0.92]} bind:activeSnap={snap}>
  <Drawer.Portal>
    <Drawer.Overlay />
    <Drawer.Content variant="sheet">
      <Drawer.Handle />
      <Drawer.Body>
        <!-- long list: pull down at the top drags the sheet -->
      </Drawer.Body>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>`;

export const snapForms = `snapPoints={[
  0.4,                       // 40% of the viewport
  320,                       // 320px (numbers > 1 are pixels)
  '480px',                   // also pixels
  (vh) => vh - playerBottom  // computed live on every resize
]}`;

export const hiddenPad = `<!-- Drawer.Body does this for you -->
<div class="overflow-y-auto" style="padding-bottom: var(--drawer-hidden)">
  …
</div>`;

export const directions = `<Drawer.Root bind:open direction="right">
  <Drawer.Portal>
    <Drawer.Overlay />
    <Drawer.Content variant="side">…</Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>`;

export const nonModal = `<!-- No overlay, no scroll lock, no focus trap: the page stays usable
     (e.g. a comments sheet under a playing video). -->
<Drawer.Root bind:open modal={false} snapPoints={[0.4, 0.9]}>…</Drawer.Root>`;

export const nested = `<Drawer.Root bind:open={comments}>
  …<button onclick={() => (gifs = true)}>GIF</button>…
</Drawer.Root>

<!-- Opened later = stacked on top. Esc / overlay taps close only the top one. -->
<Drawer.Root bind:open={gifs}>…</Drawer.Root>`;

export const fullscreen = `<!-- The fullscreen top layer only paints its own subtree:
     portal into the player while it is fullscreen. -->
<Drawer.Portal to={document.fullscreenElement ?? undefined}>…</Drawer.Portal>`;

export const noDrag = `<div data-drawer-no-drag>
  <input type="range" />  <!-- inputs, textareas and sliders never start a drag anyway -->
</div>`;

export const themeVars = `/* anywhere: :root, a theme class, one drawer's style */
:root {
  --drawer-bg: #ffffff;
  --drawer-fg: #0a0a0b;
  --drawer-muted: #6b6b76;
  --drawer-border: rgb(0 0 0 / 0.08);
  --drawer-handle: rgb(0 0 0 / 0.18);
  --drawer-overlay: rgb(10 10 12 / 0.4);
  --drawer-shadow: 0 -12px 48px rgb(0 0 0 / 0.14);
  --drawer-accent: #0a0a0b;
  --drawer-radius: 20px;
  --drawer-gap: 8px;            /* floating variant margin */
  --drawer-width: 380px;        /* side drawers */
  --drawer-max-height: 96dvh;
  --drawer-z: 50;
}

.dark {
  --drawer-bg: #17171a;
  --drawer-fg: #f5f5f7;
}`;

export const themeProp = `<!-- auto (default): follows prefers-color-scheme or a .dark / [data-theme="dark"] ancestor -->
<Drawer.Root bind:open theme="dark">…</Drawer.Root>

<!-- your users' own colours, straight from settings -->
<Drawer.Root
  bind:open
  colors={{ bg: user.surface, fg: user.text, accent: user.accent, overlay: 'rgb(0 0 0 / .5)' }}
>…</Drawer.Root>`;

export const perDrawer = `<Drawer.Content variant="sheet" style="--drawer-radius: 28px; --drawer-bg: #101820">`;

export const tailwindTheme = `<!-- Tailwind: arbitrary properties work too -->
<Drawer.Content variant="floating" class="[--drawer-bg:theme(colors.zinc.900)] [--drawer-radius:1.5rem]">`;

export const scale = `<!-- wrap your app once; give it a background so the page can go dark behind it -->
<div data-drawer-wrapper class="bg-white">
  <slot />
</div>

<Drawer.Root bind:open scaleBackground>…</Drawer.Root>`;

export const persist = `<Drawer.Root bind:open persistKey="settings">…</Drawer.Root>`;

export const controlled = `<script>
  let open = $state(false);
</script>

<Drawer.Root
  bind:open
  onOpenChange={(v) => console.log('open', v)}
  onSnapChange={(i) => console.log('snap', i)}
  onAnimationEnd={(v) => !v && console.log('fully closed')}
>…</Drawer.Root>`;

export const vaulMigration = `- import { Drawer } from 'vaul-svelte';
+ import { Drawer } from 'drawer-svelte';

  <Drawer.Root bind:open>
    <Drawer.Portal>
      <Drawer.Overlay class="…" />
      <Drawer.Content class="…">…</Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>

# props that differ
- shouldScaleBackground      + scaleBackground
- activeSnapPoint (a value)  + activeSnap (an index)
- noBodyStyles / repositionInputs   (not needed: no body pinning, keyboard-aware by default)
- Drawer.Content interactOutsideBehavior / onCloseAutoFocus   (not needed: see "Behaviour")`;

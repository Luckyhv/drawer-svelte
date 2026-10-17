# How drawer-svelte works

This is the same explanation as the site's "How it works" page (`/docs/how-it-works`), kept here for contributors.

## Code layout

```
src/lib/
  index.ts            public exports
  styles.css          optional stylesheet (themes, variants)
  drawer/
    math.ts           pure geometry: snap sizes, release decision, rubber band, velocity (unit-tested)
    dom.ts            scroll lock, layer stack, portal, scroll-parent detection, focus helpers
    state.svelte.ts   DrawerState: lifecycle, styles, gestures, keyboard, focus (Svelte 5 runes)
    Root.svelte       props -> DrawerState, context, persistence
    Content.svelte    the dialog element; attaches gestures; renders state as inline style
    Overlay, Portal, Handle, Header, Body, Footer, Title, Description, Trigger, Close
src/site/             docs-site components and demos (not published)
src/routes/           docs site (prerendered with adapter-static)
```

All behaviour lives in `DrawerState`. The components only read state and forward attributes.

## Geometry

The position is one number, the **offset**: pixels toward the closed edge.

```
offset    = resting + drag            // 0 = fully open
resting   = maxSnap - activeSnapSize  // 0 without snap points
transform = translate(offset)         // along the axis, sign by direction
closed    = translate(calc(100% + gap + 8px))  // gap = measured margin, so floating drawers fully hide
```

Only `transform` changes while dragging, so animation stays on the compositor. With snap points the element is as tall as the largest snap, and `--drawer-hidden` tells scroll areas how much of them is below the screen. Snap sizes are a reactive derived value: recalculated when the viewport or snap props change, reused during gestures. Drag painting is coalesced through requestAnimationFrame. Height sizing also changes layout while expanding.

## Lifecycle

1. **opening**: mount parked off-screen, no transition.
2. Measure the edge gap, focus with `preventScroll`, force a style read, set **open**. The transition plays. There is no rAF wait, so it works in background tabs.
3. **closing**: transform back to parked, starting from the dragged position if there was one.
4. On `transitionend` (or a timer fallback): unmount, release the scroll lock, leave the layer stack, restore focus without scrolling.

## Gestures

Content keeps `touch-action: auto` for native scrolling and zoom; handles use `none`. Touch uses **touch events** with a non-passive `touchmove`. Pointer events get `pointercancel` as soon as the browser treats the touch as a scroll, which is what freezes drawers half-dragged inside lists. Mouse and pen use pointer events.

```
pending --(5px)--> decide:
  sideways                          -> ignore
  toward closed:  scroller at start  -> drag, else native scroll
  toward open:    below top snap     -> drag (expand)
                  at top snap        -> drag only from a non-scrolling area
drag -> preventDefault on every move, paint once per animation frame
native scroll -> list reaches its edge, finger still pulling -> drag (same gesture)
```

Lists inside a drawer get `overscroll-behavior: none` on first touch, so a pull at the edge moves the sheet instead of rubber-banding the list.

Release (`decideRelease` in math.ts): a flick (velocity over the last ~100 ms ≥ threshold) carries momentum and lands on the snap nearest to where it would coast, always at least one snap away; a hard one closes. `snapToSequentialPoint` limits it to one snap. The release animation is a cubic-bezier that starts at the finger's speed (`springEasing`); after a flick its y2 is 1.1, so it settles ~1–3% past the target and back (≈ a 0.8-damped spring), while slower releases never overshoot. Otherwise, past the smallest snap by `closeThreshold` closes, else it settles on the nearest snap. Dragging past fully open is rubber-banded. A real drag swallows the following click. A touch drag that starts off the handle holds the sheet still until the finger is more than 10px from where it landed: ownership of the touch is decided on its first pixel, but a tap drifts further than that, and a held drag that ends is still a tap (nothing moves, the click goes through). Mouse drags and handle drags follow from the start.

## Layers, Escape, focus

A module-level stack of open drawers. Escape, overlay taps and the Tab trap act only on the top drawer. Gestures ignore events from another drawer's content.

## Scroll lock

`overflow: hidden` on `<html>`, ref-counted, with scrollbar compensation. `body` is never pinned with `position: fixed`, so closing never jumps the page.

## Keyboard

For bottom drawers, `visualViewport` measures the keyboard while a field inside is focused and lifts the drawer by that amount. Keyboard-caused resizes are ignored for snap points.

## Theming

Private tokens (`--_bg`, ...) per theme; every rule reads `var(--drawer-bg, var(--_bg))`. Public variables (or the `colors` prop, which writes them inline) win, and `:where()` keeps specificity at zero so user classes win too.

## Checks

- `npm test`: math plus DOM lifecycle, scroll-lock and gesture regression tests
- `npm run check`: svelte-check
- `npm run package`: builds dist and runs publint
- `npm run build`: builds the docs site into `build/`

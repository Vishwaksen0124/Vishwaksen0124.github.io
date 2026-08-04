# vishwaksen0124.github.io

Personal portfolio of **Vishwaksen Pujala** — Software / AI / Backend Engineer.

🔗 **Live:** https://vishwaksen0124.github.io

## Stack
Hand-coded **HTML / CSS / JavaScript** with a WebGL centrepiece. No build step — GitHub Pages serves the static files directly. Three.js loads from a CDN via an `importmap`, so there is still nothing to compile or install.

```
index.html     # markup + content
styles.css     # theme, layout, responsive, 3D transforms, dark/light
script.js      # content data, smooth scroll, line reveals, cursor, intro, tilt
scene.js       # the WebGL structure (ES module)
resume.pdf     # downloadable résumé
```

## The structure
`scene.js` renders one object made of ~720 instanced shards that **rebuilds itself into a
different formation for every section**: sphere → helix → orbitals → lattice → skyline →
wave → torus → burst. Scroll drives the morph.

Two details do most of the work:

- **Formations are anchored to real section positions**, not to a flat fraction of the
  document. The structure *settles* exactly while a section is centred and does its
  rebuilding in the gaps between them, so the page has a rhythm instead of a constant hum.
- **It lives in the margins, alternating sides** down the page, and retreats deep into the
  frame while morphing rather than sliding across the middle of the copy. Positions are
  fractions of the visible half-extent, so the composition holds from 320px to 1920px.

Glow is an additive halo layer, deliberately *not* `UnrealBloomPass` — see the note in
`scene.js` for the measurements behind that call.

## Motion layer
- **Smooth scroll** — the native scrollbar drives a time-eased transform on `#smooth`. Time-based, so it feels identical at 60Hz and 144Hz. Anchor links are intercepted (a fixed, transformed container gives the browser nothing to scroll).
- **Masked line reveals** — paragraphs are measured after `document.fonts.ready`, regrouped into per-line masks, and slid up with a stagger. Re-runs on resize.
- **Custom cursor**, magnetic buttons, cursor-tracked 3D tilt with real `translateZ` parallax, parallaxed ghost numerals, a scroll rail, a boot counter, and marquee skill rows.

Everything degrades safely: no WebGL, a blocked CDN, `prefers-reduced-motion`, coarse
pointers, or the `◍` toggle in the nav each fall back cleanly with the site fully intact.
The toggle choice persists in `localStorage`.

### Tuning it
- **Density / cost** — `COUNT` and `LINK_COUNT` in `scene.js`; both already scale down on small screens.
- **Composition** — the `SECTIONS` array: `form` picks the formation, `offset` is `[xFraction, yFraction, z]`, `calm` pulls it back for sections whose copy runs full-width.
- **Sections** — `SECTIONS` must stay in sync with the `data-scene` attributes in `index.html`.
- **Colour** — `PALETTE` in `scene.js`.

## Editing
- **Projects** and **skills** are data-driven — edit the `WORKS` / `SKILLS` / `ROLES` arrays in `script.js`.
- **Experience / About / Contact** are plain HTML in `index.html`.
- Replace `resume.pdf` to update the downloadable résumé.

Push to `main` and GitHub Pages redeploys automatically.

/* ============================================================
   scene.js — "Formations"

   One structure made of hundreds of solid shards. It doesn't sit
   in the background being decorative: it is the centrepiece, and
   it rebuilds itself into a different formation for every section
   of the page — sphere, helix, orbitals, lattice, skyline, wave,
   torus, burst. Scroll drives the morph.

   Energy peaks *between* sections (mid-morph) and settles while
   you're reading one, so the page has a rhythm instead of a
   constant hum.

   Vanilla ES module, three.js + postprocessing from CDN via the
   importmap in index.html. No build step. Falls back to a static
   CSS backdrop if WebGL or the CDN is unavailable.
   ============================================================ */

const canvas = document.getElementById("bg");
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function bail(reason) {
  root.classList.add("no-3d");
  root.classList.remove("has-3d");
  if (canvas) canvas.style.display = "none";
  window.__scene = { ok: false, reason, setTheme() {}, setEnabled() {} };
  window.dispatchEvent(new CustomEvent("scene:failed", { detail: { reason } }));
}

function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

/* Bail cleanly rather than throwing — an uncaught module error would surface
   as a red console error on a perfectly healthy page. */
if (!canvas || !webglSupported()) bail("no-webgl");
else if (localStorage.getItem("scene") === "off") bail("user-off");
else await boot();

async function boot() {

let THREE;
try {
  THREE = await import("three");
} catch {
  bail("no-three");
  return;
}

/* --- deterministic rng so the structure never reshuffles ---- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x51ad3f);

/* --- budget ------------------------------------------------- */
const small = matchMedia("(max-width: 820px)").matches;
const COUNT = small ? 260 : 720;
const HOT_RATIO = 0.17;               // share of shards that glow

/* --- palette ------------------------------------------------ */
const PALETTE = {
  dark: {
    bg: new THREE.Color("#0b0c0d"),
    cold: new THREE.Color("#3a444c"),
    hot: new THREE.Color("#c6f135"),
    key: new THREE.Color("#eaf2ff"),
    rim: new THREE.Color("#c6f135"),
    fill: new THREE.Color("#2b4a63"),
    bloom: 1.0
  },
  light: {
    bg: new THREE.Color("#f6f5f0"),
    cold: new THREE.Color("#c3c6ba"),
    hot: new THREE.Color("#5d7f16"),
    key: new THREE.Color("#ffffff"),
    rim: new THREE.Color("#8fb63a"),
    fill: new THREE.Color("#9aa79c"),
    bloom: 0.28
  }
};
let theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";

/* ============================================================
   SECTIONS → FORMATIONS
   `calm` pulls the structure back and dims it for sections whose
   copy runs full-width and needs the room.
   ============================================================ */
/* offset x/y are fractions of the visible half-extent at the structure's
   depth, not world units — so it lands in the same place relative to the
   frame on a phone and on a 32" monitor. Sides alternate down the page so
   the centre column stays clear and the eye gets a rhythm. */
const SECTIONS = [
  { id: "top",        form: "sphere",   offset: [ 0.52,  0.06,  0.0], calm: 0.10 },
  { id: "about",      form: "helix",    offset: [ 0.52,  0.00, -1.0], calm: 0.30 },
  { id: "roles",      form: "orbitals", offset: [ 1.02,  0.10, -3.0], calm: 0.52 },
  { id: "skills",     form: "lattice",  offset: [-1.02, -0.06, -3.0], calm: 0.54 },
  { id: "work",       form: "skyline",  offset: [ 0.96,  0.00, -2.0], calm: 0.42 },
  { id: "experience", form: "wave",     offset: [-0.96,  0.05, -2.5], calm: 0.46 },
  { id: "education",  form: "torus",    offset: [ 0.94,  0.00, -3.0], calm: 0.50 },
  { id: "contact",    form: "burst",    offset: [ 0.60,  0.00, -0.5], calm: 0.28 }
];
const N = SECTIONS.length;

/* ============================================================
   FORMATION GENERATORS
   Each fills a Float32Array(COUNT * 3).
   ============================================================ */
const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function make(fn) {
  const a = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const p = fn(i, COUNT);
    a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2];
  }
  return a;
}

/* stable per-shard noise, reused across formations so a shard keeps
   its "personality" as the structure rebuilds */
const jitter = [];
for (let i = 0; i < COUNT; i++) jitter.push([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]);

const FORMS = {
  // dense shell — the resting state
  sphere: make((i, n) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * GOLDEN;
    const R = 3.5 + jitter[i][0] * 0.5;
    return [Math.cos(a) * r * R, y * R, Math.sin(a) * r * R];
  }),

  // twin strands climbing — "picking up whichever hat the week demanded"
  helix: make((i, n) => {
    const t = i / (n - 1);
    const strand = i % 2;
    const a = t * TAU * 3.4 + strand * Math.PI;
    const r = 2.0 + jitter[i][1] * 0.35;
    return [Math.cos(a) * r, (t - 0.5) * 10.5, Math.sin(a) * r];
  }),

  // three tilted orbital rings — services circling a core
  orbitals: make((i, n) => {
    const ring = i % 3;
    const a = (i / n) * TAU * 7 + ring * 1.2;
    const R = 2.4 + ring * 1.15;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    const tilt = ring * 0.85 + 0.25;
    return [
      x,
      z * Math.sin(tilt) + jitter[i][1] * 0.28,
      z * Math.cos(tilt)
    ];
  }),

  // cubic lattice — the toolbox, ordered
  lattice: make((i) => {
    const side = Math.ceil(Math.cbrt(COUNT));
    const s = 0.82;
    const x = i % side;
    const y = Math.floor(i / side) % side;
    const z = Math.floor(i / (side * side));
    const o = ((side - 1) * s) / 2;
    return [x * s - o + jitter[i][0] * 0.1, y * s - o + jitter[i][1] * 0.1, z * s - o + jitter[i][2] * 0.1];
  }),

  // columns of varying height — throughput, a skyline of shipped work
  skyline: make((i, n) => {
    const cols = 16;
    const c = i % cols;
    const rowIdx = Math.floor(i / cols);
    const rows = Math.ceil(n / cols);
    const h = 1.6 + ((Math.sin(c * 1.7) + 1) / 2) * 5.6;
    const t = rowIdx / Math.max(1, rows - 1);
    const ang = (c / cols) * TAU;
    const R = 3.4;
    return [
      Math.cos(ang) * R + jitter[i][0] * 0.16,
      -3.2 + t * h,
      Math.sin(ang) * R + jitter[i][2] * 0.16
    ];
  }),

  // rolling sheet — time passing
  wave: make((i, n) => {
    const side = Math.ceil(Math.sqrt(n));
    const s = 0.62;
    const x = (i % side) * s - (side * s) / 2;
    const z = Math.floor(i / side) * s - (side * s) / 2;
    return [x, Math.sin(x * 0.55) * Math.cos(z * 0.5) * 1.5 + jitter[i][1] * 0.16, z];
  }),

  torus: make((i, n) => {
    const u = (i / n) * TAU * 9;
    const v = i * GOLDEN * 3;
    const R = 3.1, r = 1.15 + jitter[i][2] * 0.22;
    return [
      (R + r * Math.cos(v)) * Math.cos(u),
      r * Math.sin(v),
      (R + r * Math.cos(v)) * Math.sin(u)
    ];
  }),

  // rays outward — reach out
  burst: make((i) => {
    const j = jitter[i];
    const len = Math.hypot(j[0], j[1], j[2]) || 1;
    const R = 1.1 + ((i * 37) % 100) / 100 * 6.4;
    return [(j[0] / len) * R, (j[1] / len) * R, (j[2] / len) * R];
  })
};

const FORM_LIST = SECTIONS.map((s) => FORMS[s.form]);

/* ============================================================
   RENDERER / SCENE
   ============================================================ */
/* The canvas is transparent and the page's own --bg shows through. Clearing
   to a colour instead meant the clear value round-tripped through the
   composer's colour management and came out ~4x lighter than the CSS
   background — measurably #2e3134 instead of #0b0c0d. This also makes the
   light theme correct for free. */
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: !small, powerPreference: "high-performance"
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setClearColor(PALETTE[theme].bg, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(PALETTE[theme].bg, 14, 42);

const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
camera.position.set(0, 0, 14.5);

const group = new THREE.Group();
scene.add(group);

/* --- lights ------------------------------------------------- */
const ambient = new THREE.AmbientLight(0xffffff, theme === "light" ? 1.5 : 0.55);
const keyLight = new THREE.DirectionalLight(PALETTE[theme].key, 2.1);
keyLight.position.set(5, 6, 8);
const rimLight = new THREE.DirectionalLight(PALETTE[theme].rim, 2.6);
rimLight.position.set(-6, -2, -5);
const fillLight = new THREE.DirectionalLight(PALETTE[theme].fill, 1.3);
fillLight.position.set(-4, 5, 3);
scene.add(ambient, keyLight, rimLight, fillLight);

/* --- shards -------------------------------------------------
   Two meshes over the same formation data: matte shards that
   catch the lights, and a minority of emissive ones that the
   bloom pass turns into glow. */
const hotIdx = [];
const coldIdx = [];
for (let i = 0; i < COUNT; i++) (rnd() < HOT_RATIO ? hotIdx : coldIdx).push(i);

const geo = new THREE.OctahedronGeometry(0.115, 0);
const coldMat = new THREE.MeshStandardMaterial({
  color: PALETTE[theme].cold, metalness: 0.42, roughness: 0.34, flatShading: true
});
const hotMat = new THREE.MeshBasicMaterial({ color: PALETTE[theme].hot, toneMapped: false });

const coldMesh = new THREE.InstancedMesh(geo, coldMat, coldIdx.length);
const hotMesh = new THREE.InstancedMesh(geo, hotMat, hotIdx.length);
coldMesh.frustumCulled = false;
hotMesh.frustumCulled = false;
coldMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
hotMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
group.add(coldMesh, hotMesh);

/* per-shard spin, so the structure is never static even at rest */
const axes = [], spins = [], scales = [];
for (let i = 0; i < COUNT; i++) {
  const v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
  axes.push(v);
  spins.push(0.25 + rnd() * 0.85);
  scales.push(0.65 + rnd() * 0.85);
}

/* --- connective threads between neighbouring shards ---------
   Rebuilt from live positions each frame so they hold the
   structure together through every morph. */
const LINK_COUNT = small ? 90 : 260;
const links = [];
for (let k = 0; k < LINK_COUNT; k++) {
  links.push([Math.floor(rnd() * COUNT), Math.floor(rnd() * COUNT)]);
}
const linkPos = new Float32Array(LINK_COUNT * 6);
const linkGeo = new THREE.BufferGeometry();
linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPos, 3));
const linkMat = new THREE.LineBasicMaterial({
  color: PALETTE[theme].hot, transparent: true, opacity: 0.16, depthWrite: false
});
group.add(new THREE.LineSegments(linkGeo, linkMat));

/* ============================================================
   GLOW
   Deliberately not UnrealBloomPass. Running the scene through
   EffectComposer put the whole render on a different colour path —
   the page background measured #2e3134 instead of the #0b0c0d the
   CSS asks for — and sweeping the bloom strength from 0 to 1 made
   no measurable difference to the peak glow anyway. A halo layer
   costs one extra draw call, keeps three's standard colour
   management, and is far cheaper on a laptop GPU.
   ============================================================ */
const haloMat = new THREE.MeshBasicMaterial({
  color: PALETTE[theme].hot, transparent: true, opacity: 0.16,
  blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
});
const haloMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.42, 0), haloMat, hotIdx.length);
haloMesh.frustumCulled = false;
haloMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
group.add(haloMesh);

/* ============================================================
   SCROLL → FORMATION
   ============================================================ */
let scrollP = 0;          // 0..1 through the document, for slow global drift
let formIndex = 0;        // float index into SECTIONS
let energy = 0;           // 0 at rest inside a section, 1 mid-morph
let calm = SECTIONS[0].calm;
const offset = new THREE.Vector3(...SECTIONS[0].offset);
const offsetTarget = offset.clone();

const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

/* Scroll position at which each section sits centred in the viewport.
   Driving the morph off these — rather than off a flat fraction of the
   document — is what makes the structure *settle* exactly while you're
   reading a section, and do its rebuilding in the gaps between them. */
let anchors = [];
function computeAnchors() {
  const limit = (window.__smooth && window.__smooth.limit) ||
                (document.documentElement.scrollHeight - window.innerHeight);
  anchors = SECTIONS.map((s) => {
    const el = document.querySelector(`[data-scene="${s.id}"]`);
    if (!el) return 0;
    const c = el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2;
    return Math.min(limit, Math.max(0, c));
  });
  // clamping can flatten the ends together; keep it strictly increasing
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i] <= anchors[i - 1]) anchors[i] = anchors[i - 1] + 1;
  }
}

function readScroll() {
  // the page uses a transform-driven smooth scroll, so trust the smoothed
  // value it publishes when there is one
  const sm = window.__smooth;
  const y = sm && typeof sm.current === "number" ? sm.current : window.scrollY;
  const h = (sm && sm.limit) || (document.documentElement.scrollHeight - window.innerHeight);
  scrollP = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;

  if (!anchors.length) return 0;
  if (y <= anchors[0]) return 0;
  if (y >= anchors[N - 1]) return N - 1;
  let i = 0;
  while (i < N - 2 && y > anchors[i + 1]) i++;
  const span = anchors[i + 1] - anchors[i];
  return i + (span > 0 ? (y - anchors[i]) / span : 0);
}

/* ============================================================
   LOOP
   ============================================================ */
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener("pointermove", (e) => {
  pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();
const live = new Float32Array(COUNT * 3);   // current world-ish positions, for the links

let running = false, raf = 0, last = performance.now(), clock = 0;

/* half-extent of the visible frame at the structure's depth, so offsets can
   be expressed as fractions of the screen rather than world units */
let halfW = 10, halfH = 6;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.85);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  halfH = Math.tan((camera.fov / 2) * Math.PI / 180) * camera.position.z;
  halfW = halfH * camera.aspect;
  computeAnchors();
}
window.addEventListener("resize", resize);

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!reduceMotion) clock += dt;

  const f = readScroll();

  /* which formation, and how far between */
  const i0 = Math.min(N - 2, Math.floor(f));
  const raw = Math.min(1, Math.max(0, f - i0));
  const t = smootherstep(raw);
  formIndex = f;
  energy = Math.sin(raw * Math.PI);              // peaks mid-morph
  calm = lerp(SECTIONS[i0].calm, SECTIONS[i0 + 1].calm, t);

  offsetTarget.set(
    lerp(SECTIONS[i0].offset[0], SECTIONS[i0 + 1].offset[0], t),
    lerp(SECTIONS[i0].offset[1], SECTIONS[i0 + 1].offset[1], t),
    lerp(SECTIONS[i0].offset[2], SECTIONS[i0 + 1].offset[2], t)
  );
  offset.lerp(offsetTarget, Math.min(1, dt * 3.4));

  const A = FORM_LIST[i0], B = FORM_LIST[i0 + 1];

  /* presence: dim + shrink while a section is being read, swell mid-morph.
     A phone has no margins to push the structure into, so it also runs
     smaller there. */
  const presence = (1 - calm * 0.45) * (0.93 + energy * 0.07) * (small ? 0.5 : 1);
  const spinBoost = 1 + energy * 2.6;

  pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2.6);
  pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2.6);

  /* Consecutive sections park the structure on opposite sides, so a straight
     lerp would drag it across the middle of the copy every time. Pull it
     deep into the frame while it rebuilds instead: it retreats, morphs, and
     comes back on the far side. */
  group.position.set(offset.x * halfW, offset.y * halfH, offset.z - energy * 8);
  group.rotation.y = clock * 0.11 + pointer.x * 0.42 + scrollP * 1.5;
  group.rotation.x = pointer.y * 0.26 + Math.sin(clock * 0.21) * 0.05;
  group.scale.setScalar(presence);

  /* write every shard */
  let ci = 0, hi = 0;
  for (let i = 0; i < COUNT; i++) {
    const k = i * 3;
    // travel between formations, bowing outward mid-flight so shards
    // arc rather than sliding along straight lines
    const bow = 1 + Math.sin(raw * Math.PI) * 0.20 * (1 + jitter[i][0]);
    const x = lerp(A[k], B[k], t) * bow;
    const y = lerp(A[k + 1], B[k + 1], t) * bow;
    const z = lerp(A[k + 2], B[k + 2], t) * bow;

    // gentle drift so nothing is ever perfectly still
    const d = reduceMotion ? 0 : 0.14;
    pos.set(
      x + Math.sin(clock * 0.7 + i) * d,
      y + Math.cos(clock * 0.6 + i * 1.3) * d,
      z + Math.sin(clock * 0.5 + i * 0.7) * d
    );
    live[k] = pos.x; live[k + 1] = pos.y; live[k + 2] = pos.z;

    q.setFromAxisAngle(axes[i], clock * spins[i] * spinBoost);
    const s = scales[i] * (1 + energy * 0.35);
    scl.setScalar(s);
    m4.compose(pos, q, scl);

    if (hotIdx[hi] === i) { hotMesh.setMatrixAt(hi, m4); haloMesh.setMatrixAt(hi, m4); hi++; }
    else coldMesh.setMatrixAt(ci++, m4);
  }
  coldMesh.instanceMatrix.needsUpdate = true;
  hotMesh.instanceMatrix.needsUpdate = true;
  haloMesh.instanceMatrix.needsUpdate = true;

  /* threads follow the shards */
  for (let k = 0; k < LINK_COUNT; k++) {
    const [a, b] = links[k];
    linkPos[k * 6]     = live[a * 3];
    linkPos[k * 6 + 1] = live[a * 3 + 1];
    linkPos[k * 6 + 2] = live[a * 3 + 2];
    linkPos[k * 6 + 3] = live[b * 3];
    linkPos[k * 6 + 4] = live[b * 3 + 1];
    linkPos[k * 6 + 5] = live[b * 3 + 2];
  }
  linkGeo.attributes.position.needsUpdate = true;
  linkGeo.computeBoundingSphere();
  linkMat.opacity = (0.05 + energy * 0.22) * (1 - calm * 0.5) * (theme === "light" ? 1.5 : 1);

  // the halo swells as the structure rebuilds — this is the glow beat
  haloMat.opacity = PALETTE[theme].bloom * (0.10 + energy * 0.20) * (1 - calm * 0.35);
  camera.position.z = 14.5 - energy * 1.3;

  renderer.render(scene, camera);
}

function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
function stop() { running = false; cancelAnimationFrame(raf); }
document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

/* ============================================================
   PUBLIC HANDLE
   ============================================================ */
window.__scene = {
  ok: true,
  stats: { shards: COUNT, formations: N, links: LINK_COUNT, glow: hotIdx.length },
  formationName: () => SECTIONS[Math.round(formIndex)].form,
  debug: () => ({
    f: +formIndex.toFixed(3), energy: +energy.toFixed(3), calm: +calm.toFixed(3),
    offset: [+offset.x.toFixed(2), +offset.y.toFixed(2), +offset.z.toFixed(2)],
    worldX: +(offset.x * halfW).toFixed(2), halfW: +halfW.toFixed(2),
    anchors: anchors.map((a) => Math.round(a))
  }),
  setTheme(mode) {
    theme = mode === "light" ? "light" : "dark";
    const p = PALETTE[theme];
    renderer.setClearColor(p.bg, 1);
    scene.fog.color.copy(p.bg);
    coldMat.color.copy(p.cold);
    hotMat.color.copy(p.hot);
    haloMat.color.copy(p.hot);
    linkMat.color.copy(p.hot);
    ambient.intensity = theme === "light" ? 1.5 : 0.55;
    keyLight.color.copy(p.key);
    rimLight.color.copy(p.rim);
    fillLight.color.copy(p.fill);
  },
  setEnabled(on) {
    if (on) { canvas.style.display = ""; start(); }
    else { stop(); canvas.style.display = "none"; }
  }
};

/* --- go ----------------------------------------------------- */
resize();
readScroll();
/* line-splitting and font swaps change section heights after first paint,
   so re-measure whenever the content box does */
const smoothEl = document.getElementById("smooth");
if (smoothEl && window.ResizeObserver) new ResizeObserver(computeAnchors).observe(smoothEl);
window.__scene.setTheme(theme);
start();
root.classList.add("has-3d");
window.dispatchEvent(new CustomEvent("scene:ready", { detail: window.__scene.stats }));

if (reduceMotion) {
  setTimeout(() => { renderer.render(scene, camera); stop(); }, 200);
}

} /* end boot() */

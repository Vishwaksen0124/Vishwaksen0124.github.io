/* ============================================================
   3D night city — a cinematic fly-through of an instanced
   Manhattan canyon: lit windows, drifting silk motes, fog, and
   web strands strung between the towers. Scrolling flies the
   camera down the avenue; the mouse banks it. No character —
   the city itself is the show.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("city3d");

let renderer, scene, camera, buildMesh, windowPts, neonPts, fieldPts, strands;
let model, mixer, rimLight, moonLight, ambient;
let sigils = [], embers, sigilMat, emberMat;
let W = innerWidth, H = innerHeight;
const tall = [];
const mouse = { x: 0, y: 0 };
const clock = { last: 0 };

function cssVar(n, d) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  return v || d;
}
function hexVar(n, d) { return new THREE.Color(cssVar(n, d)); }

function colors() {
  const silk = cssVar("--silk-rgb", "214,222,244").split(",").map(Number);
  return {
    bg: hexVar("--bg", "#07090f"),
    near: hexVar("--surface-2", "#121831").lerp(hexVar("--bg", "#07090f"), -1.1),
    win: hexVar("--city-window", "#ffd66b"),
    silk: new THREE.Color(silk[0] / 255, silk[1] / 255, silk[2] / 255),
    accent: hexVar("--red-bright", "#ff3b41"),
    neon: hexVar("--blue-soft", "#7e93ff")
  };
}

/* sag a quadratic web between two tower tops, sampled to a polyline */
function webStrand(a, b, silk) {
  const pts = [], sag = 26 + Math.random() * 22;
  const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - sag, mz = (a.z + b.z) / 2;
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, iu = 1 - u;
    pts.push(new THREE.Vector3(
      iu * iu * a.x + 2 * iu * u * mx + u * u * b.x,
      iu * iu * a.y + 2 * iu * u * my + u * u * b.y,
      iu * iu * a.z + 2 * iu * u * mz + u * u * b.z
    ));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(g, new THREE.LineBasicMaterial({
    color: silk, transparent: true, opacity: 0.16
  }));
}

/* Doctor Strange's Eldritch spell circle — concentric runic rings
   that counter-rotate. Built from line geometry; glows additively. */
function ringPts(r, segs) {
  const p = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    p.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  return p;
}
function spokes(r1, r2, n) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    p.push(new THREE.Vector3(c * r1, s * r1, 0), new THREE.Vector3(c * r2, s * r2, 0));
  }
  return p;
}
function makeSigil(R) {
  const g = new THREE.Group();
  const line = (pts, loop) => new (loop ? THREE.LineLoop : THREE.LineSegments)(
    new THREE.BufferGeometry().setFromPoints(pts), sigilMat);
  const outer = new THREE.Group();
  outer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(R, 128)), sigilMat));
  outer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(R * 0.94, 128)), sigilMat));
  outer.add(line(spokes(R * 0.94, R, 48)));         // outer ticks
  const inner = new THREE.Group();
  inner.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(R * 0.74, 128)), sigilMat));
  inner.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(R * 0.68, 128)), sigilMat));
  inner.add(line(spokes(R * 0.68, R * 0.74, 72)));  // rune ticks
  const core = new THREE.Group();                    // interlocked triangles (mandala star)
  const t1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(R * 0.42, 3)), sigilMat);
  const t2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(R * 0.42, 3)), sigilMat);
  t2.rotation.z = Math.PI;
  core.add(t1, t2);
  core.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(R * 0.5, 6)), sigilMat));
  g.add(outer, inner, core);
  g.userData = { outer, inner, core };
  return g;
}

function build() {
  const c = colors();
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(c.bg, 0.0023);
  camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1500);

  // image-based environment so the model's PBR materials read rich,
  // not flat/dark — the single biggest quality win for a 3D character
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

  // moonlight + theme-accent rim + sky fill so the night stays lit
  moonLight = new THREE.DirectionalLight(c.silk.clone(), 3.0);
  moonLight.position.set(0.5, 1, 0.4);
  scene.add(moonLight);
  rimLight = new THREE.DirectionalLight(c.accent.clone(), 1.3);
  rimLight.position.set(-0.7, 0.3, -0.5);
  scene.add(rimLight);
  ambient = new THREE.AmbientLight(c.bg.clone().lerp(c.silk, 0.6), 2.1);
  scene.add(ambient);
  scene.add(new THREE.HemisphereLight(c.silk.clone(), c.bg.clone(), 0.7));

  // a key light that travels with the camera to spotlight the model
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(5, 4, 6);
  camera.add(key);
  scene.add(camera);

  // instanced canyon lining the avenue, receding into -z
  const COUNT = innerWidth < 760 ? 130 : 220;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  buildMesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: c.near }), COUNT);
  const m = new THREE.Matrix4();
  const winPos = [], neonPos = [];
  tall.length = 0;
  for (let i = 0; i < COUNT; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (70 + Math.random() * 160);
    const z = 55 - (i / COUNT) * 900 - Math.random() * 18;
    const isTall = Math.random() < 0.16;
    const h = isTall ? 130 + Math.random() * 150 : 18 + Math.random() * 74;
    const w = 14 + Math.random() * 26;
    const d = 14 + Math.random() * 26;
    m.makeScale(w, h, d);
    m.setPosition(x, 0, z);
    buildMesh.setMatrixAt(i, m);
    if (isTall) tall.push({ x, y: h, z });
    const face = x > 0 ? x - w / 2 - 0.3 : x + w / 2 + 0.3;
    for (let wy = 4; wy < h - 3; wy += 5) {
      for (let wz = z - d / 2 + 2; wz < z + d / 2 - 1; wz += 4) {
        const r = Math.random();
        if (r < 0.36) winPos.push(face, wy, wz);          // warm windows
        else if (r < 0.46) neonPos.push(face, wy, wz);    // neon accents
      }
    }
  }
  scene.add(buildMesh);

  // warm windows glow with additive blending
  windowPts = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(winPos, 3)),
    new THREE.PointsMaterial({ color: c.win, size: 2.1, sizeAttenuation: true, transparent: true,
      opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(windowPts);

  // a scatter of neon (Spider-Verse) accent windows
  neonPts = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(neonPos, 3)),
    new THREE.PointsMaterial({ color: c.accent, size: 2.4, sizeAttenuation: true, transparent: true,
      opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(neonPts);

  // silk motes drifting high above the street
  const motes = [];
  for (let i = 0; i < 220; i++) {
    motes.push((Math.random() - 0.5) * 560, 18 + Math.random() * 230, 60 - Math.random() * 940);
  }
  fieldPts = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(motes, 3)),
    new THREE.PointsMaterial({ color: c.silk, size: 1.1, transparent: true, opacity: 0.45 })
  );
  scene.add(fieldPts);

  // signature touch: web strands strung between nearby tall towers
  strands = new THREE.Group();
  const sorted = tall.slice().sort((p, q) => q.z - p.z);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (a.x * b.x < 0 && Math.abs(a.z - b.z) < 90 && Math.random() < 0.6) {
      strands.add(webStrand(a, b, c.silk));
    }
  }
  scene.add(strands);

  // ---- Doctor Strange magic: golden spell circles + embers ----
  const gold = new THREE.Color(cssVar("--blue-soft", "#e9c469"));
  sigilMat = new THREE.LineBasicMaterial({ color: gold, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false });
  sigils = [];
  // a halo behind the model (travels with the camera)
  const halo = makeSigil(16);
  halo.position.set(5, 1, -38);
  camera.add(halo);
  sigils.push(halo);
  // spell circles floating down the avenue, passed as you scroll
  [[-30, 30, -150, 26], [40, 45, -360, 34], [-20, 60, -560, 30]].forEach(([x, y, z, r]) => {
    const s = makeSigil(r);
    s.position.set(x, y, z);
    scene.add(s);
    sigils.push(s);
  });

  // golden magic embers drifting upward
  const ep = [], ev = [];
  for (let i = 0; i < 180; i++) {
    ep.push((Math.random() - 0.5) * 420, Math.random() * 200, 60 - Math.random() * 760);
    ev.push(4 + Math.random() * 10);
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3));
  eg.userData.vel = ev;
  emberMat = new THREE.PointsMaterial({ color: gold, size: 1.7, sizeAttenuation: true,
    transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  embers = new THREE.Points(eg, emberMat);
  scene.add(embers);

  // a warm magic glow that travels with the camera
  const glow = new THREE.PointLight(gold, 0.8, 120);
  glow.position.set(5, 2, -30);
  camera.add(glow);

  // lazy-load the model after first paint so it never blocks the city
  const start = () => tryLoadModel();
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 2500 });
  else setTimeout(start, 1200);
}

function retheme() {
  const c = colors();
  scene.fog.color.copy(c.bg);
  buildMesh.material.color.copy(c.near);
  windowPts.material.color.copy(c.win);
  neonPts.material.color.copy(c.accent);
  fieldPts.material.color.copy(c.silk);
  strands.children.forEach((s) => s.material.color.copy(c.silk));
  // model + city pick up the active theme through the lights
  rimLight.color.copy(c.accent);
  moonLight.color.copy(c.silk);
  ambient.color.copy(c.bg.clone().lerp(c.silk, 0.6));
  const gold = new THREE.Color(cssVar("--blue-soft", "#e9c469"));
  sigilMat.color.copy(gold);
  emberMat.color.copy(gold);
}

/* real Spider-Man model, lazy-loaded from a CDN after first paint so
   it never blocks the page; nothing copyrighted ships in the repo.
   Override with window.SPIDEY_MODEL_URL (e.g. a licensed local .glb). */
const DEFAULT_MODEL_URL =
  "https://cdn.jsdelivr.net/gh/victor-kiss/spider-man-3DUI@main/public/models/spider-man_spider-man_no_way_home.glb";
let modelGrow = 0, modelTargetScale = 1;

// the model ships with 19 rigged clips — give each section its own
// (in-place hero poses; locomotion clips would drift him off-frame)
const SECTION_CLIPS = ["idle", "wait", "skill01", "skill02", "skill03", "skill04", "skill05-01", "skill06"];
let actions = {}, currentAction = null;

function clipFor(idx) {
  const tok = SECTION_CLIPS[((idx % SECTION_CLIPS.length) + SECTION_CLIPS.length) % SECTION_CLIPS.length];
  const name = Object.keys(actions).find((n) => n.includes("@" + tok + "|")) ||
               Object.keys(actions).find((n) => n.includes("@" + tok));
  return name ? actions[name] : null;
}
function playSection(idx) {
  const next = clipFor(idx);
  if (!next || next === currentAction) return;
  next.reset().setEffectiveWeight(1).fadeIn(0.5).play();
  if (currentAction) currentAction.fadeOut(0.5);
  currentAction = next;
}

async function tryLoadModel() {
  const url = window.SPIDEY_MODEL_URL || DEFAULT_MODEL_URL;
  try {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const inner = gltf.scene;
      const box = new THREE.Box3().setFromObject(inner);
      const size = new THREE.Vector3(); box.getSize(size);
      const center = new THREE.Vector3(); box.getCenter(center);
      inner.position.sub(center);                  // recenter on origin
      inner.position.y -= 0.46 * size.y;           // bbox is far taller than the
                                                   // body — drop the body to origin
      const wrap = new THREE.Group();
      wrap.add(inner);
      wrap.position.set(5, -2, -19);               // close, right of frame
      modelTargetScale = 78 / (size.y || 1);       // scale to the body, not the box
      wrap.scale.setScalar(0.0001);                // grows in on load
      modelGrow = 0;
      camera.add(wrap);
      scene.add(camera);
      model = wrap;
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(inner);
        actions = {};
        gltf.animations.forEach((c) => { actions[c.name] = mixer.clipAction(c); });
        playSection(activeSection < 0 ? 0 : activeSection);
      }
    }, undefined, () => { /* load failed — city carries on */ });
  } catch (e) { /* keep the city */ }
}

/* track the active section: camera bank + the model's animation clip */
let sections = [], bank = 0, bankTarget = 0, activeSection = -1;
function sectionBank() {
  if (!sections.length) sections = [...document.querySelectorAll("#hero, main .section")];
  const mid = scrollY + innerHeight * 0.5;
  let idx = 0;
  for (let i = 0; i < sections.length; i++) if (sections[i].offsetTop <= mid) idx = i;
  bankTarget = (idx % 2 ? 1 : -1) * (10 + (idx % 3) * 5);
  if (idx !== activeSection) { activeSection = idx; if (mixer) playSection(idx); }
}

let raf, lastT = 0;
function frame(t) {
  const dt = (clock.last ? t - clock.last : 16) / 1000;
  clock.last = t;
  lastT = t;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, scrollY / max) : 0;
  const cz = 90 - p * 660;                 // scroll flies down the avenue

  sectionBank();
  bank += (bankTarget - bank) * 0.02;
  camera.position.x += (mouse.x * 12 - camera.position.x) * 0.04;
  camera.position.y = 40 - p * 8 + Math.sin(t / 2600) * 0.9 - mouse.y * 4;
  camera.position.z = cz;
  camera.lookAt(camera.position.x * 0.3 + bank, 28, cz - 200);

  fieldPts.rotation.y = t / 90000;

  // spin the spell circles (counter-rotating rings) + pulse
  for (const s of sigils) {
    s.userData.outer.rotation.z += dt * 0.12;
    s.userData.inner.rotation.z -= dt * 0.18;
    s.userData.core.rotation.z += dt * 0.07;
  }
  sigilMat.opacity = 0.42 + Math.sin(t / 900) * 0.12;

  // drift the embers upward, wrapping back to street level
  const ea = embers.geometry.attributes.position, ev = embers.geometry.userData.vel;
  for (let i = 0; i < ev.length; i++) {
    let y = ea.getY(i) + ev[i] * dt;
    if (y > 210) y = 0;
    ea.setY(i, y);
  }
  ea.needsUpdate = true;

  if (model) {
    // grow in on load, then move in step with the page: turns to face
    // you as you scroll, drifts across, leans with the section bank
    if (modelGrow < 1) modelGrow = Math.min(1, modelGrow + dt / 1.1);
    const e = 1 - Math.pow(1 - modelGrow, 3);
    model.scale.setScalar(modelTargetScale * e);
    model.rotation.y = 0.35 + p * Math.PI * 0.8 + Math.sin(t / 2600) * 0.12;
    model.rotation.z = bank * 0.012;
    model.position.x = 5 - p * 2;
    model.position.y = -2 + Math.sin(t / 2200) * 0.4;   // gentle float
  }
  if (mixer) mixer.update(dt);
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}

function resize() {
  W = innerWidth; H = innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H, false);
  if (REDUCED) renderer.render(scene, camera);
}

try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  build();
  resize();
  addEventListener("resize", () => { sections = []; resize(); });
  addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / W) * 2 - 1;
    mouse.y = (e.clientY / H) * 2 - 1;
  }, { passive: true });
  document.addEventListener("vp-theme", retheme);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!REDUCED) { lastT = 0; raf = requestAnimationFrame(frame); }
  });
  if (REDUCED) renderer.render(scene, camera);
  else raf = requestAnimationFrame(frame);
} catch (e) {
  console.warn("3D city unavailable:", e);
}

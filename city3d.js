/* ============================================================
   3D night city — a cinematic fly-through of an instanced
   Manhattan canyon: lit windows, drifting silk motes, fog, and
   web strands strung between the towers. Scrolling flies the
   camera down the avenue; the mouse banks it. No character —
   the city itself is the show.
   ============================================================ */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("city3d");

let renderer, scene, camera, buildMesh, windowPts, neonPts, fieldPts, strands;
let model, mixer;
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

function build() {
  const c = colors();
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(c.bg, 0.0026);
  camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1500);

  // moonlight + a warm and a cool rim so faces read as vivid volumes
  const moon = new THREE.DirectionalLight(c.silk.clone(), 2.6);
  moon.position.set(0.5, 1, 0.4);
  scene.add(moon);
  const rim = new THREE.DirectionalLight(c.accent.clone(), 0.9);
  rim.position.set(-0.7, 0.3, -0.5);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(c.bg.clone().lerp(c.silk, 0.6), 1.7));

  // instanced canyon lining the avenue, receding into -z
  const COUNT = innerWidth < 760 ? 170 : 300;
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
  for (let i = 0; i < 340; i++) {
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

  tryLoadModel();
}

function retheme() {
  const c = colors();
  scene.fog.color.copy(c.bg);
  buildMesh.material.color.copy(c.near);
  windowPts.material.color.copy(c.win);
  neonPts.material.color.copy(c.accent);
  fieldPts.material.color.copy(c.silk);
  strands.children.forEach((s) => s.material.color.copy(c.silk));
}

/* optional real model — drop assets/spiderman.glb (or set
   window.SPIDEY_MODEL_URL) and it loads at runtime, animations too.
   No copyrighted asset ships in the repo; the city is the fallback. */
async function tryLoadModel() {
  const url = window.SPIDEY_MODEL_URL || "assets/spiderman.glb";
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return;
    const { GLTFLoader } = await import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    new GLTFLoader().load(url, (gltf) => {
      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3(); box.getSize(size);
      const center = new THREE.Vector3(); box.getCenter(center);
      model.position.sub(center);                 // recenter
      const wrap = new THREE.Group();
      wrap.add(model);
      wrap.scale.setScalar(9 / (size.y || 1));    // fit to a ~9u height
      wrap.position.set(9, -1, -26);              // hang in front, right of frame
      camera.add(wrap);
      scene.add(camera);
      model = wrap;
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        mixer.clipAction(gltf.animations[0]).play();
      }
    });
  } catch (e) { /* keep the city */ }
}

/* gentle per-section camera bank so each section feels staged */
let sections = [], bank = 0, bankTarget = 0;
function sectionBank() {
  if (!sections.length) sections = [...document.querySelectorAll("#hero, main .section")];
  const mid = scrollY + innerHeight * 0.5;
  let idx = 0;
  for (let i = 0; i < sections.length; i++) if (sections[i].offsetTop <= mid) idx = i;
  bankTarget = (idx % 2 ? 1 : -1) * (10 + (idx % 3) * 5);
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
  if (model) model.rotation.y = Math.sin(t / 2400) * 0.5;   // gentle turntable
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

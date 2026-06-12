/* ============================================================
   3D night city — Three.js canyon of instanced buildings with
   glowing windows. Scroll flies the camera down the avenue;
   the mouse banks it. Tall-tower tops are projected to screen
   space so the 2D Spidey can anchor his webs to real buildings.
   ============================================================ */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("city3d");
const CITY = (window.CITY = window.CITY || { towers: [] });

let renderer, scene, camera, buildMesh, windowPts, fieldPts;
let W = innerWidth, H = innerHeight;
const tall = [];
const mouse = { x: 0 };
const tmp = new THREE.Vector3();

function cssVar(n, d) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  return v || d;
}

function colors() {
  const silk = cssVar("--silk-rgb", "214,222,244").split(",").map(Number);
  return {
    bg: new THREE.Color(cssVar("--bg", "#07090f")),
    near: new THREE.Color(cssVar("--city-near", "#0a0e18")),
    win: new THREE.Color(cssVar("--city-window", "#ffd66b")),
    silk: new THREE.Color(silk[0] / 255, silk[1] / 255, silk[2] / 255)
  };
}

function build() {
  const c = colors();
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(c.bg, 0.0036);
  camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 1400);

  // buildings: an instanced canyon lining the avenue, receding into -z
  const COUNT = innerWidth < 760 ? 150 : 260;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0); // grow upward from the street
  buildMesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: c.near }), COUNT);
  const m = new THREE.Matrix4();
  const winPos = [];
  tall.length = 0;
  for (let i = 0; i < COUNT; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (72 + Math.random() * 150);
    const z = 50 - (i / COUNT) * 800 - Math.random() * 18;
    const isTall = Math.random() < 0.15;
    const h = isTall ? 120 + Math.random() * 140 : 18 + Math.random() * 72;
    const w = 14 + Math.random() * 24;
    const d = 14 + Math.random() * 24;
    m.makeScale(w, h, d);
    m.setPosition(x, 0, z);
    buildMesh.setMatrixAt(i, m);
    if (isTall) tall.push({ x, y: h, z });
    // lit windows on the avenue-facing wall
    const face = x > 0 ? x - w / 2 - 0.3 : x + w / 2 + 0.3;
    for (let wy = 4; wy < h - 3; wy += 5.5) {
      for (let wz = z - d / 2 + 2; wz < z + d / 2 - 1; wz += 4.5) {
        if (Math.random() < 0.24) winPos.push(face, wy, wz);
      }
    }
  }
  scene.add(buildMesh);

  windowPts = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(winPos, 3)),
    new THREE.PointsMaterial({ color: c.win, size: 1.45, sizeAttenuation: true, transparent: true, opacity: 0.6 })
  );
  scene.add(windowPts);

  // silk motes drifting high above the streets
  const motes = [];
  for (let i = 0; i < 320; i++) {
    motes.push((Math.random() - 0.5) * 520, 20 + Math.random() * 210, 60 - Math.random() * 860);
  }
  fieldPts = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(motes, 3)),
    new THREE.PointsMaterial({ color: c.silk, size: 1.1, transparent: true, opacity: 0.45 })
  );
  scene.add(fieldPts);
}

function retheme() {
  const c = colors();
  scene.fog.color.copy(c.bg);
  buildMesh.material.color.copy(c.near);
  windowPts.material.color.copy(c.win);
  fieldPts.material.color.copy(c.silk);
}

/* screen-space tower tops for the 2D Spidey's web anchors */
function projectTowers() {
  CITY.towers.length = 0;
  for (const t of tall) {
    if (t.z > camera.position.z - 40 || t.z < camera.position.z - 460) continue;
    tmp.set(t.x, t.y, t.z).project(camera);
    if (tmp.z < 0 || tmp.z > 1) continue;
    const sx = (tmp.x * 0.5 + 0.5) * W;
    const sy = (-tmp.y * 0.5 + 0.5) * H;
    if (sx > -80 && sx < W + 80 && sy > -60 && sy < H * 0.72) {
      CITY.towers.push({ x: sx, y: sy });
    }
  }
}

let raf;
function frame(t) {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, scrollY / max) : 0;
  const cz = 80 - p * 580; // scrolling flies you down the avenue
  camera.position.x += (mouse.x * 10 - camera.position.x) * 0.04;
  camera.position.y = 38 - p * 6 + Math.sin(t / 2600) * 0.8;
  camera.position.z = cz;
  camera.lookAt(camera.position.x * 0.35, 26, cz - 190);
  fieldPts.rotation.y = t / 90000;
  projectTowers();
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}

function resize() {
  W = innerWidth;
  H = innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H, false);
  if (REDUCED) { projectTowers(); renderer.render(scene, camera); }
}

try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  build();
  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mouse.x = (e.clientX / W) * 2 - 1; }, { passive: true });
  document.addEventListener("vp-theme", retheme);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!REDUCED) raf = requestAnimationFrame(frame);
  });
  if (REDUCED) {
    projectTowers();
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }
} catch (e) {
  // WebGL unavailable — the page still works on its gradient sky
  console.warn("3D city unavailable:", e);
}

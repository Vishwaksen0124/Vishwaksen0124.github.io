/* ============================================================
   3D night city — Three.js canyon of instanced buildings with
   glowing windows. Scroll flies the camera down the avenue.
   A posable Spider-Man hangs from a web in front of the camera
   and strikes a different iconic pose for every section.

   Want a real model instead of the built figure? Drop a rigged
   GLB at assets/spiderman.glb (or set window.SPIDEY_MODEL_URL
   before this script). It will be shown hanging; the built
   figure stays as the always-works fallback.
   ============================================================ */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("city3d");

let renderer, scene, camera, buildMesh, windowPts, fieldPts;
let W = innerWidth, H = innerHeight;
const tall = [];
const mouse = { x: 0, y: 0 };
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

function cssVar(n, d) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  return v || d;
}
function hexVar(n, d) { return new THREE.Color(cssVar(n, d)); }

function colors() {
  const silk = cssVar("--silk-rgb", "214,222,244").split(",").map(Number);
  return {
    bg: hexVar("--bg", "#07090f"),
    near: hexVar("--surface-2", "#121831").lerp(hexVar("--bg", "#07090f"), -0.6),
    win: hexVar("--city-window", "#ffd66b"),
    silk: new THREE.Color(silk[0] / 255, silk[1] / 255, silk[2] / 255),
    body: hexVar("--red-bright", "#ff3b41"),
    legs: hexVar("--blue", "#3d5afe"),
    eye: hexVar("--spidey-glint", "#f3f5ff")
  };
}

/* ============================================================
   Spider-Man rig — nested pivot bones we can pose.
   ============================================================ */
const J = {};            // named joints (pivot Groups we rotate)
let spideyRoot, swayPivot, webLine, webShot, mats;

/* a web rope firing out of his wrist during the web-shooter beat */
function fireWeb(cyc, thrust) {
  J.elR.getWorldPosition(tmp);                 // wrist
  J.shR.getWorldPosition(tmp2);                // shoulder → direction of the arm
  const dir = tmp.clone().sub(tmp2).normalize();
  const reach = 26 * Math.min(cyc / 0.35, 1);  // the web streaks outward then holds
  const lp = webShot.geometry.attributes.position.array;
  lp[0] = tmp.x; lp[1] = tmp.y; lp[2] = tmp.z;
  lp[3] = tmp.x + dir.x * reach;
  lp[4] = tmp.y + dir.y * reach;
  lp[5] = tmp.z + dir.z * reach;
  webShot.geometry.attributes.position.needsUpdate = true;
  webShot.material.opacity = cyc < 0.7 ? 0.9 : 0.9 * (1 - (cyc - 0.7) / 0.3);
  webShot.visible = true;
}

function bone(len, rad, mat) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(rad, len, 4, 10), mat);
  mesh.position.y = -len / 2;       // hangs down from the pivot
  pivot.add(mesh);
  const end = new THREE.Group();
  end.position.y = -len;
  pivot.add(end);
  return { pivot, end };
}

function makeSpidey(c) {
  const red = new THREE.MeshBasicMaterial({ color: c.body, depthTest: false });
  const blue = new THREE.MeshBasicMaterial({ color: c.legs, depthTest: false });
  const white = new THREE.MeshBasicMaterial({ color: c.eye, depthTest: false });
  mats = { red, blue, white };

  const root = new THREE.Group();
  const sway = new THREE.Group();   // idle sway pivots here (at the web anchor)
  root.add(sway);
  const body = new THREE.Group();
  sway.add(body);
  J.body = body;

  // torso + pelvis
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.05, 5, 12), red);
  torso.position.y = 0.95;
  body.add(torso);
  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.35, 4, 10), blue);
  body.add(pelvis);

  // head with the iconic big eyes
  const head = new THREE.Group();
  head.position.set(0, 1.95, 0);
  body.add(head);
  J.head = head;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 12), red));
  const eyeGeo = new THREE.SphereGeometry(0.26, 12, 10);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, white);
    eye.position.set(sx * 0.24, 0.04, 0.40);
    eye.scale.set(1.05, 0.62, 0.5);
    eye.rotation.z = sx * 0.5;
    head.add(eye);
  }

  // arms
  for (const [side, sx] of [["L", 1], ["R", -1]]) {
    const sh = new THREE.Group();
    sh.position.set(sx * 0.62, 1.55, 0);
    body.add(sh);
    const upper = bone(0.95, 0.18, red);
    sh.add(upper.pivot);
    const fore = bone(0.9, 0.15, red);
    upper.end.add(fore.pivot);
    J["sh" + side] = sh;
    J["el" + side] = fore.pivot;
  }
  // legs
  for (const [side, sx] of [["L", 1], ["R", -1]]) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.32, -0.2, 0);
    body.add(hip);
    const thigh = bone(1.15, 0.22, blue);
    hip.add(thigh.pivot);
    const shin = bone(1.1, 0.18, red);   // red boots
    thigh.end.add(shin.pivot);
    J["hip" + side] = hip;
    J["kn" + side] = shin.pivot;
  }

  root.traverse((o) => { o.renderOrder = 12; });
  root.scale.setScalar(1.9);
  return root;
}

/* ---- poses: target euler angles per joint (radians) ----
   identity = upright, arms straight down, legs straight down. */
const REST = { body: [0, 0, 0], head: [0, 0, 0],
  shL: [0, 0, 0.12], shR: [0, 0, -0.12], elL: [0, 0, 0], elR: [0, 0, 0],
  hipL: [0, 0, 0.05], hipR: [0, 0, -0.05], knL: [0, 0, 0], knR: [0, 0, 0] };

const P = (o) => Object.assign({}, REST, o);
const PI = Math.PI;

// one pose per section, in DOM order
const POSES = [
  // hero — upside-down hang, the signature image
  P({ root: [0, 0.2, 0], web: "feet", invert: true,
      shL: [-2.5, 0, 0.5], shR: [-2.5, 0, -0.5], elL: [0.5, 0, 0], elR: [0.5, 0, 0],
      hipL: [0.15, 0, 0.16], hipR: [0.15, 0, -0.16], knL: [0.6, 0, 0], knR: [0.45, 0, 0],
      head: [-0.5, 0, 0] }),
  // about — perched crouch, turning the masked face to camera
  P({ root: [0, 0.5, 0.05], web: "hand", action: "face",
      shL: [-0.7, 0, 0.5], shR: [0.4, 0, -0.3], elL: [-1.4, 0, 0], elR: [-0.6, 0, 0],
      hipL: [1.5, 0, 0.2], hipR: [1.3, 0, -0.2], knL: [-1.7, 0, 0], knR: [-1.5, 0, 0],
      head: [0.25, -0.4, 0] }),
  // what I do — web-shooting thwip toward the content
  P({ root: [0, 0.6, 0], web: "hand", action: "thwip",
      shL: [-1.5, 0, 0.1], shR: [0.7, 0, -0.6], elL: [-0.4, -0.5, 0], elR: [-0.5, 0, 0],
      hipL: [0.4, 0, 0.15], hipR: [-0.2, 0, -0.2], knL: [-0.7, 0, 0], knR: [-0.3, 0, 0],
      head: [0.1, -0.5, 0] }),
  // skills — mid-air spread eagle, slow spin
  P({ root: [0, 0, 0], web: "none", spin: true,
      shL: [-1.9, 0, 0.7], shR: [-1.9, 0, -0.7], elL: [-0.3, 0, 0], elR: [-0.3, 0, 0],
      hipL: [0.5, 0, 0.5], hipR: [0.5, 0, -0.5], knL: [-0.5, 0, 0], knR: [-0.5, 0, 0],
      head: [0.1, 0, 0] }),
  // work — perched, pointing out at the panels
  P({ root: [0, 0.55, 0], web: "hand", action: "point",
      shL: [0.2, 0, 0.3], shR: [-1.7, -0.6, -0.2], elL: [-1.0, 0, 0], elR: [0, 0, 0],
      hipL: [1.3, 0, 0.2], hipR: [1.1, 0, -0.2], knL: [-1.6, 0, 0], knR: [-1.4, 0, 0],
      head: [0.1, -0.6, 0] }),
  // experience — upside-down hang again, arms folded
  P({ root: [0, -0.3, 0], web: "feet", invert: true,
      shL: [-2.9, 0, 0.7], shR: [-2.9, 0, -0.7], elL: [-1.5, 0, 0], elR: [-1.5, 0, 0],
      hipL: [0.1, 0, 0.14], hipR: [0.1, 0, -0.14], knL: [0.4, 0, 0], knR: [0.5, 0, 0],
      head: [-0.4, 0, 0] }),
  // education — thinking, hand tapping near the head
  P({ root: [0, 0.4, 0], web: "hand", action: "tap",
      shL: [-0.4, 0, 0.4], shR: [-2.6, -0.5, -0.3], elL: [-0.5, 0, 0], elR: [-2.2, 0, 0],
      hipL: [0.3, 0, 0.15], hipR: [0.2, 0, -0.15], knL: [-0.5, 0, 0], knR: [-0.4, 0, 0],
      head: [0.2, -0.3, 0.1] }),
  // contact — friendly wave hello
  P({ root: [0, 0.5, 0], web: "hand", action: "wave",
      shL: [0.1, 0, 0.4], shR: [-2.8, 0, -0.4], elL: [-0.3, 0, 0], elR: [-0.5, 0, 0],
      hipL: [0.2, 0, 0.15], hipR: [0.15, 0, -0.15], knL: [-0.4, 0, 0], knR: [-0.3, 0, 0],
      head: [0.15, -0.4, 0] })
];

// live (lerped) euler state
const live = {};
for (const k in REST) live[k] = REST[k].slice();
let liveRootY = 0, liveInvert = 0;
let targetPose = POSES[0];

function setTargetPose(i) { targetPose = POSES[((i % POSES.length) + POSES.length) % POSES.length]; }

function applyPose(dt, t) {
  const k2 = Math.min(dt * 3.2, 1);
  for (const j in REST) {
    const tgt = targetPose[j] || REST[j];
    for (let a = 0; a < 3; a++) live[j][a] += (tgt[a] - live[j][a]) * k2;
    if (J[j]) J[j].rotation.set(live[j][0], live[j][1], live[j][2]);
  }

  // per-section signature ACTION layered on top of the held pose
  const T = t / 1000;
  const act = targetPose.action;
  if (act === "wave") {
    J.shR.rotation.z += Math.sin(T * 7) * 0.45;           // hand waves hello
    J.elR.rotation.x += Math.sin(T * 7 + 0.6) * 0.2;
  } else if (act === "tap") {
    J.elR.rotation.x += (Math.sin(T * 4) * 0.5 - 0.5) * 0.3; // fingers tap, thinking
    J.head.rotation.z += Math.sin(T * 1.3) * 0.08;
  } else if (act === "point") {
    J.shR.rotation.x += Math.sin(T * 2) * 0.12;            // gestures at the panels
  } else if (act === "face") {
    J.head.rotation.y += Math.sin(T * 0.8) * 0.5;          // mask scans across to camera
  } else if (act === "thwip") {
    const cyc = (T * 0.8) % 1;                              // periodic web-shot thrust
    const thrust = cyc < 0.18 ? Math.sin((cyc / 0.18) * PI) : 0;
    J.shR.rotation.x -= thrust * 0.5;
    J.elR.rotation.x += thrust * 0.4;
    fireWeb(cyc, thrust);
  } else {
    webShot.visible = false;
  }
  if (act !== "thwip") webShot.visible = false;
  // body inversion (upside-down) eased in/out
  const invTgt = targetPose.invert ? 1 : 0;
  liveInvert += (invTgt - liveInvert) * k2;
  // facing yaw toward the content
  const ry = (targetPose.root ? targetPose.root[1] : 0);
  liveRootY += (ry - liveRootY) * k2;

  // idle sway + breathing
  swayPivot.rotation.z = Math.sin(t / 1400) * 0.06;
  swayPivot.rotation.x = Math.sin(t / 1750) * 0.05;
  spideyRoot.rotation.y = liveRootY + Math.sin(t / 2600) * 0.05;
  J.body.rotation.x = live.body[0] + liveInvert * PI; // flip head-down for hangs
  if (targetPose.spin) spideyRoot.rotation.y += t / 2600; // skills spin

  // web thread: from an anchor above down to his current attach point
  const lp = webLine.geometry.attributes.position.array;
  if (targetPose.web && targetPose.web !== "none") {
    spideyRoot.getWorldPosition(tmp);
    const ax = tmp.x, ay = tmp.y, az = tmp.z;
    // attach near feet when inverted, near a hand otherwise
    const reach = targetPose.web === "feet" ? 3.4 : 2.2;
    lp[0] = ax + 1.2; lp[1] = ay + 9.5; lp[2] = az;     // anchor up out of frame
    lp[3] = ax + (targetPose.web === "feet" ? 0 : 1.6);
    lp[4] = ay + reach; lp[5] = az;
    webLine.visible = true;
    webLine.geometry.attributes.position.needsUpdate = true;
  } else {
    webLine.visible = false;
  }

  // screen position for the 2D click web-shots
  spideyRoot.getWorldPosition(tmp).project(camera);
  window.SPIDEY_SCREEN = tmp.z < 1
    ? { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H }
    : null;
}

/* ============================================================
   Section tracking — which section owns the viewport now.
   ============================================================ */
let sections = [];
let activeIdx = -1;
function trackSection() {
  if (window.__lockPose !== undefined) { setTargetPose(window.__lockPose); return; }
  if (!sections.length) sections = [...document.querySelectorAll("#hero, main .section")];
  const mid = scrollY + innerHeight * 0.5;
  let idx = 0;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].offsetTop <= mid) idx = i;
  }
  if (idx !== activeIdx) { activeIdx = idx; setTargetPose(idx); }
}

/* ============================================================
   City
   ============================================================ */
function build() {
  const c = colors();
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(c.bg, 0.0036);
  camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 1400);

  const moon = new THREE.DirectionalLight(c.silk.clone(), 1.9);
  moon.position.set(0.55, 1, 0.35);
  scene.add(moon);
  scene.add(new THREE.AmbientLight(c.bg.clone().lerp(c.silk, 0.45), 1.3));

  const COUNT = innerWidth < 760 ? 150 : 260;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  buildMesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: c.near }), COUNT);
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

  const motes = [];
  for (let i = 0; i < 320; i++) {
    motes.push((Math.random() - 0.5) * 520, 20 + Math.random() * 210, 60 - Math.random() * 860);
  }
  fieldPts = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(motes, 3)),
    new THREE.PointsMaterial({ color: c.silk, size: 1.1, transparent: true, opacity: 0.45 })
  );
  scene.add(fieldPts);

  // Spider-Man, parented to the camera so he is always in view (right side)
  spideyRoot = makeSpidey(c);
  swayPivot = spideyRoot.children[0];
  spideyRoot.position.set(11, -0.5, -31);
  camera.add(spideyRoot);
  scene.add(camera);

  webLine = new THREE.Line(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3)),
    new THREE.LineBasicMaterial({ color: c.silk, transparent: true, opacity: 0.75, depthTest: false })
  );
  webLine.renderOrder = 11;
  scene.add(webLine);

  webShot = new THREE.Line(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3)),
    new THREE.LineBasicMaterial({ color: c.eye, transparent: true, opacity: 0.9, depthTest: false })
  );
  webShot.renderOrder = 11;
  webShot.visible = false;
  scene.add(webShot);  // positions are written in world space each frame

  trackSection();
  tryLoadModel(c);
}

function retheme() {
  const c = colors();
  scene.fog.color.copy(c.bg);
  buildMesh.material.color.copy(c.near);
  windowPts.material.color.copy(c.win);
  fieldPts.material.color.copy(c.silk);
  mats.red.color.copy(c.body);
  mats.blue.color.copy(c.legs);
  mats.white.color.copy(c.eye);
  webLine.material.color.copy(c.silk);
  webShot.material.color.copy(c.eye);
}

/* optional: swap in a real GLB model if one is provided */
async function tryLoadModel(c) {
  const url = window.SPIDEY_MODEL_URL || "assets/spiderman.glb";
  try {
    const head = await fetch(url, { method: "HEAD" });
    if (!head.ok) return;                       // no model supplied — keep the built figure
    const { GLTFLoader } = await import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    new GLTFLoader().load(url, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const s = 7 / (box.max.y - box.min.y || 1);
      model.scale.setScalar(s * 1.9);
      model.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 12; } });
      // hide built figure, show the model in its place
      spideyRoot.children[0].visible = false;
      spideyRoot.add(model);
      window.__spideyModel = model;
    });
  } catch (e) { /* keep the built figure */ }
}

/* ============================================================
   Loop
   ============================================================ */
let raf, lastT = 0;
let bankTarget = 0, bank = 0;
function frame(t) {
  const dt = Math.min((lastT ? t - lastT : 16) / 1000, 0.05);
  lastT = t;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, scrollY / max) : 0;
  const cz = 80 - p * 580;

  trackSection();
  // gentle per-section camera bank, plus mouse parallax
  bankTarget = (activeIdx % 2 ? 14 : -14);
  bank += (bankTarget - bank) * 0.02;
  camera.position.x += (mouse.x * 10 - camera.position.x) * 0.04;
  camera.position.y = 38 - p * 6 + Math.sin(t / 2600) * 0.8;
  camera.position.z = cz;
  camera.lookAt(camera.position.x * 0.35 + bank, 26, cz - 190);

  fieldPts.rotation.y = t / 90000;
  applyPose(dt, t);
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
  if (REDUCED) {
    applyPose(1, 0);
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }
} catch (e) {
  console.warn("3D city unavailable:", e);
}

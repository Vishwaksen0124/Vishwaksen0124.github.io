/* ============================================================
   3D night city — Three.js canyon of instanced buildings with
   glowing windows. Scroll flies the camera down the avenue;
   the mouse banks it. Tall-tower tops are projected to screen
   space so the 2D Spidey can anchor his webs to real buildings.
   ============================================================ */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("city3d");

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
    near: new THREE.Color(cssVar("--surface-2", "#121831")).lerp(new THREE.Color(cssVar("--bg", "#07090f")), -0.6),
    win: new THREE.Color(cssVar("--city-window", "#ffd66b")),
    silk: new THREE.Color(silk[0] / 255, silk[1] / 255, silk[2] / 255),
    body: new THREE.Color(cssVar("--red-bright", "#ff3b41")),
    limb: new THREE.Color(cssVar("--spidey-limb", "#c41e23"))
  };
}

function build() {
  const c = colors();
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(c.bg, 0.0036);
  camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 1400);

  // cold moonlight so building faces shade differently and read as 3D
  const moon = new THREE.DirectionalLight(c.silk.clone(), 1.9);
  moon.position.set(0.55, 1, 0.35);
  scene.add(moon);
  scene.add(new THREE.AmbientLight(c.bg.clone().lerp(c.silk, 0.45), 1.3));

  // buildings: an instanced canyon lining the avenue, receding into -z
  const COUNT = innerWidth < 760 ? 150 : 260;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0); // grow upward from the street
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

  const rig = makeSpidey(c);
  spideyGroup = rig.g;
  spideyMats = rig;
  scene.add(spideyGroup);
  webLine = new THREE.Line(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3)),
    new THREE.LineBasicMaterial({ color: c.silk, transparent: true, opacity: 0.7, depthTest: false })
  );
  webLine.renderOrder = 9;
  scene.add(webLine);
  respawnSpidey(80);
}

/* ---- 3D Spider-Man: pendulum physics through the canyon ---- */
const SP = { mode: "swing", pos: new THREE.Vector3(), v: new THREE.Vector3(),
  anchor: new THREE.Vector3(), f: new THREE.Vector3(0, 0, -1), L: 50, th: -0.9, om: 0.9 };
const G_W = 62;
let spideyGroup, spideyMats, webLine;
const up = new THREE.Vector3(0, 1, 0);
const hv = new THREE.Vector3(), tangent = new THREE.Vector3(), ropeDir = new THREE.Vector3();

function makeSpidey(c) {
  const g = new THREE.Group();
  const red = new THREE.MeshBasicMaterial({ color: c.body, depthTest: false });
  const dark = new THREE.MeshBasicMaterial({ color: c.limb, depthTest: false });
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), red);
  torso.scale.set(0.75, 1.25, 0.55);
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), red);
  head.position.set(0, 1.7, 0.15);
  g.add(head);
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), dark);
  hips.scale.set(0.7, 0.9, 0.55);
  hips.position.set(0, -1.35, -0.1);
  g.add(hips);
  const limb = (x1, y1, z1, x2, y2, z2) => {
    const v1 = new THREE.Vector3(x1, y1, z1), v2 = new THREE.Vector3(x2, y2, z2);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, v1.distanceTo(v2), 5), dark);
    seg.position.copy(v1).lerp(v2, 0.5);
    seg.quaternion.setFromUnitVectors(up, v2.clone().sub(v1).normalize());
    g.add(seg);
  };
  limb(0.4, 0.9, 0, 1.1, 2.4, 0.1); limb(1.1, 2.4, 0.1, 1.5, 3.8, 0.2);      // web arm
  limb(-0.5, 0.8, 0, -1.5, 0.2, -0.2); limb(-1.5, 0.2, -0.2, -2.2, -0.7, -0.3); // trailing arm
  limb(0.3, -2, 0, 1.2, -2.9, 0.4); limb(1.2, -2.9, 0.4, 0.9, -4.2, 0.2);    // tucked legs
  limb(-0.3, -2, 0, -1.1, -3, -0.2); limb(-1.1, -3, -0.2, -1.6, -4.3, 0);
  g.scale.setScalar(3.0);
  g.renderOrder = 10;
  g.traverse((o) => { o.renderOrder = 10; });
  return { g, red, dark };
}

function pickAnchor() {
  const z0 = SP.pos.z;
  const c = tall.filter((t) => t.z < z0 - 25 && t.z > z0 - 160 && t.y > SP.pos.y + 24);
  if (c.length) {
    const t = c[Math.floor(Math.random() * c.length)];
    // grab the tower's wall near his height so the swing stays mid-frame
    return new THREE.Vector3(t.x * 0.5, Math.min(t.y, SP.pos.y + 26 + Math.random() * 16), t.z);
  }
  return new THREE.Vector3(SP.pos.x * 0.3, SP.pos.y + 34, z0 - 80);
}

function attachWeb() {
  SP.anchor.copy(pickAnchor());
  hv.copy(SP.v); hv.y = 0;
  if (hv.lengthSq() < 1) hv.set(0, 0, -1);
  SP.f.copy(hv.normalize());
  const r = SP.pos.clone().sub(SP.anchor);
  SP.L = Math.min(Math.max(r.length(), 20), 55);
  hv.copy(r); hv.y = 0;
  SP.th = Math.atan2(hv.dot(SP.f), -r.y);
  tangent.copy(SP.f).multiplyScalar(Math.cos(SP.th)).addScaledVector(up, Math.sin(SP.th));
  SP.om = Math.max(SP.v.dot(tangent) / SP.L, 0.85);
  SP.mode = "swing";
}

function respawnSpidey(camZ) {
  SP.pos.set((Math.random() - 0.5) * 48, 28 + Math.random() * 14, camZ - 78);
  SP.v.set(0, 0, -24);
  attachWeb();
  SP.th = Math.min(SP.th, -0.7);
  SP.om = 1.0;
}

function stepSpidey(dt, camZ) {
  if (SP.mode === "swing") {
    SP.om += (-G_W / SP.L) * Math.sin(SP.th) * dt;
    SP.om *= 0.9995;
    SP.th += SP.om * dt;
    SP.pos.copy(SP.anchor)
      .addScaledVector(SP.f, SP.L * Math.sin(SP.th))
      .addScaledVector(up, -SP.L * Math.cos(SP.th));
    if (SP.th > 0.55 && SP.om > 0.75) {
      tangent.copy(SP.f).multiplyScalar(Math.cos(SP.th)).addScaledVector(up, Math.sin(SP.th));
      SP.v.copy(tangent).multiplyScalar(SP.om * SP.L);
      SP.mode = "fly";
    }
  } else {
    SP.v.y -= G_W * dt;
    SP.pos.addScaledVector(SP.v, dt);
    if (SP.v.y < -12) attachWeb();
  }
  // keep him in the camera's window of the avenue, at readable height
  if (SP.pos.z > camZ - 32 || SP.pos.z < camZ - 190 || SP.pos.y < 6 || SP.pos.y > 85 ||
      Math.abs(SP.pos.x) > 85) {
    respawnSpidey(camZ);
  }

  spideyGroup.position.copy(SP.pos);
  ropeDir.copy(SP.anchor).sub(SP.pos).normalize();
  spideyGroup.quaternion.setFromUnitVectors(up, ropeDir);
  // web line from hand to anchor (hidden mid-flight)
  const lp = webLine.geometry.attributes.position.array;
  if (SP.mode === "swing") {
    const hand = SP.pos.clone().addScaledVector(ropeDir, 6);
    lp[0] = hand.x; lp[1] = hand.y; lp[2] = hand.z;
    lp[3] = SP.anchor.x; lp[4] = SP.anchor.y; lp[5] = SP.anchor.z;
    webLine.visible = true;
  } else {
    webLine.visible = false;
  }
  webLine.geometry.attributes.position.needsUpdate = true;
  // expose his screen position so 2D click web-shots fire from him
  tmp.copy(SP.pos).project(camera);
  window.SPIDEY_SCREEN = tmp.z < 1
    ? { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H }
    : null;
}

function retheme() {
  const c = colors();
  scene.fog.color.copy(c.bg);
  buildMesh.material.color.copy(c.near);
  windowPts.material.color.copy(c.win);
  fieldPts.material.color.copy(c.silk);
  spideyMats.red.color.copy(c.body);
  spideyMats.dark.color.copy(c.limb);
  webLine.material.color.copy(c.silk);
}

let raf, lastT = 0;
function frame(t) {
  const dtMs = lastT ? t - lastT : 16;
  lastT = t;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, scrollY / max) : 0;
  const cz = 80 - p * 580; // scrolling flies you down the avenue
  camera.position.x += (mouse.x * 10 - camera.position.x) * 0.04;
  camera.position.y = 38 - p * 6 + Math.sin(t / 2600) * 0.8;
  camera.position.z = cz;
  camera.lookAt(camera.position.x * 0.35, 26, cz - 190);
  fieldPts.rotation.y = t / 90000;
  stepSpidey(Math.min(dtMs / 1000, 0.033), cz);
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}

function resize() {
  W = innerWidth;
  H = innerHeight;
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
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mouse.x = (e.clientX / W) * 2 - 1; }, { passive: true });
  document.addEventListener("vp-theme", retheme);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!REDUCED) raf = requestAnimationFrame(frame);
  });
  if (REDUCED) {
    stepSpidey(0.016, 80);
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }
} catch (e) {
  // WebGL unavailable — the page still works on its gradient sky
  console.warn("3D city unavailable:", e);
}

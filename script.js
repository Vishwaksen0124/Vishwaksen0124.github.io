/* ============================================================
   Vishwaksen Pujala — Spider-Verse portfolio interactions
   procedural skyline · physics web-swinging Spider-Man ·
   silk cursor trail · web-shot clicks · letter swing-ins
   ============================================================ */

const ROLES = [
  { name: "Backend Engineer",
    desc: "APIs, services and the event-driven backbone everything else runs on, built for correctness under load.",
    tools: "FastAPI · Celery · Redis · SQS · EventBridge" },
  { name: "Data & Analytics",
    desc: "The metrics layer behind the company: Northstar pipelines, cohort & funnel analysis, and the dashboards founders read every morning.",
    tools: "PLpgSQL · Pandas · Grafana · Cohort & Funnel" },
  { name: "AI / LLM Engineer",
    desc: "Production agent orchestration with tracing, evaluation and vendor swaps across OpenAI, Anthropic and Mistral.",
    tools: "LangGraph · LangSmith · RAG · PyTorch" },
  { name: "DevOps / Infra",
    desc: "Infrastructure-as-code, container builds and CI so the whole team can ship safely and often.",
    tools: "Terraform · Azure · Docker · GitHub Actions" },
  { name: "Full-stack",
    desc: "Operational dashboards and user-facing apps wired straight to the services behind them.",
    tools: "React · Next.js · TypeScript · Socket.IO" },
  { name: "Operations",
    desc: "Monitoring, alerting and on-call, keeping production healthy and the team unblocked.",
    tools: "CloudWatch · Grafana alerts · Slack · runbooks" }
];

const WORKS = [
  { title: "Creative Writing Studio", tag: "GenAI · live", link: "https://creativewritingstudio.streamlit.app",
    desc: "A live multi-agent writing platform where Plot, Dialogue & Editor agents co-author long-form stories with FAISS retrieval over running context and Mistral generation, served publicly on Streamlit.",
    stack: "LangChain · Mistral · FAISS · Streamlit" },
  { title: "LoveStream", tag: "Realtime", link: "https://github.com/Vishwaksen0124/lovestream",
    desc: "Low-latency peer-to-peer video & screen-share with system audio and live presence, over WebRTC media transport with Supabase Realtime presence sync.",
    stack: "Next.js 16 · WebRTC · Supabase" },
  { title: "Planity", tag: "Full-stack", link: "https://github.com/Vishwaksen0124/Planity",
    desc: "Role-based team task manager: subtasks, soft-delete/restore, real-time notifications, Redis caching, MongoDB Atlas, Docker Compose + CI/CD.",
    stack: "React · Node.js · MongoDB · Redis" },
  { title: "Image Stitching (RDISNet)", tag: "Computer vision", link: "https://github.com/Vishwaksen0124/image-stitching-rdisnet",
    desc: "Deep-learning image stitching with dilated residual encoders plus a transformer context-fusion module for robust, seam-free panoramas.",
    stack: "PyTorch · Transformers" },
  { title: "ChromaGene", tag: "Research", link: "",
    desc: "A transformer that infers cell-type-specific gene expression from ATAC-seq chromatin accessibility data.",
    stack: "PyTorch · Genomics" },
  { title: "Résumé ↔ JD Analyzer", tag: "Tool", link: "https://github.com/Vishwaksen0124/Resume-Job-JD-analyzer",
    desc: "Scores a résumé against a job description, surfacing the gaps and keywords that matter for ATS screening.",
    stack: "Python · NLP · LLM" }
];

const SKILLS = [
  ["Languages", ["Python", "TypeScript", "JavaScript", "SQL", "Rust", "Bash"]],
  ["Backend", ["FastAPI", "Node.js", "REST APIs", "WebSockets", "Pydantic"]],
  ["AI / LLM", ["LangChain", "LangGraph", "LangSmith", "RAG", "OpenAI", "Anthropic", "PyTorch"]],
  ["Distributed", ["Celery", "Redis", "AWS EventBridge", "SQS", "Idempotency", "DLQs"]],
  ["Cloud & DevOps", ["AWS", "Azure", "Docker", "Terraform", "GitHub Actions"]],
  ["Data", ["PostgreSQL", "MongoDB", "Pandas", "Grafana", "Cohort & Funnel"]],
  ["Frontend", ["React", "Next.js", "Streamlit"]]
];

const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rnd = (a, b) => a + Math.random() * (b - a);

/* ============================================================
   Themes — canvas + skyline colors come from the active theme's
   CSS variables so every effect re-skins instantly.
   ============================================================ */
const THEME = {};

function refreshTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, d) => (cs.getPropertyValue(n) || d).trim();
  THEME.silk = v("--silk-rgb", "214, 222, 244");
  THEME.acc = v("--red-bright-rgb", "255, 59, 65");
  THEME.spideyBody = v("--spidey-body", "#e62429");
  THEME.spideyLimb = v("--spidey-limb", "#c41e23");
  THEME.spideyGlint = v("--spidey-glint", "#f3f5ff");
  THEME.cityFar = v("--city-far", "#101831");
  THEME.cityNear = v("--city-near", "#04060c");
  THEME.cityWindow = v("--city-window", "#ffd66b");
}

function initThemes() {
  const root = document.documentElement;
  const dots = document.querySelectorAll("[data-set-theme]");
  const current = () => root.getAttribute("data-theme") || "classic";
  const mark = () => dots.forEach((d) =>
    d.classList.toggle("active", d.dataset.setTheme === current()));
  dots.forEach((d) => d.addEventListener("click", () => {
    const t = d.dataset.setTheme;
    if (t === "classic") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", t);
    try { localStorage.setItem("vp-theme", t); } catch (e) {}
    refreshTheme();
    buildSkyline();
    mark();
  }));
  refreshTheme();
  mark();
}

/* ============================================================
   Procedural NYC skyline — two parallax silhouette layers with
   lit, flickering windows. Tower tops are collected so Spidey
   can anchor his webs to real buildings.
   ============================================================ */
const CITY = { towers: [] };
const SWING = { tip: null };   // scroll tip of the page web line (doc coords)
const EFFECTS = {};            // scene hooks usable by other systems

function buildSkyline() {
  const holder = document.getElementById("city");
  if (!holder) return;
  const W = innerWidth, H = innerHeight;
  CITY.towers = [];

  function layer(cls, maxH, fill, withWindows, towerEvery) {
    let rects = "", windows = "", x = -20, i = 0;
    while (x < W + 20) {
      const isTower = towerEvery && i % towerEvery === towerEvery - 1;
      const w = isTower ? rnd(46, 70) : rnd(38, 105);
      const h = isTower ? rnd(maxH * 1.7, maxH * 2.3) : rnd(maxH * 0.45, maxH);
      const top = H - h;
      rects += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
      if (isTower) {
        rects += `<rect x="${(x + w / 2 - 1).toFixed(1)}" y="${(top - 26).toFixed(1)}" width="2" height="26"/>`;
        CITY.towers.push({ x: x + w / 2, y: top - 26 });
      }
      if (withWindows) {
        for (let wx = x + 6; wx < x + w - 6; wx += 11) {
          for (let wy = top + 9; wy < H - 14; wy += 15) {
            if (Math.random() < 0.30) {
              const flick = Math.random() < 0.09 ? ` class="win-f" style="animation-delay:${rnd(0, 4).toFixed(1)}s"` : "";
              windows += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3.2" height="4.6"${flick}/>`;
            }
          }
        }
      }
      x += w + rnd(2, 16);
      i++;
    }
    return `<svg class="${cls}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <g fill="${fill}">${rects}</g>
      <g fill="${THEME.cityWindow}" opacity="0.55">${windows}</g>
    </svg>`;
  }

  holder.innerHTML =
    layer("city__far", H * 0.16, THEME.cityFar, false, 0) +
    layer("city__near", H * 0.13, THEME.cityNear, true, 4);

  CITY.far = holder.querySelector(".city__far");
  CITY.near = holder.querySelector(".city__near");
}

function initCityParallax() {
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking || !CITY.far) return;
    ticking = true;
    requestAnimationFrame(() => {
      CITY.far.style.transform = `translateY(${scrollY * 0.07}px)`;
      CITY.near.style.transform = `translateY(${scrollY * 0.028}px)`;
      ticking = false;
    });
  }, { passive: true });
}

/* ============================================================
   The scene canvas — one rAF loop drawing:
   · silk-strand node field (cursor-reactive sagging threads)
   · fading silk trail behind the pointer
   · Spider-Man swinging across the city on web lines
   · web-shots and radial web splats on click
   ============================================================ */
function initScene() {
  const canvas = document.getElementById("web-canvas");
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, nodes = [], splats = [], shots = [], trail = [], streaks = [];
  let prevScroll = scrollY, svS = 0; // smoothed scroll velocity (px/frame)
  const mouse = { x: -9999, y: -9999 };
  const LINK_DIST = 170, MOUSE_DIST = 200;

  /* ---- Spider-Man swing physics ---- */
  const G = 2400;
  const spidey = REDUCED_MOTION ? null : {
    mode: "swing", x: 0, y: 0, vx: 0, vy: 0,
    ax: 0, ay: 0, L: 220, th: -0.95, om: 0, lastLine: 0
  };

  function anchorAhead(x, y) {
    // prefer a real tower top ahead and above; otherwise a sky point
    const c = CITY.towers.filter((t) => t.x > x + 120 && t.x < x + 480 && t.y < y - 90);
    if (c.length) {
      const t = c[Math.floor(Math.random() * c.length)];
      return { x: t.x, y: t.y };
    }
    return { x: x + rnd(240, 380), y: Math.max(40, y - rnd(220, 300)) };
  }

  function resetSpidey() {
    spidey.mode = "swing";
    spidey.x = -40;
    spidey.y = H * rnd(0.28, 0.42);
    const a = anchorAhead(spidey.x, spidey.y + 120);
    spidey.ax = a.x; spidey.ay = a.y;
    const dx = spidey.x - a.x, dy = spidey.y - a.y;
    spidey.L = Math.max(140, Math.hypot(dx, dy));
    spidey.th = Math.atan2(dx, dy);
    spidey.om = 0.8;
  }

  function stepSpidey(dt) {
    if (spidey.mode === "swing") {
      spidey.om += (-G / spidey.L) * Math.sin(spidey.th) * dt;
      spidey.om *= 0.999;
      spidey.th += spidey.om * dt;
      spidey.x = spidey.ax + spidey.L * Math.sin(spidey.th);
      spidey.y = spidey.ay + spidey.L * Math.cos(spidey.th);
      // release on the forward upswing — momentum carries him into flight
      if (spidey.th > 0.62 && spidey.om > 1.1) {
        spidey.vx = spidey.L * spidey.om * Math.cos(spidey.th);
        spidey.vy = -spidey.L * spidey.om * Math.sin(spidey.th);
        spidey.mode = "fly";
      }
    } else {
      spidey.vy += G * dt;
      spidey.x += spidey.vx * dt;
      spidey.y += spidey.vy * dt;
      // falling again: fire a new web at the next building
      if (spidey.vy > 60) {
        const a = anchorAhead(spidey.x, spidey.y);
        spidey.ax = a.x; spidey.ay = a.y;
        const dx = spidey.x - a.x, dy = spidey.y - a.y;
        spidey.L = Math.min(Math.max(Math.hypot(dx, dy), 150), 320);
        spidey.th = Math.atan2(dx, dy);
        const om = (spidey.vx * Math.cos(spidey.th) - spidey.vy * Math.sin(spidey.th)) / spidey.L;
        spidey.om = Math.max(om, 0.9);
        spidey.mode = "swing";
      }
    }
    if (spidey.x > W + 60) resetSpidey();
    if (spidey.y > H * 0.92) { spidey.y = H * 0.92; if (spidey.mode === "fly") spidey.vy = -Math.abs(spidey.vy) * 0.4; }
  }

  function drawSpiderFigure(x, y, ang, swingPose, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(scale, scale);
    // limbs
    ctx.strokeStyle = THEME.spideyLimb;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (swingPose) {
      ctx.moveTo(2, -8); ctx.lineTo(5, -16); ctx.lineTo(3, -24);     // web arm up the line
      ctx.moveTo(-2, -6); ctx.lineTo(-9, -2); ctx.lineTo(-13, 4);    // trailing arm
      ctx.moveTo(0, 8); ctx.lineTo(8, 12); ctx.lineTo(7, 20);        // tucked legs
      ctx.moveTo(-1, 8); ctx.lineTo(4, 15); ctx.lineTo(1, 22);
    } else {
      ctx.moveTo(2, -8); ctx.lineTo(10, -13); ctx.lineTo(17, -16);   // superman stretch
      ctx.moveTo(-2, -7); ctx.lineTo(-10, -10); ctx.lineTo(-16, -8);
      ctx.moveTo(1, 8); ctx.lineTo(9, 14); ctx.lineTo(14, 21);
      ctx.moveTo(-1, 8); ctx.lineTo(-7, 15); ctx.lineTo(-10, 22);
    }
    ctx.stroke();
    // torso + head
    ctx.fillStyle = THEME.spideyBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.6, 8.6, swingPose ? 0.18 : 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(swingPose ? 1.5 : 5, -11.5, 4, 0, Math.PI * 2);
    ctx.fill();
    // eye glint
    ctx.fillStyle = THEME.spideyGlint;
    ctx.beginPath();
    ctx.ellipse(swingPose ? 3 : 6.6, -12.2, 1.5, 1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSpidey() {
    const s = spidey;
    // web line while swinging
    if (s.mode === "swing") {
      ctx.strokeStyle = `rgba(${THEME.silk}, 0.75)`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(s.ax, s.ay);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.fillStyle = `rgba(${THEME.silk}, 0.8)`;
      ctx.beginPath();
      ctx.arc(s.ax, s.ay, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    const ang = s.mode === "swing"
      ? Math.atan2(s.x - s.ax, -(s.ay - s.y)) * -1
      : Math.atan2(s.vy, s.vx) * 0.25;
    drawSpiderFigure(s.x, s.y, ang, s.mode === "swing");
  }

  /* ---- the rider: mini Spidey rappelling down the page's web
     line, hanging at the scroll tip, leaning with your speed ---- */
  function drawRider(now) {
    if (!SWING.tip) return;
    const ty = SWING.tip.y - scrollY;
    if (ty < -60 || ty > H + 60) return;
    const lean = Math.max(-0.7, Math.min(0.7, -svS * 0.05));
    const sway = Math.sin(now / 560) * (0.1 + Math.min(Math.abs(svS) * 0.015, 0.35));
    const th = lean + sway;
    const L = 30;
    const rx = SWING.tip.x + Math.sin(th) * L;
    const ry = ty + Math.cos(th) * L;
    ctx.strokeStyle = `rgba(${THEME.silk}, 0.85)`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(SWING.tip.x, ty);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    drawSpiderFigure(rx, ry, th, true, 0.78);
  }

  /* ---- silk node field ---- */
  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.min(70, Math.round((W * H) / 21000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: rnd(-0.11, 0.11),
      vy: rnd(-0.11, 0.11),
      r: rnd(0.8, 2.2),
      z: rnd(0.25, 1) // depth: far strands barely move with scroll, near ones stream past
    }));
    if (spidey) resetSpidey();
  }

  function drawStrand(a, b, alpha) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dm = Math.hypot(mouse.x - mx, mouse.y - my);
    const near = Math.max(0, 1 - dm / MOUSE_DIST);
    const sag = (1 - near) * 9;
    ctx.strokeStyle = near > 0.05
      ? `rgba(${THEME.acc}, ${alpha * (0.35 + near * 0.6)})`
      : `rgba(${THEME.silk}, ${alpha * 0.22})`;
    ctx.lineWidth = 0.7 + near * 0.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx, my + sag, b.x, b.y);
    ctx.stroke();
  }

  function drawSplat(s, now) {
    const t = (now - s.t0) / 900;
    if (t >= 1) return false;
    const ease = 1 - Math.pow(1 - Math.min(t * 1.6, 1), 3);
    const fade = 1 - t;
    ctx.strokeStyle = `rgba(${THEME.silk}, ${0.65 * fade})`;
    ctx.lineWidth = 1;
    for (const sp of s.spokes) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + Math.cos(sp.a) * sp.len * ease, s.y + Math.sin(sp.a) * sp.len * ease);
      ctx.stroke();
    }
    for (const frac of [0.35, 0.62, 0.88]) {
      ctx.beginPath();
      for (let i = 0; i <= s.spokes.length; i++) {
        const sp = s.spokes[i % s.spokes.length];
        const px = s.x + Math.cos(sp.a) * sp.len * frac * ease;
        const py = s.y + Math.sin(sp.a) * sp.len * frac * ease;
        if (i === 0) ctx.moveTo(px, py);
        else {
          const prev = s.spokes[(i - 1) % s.spokes.length];
          const qx = s.x + Math.cos((prev.a + sp.a) / 2) * sp.len * frac * ease * 0.92;
          const qy = s.y + Math.sin((prev.a + sp.a) / 2) * sp.len * frac * ease * 0.92;
          ctx.quadraticCurveTo(qx, qy, px, py);
        }
      }
      ctx.stroke();
    }
    return true;
  }

  function spawnSplat(x, y, scale = 1) {
    const n = 9 + Math.floor(Math.random() * 3);
    splats.push({
      x, y, t0: performance.now(),
      spokes: Array.from({ length: n }, (_, i) => ({
        a: (i / n) * Math.PI * 2 + Math.random() * 0.3,
        len: rnd(46, 86) * scale
      }))
    });
    if (splats.length > 6) splats.shift();
  }
  EFFECTS.splat = spawnSplat;

  function drawShot(s, now) {
    // a web line zipping from Spidey to the click point
    const t = (now - s.t0) / 150;
    if (t >= 1) {
      if (!s.done) { s.done = true; spawnSplat(s.x1, s.y1); }
      return now - s.t0 < 420; // linger briefly, fading
    }
    const fade = t < 1 ? 0.85 : 0;
    ctx.strokeStyle = `rgba(${THEME.silk}, ${fade})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(s.x0, s.y0);
    ctx.lineTo(s.x0 + (s.x1 - s.x0) * t, s.y0 + (s.y1 - s.y0) * t);
    ctx.stroke();
    return true;
  }

  function drawTrail(now) {
    if (trail.length < 2) return;
    for (let i = 1; i < trail.length; i++) {
      const age = (now - trail[i].t) / 450;
      if (age >= 1) continue;
      ctx.strokeStyle = `rgba(${THEME.acc}, ${0.28 * (1 - age)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
    while (trail.length && now - trail[0].t > 450) trail.shift();
  }

  let raf, lastT = 0;
  function frame(now) {
    const dt = Math.min((now - lastT) / 1000 || 0.016, 0.033);
    lastT = now;
    ctx.clearRect(0, 0, W, H);

    // scroll velocity: raw this frame + smoothed for effects
    const svRaw = scrollY - prevScroll;
    prevScroll = scrollY;
    svS += (svRaw - svS) * 0.12;
    const speed = Math.abs(svS);

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      // depth parallax: the field streams past as you scroll,
      // near strands (high z) faster than far ones
      n.y -= svRaw * n.z * 0.55;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      const dx = mouse.x - n.x, dy = mouse.y - n.y;
      const d = Math.hypot(dx, dy);
      if (d < MOUSE_DIST && d > 1) {
        n.x += (dx / d) * 0.18;
        n.y += (dy / d) * 0.18;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) drawStrand(a, b, 1 - d / LINK_DIST);
      }
    }
    // nodes render as dots at rest, stretching into motion streaks
    // proportional to scroll speed and their depth
    for (const n of nodes) {
      const stretch = svS * n.z * 1.7;
      const rr = n.r * (0.5 + n.z * 0.7);
      if (Math.abs(stretch) > 4) {
        ctx.strokeStyle = `rgba(${THEME.silk}, ${0.4 * n.z})`;
        ctx.lineWidth = rr;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.x, n.y + stretch);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${THEME.silk}, 0.5)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // comic speed-lines on hard scrolls, hugging the page edges
    if (speed > 14 && Math.random() < 0.6) {
      const edge = Math.random() < 0.5;
      streaks.push({
        x: edge ? rnd(0, W * 0.22) : rnd(W * 0.78, W),
        y: rnd(-40, H),
        len: rnd(60, 150) * Math.sign(svS),
        t0: now
      });
      if (streaks.length > 26) streaks.shift();
    }
    streaks = streaks.filter((s) => {
      const age = (now - s.t0) / 300;
      if (age >= 1) return false;
      s.y -= svS * 1.4;
      ctx.strokeStyle = `rgba(${THEME.acc}, ${0.22 * (1 - age)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y + s.len * (1 - age * 0.4));
      ctx.stroke();
      return true;
    });

    drawTrail(now);
    splats = splats.filter((s) => drawSplat(s, now));
    shots = shots.filter((s) => drawShot(s, now));
    if (spidey) { stepSpidey(dt); drawSpidey(); }
    drawRider(now);
    raf = requestAnimationFrame(frame);
  }

  resize();
  addEventListener("resize", () => { resize(); buildSkyline(); });
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) > 5) {
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trail.length > 40) trail.shift();
    }
  }, { passive: true });
  addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });

  addEventListener("pointerdown", (e) => {
    if (REDUCED_MOTION) return;
    // Spidey shoots the web from wherever he is right now
    const from = spidey && spidey.x > 0 && spidey.x < W
      ? { x: spidey.x, y: spidey.y }
      : { x: e.clientX < W / 2 ? -10 : W + 10, y: 60 };
    shots.push({ x0: from.x, y0: from.y, x1: e.clientX, y1: e.clientY, t0: performance.now() });
    if (shots.length > 4) shots.shift();
    const pop = document.createElement("span");
    pop.className = "thwip-pop";
    pop.textContent = "thwip!";
    pop.style.left = e.clientX + "px";
    pop.style.top = e.clientY + "px";
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 750);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { lastT = performance.now(); raf = requestAnimationFrame(frame); }
  });

  if (REDUCED_MOTION) {
    frame(0);
    cancelAnimationFrame(raf);
  } else {
    raf = requestAnimationFrame(frame);
  }
}

/* ============================================================
   Hero name — each letter swings down into place with its own
   red/blue misprint shadow.
   ============================================================ */
function letterize() {
  if (REDUCED_MOTION) return;
  const el = document.querySelector(".hero__name");
  if (!el) return;
  const text = el.textContent;
  el.removeAttribute("data-text");
  el.classList.add("letterized");
  // letters are inline-block, which would allow mid-word line breaks —
  // so each word gets an unbreakable wrapper and lines only break at spaces
  let i = 0;
  el.innerHTML = text.split(" ").map((word) =>
    `<span class="word" style="display:inline-block;white-space:nowrap">${[...word].map((ch) =>
      `<span class="ltr" style="animation-delay:${(0.25 + i++ * 0.045).toFixed(2)}s">${ch}</span>`
    ).join("")}</span>`
  ).join(" ");
}

/* ============================================================
   The swing line — one continuous silk thread weaving down the
   whole document through every section, drawn by your scroll.
   A glowing tip rides the curve; a web node ignites at each
   section as the line reaches it.
   ============================================================ */
function initSwingPath() {
  if (REDUCED_MOTION) return;
  let svg, path, nodes = [], nodeLens = [], nodePts = [], lit = [], primed = false, total = 0, docH = 0;

  function build() {
    if (svg) svg.remove();
    docH = document.documentElement.scrollHeight;
    const W = innerWidth;
    if (W < 760) return;
    const sections = [...document.querySelectorAll("main .section")];
    if (!sections.length) return;

    // anchor points weave left-right, one per section
    const pts = [{ x: W * 0.5, y: 24 }];
    sections.forEach((sec, i) => {
      pts.push({ x: W * (i % 2 ? 0.94 : 0.06), y: sec.offsetTop + 110 });
    });
    pts.push({ x: W * 0.5, y: docH - 60 });

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const ym = (a.y + b.y) / 2;
      d += ` C ${a.x} ${ym}, ${b.x} ${ym}, ${b.x} ${b.y}`;
    }

    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "swing-path");
    svg.setAttribute("width", W);
    svg.setAttribute("height", docH);
    svg.setAttribute("viewBox", `0 0 ${W} ${docH}`);
    svg.innerHTML = `
      <path class="swing-path__line" d="${d}"/>
      ${pts.slice(1, -1).map((p) => `<g class="swing-node" transform="translate(${p.x} ${p.y})">
        <circle class="swing-node__ring" r="9"/>
        <circle class="swing-node__dot" r="3"/>
      </g>`).join("")}
`;
    document.body.appendChild(svg);

    path = svg.querySelector(".swing-path__line");
    nodes = [...svg.querySelectorAll(".swing-node")];
    nodePts = pts.slice(1, -1);
    lit = nodes.map(() => false);
    primed = false;
    total = path.getTotalLength();
    path.style.strokeDasharray = total;

    // length along the path at which each node sits
    nodeLens = nodePts.map(() => 0);
    const best = nodePts.map(() => Infinity);
    for (let l = 0; l <= total; l += 24) {
      const p = path.getPointAtLength(l);
      nodePts.forEach((np, i) => {
        const dd = (p.x - np.x) ** 2 + (p.y - np.y) ** 2;
        if (dd < best[i]) { best[i] = dd; nodeLens[i] = l; }
      });
    }
    update();
  }

  function update() {
    if (!path) return;
    const tip = Math.min(total, Math.max(0, total * ((scrollY + innerHeight * 0.6) / docH)));
    path.style.strokeDashoffset = total - tip;
    const p = path.getPointAtLength(tip);
    SWING.tip = { x: p.x, y: p.y }; // doc coords; the canvas rider hangs here
    nodes.forEach((n, i) => {
      const on = tip >= nodeLens[i];
      // a node igniting fires a web burst into the scene canvas
      if (on && !lit[i] && primed && EFFECTS.splat) {
        EFFECTS.splat(nodePts[i].x, nodePts[i].y - scrollY, 0.55);
      }
      lit[i] = on;
      n.classList.toggle("lit", on);
    });
    primed = true;
  }

  let ticking = false;
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); }
  }, { passive: true });

  // rebuild when layout truly changes (fonts, resize, content)
  let t;
  const rebuild = () => { clearTimeout(t); t = setTimeout(build, 220); };
  addEventListener("resize", rebuild);
  addEventListener("load", rebuild);
  build();
}

/* ============================================================
   Velocity skew — the page leans into fast scrolls and eases
   back upright, like a swing mid-arc.
   ============================================================ */
function initScrollSkew() {
  if (REDUCED_MOTION) return;
  const main = document.querySelector("main");
  let target = 0, cur = 0, lastY = scrollY, lastT = performance.now(), raf = null;

  function tick() {
    target *= 0.86;
    cur += (target - cur) * 0.12;
    if (Math.abs(cur) < 0.012 && Math.abs(target) < 0.012) {
      main.style.transform = "";
      raf = null;
      return;
    }
    main.style.transform = `skewY(${cur.toFixed(3)}deg)`;
    raf = requestAnimationFrame(tick);
  }

  addEventListener("scroll", () => {
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    const v = (scrollY - lastY) / dt;
    lastY = scrollY; lastT = now;
    target = Math.max(-1.1, Math.min(1.1, v * 0.55));
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
}

/* ============================================================
   Scroll strand — the spider rappels down as you read.
   ============================================================ */
function initStrand() {
  const line = document.getElementById("strand-line");
  const spider = document.getElementById("strand-spider");
  if (!line || !spider) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    const y = p * innerHeight;
    line.style.height = y + "px";
    spider.style.top = y + "px";
    ticking = false;
  };
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener("resize", update);
  update();
}

/* ============================================================
   Corner webs — a quarter spider-web stroke-drawn into the
   top-right of every section as it scrolls into view.
   ============================================================ */
const CORNER_WEB_SVG = `
<svg class="web-corner" viewBox="0 0 120 120" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-width="1.1">
    <path pathLength="1" d="M120 0 L0 120 M120 40 L40 120 M120 80 L80 120 M80 0 L0 80 M40 0 L0 40"/>
    <path pathLength="1" d="M90 0 Q92 92 120 90 M60 0 Q64 64 120 60 M30 0 Q36 36 120 30 M110 120 Q10 110 0 10"/>
  </g>
</svg>`;

function initSectionWebs() {
  document.querySelectorAll(".section").forEach((sec) => {
    sec.insertAdjacentHTML("afterbegin", CORNER_WEB_SVG);
  });
}

/* ============================================================
   Content rendering (unchanged data, comic-panel markup)
   ============================================================ */
function renderSkills() {
  document.getElementById("skills-list").innerHTML = SKILLS.map(([group, items]) => `
    <div class="skill-group reveal">
      <span class="skill-group__label">${group}</span>
      <div class="skill-group__chips">${items.map((i) => `<span class="chip">${i}</span>`).join("")}</div>
    </div>`).join("");
}

function renderRoles() {
  document.getElementById("roles-list").innerHTML = ROLES.map((r) => `
    <div class="role-row reveal">
      <div class="role-name">${r.name}</div>
      <div class="role-body">
        <p>${r.desc}</p>
        <span class="role-tools">${r.tools}</span>
      </div>
    </div>`).join("");
}

function renderWorks() {
  const list = document.getElementById("work-list");
  list.innerHTML = WORKS.map((w) => {
    const open = !!w.link;
    const a11y = open ? ` data-href="${w.link}" role="link" tabindex="0" aria-label="Open ${w.title} in a new tab"` : "";
    return `
      <article class="work-card reveal${open ? " is-link" : ""}"${a11y}>
        ${open ? '<span class="work-card__arrow" aria-hidden="true">↗</span>' : ""}
        <span class="work-card__tag">${w.tag}</span>
        <h3>${w.title}</h3>
        <p>${w.desc}</p>
        <span class="work-card__stack">${w.stack}</span>
      </article>`;
  }).join("");
  list.querySelectorAll(".work-card.is-link").forEach((c) => {
    const go = () => window.open(c.dataset.href, "_blank", "noopener");
    c.addEventListener("click", (e) => { if (!e.target.closest("a")) go(); });
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
}

/* ============================================================
   Scroll reveals — elements swing in; sections trigger their
   corner-web draw and the chromatic offset on their titles.
   ============================================================ */
function initReveal() {
  if (REDUCED_MOTION) return;
  const els = document.querySelectorAll(".sec-head, .about, .role-row, .skill-group, .work-card, .exp, .contact__lead, .contact__email, .contact__row");
  els.forEach((e) => e.classList.add("reveal"));
  document.querySelectorAll(".work, .skills, .roles").forEach((group) => {
    [...group.children].forEach((child, i) => {
      child.style.transitionDelay = `${Math.min(i * 70, 420)}ms`;
    });
  });
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => e.target.classList.toggle("in", e.isIntersecting));
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  els.forEach((e) => io.observe(e));

  const secIo = new IntersectionObserver((ents) => {
    ents.forEach((e) => e.target.classList.toggle("sec-in", e.isIntersecting));
  }, { threshold: 0.12 });
  document.querySelectorAll(".section").forEach((s) => secIo.observe(s));
}

function initNav() {
  const nav = document.getElementById("nav");
  const on = () => nav.classList.toggle("scrolled", window.scrollY > 16);
  on(); window.addEventListener("scroll", on, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initThemes();
  buildSkyline();
  initCityParallax();
  initSectionWebs();
  renderRoles();
  renderSkills();
  renderWorks();
  letterize();
  initReveal();
  initNav();
  initScene();
  initStrand();
  initSwingPath();
  initScrollSkew();
  document.getElementById("year").textContent = new Date().getFullYear();
});

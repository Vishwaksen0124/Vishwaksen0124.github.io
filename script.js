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
    document.dispatchEvent(new CustomEvent("vp-theme"));
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
  let W = 0, H = 0, splats = [], shots = [], trail = [], streaks = [];
  let prevScroll = scrollY, svS = 0; // smoothed scroll velocity (px/frame)
  const mouse = { x: -9999, y: -9999 };

  /* ---- silk node field ---- */
  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
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
    raf = requestAnimationFrame(frame);
  }

  resize();
  let rsT;
  addEventListener("resize", () => {
    clearTimeout(rsT);
    rsT = setTimeout(resize, 180);
  });
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
    // the 3D Spidey shoots the web from wherever he is on screen
    const sp = window.SPIDEY_SCREEN;
    const from = sp && sp.x > -100 && sp.x < W + 100 && sp.y > -100 && sp.y < H + 100
      ? sp
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
  initSectionWebs();
  renderRoles();
  renderSkills();
  renderWorks();
  letterize();
  initReveal();
  initNav();
  initScene();
  initScrollSkew();
  document.getElementById("year").textContent = new Date().getFullYear();
});

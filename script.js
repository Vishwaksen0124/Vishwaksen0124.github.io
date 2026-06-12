/* ============================================================
   Vishwaksen Pujala — Spider-Verse portfolio interactions
   silk-strand canvas · web splats · rappelling scroll spider
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

/* ============================================================
   Live silk-strand field — drifting nodes joined by sagging
   web threads that pull taut and brighten near the cursor,
   plus radial web-splat bursts on click.
   ============================================================ */
function initWebCanvas() {
  const canvas = document.getElementById("web-canvas");
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, nodes = [], splats = [];
  const mouse = { x: -9999, y: -9999 };
  const LINK_DIST = 170, MOUSE_DIST = 200;

  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.min(90, Math.round((W * H) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 0.8 + Math.random() * 1.4
    }));
  }

  function drawStrand(a, b, alpha) {
    // silk threads sag a little; they pull taut near the cursor
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dm = Math.hypot(mouse.x - mx, mouse.y - my);
    const near = Math.max(0, 1 - dm / MOUSE_DIST);
    const sag = (1 - near) * 9;
    ctx.strokeStyle = near > 0.05
      ? `rgba(255, 76, 82, ${alpha * (0.35 + near * 0.6)})`
      : `rgba(190, 200, 235, ${alpha * 0.3})`;
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
    ctx.strokeStyle = `rgba(232, 236, 250, ${0.65 * fade})`;
    ctx.lineWidth = 1;
    // radial spokes
    for (let i = 0; i < s.spokes.length; i++) {
      const sp = s.spokes[i];
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + Math.cos(sp.a) * sp.len * ease, s.y + Math.sin(sp.a) * sp.len * ease);
      ctx.stroke();
    }
    // concentric web rings strung between spokes
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

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      // gentle pull toward the cursor, like silk catching a draft
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
    ctx.fillStyle = "rgba(214, 222, 244, 0.5)";
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    splats = splats.filter((s) => drawSplat(s, now));
    raf = requestAnimationFrame(frame);
  }

  let raf;
  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });

  addEventListener("pointerdown", (e) => {
    if (REDUCED_MOTION) return;
    const spokeCount = 9 + Math.floor(Math.random() * 3);
    splats.push({
      x: e.clientX, y: e.clientY, t0: performance.now(),
      spokes: Array.from({ length: spokeCount }, (_, i) => ({
        a: (i / spokeCount) * Math.PI * 2 + Math.random() * 0.3,
        len: 46 + Math.random() * 40
      }))
    });
    if (splats.length > 6) splats.shift();
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
    else raf = requestAnimationFrame(frame);
  });

  if (REDUCED_MOTION) {
    // single static frame, no animation loop
    frame(0);
    cancelAnimationFrame(raf);
  } else {
    raf = requestAnimationFrame(frame);
  }
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
  // stagger siblings so panels land one after another, like web-zips
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
  initSectionWebs();
  renderRoles();
  renderSkills();
  renderWorks();
  initReveal();
  initNav();
  initWebCanvas();
  initStrand();
  document.getElementById("year").textContent = new Date().getFullYear();
});

/* ============================================================
   Vishwaksen Pujala — startup-engineer portfolio
   Content driven by real GitHub data (commit depth, languages).
   ============================================================ */

const CHIPS = [
  "Python", "TypeScript", "JavaScript", "SQL / PLpgSQL", "Go", "Rust",
  "FastAPI", "Node.js", "LangGraph", "Celery", "Redis", "AWS", "Azure",
  "Terraform", "Docker", "PostgreSQL", "React", "Next.js", "PyTorch", "Grafana"
];

/* the hats — each grounded in real work / commit evidence */
const HATS = [
  {
    role: "Backend Engineer",
    blurb: "APIs, services and the event-driven backbone that everything else runs on.",
    tools: "FastAPI · Celery · Redis · SQS · EventBridge",
    proof: "core production platform"
  },
  {
    role: "Data & Analytics",
    blurb: "Northstar metrics, cohort & funnel analysis, and the BI founders read every morning.",
    tools: "PLpgSQL · Pandas · Grafana · BigQuery",
    proof: "company-wide BI & analytics"
  },
  {
    role: "AI / LLM Engineer",
    blurb: "Production agent orchestration with tracing, evaluation and vendor swaps.",
    tools: "LangGraph · LangSmith · Mistral · OpenAI · PyTorch",
    proof: "10+ agents in production"
  },
  {
    role: "DevOps / Infra",
    blurb: "Infrastructure-as-code, container builds and CI so the team can ship safely.",
    tools: "Terraform · Azure · Docker · GitHub Actions",
    proof: "Azure infra-as-code"
  },
  {
    role: "Full-stack",
    blurb: "Operational dashboards and user-facing apps wired straight to the backend.",
    tools: "React · Next.js · TypeScript · Socket.IO",
    proof: "ops dashboards · Planity · LoveStream"
  },
  {
    role: "Operations Engineer",
    blurb: "Automation, alerting and on-call — keeping the order pipeline alive in the real world.",
    tools: "Python automation · Slack · CloudWatch alerts",
    proof: "60+ orders/day across 6 platforms"
  }
];

/* systems & projects — private org systems shown with commit depth, OSS linked */
const WORKS = [
  { title: "Core Backend Platform", tag: "Backend · production",
    desc: "The platform everything runs on — FastAPI services, the order/agent backbone, and a distributed Celery/Redis/SQS pipeline routing thousands of events a day.",
    stack: "Python · FastAPI · Celery · AWS" },
  { title: "Analytics & BI Engine", tag: "Data · production",
    desc: "The analytics layer behind the company: a daily Northstar pipeline, cohort & funnel models, and Grafana dashboards the founders rely on.",
    stack: "PLpgSQL · Python · Grafana" },
  { title: "Order Orchestration Pipeline", tag: "Ops · production",
    desc: "Cart orchestration across 6 partner platforms with a retry-aware tracking ledger, wallet debits and ops-alert escalation.",
    stack: "Python · automation · Slack" },
  { title: "Cloud Infrastructure", tag: "DevOps · production",
    desc: "Cloud infrastructure-as-code with Terraform, plus archiving, backup and deploy automation for the platform.",
    stack: "Terraform · Azure · Docker" },
  { title: "Creative Writing Studio", tag: "GenAI · live", link: "https://creativewritingstudio.streamlit.app",
    desc: "Multi-agent writing platform — Plot, Dialogue & Editor agents co-author stories with FAISS retrieval and Mistral generation. Shipped publicly.",
    stack: "LangChain · FAISS · Streamlit" },
  { title: "LoveStream", tag: "Realtime", link: "https://github.com/Vishwaksen0124/lovestream",
    desc: "Low-latency P2P video & screen-share with system audio and live presence — WebRTC transport, Supabase Realtime sync.",
    stack: "Next.js 16 · WebRTC · Supabase" },
  { title: "Planity", tag: "Full-stack", link: "https://github.com/Vishwaksen0124/Planity",
    desc: "Role-based team task manager: subtasks, soft-delete/restore, real-time notifications, Redis caching, Docker Compose + CI/CD.",
    stack: "React · Node.js · MongoDB · Redis" },
  { title: "Image Stitching — RDISNet", tag: "Computer vision", link: "https://github.com/Vishwaksen0124/image-stitching-rdisnet",
    desc: "Deep-learning image stitching — dilated residual encoders plus a transformer context-fusion module for seam-free panoramas.",
    stack: "PyTorch · Transformers" },
  { title: "ChromaGene", tag: "Research", link: "",
    desc: "A transformer inferring cell-type-specific gene expression from ATAC-seq chromatin accessibility data.",
    stack: "PyTorch · Genomics" }
];

function renderChips() {
  document.getElementById("chips").innerHTML = CHIPS.map((c) => `<span class="chip">${c}</span>`).join("");
}

function renderHats() {
  document.getElementById("hats-grid").innerHTML = HATS.map((h) => `
    <article class="tile hat-card reveal">
      <h3 class="hat__role">${h.role}</h3>
      <p class="hat__blurb">${h.blurb}</p>
      <span class="hat__tools">${h.tools}</span>
      <span class="hat__proof"><i></i>${h.proof}</span>
    </article>`).join("");
}

function renderWorks() {
  const grid = document.getElementById("work-grid");
  grid.innerHTML = WORKS.map((w) => {
    const open = !!w.link;
    return `
      <article class="tile work-card reveal${open ? " is-link" : ""}"${open ? ` data-href="${w.link}"` : ""}>
        <span class="tile__tag">${w.tag}</span>
        ${open ? '<span class="tile__arrow">↗</span>' : ""}
        <h3>${w.title}</h3>
        <p>${w.desc}</p>
        <span class="wc__stack">${w.stack}</span>
      </article>`;
  }).join("");
  grid.querySelectorAll(".work-card.is-link").forEach((c) => {
    c.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      window.open(c.dataset.href, "_blank", "noopener");
    });
  });
}

function initTileGlow() {
  document.addEventListener("pointermove", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
    tile.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });
}

function initCounters() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseFloat(el.dataset.count);
      if (reduce) { el.textContent = fmt(target); io.unobserve(el); return; }
      let cur = 0; const step = target / 38;
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = fmt(target); return; }
        el.textContent = fmt(cur);
        requestAnimationFrame(tick);
      };
      tick(); io.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".metric__num").forEach((n) => io.observe(n));
}

function initReveal() {
  const els = document.querySelectorAll(".section, .work-card, .hat-card");
  els.forEach((e) => e.classList.add("reveal"));
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach((e) => io.observe(e));
}

function initTheme() {
  const t = document.getElementById("theme-toggle");
  const apply = (m) => {
    if (m === "light") { document.documentElement.setAttribute("data-theme", "light"); t.textContent = "☾"; }
    else { document.documentElement.removeAttribute("data-theme"); t.textContent = "☼"; }
  };
  apply(localStorage.getItem("theme") || "dark");
  t.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(next); localStorage.setItem("theme", next);
  });
}

function initNav() {
  const nav = document.getElementById("nav");
  const on = () => nav.classList.toggle("scrolled", window.scrollY > 16);
  on(); window.addEventListener("scroll", on, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  renderChips();
  renderHats();
  renderWorks();
  initTileGlow();
  initCounters();
  initReveal();
  initTheme();
  initNav();
  document.getElementById("year").textContent = new Date().getFullYear();
});

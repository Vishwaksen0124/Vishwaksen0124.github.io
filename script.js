/* ============================================================
   Vishwaksen Pujala — bento portfolio interactions
   ============================================================ */

const CHIPS = [
  "Python", "TypeScript", "Rust", "FastAPI", "Node.js", "LangGraph",
  "LangSmith", "Celery", "Redis", "AWS", "Docker", "PostgreSQL", "PyTorch", "Grafana"
];

const WORKS = [
  {
    title: "Creative Writing Studio",
    desc: "Multi-agent GenAI platform — Plot, Dialogue & Editor agents co-author long-form stories with FAISS retrieval and Mistral generation. Shipped live.",
    stack: "LangChain · FAISS · Streamlit",
    tag: "GenAI · live",
    link: "https://creativewritingstudio.streamlit.app"
  },
  {
    title: "LoveStream",
    desc: "Low-latency P2P video & screen-share with system audio, live presence and an admin console — WebRTC transport, Supabase Realtime sync.",
    stack: "Next.js 16 · WebRTC · Supabase",
    tag: "Realtime",
    link: "https://github.com/Vishwaksen0124/lovestream"
  },
  {
    title: "Planity",
    desc: "Role-based team task manager: subtasks, soft-delete/restore, real-time notifications, Redis caching, MongoDB Atlas, Docker Compose + CI/CD.",
    stack: "React · Node.js · MongoDB · Redis",
    tag: "Full-stack",
    link: "https://github.com/Vishwaksen0124/Planity"
  },
  {
    title: "Image Stitching — RDISNet",
    desc: "Deep-learning image stitching: dilated residual encoders plus a transformer context-fusion module for robust, seam-free panoramas.",
    stack: "PyTorch · Transformers",
    tag: "Computer vision",
    link: "https://github.com/Vishwaksen0124/image-stitching-rdisnet"
  },
  {
    title: "ChromaGene",
    desc: "Research — a transformer inferring cell-type-specific gene expression from ATAC-seq chromatin accessibility data.",
    stack: "PyTorch · Genomics",
    tag: "Research",
    link: ""
  },
  {
    title: "Résumé ↔ JD Analyzer",
    desc: "Scores a résumé against a job description, surfacing the gaps and keywords that matter for ATS screening.",
    stack: "Python · NLP · LLM",
    tag: "Tool",
    link: "https://github.com/Vishwaksen0124/Resume-Job-JD-analyzer"
  }
];

function renderChips() {
  document.getElementById("chips").innerHTML =
    CHIPS.map((c) => `<span class="chip">${c}</span>`).join("");
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

/* pointer-follow glow across all tiles (purposeful bento micro-interaction) */
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
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseFloat(el.dataset.count);
      let cur = 0; const step = target / 38;
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = target; return; }
        el.textContent = Math.floor(cur);
        requestAnimationFrame(tick);
      };
      tick(); io.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".metric__num").forEach((n) => io.observe(n));
}

function initReveal() {
  const els = document.querySelectorAll(".section, .work-card");
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
  renderWorks();
  initTileGlow();
  initCounters();
  initReveal();
  initTheme();
  initNav();
  document.getElementById("year").textContent = new Date().getFullYear();
});

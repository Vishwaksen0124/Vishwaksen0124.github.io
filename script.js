/* ============================================================
   Vishwaksen Pujala — engineering dossier
   ============================================================ */

const WORKS = [
  {
    title: "WhatsApp AI Recruiting Agent",
    featured: true,
    desc: "Autonomous WhatsApp agent that screened 500+ candidates — 3 specialized LLM agents (resume analysis, question generation, conversation), human-in-the-loop approval, live React + Socket.IO dashboard, Redis-backed concurrent interviews.",
    stack: "Node.js · Mistral · React · Socket.IO · Redis",
    year: "2025",
    link: "https://github.com/Vishwaksen0124"
  },
  {
    title: "Creative Writing Studio",
    featured: true,
    desc: "Multi-agent GenAI writing platform: Plot, Dialogue and Editor agents co-author long-form stories with FAISS retrieval over running context and Mistral generation. Shipped live.",
    stack: "LangChain · Mistral · FAISS · Streamlit",
    year: "2025",
    link: "https://creativewritingstudio.streamlit.app",
    code: "https://github.com/Vishwaksen0124/creative-writing-studio"
  },
  {
    title: "LoveStream",
    desc: "Low-latency P2P video & screen-sharing with system audio, live presence and an admin console — WebRTC media transport, Supabase Realtime presence sync.",
    stack: "Next.js 16 · TypeScript · WebRTC · Supabase",
    year: "2025",
    link: "https://github.com/Vishwaksen0124/lovestream"
  },
  {
    title: "Planity",
    desc: "Role-based team task manager: subtasks, soft-delete/restore, real-time notifications, Redis caching, MongoDB Atlas, OpenAPI docs, Docker Compose dev env wired into CI/CD.",
    stack: "React · Node.js · MongoDB · Redis · Docker",
    year: "2025",
    link: "https://github.com/Vishwaksen0124/Planity"
  },
  {
    title: "Image Stitching — RDISNet",
    desc: "Deep-learning image stitching: dilated residual encoders plus a transformer context-fusion module for robust, seam-free panoramas.",
    stack: "PyTorch · Transformers · Computer Vision",
    year: "2026",
    link: "https://github.com/Vishwaksen0124/image-stitching-rdisnet"
  },
  {
    title: "ChromaGene",
    desc: "Research — a transformer that infers cell-type-specific gene expression from ATAC-seq chromatin accessibility data.",
    stack: "PyTorch · Transformers · Genomics",
    year: "2025"
  },
  {
    title: "Résumé ↔ JD Analyzer",
    desc: "Scores a résumé against a job description, surfacing the gaps and keywords that matter for ATS screening.",
    stack: "Python · NLP · LLM",
    year: "2025",
    link: "https://github.com/Vishwaksen0124/Resume-Job-JD-analyzer"
  }
];

const STACK = [
  ["Languages", "Python · TypeScript · Rust · SQL"],
  ["Backend", "FastAPI · Node.js · Pydantic"],
  ["AI / LLM", "LangGraph · LangSmith · RAG · PyTorch"],
  ["Distributed", "Celery · Redis · EventBridge · SQS"],
  ["Cloud", "AWS · Docker · GitHub Actions"],
  ["Data", "PostgreSQL · MongoDB · Pandas · Grafana"]
];

function renderWorks() {
  const el = document.getElementById("works");
  el.innerHTML = WORKS.map((w, i) => {
    const no = String(i + 1).padStart(2, "0");
    const featured = w.featured ? `<span class="tagf">featured</span>` : "";
    const primary = w.link || w.code || "";
    // explicit link row only when there's more than one destination
    const links = [];
    if (w.link && w.code) {
      links.push(`<a href="${w.link}" target="_blank" rel="noopener">Live ↗</a>`);
      links.push(`<a href="${w.code}" target="_blank" rel="noopener">Code ↗</a>`);
    }
    const linkRow = links.length ? `<span class="work__links">${links.join("")}</span>` : "";
    return `
      <li class="work reveal${primary ? " is-link" : ""}"${primary ? ` data-href="${primary}"` : ""}>
        <span class="work__no">${no}</span>
        <div class="work__main">
          <span class="work__title">${w.title}${featured}</span>
          <span class="work__desc">${w.desc}</span>
          <span class="work__stack">${w.stack}</span>
          ${linkRow}
        </div>
        <span class="work__meta">
          <span class="work__arrow">${primary ? "↗" : "·"}</span>
          <span>${w.year}</span>
        </span>
      </li>`;
  }).join("");

  // whole-row click opens the primary link (unless an inner link was clicked)
  el.querySelectorAll(".work.is-link").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      window.open(row.dataset.href, "_blank", "noopener");
    });
  });
}

function renderStack() {
  const el = document.getElementById("stack");
  el.innerHTML = STACK.map(([k, v]) => `<li><span>${k}</span>${v}</li>`).join("");
}

function initTheme() {
  const t = document.getElementById("theme-toggle");
  const apply = (m) => {
    if (m === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  };
  apply(localStorage.getItem("theme") || "dark");
  t.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(next); localStorage.setItem("theme", next);
  });
}

function initReveal() {
  const els = document.querySelectorAll(".block, .work");
  els.forEach((e) => e.classList.add("reveal"));
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach((e) => io.observe(e));
}

function initTopbar() {
  const bar = document.getElementById("topbar");
  const on = () => bar.classList.toggle("scrolled", window.scrollY > 16);
  on(); window.addEventListener("scroll", on, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  renderWorks();
  renderStack();
  initTheme();
  initTopbar();
  initReveal();
  document.getElementById("year").textContent = new Date().getFullYear();
});

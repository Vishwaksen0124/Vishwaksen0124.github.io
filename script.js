/* ============================================================
   Vishwaksen Pujala — portfolio interactions
   ============================================================ */

/* ---------- DATA: projects ---------- */
const PROJECTS = [
  {
    title: "WhatsApp AI Recruiting Agent",
    icon: "🤖",
    featured: true,
    desc: "Autonomous WhatsApp recruiting agent that screened 500+ candidates — 3 specialized LLM agents (resume analysis, question generation, conversation), human-in-the-loop approval, and a live React + Socket.IO dashboard backed by Redis queues.",
    tags: ["Node.js", "Mistral", "React", "Socket.IO", "Redis"],
    links: { github: "https://github.com/Vishwaksen0124" }
  },
  {
    title: "Creative Writing Studio",
    icon: "✍️",
    featured: true,
    desc: "Public multi-agent GenAI writing platform: 3 LangChain agents (Plot, Dialogue, Editor) co-author long-form stories with FAISS retrieval over running context and Mistral generation, served live on Streamlit.",
    tags: ["LangChain", "Mistral", "FAISS", "Streamlit"],
    links: { live: "https://creativewritingstudio.streamlit.app", github: "https://github.com/Vishwaksen0124/creative-writing-studio" }
  },
  {
    title: "LoveStream",
    icon: "📹",
    desc: "Low-latency P2P video & screen-sharing app with system audio, live presence, and an admin console. WebRTC for media transport, Supabase Realtime for presence sync, on Next.js 16 + TypeScript.",
    tags: ["Next.js 16", "TypeScript", "WebRTC", "Supabase"],
    links: { github: "https://github.com/Vishwaksen0124/lovestream" }
  },
  {
    title: "Planity",
    icon: "✅",
    desc: "Role-based team task manager with subtasks, soft-delete/restore, real-time notifications, Redis caching, MongoDB Atlas, OpenAPI docs, and a Docker Compose dev environment wired into CI/CD.",
    tags: ["React", "Node.js", "MongoDB", "Redis", "Docker"],
    links: { github: "https://github.com/Vishwaksen0124/Planity" }
  },
  {
    title: "Image Stitching — RDISNet",
    icon: "🧩",
    desc: "Deep-learning image stitching with RDISNet: dilated residual encoders plus a transformer context-fusion module for robust seam-free panoramas.",
    tags: ["PyTorch", "Transformers", "Computer Vision"],
    links: { github: "https://github.com/Vishwaksen0124/image-stitching-rdisnet" }
  },
  {
    title: "ChromaGene (Research)",
    icon: "🧬",
    desc: "A PyTorch transformer that infers cell-type-specific gene expression from ATAC-seq chromatin accessibility data.",
    tags: ["PyTorch", "Transformers", "Genomics"],
    links: {}
  },
  {
    title: "Resume ↔ JD Analyzer",
    icon: "📑",
    desc: "Tool that analyses a résumé against a job description, scoring fit and surfacing the gaps and keywords that matter for ATS.",
    tags: ["Python", "NLP", "LLM"],
    links: { github: "https://github.com/Vishwaksen0124/Resume-Job-JD-analyzer" }
  },
  {
    title: "Customer Segmentation",
    icon: "📊",
    desc: "Unsupervised customer segmentation using KNN clustering to group buyers by behaviour for targeted strategy.",
    tags: ["Python", "scikit-learn", "Clustering"],
    links: { github: "https://github.com/Vishwaksen0124/Customer-Segmentation" }
  }
];

/* ---------- DATA: skills ---------- */
const SKILLS = [
  { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "SQL", "Rust", "Bash"] },
  { group: "Backend", items: ["FastAPI", "Node.js", "REST APIs", "WebSockets", "Pydantic"] },
  { group: "AI / LLM", items: ["LangChain", "LangGraph", "LangSmith", "RAG", "OpenAI", "Anthropic", "PyTorch", "Agent Eval"] },
  { group: "Distributed", items: ["Celery", "Redis", "AWS EventBridge", "SQS", "Event-Driven", "Idempotency", "DLQs"] },
  { group: "Cloud & DevOps", items: ["AWS EC2", "Lambda", "CloudWatch", "Docker", "GitHub Actions"] },
  { group: "Data", items: ["PostgreSQL", "MongoDB", "Pandas", "Grafana", "Cohort & Funnel Analysis"] }
];

/* ---------- render projects ---------- */
function renderProjects() {
  const grid = document.getElementById("projects-grid");
  grid.innerHTML = PROJECTS.map((p) => {
    const links = [];
    if (p.links.live) links.push(`<a href="${p.links.live}" target="_blank" rel="noopener">Live ↗</a>`);
    if (p.links.github) links.push(`<a href="${p.links.github}" target="_blank" rel="noopener">Code ↗</a>`);
    const linksHtml = links.length ? `<div class="card__links">${links.join("")}</div>` : "";
    const featured = p.featured ? `<span class="card__featured">★ Featured</span>` : "";
    return `
      <article class="card reveal">
        <div class="card__top">
          <span class="card__icon">${p.icon}</span>
          ${linksHtml}
        </div>
        ${featured}
        <h3 class="card__title">${p.title}</h3>
        <p class="card__desc">${p.desc}</p>
        <div class="card__tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      </article>`;
  }).join("");

  // pointer-follow glow
  grid.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    });
  });
}

/* ---------- render skills ---------- */
function renderSkills() {
  const grid = document.getElementById("skills-grid");
  grid.innerHTML = SKILLS.map((s) => `
    <div class="skill-group reveal">
      <h3>${s.group}</h3>
      <div class="chips">${s.items.map((i) => `<span class="chip">${i}</span>`).join("")}</div>
    </div>`).join("");
}

/* ---------- theme toggle ---------- */
function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  toggle.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "light" ? "" : "light";
    if (next) document.documentElement.setAttribute("data-theme", next);
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", next);
  });
}

/* ---------- scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal, .section, .stat, .exp");
  els.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

/* ---------- animated counters ---------- */
function initCounters() {
  const nums = document.querySelectorAll(".stat__num");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const isFloat = target % 1 !== 0;
      let cur = 0;
      const step = target / 40;
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = isFloat ? target.toFixed(1) : target; return; }
        el.textContent = isFloat ? cur.toFixed(1) : Math.floor(cur);
        requestAnimationFrame(tick);
      };
      tick();
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach((n) => io.observe(n));
}

/* ---------- nav scroll state ---------- */
function initNav() {
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderProjects();
  renderSkills();
  initTheme();
  initNav();
  initReveal();
  initCounters();
  document.getElementById("year").textContent = new Date().getFullYear();
});

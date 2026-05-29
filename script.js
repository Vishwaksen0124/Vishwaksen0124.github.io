/* ============================================================
   Vishwaksen Pujala — classic portfolio interactions
   ============================================================ */

const ROLES = [
  { name: "Backend Engineer",
    desc: "APIs, services and the event-driven backbone everything else runs on — built for correctness under load.",
    tools: "FastAPI · Celery · Redis · SQS · EventBridge" },
  { name: "Data & Analytics",
    desc: "The metrics layer behind the company: Northstar pipelines, cohort & funnel analysis, and the dashboards founders read every morning.",
    tools: "PLpgSQL · Pandas · Grafana · BigQuery" },
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
    desc: "Monitoring, alerting and on-call — keeping production healthy and the team unblocked.",
    tools: "CloudWatch · Grafana alerts · Slack · runbooks" }
];

const WORKS = [
  { title: "Creative Writing Studio", tag: "GenAI · live", link: "https://creativewritingstudio.streamlit.app",
    desc: "A live multi-agent writing platform — Plot, Dialogue & Editor agents co-author long-form stories with FAISS retrieval over running context and Mistral generation, served publicly on Streamlit.",
    stack: "LangChain · Mistral · FAISS · Streamlit" },
  { title: "LoveStream", tag: "Realtime", link: "https://github.com/Vishwaksen0124/lovestream",
    desc: "Low-latency peer-to-peer video & screen-share with system audio and live presence — WebRTC media transport, Supabase Realtime presence sync.",
    stack: "Next.js 16 · WebRTC · Supabase" },
  { title: "Planity", tag: "Full-stack", link: "https://github.com/Vishwaksen0124/Planity",
    desc: "Role-based team task manager: subtasks, soft-delete/restore, real-time notifications, Redis caching, MongoDB Atlas, Docker Compose + CI/CD.",
    stack: "React · Node.js · MongoDB · Redis" },
  { title: "Image Stitching — RDISNet", tag: "Computer vision", link: "https://github.com/Vishwaksen0124/image-stitching-rdisnet",
    desc: "Deep-learning image stitching — dilated residual encoders plus a transformer context-fusion module for robust, seam-free panoramas.",
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
    return `
      <article class="work-card reveal${open ? " is-link" : ""}"${open ? ` data-href="${w.link}"` : ""}>
        ${open ? '<span class="work-card__arrow">↗</span>' : ""}
        <span class="work-card__tag">${w.tag}</span>
        <h3>${w.title}</h3>
        <p>${w.desc}</p>
        <span class="work-card__stack">${w.stack}</span>
      </article>`;
  }).join("");
  list.querySelectorAll(".work-card.is-link").forEach((c) => {
    c.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      window.open(c.dataset.href, "_blank", "noopener");
    });
  });
}

function initReveal() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = document.querySelectorAll(".sec-head, .about, .role-row, .skill-group, .work-card, .exp, .contact__lead, .contact__email, .contact__row");
  els.forEach((e) => e.classList.add("reveal"));
  // re-animate every time an element enters/leaves the viewport
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => e.target.classList.toggle("in", e.isIntersecting));
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
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
  renderRoles();
  renderSkills();
  renderWorks();
  initReveal();
  initTheme();
  initNav();
  document.getElementById("year").textContent = new Date().getFullYear();
});

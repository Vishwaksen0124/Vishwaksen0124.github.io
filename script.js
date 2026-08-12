/* ============================================================
   Vishwaksen Pujala — content + motion layer

   Smooth (transform-driven) scroll, masked line reveals, a custom
   cursor, the boot sequence, cursor-tracked 3D tilt, and the
   bridge between the page and the WebGL structure in scene.js.
   ============================================================ */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE = matchMedia("(pointer: coarse)").matches;
const root = document.documentElement;

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
  { title: "Planity", tag: "Full-stack", link: "https://github.com/Vishwaksen0124/Planity",
    desc: "Role-based team task manager with 20 REST endpoints, 3-role RBAC, Redis caching, Swagger docs, and a GitHub Actions CI pipeline with 7 Vitest / Supertest suites.",
    stack: "React · Node.js · MongoDB · Redis · Docker" },
  { title: "Image Stitching (RDISNet)", tag: "Computer vision", link: "https://github.com/Vishwaksen0124/image-stitching-rdisnet",
    desc: "Deep-learning image stitching with dilated residual encoders plus a transformer context-fusion module for robust, seam-free panoramas.",
    stack: "PyTorch · Transformers" },
  { title: "Creative Writing Studio", tag: "GenAI · live", link: "https://creativewritingstudio.streamlit.app",
    desc: "A live multi-agent writing platform where Plot, Dialogue & Editor agents co-author long-form stories with FAISS retrieval over running context and Mistral generation, served publicly on Streamlit.",
    stack: "LangChain · Mistral · FAISS · Streamlit" },
  { title: "Résumé ↔ JD Analyzer", tag: "Tool", link: "https://github.com/Vishwaksen0124/Resume-Job-JD-analyzer",
    desc: "Scores a résumé against a job description, surfacing the gaps and keywords that matter for ATS screening.",
    stack: "Python · NLP · LLM" }
];

const SKILLS = [
  ["Languages", ["Python", "Java", "SQL"]],
  ["AI / LLM", ["LangChain", "LangGraph", "RAG", "AI Agents", "Vector Databases"]],
  ["Backend", ["FastAPI", "Node.js", "Express", "Celery", "Redis", "REST APIs", "WebSockets"]],
  ["Frontend", ["React", "Next.js", "React Native / Expo"]],
  ["Cloud & DevOps", ["AWS", "Azure Container Apps", "Docker", "Terraform", "GitHub Actions"]],
  ["Observability", ["Grafana", "Sentry", "PostHog"]]
];

/* ============================================================
   RENDER
   ============================================================ */
function renderSkills() {
  document.getElementById("skills-list").innerHTML = SKILLS.map(([group, items], gi) => {
    // duplicated once so the -50% translate loops seamlessly
    const row = items.map((i) => `<span class="chip">${i}</span>`).join("");
    return `
    <div class="skill-group reveal">
      <span class="skill-group__label">${group}</span>
      <div class="marquee${gi % 2 ? " marquee--rev" : ""}">
        <div class="marquee__track" style="--dur:${26 + gi * 5}s">${row}${row}</div>
      </div>
    </div>`;
  }).join("");
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
  list.innerHTML = WORKS.map((w, i) => {
    const open = !!w.link;
    const a11y = open ? ` data-href="${w.link}" role="link" tabindex="0" aria-label="Open ${w.title} in a new tab"` : "";
    return `
      <article class="work-card reveal${open ? " is-link" : ""}" data-tilt data-tilt-max="7"${open ? ' data-cursor="open"' : ""}${a11y}>
        <span class="work-card__idx" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
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
   TEXT SPLITTING
   ============================================================ */
function splitLetters(el, gateMs) {
  const text = el.textContent;
  el.textContent = "";
  let i = 0;
  // words wrap as units — letters are inline-block, so without a word
  // wrapper the line can break in the middle of a name.
  text.split(/(\s+)/).forEach((token) => {
    if (token === "") return;
    if (/^\s+$/.test(token)) { el.appendChild(document.createTextNode(" ")); i++; return; }
    const word = document.createElement("span");
    word.className = "word";
    for (const ch of token) {
      const s = document.createElement("span");
      s.className = "ltr";
      s.textContent = ch;
      s.style.setProperty("--i", i++);
      word.appendChild(s);
    }
    el.appendChild(word);
  });
  if (gateMs) el.style.setProperty("--gate", `${gateMs}ms`);
  el.setAttribute("aria-label", text);
}

/* Wrap each *rendered* line in a mask so it can slide up from behind
   its own edge. Needs real layout, so it runs after fonts settle and
   re-runs on resize. */
function splitLines(el) {
  if (!el.dataset.raw) el.dataset.raw = el.innerHTML;
  el.innerHTML = el.dataset.raw;

  // wrap every word so we can read its line box
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  // `prev` spans text nodes: "<strong>IIIT Sri City</strong> (CGPA…" puts the
  // separating space at the start of the *next* node, and the word it belongs
  // to lives in the previous one.
  let prev = null;
  for (const node of texts) {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((tok) => {
      if (tok === "") return;
      if (/^\s+$/.test(tok)) {
        // remember that this word was followed by a space, so the rebuild
        // doesn't invent one before punctuation ("services , the")
        if (prev) prev.dataset.space = "1";
        frag.appendChild(document.createTextNode(" "));
        return;
      }
      const s = document.createElement("span");
      s.className = "w";
      s.style.display = "inline-block";
      s.textContent = tok;
      frag.appendChild(s);
      prev = s;
    });
    node.parentNode.replaceChild(frag, node);
  }

  // group words by vertical position
  const words = [...el.querySelectorAll(".w")];
  if (!words.length) return;
  const rows = [];
  let currentTop = null;
  for (const w of words) {
    const top = Math.round(w.offsetTop);
    if (currentTop === null || Math.abs(top - currentTop) > 4) { rows.push([]); currentTop = top; }
    rows[rows.length - 1].push(w);
  }
  if (rows.length > 8) { el.innerHTML = el.dataset.raw; return; }  // pathological wrap, leave it alone

  // rebuild as masked lines, preserving each word's own markup
  const out = document.createDocumentFragment();
  for (const row of rows) {
    const line = document.createElement("span");
    line.className = "line";
    const inner = document.createElement("span");
    inner.className = "line__in";
    row.forEach((w, i) => {
      // lift the word out of whatever inline wrapper (strong/em/span) it sits in
      const clone = w.cloneNode(true);
      clone.style.display = "";
      clone.className = "";
      delete clone.dataset.space;
      const holder = wrapperChainOf(w, el);
      if (holder) { holder.appendChild(clone); inner.appendChild(holder); }
      else inner.appendChild(clone);
      // Re-insert a space only where the source had one — including on the
      // last word of a line. Lines are block-level so it's invisible, but
      // without it the copied text and the screen-reader output run words
      // together across the line break.
      if (w.dataset.space) inner.appendChild(document.createTextNode(" "));
    });
    line.appendChild(inner);
    out.appendChild(line);
  }
  el.innerHTML = "";
  el.appendChild(out);
}

/* Re-create the inline wrapper (strong, em, .accent…) a word sits in, so its
   styling survives the re-layout into lines. The copy only ever nests one
   level deep; anything deeper degrades to losing the outer wrapper, never to
   losing the text. */
function wrapperChainOf(word, stopAt) {
  const p = word.parentElement;
  if (!p || p === stopAt) return null;
  return p.cloneNode(false);
}

function setupLines() {
  const els = [...document.querySelectorAll("[data-lines]")];
  els.forEach((el) => {
    try { splitLines(el); } catch { /* keep the plain text if anything goes sideways */ }
  });
}

/* ============================================================
   SMOOTH SCROLL
   Native scrollbar drives a lerped transform on #smooth. scene.js
   reads window.__smooth so page and structure stay in lockstep.
   ============================================================ */
function initSmoothScroll() {
  const wrap = document.getElementById("smooth");
  if (!wrap || REDUCED || COARSE) {
    root.classList.add("no-smooth");
    window.__smooth = { get current() { return window.scrollY; }, get limit() { return document.documentElement.scrollHeight - window.innerHeight; } };
    return;
  }
  let current = 0, target = 0, limit = 0;

  const measure = () => {
    const h = wrap.getBoundingClientRect().height;
    document.body.style.height = `${h}px`;
    limit = Math.max(0, h - window.innerHeight);
  };
  measure();
  new ResizeObserver(measure).observe(wrap);
  window.addEventListener("resize", measure);

  window.__smooth = {
    get current() { return current; },
    get limit() { return limit; },
    scrollTo(y) { window.scrollTo({ top: y, behavior: "auto" }); }
  };

  // Time-based easing, not per-frame: a fixed 0.11 step would glide at a
  // different speed on 60Hz vs 144Hz, and stall badly on a slow frame rate.
  let lastT = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    target = window.scrollY;
    const k = 1 - Math.exp(-dt * 7.5);
    const d = target - current;
    current += d * k;
    if (Math.abs(d) < 0.08) current = target;
    wrap.style.transform = `translate3d(0, ${-current}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* Anchor links can't work on their own here: the sections live inside a
   fixed, transformed container, so the browser sees nothing to scroll.
   Translate the target's offset inside #smooth into a real scroll position. */
function initAnchors() {
  const nav = document.getElementById("nav");
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    const pad = (nav ? nav.offsetHeight : 0) + 18;
    const top = root.classList.contains("no-smooth")
      ? el.getBoundingClientRect().top + window.scrollY
      : el.offsetTop;   // offsetTop is relative to #smooth, which is the positioned ancestor
    window.scrollTo({ top: Math.max(0, top - pad), behavior: root.classList.contains("no-smooth") ? "smooth" : "auto" });
    history.replaceState(null, "", `#${id}`);
  });
}

/* ============================================================
   REVEALS
   ============================================================ */
let blockObserver = null, lineObserver = null;

function initReveal() {
  if (REDUCED) {
    document.querySelectorAll("[data-lines]").forEach((e) => e.classList.add("lines-in"));
    return;
  }
  if (!blockObserver) {
    const blocks = document.querySelectorAll(".about__facts, .role-row, .skill-group, .work-card, .exp, .contact__row, .about__side");
    blocks.forEach((e) => e.classList.add("reveal"));
    blockObserver = new IntersectionObserver((ents) => {
      ents.forEach((e) => e.target.classList.toggle("in", e.isIntersecting));
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    blocks.forEach((e) => blockObserver.observe(e));
  }
  // re-run after a resize re-splits the lines, so rebind rather than stack
  if (lineObserver) lineObserver.disconnect();
  lineObserver = new IntersectionObserver((ents) => {
    ents.forEach((e) => e.target.classList.toggle("lines-in", e.isIntersecting));
  }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-lines]").forEach((e) => lineObserver.observe(e));
}

/* ============================================================
   3D TILT / MAGNETS / PARALLAX
   ============================================================ */
function initTilt() {
  if (REDUCED || COARSE) return;
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const max = parseFloat(el.dataset.tiltMax || "8");
    let frame = 0;
    const move = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", `${(px - 0.5) * 2 * max}deg`);
        el.style.setProperty("--rx", `${(0.5 - py) * 2 * max}deg`);
        el.style.setProperty("--px", `${px * 100}%`);
        el.style.setProperty("--py", `${py * 100}%`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);
  });
}

function initMagnets() {
  if (REDUCED || COARSE) return;
  document.querySelectorAll("[data-magnet]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.2}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.34}px`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    });
  });
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  if (REDUCED || COARSE) return;
  const el = document.getElementById("cursor");
  const dot = el.querySelector(".cursor__dot");
  const ring = el.querySelector(".cursor__ring");
  const label = document.getElementById("cursor-label");
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;

  window.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    root.classList.add("has-cursor");
  }, { passive: true });

  const tick = () => {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const bind = (node) => {
    const mode = node.dataset.cursor;
    node.addEventListener("pointerenter", () => {
      if (mode === "hide") { el.classList.add("is-hide"); return; }
      if (mode && mode !== "true") { label.textContent = mode.toUpperCase(); el.classList.add("is-label"); }
      else el.classList.add("is-hover");
    });
    node.addEventListener("pointerleave", () => el.classList.remove("is-hover", "is-label", "is-hide"));
  };
  document.querySelectorAll("[data-cursor]").forEach(bind);
}

/* ============================================================
   INTRO
   ============================================================ */
function initIntro(done) {
  const intro = document.getElementById("intro");
  if (REDUCED || !intro) { root.classList.add("no-intro"); done(0); return; }
  const count = document.getElementById("intro-count");
  const bar = document.getElementById("intro-bar");
  const DUR = 1250;
  const t0 = performance.now();

  const step = (now) => {
    const p = Math.min(1, (now - t0) / DUR);
    const eased = 1 - Math.pow(1 - p, 2.2);
    count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
    bar.style.width = `${eased * 100}%`;
    if (p < 1) requestAnimationFrame(step);
    else {
      intro.classList.add("done");
      done(180);   // let the hero letters start as the curtain lifts
    }
  };
  requestAnimationFrame(step);
}

/* ============================================================
   SCROLL UI — rail, nav state, section → scene
   ============================================================ */
function initScrollUI() {
  const nav = document.getElementById("nav");
  const fill = document.getElementById("rail-fill");
  const links = [...document.querySelectorAll(".nav__links a")];
  const ghosts = [...document.querySelectorAll("[data-parallax]")];

  const onScroll = () => {
    const y = window.scrollY;
    const limit = (window.__smooth && window.__smooth.limit) || (document.documentElement.scrollHeight - window.innerHeight);
    nav.classList.toggle("scrolled", y > 16);
    fill.style.height = `${limit > 0 ? Math.min(100, (y / limit) * 100) : 0}%`;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ghost numerals drift against the scroll
  if (!REDUCED) {
    const par = () => {
      for (const g of ghosts) {
        const r = g.getBoundingClientRect();
        const mid = r.top + r.height / 2 - window.innerHeight / 2;
        g.style.transform = `translate3d(0, ${-mid * parseFloat(g.dataset.parallax)}px, 0)`;
      }
      requestAnimationFrame(par);
    };
    requestAnimationFrame(par);
  }

  const sections = [...document.querySelectorAll("[data-scene]")];
  let current = "";
  const io = new IntersectionObserver((ents) => {
    const vis = ents.filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!vis) return;
    const id = vis.target.dataset.scene;
    if (id === current) return;
    current = id;
    links.forEach((a) => a.classList.toggle("current", a.getAttribute("href") === `#${id}`));
  }, { threshold: [0.12, 0.35, 0.6], rootMargin: "-15% 0px -35% 0px" });
  sections.forEach((s) => io.observe(s));
}

/* ============================================================
   TOGGLES
   ============================================================ */
function initTheme() {
  const t = document.getElementById("theme-toggle");
  const apply = (m) => {
    if (m === "light") { root.setAttribute("data-theme", "light"); t.textContent = "☾"; }
    else { root.removeAttribute("data-theme"); t.textContent = "☼"; }
    if (window.__scene && window.__scene.ok) window.__scene.setTheme(m);
  };
  apply(localStorage.getItem("theme") || "dark");
  // scene.js boots asynchronously, so it may announce itself either side
  // of DOMContentLoaded — cover both.
  const sync = () => window.__scene && window.__scene.ok &&
    window.__scene.setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
  window.addEventListener("scene:ready", sync);
  sync();
  t.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(next); localStorage.setItem("theme", next);
  });
}

function initMotionToggle() {
  const btn = document.getElementById("motion-toggle");
  if (!btn) return;
  const paint = (on) => {
    btn.classList.toggle("off", !on);
    btn.setAttribute("aria-pressed", String(on));
    btn.title = on ? "Turn off the 3D structure" : "Turn on the 3D structure";
  };
  paint(localStorage.getItem("scene") !== "off");
  btn.addEventListener("click", () => {
    const on = localStorage.getItem("scene") === "off";
    localStorage.setItem("scene", on ? "on" : "off");
    paint(on);
    if (window.__scene && window.__scene.ok) {
      window.__scene.setEnabled(on);
      root.classList.toggle("no-3d", !on);
      root.classList.toggle("has-3d", on);
    } else if (on) {
      location.reload();   // scene was never booted; bring it up
    }
  });
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  renderRoles();
  renderSkills();
  renderWorks();
  initSmoothScroll();
  initAnchors();
  initTilt();
  initMagnets();
  initCursor();
  initTheme();
  initMotionToggle();
  initScrollUI();
  document.getElementById("year").textContent = new Date().getFullYear();

  // line splitting needs settled metrics
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  ready.then(() => {
    setupLines();
    initReveal();
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => { setupLines(); initReveal(); }, 250);
    });
  });

  initIntro((gate) => {
    splitLetters(document.querySelector(".hero__name"), gate);
    const email = document.querySelector(".contact__email");
    if (email) splitLetters(email, 0);
  });
});

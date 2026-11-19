const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Header takes the colour of the chapter beneath it ---------- */
const CHAPTERS = {
  light: { bg: "#ffffff", ink: "#111111", meta: "#ffffff" },
  grey: { bg: "#f4f4f4", ink: "#111111", meta: "#f4f4f4" },
  dark: { bg: "#111111", ink: "#ffffff", meta: "#111111" },
  blue: { bg: "#1a4be0", ink: "#ffffff", meta: "#1a4be0" }
};

function initChapterHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  let current = "";
  let queued = false;

  const sample = () => {
    queued = false;
    const y = header.offsetHeight + 1;
    const stack = document.elementsFromPoint(window.innerWidth / 2, y);
    let name = "light";
    for (const el of stack) {
      if (header.contains(el)) continue;
      const chapter = el.closest("[data-chapter]");
      if (chapter) { name = chapter.dataset.chapter; break; }
    }
    if (name === current) return;
    current = name;
    const c = CHAPTERS[name] || CHAPTERS.light;
    root.style.setProperty("--chapter-bg", c.bg);
    root.style.setProperty("--chapter-ink", c.ink);
    if (meta) meta.setAttribute("content", c.meta);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(sample); } };
  sample();
  window.addEventListener("scroll", queue, { passive: true });

  // Step out of the way while reading down, come back when scrolling up.
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const menuOpen = header.querySelector(".menu-panel.open");
    if (y > lastY + 6 && y > 240 && !menuOpen && !header.contains(document.activeElement)) header.classList.add("is-hidden");
    else if (y < lastY - 6 || y <= 240) header.classList.remove("is-hidden");
    lastY = y;
  }, { passive: true });
  header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
  window.addEventListener("resize", queue);
}

/* ---------- Mobile menu ---------- */
function initMenu() {
  const button = document.getElementById("menuButton");
  const panel = document.getElementById("menuPanel");
  if (!button || !panel) return;
  const set = (open) => {
    panel.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "Close" : "Menu";
  };
  button.addEventListener("click", () => set(!panel.classList.contains("open")));
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => set(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) { set(false); button.focus(); }
  });
}

/* ---------- Entrances ---------- */
function initReveals() {
  document.querySelectorAll("section, footer").forEach((section) => {
    section.querySelectorAll(":scope [data-reveal]").forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 6) * 80}ms`));
  });
  document.querySelectorAll(".run").forEach((run) => run.querySelectorAll(".frame").forEach((f, i) => f.style.setProperty("--fi", i)));
  document.querySelectorAll(".poster-list li").forEach((li, i) => li.style.setProperty("--pi", i));
  document.querySelectorAll(".proof tbody tr").forEach((tr, i) => tr.style.setProperty("--ri", i));
  document.querySelectorAll(".project-hero > *").forEach((el, i) => el.style.setProperty("--i", i));

  const targets = document.querySelectorAll("[data-reveal], .run, .poster-list, .proof, .case-section");
  if (REDUCED || !("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-in"));
    document.querySelectorAll(".footer-name").forEach((n) => n.classList.add("is-in"));
    document.querySelectorAll("[data-count]").forEach((n) => { n.textContent = n.dataset.count; });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  targets.forEach((t) => io.observe(t));

  // The footer name is cropped by its section, so watch the footer itself.
  document.querySelectorAll(".footer").forEach((footer) => {
    const name = footer.querySelector(".footer-name");
    if (!name) return;
    const fio = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { name.classList.add("is-in"); fio.disconnect(); }
    }, { threshold: 0 });
    fio.observe(footer);
  });
}

function countUp(node) {
  const end = Number(node.dataset.count) || 0;
  if (end === 0) { node.textContent = "0"; return; }
  const start = performance.now();
  const dur = 1100;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = String(Math.round(end * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  node.textContent = "0";
  requestAnimationFrame(tick);
}

/* ---------- Animated graph behind the hero ---------- */
const graph = { burst: () => {} };

function initHeroCanvas() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  let nodes = [], edges = [], packets = [];
  let pointer = { x: -9999, y: -9999 };
  let running = false;
  let raf = 0;
  let last = performance.now();

  const build = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cell = w < 640 ? 74 : 96;
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;
    nodes = [];
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() < 0.28) continue;
        nodes.push({
          bx: c * cell + (rand() - 0.5) * cell * 0.7,
          by: r * cell + (rand() - 0.5) * cell * 0.7,
          ph: rand() * Math.PI * 2,
          amp: 4 + rand() * 8,
          x: 0, y: 0, links: []
        });
      }
    }
    edges = [];
    nodes.forEach((n, i) => {
      const near = nodes
        .map((m, j) => ({ j, d: (m.bx - n.bx) ** 2 + (m.by - n.by) ** 2 }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      near.forEach(({ j }) => {
        if (!edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i))) {
          edges.push({ a: i, b: j });
          n.links.push(j);
          nodes[j].links.push(i);
        }
      });
    });
    const count = Math.round(nodes.length / 5);
    packets = Array.from({ length: count }, () => spawn(false));
    draw(performance.now(), 0);
  };

  const spawn = (accent) => {
    const from = Math.floor(Math.random() * nodes.length);
    const n = nodes[from];
    const to = n && n.links.length ? n.links[Math.floor(Math.random() * n.links.length)] : from;
    return { from, to, t: Math.random(), speed: 0.25 + Math.random() * 0.35, accent, life: accent ? 2.6 : Infinity };
  };

  graph.burst = () => {
    if (!nodes.length || REDUCED) return;
    for (let i = 0; i < 10; i++) { const p = spawn(true); p.t = 0; p.speed = 0.9 + Math.random() * 0.6; packets.push(p); }
  };

  const draw = (now, dt) => {
    const time = now / 1000;
    nodes.forEach((n) => {
      n.x = n.bx + Math.sin(time * 0.35 + n.ph) * n.amp;
      n.y = n.by + Math.cos(time * 0.28 + n.ph) * n.amp;
    });
    ctx.clearRect(0, 0, w, h);

    ctx.lineWidth = 1;
    edges.forEach((e) => {
      const a = nodes[e.a], b = nodes[e.b];
      const mx = (a.x + b.x) / 2 - pointer.x, my = (a.y + b.y) / 2 - pointer.y;
      const near = Math.max(0, 1 - Math.hypot(mx, my) / 220);
      ctx.strokeStyle = `rgba(255,255,255,${0.07 + near * 0.28})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    nodes.forEach((n) => {
      const near = Math.max(0, 1 - Math.hypot(n.x - pointer.x, n.y - pointer.y) / 180);
      const s = 3 + near * 3;
      ctx.fillStyle = `rgba(255,255,255,${0.22 + near * 0.6})`;
      ctx.fillRect(n.x - s / 2, n.y - s / 2, s, s);
    });

    packets = packets.filter((p) => p.life > 0);
    packets.forEach((p) => {
      p.t += p.speed * dt;
      if (p.accent) p.life -= dt;
      if (p.t >= 1) {
        p.from = p.to;
        const links = nodes[p.from].links;
        p.to = links.length ? links[Math.floor(Math.random() * links.length)] : p.from;
        p.t = 0;
      }
      const a = nodes[p.from], b = nodes[p.to];
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;
      const tx = a.x + (b.x - a.x) * Math.max(0, p.t - 0.18);
      const ty = a.y + (b.y - a.y) * Math.max(0, p.t - 0.18);
      ctx.strokeStyle = p.accent ? "rgba(90,140,255,0.9)" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = p.accent ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = p.accent ? "#5a8cff" : "#ffffff";
      ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
    });
  };

  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(now, dt);
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (running || REDUCED) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  build();
  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 150); });
  const host = canvas.parentElement;
  host.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  host.addEventListener("pointerleave", () => { pointer = { x: -9999, y: -9999 }; });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
}

/* ---------- The live thing: run a real pipeline ---------- */
const PIPELINES = {
  support: {
    summary: "A customer email becomes a triaged, approved reply with an audit trail.",
    steps: [
      ["Gmail trigger", "New support email received from a customer."],
      ["Duplicate check", "Message ID not seen before, so processing continues."],
      ["AI triage", "Classified as billing, priority high, sentiment negative."],
      ["Validate output", "Every field is in the allowed list. No invented values."],
      ["Route to team", "Billing team assigned from a fixed map. Slack alert sent."],
      ["Draft reply", "Draft saved. Ticket status is now pending_approval."],
      ["Human approval", "A reviewer approves the draft in Gmail."],
      ["Send and log", "Reply sent and customer_reply_sent written to the audit table."]
    ]
  },
  opsdesk: {
    summary: "A ticket event reaches n8n through a signed outbox, even if n8n was down.",
    steps: [
      ["Ticket saved", "OPS-2026-0014 created by an employee."],
      ["Outbox row", "Event stored in the same database transaction."],
      ["Worker", "Delivery attempt 1, with exponential backoff on failure."],
      ["HMAC signature", "Body signed with the shared secret and an idempotent event id."],
      ["n8n webhook", "Signature verified, event routed."],
      ["Gmail notice", "Notification email sent. Delivery marked done."]
    ]
  },
  evalforge: {
    summary: "An evaluation run is queued, graded case by case, and compared with the last one.",
    steps: [
      ["POST /runs", "Run requested for a saved, versioned dataset."],
      ["BullMQ queue", "Job queued in Redis."],
      ["Worker", "Worker picks up the job in the background."],
      ["Provider", "Each case sent to the Mock, Gemini or OpenAI adapter."],
      ["Graders", "Responses graded with the configured graders."],
      ["Store results", "Per-case results and traces saved to PostgreSQL."],
      ["Compare", "Run compared with the previous one to catch regressions."]
    ]
  }
};

function initRunner() {
  const runner = document.getElementById("runner");
  const list = document.getElementById("runnerSteps");
  const log = document.getElementById("runnerLog");
  if (!runner || !list || !log) return;
  const tabs = Array.from(runner.querySelectorAll("[data-pipeline]"));
  const order = Object.keys(PIPELINES);
  let token = 0;
  let auto = true;
  let currentKey = "support";

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const render = (key) => {
    currentKey = key;
    list.innerHTML = "";
    PIPELINES[key].steps.forEach(([label]) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = label;
      li.appendChild(span);
      list.appendChild(li);
    });
    tabs.forEach((t) => {
      const on = t.dataset.pipeline === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    });
  };

  const run = async (key) => {
    const my = ++token;
    render(key);
    const items = Array.from(list.children);
    const steps = PIPELINES[key].steps;
    if (REDUCED) {
      items.forEach((li) => li.classList.add("is-done"));
      log.textContent = PIPELINES[key].summary;
      return;
    }
    for (let i = 0; i < steps.length; i++) {
      if (my !== token) return;
      items[i].classList.add("is-running");
      log.textContent = steps[i][1];
      graph.burst();
      await wait(1150);
      if (my !== token) return;
      items[i].classList.remove("is-running");
      items[i].classList.add("is-done");
    }
    log.textContent = PIPELINES[key].summary;
    await wait(3200);
    if (my !== token || !auto) return;
    run(order[(order.indexOf(key) + 1) % order.length]);
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => { auto = false; run(tab.dataset.pipeline); }));

  // Start once the hero has had its entrance, and only while it is on screen.
  let started = false;
  const begin = () => { if (!started) { started = true; setTimeout(() => run(currentKey), REDUCED ? 0 : 1100); } };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) begin(); }).observe(runner);
  } else {
    begin();
  }
}

/* ---------- Section highlight (nav and case-study contents) ---------- */
function initSectionHighlight() {
  const links = Array.from(document.querySelectorAll(".nav a[href^='#'], .project-toc a[href^='#']"));
  const pairs = links.map((link) => {
    const target = document.getElementById(link.getAttribute("href").slice(1));
    return target ? { link, target } : null;
  }).filter(Boolean);
  if (!pairs.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      pairs.forEach(({ link, target }) => {
        const on = target === entry.target;
        link.classList.toggle("is-active", on);
        link.setAttribute("aria-current", String(on));
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  pairs.forEach(({ target }) => io.observe(target));
}

/* ---------- Screenshot viewer on case-study pages ---------- */
function initLightbox() {
  const images = Array.from(document.querySelectorAll(".evidence-item img"));
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImage");
  const caption = document.getElementById("lightboxCaption");
  const count = document.getElementById("lightboxCount");
  const close = document.getElementById("lightboxClose");
  const prev = document.getElementById("lightboxPrev");
  const next = document.getElementById("lightboxNext");
  if (!images.length || !box || !img || !caption || !count || !close || !prev || !next) return;
  let current = 0;
  let lastFocus = null;
  const render = (i) => {
    current = (i + images.length) % images.length;
    const source = images[current];
    const cap = source.closest("figure") && source.closest("figure").querySelector("figcaption");
    img.src = source.currentSrc || source.src;
    img.alt = source.alt;
    caption.textContent = cap ? cap.textContent.trim() : source.alt;
    count.textContent = `${current + 1} of ${images.length}`;
  };
  const open = (i) => { lastFocus = document.activeElement; render(i); box.classList.add("open"); box.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; close.focus(); };
  const shut = () => { box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
  images.forEach((image, i) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `Open screenshot ${i + 1} of ${images.length}: ${image.alt}`);
    image.addEventListener("click", () => open(i));
    image.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
  });
  close.addEventListener("click", shut);
  prev.addEventListener("click", () => render(current - 1));
  next.addEventListener("click", () => render(current + 1));
  box.addEventListener("click", (e) => { if (e.target === box) shut(); });
  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") shut();
    if (e.key === "ArrowLeft") render(current - 1);
    if (e.key === "ArrowRight") render(current + 1);
  });
}

/* ---------- Looping clips: still frame for reduced motion, pause off screen ---------- */
function initLoops() {
  document.querySelectorAll("video.loop").forEach((video) => {
    if (REDUCED) { video.removeAttribute("autoplay"); video.pause(); return; }
    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause();
    }).observe(video);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoops();
  initChapterHeader();
  initMenu();
  initReveals();
  initHeroCanvas();
  initRunner();
  initSectionHighlight();
  initLightbox();
});

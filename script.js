(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  document.body.classList.add("loaded");

  /* ---------- header + progress + back-to-top ---------- */
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
      header.classList.toggle("scrolled", h.scrollTop > 10);
      backToTop.classList.toggle("visible", h.scrollTop > 500);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ---------- mobile nav ---------- */
  const burger = $("#hamburger"), navLinks = $("#navLinks");
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }));

  /* ---------- theme ---------- */
  const themeBtn = $("#themeToggle");
  const themeSwitch = $("#themeSwitch");
  const qsTheme = $("#qsTheme"), qsStyle = $("#qsStyle");
  const applyTheme = light => {
    document.body.classList.toggle("light", light);
    themeBtn.textContent = light ? "🌙" : "☀️";
    if (themeSwitch) themeSwitch.checked = !light; // switch ON = dark
    qsTheme?.classList.toggle("on", !light);
    qsTheme?.setAttribute("aria-pressed", String(!light));
    try { localStorage.setItem("theme", light ? "light" : "dark"); } catch {}
  };
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch {}
  applyTheme(saved === "light");
  themeBtn.addEventListener("click", () => applyTheme(!document.body.classList.contains("light")));
  themeSwitch?.addEventListener("change", () => applyTheme(!themeSwitch.checked));

  /* ---------- cursor glow ---------- */
  const glow = $("#cursorGlow");
  if (!finePointer || reduceMotion) glow.style.display = "none";
  else addEventListener("mousemove", e => { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }, { passive: true });

  /* ---------- spotlight cards ---------- */
  if (finePointer && !reduceMotion) {
    $$(".spot").forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach(btn => {
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.12;
        const y = (e.clientY - r.top - r.height / 2) * 0.18;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      }, { passive: true });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- marquee: duplicate for seamless loop ---------- */
  const track = $("#marqueeTrack");
  track.innerHTML += track.innerHTML;

  /* ---------- typing headline ---------- */
  const typingEl = $("#typingText"), cursorEl = $("#typingCursor");
  const segments = [
    { text: "Phones shouldn't", grad: false },
    { text: " have limits.", grad: true },
  ];
  if (reduceMotion) {
    typingEl.innerHTML = `Phones shouldn't<span class="grad"> have limits.</span>`;
    cursorEl.style.display = "none";
  } else {
    let si = 0, ci = 0, span = null;
    const type = () => {
      if (si >= segments.length) { cursorEl.style.display = "none"; return; }
      const seg = segments[si];
      if (ci === 0) { span = document.createElement("span"); if (seg.grad) span.className = "grad"; typingEl.appendChild(span); }
      span.textContent += seg.text[ci++];
      if (ci >= seg.text.length) { si++; ci = 0; }
      setTimeout(type, seg.grad ? 34 : 22);
    };
    setTimeout(type, 450);
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  // hero-top already visible; observe the rest
  $$(".reveal:not(.hero-top):not(.hero-stats)").forEach(el => io.observe(el));
  const heroStats = $(".hero-stats");
  if (heroStats) setTimeout(() => heroStats.classList.add("visible"), 200);

  /* ---------- animated counters ---------- */
  const statIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count || "0", 10);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = target + suffix; statIO.unobserve(el); return; }
      let cur = 0;
      const step = Math.max(1, Math.floor(target / 45));
      const iv = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(iv); }
        el.textContent = cur + suffix;
      }, 30);
      statIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$(".hstat-num").forEach(el => statIO.observe(el));

  /* ---------- skill bars ---------- */
  const barIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.width = e.target.dataset.width + "%"; barIO.unobserve(e.target); }
    });
  }, { threshold: 0.3 });
  $$(".bar-fill").forEach(el => barIO.observe(el));

  /* ---------- particles ---------- */
  const canvas = $("#particlesCanvas");
  if (!reduceMotion) {
    const ctx = canvas.getContext("2d");
    let parts = [];
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize();
    addEventListener("resize", resize, { passive: true });
    const init = () => {
      parts = [];
      const n = Math.min(55, Math.floor(innerWidth / 24));
      for (let i = 0; i < n; i++) parts.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5, dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
        o: Math.random() * 0.3 + 0.1
      });
    };
    init();
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const light = document.body.classList.contains("light");
      for (const p of parts) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = light ? `rgba(124,108,255,${p.o})` : `rgba(130,130,255,${p.o})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    };
    tick();
  } else canvas.style.display = "none";

  /* ---------- FAB ---------- */
  const fab = $("#fabBtn"), fabMenu = $("#fabMenu");
  fab.addEventListener("click", e => {
    e.stopPropagation();
    const open = fabMenu.classList.toggle("open");
    fab.setAttribute("aria-expanded", open);
  });
  document.addEventListener("click", e => {
    if (!fab.contains(e.target) && !fabMenu.contains(e.target)) {
      fabMenu.classList.remove("open");
      fab.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- keyboard shortcuts ---------- */
  const hints = $("#kbdHints");
  document.addEventListener("keydown", e => {
    const tag = (document.activeElement || {}).tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA";
    if (e.key === "?" && !typing) { e.preventDefault(); hints.classList.toggle("open"); }
    if (e.key === "Escape") { hints.classList.remove("open"); fabMenu.classList.remove("open"); setQs(false); }
    if ((e.key === "t" || e.key === "T") && !typing && !e.ctrlKey && !e.metaKey) themeBtn.click();
    if ((e.key === "m" || e.key === "M") && !typing && !e.ctrlKey && !e.metaKey) styleBtn.click();
    if (e.key === "Home" && !typing) { e.preventDefault(); scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); }
  });
  hints.addEventListener("click", e => { if (e.target === hints) hints.classList.remove("open"); });

  /* ---------- smooth anchor scroll (accounts for sticky header) ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length < 2) { e.preventDefault(); scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); return; }
      const t = document.querySelector(id);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }
    });
  });

  /* ---------- interface style: Bold / Material 3 ---------- */
  const styleBtn = $("#styleToggle");
  const applyStyle = m3 => {
    document.body.classList.toggle("m3", m3);
    styleBtn.textContent = m3 ? "✦" : "🤖";
    styleBtn.title = m3 ? "Switch to Bold style" : "Switch to Material 3 style";
    styleBtn.setAttribute("aria-label", styleBtn.title);
    qsStyle?.classList.toggle("on", m3);
    qsStyle?.setAttribute("aria-pressed", String(m3));
    try { localStorage.setItem("style", m3 ? "m3" : "bold"); } catch {}
  };
  let savedStyle = null;
  try { savedStyle = localStorage.getItem("style"); } catch {}
  applyStyle(savedStyle === "m3");
  styleBtn.addEventListener("click", () => applyStyle(!document.body.classList.contains("m3")));

  /* ---------- scroll-spy nav highlighting ---------- */
  const spySections = ["about", "skills", "projects", "now", "lab", "contact"]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const spyLinks = [...$$("#navLinks a"), ...$$("#m3Navbar a"), ...$$("#m3Rail a")];
  if ("IntersectionObserver" in window && spySections.length) {
    const spyIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          spyLinks.forEach(a => {
            const on = a.getAttribute("href") === "#" + e.target.id;
            a.classList.toggle("active", on);
            if (on) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    spySections.forEach(s => spyIO.observe(s));
  }

  /* ---------- M3 status bar: clock, battery, quick settings ---------- */
  const statusbar = $("#m3Statusbar"), qsPanel = $("#m3Qs");
  const clockEl = $("#m3Clock"), battFill = $("#m3BattFill"), battPct = $("#m3BattPct");
  const tickClock = () => {
    if (clockEl) clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  tickClock();
  setInterval(tickClock, 20000);
  const setBatt = level => {
    const pct = Math.round(level * 100);
    if (battFill) battFill.style.width = pct + "%";
    if (battPct) battPct.textContent = pct + "%";
  };
  if (navigator.getBattery) navigator.getBattery().then(b => {
    setBatt(b.level);
    b.addEventListener("levelchange", () => setBatt(b.level));
  }).catch(() => {});
  const setQs = open => { if (qsPanel) qsPanel.hidden = !open; };
  statusbar?.addEventListener("click", () => setQs(qsPanel?.hidden ?? false));
  statusbar?.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQs(qsPanel?.hidden ?? false); }
  });
  document.addEventListener("click", e => {
    if (qsPanel && !qsPanel.hidden && !qsPanel.contains(e.target) && !statusbar?.contains(e.target)) setQs(false);
  });
  const wireTile = (el, fn) => el?.addEventListener("click", () => {
    const on = el.getAttribute("aria-pressed") !== "true";
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", String(on));
    fn?.(on);
  });
  wireTile($("#qsWifi"));
  wireTile($("#qsBt"));
  wireTile(qsTheme, on => applyTheme(!on));
  wireTile(qsStyle, on => applyStyle(on));
  const pillBtns = $$(".pill-btn");
  const cards = $$("#projectsGrid .project-card");
  const searchInput = $("#projSearch");
  const emptyState = $("#projEmpty");
  let activeFilter = "all";
  const applyFilters = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    let shown = 0;
    cards.forEach(card => {
      const cat = card.dataset.cat || "";
      const okCat = activeFilter === "all" || cat === activeFilter;
      const text = card.textContent.toLowerCase();
      const okQ = !q || text.includes(q);
      const show = okCat && okQ;
      card.classList.toggle("hidden", !show);
      if (show) {
        shown++;
        card.classList.remove("pop");
        if (!reduceMotion) { void card.offsetWidth; card.classList.add("pop"); }
        card.classList.add("visible");
      }
    });
    if (emptyState) emptyState.hidden = shown !== 0;
  };
  pillBtns.forEach(btn => btn.addEventListener("click", () => {
    pillBtns.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    activeFilter = btn.dataset.filter;
    applyFilters();
  }));
  searchInput?.addEventListener("input", applyFilters);
  $("#projReset")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    activeFilter = "all";
    pillBtns.forEach(b => {
      const on = b.dataset.filter === "all";
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    applyFilters();
  });

  /* ---------- GitHub repos ---------- */
  const ghBox = $("#ghRepos");
  const langColors = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", C: "#8a8a9e", "C++": "#f34b7d", HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Kotlin: "#A97BFF" };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  fetch("https://api.github.com/users/samakshkambxj/repos?sort=updated&per_page=6")
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(repos => {
      if (!Array.isArray(repos)) throw new Error("bad payload");
      ghBox.innerHTML = repos.map(r => `
        <a href="${esc(r.html_url)}" target="_blank" rel="noopener" class="gh-repo spot">
          <div class="gh-repo-name">${esc(r.name)}</div>
          <div class="gh-repo-desc">${esc(r.description || "No description yet.")}</div>
          <div class="gh-repo-meta">
            ${r.language ? `<span><span class="lang-dot" style="background:${langColors[r.language] || "#888"}"></span> ${esc(r.language)}</span>` : ""}
            <span>★ ${r.stargazers_count}</span>
            <span>⑂ ${r.forks_count}</span>
          </div>
        </a>`).join("");
    })
    .catch(() => {
      ghBox.innerHTML = `<div class="gh-repo"><div class="gh-repo-name">github.com/samakshkambxj</div><div class="gh-repo-desc">Live repo feed is rate-limited right now — the code is still there.</div><div class="gh-repo-meta"><a href="https://github.com/samakshkambxj?tab=repositories" target="_blank" rel="noopener" style="color:var(--cyan)">Browse all repos →</a></div></div>`;
    });

  /* ---------- batman easter egg ---------- */
  const seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  let idx = 0;
  const toast = $("#batmanToast");
  let toastTimer;
  document.addEventListener("keydown", e => {
    if (e.keyCode === seq[idx]) {
      idx++;
      if (idx === seq.length) {
        document.body.classList.toggle("batman-mode");
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
        idx = 0;
      }
    } else idx = 0;
  });
})();

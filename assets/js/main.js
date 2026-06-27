/* =====================================================================
   Stalowa 76 — interactions
   ===================================================================== */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader ---------- */
  window.addEventListener("load", () => {
    const pre = $("#preloader");
    if (!pre) return;
    setTimeout(() => pre.classList.add("is-done"), reduceMotion ? 0 : 1100);
  });

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: scroll state + hide on scroll-down ---------- */
  const header = $("#header");
  const progress = $("#scrollProgress");
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      if (y > 600 && y > lastY + 4) header.classList.add("is-hidden");
      else if (y < lastY - 4) header.classList.remove("is-hidden");
    }
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const burger = $("#burger");
  const nav = $("#nav");
  function closeNav() {
    if (!nav) return;
    nav.classList.remove("is-open");
    burger && burger.classList.remove("is-open");
    burger && burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", nav).forEach((a) => a.addEventListener("click", closeNav));
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    // threshold 0 so elements taller than the viewport (e.g. the floor-plan
    // grid) still reveal — a fractional threshold can never be met by an
    // element many times taller than the screen.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$("[data-count]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1400; const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Hero parallax ---------- */
  const parallaxEls = $$("[data-parallax]");
  if (!reduceMotion && parallaxEls.length) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        parallaxEls.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax);
          el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Active nav link (scroll spy) ---------- */
  const sections = $$("main section[id]");
  const navLinks = $$(".nav a");
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        navLinks.forEach((l) => l.classList.toggle("is-current", l.getAttribute("href") === "#" + id));
      });
    }, { threshold: 0.4, rootMargin: "-30% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Language toggle ---------- */
  const dict = (window.STALOWA_I18N || {});
  const plSnapshot = {};
  let captured = false;
  function capturePL() {
    if (captured) return;
    $$("[data-i18n]").forEach((el) => { plSnapshot[el.dataset.i18n] = el.innerHTML; });
    captured = true;
  }
  function setLang(lang) {
    capturePL();
    const table = lang === "en" ? dict.en : null;
    $$("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (lang === "en" && table && table[key] != null) el.innerHTML = table[key];
      else if (lang === "pl" && plSnapshot[key] != null) el.innerHTML = plSnapshot[key];
    });
    document.documentElement.lang = lang;
    $$(".lang__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
    try { localStorage.setItem("stalowa-lang", lang); } catch (_) {}
    document.dispatchEvent(new CustomEvent("stalowa:lang", { detail: { lang } }));
  }
  $$(".lang__btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  try {
    const saved = localStorage.getItem("stalowa-lang");
    if (saved === "en") setLang("en");
  } catch (_) {}

  /* ---------- Smooth anchor (respects reduced motion) ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id === "#top") return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------- Contact form (demo handler, no backend) ---------- */
  const form = $("#leadForm");
  const status = $("#formStatus");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const lang = document.documentElement.lang;
      if (!form.checkValidity()) {
        status.textContent = lang === "en"
          ? "Please complete the required fields."
          : "Uzupełnij wymagane pola.";
        status.className = "form__status is-err";
        form.reportValidity();
        return;
      }
      const btn = $("button[type=submit]", form);
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = lang === "en" ? "Sending…" : "Wysyłanie…";
      // Demo: simulate async submit. Replace with real endpoint / CRM integration.
      setTimeout(() => {
        form.reset();
        btn.disabled = false;
        btn.textContent = original;
        status.textContent = lang === "en"
          ? "Thank you — we'll be in touch within one business day."
          : "Dziękujemy — odezwiemy się w ciągu jednego dnia roboczego.";
        status.className = "form__status is-ok";
      }, 900);
    });
  }
})();

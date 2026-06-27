/* =====================================================================
   Stalowa 76 — interactive floor-plan browser
   Generates a deterministic 51-unit dataset (5 floors), renders a
   building/floor selector, a filterable + sortable unit grid with SVG
   mini floor plans, and a detail modal with a large architectural plan,
   orientation compass, specs and a contact CTA that prefills the form.
   No backend / no dependencies. Replace generated data with the real
   sales table when available (same shape: see `units`).
   ===================================================================== */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = $("#fp");
  if (!root) return;

  const RATE = 14900;        // base PLN / m²
  const FLOORS = 5;
  const NBSP = " ";

  /* ---------- i18n strings (UI labels + data labels) ---------- */
  const T = {
    pl: {
      pok: "pok.", available: "Dostępne", reserved: "Rezerwacja", sold: "Sprzedane",
      area: "Powierzchnia", rooms: "Pokoje", floor: "Piętro", orient: "Ekspozycja",
      outdoor: "Strefa zewnętrzna", price: "Cena", cta: "Umów prezentację tego apartamentu",
      unavailable: "Apartament niedostępny", seeAvail: "Zobacz dostępne", none: "—",
      ground: "parter", chosen: (id) => `Wybrany apartament: ${id} — uzupełnij dane poniżej.`,
      count: (n) => `${n} ${plural(n, "apartament", "apartamenty", "apartamentów")} w wyborze`,
      rk: { salon: "Salon z aneksem", kuchnia: "Kuchnia", lazienka: "Łazienka", hol: "Hol", syp: "Sypialnia" },
      out: { balkon: "Balkon", loggia: "Loggia", taras: "Taras", "—": "—" },
      dir: { N: "Północ", NE: "Płn.-wsch.", E: "Wschód", SE: "Płd.-wsch.", S: "Południe", SW: "Płd.-zach.", W: "Zachód", NW: "Płn.-zach." }
    },
    en: {
      pok: "rooms", available: "Available", reserved: "Reserved", sold: "Sold",
      area: "Area", rooms: "Rooms", floor: "Floor", orient: "Aspect",
      outdoor: "Outdoor space", price: "Price", cta: "Book a viewing of this apartment",
      unavailable: "Apartment unavailable", seeAvail: "See available", none: "—",
      ground: "ground", chosen: (id) => `Selected apartment: ${id} — complete your details below.`,
      count: (n) => `${n} apartment${n === 1 ? "" : "s"} in selection`,
      rk: { salon: "Living + kitchen", kuchnia: "Kitchen", lazienka: "Bathroom", hol: "Hall", syp: "Bedroom" },
      out: { balkon: "Balcony", loggia: "Loggia", taras: "Terrace", "—": "—" },
      dir: { N: "North", NE: "NE", E: "East", SE: "SE", S: "South", SW: "SW", W: "West", NW: "NW" }
    }
  };
  const getLang = () => (document.documentElement.lang === "en" ? "en" : "pl");
  function plural(n, one, few, many) {
    if (n === 1) return one;
    const t = n % 10, h = n % 100;
    if (t >= 2 && t <= 4 && (h < 10 || h >= 20)) return few;
    return many;
  }
  const fmtPrice = (v) => v.toLocaleString("pl-PL").replace(/\s/g, NBSP) + NBSP + "zł";

  /* ---------- Deterministic data generation ---------- */
  function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  const rng = lcg(7642);
  const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const AREA = { 1: [28, 35], 2: [38, 52], 3: [55, 68], 4: [70, 83] };

  function pickRooms(r) { return r < 0.30 ? 1 : r < 0.65 ? 2 : r < 0.90 ? 3 : 4; }

  const units = [];
  const floorCounters = {};
  for (let i = 0; i < 51; i++) {
    const rooms = pickRooms(rng());
    const [lo, hi] = AREA[rooms];
    const area = Math.round(lo + rng() * (hi - lo));
    const floor = (i % FLOORS) + 1;
    floorCounters[floor] = (floorCounters[floor] || 0) + 1;
    const price = Math.round((area * RATE * (1 + (floor - 1) * 0.015)) / 1000) * 1000;
    const orient = DIRS[Math.floor(rng() * DIRS.length)];
    let outdoor;
    if (rooms === 1) outdoor = rng() < 0.5 ? "balkon" : "—";
    else if (floor === FLOORS && rng() < 0.35) outdoor = "taras";
    else outdoor = rng() < 0.6 ? "balkon" : "loggia";
    units.push({
      id: "M" + floor + String(floorCounters[floor]).padStart(2, "0"),
      floor, rooms, area, price, orient, outdoor, status: "available"
    });
  }
  // exactly 13 available, 19 reserved, 19 sold — spread deterministically
  const statuses = [].concat(
    Array(13).fill("available"), Array(19).fill("reserved"), Array(19).fill("sold")
  );
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }
  units.forEach((u, i) => (u.status = statuses[i]));

  /* ---------- Floor-plan SVG ---------- */
  const LAYOUTS = {
    1: [{ k: "lazienka", x: 14, y: 14, w: 96, h: 126 }, { k: "hol", x: 14, y: 140, w: 96, h: 126 }, { k: "salon", x: 110, y: 14, w: 204, h: 252 }],
    2: [{ k: "hol", x: 14, y: 14, w: 96, h: 84 }, { k: "lazienka", x: 14, y: 98, w: 96, h: 84 }, { k: "kuchnia", x: 14, y: 182, w: 96, h: 84 }, { k: "salon", x: 110, y: 14, w: 204, h: 146 }, { k: "syp", x: 110, y: 160, w: 204, h: 106, n: 1 }],
    3: [{ k: "salon", x: 14, y: 14, w: 200, h: 136 }, { k: "hol", x: 214, y: 14, w: 100, h: 136 }, { k: "lazienka", x: 14, y: 150, w: 90, h: 116 }, { k: "syp", x: 104, y: 150, w: 110, h: 116, n: 1 }, { k: "syp", x: 214, y: 150, w: 100, h: 116, n: 2 }],
    4: [{ k: "salon", x: 14, y: 14, w: 180, h: 126 }, { k: "hol", x: 194, y: 14, w: 120, h: 60 }, { k: "lazienka", x: 194, y: 74, w: 120, h: 66 }, { k: "syp", x: 14, y: 140, w: 100, h: 126, n: 1 }, { k: "syp", x: 114, y: 140, w: 100, h: 126, n: 2 }, { k: "syp", x: 214, y: 140, w: 100, h: 126, n: 3 }]
  };

  function furniture(r) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    if (r.k === "salon") {
      return `<rect class="fp-furn" x="${r.x + 12}" y="${r.y + r.h - 38}" width="${Math.min(70, r.w - 24)}" height="22" rx="5"/>` +
             `<rect class="fp-furn" x="${r.x + r.w - 50}" y="${r.y + 14}" width="36" height="34" rx="3"/>`;
    }
    if (r.k === "syp") {
      const bw = Math.min(56, r.w - 24), bh = Math.min(40, r.h - 24);
      return `<rect class="fp-furn" x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="3"/>` +
             `<line class="fp-furn-l" x1="${cx - bw / 2}" y1="${cy - bh / 2 + 12}" x2="${cx + bw / 2}" y2="${cy - bh / 2 + 12}"/>`;
    }
    if (r.k === "kuchnia") return `<rect class="fp-furn" x="${r.x + 8}" y="${r.y + 8}" width="${r.w - 16}" height="14" rx="2"/>`;
    if (r.k === "lazienka") return `<rect class="fp-furn" x="${r.x + 8}" y="${r.y + r.h - 26}" width="22" height="18" rx="3"/>`;
    return "";
  }

  function buildPlan(unit, mini) {
    const lang = getLang();
    const L = LAYOUTS[unit.rooms];
    const totalArea = L.reduce((s, r) => s + r.w * r.h, 0);
    let rooms = "", labels = "", furn = "";
    L.forEach((r) => {
      rooms += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" class="fp-room"/>`;
      if (!mini) {
        const m2 = (unit.area * (r.w * r.h) / totalArea);
        const name = T[lang].rk[r.k] + (r.n ? " " + r.n : "");
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        labels += `<text x="${cx}" y="${cy - 3}" class="fp-rname">${name}</text>` +
                  `<text x="${cx}" y="${cy + 12}" class="fp-rarea">${m2.toFixed(1)}${NBSP}m²</text>`;
        furn += furniture(r);
      }
    });
    let balcony = "";
    if (unit.outdoor !== "—") {
      const by = unit.rooms === 1 ? 70 : 50, bh = unit.rooms === 1 ? 150 : 120;
      balcony = `<rect x="314" y="${by}" width="30" height="${bh}" class="fp-balcony"/>`;
      if (!mini) balcony += `<text x="329" y="${by + bh / 2}" class="fp-blabel" transform="rotate(90 329 ${by + bh / 2})">${T[lang].out[unit.outdoor]}</text>`;
    }
    return `<svg viewBox="0 0 360 280" class="fp-plan${mini ? " fp-plan--mini" : ""}" role="img" aria-label="${unit.id}" preserveAspectRatio="xMidYMid meet">` +
      `<rect x="14" y="14" width="300" height="252" class="fp-floorfill"/>` +
      furn + rooms + balcony +
      `<rect x="14" y="14" width="300" height="252" class="fp-wall"/>` +
      labels + `</svg>`;
  }

  function compass(dir) {
    const a = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[dir] * Math.PI / 180;
    const cx = 26, cy = 26, r = 17;
    const ax = cx + r * Math.sin(a), ay = cy - r * Math.cos(a);
    return `<svg viewBox="0 0 52 52" class="fp-compass" aria-hidden="true">` +
      `<circle cx="26" cy="26" r="22" class="fp-comp-ring"/>` +
      `<text x="26" y="9" class="fp-comp-n">N</text>` +
      `<line x1="26" y1="26" x2="${ax}" y2="${ay}" class="fp-comp-arrow"/>` +
      `<circle cx="26" cy="26" r="2.2" class="fp-comp-dot"/></svg>`;
  }

  const floorLabel = (f) => (getLang() === "en" ? (f === 0 ? "ground" : f) : (f === 0 ? "parter" : f));

  /* ---------- State ---------- */
  const state = { rooms: "all", floor: "all", availOnly: false, sort: "floor" };

  /* ---------- Building / floor selector ---------- */
  const elBuilding = $("#fpBuilding");
  function renderBuilding() {
    const lang = getLang();
    let html = "";
    for (let f = FLOORS; f >= 1; f--) {
      const all = units.filter((u) => u.floor === f);
      const av = all.filter((u) => u.status === "available").length;
      const active = String(state.floor) === String(f);
      const w = Math.round((av / Math.max(1, all.length)) * 100);
      html += `<button type="button" class="fp-floor${active ? " is-active" : ""}" data-floor="${f}" aria-pressed="${active}">` +
        `<span class="fp-floor__no">${f}</span>` +
        `<span class="fp-floor__bar"><span style="width:${w}%"></span></span>` +
        `<span class="fp-floor__cnt">${av} ${T[lang].available.toLowerCase()}</span>` +
        `</button>`;
    }
    elBuilding.innerHTML = html;
  }

  /* ---------- Grid ---------- */
  const elGrid = $("#fpGrid");
  const elCount = $("#fpCount");
  const elEmpty = $("#fpEmpty");

  function filtered() {
    let list = units.filter((u) =>
      (state.rooms === "all" || u.rooms === +state.rooms) &&
      (state.floor === "all" || u.floor === +state.floor) &&
      (!state.availOnly || u.status === "available"));
    const by = state.sort;
    list.sort((a, b) =>
      by === "area-asc" ? a.area - b.area :
      by === "area-desc" ? b.area - a.area :
      by === "price-asc" ? a.price - b.price :
      by === "price-desc" ? b.price - a.price :
      (a.floor - b.floor) || (a.area - b.area));
    return list;
  }

  function statusPill(s) {
    const lang = getLang();
    return `<em class="fp-pill fp-pill--${s}">${T[lang][s]}</em>`;
  }

  function renderGrid() {
    const lang = getLang();
    const list = filtered();
    elCount.textContent = T[lang].count(list.length);
    elEmpty.hidden = list.length > 0;
    elGrid.innerHTML = list.map((u) =>
      `<button type="button" class="fp-card fp-card--${u.status}" data-id="${u.id}" aria-label="${u.id}, ${u.area} m², ${u.rooms} ${T[lang].pok}">` +
        `<span class="fp-card__plan">${buildPlan(u, true)}</span>` +
        `<span class="fp-card__info">` +
          `<span class="fp-card__top"><strong>${u.id}</strong>${statusPill(u.status)}</span>` +
          `<span class="fp-card__meta">${u.area}${NBSP}m² · ${u.rooms} ${T[lang].pok} · ${T[lang].floor} ${floorLabel(u.floor)}</span>` +
          `<span class="fp-card__price">${u.status === "sold" ? T[lang].none : fmtPrice(u.price)}</span>` +
        `</span></button>`).join("");
  }

  /* ---------- Modal ---------- */
  const modal = $("#fpModal");
  const modalBody = $("#fpModalBody");
  let lastFocused = null;

  function openModal(id) {
    const u = units.find((x) => x.id === id);
    if (!u) return;
    const lang = getLang(), t = T[lang];
    const specs = [
      [t.area, `${u.area}${NBSP}m²`], [t.rooms, u.rooms],
      [t.floor, floorLabel(u.floor)], [t.orient, `${compass(u.orient)}<span>${t.dir[u.orient]}</span>`, true],
      [t.outdoor, t.out[u.outdoor]], [t.price, u.status === "sold" ? t.none : fmtPrice(u.price)]
    ];
    modalBody.innerHTML =
      `<div class="fp-detail">` +
        `<div class="fp-detail__plan">${buildPlan(u, false)}</div>` +
        `<div class="fp-detail__side">` +
          `<div class="fp-detail__head"><h3 id="fpModalTitle">${u.id}</h3>${statusPill(u.status)}</div>` +
          `<dl class="fp-specs">` +
            specs.map(([k, v, rich]) => `<div class="fp-spec${rich ? " fp-spec--rich" : ""}"><dt>${k}</dt><dd>${v}</dd></div>`).join("") +
          `</dl>` +
          (u.status === "available"
            ? `<button type="button" class="btn btn--solid btn--block fp-detail__cta" data-fp-reserve="${u.id}" data-rooms="${u.rooms}">${t.cta}</button>`
            : `<div class="fp-detail__cta-off"><button type="button" class="btn btn--solid btn--block" disabled>${t.unavailable}</button>` +
              `<button type="button" class="fp-detail__see" data-fp-see>${t.seeAvail}</button></div>`) +
        `</div>` +
      `</div>`;
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $(".fp-modal__close", modal).focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ---------- Contact prefill ---------- */
  function reserve(id, rooms) {
    const map = { 1: "kawalerka", 2: "2pok", 3: "3pok", 4: "4pok" };
    const sel = $("#interest"); if (sel) sel.value = map[rooms] || "inwestycja";
    let hidden = $("#unitId");
    const form = $("#leadForm");
    if (form && !hidden) { hidden = document.createElement("input"); hidden.type = "hidden"; hidden.id = "unitId"; hidden.name = "unit"; form.appendChild(hidden); }
    if (hidden) hidden.value = id;
    const status = $("#formStatus");
    if (status) { status.textContent = T[getLang()].chosen(id); status.className = "form__status is-ok"; }
    closeModal();
    const target = $("#kontakt");
    if (target) target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(() => { const n = $("#name"); if (n) n.focus(); }, 600);
  }

  /* ---------- Events ---------- */
  $("#fpRooms").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.rooms = b.dataset.rooms;
    $$(".chip", $("#fpRooms")).forEach((c) => c.classList.toggle("is-active", c === b));
    renderGrid();
  });
  $("#fpAvail").addEventListener("change", (e) => { state.availOnly = e.target.checked; renderGrid(); });
  $("#fpSort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
  elBuilding.addEventListener("click", (e) => {
    const b = e.target.closest(".fp-floor"); if (!b) return;
    state.floor = String(state.floor) === b.dataset.floor ? "all" : b.dataset.floor;
    renderBuilding(); renderGrid();
  });
  elGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".fp-card"); if (card) openModal(card.dataset.id);
  });
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-fp-close]")) return closeModal();
    const res = e.target.closest("[data-fp-reserve]"); if (res) return reserve(res.dataset.fpReserve, res.dataset.rooms);
    if (e.target.closest("[data-fp-see]")) { state.availOnly = true; $("#fpAvail").checked = true; renderGrid(); closeModal(); $("#fp").scrollIntoView({ behavior: "smooth" }); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });

  // re-render dynamic labels on language switch
  document.addEventListener("stalowa:lang", () => {
    renderBuilding(); renderGrid();
    if (modal.classList.contains("is-open")) {
      const id = $("#fpModalTitle") && $("#fpModalTitle").textContent;
      if (id) openModal(id);
    }
  });

  /* ---------- Init ---------- */
  renderBuilding();
  renderGrid();
})();

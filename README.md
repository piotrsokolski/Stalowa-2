# Stalowa 76 — Premium Homepage

A new, premium and modern homepage for the **Stalowa 76** residential
investment in Wrocław (Gajowice / Fabryczna), developed by *Wrocław Investment
Steel Apartments Sp. z o.o.* — a complete redesign of the current `stalowa76.pl`.

> **Design language:** *Industrial elegance* — champagne‑bronze accents on a
> graphite‑and‑porcelain palette, high‑contrast serif display type (Fraunces)
> paired with a clean sans (Inter), generous whitespace and restrained,
> cinematic motion.

## Highlights

- **Single‑page, zero‑build** static site — opens instantly, deploys anywhere
  (GitHub Pages, Netlify, Vercel, any static host or CDN).
- **Bilingual** — working **PL / EN** toggle (Polish is the default), driven by
  a small `data-i18n` dictionary; the choice is remembered in `localStorage`.
- **Premium interactions** — cinematic hero with layered parallax, scroll‑reveal
  sections, animated count‑up stats, a sticky architecture showcase, an
  illustrative location map, scroll‑spy navigation, scroll progress rail and a
  refined contact form with floating labels.
- **Performance & a11y** — system‑font fallback, lazy reveal via
  `IntersectionObserver`, full `prefers-reduced-motion` support, keyboard‑
  navigable, semantic landmarks and labelled controls.
- **Fully responsive** — tuned breakpoints at 1024 / 760 / 480 px with a slide‑in
  mobile menu.

## Project facts baked into the page

| | |
|---|---|
| Apartments | **51** (13 currently available) |
| Sizes | **28 – 83 m²** (studios → family) |
| Storeys | **5** |
| Parking | **2‑level** underground garage |
| Location | ul. Stalowa 76, Gajowice, Fabryczna — Wrocław |
| Transport | public transport **100 m** away · **10 min** by tram to the Market Square |
| Schedule | construction **winter 2025 → September 2027** |
| Price | **from 14 900 zł/m²** (from ~523 000 zł) |
| Developer | Wrocław Investment Steel Apartments Sp. z o.o. |

## Structure

```
index.html              # markup + content (PL default, data-i18n keys)
assets/
  css/styles.css        # full design system & responsive layout
  js/i18n.js            # PL→EN translation dictionary
  js/main.js            # interactions (reveal, parallax, counters, form, lang)
  img/favicon.svg       # brand mark
  img/og-image.svg      # social share card
```

## Run locally

It is a static site — just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Before going live — replace the placeholders

The layout is intentionally render‑agnostic so it looks polished out of the box,
but for production you should swap in real assets:

1. **Photography / renders.** The hero, architecture showcase and apartment
   cards currently use tasteful CSS/SVG placeholders. Drop real visuals into
   `assets/img/` and point the relevant backgrounds/`<img>` at them.
2. **Contact form endpoint.** `assets/js/main.js` ships a front‑end‑only demo
   handler — connect it to your CRM / email endpoint (the section is commented).
3. **Verify the details.** Confirm the sales‑office **phone, e‑mail and exact
   prices** — the figures shown are based on public listings and are marked as
   indicative; replace with the official numbers before launch.
4. **Analytics & map.** Add your analytics snippet and, if desired, swap the
   illustrative map for an embedded Google/Mapbox map.

---

*Visualisations are illustrative and do not constitute an offer within the
meaning of the Polish Civil Code.*

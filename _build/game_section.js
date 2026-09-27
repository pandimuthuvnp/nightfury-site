/* ---- Chapter 06: Defend the Nightfury — section wrapper (merged) ---- */
const GameSection = () => {
  const R = react__WEBPACK_IMPORTED_MODULE_0__;
  const h = R.createElement;
  const { Reveal } = __webpack_require__("./src/components/nightfury/Reveal.jsx");
  const ref = R.useRef(null);
  R.useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return nfGameMount(ref.current, reduced);
  }, []);
  return h("section", { id: "play", "data-testid": "game-section",
      style: { position: "relative", padding: "96px 0 112px", borderTop: "1px solid rgba(255,255,255,0.06)" } },
    h("div", { className: "relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-16" },
      h(Reveal, null,
        h("p", { className: "font-mono-nf text-[11px] sm:text-xs tracking-[0.35em] uppercase text-[#00FF87] font-semibold mb-8" },
          "Chapter 06 — Your turn")),
      h(Reveal, { delay: 0.1 },
        h("h2", { className: "font-display font-black uppercase tracking-tight",
            style: { fontSize: "clamp(1.9rem, 6vw, 5rem)", lineHeight: 0.95, color: "#F8FAFC" } },
          h("span", { style: { display: "block" } }, "Defend"),
          h("span", { className: "text-outline-green", style: { display: "block" } }, "the Nightfury"))),
      h(Reveal, { delay: 0.2 },
        h("p", { className: "text-base sm:text-lg leading-relaxed text-[#94A3B8]", style: { maxWidth: 660, marginTop: 28 } },
          "Fly the Night Fury. Blast every dragon and rival rider before they reach the bike. ",
          "Fill the Fury meter — then scream its name.")),
      h(Reveal, { delay: 0.25 },
        h("div", { ref, "data-testid": "game-stage",
          style: { marginTop: 48, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
                   background: "rgba(14,17,23,0.6)", padding: "clamp(12px, 2.5vw, 28px)" } }))));
};

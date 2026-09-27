/* ---- Chapter 04: The Master (merged) ---- */
const MasterSection = () => {
  const h = react__WEBPACK_IMPORTED_MODULE_0__.createElement;
  const { Reveal } = __webpack_require__("./src/components/nightfury/Reveal.jsx");
  const mono = { fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" };
  const tile = {
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
    background: "rgba(14,17,23,0.6)", padding: "28px 26px"
  };
  const stats = [
    ["8+", "Years in the saddle"],
    ["32.4°+", "Inclines climbed", true],
    ["1", "Gear. Mastered."],
    ["Rain & Sun", "Hosur, every weather"]
  ];
  return h("section", { id: "master", "data-testid": "master-section",
      style: { position: "relative", padding: "96px 0 112px", borderTop: "1px solid rgba(255,255,255,0.06)" } },
    h("div", { "aria-hidden": "true", style: { position: "absolute", inset: 0, pointerEvents: "none",
      background: "radial-gradient(40% 50% at 85% 20%, rgba(0,255,135,0.08), transparent 70%), radial-gradient(35% 45% at 10% 90%, rgba(255,176,32,0.07), transparent 70%)" } }),
    h("div", { className: "relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-16" },
      h(Reveal, null,
        h("p", { className: "font-mono-nf text-[11px] sm:text-xs tracking-[0.35em] uppercase text-[#00FF87] font-semibold mb-8" },
          "Chapter 04 — The Master")),
      h(Reveal, { delay: 0.1 },
        h("h2", { className: "font-display font-black uppercase tracking-tight",
            style: { fontSize: "clamp(1.9rem, 7vw, 5.5rem)", lineHeight: 0.95, color: "#F8FAFC", overflowWrap: "anywhere" } },
          h("span", { style: { display: "block" } }, "By Master"),
          h("span", { className: "text-outline-green", style: { display: "block" } }, "Aadhithyavarman"))),
      h(Reveal, { delay: 0.2 },
        h("p", { className: "text-base sm:text-lg leading-relaxed text-[#94A3B8]", style: { maxWidth: 660, marginTop: 32 } },
          "Eight-plus years of climbing 32.4°+ inclines on a single gear. A rider from ",
          h("span", { style: { color: "#F8FAFC", fontWeight: 600 } }, "Advaith International Academy"),
          " who mastered the single-speed the hard way — through raining Hosur and scorching Hosur alike.")),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 56 } },
        stats.map(([big, label, accent], i) =>
          h(Reveal, { key: big, delay: 0.1 + i * 0.08 },
            h("div", { style: { ...tile, height: "100%" }, "data-testid": "master-stat" },
              h("div", { className: "font-display font-black", style: { fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1, color: accent ? "#00FF87" : "#F8FAFC" } }, big),
              h("div", { style: { ...mono, fontSize: 10, letterSpacing: "0.25em", color: "#64748B", marginTop: 14 } }, label))))),
      h(Reveal, { delay: 0.3, y: 24 },
          h("div", { style: { ...tile, marginTop: 16, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 } },
            h("span", { style: { ...mono, fontSize: 10, letterSpacing: "0.3em", color: "#64748B" } }, "School"),
            h("span", { className: "font-display font-bold", style: { fontSize: "clamp(1.1rem, 2.4vw, 1.6rem)", color: "#F8FAFC" } }, "Advaith International Academy"))),
      h(Reveal, { delay: 0.35, y: 24 },
          h("div", { "data-testid": "master-exams", style: { ...tile, marginTop: 16, borderColor: "rgba(0,255,135,0.25)",
              background: "linear-gradient(135deg, rgba(0,255,135,0.07), rgba(14,17,23,0.6) 60%)" } },
            h("span", { style: { ...mono, display: "block", fontSize: 10, letterSpacing: "0.3em", color: "#00FF87" } }, "Exam season"),
            h("p", { className: "font-display font-bold", style: { margin: "12px 0 0", fontSize: "clamp(1.15rem, 2.6vw, 1.8rem)", lineHeight: 1.3, color: "#F8FAFC" } },
              "Even in exams — I read for them. I study hard. ",
              h("span", { style: { color: "#00FF87" } }, "But I never forget the Night Fury.")))),
      h(Reveal, { delay: 0.2 },
        h("div", { "data-testid": "master-motto", style: { marginTop: 72, padding: "clamp(28px, 5vw, 56px) 0",
            borderTop: "1px solid rgba(0,255,135,0.2)", borderBottom: "1px solid rgba(0,255,135,0.2)", textAlign: "center" } },
          h("span", { style: { ...mono, display: "block", fontSize: 11, letterSpacing: "0.32em", color: "#94A3B8" } },
            "The Night Fury and the master are driven by one line"),
          h("p", { className: "font-display font-black uppercase", style: { margin: "22px 0 0", fontSize: "clamp(2rem, 7vw, 5.5rem)", lineHeight: 0.98, letterSpacing: "0.01em" } },
            h("span", { style: { display: "block", color: "#F8FAFC", textShadow: "0 0 28px rgba(0,255,135,0.25)" } }, "Start anywhere."),
            h("span", { className: "text-outline-green", style: { display: "block" } }, "Stop nowhere.")),
          h("span", { style: { ...mono, display: "block", marginTop: 22, fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 700, letterSpacing: "0.28em", color: "#00FF87" } },
            "— Master Aadhithyavarman"))),
      h(Reveal, { delay: 0.2 },
        h("blockquote", { className: "font-display font-bold", style: { marginTop: 64, maxWidth: 900, fontSize: "clamp(1.4rem, 3.2vw, 2.5rem)", lineHeight: 1.25, color: "#F8FAFC" } },
          "“Nothing stops a master who rides with the furious Night Fury.”",
          h("span", { style: { ...mono, display: "block", marginTop: 18, fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 700, letterSpacing: "0.28em", color: "#00FF87" } },
            "— Master Aadhithyavarman")))));
};

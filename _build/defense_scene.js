/* ---- Chapter 05: The Defense — scripted battle scene (merged) ----
   Everything on screen is a pure function of the timeline t (seconds), so
   replay is just "reset the clock" and reduced-motion is one still frame. */
function nfDefenseMount(root, reduced) {
  const NS = "http://www.w3.org/2000/svg";
  const END = 16;

  // ---------------------------------------------------------------- markup
  root.innerHTML = `
  <div style="position:relative">
    <svg data-k="svg" viewBox="0 0 900 520" role="img"
         aria-label="The master defends the Nightfury cycle: rival riders and five breeds of dragon attack, the master screams Night Fury, the cycle becomes a Night Fury and one roar blows them all away"
         style="display:block;width:100%;height:auto;border-radius:12px;overflow:hidden;background:#06070a">
      <defs>
        <filter id="nfd-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="nfd-big" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="nfd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#05060a"/><stop offset="1" stop-color="#101824"/>
        </linearGradient>
        <radialGradient id="nfd-moon"><stop offset="0" stop-color="#e8ecef" stop-opacity=".9"/><stop offset=".5" stop-color="#e8ecef" stop-opacity=".1"/><stop offset="1" stop-color="#e8ecef" stop-opacity="0"/></radialGradient>
        <radialGradient id="nfd-flash" cx="50%" cy="72%" r="70%">
          <stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#1ef58f" stop-opacity=".85"/><stop offset="1" stop-color="#1ef58f" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="nfd-plasma"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#c9a6ff"/><stop offset="1" stop-color="#a45cff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="900" height="520" fill="url(#nfd-sky)"/>
      <g data-k="stars"></g>
      <circle cx="800" cy="70" r="60" fill="url(#nfd-moon)"/><circle cx="800" cy="70" r="20" fill="#dfe5ea" opacity=".9"/>
      <g data-k="city" opacity=".5"></g>
      <g data-k="shake">
        <rect x="-40" y="470" width="980" height="90" fill="#0b0d10"/>
        <line x1="-40" y1="470" x2="940" y2="470" stroke="#2a3138" stroke-width="2"/>
        <g data-k="rivals"></g>
        <g data-k="dragons"></g>
        <g data-k="fury" opacity="0"></g>
        <g data-k="bike" transform="translate(50 -28)"></g>
        <g data-k="rider"></g>
        <g data-k="shots"></g>
        <g data-k="rings" fill="none"></g>
        <text data-k="scream" x="450" y="215" text-anchor="middle" opacity="0"
              style="font-family:Cinzel,serif;font-weight:900;letter-spacing:.04em"
              fill="#ffffff" stroke="#1ef58f" stroke-width="1.5" filter="url(#nfd-glow)"></text>
        <g data-k="bubble" opacity="0">
          <rect x="628" y="360" width="176" height="30" rx="15" fill="#161b22" stroke="#ff4d5e" stroke-width="1.2"/>
          <text x="716" y="380" text-anchor="middle" fill="#ffb3ba" style="font:700 11px 'JetBrains Mono',monospace;letter-spacing:.08em">HAND OVER THE BIKE!</text>
        </g>
      </g>
      <rect data-k="flash" width="900" height="520" fill="url(#nfd-flash)" opacity="0" pointer-events="none"/>
      <g data-k="motto" opacity="0" text-anchor="middle" pointer-events="none">
        <rect x="150" y="96" width="600" height="190" rx="18" fill="#06070a" opacity=".55"/>
        <text x="450" y="130" fill="#94A3B8" style="font:700 11px 'JetBrains Mono',monospace;letter-spacing:.3em">THE MASTER SAID</text>
        <text x="450" y="192" fill="#F8FAFC" filter="url(#nfd-glow)" style="font-family:Cinzel,serif;font-weight:900;font-size:50px;letter-spacing:.02em">START ANYWHERE.</text>
        <text x="450" y="248" fill="none" stroke="#1ef58f" stroke-width="1.6" filter="url(#nfd-glow)" style="font-family:Cinzel,serif;font-weight:900;font-size:50px;letter-spacing:.02em">STOP NOWHERE.</text>
        <text x="450" y="276" fill="#1ef58f" style="font:700 11px 'JetBrains Mono',monospace;letter-spacing:.28em">— MASTER AADHITHYAVARMAN</text>
      </g>
    </svg>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:18px">
      <p data-k="caption" aria-live="polite"
         style="margin:0;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#94A3B8;min-height:1.4em"></p>
      <button data-k="replay" type="button"
         style="border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#F8FAFC;padding:10px 20px;font:700 11px 'JetBrains Mono',monospace;letter-spacing:.2em;text-transform:uppercase;cursor:pointer">
        ▶ Defend</button>
    </div>
  </div>`;

  const q = k => root.querySelector(`[data-k="${k}"]`);
  const el = (tag, attrs, parent, html) => {
    const n = document.createElementNS(NS, tag);
    for (const a in attrs) n.setAttribute(a, attrs[a]);
    if (html) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  };
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const easeOut = p => 1 - Math.pow(1 - p, 3);
  const easeBack = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const win = (t, a, b) => clamp((t - a) / (b - a));

  // ---------------------------------------------------------------- backdrop
  for (let i = 0; i < 80; i++)
    el("circle", { cx: rnd() * 900, cy: rnd() * 330, r: rnd() * 1.2 + .3, fill: "#e8ecef", opacity: rnd() * .6 + .2 }, q("stars"));
  for (let x = -10; x < 910;) {
    const w = 30 + rnd() * 50, h = 40 + rnd() * 120;
    el("rect", { x, y: 470 - h, width: w, height: h, fill: "#11161c", stroke: "#1a2027" }, q("city"));
    x += w + 3 + rnd() * 8;
  }

  // ---------------------------------------------------------------- the master's bike + rider (patrol coordinates)
  q("bike").innerHTML = `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="320" cy="452" r="46" stroke="#e8ecef" stroke-width="3"/><circle cx="320" cy="452" r="40" stroke="#5b6570" stroke-width="1.2"/>
      <circle cx="480" cy="452" r="46" stroke="#e8ecef" stroke-width="3"/><circle cx="480" cy="452" r="40" stroke="#5b6570" stroke-width="1.2"/>
      <path d="M280 452 H360 M320 412 V492 M440 452 H520 M480 412 V492" stroke="#5b6570" stroke-width="1"/>
      <circle cx="390" cy="456" r="15" stroke="#19e3f2" stroke-width="2.4" filter="url(#nfd-glow)"/>
      <g stroke="#1ef58f" stroke-width="3.2" filter="url(#nfd-glow)">
        <path d="M390 456 L375 378 M377 388 L462 384 M390 456 L468 402 M462 380 L468 402 M378 392 L320 452 M390 456 L320 452"/>
      </g>
      <path d="M468 402 L480 452 M462 380 L468 370 Q474 360 492 361 M375 378 L374 370" stroke="#e8ecef" stroke-width="3"/>
      <path d="M356 369 Q372 364 392 368" stroke="#e8ecef" stroke-width="4"/>
      <path d="M370 456 L410 456" stroke="#e8ecef" stroke-width="3"/>
    </g>`;
  const rider = q("rider");
  rider.innerHTML = `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M374 366 L410 404 L370 456" stroke="#3b444d" stroke-width="7"/>
      <path data-k="armFree" stroke="#9aa4ad" stroke-width="6"/>
      <circle data-k="fist" r="5" fill="#9aa4ad" opacity="0"/>
      <path d="M374 364 Q384 330 408 300" stroke="#e8ecef" stroke-width="9"/>
      <g data-k="headG">
        <circle cx="421" cy="279" r="12" stroke="#e8ecef" stroke-width="3" fill="#0f1215"/>
        <path d="M409 275 Q414 262 428 264 Q434 266 433 272 L446 273" stroke="#1ef58f" stroke-width="3"/>
        <path data-k="mouthR" d="M429 284 L433 284" stroke="#e8ecef" stroke-width="2"/>
      </g>
      <path d="M374 366 L428 398 L412 456 L426 457" stroke="#c9d1d8" stroke-width="8"/>
      <path d="M408 302 L440 332 L486 362" stroke="#e8ecef" stroke-width="6"/>
    </g>`;
  const armFree = q("armFree"), fist = q("fist"), mouthR = q("mouthR"), headG = q("headG");

  // ---------------------------------------------------------------- the Night Fury (ground pose, feet at y=0, facing right)
  const fury = q("fury");
  fury.innerHTML = `
    <g stroke-linecap="round" stroke-linejoin="round" filter="url(#nfd-glow)">
      <g data-k="fWingFar" opacity=".5">
        <path d="M30 -96 C22 -156 4 -206 -44 -250 Q-66 -214 -96 -208 Q-86 -178 -126 -168 Q-100 -144 -136 -128 Q-96 -118 -50 -98 Z" fill="#07080a" stroke="#19e3f2" stroke-width="2"/>
      </g>
      <path d="M-110 -60 C-160 -60 -214 -44 -276 -30" fill="none" stroke="#19e3f2" stroke-width="3"/>
      <path d="M-268 -31 L-296 -52 L-288 -30 Z" fill="#07080a" stroke="#19e3f2" stroke-width="2"/>
      <path d="M-268 -31 L-298 -10 L-288 -30 Z" fill="#07080a" stroke="#ff4d5e" stroke-width="2"/>
      <path d="M-78 -50 L-94 -20 L-80 0 L-64 0 M-56 -46 L-60 -14 L-48 0 L-34 0 M60 -50 L64 -16 L72 0 L86 0 M84 -54 L94 -20 L104 0 L118 0"
            fill="none" stroke="#19e3f2" stroke-width="3"/>
      <path d="M-114 -70 C-60 -112 60 -118 110 -86 C126 -76 126 -56 110 -50 C60 -38 -60 -36 -114 -50 Z" fill="#07080a" stroke="#19e3f2" stroke-width="3"/>
      <path d="M-86 -92 L-80 -106 L-72 -94 M-50 -102 L-44 -116 L-36 -104 M-14 -106 L-8 -120 L0 -107 M22 -106 L28 -119 L36 -105"
            fill="none" stroke="#a45cff" stroke-width="2.2"/>
      <path d="M100 -90 C120 -112 136 -126 150 -130" fill="none" stroke="#19e3f2" stroke-width="10"/>
      <path d="M100 -90 C120 -112 136 -126 150 -130" fill="none" stroke="#07080a" stroke-width="6"/>
      <g data-k="fHead">
        <path d="M150 -146 C136 -170 116 -180 98 -180 C114 -166 126 -156 138 -142" fill="#07080a" stroke="#a45cff" stroke-width="2.2"/>
        <path d="M160 -150 C156 -174 146 -190 128 -198 C138 -180 142 -166 146 -150" fill="#07080a" stroke="#a45cff" stroke-width="2.2"/>
        <g data-k="fJaw"><path d="M146 -116 C168 -108 196 -108 218 -118 C204 -104 176 -100 150 -106 Z" fill="#07080a" stroke="#19e3f2" stroke-width="2.4"/></g>
        <path d="M140 -122 C150 -150 186 -156 212 -142 C224 -134 224 -122 212 -118 C190 -110 162 -110 140 -116 Z" fill="#07080a" stroke="#19e3f2" stroke-width="3"/>
        <path d="M176 -134 Q187 -143 198 -134 Q187 -128 176 -134 Z" fill="#0d3b22" stroke="#1ef58f" stroke-width="2"/>
        <ellipse data-k="fPupil" cx="187" cy="-134.5" rx="1.4" ry="4.4" fill="#020302"/>
        <circle data-k="fGlow" cx="220" cy="-118" r="10" fill="url(#nfd-plasma)" opacity="0" filter="url(#nfd-big)"/>
      </g>
      <g data-k="fWing">
        <path d="M20 -100 C12 -160 -6 -210 -54 -254 Q-76 -218 -106 -212 Q-96 -182 -136 -172 Q-110 -148 -146 -132 Q-106 -122 -60 -102 Z" fill="#07080a" stroke="#19e3f2" stroke-width="3"/>
        <path d="M-12 -180 L-106 -212 M-12 -180 L-136 -172 M-12 -180 L-146 -132" fill="none" stroke="#19e3f2" stroke-width="1.3" opacity=".6"/>
      </g>
    </g>`;
  const fWing = q("fWing"), fWingFar = q("fWingFar"), fHead = q("fHead"), fJaw = q("fJaw"), fGlow = q("fGlow"), fPupil = q("fPupil");
  const FURY_X = 450, FURY_Y = 470, FURY_S = .9;
  const MOUTH = [FURY_X + 218 * FURY_S, FURY_Y - 118 * FURY_S];

  // ---------------------------------------------------------------- the attackers
  const DRAGONS = [
    { name: "Monstrous Nightmare", stroke: "#ff5a36", fill: "#2a0d08", acc: "#ffb020", from: [-170, 80], to: [185, 108], flip: false, size: 1.15, horns: true, spikes: true, type: "fire", color: "#ff7a2c" },
    { name: "Deadly Nadder", stroke: "#3fa9ff", fill: "#0b1a2e", acc: "#ffd84a", from: [1070, 60], to: [712, 96], flip: true, size: 1.05, crest: true, spikes: true, type: "spark", color: "#fff2a8" },
    { name: "Hideous Zippleback", stroke: "#5bdc4a", fill: "#0d2210", acc: "#d7ff5a", from: [1080, 250], to: [778, 228], flip: true, size: 1.05, heads: 2, type: "gas", color: "#9bff5a" },
    { name: "Gronckle", stroke: "#d08a4a", fill: "#24160b", acc: "#ff8a3c", from: [-160, 262], to: [138, 250], flip: false, size: 1, round: true, type: "lava", color: "#ff5a1f", hz: 7 },
    { name: "Skrill", stroke: "#c77dff", fill: "#170b24", acc: "#e9d5ff", from: [520, -150], to: [545, 58], flip: false, size: .95, spikes: true, type: "bolt", color: "#e3c8ff" }
  ];
  const dragonMarkup = o => {
    const heads = o.heads || 1, sw = 2.4;
    let s = `<g fill="${o.fill}" stroke="${o.stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">`;
    s += `<g data-w="far" opacity=".45"><path d="M6 -10 C2 -42 -8 -62 -28 -78 Q-38 -60 -50 -56 Q-44 -42 -60 -36 Q-48 -24 -54 -14 Q-34 -12 -14 -6 Z"/></g>`;
    if (o.round) {
      s += `<path d="M-30 4 C-44 6 -54 12 -64 10" fill="none"/><path d="M-64 10 L-74 2 L-72 12 L-76 20 Z"/>`;
      s += `<ellipse cx="0" cy="0" rx="34" ry="26"/><path d="M24 -12 C32 -24 52 -24 58 -12 C60 -2 52 4 40 4 C32 4 26 0 24 -12 Z"/>`;
      s += `<circle cx="46" cy="-12" r="2.4" fill="${o.acc}" stroke="none"/><path d="M-10 26 L-12 36 M12 26 L14 36" fill="none"/>`;
      s += `<path d="M-18 -18 L-14 -28 L-8 -20 M2 -24 L6 -34 L10 -24" fill="none" stroke="${o.acc}"/>`;
    } else {
      s += `<path d="M-50 6 C-80 10 -100 22 -126 18" fill="none"/><path d="M-126 18 L-140 8 L-135 20 L-142 30 Z"/>`;
      s += `<path d="M-52 4 C-32 -14 20 -16 40 -4 C46 0 46 8 40 10 C20 18 -32 18 -52 8 Z"/>`;
      s += `<path d="M34 -4 C46 -14 54 -22 62 -24" fill="none" stroke-width="7"/><path d="M34 -4 C46 -14 54 -22 62 -24" fill="none" stroke="${o.fill}" stroke-width="3"/>`;
      s += `<path d="M56 -26 C62 -36 80 -38 92 -30 C98 -26 98 -20 92 -18 C80 -14 66 -16 56 -20 Z"/><circle cx="78" cy="-28" r="2.2" fill="${o.acc}" stroke="none"/>`;
      if (heads === 2) {
        s += `<path d="M34 4 C48 10 56 14 64 12" fill="none" stroke-width="7"/><path d="M34 4 C48 10 56 14 64 12" fill="none" stroke="${o.fill}" stroke-width="3"/>`;
        s += `<path d="M58 8 C64 -2 82 -4 94 4 C100 8 100 14 94 16 C82 20 68 18 58 14 Z"/><circle cx="80" cy="6" r="2.2" fill="${o.acc}" stroke="none"/>`;
      }
      if (o.spikes) s += `<path d="M-30 -8 L-26 -19 L-22 -10 M-10 -12 L-6 -23 L-2 -13 M10 -12 L14 -21 L18 -11" fill="none" stroke="${o.acc}"/>`;
      if (o.crest) s += `<path d="M60 -30 L48 -48 M66 -34 L60 -54 M72 -36 L72 -56 M78 -35 L84 -52" fill="none" stroke="${o.acc}"/>`;
      if (o.horns) s += `<path d="M66 -32 L56 -50 L70 -36 M76 -35 L76 -54 L82 -36" stroke="${o.acc}"/>`;
      s += `<path d="M14 12 L18 24 M-30 14 L-26 26" fill="none"/>`;
    }
    s += `<g data-w="near"><path d="M0 -8 C-4 -40 -14 -60 -34 -76 Q-44 -58 -56 -54 Q-50 -40 -66 -34 Q-54 -22 -60 -12 Q-40 -10 -20 -4 Z"/></g>`;
    return s + `</g>`;
  };
  const MOUTHS = o => o.round ? [[60, -6]] : o.heads === 2 ? [[96, -22], [98, 12]] : [[96, -22]];

  const dragons = DRAGONS.map((o, i) => {
    const g = el("g", { filter: "url(#nfd-glow)" }, q("dragons"));
    const body = el("g", {}, g, dragonMarkup(o));
    const label = el("text", { "text-anchor": "middle", y: 58, fill: o.stroke, opacity: 0,
      style: "font:700 9px 'JetBrains Mono',monospace;letter-spacing:.18em;text-transform:uppercase" }, g);
    label.textContent = o.name;
    return { o, i, g, body, label, wings: [...g.querySelectorAll("[data-w]")], start: .15 + i * .3 };
  });
  const dragonPos = (d, t) => {
    const p = easeOut(win(t, d.start, d.start + 1.7));
    return [lerp(d.o.from[0], d.o.to[0], p) + Math.sin(t * 1.3 + d.i) * 6,
            lerp(d.o.from[1], d.o.to[1], p) + Math.sin(t * 2.1 + d.i * 2) * 7];
  };

  // rival riders — facing left, coming in from the right
  const RIVALS = [{ from: 1010, to: 742, start: .5 }, { from: 1110, to: 836, start: .9 }];
  const rivals = RIVALS.map(r => {
    const g = el("g", {}, q("rivals"), `
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="-30" cy="-22" r="21" stroke="#4a525c" stroke-width="2.5"/><circle cx="34" cy="-22" r="21" stroke="#4a525c" stroke-width="2.5"/>
        <path d="M-30 -22 L-2 -24 L-10 -58 M-2 -24 L34 -22 L24 -60 L-12 -58 M-10 -58 L-14 -64 L-4 -64 M-30 -22 L-26 -60 L-36 -62" stroke="#5a2a30" stroke-width="3"/>
        <path d="M22 -62 Q8 -84 -4 -104" stroke="#2c3238" stroke-width="8"/>
        <circle cx="-10" cy="-114" r="10" fill="#0f1215" stroke="#2c3238" stroke-width="3"/>
        <path d="M-6 -100 L-24 -80 L-32 -62 M22 -62 L6 -44 L-2 -22" stroke="#2c3238" stroke-width="5"/>
        <circle cx="-36" cy="-60" r="4" fill="#ff4d5e" stroke="none" filter="url(#nfd-big)"/>
        <circle cx="-16" cy="-116" r="1.8" fill="#ff4d5e" stroke="none"/>
      </g>`);
    return { r, g };
  });
  const rivalPos = (rv, t) => {
    const p = easeOut(win(t, rv.r.start, rv.r.start + 2.8));
    return [lerp(rv.r.from, rv.r.to, p), 470 + Math.abs(Math.sin(t * 7 + rv.r.start)) * -1.5];
  };

  // one roar: the first shockwave sweeps out from the Fury's mouth at 900 px/s
  const ROAR = 7.45, RING_V = 900;
  const blowTime = ([x, y]) => ROAR + Math.hypot(x - MOUTH[0], y - MOUTH[1]) / RING_V;
  const blown = (base, t, tb, spin) => {
    const dt = t - tb, dx = base[0] - MOUTH[0], dy = base[1] - MOUTH[1], d = Math.hypot(dx, dy) || 1;
    return { x: base[0] + dx / d * 820 * dt, y: base[1] + dy / d * 820 * dt - 160 * dt + 260 * dt * dt,
             rot: spin * dt * 520, op: clamp(1 - dt / .85) };
  };

  // ---------------------------------------------------------------- the barrage (scheduled up front, drawn from t)
  const SHOTS = [];
  const DUR = { fire: .7, spark: .5, gas: 1.1, lava: .95, bolt: .16 };
  dragons.forEach(d => {
    let ts = 2 + d.i * .3, k = 0;
    while (ts < 7.2) {
      const mouths = MOUTHS(d.o), m = mouths[k++ % mouths.length];
      const tgt = [450 + (rnd() - .5) * 320, 432 + rnd() * 34];
      const s = { d, m, ts, dur: DUR[d.o.type], tgt, type: d.o.type, color: d.o.color, g: el("g", { opacity: 0 }, q("shots")) };
      if (s.type === "bolt") s.bolt = el("polyline", { fill: "none", stroke: s.color, "stroke-width": 3, filter: "url(#nfd-big)" }, s.g);
      else {
        s.trail = el("line", { stroke: s.color, "stroke-width": s.type === "spark" ? 2 : 4, "stroke-linecap": "round", opacity: .55, filter: "url(#nfd-big)" }, s.g);
        s.core = el("circle", { r: s.type === "gas" ? 10 : s.type === "spark" ? 4 : 8, fill: s.type === "lava" ? "#3a1206" : s.color,
          stroke: s.type === "lava" ? "#ff8a3c" : "none", "stroke-width": 2, filter: "url(#nfd-big)", opacity: s.type === "gas" ? .6 : 1 }, s.g);
      }
      s.burst = el("circle", { fill: "none", stroke: s.type === "gas" ? "#ffe45a" : s.color, "stroke-width": 4, filter: "url(#nfd-big)", opacity: 0 }, s.g);
      s.jag = Array.from({ length: 7 }, () => (rnd() - .5) * 46);
      SHOTS.push(s);
      ts += .95 + rnd() * .5;
    }
  });
  const mouthWorld = (d, m, t) => {
    const [x, y] = dragonPos(d, t), s = d.o.size, f = d.o.flip ? -1 : 1;
    return [x + f * m[0] * s, y + m[1] * s];
  };

  const RINGS = [0, .2, .42].map(o => ({ at: ROAR + o, c: el("circle", { cx: MOUTH[0], cy: MOUTH[1], r: 0, stroke: o === .2 ? "#19e3f2" : "#a45cff", filter: "url(#nfd-big)" }, q("rings")) }));

  // ---------------------------------------------------------------- captions
  const CAPTIONS = [
    [0, "They came for the Nightfury — rival riders and five breeds of dragon."],
    [2, "Nightmare fire. Nadder sparks. Zippleback gas. Gronckle lava. Skrill lightning."],
    [4.8, "Then the master screamed —"],
    [6.3, "— and the cycle became a deadly Night Fury."],
    [7.4, "One roar."],
    [8.8, "It all went."],
    [11.4, "One gear. One king."],
    [12.6, "Start anywhere. Stop nowhere. — Master Aadhithyavarman"]
  ];
  const caption = q("caption");
  let lastCap = null;

  // ---------------------------------------------------------------- render(t)
  const svgEl = q("svg"), shake = q("shake"), flash = q("flash"), scream = q("scream"), bubble = q("bubble"), bike = q("bike"), motto = q("motto");
  const render = t => {
    let amp = 0;

    // morph: bike <-> Night Fury behind two green flashes
    const furyOn = t >= 6.45 && t < 11.95;
    const flashOp = Math.max(clamp(1 - Math.abs(t - 6.5) / .42), clamp(1 - Math.abs(t - 11.95) / .42));
    flash.setAttribute("opacity", flashOp.toFixed(3));
    bike.setAttribute("opacity", furyOn ? 0 : 1);
    fury.setAttribute("opacity", furyOn ? 1 : 0);
    const grow = furyOn ? easeBack(win(t, 6.45, 7.05)) : 0;
    const sc = FURY_S * lerp(.72, 1, grow);
    fury.setAttribute("transform", `translate(${FURY_X} ${FURY_Y}) scale(${sc.toFixed(3)})`);
    const breathe = Math.sin(t * 2.2) * .04;
    fWing.setAttribute("transform", `translate(20 -100) scale(1 ${(1 + breathe).toFixed(3)}) translate(-20 100)`);
    fWingFar.setAttribute("transform", `translate(30 -96) scale(1 ${(1 + breathe).toFixed(3)}) translate(-30 96)`);

    // the roar: head up, jaw open, plasma, shockwaves, shake
    const roar = win(t, 7.3, 7.5) * (1 - win(t, 8.3, 8.7));
    fHead.setAttribute("transform", `rotate(${(-9 * roar).toFixed(2)} 146 -118)`);
    fJaw.setAttribute("transform", `rotate(${(22 * roar).toFixed(2)} 150 -110)`);
    fGlow.setAttribute("opacity", (roar * (.75 + .25 * Math.sin(t * 40))).toFixed(2));
    fGlow.setAttribute("r", (10 + 14 * roar).toFixed(1));
    fPupil.setAttribute("rx", (1.4 + 2 * (t > 8.8 && furyOn ? 1 : 0)).toFixed(1));
    if (t > 7.4 && t < 8.4) amp += 10 * (1 - win(t, 7.4, 8.4));
    RINGS.forEach(({ at, c }) => {
      const p = win(t, at, at + 1.1);
      c.setAttribute("r", (p * RING_V * 1.1).toFixed(1));
      c.setAttribute("stroke-width", (14 * (1 - p) + 1).toFixed(1));
      c.setAttribute("opacity", t < at || p >= 1 ? 0 : (1 - p).toFixed(2));
    });

    // rider: scream pose, then rides the Fury's back
    const yell = win(t, 4.8, 5.1) * (1 - win(t, 6.3, 6.6));
    const ride = furyOn ? easeOut(win(t, 6.45, 7.0)) : 0;
    rider.setAttribute("transform", `translate(${(50 + 30 * ride).toFixed(1)} ${(-28 - 4 * ride).toFixed(1)})`);
    const ex = lerp(400, 396, yell), ey = lerp(338, 262, yell), hx = lerp(392, 402, yell), hy = lerp(364, 222, yell);
    armFree.setAttribute("d", `M404 303 L${ex} ${ey} L${hx} ${hy}`);
    fist.setAttribute("cx", hx); fist.setAttribute("cy", hy); fist.setAttribute("opacity", yell.toFixed(2));
    headG.setAttribute("transform", `rotate(${(-14 * yell).toFixed(1)} 421 290)`);
    mouthR.setAttribute("d", yell > .5 ? "M428 282 Q431 290 434 282 Z" : "M429 284 L433 284");

    // the scream itself — the Y's keep coming
    const sp = win(t, 4.85, 6.2);
    const ys = 1 + Math.floor(sp * 6);
    scream.textContent = "NIGHT FUR" + "Y".repeat(ys) + "!";
    const size = 22 + 44 * easeOut(win(t, 4.85, 5.4));
    scream.setAttribute("font-size", size.toFixed(1));
    const sOp = win(t, 4.85, 5.0) * (1 - win(t, 6.3, 6.7));
    scream.setAttribute("opacity", sOp.toFixed(2));
    const jit = sOp * 3;
    scream.setAttribute("transform", `translate(${(Math.sin(t * 90) * jit).toFixed(1)} ${(Math.cos(t * 77) * jit).toFixed(1)})`);
    if (sOp > .5) amp += 2;

    const mo = win(t, 12.6, 13.3);
    motto.setAttribute("opacity", mo.toFixed(2));
    motto.setAttribute("transform", `translate(0 ${(12 * (1 - easeOut(mo)) - 52).toFixed(1)})`);

    bubble.setAttribute("opacity", (win(t, 2.3, 2.6) * (1 - win(t, 4.3, 4.6))).toFixed(2));

    // dragons: fly in, hover, get blown away
    dragons.forEach(d => {
      const base = dragonPos(d, Math.min(t, 7.45));
      const tb = blowTime(base);
      let x = base[0], y = base[1], rot = 0, op = 1;
      if (t >= tb) ({ x, y, rot, op } = blown(base, t, tb, d.o.flip ? 1 : -1));
      else if (t > 0) { const live = dragonPos(d, t); x = live[0]; y = live[1]; }
      const f = d.o.flip ? -1 : 1, s = d.o.size;
      d.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`);
      d.body.setAttribute("transform", `scale(${f * s} ${s})`);
      d.g.setAttribute("opacity", op.toFixed(2));
      const flap = .3 + .7 * Math.cos(t * 2 * Math.PI * (d.o.hz || 1.6) + d.i);
      d.wings.forEach(w => w.setAttribute("transform", `translate(0 -8) scale(1 ${flap.toFixed(3)}) translate(0 8)`));
      d.label.setAttribute("opacity", (win(t, 1.4, 1.9) * (1 - win(t, 4.6, 5.0)) * .9).toFixed(2));
    });

    rivals.forEach((rv, i) => {
      const base = rivalPos(rv, Math.min(t, 7.45));
      const tb = blowTime([base[0], base[1] - 60]);
      let x = base[0], y = base[1], rot = 0, op = 1;
      if (t >= tb) ({ x, y, rot, op } = blown([base[0], base[1] - 60], t, tb, 1)), y += 60;
      else { const live = rivalPos(rv, t); x = live[0]; y = live[1]; }
      rv.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`);
      rv.g.setAttribute("opacity", op.toFixed(2));
    });

    // barrage
    SHOTS.forEach(s => {
      const end = s.ts + s.dur;
      const killed = t >= ROAR + .05 && t < end + .45;          // vaporised by the roar mid-flight
      if (t < s.ts || t > end + .45 || (killed && t >= Math.max(ROAR + .05, s.ts))) { s.g.setAttribute("opacity", 0); return; }
      s.g.setAttribute("opacity", 1);
      const from = mouthWorld(s.d, s.m, s.ts);
      if (t < end) {
        const p = (t - s.ts) / s.dur;
        let x = lerp(from[0], s.tgt[0], p), y = lerp(from[1], s.tgt[1], p);
        if (s.type === "lava") y -= 150 * 4 * p * (1 - p);
        s.burst.setAttribute("opacity", 0);
        if (s.bolt) {
          const pts = [from];
          for (let k = 1; k < 7; k++) pts.push([lerp(from[0], s.tgt[0], k / 7) + s.jag[k] * (Math.sin(t * 60 + k) > 0 ? 1 : -1), lerp(from[1], s.tgt[1], k / 7)]);
          pts.push(s.tgt);
          s.bolt.setAttribute("points", pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" "));
          s.bolt.setAttribute("opacity", 1);
        } else {
          const tl = Math.min(1, p) * 60, d = Math.hypot(s.tgt[0] - from[0], s.tgt[1] - from[1]) || 1;
          s.core.setAttribute("cx", x.toFixed(1)); s.core.setAttribute("cy", y.toFixed(1));
          if (s.type === "gas") s.core.setAttribute("r", (8 + 14 * p).toFixed(1));
          s.trail.setAttribute("x1", (x - (s.tgt[0] - from[0]) / d * tl).toFixed(1)); s.trail.setAttribute("y1", (y - (s.tgt[1] - from[1]) / d * tl).toFixed(1));
          s.trail.setAttribute("x2", x.toFixed(1)); s.trail.setAttribute("y2", y.toFixed(1));
          s.core.setAttribute("opacity", s.type === "gas" ? .6 : 1); s.trail.setAttribute("opacity", s.type === "lava" ? .25 : .55);
        }
      } else {
        const b = (t - end) / .45;
        if (s.bolt) s.bolt.setAttribute("opacity", Math.max(0, 1 - b * 3).toFixed(2));
        else { s.core.setAttribute("opacity", 0); s.trail.setAttribute("opacity", 0); }
        s.burst.setAttribute("cx", s.tgt[0].toFixed(1)); s.burst.setAttribute("cy", s.tgt[1].toFixed(1));
        s.burst.setAttribute("r", (6 + (s.type === "gas" ? 60 : 38) * b).toFixed(1));
        s.burst.setAttribute("opacity", (1 - b).toFixed(2));
        if (b < .3) amp += 4 * (1 - b / .3);
      }
    });

    const a = Math.min(amp, 12);
    shake.setAttribute("transform", `translate(${(Math.sin(t * 83) * a).toFixed(1)} ${(Math.cos(t * 71) * a).toFixed(1)})`);

    let cap = CAPTIONS[0][1];
    for (const [at, txt] of CAPTIONS) if (t >= at) cap = txt;
    if (cap !== lastCap) { caption.textContent = cap; lastCap = cap; }
  };

  // ---------------------------------------------------------------- playback
  const btn = q("replay");
  let raf = 0, t0 = null, lastT = -1, playing = false, played = false, dead = false;
  const loop = ts => {
    if (dead) return;
    if (t0 === null) t0 = ts;
    const t = (ts - t0) / 1000;
    if (lastT < 7.3 && t >= 7.3 && window.nfSfx) window.nfSfx.roar();   // the one roar
    lastT = t;
    render(Math.min(t, END));
    if (t < END) raf = requestAnimationFrame(loop);
    else { playing = false; btn.textContent = "↻ Replay"; }
  };
  const play = () => {
    if (reduced) return;
    cancelAnimationFrame(raf);
    t0 = null; lastT = -1; playing = true; played = true; btn.textContent = "● Defending…";
    raf = requestAnimationFrame(loop);
  };
  btn.addEventListener("click", play);
  root.__nfdRender = render;          // used for scrubbing / testing the timeline

  let io = null;
  if (reduced) {
    render(END);                       // still frame: the aftermath and the master's line
    btn.style.display = "none";
  } else {
    render(0);
    if (typeof window.IntersectionObserver === "function") {
      io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && !played) play(); }, { threshold: .45 });
      io.observe(svgEl);
    }
  }
  return () => { dead = true; cancelAnimationFrame(raf); if (io) io.disconnect(); };
}

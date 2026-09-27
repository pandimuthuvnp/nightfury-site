/* ---- Chapter 06: Defend the Nightfury — mini-game (merged) ----
   Canvas 2D, fixed 900x520 logical space scaled to the card. You fly the
   Night Fury (it follows the pointer's x), click/tap (hold) to fire plasma,
   and roar when the Fury meter is full. */
function nfGameMount(root, reduced) {
  const W = 900, H = 520, GROUND = 470, BIKE_X = 450;
  const BEST_KEY = "nf-defend-best";

  root.innerHTML = `
  <style>
    .nfg-btn{border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#F8FAFC;padding:10px 20px;
      font:700 11px 'JetBrains Mono',monospace;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:all .25s}
    .nfg-btn:hover{border-color:#00FF87;color:#00FF87}
    .nfg-go{background:#00FF87;color:#07080B;border-color:#00FF87}
    .nfg-go:hover{color:#07080B;box-shadow:0 0 28px rgba(0,255,135,.55)}
    .nfg-roar[disabled]{opacity:.35;cursor:not-allowed}
    .nfg-roar.ready{background:linear-gradient(90deg,#19e3f2,#a45cff);color:#07080B;border-color:transparent;animation:nfgPulse 0.9s ease-in-out infinite}
    @keyframes nfgPulse{0%,100%{box-shadow:0 0 0 rgba(164,92,255,0)}50%{box-shadow:0 0 26px rgba(164,92,255,.8)}}
  </style>
  <div style="position:relative;user-select:none;-webkit-user-select:none">
    <div style="display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;justify-content:space-between;margin-bottom:14px;
         font:700 11px 'JetBrains Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:#94A3B8">
      <span>Score <b data-k="score" style="color:#F8FAFC;font-variant-numeric:tabular-nums">0</b></span>
      <span>Wave <b data-k="wave" style="color:#F8FAFC">1</b></span>
      <span>Bike <b data-k="hp" style="color:#ff4d5e;letter-spacing:.12em">♥♥♥♥♥</b></span>
      <span style="display:flex;align-items:center;gap:10px;flex:1 1 180px;min-width:160px">Fury
        <span style="flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden">
          <span data-k="meter" style="display:block;height:100%;width:0;background:linear-gradient(90deg,#19e3f2,#a45cff);box-shadow:0 0 12px #a45cff;transition:width .15s"></span>
        </span>
      </span>
      <span style="display:flex;gap:8px;flex-wrap:wrap">
        <button data-k="sfx" class="nfg-btn" type="button" aria-pressed="true">SFX on</button>
        <button data-k="squad" class="nfg-btn nfg-roar" type="button" disabled>Call the Master · U</button>
        <button data-k="roar" class="nfg-btn nfg-roar" type="button" disabled>Night Fury! · Space</button>
      </span>
    </div>
    <div style="position:relative">
      <canvas data-k="canvas" aria-label="Defend the Nightfury mini-game"
        style="display:block;width:100%;aspect-ratio:900/520;border-radius:12px;background:#06070a;touch-action:none;cursor:crosshair"></canvas>
      <div data-k="panel" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
           background:rgba(6,7,10,.74);border-radius:12px;padding:16px;text-align:center"></div>
    </div>
  </div>`;

  const q = k => root.querySelector(`[data-k="${k}"]`);
  const canvas = q("canvas"), ctx = canvas.getContext("2d");
  const hud = { score: q("score"), wave: q("wave"), hp: q("hp"), meter: q("meter"), roar: q("roar"), squad: q("squad"), panel: q("panel") };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const P = s => new Path2D(s);
  let best = 0;
  try { best = +localStorage.getItem(BEST_KEY) || 0; } catch (e) { /* storage blocked */ }

  // ---------------------------------------------------------------- shapes
  const S = {
    wingNear: P("M0 -8 C-4 -40 -14 -60 -34 -76 Q-44 -58 -56 -54 Q-50 -40 -66 -34 Q-54 -22 -60 -12 Q-40 -10 -20 -4 Z"),
    wingFar: P("M6 -10 C2 -42 -8 -62 -28 -78 Q-38 -60 -50 -56 Q-44 -42 -60 -36 Q-48 -24 -54 -14 Q-34 -12 -14 -6 Z"),
    tail: P("M-50 6 C-80 10 -100 22 -126 18"), fin: P("M-126 18 L-140 8 L-135 20 L-142 30 Z"),
    body: P("M-52 4 C-32 -14 20 -16 40 -4 C46 0 46 8 40 10 C20 18 -32 18 -52 8 Z"),
    neck: P("M34 -4 C46 -14 54 -22 62 -24"), head: P("M56 -26 C62 -36 80 -38 92 -30 C98 -26 98 -20 92 -18 C80 -14 66 -16 56 -20 Z"),
    neck2: P("M34 4 C48 10 56 14 64 12"), head2: P("M58 8 C64 -2 82 -4 94 4 C100 8 100 14 94 16 C82 20 68 18 58 14 Z"),
    spikes: P("M-30 -8 L-26 -19 L-22 -10 M-10 -12 L-6 -23 L-2 -13 M10 -12 L14 -21 L18 -11"),
    crest: P("M60 -30 L48 -48 M66 -34 L60 -54 M72 -36 L72 -56 M78 -35 L84 -52"),
    horns: P("M66 -32 L56 -50 L70 -36 M76 -35 L76 -54 L82 -36"), legs: P("M14 12 L18 24 M-30 14 L-26 26"),
    gTail: P("M-30 4 C-44 6 -54 12 -64 10"), gFin: P("M-64 10 L-74 2 L-72 12 L-76 20 Z"),
    gHead: P("M24 -12 C32 -24 52 -24 58 -12 C60 -2 52 4 40 4 C32 4 26 0 24 -12 Z"),
    gLegs: P("M-10 26 L-12 36 M12 26 L14 36"), gSpikes: P("M-18 -18 L-14 -28 L-8 -20 M2 -24 L6 -34 L10 -24"),
    // the Night Fury (flying, facing right)
    fBody: P("M-120 12 C-90 -8 -20 -14 30 -6 C48 -3 60 2 66 6 C50 22 -40 28 -120 18 Z"),
    fTail: P("M-120 14 C-160 22 -200 28 -240 27 C-255 26 -266 24 -276 22"),
    fFin1: P("M-266 23 L-292 6 L-283 23 Z"), fFin2: P("M-266 23 L-294 40 L-283 23 Z"),
    fSpikes: P("M-100 8 L-94 0 L-88 6 M-70 3 L-64 -5 L-58 2 M-40 -1 L-34 -9 L-28 -2 M-10 -4 L-4 -11 L2 -4"),
    fEar1: P("M92 -18 C80 -36 64 -44 50 -44 C62 -34 70 -26 76 -16"), fEar2: P("M100 -20 C96 -40 86 -52 72 -58 C80 -44 84 -32 86 -20"),
    fHead: P("M60 4 C66 -12 82 -22 102 -22 C122 -22 136 -14 144 -4 C136 6 118 10 100 10 C84 10 70 9 60 4 Z"),
    fEye: P("M102 -10 Q112 -18 122 -10 Q112 -4 102 -10 Z"),
    fWing: P("M0 -6 C8 -40 5 -70 -10 -85 L-30 -130 Q-55 -100 -70 -95 Q-62 -70 -90 -62 Q-75 -40 -95 -28 Q-72 -18 -70 -4 Z"),
    // the cycle, turned Night Fury (ground pose, feet at y=0, facing right)
    gWingFar: P("M30 -96 C22 -156 4 -206 -44 -250 Q-66 -214 -96 -208 Q-86 -178 -126 -168 Q-100 -144 -136 -128 Q-96 -118 -50 -98 Z"),
    gTail: P("M-110 -60 C-160 -60 -214 -44 -276 -30"), gFin1: P("M-268 -31 L-296 -52 L-288 -30 Z"), gFin2: P("M-268 -31 L-298 -10 L-288 -30 Z"),
    gLegs4: P("M-78 -50 L-94 -20 L-80 0 L-64 0 M-56 -46 L-60 -14 L-48 0 L-34 0 M60 -50 L64 -16 L72 0 L86 0 M84 -54 L94 -20 L104 0 L118 0"),
    gBody: P("M-114 -70 C-60 -112 60 -118 110 -86 C126 -76 126 -56 110 -50 C60 -38 -60 -36 -114 -50 Z"),
    gBack: P("M-86 -92 L-80 -106 L-72 -94 M-50 -102 L-44 -116 L-36 -104 M-14 -106 L-8 -120 L0 -107 M22 -106 L28 -119 L36 -105"),
    gNeck: P("M100 -90 C120 -112 136 -126 150 -130"),
    gEar1: P("M150 -146 C136 -170 116 -180 98 -180 C114 -166 126 -156 138 -142"), gEar2: P("M160 -150 C156 -174 146 -190 128 -198 C138 -180 142 -166 146 -150"),
    gJaw: P("M146 -116 C168 -108 196 -108 218 -118 C204 -104 176 -100 150 -106 Z"),
    gHead: P("M140 -122 C150 -150 186 -156 212 -142 C224 -134 224 -122 212 -118 C190 -110 162 -110 140 -116 Z"),
    gEye: P("M176 -134 Q187 -143 198 -134 Q187 -128 176 -134 Z"),
    gWing: P("M20 -100 C12 -160 -6 -210 -54 -254 Q-76 -218 -106 -212 Q-96 -182 -136 -172 Q-110 -148 -146 -132 Q-106 -122 -60 -102 Z"),
    // the master's bike + rider (patrol coordinates)
    frame: P("M390 456 L375 378 M377 388 L462 384 M390 456 L468 402 M462 380 L468 402 M378 392 L320 452 M390 456 L320 452"),
    fork: P("M468 402 L480 452 M462 380 L468 370 Q474 360 492 361 M375 378 L374 370"), saddle: P("M356 369 Q372 364 392 368"),
    legFar: P("M374 366 L410 404 L370 456"), torso: P("M374 364 Q384 330 408 300"),
    cap: P("M409 275 Q414 262 428 264 Q434 266 433 272 L446 273"), legNear: P("M374 366 L428 398 L412 456 L426 457"),
    armBar: P("M408 302 L440 332 L486 362"), armRest: P("M404 303 L400 338 L392 364"), armUp: P("M404 303 L398 262 L402 222"),
    // rival rider (facing left, ground at 0)
    rFrame: P("M-30 -22 L-2 -24 L-10 -58 M-2 -24 L34 -22 L24 -60 L-12 -58 M-10 -58 L-14 -64 L-4 -64 M-30 -22 L-26 -60 L-36 -62"),
    rBody: P("M22 -62 Q8 -84 -4 -104"), rArms: P("M-6 -100 L-24 -80 L-32 -62 M22 -62 L6 -44 L-2 -22")
  };

  const TYPES = {
    nadder:     { name: "Deadly Nadder", stroke: "#3fa9ff", fill: "#0b1a2e", acc: "#ffd84a", hp: 1, pts: 100, shot: "spark", color: "#fff2a8", speed: 170, every: [1.7, 2.7], crest: 1, spikes: 1, scale: .78 },
    nightmare:  { name: "Monstrous Nightmare", stroke: "#ff5a36", fill: "#2a0d08", acc: "#ffb020", hp: 2, pts: 150, shot: "fire", color: "#ff7a2c", speed: 140, every: [2, 3], horns: 1, spikes: 1, scale: .88 },
    gronckle:   { name: "Gronckle", stroke: "#d08a4a", fill: "#24160b", acc: "#ff8a3c", hp: 3, pts: 150, shot: "lava", color: "#ff5a1f", speed: 90, every: [2.2, 3.2], round: 1, hz: 7, scale: .85 },
    zippleback: { name: "Hideous Zippleback", stroke: "#5bdc4a", fill: "#0d2210", acc: "#d7ff5a", hp: 2, pts: 200, shot: "gas", color: "#9bff5a", speed: 130, every: [2.4, 3.4], heads: 2, scale: .84 },
    skrill:     { name: "Skrill", stroke: "#c77dff", fill: "#170b24", acc: "#e9d5ff", hp: 1, pts: 250, shot: "bolt", color: "#e3c8ff", speed: 230, every: [2.6, 3.6], spikes: 1, scale: .74 }
  };
  const UNLOCK = [["nadder", "nightmare"], ["gronckle"], ["zippleback"], ["skrill"]];
  const SHOT = { fire: { v: 330, r: 14 }, spark: { v: 430, r: 9 }, gas: { v: 190, r: 20 }, lava: { v: 270, r: 14, arc: 150 } };

  // ---------------------------------------------------------------- canvas sizing + prerendered backdrop
  let scale = 1, dpr = 1;
  const bg = document.createElement("canvas"), bgx = bg.getContext("2d");
  const drawBackdrop = () => {
    bg.width = canvas.width; bg.height = canvas.height;
    bgx.setTransform(scale, 0, 0, scale, 0, 0);
    const g = bgx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#05060a"); g.addColorStop(1, "#101824");
    bgx.fillStyle = g; bgx.fillRect(0, 0, W, H);
    let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    bgx.fillStyle = "#e8ecef";
    for (let i = 0; i < 90; i++) { bgx.globalAlpha = r() * .6 + .2; bgx.beginPath(); bgx.arc(r() * W, r() * 330, r() * 1.2 + .3, 0, 7); bgx.fill(); }
    bgx.globalAlpha = 1;
    const m = bgx.createRadialGradient(800, 70, 0, 800, 70, 60); m.addColorStop(0, "rgba(232,236,239,.9)"); m.addColorStop(.5, "rgba(232,236,239,.1)"); m.addColorStop(1, "rgba(232,236,239,0)");
    bgx.fillStyle = m; bgx.fillRect(740, 10, 120, 120);
    bgx.fillStyle = "#dfe5ea"; bgx.beginPath(); bgx.arc(800, 70, 20, 0, 7); bgx.fill();
    bgx.globalAlpha = .5;
    for (let x = -10; x < 910;) { const w = 30 + r() * 50, h = 40 + r() * 120; bgx.fillStyle = "#11161c"; bgx.fillRect(x, GROUND - h, w, h); bgx.strokeStyle = "#1a2027"; bgx.strokeRect(x, GROUND - h, w, h); x += w + 3 + r() * 8; }
    bgx.globalAlpha = 1;
    bgx.fillStyle = "#0b0d10"; bgx.fillRect(0, GROUND, W, H - GROUND);
    bgx.strokeStyle = "#2a3138"; bgx.lineWidth = 2; bgx.beginPath(); bgx.moveTo(0, GROUND); bgx.lineTo(W, GROUND); bgx.stroke();
  };
  const resize = () => {
    const w = canvas.clientWidth || W;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * dpr * H / W);
    scale = canvas.width / W;
    drawBackdrop();
    if (state !== "play") draw();
  };

  // ---------------------------------------------------------------- state
  let state = "ready", score, wave, waveT, hp, meter, spawnT, invuln, shake, roarT, flashA;
  let enemies, shots, plasmas, fx, rings, texts, fury, aim, firing, fireCool, time;
  let squadT = -1, squadCool = 0, friends = [], taps = [], lastCoolShown = null, rescueUsed = false;
  const reset = () => {
    score = 0; wave = 1; waveT = 0; hp = 5; meter = 0; spawnT = 1; invuln = 0; shake = 0; roarT = -1; flashA = 0; time = 0;
    enemies = []; shots = []; plasmas = []; fx = []; rings = []; texts = [];
    fury = { x: 450, y: 130, face: 1 }; aim = { x: 600, y: 300 }; firing = false; fireCool = 0;
    squadT = -1; squadCool = 0; friends = []; taps = []; lastCoolShown = null; rescueUsed = false;
    banner("WAVE 1");
    syncHud();
  };
  const banner = (text, color = "#F8FAFC") => texts.push({ x: W / 2, y: 250, text, life: 1.6, max: 1.6, color, size: 44, font: "Cinzel,serif", weight: 900 });
  const floatText = (x, y, text, color) => texts.push({ x, y, text, life: .9, max: .9, color, size: 14, font: "'JetBrains Mono',monospace", weight: 700, rise: 40 });

  const syncHud = () => {
    hud.score.textContent = score;
    hud.wave.textContent = wave;
    hud.hp.textContent = "♥".repeat(Math.max(0, hp)) + "♡".repeat(Math.max(0, 5 - hp));
    hud.meter.style.width = `${meter}%`;
    const ready = state === "play" && meter >= 100 && roarT < 0;
    hud.roar.disabled = !ready;
    hud.roar.classList.toggle("ready", ready);
    const squadReady = state === "play" && squadCool <= 0 && squadT < 0;
    hud.squad.disabled = !squadReady;
    hud.squad.classList.toggle("ready", squadReady);
    hud.squad.textContent = squadT >= 0 ? "Squad of Unity!" : squadCool > 0 && state === "play" ? `Squad in ${Math.ceil(squadCool)}s` : "Call the Master · U";
  };

  // ---------------------------------------------------------------- spawning
  const unlocked = () => UNLOCK.slice(0, wave).flat();
  const spawn = () => {
    const onScreen = enemies.filter(e => !e.dead).length;
    if (onScreen >= Math.min(10, 3 + wave)) return;
    const left = Math.random() < .5;
    if (Math.random() < .26) {
      enemies.push({ kind: "rider", x: left ? -70 : W + 70, dir: left ? 1 : -1, speed: 55 + wave * 7 + rand(0, 20), hp: 1, bob: rand(0, 6), y: 0 });
      return;
    }
    const type = pick(unlocked()), T = TYPES[type];
    const e = { kind: "dragon", type, T, x: left ? -130 : W + 130, y: rand(60, 280), hp: T.hp, phase: rand(0, 6), flash: 0,
                tx: rand(110, 790), ty: rand(60, 290), retarget: rand(3, 5), fireAt: rand(1.2, 2.2), charge: -1 };
    enemies.push(e);
  };

  const dragonCenter = e => [e.x + (e.x < BIKE_X ? 1 : -1) * e.T.scale * (e.T.round ? 12 : 20), e.y - e.T.scale * 8];
  const dragonRadius = e => e.T.scale * (e.T.round ? 40 : 52);
  const faceOf = e => (e.x < BIKE_X ? 1 : -1);
  const mouthsOf = e => {
    const f = faceOf(e), s = e.T.scale;
    const m = e.T.round ? [[60, -6]] : e.T.heads === 2 ? [[96, -22], [98, 12]] : [[96, -22]];
    return m.map(([mx, my]) => [e.x + f * mx * s, e.y + my * s]);
  };
  const bikeTarget = () => [BIKE_X + rand(-45, 45), GROUND - rand(30, 70)];

  const fireEnemy = e => {
    const T = e.T;
    if (T.shot === "bolt") { e.charge = .8; return; }
    mouthsOf(e).forEach(([mx, my]) => {
      const [tx, ty] = bikeTarget(), spec = SHOT[T.shot];
      shots.push({ type: T.shot, color: T.color, x0: mx, y0: my, x1: tx, y1: ty, t: 0,
                   dur: Math.hypot(tx - mx, ty - my) / spec.v, r: spec.r, arc: spec.arc || 0, x: mx, y: my });
    });
  };

  // ---------------------------------------------------------------- effects
  const burst = (x, y, color, n = 14, speed = 160) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(.3, 1) * speed;
      fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(.35, .7), max: .7, color, r: rand(1.5, 3.5) });
    }
    rings.push({ x, y, r: 4, v: 160, life: .4, max: .4, color, w: 3 });
  };
  const hitBike = (x, y, color) => {
    burst(x, y, color, 16, 180);
    if (invuln > 0 || roarT >= 0 || (squadT >= 0 && squadT < T_BACK + .3) || state !== "play") return;
    hp -= 1; invuln = .7; shake = reduced ? 0 : 9;
    floatText(BIKE_X, GROUND - 150, "-1", "#ff4d5e");
    if (hp <= 0) gameOver();
    else if (hp <= 2 && !rescueUsed && squadT < 0) { rescueUsed = true; squadCool = 0; callSquad("rescue"); }
    syncHud();
  };
  const kill = (e, byRoar) => {
    if (e.dead) return;
    e.dead = true; e.deadT = 0;
    const pts = e.kind === "rider" ? 75 : e.T.pts;
    score += pts;
    if (!byRoar) meter = Math.min(100, meter + (e.kind === "rider" ? 7 : 13));
    const [cx, cy] = e.kind === "rider" ? [e.x, GROUND - 60 + e.y] : dragonCenter(e);
    burst(cx, cy, e.kind === "rider" ? "#ff4d5e" : e.T.stroke, 20, 220);
    floatText(cx, cy - 20, `+${pts}`, e.kind === "rider" ? "#ffb3ba" : e.T.stroke);
    e.vx = (cx < BIKE_X ? -1 : 1) * rand(220, 360); e.vy = rand(-260, -120); e.spin = rand(-8, 8);
    syncHud();
  };

  const roar = () => {
    if (state !== "play" || meter < 100 || roarT >= 0) return;
    meter = 0; doRoar(null);
  };
  const doRoar = (origin, words = "NIGHT FURYYYY!") => {
    const [ox, oy] = origin || [fury.x + fury.face * 146 * .5, fury.y];
    roarT = 0; flashA = .9; shake = reduced ? 0 : 12;
    if (window.nfSfx) window.nfSfx.roar();
    if (words) texts.push({ x: W / 2, y: 225, text: words, life: 1.6, max: 1.6, color: "#ffffff", stroke: "#1ef58f", size: 58, font: "Cinzel,serif", weight: 900, jitter: 3 });
    [0, .18, .38].forEach((d, i) => rings.push({ x: ox, y: oy, r: 0, v: 1150, life: 1.2, max: 1.2, delay: d,
      color: i === 1 ? "#19e3f2" : "#a45cff", w: 16, roar: true }));
    syncHud();
  };

  // ---------------------------------------------------------------- the Cycling Squad of Unity
  // HELP! -> they come without a second thought, no fear of dragons, and stand by
  // the master's side -> build walls, help the injured Night Fury cycle -> the cycle
  // becomes the Night Fury, blesses their cycles, and its roar forms the shield that
  // keeps them all secure. Also comes on its own, once a game, when the bike is
  // down to 2 hearts.
  const SQUAD = [
    { color: "#19e3f2", from: -90, to: 262, enter: 1 }, { color: "#ffb020", from: -190, to: 196, enter: 1 },
    { color: "#a45cff", from: W + 90, to: 638, enter: -1 }, { color: "#ff5a8a", from: W + 190, to: 704, enter: -1 }
  ];
  const DOME = { rx: 340, ry: 290 };
  const SQUAD_LEN = 15.7, SQUAD_COOL = 40;
  const MASTER_HEAD = [471, 251];
  const T_WARN = 1.5, T_REPLY = 3.1, T_WALLS = 3.7, T_FIX = 4.7, T_MORPH = 5.7, T_BLESS = 6.2, T_ROAR = 7.2, T_UNITY = 8.1, T_BACK = 13.9;
  const DRAGON_MOUTH = [BIKE_X + 218 * .9, GROUND - 118 * .9];
  const wallsAlpha = () => squadT < 0 ? 0 : Math.min(clamp((squadT - T_WALLS) / .6, 0, 1), clamp((T_BACK + .6 - squadT) / .6, 0, 1));
  const domeAlpha = () => squadT < 0 ? 0 : Math.min(clamp((squadT - T_ROAR - .1) / .5, 0, 1), clamp((T_BACK + .6 - squadT) / .6, 0, 1));
  const shieldAlpha = () => Math.max(wallsAlpha() * .6, domeAlpha());
  const shieldUp = () => squadT >= T_WALLS && squadT < T_BACK + .3;
  const inDome = (x, y) => ((x - BIKE_X) / DOME.rx) ** 2 + ((y - GROUND) / DOME.ry) ** 2 < 1;
  const dragonForm = () => squadT >= T_MORPH && squadT < T_BACK;
  const say = (x, y, text, color, life = 2, size = 13) =>
    texts.push({ x, y, text, life, max: life, color, size, font: "'JetBrains Mono',monospace", weight: 700 });
  const morphFlash = () => { flashA = .8; burst(BIKE_X, GROUND - 70, "#1ef58f", 30, 260); };

  const callSquad = why => {
    if (state !== "play" || squadCool > 0 || squadT >= 0) return;
    squadT = 0; squadCool = SQUAD_COOL;
    friends = SQUAD.map((f, i) => ({ ...f, x: f.from, face: f.enter, fireAt: T_ROAR + .6 + i * .2, blessed: 0 }));
    texts.push({ x: MASTER_HEAD[0], y: 196, text: "HELP!", life: 1.5, max: 1.5, color: "#ffffff", stroke: "#ff4d5e", size: 54, font: "Cinzel,serif", weight: 900, jitter: 3 });
    say(MASTER_HEAD[0], 150, why === "rescue" ? "AADHI IS HURT — THE SQUAD RIDES IN" : "AADHI — THE MASTER", why === "rescue" ? "#ff8a95" : "#00FF87", 2.2);
    shake = reduced ? 0 : 4;
    syncHud();
  };

  const updateSquad = dt => {
    squadCool = Math.max(0, squadCool - dt);
    const shown = Math.ceil(squadCool);
    if (shown !== lastCoolShown) { lastCoolShown = shown; syncHud(); }
    if (squadT < 0) return;
    const before = squadT;
    squadT += dt;
    const at = k => before < k && squadT >= k;

    if (at(.5)) say(W / 2, 205, "No second thought. No fear of dragons. They came.", "#F8FAFC", 1.0, 15);
    if (at(T_WARN)) {                                                  // the master tries to send them away
      texts.push({ x: W / 2, y: 182, text: "“It's dangerous — life or death. I'll handle it.", life: 1.7, max: 1.7, color: "#F8FAFC", size: 17, font: "Cinzel,serif", weight: 900 });
      texts.push({ x: W / 2, y: 208, text: "I don't want my friends to die.” — Aadhi", life: 1.7, max: 1.7, color: "#ff8a95", size: 17, font: "Cinzel,serif", weight: 900 });
    }
    if (at(T_REPLY)) {                                                 // they stay
      texts.push({ x: W / 2, y: 182, text: "“We're here to help you, Aadhi.", life: 2.6, max: 2.6, color: "#F8FAFC", size: 17, font: "Cinzel,serif", weight: 900 });
      texts.push({ x: W / 2, y: 208, text: "You're our friend — and we don't forget it.”", life: 2.6, max: 2.6, color: "#00FF87", size: 17, font: "Cinzel,serif", weight: 900 });
    }
    if (at(T_WALLS)) say(W / 2, 232, "They stand by his side and build the walls", "#00FF87", 1.6);
    if (at(T_FIX)) {
      say(W / 2, 232, "They help the injured Night Fury cycle", "#00FF87", 1.4);
      for (let k = 0; k < 18; k++) fx.push({ x: BIKE_X + rand(-70, 70), y: GROUND - rand(10, 110), vx: rand(-20, 20), vy: rand(-90, -30), life: rand(.6, 1.1), max: 1.1, color: "#00FF87", r: rand(1.5, 3) });
      if (hp < 5) { hp += 1; floatText(BIKE_X, GROUND - 160, "+1 cycle healed", "#00FF87"); syncHud(); }
    }
    if (at(T_MORPH)) { morphFlash(); say(W / 2, 150, "The cycle becomes the Night Fury", "#19e3f2", 1.6, 15); }
    if (at(T_BLESS)) say(W / 2, 176, "…and it blesses their cycles", "#a45cff", 1.6, 14);
    if (squadT > T_BLESS && squadT < T_BLESS + .8) {
      // streams of blessing from the dragon to every friend's bike
      friends.forEach(f => {
        if (Math.random() < .6) {
          const x0 = BIKE_X + 60, y0 = GROUND - 120, x1 = f.x, y1 = GROUND - 50, k = rand(.1, .9);
          fx.push({ x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 60, vx: (x1 - x0) * .6, vy: (y1 - y0) * .6, life: .35, max: .35, color: pick(["#a45cff", "#19e3f2", "#1ef58f"]), r: rand(1.5, 3) });
        }
        f.blessed = Math.min(1, f.blessed + dt / .8);
      });
    }
    if (at(T_ROAR)) { doRoar(DRAGON_MOUTH, null); say(W / 2, 150, "Its roar forms the shield", "#1ef58f", 1.6, 15); }
    if (at(T_UNITY)) {
      texts.push({ x: W / 2, y: 250, text: "THE CYCLING SQUAD OF UNITY", life: 2.8, max: 2.8, color: "#F8FAFC", stroke: "#1ef58f", size: 40, font: "Cinzel,serif", weight: 900 });
      say(W / 2, 290, "All of us — secure in it.", "#94A3B8", 2.6, 14);
    }
    if (at(T_BACK)) morphFlash();

    friends.forEach(f => {
      if (squadT < T_BACK + .4) {
        const p = 1 - Math.pow(1 - clamp(squadT / 1.4, 0, 1), 3);
        f.x = f.from + (f.to - f.from) * p;
        f.face = p < 1 ? f.enter : (f.x < BIKE_X ? -1 : 1);       // arrived: stand by him, facing the danger
      } else { f.face = -f.enter; f.x += f.face * 260 * dt; }       // ride home together
      // blessed cycles fight back: headlight beams at the nearest attacker
      if (squadT > T_ROAR + .5 && squadT < T_BACK) {
        f.fireAt -= dt;
        if (f.fireAt <= 0) {
          f.fireAt = .75;
          const hx = f.x + f.face * 46, hy = GROUND - 68;
          let best = null, bd = 1e9;
          enemies.forEach(e => {
            if (e.dead) return;
            const [cx, cy] = e.kind === "rider" ? [e.x, GROUND - 60] : dragonCenter(e);
            const d = Math.hypot(cx - hx, cy - hy);
            if (d < bd) { bd = d; best = { e, cx, cy }; }
          });
          if (best) {
            fx.push({ beam: true, x0: hx, y0: hy, x1: best.cx, y1: best.cy, life: .2, max: .2, color: f.color });
            if (best.e.kind === "dragon") { best.e.hp -= 1; best.e.flash = .12; if (best.e.hp <= 0) kill(best.e); }
            else kill(best.e);
          }
        }
      }
    });
    if (squadT >= SQUAD_LEN) { squadT = -1; friends = []; syncHud(); }
  };

  // ---------------------------------------------------------------- lifecycle
  const start = () => { reset(); state = "play"; hud.panel.style.display = "none"; syncHud(); };
  const gameOver = () => {
    state = "over";
    const isBest = score > best;
    if (isBest) { best = score; try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) { /* storage blocked */ } }
    showPanel("over", isBest);
    syncHud();
  };
  const showPanel = (kind, isBest) => {
    const mono = "font:700 11px 'JetBrains Mono',monospace;letter-spacing:.25em;text-transform:uppercase";
    hud.panel.style.display = "flex";
    hud.panel.innerHTML = kind === "ready" ? `
      <div style="max-width:520px">
        <p style="${mono};color:#00FF87;margin:0 0 14px">Your turn</p>
        <h3 style="font-family:Cinzel,serif;font-weight:900;font-size:clamp(1.5rem,4vw,2.6rem);color:#F8FAFC;margin:0;line-height:1.05;text-transform:uppercase">Defend the Nightfury</h3>
        <p style="color:#94A3B8;font-size:clamp(12px,1.6vw,15px);line-height:1.6;margin:16px 0 22px">
          Move to fly the Night Fury. <b style="color:#F8FAFC">Click or tap</b> — hold to keep firing — to blast dragons and rival riders before they hit the bike.
          Fill the <b style="color:#a45cff">Fury meter</b>, then press <b style="color:#F8FAFC">Space</b> or the Night Fury button to roar.
          In trouble? <b style="color:#00FF87">Double-tap the road</b> (or tap 4 times fast, or press <b style="color:#F8FAFC">U</b>) to call Aadhi the Master and the Cycling Squad of Unity — and if the bike gets badly hurt, they come on their own.</p>
        <button data-k="start" class="nfg-btn nfg-go" type="button">▶ Start</button>
        <p style="${mono};color:#64748B;margin:16px 0 0">Best ${best}</p>
      </div>` : `
      <div style="max-width:520px">
        <p style="${mono};color:#ff4d5e;margin:0 0 14px">The bike took five hits</p>
        <h3 style="font-family:Cinzel,serif;font-weight:900;font-size:clamp(1.6rem,4.5vw,3rem);color:#F8FAFC;margin:0;line-height:1">${score}</h3>
        <p style="${mono};color:#94A3B8;margin:10px 0 0">Wave ${wave} · ${isBest ? '<span style="color:#00FF87">New best!</span>' : "Best " + best}</p>
        <p style="font-family:Cinzel,serif;font-weight:900;font-size:clamp(1rem,2.6vw,1.6rem);color:#00FF87;margin:22px 0 22px;text-transform:uppercase">Start anywhere. Stop nowhere.</p>
        <button data-k="start" class="nfg-btn nfg-go" type="button">↻ Start again</button>
      </div>`;
    q("start").addEventListener("click", start);
  };

  // ---------------------------------------------------------------- input
  const toLogical = ev => {
    const r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
  };
  const onMove = ev => { if (state === "play") aim = toLogical(ev); };
  const onDown = ev => {
    if (state !== "play") return;
    aim = toLogical(ev); firing = true; fireCool = 0;
    const now = performance.now();
    taps = taps.filter(t => now - t.at < 900); taps.push({ at: now, road: aim.y > GROUND - 14 });
    const roadTaps = taps.filter(t => t.road && now - t.at < 350);
    if (roadTaps.length >= 2 || taps.length >= 4) { taps = []; callSquad(); }
    if (canvas.setPointerCapture) try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  };
  const onUp = () => { firing = false; };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  hud.roar.addEventListener("click", roar);
  hud.squad.addEventListener("click", () => callSquad());
  const sfxBtn = q("sfx");
  const showSfx = on => { sfxBtn.textContent = on ? "SFX on" : "SFX off"; sfxBtn.setAttribute("aria-pressed", String(on)); sfxBtn.style.opacity = on ? "1" : ".55"; };
  let offSfx = null;
  if (window.nfSfx) {
    showSfx(window.nfSfx.enabled);
    offSfx = window.nfSfx.onChange(showSfx);
    sfxBtn.addEventListener("click", () => window.nfSfx.setEnabled(!window.nfSfx.enabled));
  } else sfxBtn.style.display = "none";
  let inView = false;
  const onKey = ev => {
    if (!inView) return;
    if (ev.code === "Space" && state === "play") { ev.preventDefault(); roar(); }
    if (ev.code === "KeyU" && state === "play") { ev.preventDefault(); callSquad(); }
    if (ev.code === "Enter" && state !== "play") { ev.preventDefault(); start(); }
  };
  window.addEventListener("keydown", onKey);

  const firePlasma = () => {
    const mx = fury.x + fury.face * 146 * .5, my = fury.y - 1;
    let dx = aim.x - mx, dy = aim.y - my, d = Math.hypot(dx, dy);
    if (d < 30) { dx = fury.face; dy = 0; d = 1; }
    plasmas.push({ x: mx, y: my, vx: dx / d * 900, vy: dy / d * 900, life: 1.4 });
    if (window.nfSfx) window.nfSfx.plasma();
  };

  // ---------------------------------------------------------------- update
  const update = dt => {
    time += dt;
    updateSquad(dt);
    // waves
    waveT += dt;
    if (waveT > 22) {
      waveT = 0; wave += 1;
      banner(`WAVE ${wave}`);
      if (hp < 5) { hp += 1; floatText(BIKE_X, GROUND - 150, "+1 bike repaired", "#00FF87"); }
      if (UNLOCK[wave - 1]) texts.push({ x: W / 2, y: 290, text: `${UNLOCK[wave - 1].map(k => TYPES[k].name).join(" · ")} incoming`, life: 2, max: 2, color: "#94A3B8", size: 13, font: "'JetBrains Mono',monospace", weight: 700 });
      syncHud();
    }
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = Math.max(.6, 2.2 - wave * .22) * rand(.7, 1.3); }

    // player
    fury.x += (clamp(aim.x, 80, 820) - fury.x) * Math.min(1, dt * 3.2);
    fury.y = 130 + Math.sin(time * 2.2) * 8;
    if (aim.x - fury.x > 24) fury.face = 1; else if (fury.x - aim.x > 24) fury.face = -1;
    fireCool -= dt;
    if (firing && fireCool <= 0) { firePlasma(); fireCool = .2; }
    invuln = Math.max(0, invuln - dt);
    shake = Math.max(0, shake - dt * 30);
    flashA = Math.max(0, flashA - dt * 1.6);

    // plasma
    plasmas = plasmas.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) return false;
      for (const e of enemies) {
        if (e.dead) continue;
        if (e.kind === "dragon") {
          const [cx, cy] = dragonCenter(e);
          if (Math.hypot(p.x - cx, p.y - cy) < dragonRadius(e)) {
            e.hp -= 1; e.flash = .12; burst(p.x, p.y, "#c9a6ff", 6, 120);
            if (e.hp <= 0) kill(e); else floatText(cx, cy - 26, "hit", e.T.stroke);
            return false;
          }
        } else if (Math.abs(p.x - e.x) < 40 && p.y > GROUND - 125 && p.y < GROUND) { kill(e); return false; }
      }
      for (const s of shots) {
        if (!s.dead && Math.hypot(p.x - s.x, p.y - s.y) < s.r + 8) {
          s.dead = true; score += 10; meter = Math.min(100, meter + 2);
          burst(s.x, s.y, s.color, 8, 110); floatText(s.x, s.y - 12, "+10", s.color); syncHud();
          return false;
        }
      }
      return true;
    });

    // enemies
    enemies.forEach(e => {
      if (e.dead) {
        e.deadT += dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 700 * dt;
        return;
      }
      if (e.kind === "rider") {
        e.x += e.dir * e.speed * dt;
        if (shieldUp() && Math.abs(e.x - BIKE_X) < DOME.rx + 10) { kill(e); floatText(e.x, GROUND - 140, "stopped by the squad", "#00FF87"); return; }
        if (Math.abs(e.x - BIKE_X) < 118) {
          hitBike(BIKE_X + e.dir * -40, GROUND - 60, "#ff4d5e");
          floatText(e.x, GROUND - 140, "grabbed the bike!", "#ffb3ba");
          e.dead = true; e.deadT = 0; e.vx = -e.dir * 260; e.vy = -200; e.spin = rand(-6, 6);
        }
        return;
      }
      const T = e.T;
      e.phase += dt * 2 * Math.PI * (T.hz || 1.6);
      e.flash = Math.max(0, e.flash - dt);
      e.retarget -= dt;
      if (e.retarget <= 0) { e.tx = rand(110, 790); e.ty = rand(60, 290); e.retarget = rand(3, 5); }
      const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
      if (d > 4) { const v = Math.min(T.speed, d * 2); e.x += dx / d * v * dt; e.y += dy / d * v * dt; }
      const onStage = e.x > 30 && e.x < W - 30;
      if (e.charge >= 0) {
        e.charge -= dt;
        if (e.charge < 0) {
          const [mx, my] = mouthsOf(e)[0];
          let [tx, ty] = bikeTarget();
          if (shieldUp()) { const a = Math.atan2(my - GROUND, mx - BIKE_X); tx = BIKE_X + Math.cos(a) * DOME.rx; ty = GROUND + Math.sin(a) * DOME.ry; }
          fx.push({ bolt: true, x0: mx, y0: my, x1: tx, y1: ty, life: .22, max: .22, color: T.color, seed: Math.random() });
          hitBike(tx, ty, T.color);
          e.fireAt = rand(...T.every) * Math.max(.55, 1 - .08 * (wave - 1));
        }
      } else if (onStage) {
        e.fireAt -= dt;
        if (e.fireAt <= 0) { fireEnemy(e); e.fireAt = rand(...T.every) * Math.max(.55, 1 - .08 * (wave - 1)); }
      }
    });
    enemies = enemies.filter(e => !(e.dead && (e.deadT > 1.6 || e.y > H + 120)));

    // enemy shots
    shots = shots.filter(s => {
      if (s.dead) return false;
      s.t += dt;
      const p = Math.min(1, s.t / s.dur);
      s.x = s.x0 + (s.x1 - s.x0) * p; s.y = s.y0 + (s.y1 - s.y0) * p - s.arc * 4 * p * (1 - p);
      if (shieldUp() && (domeAlpha() > .5 ? inDome(s.x, s.y) : Math.abs(Math.abs(s.x - BIKE_X) - DOME.rx * .96) < 16 && s.y > GROUND - 150)) { burst(s.x, s.y, "#00FF87", 8, 120); return false; }
      if (p >= 1) { hitBike(s.x1, s.y1, s.type === "gas" ? "#ffe45a" : s.color); return false; }
      return true;
    });

    // roar shockwaves sweep everything away
    if (roarT >= 0) {
      roarT += dt;
      if (roarT > 1.6) roarT = -1;
      syncHud();
    }
    rings.forEach(r => {
      if (r.delay > 0) { r.delay -= dt; return; }
      r.r += r.v * dt; r.life -= dt;
      if (r.roar) {
        enemies.forEach(e => {
          if (e.dead) return;
          const [cx, cy] = e.kind === "rider" ? [e.x, GROUND - 60] : dragonCenter(e);
          if (Math.hypot(cx - r.x, cy - r.y) < r.r) kill(e, true);
        });
        shots.forEach(s => { if (!s.dead && Math.hypot(s.x - r.x, s.y - r.y) < r.r) { s.dead = true; burst(s.x, s.y, s.color, 6, 90); } });
      }
    });
    rings = rings.filter(r => r.life > 0);
    fx = fx.filter(p => { p.life -= dt; if (!p.bolt && !p.beam) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; } return p.life > 0; });
    texts = texts.filter(t => (t.life -= dt) > 0);
  };

  // ---------------------------------------------------------------- draw
  const glow = (c, b) => { ctx.shadowColor = c; ctx.shadowBlur = b; };
  const fs = (p, fill, stroke, lw) => {
    if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
    if (stroke) { ctx.strokeStyle = stroke; if (lw) ctx.lineWidth = lw; ctx.stroke(p); }
  };
  const dot = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };

  const drawDragon = e => {
    const T = e.T, f = e.dead ? (e.face || faceOf(e)) : faceOf(e);
    e.face = f;
    const stroke = e.flash > 0 ? "#ffffff" : T.stroke;
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.dead) { ctx.rotate(e.deadT * e.spin); ctx.globalAlpha = Math.max(0, 1 - e.deadT / 1.2); }
    ctx.scale(f * T.scale, T.scale);
    ctx.lineJoin = ctx.lineCap = "round"; ctx.lineWidth = 2.4;
    glow(stroke, 8);
    const flap = .3 + .7 * Math.cos(e.phase);
    ctx.save(); ctx.globalAlpha *= .45; ctx.translate(0, -8); ctx.scale(1, flap); ctx.translate(0, 8); fs(S.wingFar, T.fill, stroke); ctx.restore();
    if (T.round) {
      fs(S.gTail, null, stroke); fs(S.gFin, T.fill, stroke);
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 26, 0, 0, 7); ctx.fillStyle = T.fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke();
      fs(S.gHead, T.fill, stroke); dot(46, -12, 2.4, T.acc); fs(S.gLegs, null, stroke); fs(S.gSpikes, null, T.acc);
    } else {
      fs(S.tail, null, stroke); fs(S.fin, T.fill, stroke); fs(S.body, T.fill, stroke);
      fs(S.neck, null, stroke, 7); fs(S.neck, null, T.fill, 3); ctx.lineWidth = 2.4;
      fs(S.head, T.fill, stroke); dot(78, -28, 2.2, T.acc);
      if (T.heads === 2) { fs(S.neck2, null, stroke, 7); fs(S.neck2, null, T.fill, 3); ctx.lineWidth = 2.4; fs(S.head2, T.fill, stroke); dot(80, 6, 2.2, T.acc); }
      if (T.spikes) fs(S.spikes, null, T.acc); if (T.crest) fs(S.crest, null, T.acc); if (T.horns) fs(S.horns, T.fill, T.acc);
      fs(S.legs, null, stroke);
    }
    ctx.save(); ctx.translate(0, -8); ctx.scale(1, flap); ctx.translate(0, 8); fs(S.wingNear, T.fill, stroke); ctx.restore();
    // Skrill charging a bolt — shoot it before it lands
    if (e.charge >= 0 && !e.dead) {
      const k = 1 - e.charge / .8;
      ctx.globalAlpha = .5 + .5 * Math.sin(time * 40); glow(T.color, 20);
      dot(96, -22, 4 + 10 * k, T.color);
    }
    ctx.restore();
    ctx.shadowBlur = 0;
  };

  const drawRider = e => {
    ctx.save();
    ctx.translate(e.x, GROUND + e.y + (e.dead ? 0 : -Math.abs(Math.sin(time * 7 + e.bob)) * 1.5));
    if (e.dead) { ctx.globalAlpha = Math.max(0, 1 - e.deadT / 1.2); ctx.translate(0, -60); ctx.rotate(e.deadT * e.spin); ctx.translate(0, 60); }
    ctx.scale(e.dir === 1 ? -1 : 1, 1);
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.strokeStyle = "#4a525c"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(-30, -22, 21, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(34, -22, 21, 0, 7); ctx.stroke();
    fs(S.rFrame, null, "#5a2a30", 3); fs(S.rBody, null, "#2c3238", 8);
    ctx.beginPath(); ctx.arc(-10, -114, 10, 0, 7); ctx.fillStyle = "#0f1215"; ctx.fill(); ctx.strokeStyle = "#2c3238"; ctx.lineWidth = 3; ctx.stroke();
    fs(S.rArms, null, "#2c3238", 5);
    glow("#ff4d5e", 12); dot(-36, -60, 4, "#ff4d5e"); dot(-16, -116, 1.8, "#ff4d5e"); ctx.shadowBlur = 0;
    ctx.restore();
  };

  const drawRiderParts = armUp => {
    fs(S.legFar, null, "#3b444d", 7);
    fs(armUp ? S.armUp : S.armRest, null, "#9aa4ad", 6);
    fs(S.torso, null, "#e8ecef", 9);
    ctx.beginPath(); ctx.arc(421, 279, 12, 0, 7); ctx.fillStyle = "#0f1215"; ctx.fill(); ctx.strokeStyle = "#e8ecef"; ctx.lineWidth = 3; ctx.stroke();
    fs(S.cap, null, "#1ef58f", 3); fs(S.legNear, null, "#c9d1d8", 8); fs(S.armBar, null, "#e8ecef", 6);
  };
  const drawCycleDragon = () => {
    const grow = clamp((squadT - T_MORPH) / .5, 0, 1), sc = .9 * (.72 + .28 * (1 - Math.pow(1 - grow, 3)));
    const roaring = squadT >= T_ROAR - .1 && squadT < T_ROAR + 1;
    ctx.save();
    ctx.translate(BIKE_X, GROUND); ctx.scale(sc, sc);
    ctx.lineJoin = ctx.lineCap = "round";
    glow("#19e3f2", 12); ctx.lineWidth = 3;
    ctx.save(); ctx.globalAlpha = .5; fs(S.gWingFar, "#07080a", "#19e3f2", 2); ctx.restore();
    ctx.lineWidth = 3;
    fs(S.gTail, null, "#19e3f2"); fs(S.gFin1, "#07080a", "#19e3f2", 2); fs(S.gFin2, "#07080a", "#ff4d5e", 2);
    fs(S.gLegs4, null, "#19e3f2", 3); fs(S.gBody, "#07080a", "#19e3f2", 3); fs(S.gBack, null, "#a45cff", 2.2);
    fs(S.gNeck, null, "#19e3f2", 10); fs(S.gNeck, null, "#07080a", 6);
    ctx.save();
    if (roaring) { ctx.translate(146, -118); ctx.rotate(-.15); ctx.translate(-146, 118); }
    fs(S.gEar1, "#07080a", "#a45cff", 2.2); fs(S.gEar2, "#07080a", "#a45cff", 2.2);
    ctx.save(); if (roaring) { ctx.translate(150, -110); ctx.rotate(.38); ctx.translate(-150, 110); } fs(S.gJaw, "#07080a", "#19e3f2", 2.4); ctx.restore();
    fs(S.gHead, "#07080a", "#19e3f2", 3); glow("#1ef58f", 10); fs(S.gEye, "#0d3b22", "#1ef58f", 2);
    if (roaring) { glow("#a45cff", 30); dot(220, -118, 14 + Math.sin(time * 40) * 4, "#e0ccff"); }
    ctx.restore();
    glow("#19e3f2", 12); fs(S.gWing, "#07080a", "#19e3f2", 3);
    ctx.restore(); ctx.shadowBlur = 0;
    // the master, riding it
    ctx.save(); ctx.translate(80, -32); ctx.lineJoin = ctx.lineCap = "round"; drawRiderParts(squadT < T_ROAR + 1 && squadT > T_ROAR - .3); ctx.restore();
  };
  const drawBike = () => {
    if (squadT >= 0 && dragonForm()) { drawCycleDragon(); return; }
    ctx.save();
    if (invuln > 0 && Math.sin(time * 50) > 0) ctx.globalAlpha = .45;
    ctx.translate(50, -28);
    ctx.lineJoin = ctx.lineCap = "round";
    const wheel = cx => { ctx.strokeStyle = "#e8ecef"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, 452, 46, 0, 7); ctx.stroke();
      ctx.strokeStyle = "#5b6570"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, 452, 40, 0, 7); ctx.stroke(); };
    wheel(320); wheel(480);
    glow("#19e3f2", 8); ctx.strokeStyle = "#19e3f2"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(390, 456, 15, 0, 7); ctx.stroke();
    glow("#1ef58f", 10); fs(S.frame, null, "#1ef58f", 3.2); ctx.shadowBlur = 0;
    fs(S.fork, null, "#e8ecef", 3); fs(S.saddle, null, "#e8ecef", 4);
    drawRiderParts((roarT >= 0 && roarT < 1.3) || (squadT >= 0 && squadT < 1.6));
    ctx.restore();
  };

  const drawFriend = f => {
    ctx.save();
    const riding = squadT < 1.4 || squadT > T_BACK + .4;
    ctx.translate(f.x, GROUND - (riding ? Math.abs(Math.sin(time * 8 + f.to)) * 1.5 : 0));
    ctx.scale(f.face * .5, .5); ctx.translate(-400, -498);
    ctx.lineJoin = ctx.lineCap = "round";
    const wheel = cx => { ctx.strokeStyle = "#e8ecef"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, 452, 46, 0, 7); ctx.stroke(); };
    wheel(320); wheel(480);
    if (f.blessed > 0) {                                              // the Night Fury's blessing on their cycle
      ctx.save(); ctx.globalAlpha = f.blessed * (.55 + .25 * Math.sin(time * 6 + f.to));
      glow("#a45cff", 26); fs(S.frame, null, "#a45cff", 9); ctx.restore();
    }
    glow(f.color, 10); fs(S.frame, null, f.color, 3.4); ctx.shadowBlur = 0;
    fs(S.fork, null, "#e8ecef", 3); fs(S.saddle, null, "#e8ecef", 4);
    fs(S.legFar, null, "#3b444d", 7); fs(S.armRest, null, "#9aa4ad", 6); fs(S.torso, null, "#e8ecef", 9);
    ctx.beginPath(); ctx.arc(421, 279, 12, 0, 7); ctx.fillStyle = "#0f1215"; ctx.fill(); ctx.strokeStyle = "#e8ecef"; ctx.lineWidth = 3; ctx.stroke();
    fs(S.cap, null, f.color, 3); fs(S.legNear, null, "#c9d1d8", 8); fs(S.armBar, null, "#e8ecef", 6);
    glow(f.color, 16); dot(494, 360, 5, "#ffffff");                  // headlight
    ctx.restore(); ctx.shadowBlur = 0;
  };
  const drawShield = () => {
    const wa = wallsAlpha(), da = domeAlpha();
    if (wa <= 0 && da <= 0) return;
    ctx.save();
    glow("#00FF87", 22); ctx.strokeStyle = "#00FF87";
    // the walls the friends build, either side of the squad
    if (wa > 0) {
      const rise = clamp((squadT - T_WALLS) / .8, 0, 1);
      ctx.globalAlpha = wa; ctx.lineWidth = 8; ctx.fillStyle = "rgba(0,255,135,0.10)";
      [-1, 1].forEach(sd => {
        const x = BIKE_X + sd * DOME.rx * .96;
        ctx.fillRect(x - 12, GROUND - 150 * rise, 24, 150 * rise); ctx.strokeRect(x - 12, GROUND - 150 * rise, 24, 150 * rise);
        for (let yb = GROUND - 30; yb > GROUND - 150 * rise; yb -= 30) { ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 12, yb); ctx.lineTo(x + 12, yb); ctx.stroke(); }
        ctx.lineWidth = 8;
      });
    }
    // the roar's shield: a dome joining the walls over all of them
    if (da > 0) {
      const grow = clamp((squadT - T_ROAR - .1) / .5, 0, 1);
      ctx.globalAlpha = da; ctx.lineWidth = 3; ctx.fillStyle = "rgba(0,255,135,0.07)";
      ctx.beginPath(); ctx.ellipse(BIKE_X, GROUND, DOME.rx, Math.max(1, DOME.ry * grow), 0, Math.PI, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = da * .3; ctx.lineWidth = 1;
      for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.ellipse(BIKE_X, GROUND, DOME.rx * k / 5, Math.max(1, DOME.ry * grow), 0, Math.PI, 2 * Math.PI); ctx.stroke(); }
    }
    ctx.restore(); ctx.shadowBlur = 0;
  };

  const drawFury = () => {
    const s = .5;
    ctx.save();
    ctx.translate(fury.x, fury.y);
    ctx.scale(fury.face * s, s);
    ctx.lineJoin = ctx.lineCap = "round";
    const flap = .3 + .7 * Math.cos(time * 2 * Math.PI * 1.1);
    glow("#19e3f2", 10); ctx.lineWidth = 3;
    ctx.save(); ctx.globalAlpha = .45; ctx.translate(0, -8); ctx.scale(1.5, 1.55 * flap); ctx.translate(0, 8); fs(S.fWing, "#07080a", "#19e3f2"); ctx.restore();
    ctx.lineWidth = 3;
    fs(S.fTail, null, "#19e3f2"); fs(S.fFin1, "#07080a", "#19e3f2"); fs(S.fFin2, "#07080a", "#ff4d5e");
    fs(S.fBody, "#07080a", "#19e3f2"); fs(S.fSpikes, null, "#a45cff");
    fs(S.fEar1, "#07080a", "#a45cff"); fs(S.fEar2, "#07080a", "#a45cff");
    fs(S.fHead, "#07080a", "#19e3f2"); glow("#1ef58f", 8); fs(S.fEye, "#0d3b22", "#1ef58f", 2);
    ctx.fillStyle = "#020302"; ctx.beginPath(); ctx.ellipse(112, -10.5, 1.4, 4.2, 0, 0, 7); ctx.fill();
    glow("#19e3f2", 10); ctx.lineWidth = 3;
    ctx.save(); ctx.translate(0, -6); ctx.scale(1.5, 1.55 * flap); ctx.translate(0, 6); fs(S.fWing, "#07080a", "#19e3f2"); ctx.restore();
    if (roarT >= 0 && roarT < .9) { glow("#a45cff", 30); dot(146, -2, 14 + Math.sin(time * 40) * 4, "#e0ccff"); }
    ctx.restore(); ctx.shadowBlur = 0;
  };

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);
    const sx = shake ? rand(-shake, shake) : 0, sy = shake ? rand(-shake, shake) : 0;
    ctx.setTransform(scale, 0, 0, scale, sx * scale, sy * scale);
    if (!enemies) { drawBike(); return; }

    enemies.forEach(e => { if (e.kind === "rider") drawRider(e); });
    drawBike();
    friends.forEach(drawFriend);
    drawShield();
    enemies.forEach(e => { if (e.kind === "dragon") drawDragon(e); });

    shots.forEach(s => {
      glow(s.color, 16);
      if (s.type === "gas") { ctx.globalAlpha = .55; dot(s.x, s.y, 8 + 12 * Math.min(1, s.t / s.dur), s.color); ctx.globalAlpha = 1; }
      else if (s.type === "lava") { dot(s.x, s.y, 8, "#3a1206"); ctx.strokeStyle = "#ff8a3c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, 7); ctx.stroke(); }
      else dot(s.x, s.y, s.type === "spark" ? 4 : 7, s.color);
    });
    ctx.shadowBlur = 0;

    drawFury();

    glow("#a45cff", 16);
    plasmas.forEach(p => {
      ctx.strokeStyle = "rgba(164,92,255,.55)"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.x - p.vx * .04, p.y - p.vy * .04); ctx.lineTo(p.x, p.y); ctx.stroke();
      dot(p.x, p.y, 6, "#f0e6ff");
    });

    fx.forEach(p => {
      const a = Math.max(0, p.life / p.max);
      if (p.beam) {
        glow(p.color, 14); ctx.strokeStyle = p.color; ctx.lineWidth = 4 * a; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.moveTo(p.x0, p.y0); ctx.lineTo(p.x1, p.y1); ctx.stroke(); ctx.globalAlpha = 1;
        return;
      }
      if (p.bolt) {
        glow(p.color, 18); ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.moveTo(p.x0, p.y0);
        for (let k = 1; k < 7; k++) ctx.lineTo(p.x0 + (p.x1 - p.x0) * k / 7 + (Math.sin(p.seed * 99 + k * 7.3) * 26), p.y0 + (p.y1 - p.y0) * k / 7);
        ctx.lineTo(p.x1, p.y1); ctx.stroke(); ctx.globalAlpha = 1;
        return;
      }
      glow(p.color, 8); ctx.globalAlpha = a; dot(p.x, p.y, p.r, p.color); ctx.globalAlpha = 1;
    });
    rings.forEach(r => {
      if (r.delay > 0) return;
      const a = Math.max(0, r.life / r.max);
      glow(r.color, 18); ctx.globalAlpha = a; ctx.strokeStyle = r.color; ctx.lineWidth = Math.max(1, r.w * a);
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    });
    ctx.shadowBlur = 0;

    texts.forEach(t => {
      const a = Math.min(1, t.life / t.max * 2.2);
      const y = t.y - (t.rise ? (1 - t.life / t.max) * t.rise : 0);
      ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `${t.weight} ${t.size}px ${t.font}`;
      const jx = t.jitter ? rand(-t.jitter, t.jitter) : 0, jy = t.jitter ? rand(-t.jitter, t.jitter) : 0;
      if (t.stroke) { glow(t.stroke, 14); ctx.strokeStyle = t.stroke; ctx.lineWidth = 2; ctx.strokeText(t.text, t.x + jx, y + jy); }
      ctx.fillStyle = t.color; ctx.fillText(t.text, t.x + jx, y + jy);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

    if (flashA > .001) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const g = ctx.createRadialGradient(fury.x, fury.y, 0, fury.x, fury.y, 700);
      const fa = flashA.toFixed(3), fb = (flashA * .6).toFixed(3);      // toFixed: no "1e-7" in a CSS colour
      g.addColorStop(0, `rgba(255,255,255,${fa})`); g.addColorStop(.35, `rgba(164,92,255,${fb})`); g.addColorStop(1, "rgba(164,92,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  };

  // ---------------------------------------------------------------- loop (pauses off-screen / hidden tab)
  let raf = 0, last = 0, dead = false;
  const loop = ts => {
    if (dead) return;
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
    if (state === "play" && inView && !document.hidden) update(dt);
    else if (state !== "play") { time += dt; fury && (fury.y = 130 + Math.sin(time * 2.2) * 8); }
    if (inView) draw();
    raf = requestAnimationFrame(loop);
  };

  let io = null, ro = null;
  if (typeof window.IntersectionObserver === "function") {
    io = new IntersectionObserver(es => { inView = es.some(e => e.isIntersecting); }, { threshold: .15 });
    io.observe(canvas);
  } else inView = true;
  if (typeof window.ResizeObserver === "function") { ro = new ResizeObserver(resize); ro.observe(canvas); }
  else window.addEventListener("resize", resize);

  reset(); texts = []; state = "ready";
  resize();
  showPanel("ready");
  syncHud();
  raf = requestAnimationFrame(loop);

  // test hook: drive the game headlessly
  root.__nfg = {
    start, roar, draw,
    step: (sec, auto) => {
      for (let t = 0; t < sec; t += 1 / 60) {
        if (auto && state === "play") {
          const tgt = enemies.filter(e => !e.dead)[0] || shots[0];
          if (tgt) { aim = { x: tgt.kind === "rider" ? tgt.x : (tgt.x || 450), y: tgt.kind === "rider" ? GROUND - 60 : tgt.y }; firing = true; } else firing = false;
        }
        if (state === "play") update(1 / 60);
      }
      draw();
      return { state, score, wave, hp, meter: Math.round(meter), enemies: enemies.length, shots: shots.length };
    },
    fill: () => { meter = 100; syncHud(); },
    squad: () => callSquad(),
    hurt: n => { for (let i = 0; i < n; i++) { invuln = 0; hitBike(BIKE_X, GROUND - 50, "#ff4d5e"); } },
    squadState: () => ({ squadT: +squadT.toFixed(2), squadCool: Math.round(squadCool), friends: friends.map(f => Math.round(f.x)), shield: +shieldAlpha().toFixed(2), hp })
  };

  return () => {
    dead = true; cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    if (offSfx) offSfx();
    window.removeEventListener("resize", resize);
    if (io) io.disconnect(); if (ro) ro.disconnect();
  };
}

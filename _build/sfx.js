/* ---- Sound effects: plasma + roar, synthesised with Web Audio (merged) ----
   No audio files. One shared AudioContext, created/resumed on the first user
   gesture (browsers block sound before that). window.nfSfx is shared by the
   hero scene, the Defense battle and the mini-game. */
window.nfSfx = window.nfSfx || (() => {
  const KEY = "nf-sfx";
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== "off"; } catch (e) { /* storage blocked */ }
  let ctx = null, master = null, noise = null;
  const listeners = new Set();

  const ensure = () => {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 8;
      master = ctx.createGain(); master.gain.value = .6;
      master.connect(comp).connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const unlock = () => { if (enabled) ensure(); };
  window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  window.addEventListener("keydown", unlock, { capture: true });

  const ready = () => enabled && ensure() && ctx.state !== "closed";
  const env = (g, t, a, peak, hold, rel) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  };
  const noiseSrc = (t, dur) => { const s = ctx.createBufferSource(); s.buffer = noise; s.start(t, Math.random()); s.stop(t + dur); return s; };

  // Plasma: a bright zap sweeping down + a low thump + a tiny crackle
  let lastPlasma = -1;
  const plasma = () => {
    if (!ready()) return;
    const t = ctx.currentTime;
    if (t - lastPlasma < .045) return;          // rapid fire: don't stack clicks
    lastPlasma = t;
    const det = 1 + (Math.random() - .5) * .12;

    const o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(1500 * det, t); o.frequency.exponentialRampToValueAtTime(170 * det, t + .19);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 3;
    bp.frequency.setValueAtTime(2600, t); bp.frequency.exponentialRampToValueAtTime(420, t + .2);
    const g = ctx.createGain(); env(g, t, .004, .9, .03, .2);
    o.connect(bp).connect(g).connect(master); o.start(t); o.stop(t + .26);

    const th = ctx.createOscillator(); th.type = "sine";
    th.frequency.setValueAtTime(130, t); th.frequency.exponentialRampToValueAtTime(48, t + .16);
    const tg = ctx.createGain(); env(tg, t, .004, .8, .03, .17);
    th.connect(tg).connect(master); th.start(t); th.stop(t + .22);

    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3200;
    const ng = ctx.createGain(); env(ng, t, .002, .25, 0, .05);
    noiseSrc(t, .07).connect(hp).connect(ng).connect(master);
  };

  // Roar: shriek on top, a growling throat in the middle, a shockwave rumble underneath
  const roar = () => {
    if (!ready()) return;
    const t = ctx.currentTime;

    // throat: detuned saws with a fast growl LFO on pitch and volume
    const lfo = ctx.createOscillator(); lfo.frequency.value = 27;
    const lfoPitch = ctx.createGain(); lfoPitch.gain.value = 9;
    const lfoAmp = ctx.createGain(); lfoAmp.gain.value = .22;
    lfo.connect(lfoPitch); lfo.connect(lfoAmp);
    const throatLp = ctx.createBiquadFilter(); throatLp.type = "lowpass"; throatLp.Q.value = 5;
    throatLp.frequency.setValueAtTime(420, t); throatLp.frequency.exponentialRampToValueAtTime(1500, t + .25);
    throatLp.frequency.exponentialRampToValueAtTime(260, t + 1.7);
    const throatG = ctx.createGain(); env(throatG, t, .07, .5, .75, .9);
    lfoAmp.connect(throatG.gain);
    [98, 104, 147].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(f * 1.35, t); o.frequency.exponentialRampToValueAtTime(f, t + .3);
      o.frequency.exponentialRampToValueAtTime(f * .62, t + 1.7);
      lfoPitch.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = i === 2 ? .35 : .6;
      o.connect(og).connect(throatLp); o.start(t); o.stop(t + 1.8);
    });
    throatLp.connect(throatG).connect(master);
    lfo.start(t); lfo.stop(t + 1.8);

    // breath: filtered noise riding the same envelope
    const nb = ctx.createBiquadFilter(); nb.type = "bandpass"; nb.Q.value = .8;
    nb.frequency.setValueAtTime(1800, t); nb.frequency.exponentialRampToValueAtTime(380, t + 1.6);
    const ngain = ctx.createGain(); env(ngain, t, .05, .55, .6, 1);
    lfoAmp.connect(ngain.gain);
    noiseSrc(t, 1.8).connect(nb).connect(ngain).connect(master);

    // shriek: the Night Fury's whistle, high and short
    const sh = ctx.createOscillator(); sh.type = "square";
    sh.frequency.setValueAtTime(900, t); sh.frequency.exponentialRampToValueAtTime(1900, t + .12);
    sh.frequency.exponentialRampToValueAtTime(620, t + .55);
    const shf = ctx.createBiquadFilter(); shf.type = "bandpass"; shf.Q.value = 6; shf.frequency.value = 1400;
    const shg = ctx.createGain(); env(shg, t, .02, .12, .12, .4);
    sh.connect(shf).connect(shg).connect(master); sh.start(t); sh.stop(t + .7);

    // shockwave: sub drop that lands just after the roar starts
    const sub = ctx.createOscillator(); sub.type = "sine";
    sub.frequency.setValueAtTime(72, t + .12); sub.frequency.exponentialRampToValueAtTime(26, t + 1.5);
    const sg = ctx.createGain(); sg.gain.setValueAtTime(.0001, t);
    sg.gain.setValueAtTime(.0001, t + .12); sg.gain.exponentialRampToValueAtTime(.9, t + .16);
    sg.gain.exponentialRampToValueAtTime(.0001, t + 1.55);
    sub.connect(sg).connect(master); sub.start(t); sub.stop(t + 1.6);
  };

  return {
    plasma, roar,
    get enabled() { return enabled; },
    setEnabled(v) {
      enabled = !!v;
      try { localStorage.setItem(KEY, enabled ? "on" : "off"); } catch (e) { /* storage blocked */ }
      if (enabled) ensure();
      listeners.forEach(fn => fn(enabled));
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
})();

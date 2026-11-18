/* Canciones de muestra, compuestas y sintetizadas aquí mismo con Web Audio (sin descargar nada).
   Sirven para probar la app antes de añadir música propia. */
(function (root) {
  const SR = 32000;

  function rng(seed) { // mulberry32
    return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function kit(ctx, out) {
    const noise = ctx.createBuffer(1, SR, SR);
    const d = noise.getChannelData(0); const r = rng(7);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;

    const reverb = ctx.createConvolver();
    const ir = ctx.createBuffer(1, SR * 2.6, SR); const id = ir.getChannelData(0); const r2 = rng(11);
    for (let i = 0; i < id.length; i++) id[i] = (r2() * 2 - 1) * Math.pow(1 - i / id.length, 3.2);
    reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.35; reverb.connect(wet).connect(out);

    function env(g, t, peak, a, dur, rel) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.setValueAtTime(peak, t + Math.max(a, dur));
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, dur) + rel);
    }
    return {
      note({ f, t, dur, type = 'sine', vol = 0.2, a = 0.01, rel = 0.25, cut = 0, q = 0.7, send = 0, detune = 0 }) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
        const g = ctx.createGain(); env(g, t, vol, a, dur, rel);
        let n = o;
        if (cut) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; fl.Q.value = q; o.connect(fl); n = fl; }
        n.connect(g); g.connect(out);
        if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(reverb); }
        o.start(t); o.stop(t + Math.max(a, dur) + rel + 0.05);
      },
      kick(t, vol = 0.9) {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
        o.connect(g).connect(out); o.start(t); o.stop(t + 0.4);
      },
      hit(t, { vol = 0.3, dur = 0.12, type = 'highpass', f = 7000, q = 0.8, send = 0 } = {}) {
        const s = ctx.createBufferSource(); s.buffer = noise;
        const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
        const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(fl).connect(g).connect(out);
        if (send) { const sg = ctx.createGain(); sg.gain.value = send; g.connect(sg).connect(reverb); }
        s.start(t, rng(t * 1000 | 0)() * 0.5); s.stop(t + dur + 0.02);
      },
      swell(t, dur, vol) { // ola: ruido grave que sube y baja
        const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
        const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(300, t); fl.frequency.linearRampToValueAtTime(1100, t + dur * 0.45); fl.frequency.linearRampToValueAtTime(250, t + dur);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.45); g.gain.linearRampToValueAtTime(0.0001, t + dur);
        s.connect(fl).connect(g).connect(out); s.start(t); s.stop(t + dur);
      }
    };
  }

  // Cada composición recibe (kit, rng) y devuelve nada: programa sus notas.
  const SONGS = [
    {
      title: 'Amanecer en Barranco', artist: 'Onda · Muestras', album: 'Canciones de muestra', trackNo: 1, bpm: 78, bars: 16,
      art: { a: '#ff9a5a', b: '#5b2a6e', kind: 'sun' },
      play(k, r, beat) {
        const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; // Fmaj7 Em7 Dm7 Cmaj7
        const scale = [60, 62, 64, 67, 69, 72, 74, 76];
        for (let bar = 0; bar < 16; bar++) {
          const t0 = bar * 4 * beat; const ch = chords[bar % 4];
          ch.forEach((m, i) => k.note({ f: hz(m), t: t0 + i * 0.012, dur: 3.6 * beat, type: 'triangle', vol: 0.06, a: 0.04, rel: 0.6, cut: 1400, send: 0.4 }));
          k.note({ f: hz(ch[0] - 12), t: t0, dur: 1.6 * beat, type: 'sine', vol: 0.22, rel: 0.2 });
          k.note({ f: hz(ch[0] - 12), t: t0 + 2.5 * beat, dur: 1.2 * beat, type: 'sine', vol: 0.18, rel: 0.2 });
          for (let b = 0; b < 4; b++) {
            const tb = t0 + b * beat;
            if (b === 0 || b === 2) k.kick(tb, 0.75);
            if (b === 1 || b === 3) k.hit(tb, { vol: 0.22, dur: 0.18, type: 'bandpass', f: 1800, q: 0.9, send: 0.25 });
            k.hit(tb, { vol: 0.05, dur: 0.05 }); k.hit(tb + beat * 0.6, { vol: 0.04, dur: 0.04 }); // corcheas con swing
          }
          if (bar >= 4) {
            let t = t0;
            while (t < t0 + 4 * beat - 0.01) {
              const len = [0.5, 1, 1, 1.5][(r() * 4) | 0] * beat;
              if (r() > 0.25) k.note({ f: hz(scale[(r() * scale.length) | 0]), t, dur: len * 0.7, type: 'sine', vol: 0.1, a: 0.005, rel: 0.4, send: 0.5 });
              t += len;
            }
          }
        }
      }
    },
    {
      title: 'Neón sobre la costa', artist: 'Onda · Muestras', album: 'Canciones de muestra', trackNo: 2, bpm: 108, bars: 24,
      art: { a: '#ff3d8b', b: '#1b1446', kind: 'grid' },
      play(k, r, beat) {
        const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
        const lead = [76, 74, 72, 69, 72, 74, 76, 79, 81, 79, 76, 74, 72, 74, 72, 69];
        for (let bar = 0; bar < 24; bar++) {
          const t0 = bar * 4 * beat; const ch = chords[bar % 4]; const intro = bar < 4;
          for (let s = 0; s < 8; s++) {
            const t = t0 + s * beat / 2;
            k.note({ f: hz(ch[0] - 24 + (s % 2 ? 12 : 0)), t, dur: beat * 0.35, type: 'sawtooth', vol: 0.11, rel: 0.06, cut: 600, q: 4 });
          }
          for (let s = 0; s < 16; s++) {
            const m = ch[s % 3] + (s % 6 >= 3 ? 12 : 0);
            k.note({ f: hz(m), t: t0 + s * beat / 4, dur: beat * 0.18, type: 'square', vol: intro ? 0.025 : 0.04, rel: 0.08, cut: 2200 + 800 * Math.sin(bar), send: 0.25 });
          }
          if (!intro) {
            for (let b = 0; b < 4; b++) {
              const tb = t0 + b * beat;
              k.kick(tb, 0.85);
              if (b % 2) k.hit(tb, { vol: 0.3, dur: 0.22, type: 'bandpass', f: 1500, q: 0.7, send: 0.6 });
              for (let h = 0; h < 4; h++) k.hit(tb + h * beat / 4, { vol: h % 2 ? 0.03 : 0.06, dur: 0.04, f: 9000 });
            }
          }
          if (bar >= 8 && bar < 20) {
            const i = (bar - 8) % 4;
            for (let n = 0; n < 4; n++) k.note({ f: hz(lead[i * 4 + n]), t: t0 + n * beat, dur: beat * 0.85, type: 'sawtooth', vol: 0.05, a: 0.02, rel: 0.3, cut: 3000, send: 0.4, detune: 6 });
          }
          ch.forEach((m) => k.note({ f: hz(m), t: t0, dur: 3.8 * beat, type: 'sawtooth', vol: 0.018, a: 0.3, rel: 0.5, cut: 1200, send: 0.5, detune: -8 }));
        }
      }
    },
    {
      title: 'Marea lenta', artist: 'Onda · Muestras', album: 'Canciones de muestra', trackNo: 3, bpm: 60, bars: 12,
      art: { a: '#4fd1c5', b: '#0d2b4a', kind: 'waves' },
      play(k, r, beat) {
        const chords = [[50, 57, 62, 64, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]]; // D Bm G A, abiertos
        const bells = [74, 76, 78, 81, 83, 86];
        for (let bar = 0; bar < 12; bar++) {
          const t0 = bar * 4 * beat; const ch = chords[bar % 4];
          ch.forEach((m, i) => k.note({ f: hz(m), t: t0, dur: 3.4 * beat, type: i ? 'sine' : 'triangle', vol: 0.05, a: 1.4, rel: 1.8, send: 0.7, detune: i % 2 ? 5 : -5 }));
          if (bar % 2 === 0) k.swell(t0 + 0.5, 7.5, 0.05);
          for (let n = 0; n < 6; n++) {
            if (r() < 0.45 && bar > 0) k.note({ f: hz(bells[(r() * bells.length) | 0]), t: t0 + n * beat * 0.66 + r() * 0.1, dur: 0.05, type: 'sine', vol: 0.06, a: 0.003, rel: 1.6, send: 0.8 });
          }
        }
      }
    }
  ];

  function wav(buf) {
    const ch = buf.getChannelData(0); const n = ch.length;
    const out = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, SR, true); out.setUint32(28, SR * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
    w(36, 'data'); out.setUint32(40, n * 2, true);
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(ch[i]));
    const norm = peak > 0 ? 0.89 / peak : 1;
    for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i] * norm)) * 32767, true);
    return new Blob([out], { type: 'audio/wav' });
  }

  function cover(art, title) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, art.b); bg.addColorStop(1, '#07060b');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
    if (art.kind === 'sun') {
      const s = g.createLinearGradient(0, 120, 0, 360); s.addColorStop(0, '#ffe08a'); s.addColorStop(1, art.a);
      g.fillStyle = s; g.beginPath(); g.arc(256, 330, 150, Math.PI, 0); g.fill();
      g.fillStyle = art.b; for (let i = 0; i < 6; i++) g.fillRect(90, 250 + i * 16, 332, 3 + i * 1.6);
      g.fillStyle = '#0b0810'; g.fillRect(0, 330, 512, 182);
      g.strokeStyle = art.a; g.globalAlpha = 0.5; for (let i = 0; i < 5; i++) { g.lineWidth = 2; g.beginPath(); g.moveTo(140 + i * 10, 350 + i * 24); g.lineTo(372 - i * 10, 350 + i * 24); g.stroke(); }
    } else if (art.kind === 'grid') {
      g.strokeStyle = art.a; g.lineWidth = 2; g.shadowColor = art.a; g.shadowBlur = 12;
      for (let i = 0; i < 10; i++) { const y = 300 + Math.pow(i / 9, 1.8) * 212; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
      for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(256 + i * 18, 300); g.lineTo(256 + i * 90, 512); g.stroke(); }
      g.shadowBlur = 30; g.strokeStyle = '#ffd36e'; g.lineWidth = 6; g.beginPath(); g.arc(256, 230, 90, 0, Math.PI * 2); g.stroke();
    } else {
      g.lineWidth = 5;
      for (let i = 0; i < 9; i++) {
        g.strokeStyle = art.a; g.globalAlpha = 0.25 + i * 0.08; g.beginPath();
        for (let x = 0; x <= 512; x += 8) { const y = 150 + i * 38 + Math.sin(x / 60 + i * 0.9) * (14 + i * 2); x ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
    }
    g.globalAlpha = 1; g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '600 30px system-ui, sans-serif'; g.fillText(title, 34, 64);
    return new Promise((res) => c.toBlob((b) => res(b), 'image/jpeg', 0.86));
  }

  async function render(song) {
    const beat = 60 / song.bpm; const len = song.bars * 4 * beat + 3;
    const ctx = new OfflineAudioContext(1, Math.ceil(len * SR), SR);
    const master = ctx.createGain(); master.gain.setValueAtTime(1, len - 4); master.gain.linearRampToValueAtTime(0, len - 0.2);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    song.play(kit(ctx, master), rng(song.title.length * 97), beat);
    const buf = await ctx.startRendering();
    return { blob: wav(buf), duration: len, cover: await cover(song.art, song.title) };
  }

  root.OndaDemo = { songs: SONGS, render };
})(window);

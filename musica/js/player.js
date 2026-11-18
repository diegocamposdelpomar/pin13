/* Motor de reproducción: cola, aleatorio, repetir, controles de la pantalla de bloqueo,
   ecualizador y temporizador para dormir. Avisa de los cambios con eventos 'change' y 'time'. */
(function (root) {
  const DB = root.OndaDB;
  const audio = document.getElementById('audio');
  const ev = new EventTarget();
  const emit = (type) => ev.dispatchEvent(new Event(type));

  const S = {
    source: [],   // canciones en el orden original del origen (álbum, lista…)
    queue: [],    // orden real de reproducción (barajado si aleatorio)
    pos: -1,
    from: '',     // texto «Reproduciendo desde…»
    shuffle: false,
    repeat: 'off', // off | all | one
    playing: false,
    sleepAt: 0, sleepEnd: false
  };
  let getTrack = () => null;   // la app inyecta cómo obtener los datos de una canción
  let artFor = async () => null;
  let url = null, loadToken = 0, sleepTimer = 0;

  const cur = () => (S.pos >= 0 ? S.queue[S.pos] : null);
  const shuffled = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- Guardar y recuperar el estado entre sesiones ---------- */
  const KEY = 'onda-player';
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({ source: S.source, queue: S.queue, pos: S.pos, from: S.from, shuffle: S.shuffle, repeat: S.repeat, time: audio.currentTime || 0 })); } catch (e) { /* sin almacenamiento */ }
  }
  async function restore() {
    let st = null;
    try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
    if (!st) return;
    const ok = (id) => !!getTrack(id);
    S.source = (st.source || []).filter(ok); S.queue = (st.queue || []).filter(ok);
    S.shuffle = !!st.shuffle; S.repeat = ['off', 'all', 'one'].includes(st.repeat) ? st.repeat : 'off'; S.from = st.from || '';
    S.pos = Math.min(Math.max(st.pos | 0, 0), S.queue.length - 1);
    if (S.pos >= 0) await load(S.pos, false, st.time || 0);
    emit('change');
  }

  /* ---------- Carga y reproducción ---------- */
  async function load(pos, autoplay, startAt = 0) {
    const token = ++loadToken;
    S.pos = pos;
    const id = cur(); const t = getTrack(id);
    if (!t) return;
    emit('change');
    const blob = await DB.getFile(id);
    if (token !== loadToken) return; // otra canción se pidió mientras tanto
    if (!blob) { emit('missing'); return; }
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    audio.src = url;
    if (startAt) {
      const seek = () => { audio.removeEventListener('loadedmetadata', seek); try { audio.currentTime = startAt; } catch (e) { /* ignorar */ } };
      audio.addEventListener('loadedmetadata', seek);
    }
    updateSession(t);
    if (autoplay) await play();
    persist();
  }

  async function play() {
    if (!audio.src) { if (S.queue.length) return load(Math.max(S.pos, 0), true); return; }
    EQ.resume();
    try { await audio.play(); } catch (e) { /* el navegador puede exigir un toque */ }
  }
  const pause = () => audio.pause();
  const toggle = () => (audio.paused ? play() : pause());

  function playList(ids, startId, from, opts = {}) {
    if (!ids.length) return;
    S.source = ids.slice(); S.from = from || '';
    if (opts.shuffle !== undefined) S.shuffle = opts.shuffle;
    if (S.shuffle) {
      const first = startId != null ? startId : ids[(Math.random() * ids.length) | 0];
      S.queue = [first, ...shuffled(ids.filter((x) => x !== first))];
      return load(0, true);
    }
    S.queue = ids.slice();
    return load(Math.max(0, startId != null ? ids.indexOf(startId) : 0), true);
  }

  function next(auto = false) {
    if (!S.queue.length) return;
    if (auto && S.repeat === 'one') { audio.currentTime = 0; return play(); }
    if (S.pos + 1 < S.queue.length) return load(S.pos + 1, true);
    if (S.repeat === 'all' || !auto) {
      if (S.shuffle) { const c = cur(); S.queue = shuffled(S.source); if (S.queue[0] === c && S.queue.length > 1) S.queue.push(S.queue.shift()); }
      return load(0, true);
    }
    // fin de la cola
    audio.pause(); audio.currentTime = 0; emit('change');
  }

  function prev() {
    if (!S.queue.length) return;
    if (audio.currentTime > 3 || S.pos === 0) { audio.currentTime = 0; return play(); }
    return load(S.pos - 1, true);
  }

  function setShuffle(on) {
    const c = cur();
    S.shuffle = on;
    if (c == null) { emit('change'); return; }
    if (on) { const pool = S.source.length ? S.source : S.queue; S.queue = [c, ...shuffled(pool.filter((x) => x !== c))]; S.pos = 0; }
    else { S.queue = S.source.length ? S.source.slice() : S.queue; const i = S.queue.indexOf(c); if (i < 0) { S.queue.unshift(c); S.pos = 0; } else S.pos = i; }
    persist(); emit('change');
  }
  function cycleRepeat() { S.repeat = { off: 'all', all: 'one', one: 'off' }[S.repeat]; persist(); emit('change'); }

  function playNext(id) {
    if (S.pos < 0) return playList([id], id, 'Cola');
    S.queue.splice(S.pos + 1, 0, id); if (!S.source.includes(id)) S.source.push(id);
    persist(); emit('change');
  }
  function enqueue(id) {
    if (S.pos < 0) return playList([id], id, 'Cola');
    S.queue.push(id); if (!S.source.includes(id)) S.source.push(id);
    persist(); emit('change');
  }
  function jump(i) { if (i >= 0 && i < S.queue.length) load(i, true); }
  function removeAt(i) {
    if (i === S.pos || i < 0 || i >= S.queue.length) return;
    S.queue.splice(i, 1); if (i < S.pos) S.pos--;
    persist(); emit('change');
  }
  function moveAt(i, dir) {
    const j = i + dir;
    if (i <= S.pos || j <= S.pos || j >= S.queue.length) return; // solo se reordena lo que viene
    [S.queue[i], S.queue[j]] = [S.queue[j], S.queue[i]];
    persist(); emit('change');
  }

  // Al borrar una canción de la biblioteca.
  function forget(id) {
    const wasCur = cur() === id;
    S.source = S.source.filter((x) => x !== id);
    const before = S.queue.slice(0, S.pos).filter((x) => x === id).length;
    S.queue = S.queue.filter((x) => x !== id);
    S.pos -= before;
    if (wasCur) {
      S.playing = false; audio.pause(); audio.removeAttribute('src'); audio.load();
      if (url) { URL.revokeObjectURL(url); url = null; }
      if (S.pos >= S.queue.length) S.pos = S.queue.length - 1;
      if (S.pos >= 0) load(S.pos, false); else stopAll();
    }
    persist(); emit('change');
  }
  function stopAll() {
    S.source = []; S.queue = []; S.pos = -1; S.playing = false; audio.pause(); audio.removeAttribute('src'); audio.load();
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
    persist(); emit('change');
  }

  /* ---------- Pantalla de bloqueo / auriculares ---------- */
  async function updateSession(t) {
    if (!('mediaSession' in navigator) || !t) return;
    const art = await artFor(t);
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album, artwork: art ? [{ src: art, sizes: '512x512' }] : [] });
    } catch (e) { /* navegador sin MediaMetadata */ }
  }
  if ('mediaSession' in navigator) {
    const h = {
      play, pause, previoustrack: prev, nexttrack: () => next(),
      seekbackward: (d) => { audio.currentTime = Math.max(0, audio.currentTime - (d.seekOffset || 10)); },
      seekforward: (d) => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (d.seekOffset || 10)); },
      seekto: (d) => { if (d.fastSeek && audio.fastSeek) audio.fastSeek(d.seekTime); else audio.currentTime = d.seekTime; }
    };
    for (const k in h) { try { navigator.mediaSession.setActionHandler(k, h[k]); } catch (e) { /* acción no soportada */ } }
  }
  function positionState() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    const d = audio.duration;
    if (!isFinite(d) || d <= 0) return;
    try { navigator.mediaSession.setPositionState({ duration: d, position: Math.min(audio.currentTime, d), playbackRate: audio.playbackRate || 1 }); } catch (e) { /* ignorar */ }
  }

  let lastSave = 0;
  audio.addEventListener('play', () => { S.playing = true; if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; emit('change'); });
  audio.addEventListener('pause', () => { S.playing = false; if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; persist(); emit('change'); });
  audio.addEventListener('ended', () => {
    emit('ended');
    if (S.sleepEnd) { S.sleepEnd = false; emit('change'); emit('slept'); return; }
    next(true);
  });
  audio.addEventListener('loadedmetadata', positionState);
  // load() descarta el evento 'pause' pendiente: al vaciar el audio, volvemos a leer el estado real.
  audio.addEventListener('emptied', () => { if (S.playing && audio.paused) { S.playing = false; emit('change'); } });
  audio.addEventListener('timeupdate', () => {
    emit('time');
    const now = Date.now();
    if (now - lastSave > 5000) { lastSave = now; persist(); positionState(); }
  });
  audio.addEventListener('error', () => { if (audio.getAttribute('src')) emit('error'); });

  /* ---------- Temporizador para dormir ---------- */
  function setSleep(minutes) {
    clearTimeout(sleepTimer); S.sleepAt = 0; S.sleepEnd = false;
    if (minutes === 'end') S.sleepEnd = true;
    else if (minutes > 0) {
      S.sleepAt = Date.now() + minutes * 60000;
      sleepTimer = setTimeout(() => { fadeOutAndPause(); S.sleepAt = 0; emit('change'); emit('slept'); }, minutes * 60000);
    }
    emit('change');
  }
  function fadeOutAndPause() {
    const v0 = audio.volume; let i = 0;
    const id = setInterval(() => {
      i++; audio.volume = Math.max(0, v0 * (1 - i / 20));
      if (i >= 20) { clearInterval(id); audio.pause(); audio.volume = v0; }
    }, 150);
  }

  /* ---------- Ecualizador (Web Audio, opcional) ----------
     Pasar el audio por Web Audio permite ecualizar y dibujar el espectro, pero en iPhone puede
     cortar el sonido con la pantalla bloqueada. Por eso es opcional y se activa a mano. */
  const BANDS = [60, 230, 910, 3600, 12000];
  const PRESETS = {
    'Plano': [0, 0, 0, 0, 0],
    'Más graves': [6, 3, 0, 0, 0],
    'Voces': [-2, -1, 3, 4, 1],
    'Brillo': [0, 0, 0, 3, 6],
    'Fiesta': [5, 2, -1, 2, 4],
    'Noche': [2, 1, 0, -2, -4]
  };
  const EQ = {
    on: false, ctx: null, filters: [], analyser: null, gains: [0, 0, 0, 0, 0], preset: 'Plano',
    ensure() {
      if (this.ctx) return true;
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      const src = this.ctx.createMediaElementSource(audio);
      this.filters = BANDS.map((f, i) => {
        const b = this.ctx.createBiquadFilter();
        b.type = i === 0 ? 'lowshelf' : i === BANDS.length - 1 ? 'highshelf' : 'peaking';
        b.frequency.value = f; b.Q.value = 1.1; b.gain.value = 0;
        return b;
      });
      this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 256; this.analyser.smoothingTimeConstant = 0.8;
      let n = src; for (const f of this.filters) { n.connect(f); n = f; }
      n.connect(this.analyser); this.analyser.connect(this.ctx.destination);
      this.apply();
      return true;
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    enable() { this.on = true; if (this.ensure()) { this.resume(); this.apply(); } this.save(); },
    disable() { this.on = false; this.apply(); this.save(); }, // el grafo no se puede deshacer: lo dejamos plano
    set(i, v) { this.gains[i] = v; this.preset = ''; this.apply(); this.save(); },
    usePreset(name) { this.gains = PRESETS[name].slice(); this.preset = name; this.apply(); this.save(); },
    apply() { this.filters.forEach((f, i) => { f.gain.value = this.on ? this.gains[i] : 0; }); },
    save() { try { localStorage.setItem('onda-eq', JSON.stringify({ on: this.on, gains: this.gains, preset: this.preset })); } catch (e) { /* nada */ } },
    load() {
      try { const s = JSON.parse(localStorage.getItem('onda-eq') || 'null'); if (s) { this.on = !!s.on; this.gains = s.gains || this.gains; this.preset = s.preset || ''; } } catch (e) { /* nada */ }
    }
  };
  EQ.load();
  // Si el ecualizador estaba activo, se monta con el primer toque (los navegadores lo exigen).
  if (EQ.on) document.addEventListener('pointerdown', function once() { document.removeEventListener('pointerdown', once); EQ.ensure(); EQ.resume(); }, { once: true });

  root.OndaPlayer = {
    S, audio, ev, EQ, BANDS, PRESETS,
    init(opts) { getTrack = opts.getTrack; artFor = opts.artFor; return restore(); },
    current: () => getTrack(cur()), currentId: cur,
    play, pause, toggle, playList, next: () => next(false), prev, setShuffle, cycleRepeat,
    playNext, enqueue, jump, removeAt, moveAt, forget, stopAll, setSleep,
    seek(frac) { if (isFinite(audio.duration)) audio.currentTime = frac * audio.duration; },
    refreshSession() { updateSession(getTrack(cur())); }
  };
})(window);

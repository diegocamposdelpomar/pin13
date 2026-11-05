/* La aplicación: rutas, páginas, progreso y ficha de funciones. */
(function (root) {
  const { esc, fmt, highlightLines } = root.Pin13UI;
  const { Lab } = root.Pin13Lab;
  const { Machine, SimError } = root.Pin13Sim;
  const Fn = root.Pin13Fn, Modules = root.Pin13Modules, Widgets = root.Pin13Widgets;

  /* Rutas: solo letras, números y guiones, como exige la página publicada. */
  const slug = (n) => n.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const fnBySlug = Object.create(null);
  Fn.list.forEach((f) => { fnBySlug[slug(f.name)] = f.name; });
  const fnHref = (n) => '#funcion-' + slug(n);
  function parseRoute() {
    const h = location.hash.slice(1);
    if (!h || h === 'inicio') return { page: '' };
    if (h === 'curso') return { page: 'leccion' };
    if (h.startsWith('leccion-')) return { page: 'leccion', arg: h.slice(8) };
    if (h.startsWith('funcion-')) return { page: 'funciones', arg: fnBySlug[h.slice(8)] || h };
    return { page: h };
  }

  const LESSONS = [];
  Modules.forEach((m) => m.lessons.forEach((l) => LESSONS.push({ ...l, mod: m })));

  /* ---------- Progreso ---------- */
  const KEY = 'pin13-v1';
  const store = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { /* sin almacenamiento */ }
    s.done = s.done || {}; s.quiz = s.quiz || {}; s.ch = s.ch || {}; s.code = s.code || {};
    return s;
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* sin almacenamiento */ } };

  /* ---------- Bloques de lección ---------- */
  const labs = [];
  function mountLab(el, opts) { const l = new Lab(el, opts); labs.push(l); return l; }
  function clearLabs() { labs.splice(0).forEach(l => l.destroy()); }

  function codeBlock(b) {
    const lines = highlightLines(b.code);
    const notes = b.notes || {};
    return `<figure class="code">
      <div class="code-tools"><span>${Object.keys(notes).length ? 'Pasa el cursor o toca una línea' : 'Código'}${b.noSim ? ' · solo en placa real' : ''}</span><button type="button" class="btn btn-sm btn-ghost" data-copy>Copiar</button></div>
      <pre class="code-pre" data-source="${esc(b.code)}">${lines.map((l, i) => {
        const n = notes[i + 1];
        return `<div class="cl${n ? ' has-note' : ''}" ${n ? `tabindex="0" data-note="${esc(n)}"` : ''}><span class="cl-n">${i + 1}</span><span class="cl-c">${l || ' '}</span></div>`;
      }).join('')}</pre>
      ${Object.keys(notes).length ? `<figcaption class="code-note" aria-live="polite">Selecciona una línea con punto naranja para ver qué hace.</figcaption>` : ''}
    </figure>`;
  }

  function quizHTML(list, lid) {
    return `<section class="quiz"><h3>Comprueba lo aprendido</h3>${list.map((q, i) => `
      <div class="q" data-q="${i}" data-a="${q.a}" data-why="${esc(q.why)}">
        <p class="q-t">${fmt(q.q)}</p>
        <div class="q-o">${q.o.map((o, j) => `<button type="button" data-o="${j}">${fmt(o)}</button>`).join('')}</div>
        <p class="q-w" role="status"></p>
      </div>`).join('')}</section>`;
  }

  function renderBlocks(l, host) {
    const tasks = [];
    const html = l.blocks.map((b, i) => {
      if (b.p) return `<p>${fmt(b.p)}</p>`;
      if (b.h) return `<h2>${fmt(b.h)}</h2>`;
      if (b.ul) return `<ul>${b.ul.map(x => `<li>${fmt(x)}</li>`).join('')}</ul>`;
      if (b.ol) return `<ol>${b.ol.map(x => `<li>${fmt(x)}</li>`).join('')}</ol>`;
      if (b.tip) return `<aside class="note note-tip"><span class="note-k">Consejo</span><div>${fmt(b.tip)}</div></aside>`;
      if (b.warn) return `<aside class="note note-warn"><span class="note-k">Atención</span><div>${fmt(b.warn)}</div></aside>`;
      if (b.table) return `<div class="tbl"><table><thead><tr>${b.table.head.map(h => `<th>${fmt(h)}</th>`).join('')}</tr></thead><tbody>${b.table.rows.map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      if (b.wire) return `<div class="wires"><h4>Conexiones</h4><ul>${b.wire.map(([a, z]) => `<li><span>${fmt(a)}</span><i aria-hidden="true"></i><span>${fmt(z)}</span></li>`).join('')}</ul></div>`;
      if (b.code) return codeBlock(b);
      if (b.widget) { tasks.push(() => Widgets[b.widget](host.querySelector(`[data-w="${i}"]`))); return `<div class="widget" data-w="${i}"></div>`; }
      if (b.lab) { tasks.push(() => mountLab(host.querySelector(`[data-lab="${i}"]`), { ...b.lab, compact: true })); return `<div data-lab="${i}"></div>`; }
      if (b.quiz) return quizHTML(b.quiz, l.id);
      if (b.challenge) { tasks.push(() => mountChallenge(host.querySelector(`[data-ch="${i}"]`), b.challenge, l.id + ':' + i)); return `<section class="challenge" data-ch="${i}"></section>`; }
      return '';
    }).join('');
    host.innerHTML = html;
    tasks.forEach(t => t());
  }

  function mountChallenge(el, ch, id) {
    const done = store.ch[id];
    el.innerHTML = `<header class="ch-h"><span class="ch-k">Reto</span><h3>${fmt(ch.title)}</h3><span class="ch-ok" ${done ? '' : 'hidden'}>✓ Superado</span></header>
      <p>${fmt(ch.desc)}</p><div data-lab></div>
      <div class="ch-bar"><button type="button" class="btn btn-go" data-c="check">Comprobar mi solución</button><button type="button" class="btn btn-ghost" data-c="hint">Pista</button><button type="button" class="btn btn-ghost" data-c="sol">Ver solución</button></div>
      <p class="ch-res" role="status"></p>`;
    const lab = mountLab(el.querySelector('[data-lab]'), { code: ch.start, parts: ch.parts, compact: true, initial: store.code[id] ?? ch.start, onChange: (c) => { store.code[id] = c; save(); } });
    const res = el.querySelector('.ch-res');
    el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-c]');
      if (!c) return;
      if (c.dataset.c === 'hint') { res.className = 'ch-res info'; res.innerHTML = fmt(ch.hint); }
      if (c.dataset.c === 'sol') { lab.setCode(ch.solution); res.className = 'ch-res info'; res.textContent = 'Esta es una solución posible. Léela con calma, ejecútala y después intenta escribirla sin mirar.'; }
      if (c.dataset.c === 'check') {
        try {
          const m = new Machine(lab.code, { parts: ch.parts });
          m.runFor(ch.ms, ch.stim || []);
          if (m.error) throw m.error;
          const r = ch.check(m);
          if (r === true) {
            res.className = 'ch-res ok'; res.textContent = '¡Correcto! Tu código se ejecutó y pasó la comprobación.';
            store.ch[id] = 1; save(); el.querySelector('.ch-ok').hidden = false;
          } else { res.className = 'ch-res bad'; res.textContent = r; }
        } catch (err) {
          if (!(err instanceof SimError)) throw err;
          res.className = 'ch-res bad'; res.textContent = `Línea ${err.line}: ${err.message}${err.hint ? ' ' + err.hint : ''}`;
        }
      }
    });
  }

  /* ---------- Vistas ---------- */
  const main = () => document.getElementById('main');
  const pct = () => Math.round(Object.keys(store.done).filter(k => LESSONS.some(l => l.id === k)).length / LESSONS.length * 100);
  const nextLesson = () => LESSONS.find(l => !store.done[l.id]);

  function viewHome() {
    const doneN = LESSONS.filter(l => store.done[l.id]).length;
    const nx = nextLesson();
    const cur = store.last && LESSONS.find(l => l.id === store.last && !store.done[l.id]) || nx;
    const challenges = LESSONS.reduce((a, l) => a + l.blocks.filter(b => b.challenge).length, 0);
    const pool = Fn.list.filter(f => f.like);
    const d = new Date(), fday = pool[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % pool.length];
    main().innerHTML = `
      <section class="home-head">
        <div>
          <p class="eyebrow">Curso independiente de Arduino y programación</p>
          <h1>Aprende a programar haciendo que las cosas funcionen.</h1>
          <p class="lead">Empieza desde cero. Cada lección tiene código que puedes ejecutar y un UNO virtual para ver qué pasa, línea a línea. No necesitas placa para empezar.</p>
          <div class="home-cta">
            ${cur ? `<a class="btn btn-go btn-lg" href="#leccion-${cur.id}">${doneN ? 'Continuar' : 'Empezar'}: ${esc(cur.title)}</a>` : '<a class="btn btn-go btn-lg" href="#lab">Abrir el laboratorio</a>'}
            <a class="btn btn-lg" href="#lab">Ir al laboratorio</a>
          </div>
        </div>
        <div class="home-board" aria-hidden="true" id="homeBoard"></div>
      </section>
      <section class="install" id="installCard" hidden></section>
      <section class="stats" aria-label="Tu progreso">
        <div><strong>${doneN}/${LESSONS.length}</strong><span>lecciones completadas</span></div>
        <div><strong>${Object.keys(store.ch).length}/${challenges}</strong><span>retos superados</span></div>
        <div><strong>${Fn.list.length}</strong><span>fichas de funciones</span></div>
        <div class="stat-bar"><span style="width:${pct()}%"></span></div>
      </section>
      <section class="fnday"><span class="eyebrow">Función del día</span><button type="button" class="fnday-b" data-fn="${esc(fday.name)}"><code>${esc(fday.sig)}</code></button><p>${esc(fday.like)}</p></section>
      <section class="track"><h2>El recorrido</h2>
        ${Modules.map((m, i) => {
          const d = m.lessons.filter(l => store.done[l.id]).length, all = d === m.lessons.length;
          return `<article class="tr-mod ${all ? 'is-done' : d ? 'is-part' : ''}">
            <div class="tr-pad" aria-hidden="true"><span>${i + 1}</span></div>
            <div class="tr-body"><h3>${esc(m.title)}</h3><p>${esc(m.blurb)}</p>
              <ul class="tr-less">${m.lessons.map(l => `<li><a href="#leccion-${l.id}" class="${store.done[l.id] ? 'done' : ''}">${store.done[l.id] ? '<span class="ck">✓</span>' : ''}${esc(l.title)}</a></li>`).join('')}</ul>
            </div></article>`;
        }).join('')}
      </section>`;
    paintInstall();
    const hb = document.getElementById('homeBoard');
    hb.innerHTML = root.Pin13Board.svg();
    let on = 0;
    const blink = () => { const L = hb.querySelector('[data-led="L"]'); if (!L) return; on = 1 - on; L.style.setProperty('--on', on); hb.querySelectorAll('.bp[data-pin="13"]').forEach(g => { g.classList.toggle('is-high', !!on); g.querySelector('.bp-pad').style.setProperty('--on', on); }); };
    blink();
    viewTimer = setInterval(blink, 1000);
  }
  let viewTimer = null;

  function viewLesson(id) {
    const idx = LESSONS.findIndex(l => l.id === id);
    if (idx < 0) return viewNotFound();
    const l = LESSONS[idx], prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    store.last = id; save();
    const pos = l.mod.lessons.findIndex(x => x.id === id) + 1;
    main().innerHTML = `<div class="lesson-wrap">
      <nav class="crumb" aria-label="Migas"><a href="#inicio">Inicio</a> <span>/</span> ${esc(l.mod.title)} <span>/</span> Lección ${pos} de ${l.mod.lessons.length}</nav>
      <header class="lesson-h"><h1>${esc(l.title)}</h1>
        <p class="goal"><strong>Objetivo:</strong> ${esc(l.goal)} <span class="mins">≈ ${l.min} min</span></p></header>
      <article class="prose" id="lessonBody"></article>
      <footer class="lesson-f">
        <button type="button" class="btn ${store.done[id] ? '' : 'btn-go'} btn-lg" id="markDone">${store.done[id] ? '✓ Completada' : 'Marcar como completada'}</button>
        <div class="lesson-nav">
          ${prev ? `<a class="btn" href="#leccion-${prev.id}">← ${esc(prev.title)}</a>` : ''}
          ${next ? `<a class="btn" href="#leccion-${next.id}">${esc(next.title)} →</a>` : ''}
        </div>
      </footer></div>`;
    renderBlocks(l, document.getElementById('lessonBody'));
    document.getElementById('markDone').onclick = (e) => {
      if (store.done[id]) { delete store.done[id]; } else { store.done[id] = Date.now(); }
      save(); paintNav();
      e.target.textContent = store.done[id] ? '✓ Completada' : 'Marcar como completada';
      e.target.classList.toggle('btn-go', !store.done[id]);
      if (store.done[id] && next) location.hash = '#leccion-' + next.id;
    };
  }

  function viewLab() {
    const pending = store.pending; delete store.pending; save();
    const initial = pending ? pending.code : (store.labCode ?? LESSONS.find(l => l.id === 'blink').blocks.find(b => b.lab).lab.code);
    const parts = pending ? (pending.parts || []) : (store.labParts ?? [{ type: 'led', pin: 13 }]);
    main().innerHTML = `<div class="lab-page">
      <header class="page-h"><h1>Laboratorio</h1><p>Un UNO R3 virtual. Escribe, ejecuta y equivócate sin riesgo. Tu código se guarda en este navegador.</p></header>
      <div class="lab-ex"><label>Cargar un ejemplo <select id="exSel"><option value="">Elige un ejemplo de las lecciones…</option>${Modules.map(m => {
        const items = m.lessons.flatMap(l => l.blocks.filter(b => b.lab).map((b, i, arr) => ({ l, b, i, n: arr.length })));
        return items.length ? `<optgroup label="${esc(m.title)}">${items.map(x => `<option value="${x.l.id}|${x.i}">${esc(x.l.title)}${x.n > 1 ? ' (' + (x.i + 1) + ')' : ''}</option>`).join('')}</optgroup>` : '';
      }).join('')}</select></label>
      <button type="button" class="btn btn-sm btn-ghost" id="labNew">Programa nuevo</button></div>
      <div id="freeLab"></div>
      <section class="lab-limits"><h2>Qué simula y qué no</h2>
        <p>Es un intérprete propio de un subconjunto de C++ que imita un UNO R3: enteros de 16 bits, ADC de 10 bits, PWM, interrupciones y sus librerías más comunes. Sirve para aprender la lógica, no para garantizar que un circuito funcionará: no modela la electricidad, ni tiempos exactos de CPU, ni el consumo. No admite punteros, clases ni plantillas. Si un programa funciona aquí, compílalo en el IDE antes de darlo por bueno.</p></section>
    </div>`;
    const lab = mountLab(document.getElementById('freeLab'), { code: initial, initial, parts, free: true, onChange: (c) => { store.labCode = c; save(); }, onParts: (p) => { store.labParts = p; save(); } });
    document.getElementById('exSel').onchange = (e) => {
      if (!e.target.value) return;
      const [lid, i] = e.target.value.split('|');
      const b = LESSONS.find(x => x.id === lid).blocks.filter(x => x.lab)[+i].lab;
      lab.setCode(b.code, b.parts); store.labCode = b.code; store.labParts = b.parts; save();
    };
    document.getElementById('labNew').onclick = () => {
      const c = 'void setup() {\n  // Se ejecuta una vez\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  // Se repite sin parar\n}\n';
      lab.setCode(c, []); store.labCode = c; store.labParts = []; save();
    };
  }

  function fnCard(f, full) {
    const params = f.params && f.params.length ? `<h4>Datos que recibe</h4><dl class="params">${f.params.map(([a, b]) => `<dt><code>${esc(a)}</code></dt><dd>${esc(b)}</dd>`).join('')}</dl>` : '';
    return `<p class="fn-cat">${esc(f.cat)}</p>
      <h2 class="fn-name">${esc(f.name)}${f.keyword ? '' : '()'}</h2>
      <code class="fn-sig">${esc(f.sig)}</code>
      <p class="fn-what">${esc(f.what)}</p>
      ${f.like ? `<p class="fn-like"><strong>Imagínalo así:</strong> ${esc(f.like)}</p>` : ''}
      ${f.range ? `<p class="fn-range"><strong>Rango y tamaño:</strong> ${esc(f.range)}</p>` : ''}
      ${params}
      ${f.ret && f.ret !== '—' ? `<h4>Lo que devuelve</h4><p>${esc(f.ret)}</p>` : ''}
      ${f.oops && f.oops.length ? `<h4>Errores frecuentes</h4><ul class="oops">${f.oops.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${f.noSim ? '<p class="fn-range">Esta función no existe en el UNO R3 ni se simula aquí: el ejemplo es para placas compatibles.</p>' : ''}
      ${full ? '' : `<h4>Ejemplo</h4>${codeBlock({ code: f.ex })}`}
      <div class="fn-actions">
        ${full ? '' : `<a class="btn btn-sm" href="${fnHref(f.name)}">Abrir y probar</a>`}
        ${f.link ? `<a class="btn btn-sm btn-ghost" href="${f.link}" target="_blank" rel="noopener">Referencia oficial ↗</a>` : ''}
      </div>`;
  }

  function viewFunctions(name, q = '') {
    const cats = [...new Set(Fn.list.map(f => f.cat))];
    const f = name ? Fn.byName[name] : null;
    if (name && !f) return viewNotFound();
    main().innerHTML = `<div class="fn-page">
      <header class="page-h"><h1>Diccionario de funciones</h1><p>${Fn.list.length} fichas en español: qué hace cada una, qué datos recibe, errores típicos y un ejemplo que puedes ejecutar.</p></header>
      <div class="fn-layout">
        <aside class="fn-list">
          <label class="search"><span class="sr">Buscar función</span><input id="fnQ" type="search" placeholder="Buscar: tiempo, motor, delay…" value="${esc(q)}" autocomplete="off"/></label>
          <div id="fnItems" class="fn-items"></div>
        </aside>
        <section class="fn-detail" id="fnDetail"></section>
      </div></div>`;
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const paint = () => {
      const t = norm(document.getElementById('fnQ').value.trim());
      const match = (x) => !t || norm(x.name + ' ' + x.what + ' ' + x.cat + ' ' + (x.like || '')).includes(t);
      const html = cats.map(c => {
        const it = Fn.list.filter(x => x.cat === c && match(x));
        return it.length ? `<h3>${esc(c)}</h3><ul>${it.map(x => `<li><a href="${fnHref(x.name)}" class="${f && x.name === f.name ? 'cur' : ''}">${esc(x.name)}</a></li>`).join('')}</ul>` : '';
      }).join('');
      document.getElementById('fnItems').innerHTML = html || '<p class="hint-s">No hay resultados. Prueba otra palabra.</p>';
    };
    document.getElementById('fnQ').oninput = paint;
    paint();
    const d = document.getElementById('fnDetail');
    if (f) {
      d.innerHTML = `<div class="fn-card">${fnCard(f, true)}</div>${f.noSim ? codeBlock({ code: f.ex, noSim: true }) : '<h3 class="fn-try">Pruébala</h3><div id="fnLab"></div>'}`;
      if (!f.noSim) mountLab(document.getElementById('fnLab'), { code: f.ex, parts: f.parts || [], compact: true, autoVars: false });
      const cur = document.querySelector('.fn-items .cur');
      if (cur && innerWidth > 900) cur.scrollIntoView({ block: 'nearest' });
      if (innerWidth <= 900) d.scrollIntoView();
    } else {
      d.innerHTML = `<div class="fn-empty"><h2>Elige una función</h2><p>Busca por nombre o por lo que quieres hacer. Prueba con «tiempo», «texto» o «motor».</p><p>Si es tu primera vez, empieza por:</p><div class="fn-start">${['pinMode', 'digitalWrite', 'digitalRead', 'delay', 'analogRead', 'analogWrite', 'map', 'millis', 'Serial.println'].map(n => `<a class="btn btn-sm" href="${fnHref(n)}">${n}</a>`).join('')}</div></div>`;
    }
  }

  function viewBoard() {
    main().innerHTML = `<div class="prose-page"><header class="page-h"><h1>La placa</h1><p>Toca cualquier pin o componente para saber qué hace.</p></header><div class="widget" id="pinW"></div>
      <h2>Comparativa de placas</h2><div id="boardsT"></div></div>`;
    Widgets.pinout(document.getElementById('pinW'));
    const pl = LESSONS.find(l => l.id === 'placas').blocks.find(b => b.table).table;
    document.getElementById('boardsT').innerHTML = `<div class="tbl"><table><thead><tr>${pl.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${pl.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint-s">Más detalles en <a href="#leccion-placas">El mundo de placas</a>.</p>`;
  }

  function viewGuides() {
    const essentials = ['pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite', 'delay', 'millis', 'map', 'constrain', 'tone', 'noTone', 'pulseIn', 'attachInterrupt', 'Serial.begin', 'Serial.print', 'Serial.println', 'Serial.available', 'Serial.read', 'servo.write', 'lcd.print', 'lcd.setCursor', 'EEPROM.update', 'random'];
    main().innerHTML = `<div class="prose-page guides">
      <header class="page-h"><h1>Guías y documentos</h1><p>Una selección de PDF y webs para seguir aprendiendo. Comprobé que estos enlaces funcionaban el 5 de noviembre de 2026. Los documentos son de sus autores: aquí solo se enlazan.</p></header>
      ${root.Pin13Resources.map(g => `<section class="res-g"><h2>${esc(g.group)}</h2>${g.note ? `<p class="hint-s">${esc(g.note)}</p>` : ''}<ul class="res">${g.items.map(([t, u, k, d]) => `<li><a href="${u}" target="_blank" rel="noopener"><span class="res-k res-${k}">${k}</span><strong>${esc(t)}</strong><span>${esc(d)}</span></a></li>`).join('')}</ul></section>`).join('')}
      <section class="res-g"><h2>Libros recomendados</h2><p class="hint-s">Son de pago o de biblioteca.</p><ul class="res books">${root.Pin13Books.map(([t, a, d]) => `<li><div><strong>${esc(t)}</strong><span>${esc(a)}</span><span>${esc(d)}</span></div></li>`).join('')}</ul></section>
      <section class="res-g" id="chuleta"><div class="row-b"><h2>Chuleta</h2><button type="button" class="btn btn-sm" id="copySheet">Copiar la chuleta</button></div>
        <div class="tbl"><table class="sheet"><thead><tr><th>Función</th><th>Qué hace</th></tr></thead><tbody>${essentials.map(n => { const f = Fn.byName[n]; return `<tr><td><code>${esc(f.sig)}</code></td><td>${esc(f.what.split(/(?<=\.)\s/)[0])}</td></tr>`; }).join('')}</tbody></table></div></section>
      <section class="res-g"><h2>Glosario</h2><dl class="gloss">${root.Pin13Glossary.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl></section>
    </div>`;
    document.getElementById('copySheet').onclick = async (e) => {
      const text = essentials.map((n) => Fn.byName[n].sig + ' — ' + Fn.byName[n].what.split(/(?<=\.)\s/)[0]).join('\n');
      try { await navigator.clipboard.writeText(text); e.target.textContent = 'Copiada'; } catch { e.target.textContent = 'No se pudo copiar'; }
    };
  }

  function viewNotFound() {
    main().innerHTML = `<div class="prose-page"><h1>Esa página no existe</h1><p><a href="#inicio">Volver al inicio</a></p></div>`;
  }

  /* ---------- Navegación lateral ---------- */
  function paintNav() {
    const cur = parseRoute().page === 'leccion' ? parseRoute().arg : null;
    document.getElementById('courseNav').innerHTML = Modules.map((m, i) => {
      const d = m.lessons.filter(l => store.done[l.id]).length;
      const open = m.lessons.some(l => l.id === cur);
      return `<details ${open ? 'open' : ''}><summary><span class="cn-t">${i + 1}. ${esc(m.title)}</span><span class="cn-c">${d}/${m.lessons.length}</span></summary>
        <ul>${m.lessons.map(l => `<li><a href="#leccion-${l.id}" class="${l.id === cur ? 'cur' : ''} ${store.done[l.id] ? 'done' : ''}">${store.done[l.id] ? '✓ ' : ''}${esc(l.title)}</a></li>`).join('')}</ul></details>`;
    }).join('');
    document.getElementById('navPct').style.width = pct() + '%';
    document.getElementById('navPctT').textContent = pct() + ' %';
    const path = parseRoute().page;
    document.querySelectorAll('.topnav a').forEach(a => {
      const on = a.dataset.nav === path || (a.dataset.nav === '' && path === '') || (a.dataset.nav === 'leccion' && path === 'leccion');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.body.classList.toggle('has-course', path === 'leccion' || path === '');
  }

  function route() {
    clearLabs();
    closeDrawer();
    if (viewTimer) { clearInterval(viewTimer); viewTimer = null; }
    document.body.classList.remove('nav-open');
    const { page, arg } = parseRoute();
    switch (page) {
      case '': viewHome(); break;
      case 'leccion': arg ? viewLesson(arg) : (location.hash = '#leccion-' + (nextLesson() || LESSONS[0]).id); break;
      case 'lab': viewLab(); break;
      case 'funciones': viewFunctions(arg || null); break;
      case 'placa': viewBoard(); break;
      case 'guias': viewGuides(); break;
      default: viewNotFound();
    }
    paintNav();
    window.scrollTo(0, 0);
    const m = main(); m.focus({ preventScroll: true });
    const t = m.querySelector('h1'); document.title = (t ? t.textContent + ' · ' : '') + 'Pin 13';
  }

  /* ---------- Instalación en el teléfono ---------- */
  let installEvent = null;
  const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function paintInstall() {
    const el = document.getElementById('installCard');
    if (!el) return;
    if (isInstalled() || store.installHidden || !('serviceWorker' in navigator)) { el.hidden = true; return; }
    if (installEvent) {
      el.innerHTML = '<p><strong>Instala Pin 13 en tu teléfono</strong> para abrirla con su icono y usarla sin internet.</p><button type="button" class="btn btn-go" id="installBtn">Instalar</button><button type="button" class="btn btn-ghost" id="installNo">Ahora no</button>';
    } else if (isIOS()) {
      el.innerHTML = '<p><strong>Instala Pin 13 en tu iPhone:</strong> en Safari, toca Compartir y luego «Añadir a pantalla de inicio».</p><button type="button" class="btn btn-ghost" id="installNo">Entendido</button>';
    } else { el.hidden = true; return; }
    el.hidden = false;
    const yes = document.getElementById('installBtn');
    if (yes) yes.onclick = async () => {
      const ev = installEvent; installEvent = null;
      ev.prompt();
      await ev.userChoice;
      paintInstall();
    };
    document.getElementById('installNo').onclick = () => { store.installHidden = true; save(); el.hidden = true; };
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; paintInstall(); });
  window.addEventListener('appinstalled', () => { installEvent = null; paintInstall(); });
  // Dentro de claude.ai el registro se rechaza: allí la app sigue funcionando, solo que sin modo sin conexión.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }

  /* ---------- Ficha lateral ---------- */
  let drawerReturn = null;
  function openDrawer(key) {
    const f = Fn.byName[key];
    if (!f) return;
    const d = document.getElementById('drawer');
    d.querySelector('.drawer-body').innerHTML = fnCard(f, false);
    d.hidden = false;
    document.body.classList.add('drawer-open');
    drawerReturn = document.activeElement;
    d.querySelector('.drawer-close').focus();
  }
  function closeDrawer() {
    const d = document.getElementById('drawer');
    if (!d || d.hidden) return;
    d.hidden = true; document.body.classList.remove('drawer-open');
    if (drawerReturn && drawerReturn.isConnected) drawerReturn.focus();
  }

  /* ---------- Eventos globales ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    store.theme = t; save();
    const b = document.getElementById('themeBtn');
    b.textContent = t === 'light' ? 'Modo oscuro' : 'Modo claro';
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.skip')) { e.preventDefault(); main().focus(); return; }
    const fn = e.target.closest('[data-fn]');
    if (fn) { e.preventDefault(); openDrawer(fn.dataset.fn); return; }
    if (e.target.closest('.drawer-close') || e.target.id === 'scrim') { closeDrawer(); return; }
    if (e.target.closest('#drawer a[href^="#"]')) { closeDrawer(); return; }
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      const src = copy.closest('.code').querySelector('.code-pre').dataset.source;
      Promise.resolve().then(() => navigator.clipboard.writeText(src)).then(() => { copy.textContent = 'Copiado'; setTimeout(() => { copy.textContent = 'Copiar'; }, 1200); }).catch(() => { copy.textContent = 'No se pudo copiar'; });
      return;
    }
    const opt = e.target.closest('.q [data-o]');
    if (opt) {
      const q = opt.closest('.q'), a = +q.dataset.a, o = +opt.dataset.o;
      q.querySelectorAll('[data-o]').forEach(b => b.classList.remove('sel-bad'));
      const w = q.querySelector('.q-w');
      if (o === a) {
        opt.classList.add('sel-ok');
        q.querySelectorAll('[data-o]').forEach(b => { b.disabled = true; });
        w.className = 'q-w ok'; w.textContent = '¡Correcto! ' + q.dataset.why;
      } else { opt.classList.add('sel-bad'); w.className = 'q-w bad'; w.textContent = 'Todavía no. Vuelve a intentarlo.'; }
      return;
    }
    const cl = e.target.closest('.cl.has-note');
    if (cl) showNote(cl);
  });
  function showNote(cl) {
    const fig = cl.closest('.code');
    fig.querySelectorAll('.cl.sel').forEach(x => x.classList.remove('sel'));
    cl.classList.add('sel');
    fig.querySelector('.code-note').innerHTML = `<strong>Línea ${cl.querySelector('.cl-n').textContent}:</strong> ${esc(cl.dataset.note)}`;
  }
  document.addEventListener('mouseover', (e) => { const cl = e.target.closest('.cl.has-note'); if (cl) showNote(cl); });
  document.addEventListener('focusin', (e) => { const cl = e.target.closest('.cl.has-note'); if (cl) showNote(cl); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', () => {
    setTheme(store.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    document.getElementById('themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    document.getElementById('menuBtn').onclick = () => document.body.classList.toggle('nav-open');
    const resetBtn = document.getElementById('resetBtn'), resetAsk = document.getElementById('resetAsk');
    resetBtn.onclick = () => { resetBtn.hidden = true; resetAsk.hidden = false; };
    document.getElementById('resetNo').onclick = () => { resetAsk.hidden = true; resetBtn.hidden = false; };
    document.getElementById('resetYes').onclick = () => {
      const theme = store.theme;
      Object.keys(store).forEach((k) => delete store[k]);
      Object.assign(store, { done: {}, quiz: {}, ch: {}, code: {}, theme });
      save();
      resetAsk.hidden = true; resetBtn.hidden = false;
      if (parseRoute().page === '') route(); else location.hash = '#inicio';
    };
    route();
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

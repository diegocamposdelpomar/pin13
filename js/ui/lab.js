/* El laboratorio: editor, ejecución paso a paso, placa virtual, componentes y monitor serie. */
(function (root) {
  const { Machine, SimError } = root.Pin13Sim;
  const { esc, highlightLines, explainLine, wordAt } = root.Pin13UI;
  const Board = root.Pin13Board, Fn = root.Pin13Fn;

  const COLORS = { rojo: '#ff4a3d', ambar: '#ffb020', verde: '#3ddc84', azul: '#4aa8ff', blanco: '#f4f7ff' };
  const PART_TYPES = {
    led: { label: 'LED', fields: ['pin'], def: { pin: 13 } }, button: { label: 'Botón', fields: ['pin'], def: { pin: 2 } },
    pot: { label: 'Potenciómetro', fields: ['pin'], def: { pin: 14, value: 512 } }, ldr: { label: 'Sensor de luz (LDR)', fields: ['pin'], def: { pin: 14, value: 600 } },
    tmp36: { label: 'Temperatura (TMP36)', fields: ['pin'], def: { pin: 15, value: 153 } }, buzzer: { label: 'Zumbador', fields: ['pin'], def: { pin: 8 } },
    servo: { label: 'Servo', fields: ['pin'], def: { pin: 9 } }, motor: { label: 'Motor DC', fields: ['pin'], def: { pin: 9 } },
    sonar: { label: 'Ultrasonidos HC-SR04', fields: [], def: { trig: 9, echo: 10, cm: 100 } }, lcd: { label: 'LCD 16×2', fields: [], def: {} },
    dht: { label: 'DHT11', fields: ['pin'], def: { pin: 2 } }, rgb: { label: 'LED RGB', fields: [], def: { r: 9, g: 10, b: 11 } },
    sr595: { label: 'Registro 74HC595', fields: [], def: { data: 11, clock: 12, latch: 8 } }
  };
  const pinName = (p) => p >= 14 ? 'A' + (p - 14) : 'D' + p;

  let activeLab = null;
  let audio = null;
  const sound = { on: false };

  const FRAME_MS = 16;
  function tick() {
    const lab = activeLab;
    if (!lab || !lab.running) { lab && (lab.raf = 0); return; }
    const t = performance.now();
    const dt = Math.min(250, t - (lab.lastT || t));
    lab.lastT = t;
    lab.m.advance(dt * lab.speed);
    lab.render();
    if (lab.m.halted) { lab.setRunning(false); lab.showRuntimeEnd(); return; }
    lab.raf = setTimeout(tick, FRAME_MS);
  }

  class Lab {
    constructor(el, opts = {}) {
      this.el = el; this.opts = opts;
      this.original = opts.code || '';
      this.code = opts.initial ?? this.original;
      this.parts = (opts.parts || []).map(p => ({ ...p }));
      this.speed = 1; this.running = false; this.m = null; this.tab = 'serial'; this.plot = [];
      this.eeprom = new Uint8Array(1024).fill(255); this.lastTrace = 0;
      el.classList.add('lab');
      if (opts.compact) el.classList.add('lab-compact');
      this.build();
    }
    build() {
      const o = this.opts;
      this.el.innerHTML = `
        <div class="lab-bar" role="toolbar" aria-label="Controles de ejecución">
          <button type="button" class="btn btn-go" data-a="run">▶ Ejecutar</button>
          <button type="button" class="btn" data-a="step" title="Ejecuta una instrucción y muestra lo que ocurre">⏭ Paso</button>
          <button type="button" class="btn" data-a="reset" title="Vuelve a empezar desde setup()">⟲ Reiniciar</button>
          <label class="lab-speed">Velocidad
            <select data-a="speed"><option value="0.1">× 0,1</option><option value="0.25">× 0,25</option><option value="1" selected>× 1</option><option value="4">× 4</option></select>
          </label>
          <span class="lab-state" data-r="state" role="status">Detenido</span>
          <span class="lab-spacer"></span>
          <button type="button" class="btn btn-ghost" data-a="explain">Explicar código</button>
          ${o.free ? '' : '<button type="button" class="btn btn-ghost" data-a="restore" title="Deshace tus cambios">Restaurar</button>'}
          ${o.extraBar || ''}
        </div>
        <div class="lab-grid">
          <div class="lab-left">
            <div class="ed" data-r="ed">
              <div class="ed-scroll" data-r="scroll">
                <div class="ed-gutter" data-r="gutter" aria-hidden="true"></div>
                <div class="ed-stack">
                  <pre class="ed-pre" data-r="pre" aria-hidden="true"></pre>
                  <textarea class="ed-ta" data-r="ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Editor de código"></textarea>
                </div>
              </div>
            </div>
            <div class="lab-msgs" data-r="msgs" aria-live="polite"></div>
            <div class="lab-now" data-r="now"></div>
          </div>
          <div class="lab-right">
            <div class="lab-board" data-r="board">${Board.svg()}</div>
            <div class="lab-parts" data-r="parts"></div>
            ${o.free ? `<div class="add-part">
              <label>Añadir componente <select data-r="addType">${Object.entries(PART_TYPES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
              <label data-r="addPinWrap">en el pin <select data-r="addPin">${Array.from({ length: 20 }, (_, i) => `<option value="${i}">${pinName(i)}</option>`).join('')}</select></label>
              <button type="button" class="btn btn-sm" data-a="addPart">＋ Añadir</button>
            </div>` : ''}
            <div class="lab-tabs" role="tablist">
              <button type="button" role="tab" data-tab="serial" aria-selected="true">Monitor serie</button>
              <button type="button" role="tab" data-tab="plot" aria-selected="false">Gráfica</button>
              <button type="button" role="tab" data-tab="vars" aria-selected="false">Variables</button>
            </div>
            <div class="lab-tabpanel" data-p="serial">
              <pre class="serial" data-r="serial" tabindex="0" aria-label="Salida del monitor serie"></pre>
              <form class="serial-in" data-r="sform">
                <input data-r="sinput" placeholder="Escribe y pulsa Enviar" aria-label="Enviar por Serial" autocomplete="off" />
                <button type="submit" class="btn btn-sm">Enviar</button>
                <button type="button" class="btn btn-sm btn-ghost" data-a="clearSerial">Limpiar</button>
              </form>
            </div>
            <div class="lab-tabpanel" data-p="plot" hidden><canvas data-r="plot" height="150" aria-label="Gráfica de los números recibidos por Serial"></canvas><p class="hint-s">Dibuja los números que imprimes con Serial.println, igual que el Serial Plotter del IDE.</p></div>
            <div class="lab-tabpanel" data-p="vars" hidden><div class="vars" data-r="vars"></div></div>
          </div>
        </div>`;
      const $ = (s) => this.el.querySelector(`[data-r="${s}"]`);
      this.r = { ta: $('ta'), pre: $('pre'), gutter: $('gutter'), scroll: $('scroll'), msgs: $('msgs'), now: $('now'), state: $('state'), board: $('board'), parts: $('parts'), serial: $('serial'), vars: $('vars'), plot: $('plot'), sform: $('sform'), sinput: $('sinput') };
      const r = this.r;
      r.ta.value = this.code;
      this.paintCode();
      this.buildParts();
      r.ta.addEventListener('input', () => { this.code = r.ta.value; this.paintCode(); this.stop(); this.liveCheck(); this.opts.onChange && this.opts.onChange(this.code); });
      r.ta.addEventListener('keydown', (e) => this.onKey(e));
      ['keyup', 'click', 'focus'].forEach(ev => r.ta.addEventListener(ev, () => this.caretHelp()));
      this.el.addEventListener('click', (e) => this.onClick(e));
      this.el.querySelector('[data-a="speed"]').addEventListener('change', (e) => { this.speed = +e.target.value; });
      r.sform.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.m) { this.flashMsg('Primero pulsa Ejecutar.'); return; }
        this.m.sendSerial(r.sinput.value + '\n'); r.sinput.value = ''; this.pulse('RX');
      });
      const addType = this.el.querySelector('[data-r="addType"]');
      if (addType) addType.addEventListener('change', () => this.syncAddPin());
      if (addType) this.syncAddPin();
      this.liveCheck();
    }
    syncAddPin() {
      const t = this.el.querySelector('[data-r="addType"]').value;
      this.el.querySelector('[data-r="addPinWrap"]').hidden = !PART_TYPES[t].fields.includes('pin');
      this.el.querySelector('[data-r="addPin"]').value = PART_TYPES[t].def.pin ?? 13;
    }
    onKey(e) {
      const ta = this.r.ta;
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText('  ', s, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input'));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const s = ta.selectionStart;
        const before = ta.value.slice(0, s);
        const ln = before.slice(before.lastIndexOf('\n') + 1);
        let ind = /^\s*/.exec(ln)[0];
        if (/\{\s*$/.test(ln)) ind += '  ';
        ta.setRangeText('\n' + ind, s, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input'));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.toggleRun(); }
    }
    paintCode() {
      const lines = highlightLines(this.code, false);
      this.lineCount = lines.length;
      this.r.pre.innerHTML = lines.map((l, i) => `<span class="ln" data-l="${i + 1}">${l || ' '}</span>`).join('');
      this.r.gutter.innerHTML = lines.map((_, i) => `<span data-g="${i + 1}">${i + 1}</span>`).join('');
      const n = lines.length;
      this.r.pre.parentElement.style.minHeight = `calc(${n} * var(--ed-lh) + 20px)`;
      this.markLine(this.activeLine, 'active');
      this.markLine(this.errorLine, 'err');
    }
    markLine(n, cls) {
      this.r.pre.querySelectorAll('.ln.' + cls).forEach(x => x.classList.remove(cls));
      this.r.gutter.querySelectorAll('.' + cls).forEach(x => x.classList.remove(cls));
      if (!n) return;
      const l = this.r.pre.querySelector(`[data-l="${n}"]`), g = this.r.gutter.querySelector(`[data-g="${n}"]`);
      if (l) l.classList.add(cls);
      if (g) g.classList.add(cls);
      if (l && cls === 'active') {
        const sc = this.r.scroll, top = l.offsetTop, h = l.offsetHeight;
        if (top < sc.scrollTop || top + h > sc.scrollTop + sc.clientHeight) sc.scrollTop = Math.max(0, top - sc.clientHeight / 2);
      }
    }
    liveCheck() {
      clearTimeout(this._chk);
      this._chk = setTimeout(() => {
        try {
          const m = new Machine(this.code, { parts: this.parts });
          this.errorLine = 0; this.markLine(0, 'err');
          this.renderMsgs(null, m.warnings);
        } catch (e) {
          if (e instanceof SimError) this.showError(e); else console.error(e);
        }
      }, 350);
    }
    showError(e) {
      this.errorLine = e.line; this.markLine(e.line, 'err');
      this.renderMsgs(e, []);
    }
    renderMsgs(err, warns) {
      let h = '';
      if (err) h += `<div class="msg msg-err"><strong>Línea ${err.line}:</strong> ${esc(err.message)}${err.hint ? `<div class="msg-hint">${esc(err.hint)}</div>` : ''}</div>`;
      for (const w of warns.slice(0, 5)) h += `<div class="msg msg-warn"><strong>Línea ${w.line}:</strong> ${esc(w.msg)}</div>`;
      if (this._msgHTML !== h) { this.r.msgs.innerHTML = h; this._msgHTML = h; }
    }
    flashMsg(t) { this.r.msgs.innerHTML = `<div class="msg msg-warn">${esc(t)}</div>`; this._msgHTML = null; }
    caretHelp() {
      if (this.running || this.stepping) return;
      const pos = this.r.ta.selectionStart;
      const line = this.code.slice(0, pos).split('\n').length;
      const key = wordAt(this.code, pos);
      const text = this.code.split('\n')[line - 1] || '';
      const ex = explainLine(text);
      if (!ex && !key) { this.r.now.innerHTML = ''; return; }
      this.r.now.innerHTML = `<div class="now-card"><span class="now-tag">Línea ${line}</span><p>${esc(ex)}</p>${key ? `<button type="button" class="fnlink" data-fn="${esc(key)}">Abrir la ficha de ${esc(key)}</button>` : ''}</div>`;
    }
    compile() {
      try {
        const m = new Machine(this.code, { parts: this.parts, tracing: true });
        m.eeprom = this.eeprom;
        this.errorLine = 0; this.markLine(0, 'err');
        this.renderMsgs(null, m.warnings);
        this.m = m; this.lastTrace = 0; this.plot = []; this.plotPos = 0;
        return true;
      } catch (e) {
        if (e instanceof SimError) { this.showError(e); this.setState('Error'); return false; }
        throw e;
      }
    }
    toggleRun() {
      if (this.running) { this.setRunning(false); this.setState('En pausa'); return; }
      if (!this.m || this.m.halted) { if (!this.compile()) return; }
      this.stepping = false;
      this.activeLine = 0; this.markLine(0, 'active');
      ensureAudio();
      if (activeLab && activeLab !== this) activeLab.setRunning(false);
      activeLab = this;
      this.setRunning(true);
    }
    setRunning(v) {
      this.running = v;
      const btn = this.el.querySelector('[data-a="run"]');
      btn.textContent = v ? '⏸ Pausa' : '▶ Ejecutar';
      btn.classList.toggle('is-running', v);
      if (v) {
        this.setState('Ejecutando');
        this.lastT = 0;
        if (!this.raf) this.raf = setTimeout(tick, FRAME_MS);
      } else {
        if (this.raf) { clearTimeout(this.raf); this.raf = 0; }
        stopTone();
        if (this.m) this.renderVars();
      }
    }
    setState(s) { this.r.state.textContent = s; this.r.state.dataset.s = s; }
    step() {
      if (this.running) this.setRunning(false);
      if (!this.m || this.m.halted) { if (!this.compile()) return; this.render(); }
      this.stepping = true;
      this.setState('Paso a paso');
      if (activeLab && activeLab !== this) activeLab.setRunning(false);
      activeLab = this;
      const line = this.m.stepLine();
      this.render();
      if (this.m.halted) { this.showRuntimeEnd(); return; }
      this.activeLine = line; this.markLine(line, 'active');
      this.renderNow(line);
      this.renderVars();
      if (this.tab !== 'vars' && !this._varsSeen && this.opts.autoVars !== false) { this.selectTab('vars'); this._varsSeen = true; }
    }
    renderNow(line) {
      const text = this.code.split('\n')[line - 1] || '';
      const log = this.m.traceLog;
      const newOnes = log.slice(this.lastTrace);
      this.lastTrace = log.length;
      if (log.length >= 80) { log.splice(0, 40); this.lastTrace = log.length; }
      const t = this.m.now / 1000;
      this.r.now.innerHTML = `<div class="now-card now-step">
        ${newOnes.length ? `<div class="now-did"><span class="now-tag t2">Acaba de ocurrir</span>${newOnes.slice(-3).map(x => `<p>${esc(x.msg)}</p>`).join('')}</div>` : ''}
        <span class="now-tag">Siguiente: línea ${line}</span><code class="now-code">${esc(text.trim())}</code>
        <p>${esc(explainLine(text))}</p>
        <div class="now-meta">Tiempo de la placa: ${t < 1000 ? t.toFixed(1) + ' ms' : (t / 1000).toFixed(2) + ' s'}</div>
      </div>`;
    }
    showRuntimeEnd() {
      const m = this.m;
      if (m.error) { this.showError(m.error); this.setState('Error'); } else this.setState('Terminado');
    }
    stop() {
      if (this.m || this.running) {
        this.setRunning(false); this.m = null; this.stepping = false; this.activeLine = 0; this.markLine(0, 'active');
        this.setState('Detenido'); this.render();
      }
    }
    reset() {
      this.setRunning(false); this.m = null; this.stepping = false; this.activeLine = 0; this.markLine(0, 'active');
      this.r.now.innerHTML = ''; this.plot = []; this.render(); this.setState('Detenido');
      this.buildParts();
    }
    onClick(e) {
      const a = e.target.closest('[data-a]');
      const tab = e.target.closest('[data-tab]');
      if (tab) { this.selectTab(tab.dataset.tab); return; }
      if (e.target.closest('[data-rm]')) { this.parts.splice(+e.target.closest('[data-rm]').dataset.rm, 1); this.stop(); this.buildParts(); return; }
      if (!a) return;
      switch (a.dataset.a) {
        case 'run': this.toggleRun(); break;
        case 'step': this.step(); break;
        case 'reset': this.reset(); break;
        case 'explain': this.explainAll(); break;
        case 'restore': this.setCode(this.original); break;
        case 'clearSerial': if (this.m) this.m.serialOut = ''; this.r.serial.textContent = ''; this.plot = []; break;
        case 'addPart': {
          const t = this.el.querySelector('[data-r="addType"]').value;
          const p = { type: t, ...PART_TYPES[t].def };
          if (PART_TYPES[t].fields.includes('pin')) p.pin = +this.el.querySelector('[data-r="addPin"]').value;
          this.parts.push(p); this.stop(); this.buildParts(); this.opts.onParts && this.opts.onParts(this.parts);
          break;
        }
      }
    }
    setCode(c, parts) {
      this.reset();
      this.code = c; this.r.ta.value = c;
      if (parts) { this.parts = parts.map(p => ({ ...p })); this.buildParts(); }
      this.paintCode(); this.liveCheck();
      this.r.now.innerHTML = '';
    }
    selectTab(t) {
      this.tab = t;
      this.el.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
      this.el.querySelectorAll('[data-p]').forEach(p => { p.hidden = p.dataset.p !== t; });
      if (t === 'vars') this.renderVars();
      if (t === 'plot') this.drawPlot();
    }
    explainAll() {
      const lines = this.code.split('\n');
      const rows = lines.map((l, i) => { const x = explainLine(l); return x ? `<tr><td class="ex-n">${i + 1}</td><td><code>${esc(l.trim())}</code></td><td>${esc(x)}</td></tr>` : ''; }).join('');
      this.r.now.innerHTML = `<div class="now-card"><div class="now-head"><span class="now-tag">Tu código, línea a línea</span><button type="button" class="btn btn-sm btn-ghost" data-close>Cerrar</button></div><div class="ex-wrap"><table class="ex"><tbody>${rows}</tbody></table></div></div>`;
      this.r.now.querySelector('[data-close]').onclick = () => { this.r.now.innerHTML = ''; };
    }
    buildParts() {
      const box = this.r.parts;
      if (!this.parts.length) { box.innerHTML = ''; return; }
      box.innerHTML = this.parts.map((p, i) => this.partHTML(p, i)).join('');
      box.querySelectorAll('[data-btn]').forEach(b => {
        const i = +b.dataset.btn, p = this.parts[i];
        const press = (v) => {
          b.classList.toggle('down', v);
          if (this.m) this.m.setButton(p.pin, v, !!p.bounce);
        };
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); press(true); });
        b.addEventListener('pointerup', () => press(false));
        b.addEventListener('pointercancel', () => press(false));
        b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(true); } });
        b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(false); } });
        b.addEventListener('blur', () => { if (b.classList.contains('down')) press(false); });
      });
      box.querySelectorAll('[data-slide]').forEach(s => {
        const i = +s.dataset.slide, p = this.parts[i];
        s.addEventListener('input', () => {
          const v = +s.value;
          if (p.type === 'sonar') { p.cm = v; if (this.m) this.m.sonarCm = v; }
          else if (p.type === 'tmp36') { p.value = Math.round((v + 50) / 100 * 1023 / 5); if (this.m) this.m.setAnalog(p.pin, p.value); }
          else { p.value = v; if (this.m) this.m.setAnalog(p.pin, v); }
          this.updatePartLabel(i);
        });
      });
      box.querySelectorAll('[data-dht]').forEach(s => s.addEventListener('input', () => {
        if (this.m) this.m.dht[s.dataset.dht] = +s.value;
        s.parentElement.querySelector('output').textContent = s.value + (s.dataset.dht === 't' ? ' °C' : ' %');
      }));
      box.querySelectorAll('[data-sound]').forEach(b => b.addEventListener('click', () => {
        sound.on = !sound.on; ensureAudio();
        box.ownerDocument.querySelectorAll('[data-sound]').forEach(x => { x.textContent = sound.on ? '🔊 Sonido activado' : '🔇 Activar sonido'; x.setAttribute('aria-pressed', sound.on); });
        if (!sound.on) stopTone();
      }));
      this.parts.forEach((_, i) => this.updatePartLabel(i));
    }
    partHTML(p, i) {
      const rm = this.opts.free ? `<button type="button" class="part-x" data-rm="${i}" aria-label="Quitar componente" title="Quitar">×</button>` : '';
      const label = (d) => `<div class="part-l"><strong>${esc(p.label || d)}</strong>${p.pin !== undefined ? `<span class="pin-chip">${pinName(p.pin)}</span>` : ''}${rm}</div>`;
      switch (p.type) {
        case 'led': return `<div class="part part-led" data-part="${i}"><div class="led" data-led style="--c:${COLORS[p.color] || COLORS.rojo}"></div>${label('LED')}</div>`;
        case 'rgb': return `<div class="part part-led" data-part="${i}"><div class="led" data-rgb></div><div class="part-l"><strong>LED RGB</strong><span class="pin-chip">${pinName(p.r)} ${pinName(p.g)} ${pinName(p.b)}</span>${rm}</div></div>`;
        case 'button': return `<div class="part" data-part="${i}"><button type="button" class="pushbtn" data-btn="${i}" aria-label="${esc(p.label || 'Botón')}: mantener pulsado">PULSAR</button>${label(p.bounce ? 'Botón con rebote' : 'Botón')}</div>`;
        case 'pot': case 'ldr': return `<div class="part part-w" data-part="${i}">${label(p.type === 'ldr' ? 'Sensor de luz' : 'Potenciómetro')}<input type="range" min="0" max="1023" value="${p.value ?? 512}" data-slide="${i}" aria-label="${esc(p.label || p.type)}"/><output data-out></output></div>`;
        case 'tmp36': { const tC = Math.round((p.value ?? 153) * 5 / 1023 * 100 - 50); return `<div class="part part-w" data-part="${i}">${label('Temperatura TMP36')}<input type="range" min="-20" max="60" value="${tC}" data-slide="${i}" aria-label="Temperatura"/><output data-out></output></div>`; }
        case 'sonar': return `<div class="part part-w" data-part="${i}"><div class="part-l"><strong>HC-SR04</strong><span class="pin-chip">T${p.trig} E${p.echo}</span>${rm}</div><input type="range" min="2" max="300" value="${p.cm ?? 100}" data-slide="${i}" aria-label="Distancia"/><output data-out></output></div>`;
        case 'dht': return `<div class="part part-w" data-part="${i}">${label('DHT11')}<label class="slim">Temp. <input type="range" min="0" max="50" value="24" data-dht="t"/><output>24 °C</output></label><label class="slim">Humedad <input type="range" min="20" max="90" value="50" data-dht="h"/><output>50 %</output></label></div>`;
        case 'buzzer': return `<div class="part part-buzz" data-part="${i}"><div class="buzz" data-buzz></div>${label('Zumbador')}<output data-out>Silencio</output><button type="button" class="btn btn-sm btn-ghost" data-sound aria-pressed="${sound.on}">${sound.on ? '🔊 Sonido activado' : '🔇 Activar sonido'}</button></div>`;
        case 'servo': return `<div class="part" data-part="${i}"><svg class="servo" viewBox="0 0 80 60" role="img" aria-label="Servo"><rect x="16" y="38" width="48" height="20" rx="3" class="servo-b"/><g data-arm><rect x="38" y="6" width="4" height="36" rx="2" class="servo-a"/></g><circle cx="40" cy="40" r="6" class="servo-c"/></svg>${label('Servo')}<output data-out>—</output></div>`;
        case 'motor': return `<div class="part" data-part="${i}"><svg class="fan" viewBox="0 0 60 60" aria-hidden="true"><g data-fan><path d="M30 30 C26 14 30 6 36 6 C42 6 38 22 30 30 M30 30 C46 26 54 30 54 36 C54 42 38 38 30 30 M30 30 C34 46 30 54 24 54 C18 54 22 38 30 30 M30 30 C14 34 6 30 6 24 C6 18 22 22 30 30" class="fan-b"/></g><circle cx="30" cy="30" r="4" class="fan-c"/></svg>${label('Motor DC')}<output data-out>0 %</output></div>`;
        case 'lcd': return `<div class="part part-w part-lcd" data-part="${i}"><div class="lcd" data-lcd aria-label="Pantalla LCD"></div><div class="part-l"><strong>LCD 16×2</strong>${rm}</div></div>`;
        case 'sr595': return `<div class="part part-w" data-part="${i}"><div class="part-l"><strong>74HC595</strong><span class="pin-chip">D${p.data} C${p.clock} L${p.latch}</span>${rm}</div><div class="srbar" data-sr>${Array.from({ length: 8 }, (_, b) => `<span class="srled" data-bit="${7 - b}"></span>`).join('')}</div></div>`;
      }
      return '';
    }
    updatePartLabel(i) {
      const p = this.parts[i], el = this.r.parts.querySelector(`[data-part="${i}"]`);
      if (!el) return;
      const out = el.querySelector('[data-out]');
      if (!out) return;
      const m = this.m;
      if (p.type === 'pot' || p.type === 'ldr') { const v = p.value ?? 512; out.textContent = `${v} · ${(v * 5 / 1023).toFixed(2)} V`; }
      else if (p.type === 'tmp36') { const v = p.value ?? 153; out.textContent = `${(v * 5 / 1023 * 100 - 50).toFixed(0)} °C · ${(v * 5 / 1023).toFixed(2)} V`; }
      else if (p.type === 'sonar') out.textContent = `${p.cm ?? 100} cm`;
    }
    pulse(which) {
      const led = this.r.board.querySelector(`[data-led="${which}"]`);
      if (!led) return;
      led.style.setProperty('--on', 1);
      clearTimeout(led._t);
      led._t = setTimeout(() => led.style.setProperty('--on', 0), 80);
    }
    render() {
      const m = this.m;
      Board.update(this.r.board, m);
      for (let i = 0; i < this.parts.length; i++) this.renderPart(this.parts[i], i, m);
      if (m) {
        const txt = m.serialOut;
        if (txt.length > 60000) m.serialOut = txt.slice(-30000);
        if (txt !== this._serial) {
          if (txt.length > (this._serial || '').length) this.pulse('TX');
          this.feedPlot(txt);
          this._serial = txt;
          const s = this.r.serial;
          const stick = s.scrollTop + s.clientHeight >= s.scrollHeight - 30;
          s.textContent = txt.slice(-6000);
          if (stick) s.scrollTop = s.scrollHeight;
          if (this.tab === 'plot') this.drawPlot();
        }
        if (m.warnings.length !== this._warnN) { this._warnN = m.warnings.length; this.renderMsgs(m.error, m.warnings); }
        const now = performance.now();
        if (this.tab === 'vars' && now - (this._vt || 0) > 200) { this._vt = now; this.renderVars(); }
        if (this.running && this.speed < 1 && m.curLine) { this.activeLine = m.curLine; this.markLine(m.curLine, 'active'); }
        this.syncTone(m);
      } else {
        this.r.serial.textContent = ''; this._serial = ''; this._warnN = 0;
      }
    }
    feedPlot(txt) {
      if (!this._serial || txt.length < this._serial.length) this.plotPos = 0;
      let i;
      while ((i = txt.indexOf('\n', this.plotPos)) >= 0) {
        const line = txt.slice(this.plotPos, i);
        this.plotPos = i + 1;
        const n = parseFloat(line);
        if (!Number.isNaN(n)) { this.plot.push(n); if (this.plot.length > 240) this.plot.shift(); }
      }
    }
    drawPlot() {
      const cv = this.r.plot, ctx = cv.getContext('2d');
      const w = cv.clientWidth || 300, h = cv.clientHeight || 150, dpr = window.devicePixelRatio || 1;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const css = getComputedStyle(this.el);
      ctx.clearRect(0, 0, w, h);
      const d = this.plot;
      ctx.fillStyle = css.getPropertyValue('--muted'); ctx.font = '11px ' + css.getPropertyValue('--mono');
      if (d.length < 2) { ctx.fillText('Sin datos todavía: imprime números con Serial.println()', 8, 20); return; }
      let lo = Math.min(...d), hi = Math.max(...d);
      if (lo === hi) { lo -= 1; hi += 1; }
      const Y = (v) => h - 16 - (v - lo) / (hi - lo) * (h - 32);
      ctx.strokeStyle = css.getPropertyValue('--line'); ctx.lineWidth = 1;
      [lo, hi].forEach(v => { ctx.beginPath(); ctx.moveTo(0, Y(v)); ctx.lineTo(w, Y(v)); ctx.stroke(); ctx.fillText(String(+v.toFixed(2)), 4, Y(v) - 3); });
      ctx.strokeStyle = css.getPropertyValue('--copper'); ctx.lineWidth = 2; ctx.beginPath();
      d.forEach((v, i) => { const x = i / (d.length - 1) * w; i ? ctx.lineTo(x, Y(v)) : ctx.moveTo(x, Y(v)); });
      ctx.stroke();
    }
    renderVars() {
      const v = this.r.vars;
      if (!this.m) { v.innerHTML = '<p class="hint-s">Pulsa <strong>Paso</strong> o <strong>Ejecutar</strong> para ver tus variables.</p>'; return; }
      const s = this.m.snapshot();
      const row = (x) => {
        const key = x.name; const changed = this._prevVars && this._prevVars[key] !== undefined && this._prevVars[key] !== x.value;
        return `<tr class="${changed ? 'chg' : ''}"><td><code>${esc(x.name)}</code></td><td class="v-t">${esc(x.type)}</td><td class="v-v">${esc(x.value)}</td></tr>`;
      };
      const sec = (title, list) => list.length ? `<h5>${title}</h5><table><tbody>${list.map(row).join('')}</tbody></table>` : '';
      v.innerHTML = sec(s.fn ? `Dentro de ${esc(s.fn)}()` : 'Locales', s.locals) + sec('Globales', s.globals) + (!s.locals.length && !s.globals.length ? '<p class="hint-s">Este programa aún no tiene variables.</p>' : '');
      const prev = {}; [...s.locals, ...s.globals].forEach(x => { prev[x.name] = x.value; }); this._prevVars = prev;
    }
    renderPart(p, i, m) {
      const el = this.r.parts.querySelector(`[data-part="${i}"]`);
      if (!el) return;
      switch (p.type) {
        case 'led': el.querySelector('[data-led]').style.setProperty('--on', m ? m.brightness(p.pin) : 0); break;
        case 'rgb': { const c = [p.r, p.g, p.b].map(x => m ? m.brightness(x) : 0); const led = el.querySelector('[data-rgb]'); const mx = Math.max(...c); led.style.setProperty('--on', mx); led.style.setProperty('--c', `rgb(${c.map(x => Math.round(x / (mx || 1) * 255)).join(',')})`); break; }
        case 'servo': { const a = m && m.servos[p.pin] !== undefined ? m.servos[p.pin] : 90; el.querySelector('[data-arm]').setAttribute('transform', `rotate(${a - 90} 40 40)`); el.querySelector('[data-out]').textContent = m && m.servos[p.pin] !== undefined ? a + '°' : '—'; break; }
        case 'motor': {
          const b = m ? m.brightness(p.pin) : 0;
          el.querySelector('[data-out]').textContent = Math.round(b * 100) + ' %';
          this._fan = this._fan || {}; this._fan[i] = ((this._fan[i] || 0) + b * 24) % 360;
          el.querySelector('[data-fan]').setAttribute('transform', `rotate(${this._fan[i]} 30 30)`);
          break;
        }
        case 'buzzer': {
          const on = m && m.toneS && m.toneS.pin === p.pin;
          el.querySelector('[data-buzz]').classList.toggle('on', !!on);
          el.querySelector('[data-out]').textContent = on ? m.toneS.freq + ' Hz' : 'Silencio';
          break;
        }
        case 'lcd': {
          const l = m && m.lcd;
          const box = el.querySelector('[data-lcd]');
          const lines = l && l.on ? l.lines.slice(0, 2).map(x => x.slice(0, 16)) : ['', ''];
          const key = lines.join('\n');
          if (box._k !== key) {
            box._k = key;
            box.innerHTML = lines.map(t => `<div class="lcd-row">${Array.from({ length: 16 }, (_, k) => `<span>${esc((t[k] || ' ').replace(' ', ' '))}</span>`).join('')}</div>`).join('');
          }
          box.classList.toggle('dark', !!(l && !l.backlight));
          break;
        }
        case 'sr595': {
          const v = m ? (m.shiftLatched[p.latch] ?? 0) : 0;
          el.querySelectorAll('[data-bit]').forEach(b => b.classList.toggle('on', !!((v >> +b.dataset.bit) & 1)));
          break;
        }
      }
    }
    syncTone(m) {
      if (!sound.on || !this.running) { stopTone(); return; }
      if (m.toneS && this.parts.some(p => p.type === 'buzzer' && p.pin === m.toneS.pin)) startTone(m.toneS.freq); else stopTone();
    }
    destroy() { this.setRunning(false); clearTimeout(this._chk); if (activeLab === this) activeLab = null; stopTone(); }
  }

  function ensureAudio() {
    if (!sound.on || audio) { if (audio && audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx(), gain = ctx.createGain();
    gain.gain.value = 0; gain.connect(ctx.destination);
    const osc = ctx.createOscillator(); osc.type = 'square'; osc.connect(gain); osc.start();
    audio = { ctx, gain, osc };
  }
  function startTone(f) { if (!audio) ensureAudio(); if (!audio) return; audio.osc.frequency.setTargetAtTime(f, audio.ctx.currentTime, 0.001); audio.gain.gain.setTargetAtTime(0.035, audio.ctx.currentTime, 0.005); }
  function stopTone() { if (audio) audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.005); }

  root.Pin13Lab = { Lab, PART_TYPES, stopAll() { if (activeLab) activeLab.destroy(); } };
})(typeof globalThis !== 'undefined' ? globalThis : this);

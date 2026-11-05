/* Pin 13 — máquina virtual: comprueba el programa y lo ejecuta como un Arduino UNO R3 virtual
   (int de 16 bits, ADC de 10 bits, PWM en 3,5,6,9,10,11, interrupciones en 2 y 3). */
(function (root) {
  'use strict';
  const P = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./parser.js') : root.Pin13Parser;
  const { SimError, Parser, CLASSES, GLOBAL_OBJECTS } = P;

  const PWM_PINS = new Set([3, 5, 6, 9, 10, 11]);
  const WAIT = -1, COST_US = 8;
  const BRK = { c: 'break' }, CONT = { c: 'continue' };

  const CONSTS = {
    HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, LED_BUILTIN: 13,
    A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19,
    DEC: 10, HEX: 16, OCT: 8, BIN: 2, RISING: 3, FALLING: 2, CHANGE: 1,
    MSBFIRST: 1, LSBFIRST: 0, DEFAULT: 1, INTERNAL: 3, EXTERNAL: 0, DHT11: 11, DHT22: 22, NULL: 0,
    SS: 10, MOSI: 11, MISO: 12, SCK: 13, SDA: 18, SCL: 19, LCD_2LINE: 8
  };
  const FCONSTS = { PI: Math.PI, HALF_PI: Math.PI / 2, TWO_PI: Math.PI * 2, DEG_TO_RAD: Math.PI / 180, RAD_TO_DEG: 180 / Math.PI };
  const RANK = { bool: 0, char: 0, byte: 0, int8: 0, int: 1, uint: 2, long: 3, ulong: 4, float: 5 };
  const BYTES = { bool: 1, char: 1, byte: 1, int8: 1, int: 2, uint: 2, long: 4, ulong: 4, float: 4, String: 6, cstr: 2 };

  function wrap(t, v) {
    switch (t) {
      case 'bool': return v ? 1 : 0;
      case 'byte': return Math.trunc(v) & 255;
      case 'char': case 'int8': { const x = Math.trunc(v) & 255; return x > 127 ? x - 256 : x; }
      case 'int': { const x = Math.trunc(v) & 65535; return x > 32767 ? x - 65536 : x; }
      case 'uint': return Math.trunc(v) & 65535;
      case 'long': return Math.trunc(v) | 0;
      case 'ulong': return Math.trunc(v) >>> 0;
      case 'float': return Math.fround(v);
      default: return v;
    }
  }
  function arrToStr(c) {
    let s = '';
    for (const it of c.arr) { if (!it.v) break; s += String.fromCharCode(it.v & 255); }
    return s;
  }
  function fmtFloat(v, d = 2) {
    if (Number.isNaN(v)) return 'nan';
    if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf';
    if (Math.abs(v) > 4294967040) return 'ovf';
    return v.toFixed(d);
  }
  function toStr(a) {
    switch (a.t) {
      case 'String': case 'cstr': return a.v;
      case 'array': return a.elem === 'char' ? arrToStr(a) : '[array]';
      case 'char': return String.fromCharCode(a.v & 255);
      case 'float': return fmtFloat(a.v);
      case 'obj': return '[objeto]';
      default: return String(a.v);
    }
  }
  function num(a) {
    if (a.t === 'String' || a.t === 'cstr') return a.v.length ? 1 : 0;
    if (a.t === 'array') return 1;
    return a.v;
  }
  const isStr = (a) => a.t === 'String' || a.t === 'cstr' || (a.t === 'array' && a.elem === 'char');
  const V = (t, v) => ({ t, v });
  const I = (v) => ({ t: 'int', v: wrap('int', v) });
  const L = (v) => ({ t: 'long', v: wrap('long', v) });
  const UL = (v) => ({ t: 'ulong', v: wrap('ulong', v) });
  const B = (v) => ({ t: 'bool', v: v ? 1 : 0 });
  const FL = (v) => ({ t: 'float', v: Math.fround(v) });
  const VOID = { t: 'void', v: 0 };
  function promote(a, b) {
    const ra = RANK[a] ?? 1, rb = RANK[b] ?? 1;
    const r = Math.max(ra, rb, 1);
    return ['int', 'int', 'uint', 'long', 'ulong', 'float'][r];
  }
  function mul(t, a, b) {
    if (t === 'float') return a * b;
    return Math.imul(a, b);
  }

  // Aridad de las funciones integradas [mín, máx]
  const ARITY = {
    pinMode: [2, 2], digitalWrite: [2, 2], digitalRead: [1, 1], analogRead: [1, 1], analogWrite: [2, 2], analogReference: [1, 1],
    tone: [2, 3], noTone: [1, 1], pulseIn: [2, 3], pulseInLong: [2, 3], shiftOut: [4, 4], shiftIn: [3, 3],
    delay: [1, 1], delayMicroseconds: [1, 1], millis: [0, 0], micros: [0, 0],
    abs: [1, 1], constrain: [3, 3], map: [5, 5], max: [2, 2], min: [2, 2], pow: [2, 2], sq: [1, 1], sqrt: [1, 1],
    sin: [1, 1], cos: [1, 1], tan: [1, 1], random: [1, 2], randomSeed: [1, 1],
    bit: [1, 1], bitClear: [2, 2], bitRead: [2, 2], bitSet: [2, 2], bitWrite: [3, 3], highByte: [1, 1], lowByte: [1, 1],
    attachInterrupt: [3, 3], detachInterrupt: [1, 1], digitalPinToInterrupt: [1, 1], interrupts: [0, 0], noInterrupts: [0, 0],
    F: [1, 1], strlen: [1, 1], strcmp: [2, 2], strcpy: [2, 2], atoi: [1, 1], atof: [1, 1], round: [1, 1], floor: [1, 1], ceil: [1, 1], fabs: [1, 1], log: [1, 1], radians: [1, 1], degrees: [1, 1]
  };
  const CHAR_FNS = {
    isAlpha: c => /[A-Za-z]/.test(c), isAlphaNumeric: c => /[A-Za-z0-9]/.test(c), isDigit: c => /[0-9]/.test(c),
    isHexadecimalDigit: c => /[0-9A-Fa-f]/.test(c), isLowerCase: c => /[a-z]/.test(c), isUpperCase: c => /[A-Z]/.test(c),
    isSpace: c => /[ \t\n\r\f\v]/.test(c), isWhitespace: c => /[ \t]/.test(c), isPunct: c => /[!-\/:-@\[-`{-~]/.test(c),
    isAscii: c => c.charCodeAt(0) < 128, isControl: c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
    isGraph: c => c.charCodeAt(0) > 32 && c.charCodeAt(0) < 127, isPrintable: c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127
  };
  for (const k in CHAR_FNS) ARITY[k] = [1, 1];

  const METHODS = {
    Serial: ['begin', 'end', 'print', 'println', 'available', 'availableForWrite', 'read', 'peek', 'write', 'flush', 'parseInt', 'parseFloat', 'readString', 'readStringUntil', 'setTimeout'],
    Servo: ['attach', 'write', 'writeMicroseconds', 'read', 'readMicroseconds', 'attached', 'detach'],
    LiquidCrystal: ['begin', 'clear', 'home', 'setCursor', 'print', 'write', 'display', 'noDisplay', 'blink', 'noBlink', 'cursor', 'noCursor'],
    LiquidCrystal_I2C: ['init', 'begin', 'backlight', 'noBacklight', 'clear', 'home', 'setCursor', 'print', 'write', 'display', 'noDisplay', 'blink', 'noBlink', 'cursor', 'noCursor'],
    DHT: ['begin', 'readTemperature', 'readHumidity'],
    Wire: ['begin', 'beginTransmission', 'endTransmission', 'write', 'requestFrom', 'available', 'read', 'setClock'],
    SPI: ['begin', 'end', 'transfer', 'setBitOrder', 'setClockDivider', 'setDataMode'],
    EEPROM: ['read', 'write', 'update', 'length', 'put', 'get'],
    String: ['length', 'charAt', 'setCharAt', 'substring', 'indexOf', 'lastIndexOf', 'toInt', 'toFloat', 'trim', 'toUpperCase', 'toLowerCase', 'equals', 'equalsIgnoreCase', 'startsWith', 'endsWith', 'concat', 'replace', 'remove', 'c_str', 'toCharArray', 'compareTo', 'reserve']
  };

  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function suggest(name, list) {
    let best = null, bd = 3;
    for (const c of list) {
      if (c.toLowerCase() === name.toLowerCase()) return c;
      if (Math.abs(c.length - name.length) > 2) continue;
      const x = lev(name, c);
      if (x < bd) { bd = x; best = c; }
    }
    return best;
  }

  /* ---------- Comprobación previa (lo que haría el compilador) ---------- */
  function check(prog) {
    const warnings = [];
    const globals = new Map();
    const allFns = Object.keys(prog.fns);
    const builtin = Object.keys(ARITY);
    const objInc = (name, line) => {
      const h = GLOBAL_OBJECTS[name];
      if (h && !prog.includes.includes(h)) throw new SimError('No sé qué es "' + name + '".', line, 'Falta #include <' + h + '> al principio del programa.');
    };
    function visibleNames(scopes) {
      const out = [...allFns, ...builtin, ...Object.keys(CONSTS), ...Object.keys(FCONSTS), 'Serial', ...globals.keys()];
      for (const s of scopes) out.push(...s.keys());
      return out;
    }
    function find(scopes, name) {
      for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(name)) return scopes[i].get(name);
      return globals.get(name);
    }
    function exprType(n, scopes) {
      if (n.k === 'id') { const d = find(scopes, n.name); if (d) return d; if (n.name in GLOBAL_OBJECTS) return { base: n.name }; }
      return null;
    }
    function e(n, scopes) {
      if (!n) return;
      switch (n.k) {
        case 'num': case 'str': case 'sizeofT': return;
        case 'id': {
          if (find(scopes, n.name) || n.name in CONSTS || n.name in FCONSTS || prog.fns[n.name]) return;
          if (n.name in GLOBAL_OBJECTS) { objInc(n.name, n.line); return; }
          const s = suggest(n.name, visibleNames(scopes));
          throw new SimError('La variable "' + n.name + '" no está declarada en este punto.', n.line,
            s ? '¿Quisiste decir "' + s + '"? C++ distingue mayúsculas de minúsculas.' : 'Declárala antes de usarla, por ejemplo: int ' + n.name + ' = 0;  Si la declaraste dentro de otra función o bloque { }, aquí no existe.');
        }
        case 'call': {
          const fl = prog.fns[n.name];
          if (fl) {
            if (!fl.some(f => n.args.length <= f.params.length && n.args.length >= f.params.filter(p => !p.def).length)) {
              const f = fl[0];
              throw new SimError('La función ' + n.name + '() recibe ' + f.params.length + ' dato(s) y le pasas ' + n.args.length + '.', n.line);
            }
          } else if (ARITY[n.name]) {
            const [a, b] = ARITY[n.name];
            if (n.args.length < a || n.args.length > b) {
              throw new SimError(n.name + '() necesita ' + (a === b ? a : a + ' a ' + b) + ' dato(s) y le pasas ' + n.args.length + '.', n.line, 'Abre su ficha en el diccionario de funciones para ver los parámetros.');
            }
          } else {
            const s = suggest(n.name, [...allFns, ...builtin]);
            throw new SimError('La función "' + n.name + '" no existe.', n.line, s ? '¿Quisiste decir ' + s + '()? C++ distingue mayúsculas de minúsculas.' : 'Revisa el nombre o escríbela tú mismo.');
          }
          n.args.forEach(a => e(a, scopes)); return;
        }
        case 'method': {
          const d = exprType(n.o, scopes);
          e(n.o, scopes);
          if (d) {
            const list = METHODS[d.base];
            if (list && !list.includes(n.name)) {
              const s = suggest(n.name, list);
              throw new SimError(d.base + ' no tiene el método "' + n.name + '" (o el simulador no lo incluye).', n.line, s ? '¿Quisiste decir ' + s + '()?' : 'Métodos disponibles: ' + list.join(', '));
            }
          }
          n.args.forEach(a => e(a, scopes)); return;
        }
        case 'member': e(n.o, scopes); return;
        case 'index': e(n.a, scopes); e(n.idx, scopes); return;
        case 'assign': {
          if (n.l.k === 'id') {
            const d = find(scopes, n.l.name);
            if (d && d.isConst) throw new SimError('"' + n.l.name + '" es const: no se puede cambiar.', n.line, 'Quita const de su declaración si de verdad debe cambiar.');
            if (!d && n.l.name in CONSTS) throw new SimError('"' + n.l.name + '" es una constante de Arduino: no se puede cambiar.', n.line);
          }
          e(n.l, scopes); e(n.r, scopes); return;
        }
        case 'incdec': case 'unary': case 'cast': case 'sizeof': e(n.e, scopes); return;
        case 'bin': case 'logic': case 'comma': e(n.l, scopes); e(n.r, scopes); return;
        case 'ternary': e(n.c, scopes); e(n.a, scopes); e(n.b, scopes); return;
        case 'ctorcast': n.args.forEach(a => e(a, scopes)); return;
        case 'initlist': n.items.forEach(a => e(a, scopes)); return;
      }
    }
    function cond(c) {
      if (c && c.k === 'assign' && c.op === '=') warnings.push({ line: c.line, msg: 'Aquí usas = (asignar) dentro de una condición. Para comparar se usa ==.' });
    }
    function declare(d, scopes) {
      if (d.init) e(d.init, scopes);
      if (d.ctorArgs) d.ctorArgs.forEach(a => e(a, scopes));
      d.dims.forEach(x => x && e(x, scopes));
      const scope = scopes.length ? scopes[scopes.length - 1] : globals;
      if (scope.has(d.name)) throw new SimError('La variable "' + d.name + '" ya está declarada aquí.', d.line, 'Para cambiar su valor escribe ' + d.name + ' = ...; sin repetir el tipo.');
      scope.set(d.name, { base: d.type.base, isConst: d.type.isConst && !d.dims.length });
    }
    function s(n, scopes) {
      if (!n) return;
      switch (n.k) {
        case 'block': { const sc = [...scopes, new Map()]; n.body.forEach(x => s(x, sc)); return; }
        case 'decl': declare(n, scopes); return;
        case 'decls': n.decls.forEach(d => declare(d, scopes)); return;
        case 'exprs': n.es.forEach(x => e(x, scopes)); return;
        case 'expr': e(n.e, scopes); return;
        case 'if':
          cond(n.cond); e(n.cond, scopes);
          if (n.then.k === 'empty') warnings.push({ line: n.line, msg: 'Hay un ; justo después del if: la condición no controla nada.' });
          s(n.then, scopes); s(n.other, scopes); return;
        case 'while': cond(n.cond); e(n.cond, scopes);
          if (n.body.k === 'empty') warnings.push({ line: n.line, msg: 'Hay un ; justo después del while: el bucle no tiene cuerpo.' });
          s(n.body, scopes); return;
        case 'dowhile': s(n.body, scopes); e(n.cond, scopes); return;
        case 'for': {
          const sc = [...scopes, new Map()];
          s(n.init, sc); e(n.cond, sc); n.update.forEach(x => e(x, sc));
          if (n.body.k === 'empty') warnings.push({ line: n.line, msg: 'Hay un ; justo después del for: el bucle no repite nada.' });
          s(n.body, sc); return;
        }
        case 'switch': {
          e(n.val, scopes); const sc = [...scopes, new Map()];
          n.labels.forEach(l => e(l.v, sc)); n.stmts.forEach(x => s(x, sc)); return;
        }
        case 'return': e(n.val, scopes); return;
      }
    }
    prog.decls.forEach(d => declare(d, []));
    for (const name in prog.fns) for (const f of prog.fns[name]) {
      const sc = [new Map()];
      for (const p of f.params) sc[0].set(p.name, { base: p.type.base, isConst: p.type.isConst && !p.isArr && !p.ref });
      s(f.body, sc);
    }
    if (!prog.fns.setup) throw new SimError('Falta la función setup().', 1, 'Todo programa de Arduino necesita: void setup() { }  y  void loop() { }');
    if (!prog.fns.loop) throw new SimError('Falta la función loop().', 1, 'Todo programa de Arduino necesita: void setup() { }  y  void loop() { }');
    return warnings;
  }

  /* ---------- Máquina ---------- */
  class Machine {
    constructor(code, opts = {}) {
      const parser = new Parser(code);
      this.prog = parser.parseProgram();
      this.staticWarnings = check(this.prog);
      this.parts = opts.parts || [];
      this.tracing = !!opts.tracing;
      this.reset();
    }
    reset() {
      this.now = 0; this.wakeAt = 0; this.halted = false; this.error = null;
      this.pins = Array.from({ length: 20 }, () => ({ mode: 0, dig: 0, pwm: null }));
      this.pinLog = [];
      this.buttons = {}; this.analog = {}; this.sonarCm = 100; this.sonarTrig = false; this.sonarArmed = false;
      this.dht = { t: 24, h: 50 };
      for (const p of this.parts) {
        if (p.type === 'button' && p.start) this.buttons[p.pin] = true;
        if (p.type === 'pot' || p.type === 'ldr' || p.type === 'tmp36') this.analog[p.pin] = p.value ?? 512;
        if (p.type === 'sonar' && p.cm) this.sonarCm = p.cm;
      }
      this.serialOut = ''; this.serialIn = ''; this.serialBegun = false; this.serialBaud = 0; this.serialTimeout = 1000;
      this.warnings = this.staticWarnings.slice(); this.warnSeen = new Set();
      this.frames = []; this.globals = new Map(); this.statics = new Map();
      this.isr = {}; this.pending = []; this.inIsr = false; this.intOn = true;
      this.events = []; this.rng = 2463534242; this.toneS = null; this.toneLog = [];
      this.servos = {}; this.lcd = null; this.eeprom = this.eeprom || new Uint8Array(1024).fill(255);
      this.shiftLatched = {}; this.shiftBuf = {}; this.wireTx = null; this.i2cDevices = [0x27];
      this.traceLog = []; this.curLine = 0; this.steps = 0; this.usedRam = 0;
      this.gen = this.program();
    }
    warn(msg, line) {
      const key = msg;
      if (this.warnSeen.has(key)) return;
      this.warnSeen.add(key);
      this.warnings.push({ line: line ?? this.curLine, msg });
    }
    T(msg) { if (this.tracing) { this.traceLog.push({ line: this.curLine, msg }); if (this.traceLog.length > 80) this.traceLog.shift(); } }
    rand() { let x = this.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.rng = x >>> 0; return this.rng; }

    /* ---- pines ---- */
    levelOf(pin) {
      const p = this.pins[pin];
      if (!p) return 0;
      if (p.mode === 1) return p.pwm !== null ? (p.pwm > 127 ? 1 : 0) : p.dig;
      const btn = this.parts.find(x => x.type === 'button' && x.pin === pin);
      if (btn) {
        const pressed = !!this.buttons[pin];
        return p.mode === 2 ? (pressed ? 0 : 1) : (pressed ? 1 : 0);
      }
      if (pin in this.analog) return this.analog[pin] > 512 ? 1 : 0;
      if (p.mode === 2) return 1;
      if (p.dig) return 1;
      return null; // flotante
    }
    fireIfChanged(pin, before) {
      const after = this.levelOf(pin);
      const h = this.isr[pin];
      if (!h || before === after) return;
      if (h.mode === CONSTS.CHANGE || (h.mode === CONSTS.RISING && after === 1) || (h.mode === CONSTS.FALLING && after === 0)) this.pending.push(h.fn);
    }
    setButton(pin, pressed, bounce) {
      const apply = (v) => { const b = this.levelOf(pin); this.buttons[pin] = v; this.fireIfChanged(pin, b); };
      apply(pressed);
      if (bounce) [[600, !pressed], [1300, pressed], [2200, !pressed], [3200, pressed], [4600, !pressed], [5400, pressed]]
        .forEach(([dt, v]) => this.at(this.now + dt, () => apply(v)));
    }
    setAnalog(pin, val) { this.analog[pin] = Math.max(0, Math.min(1023, Math.round(val))); }
    sendSerial(txt) { this.serialIn += txt; }
    at(t, fn) { this.events.push({ t, fn }); this.events.sort((a, b) => a.t - b.t); }
    pump() { while (this.events.length && this.events[0].t <= this.now) this.events.shift().fn(); }
    logPin(pin) {
      if (this.pinLog.length > 50000) this.pinLog.splice(0, 10000);
      const p = this.pins[pin];
      this.pinLog.push({ t: this.now, pin, v: p.pwm !== null ? p.pwm / 255 : p.dig, pwm: p.pwm });
    }
    brightness(pin) {
      const p = this.pins[pin]; if (!p) return 0;
      if (p.mode !== 1) return p.dig ? 0.08 : 0;
      return p.pwm !== null ? p.pwm / 255 : p.dig;
    }

    /* ---- control de ejecución ---- */
    rawStep() {
      this.pump();
      try {
        const r = this.gen.next();
        if (r.done) { this.halted = true; return null; }
        if (r.value !== WAIT) { this.curLine = r.value; this.now += COST_US; this.steps++; }
        return r.value;
      } catch (e) {
        this.halted = true;
        if (e instanceof SimError) this.error = e;
        else if (e instanceof RangeError) this.error = new SimError('Se agotó la memoria de la pila: demasiadas llamadas anidadas.', this.curLine, 'Revisa si una función se llama a sí misma sin condición de parada.');
        else throw e;
        return null;
      }
    }
    advance(dtMs, budget = 60000) {
      if (this.halted) return;
      const target = this.now + dtMs * 1000;
      let n = 0;
      while (this.now < target && !this.halted) {
        this.pump();
        if (this.wakeAt > this.now && !this.pending.length && !this.inIsr) {
          const ev = this.events.length ? this.events[0].t : Infinity;
          this.now = Math.min(this.wakeAt, target, Math.max(ev, this.now));
          if (ev <= this.now) continue;
          if (this.now >= target) break;
          continue;
        }
        if (n++ > budget) { this.now = target; break; }
        this.rawStep();
      }
      this.pump();
      this.checkTone();
    }
    // Ejecuta hasta la siguiente línea. La línea devuelta es la que está A PUNTO de ejecutarse.
    stepLine() {
      for (let i = 0; i < 100000 && !this.halted; i++) {
        if (this.wakeAt > this.now && !this.pending.length && !this.inIsr) { this.now = this.wakeAt; this.pump(); }
        const v = this.rawStep();
        if (v !== WAIT && v !== null) { this.checkTone(); return v; }
      }
      return null;
    }
    // Ejecución sin tiempo real, para corregir retos. stim: [{at(ms), button/analog/serial/...}]
    runFor(ms, stim = []) {
      const list = stim.slice().sort((a, b) => a.at - b.at);
      for (const st of list) this.at(st.at * 1000, () => {
        if ('button' in st) this.setButton(st.button, st.pressed, st.bounce);
        if ('analog' in st) this.setAnalog(st.analog, st.value);
        if ('serial' in st) this.sendSerial(st.serial);
        if ('sonar' in st) this.sonarCm = st.sonar;
        if ('temp' in st) this.dht.t = st.temp;
      });
      const end = ms * 1000;
      let guard = 0;
      while (this.now < end && !this.halted && guard++ < 6000000) {
        this.pump();
        if (this.wakeAt > this.now && !this.pending.length && !this.inIsr) {
          const ev = this.events.length ? this.events[0].t : Infinity;
          this.now = Math.min(this.wakeAt, end, Math.max(ev, this.now));
          continue;
        }
        this.rawStep();
      }
      this.pump(); this.checkTone();
      return this;
    }
    edges(pin) {
      const out = []; let last = null;
      for (const e of this.pinLog) if (e.pin === pin && e.v !== last) { out.push({ t: e.t / 1000, v: e.v }); last = e.v; }
      return out;
    }
    checkTone() { if (this.toneS && this.toneS.until && this.now >= this.toneS.until) this.toneS = null; }
    snapshot() {
      const fmt = (c) => {
        if (c.t === 'array') return '{' + c.arr.slice(0, 12).map(fmt).join(', ') + (c.arr.length > 12 ? ', …' : '') + '}';
        if (c.t === 'struct') return '{' + Object.keys(c.fields).map(k => k + ': ' + fmt(c.fields[k])).join(', ') + '}';
        if (c.t === 'obj') return c.kind;
        if (c.t === 'String' || c.t === 'cstr') return '"' + c.v + '"';
        if (c.t === 'char') return c.v + " '" + String.fromCharCode(c.v & 255) + "'";
        if (c.t === 'bool') return c.v ? 'true' : 'false';
        if (c.t === 'float') return fmtFloat(c.v, 3);
        return String(c.v);
      };
      const list = (m) => [...m.entries()].filter(([, c]) => !c.hidden).map(([n, c]) => ({ name: n, type: c.t === 'array' ? c.elem + '[]' : (c.t === 'obj' ? c.kind : c.t), value: fmt(c) }));
      const f = this.frames[this.frames.length - 1];
      const locals = [];
      if (f) for (const s of f.scopes) locals.push(...list(s));
      return { globals: list(this.globals), locals, fn: f ? f.name : null, stack: this.frames.map(x => x.name) };
    }

    /* ---- variables ---- */
    lookup(name) {
      const f = this.frames[this.frames.length - 1];
      if (f) for (let i = f.scopes.length - 1; i >= 0; i--) { const c = f.scopes[i].get(name); if (c) return c; }
      return this.globals.get(name);
    }
    sizeOfCell(c) {
      if (c.t === 'array') return c.arr.reduce((a, x) => a + this.sizeOfCell(x), 0);
      if (c.t === 'struct') return Object.values(c.fields).reduce((a, x) => a + this.sizeOfCell(x), 0);
      return BYTES[c.t] || 2;
    }
    newCell(type) {
      const b = type.base;
      if (type.isClass) return this.newObj(b, []);
      if (type.isStruct || this.prog.structs[b]) {
        const c = { t: 'struct', sname: b, fields: {} };
        for (const fd of this.prog.structs[b]) c.fields[fd.name] = fd.dims.length ? this.newArray(fd.type, fd.dims.map(d => this.constEval(d))) : this.newCell(fd.type);
        return c;
      }
      return { t: b, v: b === 'String' ? '' : 0 };
    }
    constEval(n) {
      if (!n) return 0;
      const g = this.evalPure(n);
      return g.v;
    }
    evalPure(n) { const it = this.ev(n); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
    newArray(type, dims) {
      const [d, ...rest] = dims;
      const arr = [];
      for (let i = 0; i < d; i++) arr.push(rest.length ? this.newArray(type, rest) : this.newCell(type));
      return { t: 'array', elem: type.base, arr };
    }
    newObj(kind, args) {
      const o = { t: 'obj', kind, v: 1 };
      if (kind === 'Servo') { o.pin = null; o.angle = 90; }
      if (kind === 'LiquidCrystal' || kind === 'LiquidCrystal_I2C') {
        o.cols = kind === 'LiquidCrystal_I2C' && args[1] ? args[1].v : 16;
        o.rows = kind === 'LiquidCrystal_I2C' && args[2] ? args[2].v : 2;
        this.lcd = { cols: o.cols, rows: o.rows, lines: Array.from({ length: Math.max(o.rows, 2) }, () => ' '.repeat(Math.max(o.cols, 16))), cx: 0, cy: 0, on: true, backlight: true, begun: false };
      }
      if (kind === 'DHT') { o.pin = args[0] ? args[0].v : 2; }
      return o;
    }
    copyInto(cell, val) {
      switch (cell.t) {
        case 'String': cell.v = toStr(val); return;
        case 'struct':
          if (val.t !== 'struct') throw new SimError('No se puede asignar ese valor a un struct.', this.curLine);
          for (const k in cell.fields) this.copyInto(cell.fields[k], val.fields[k]);
          return;
        case 'array':
          throw new SimError('Un array no se puede asignar entero; copia sus elementos uno a uno.', this.curLine);
        case 'obj': throw new SimError('Este objeto no se puede asignar.', this.curLine);
        default:
          if (isStr(val)) {
            if (cell.t === 'char' && false) return;
            throw new SimError('No puedes guardar texto en una variable de tipo ' + cell.t + '.', this.curLine, 'Para texto usa String.');
          }
          cell.v = wrap(cell.t, num(val));
      }
    }
    *initDecl(d, scope) {
      const line = d.line;
      if (d.type.isStatic && this.frames.length) {
        const key = d;
        if (this.statics.has(key)) { scope.set(d.name, this.statics.get(key)); return; }
      }
      let cell;
      if (d.dims.length) {
        const dims = [];
        for (let i = 0; i < d.dims.length; i++) {
          if (d.dims[i]) dims.push((yield* this.ev(d.dims[i])).v);
          else if (d.init && d.init.k === 'initlist') dims.push(d.init.items.length);
          else if (d.init && d.init.k === 'str') dims.push(d.init.v.length + 1);
          else throw new SimError('El array "' + d.name + '" necesita un tamaño o una lista de valores.', line);
        }
        cell = this.newArray(d.type, dims);
        if (d.init) yield* this.fillInit(cell, d.init, line);
        const bytes = this.sizeOfCell(cell);
        if (bytes > 2048) this.warn('El array "' + d.name + '" ocupa ' + bytes + ' bytes, pero el UNO R3 solo tiene 2048 de SRAM. En la placa real fallaría.', line);
      } else if (d.type.isClass) {
        const args = [];
        for (const a of d.ctorArgs || []) args.push(yield* this.ev(a));
        cell = this.newObj(d.type.base, args);
      } else {
        cell = this.newCell(d.type);
        if (d.init) {
          if (d.init.k === 'initlist') yield* this.fillStruct(cell, d.init, line);
          else this.copyInto(cell, yield* this.ev(d.init));
        } else if (d.ctorArgs && d.ctorArgs.length) this.copyInto(cell, yield* this.ev(d.ctorArgs[0]));
      }
      if (d.type.isConst) cell.isConst = true;
      if (d.type.isStatic && this.frames.length) this.statics.set(d, cell);
      scope.set(d.name, cell);
    }
    *fillInit(cell, init, line) {
      if (init.k === 'str') {
        const s = init.v;
        if (s.length + 1 > cell.arr.length) throw new SimError('El texto no cabe en el array: necesita ' + (s.length + 1) + ' posiciones (incluye el \\0 final).', line);
        for (let i = 0; i < s.length; i++) cell.arr[i].v = s.charCodeAt(i);
        return;
      }
      if (init.k !== 'initlist') throw new SimError('Un array se inicializa con una lista entre llaves: { 1, 2, 3 }.', line);
      if (init.items.length > cell.arr.length) throw new SimError('Hay más valores (' + init.items.length + ') que posiciones en el array (' + cell.arr.length + ').', line);
      for (let i = 0; i < init.items.length; i++) {
        const it = init.items[i], c = cell.arr[i];
        if (c.t === 'array') yield* this.fillInit(c, it, line);
        else if (c.t === 'struct') yield* this.fillStruct(c, it, line);
        else this.copyInto(c, yield* this.ev(it));
      }
    }
    *fillStruct(cell, init, line) {
      if (cell.t !== 'struct') { if (init.items.length === 1) this.copyInto(cell, yield* this.ev(init.items[0])); return; }
      const keys = Object.keys(cell.fields);
      for (let i = 0; i < init.items.length && i < keys.length; i++) {
        const c = cell.fields[keys[i]];
        if (c.t === 'array') yield* this.fillInit(c, init.items[i], line);
        else this.copyInto(c, yield* this.ev(init.items[i]));
      }
    }

    /* ---- programa ---- */
    *program() {
      for (const d of this.prog.decls) yield* this.initDecl(d, this.globals);
      yield* this.callFn(this.prog.fns.setup[0], []);
      const lp = this.prog.fns.loop[0];
      for (;;) { yield lp.line; yield* this.callFn(lp, []); }
    }
    *serviceIsr() {
      if (this.pending.length && !this.inIsr && this.intOn) {
        this.inIsr = true;
        while (this.pending.length) {
          const fn = this.pending.shift();
          const f = this.prog.fns[fn];
          if (f) yield* this.callFn(f[0], []);
        }
        this.inIsr = false;
      }
    }
    *waitLoop() {
      while (this.now < this.wakeAt) {
        if (this.pending.length && !this.inIsr && this.intOn) yield* this.serviceIsr();
        if (this.now < this.wakeAt) yield WAIT;
      }
    }
    *callFn(fn, args) {
      if (this.frames.length > 40) throw new SimError('Se agotó la memoria de la pila: demasiadas llamadas anidadas a ' + fn.name + '().', fn.line, 'Una función que se llama a sí misma necesita una condición de parada. El UNO solo tiene 2 KB de RAM.');
      const scope = new Map();
      for (let i = 0; i < fn.params.length; i++) {
        const p = fn.params[i];
        let a = args[i];
        if (a === undefined) a = yield* this.ev(p.def);
        if (p.isArr || p.ref) { scope.set(p.name, a); continue; }
        const c = this.newCell(p.type);
        this.copyInto(c, a);
        scope.set(p.name, c);
      }
      this.frames.push({ name: fn.name, scopes: [scope] });
      const r = yield* this.ex(fn.body);
      this.frames.pop();
      if (fn.ret === 'void') return VOID;
      if (!r || !('ret' in r)) { this.warn('La función ' + fn.name + '() debería devolver un valor con return, pero llegó al final sin hacerlo.', fn.line); return V(fn.ret, 0); }
      if (fn.ret === 'String') return V('String', toStr(r.ret));
      if (r.ret.t === 'struct' || r.ret.t === 'array') return r.ret;
      return V(fn.ret, wrap(fn.ret, num(r.ret)));
    }
    *ex(n) {
      switch (n.k) {
        case 'block': {
          const f = this.frames[this.frames.length - 1];
          f.scopes.push(new Map());
          for (const st of n.body) {
            const r = yield* this.ex(st);
            if (r) { f.scopes.pop(); return r; }
          }
          f.scopes.pop();
          return;
        }
        case 'empty': return;
        case 'decl': {
          yield n.line;
          const f = this.frames[this.frames.length - 1];
          yield* this.initDecl(n, f.scopes[f.scopes.length - 1]);
          return;
        }
        case 'decls': {
          yield n.line;
          const f = this.frames[this.frames.length - 1];
          for (const d of n.decls) yield* this.initDecl(d, f.scopes[f.scopes.length - 1]);
          return;
        }
        case 'exprs': for (const e of n.es) yield* this.ev(e); return;
        case 'expr':
          yield n.line;
          if (this.pending.length) yield* this.serviceIsr();
          yield* this.ev(n.e);
          return;
        case 'if': {
          yield n.line;
          if (this.pending.length) yield* this.serviceIsr();
          if (num(yield* this.ev(n.cond))) return yield* this.ex(n.then);
          if (n.other) return yield* this.ex(n.other);
          return;
        }
        case 'while':
          for (;;) {
            yield n.line;
            if (this.pending.length) yield* this.serviceIsr();
            if (!num(yield* this.ev(n.cond))) return;
            const r = yield* this.ex(n.body);
            if (r === BRK) return;
            if (r && r !== CONT) return r;
          }
        case 'dowhile':
          for (;;) {
            const r = yield* this.ex(n.body);
            if (r === BRK) return;
            if (r && r !== CONT) return r;
            yield n.line;
            if (!num(yield* this.ev(n.cond))) return;
          }
        case 'for': {
          const f = this.frames[this.frames.length - 1];
          f.scopes.push(new Map());
          let out;
          yield n.line;
          if (n.init) yield* this.exNoYield(n.init);
          for (;;) {
            if (n.cond && !num(yield* this.ev(n.cond))) break;
            const r = yield* this.ex(n.body);
            if (r === BRK) break;
            if (r && r !== CONT) { out = r; break; }
            yield n.line;
            if (this.pending.length) yield* this.serviceIsr();
            for (const u of n.update) yield* this.ev(u);
          }
          f.scopes.pop();
          return out;
        }
        case 'switch': {
          yield n.line;
          const v = num(yield* this.ev(n.val));
          let start = n.def;
          for (const l of n.labels) { if (num(yield* this.ev(l.v)) === v) { start = l.at; break; } }
          if (start < 0) return;
          const f = this.frames[this.frames.length - 1];
          f.scopes.push(new Map());
          let out;
          for (let i = start; i < n.stmts.length; i++) {
            const r = yield* this.ex(n.stmts[i]);
            if (r === BRK) break;
            if (r) { out = r; break; }
          }
          f.scopes.pop();
          return out;
        }
        case 'break': yield n.line; return BRK;
        case 'continue': yield n.line; return CONT;
        case 'return': {
          yield n.line;
          const v = n.val ? yield* this.ev(n.val) : VOID;
          return { ret: v.t === 'int' || v.t === 'String' ? V(v.t, v.v) : v };
        }
      }
      throw new SimError('Instrucción no reconocida.', n.line);
    }
    *exNoYield(n) {
      const f = this.frames[this.frames.length - 1];
      if (n.k === 'decl') yield* this.initDecl(n, f.scopes[f.scopes.length - 1]);
      else if (n.k === 'decls') for (const d of n.decls) yield* this.initDecl(d, f.scopes[f.scopes.length - 1]);
      else if (n.k === 'exprs') for (const e of n.es) yield* this.ev(e);
    }
    binop(op, a, b, line) {
      if (op === '+' && (isStr(a) || isStr(b))) return V('String', toStr(a) + toStr(b));
      if (isStr(a) || isStr(b)) {
        const x = toStr(a), y = toStr(b);
        switch (op) {
          case '==': return B(x === y); case '!=': return B(x !== y);
          case '<': return B(x < y); case '>': return B(x > y); case '<=': return B(x <= y); case '>=': return B(x >= y);
        }
        throw new SimError('No se puede usar "' + op + '" con texto.', line);
      }
      if (a.t === 'array' || b.t === 'array') throw new SimError('No se puede operar con un array entero; usa un elemento: nombre[i].', line);
      const t = promote(a.t, b.t), x = wrap(t, a.v), y = wrap(t, b.v);
      switch (op) {
        case '+': return V(t, wrap(t, x + y));
        case '-': return V(t, wrap(t, x - y));
        case '*': return V(t, wrap(t, mul(t, x, y)));
        case '/':
          if (y === 0) {
            if (t === 'float') return V(t, x / y);
            this.warn('División entre cero: en la placa el resultado es impredecible.', line);
            return V(t, 0);
          }
          return V(t, t === 'float' ? Math.fround(x / y) : wrap(t, Math.trunc(x / y)));
        case '%':
          if (t === 'float') throw new SimError('El operador % solo funciona con enteros.', line, 'Convierte con (int) o revisa el tipo.');
          if (y === 0) { this.warn('Módulo entre cero: en la placa el resultado es impredecible.', line); return V(t, 0); }
          return V(t, wrap(t, x % y));
        case '==': return B(x === y); case '!=': return B(x !== y);
        case '<': return B(x < y); case '>': return B(x > y); case '<=': return B(x <= y); case '>=': return B(x >= y);
        case '&': case '|': case '^': case '<<': case '>>': {
          if (t === 'float') throw new SimError('El operador ' + op + ' solo funciona con enteros.', line);
          const u = t === 'ulong' || t === 'uint';
          let r;
          if (op === '&') r = x & y; else if (op === '|') r = x | y; else if (op === '^') r = x ^ y;
          else if (op === '<<') r = y >= 32 ? 0 : x << y;
          else r = u ? x >>> y : x >> y;
          return V(t, wrap(t, r));
        }
      }
      throw new SimError('Operador desconocido: ' + op, line);
    }
    *ev(n) {
      switch (n.k) {
        case 'num': case 'str': return n.val;
        case 'id': {
          const c = this.lookup(n.name);
          if (c) return c;
          if (n.name in CONSTS) return V('int', CONSTS[n.name]);
          if (n.name in FCONSTS) return V('float', FCONSTS[n.name]);
          if (n.name in GLOBAL_OBJECTS) return { t: 'obj', kind: n.name, v: 1, global: true };
          if (this.prog.fns[n.name]) return { t: 'fn', v: n.name };
          throw new SimError('"' + n.name + '" no existe aquí.', n.line);
        }
        case 'bin': {
          const a = n.l.val || (yield* this.ev(n.l));
          const b = n.r.val || (yield* this.ev(n.r));
          return this.binop(n.op, a, b, n.line);
        }
        case 'logic': {
          const a = num(yield* this.ev(n.l));
          if (n.op === '&&') return a ? B(num(yield* this.ev(n.r))) : B(0);
          return a ? B(1) : B(num(yield* this.ev(n.r)));
        }
        case 'unary': {
          const a = yield* this.ev(n.e);
          if (n.op === '!') return B(!num(a));
          if (isStr(a)) throw new SimError('No se puede usar "' + n.op + '" con texto.', n.line);
          const t = a.t === 'float' ? 'float' : promote(a.t, 'int');
          if (n.op === '-') return V(t, wrap(t, -a.v));
          if (n.op === '+') return V(t, a.v);
          return V(t, wrap(t, ~a.v));
        }
        case 'assign': {
          const cell = yield* this.ev(n.l);
          if (cell.readonly) throw new SimError('Esta posición no se puede escribir así.', n.line);
          if (n.op === '=') {
            const r = yield* this.ev(n.r);
            this.copyInto(cell, r);
            return cell;
          }
          const r = yield* this.ev(n.r);
          const res = this.binop(n.op.slice(0, -1), cell, r, n.line);
          this.copyInto(cell, res);
          return cell;
        }
        case 'incdec': {
          const c = yield* this.ev(n.e);
          const old = c.v;
          c.v = wrap(c.t, c.v + (n.op === '++' ? 1 : -1));
          return n.pre ? c : V(c.t, old);
        }
        case 'ternary': return num(yield* this.ev(n.c)) ? yield* this.ev(n.a) : yield* this.ev(n.b);
        case 'comma': yield* this.ev(n.l); return yield* this.ev(n.r);
        case 'cast': {
          const a = yield* this.ev(n.e);
          if (n.to === 'String') return V('String', toStr(a));
          return V(n.to, wrap(n.to, num(a)));
        }
        case 'ctorcast': return yield* this.ctorCast(n);
        case 'sizeof': return I(this.sizeOfCell(yield* this.ev(n.e)));
        case 'sizeofT': return I(n.type.isStruct ? this.sizeOfCell(this.newCell(n.type)) : (BYTES[n.type.base] || 2));
        case 'index': {
          const a = yield* this.ev(n.a);
          const i = num(yield* this.ev(n.idx));
          if (a.t === 'String' || a.t === 'cstr') return V('char', i < a.v.length ? a.v.charCodeAt(i) : 0);
          if (a.t !== 'array') throw new SimError('Solo los arrays y los textos se pueden indexar con [ ].', n.line);
          if (i < 0 || i >= a.arr.length) {
            this.warn('Índice ' + i + ' fuera del array (válidos: 0 a ' + (a.arr.length - 1) + '). En la placa leerías o pisarías otra memoria sin ningún aviso.', n.line);
            return { t: a.elem === 'String' ? 'String' : 'int', v: a.elem === 'String' ? '' : 0 };
          }
          return a.arr[i];
        }
        case 'member': {
          const o = yield* this.ev(n.o);
          if (o.t === 'struct' && n.name in o.fields) return o.fields[n.name];
          throw new SimError('"' + n.name + '" no es un campo de este valor.', n.line);
        }
        case 'call': return yield* this.call(n);
        case 'method': return yield* this.method(n);
      }
      throw new SimError('Expresión no reconocida (' + n.k + ').', n.line);
    }
    *ctorCast(n) {
      const args = [];
      for (const a of n.args) args.push(yield* this.ev(a));
      if (n.to === 'String') {
        if (!args.length) return V('String', '');
        const a = args[0], f = args[1];
        if (f && a.t === 'float') return V('String', fmtFloat(a.v, f.v));
        if (f) return V('String', this.radix(a, f.v));
        return V('String', toStr(a));
      }
      return V(n.to, wrap(n.to, num(args[0] || V('int', 0))));
    }
    radix(a, base) {
      let v = a.v;
      if (v < 0) v = v >>> 0;
      return Math.trunc(v).toString(base).toUpperCase();
    }
    *call(n) {
      const fl = this.prog.fns[n.name];
      if (fl) {
        let fn = fl.find(f => f.params.length === n.args.length) || fl.find(f => n.args.length <= f.params.length) || fl[0];
        const args = [];
        for (let i = 0; i < n.args.length; i++) {
          const v = yield* this.ev(n.args[i]);
          if (i < fn.params.length && fn.params[i].ref && !['id', 'index', 'member'].includes(n.args[i].k)) throw new SimError('El parámetro ' + fn.params[i].name + ' es una referencia (&): necesita una variable.', n.line);
          args.push(v);
        }
        return yield* this.callFn(fn, args);
      }
      const args = [];
      for (const a of n.args) args.push(yield* this.ev(a));
      if (CHAR_FNS[n.name]) return B(CHAR_FNS[n.name](String.fromCharCode(num(args[0]) & 255)));
      const b = BUILTIN[n.name];
      if (!b) throw new SimError('La función ' + n.name + '() no está disponible en el simulador.', n.line);
      const r = b(this, args, n);
      if (this.now < this.wakeAt && !this.inIsr) yield* this.waitLoop();
      return r === undefined ? VOID : r;
    }
    *method(n) {
      const o = yield* this.ev(n.o);
      const args = [];
      for (const a of n.args) args.push(yield* this.ev(a));
      let r;
      if (o.t === 'String' || o.t === 'cstr') r = stringMethod(this, o, n.name, args, n);
      else if (o.t === 'obj') {
        const fn = OBJ[o.kind] && OBJ[o.kind][n.name];
        if (!fn) throw new SimError(o.kind + '.' + n.name + '() no está disponible en el simulador.', n.line);
        r = fn(this, o, args, n);
      } else throw new SimError('".' + n.name + '()" no se puede usar con un valor de tipo ' + o.t + '.', n.line);
      if (this.now < this.wakeAt && !this.inIsr) yield* this.waitLoop();
      return r === undefined ? VOID : r;
    }
  }

  function pinName(p) { return p >= 14 ? 'A' + (p - 14) : String(p); }
  function checkPin(m, p, fn, line) {
    if (!Number.isInteger(p) || p < 0 || p > 19) throw new SimError(fn + '(): el pin ' + p + ' no existe en el UNO (0–13 y A0–A5).', line);
  }

  const BUILTIN = {
    pinMode(m, [p, md], n) {
      checkPin(m, p.v, 'pinMode', n.line);
      const before = m.levelOf(p.v);
      const pin = m.pins[p.v]; pin.mode = md.v;
      if (md.v === 1 && pin.pwm === null) m.logPin(p.v);
      m.fireIfChanged(p.v, before);
      m.T('pinMode: el pin ' + pinName(p.v) + ' queda como ' + ['INPUT (entrada)', 'OUTPUT (salida)', 'INPUT_PULLUP (entrada con resistencia interna)'][md.v] + '.');
    },
    digitalWrite(m, [p, v], n) {
      checkPin(m, p.v, 'digitalWrite', n.line);
      const pin = m.pins[p.v], lv = num(v) ? 1 : 0;
      if (pin.mode !== 1) m.warn('digitalWrite(' + pinName(p.v) + ', ...) sin pinMode(' + pinName(p.v) + ', OUTPUT). El pin no entrega corriente suficiente: un LED apenas brillará.', n.line);
      const before = m.levelOf(p.v);
      pin.dig = lv; pin.pwm = null;
      m.logPin(p.v);
      m.fireIfChanged(p.v, before);
      const sonar = m.parts.find(x => x.type === 'sonar' && x.trig === p.v);
      if (sonar) { if (lv) m.sonarTrig = true; else if (m.sonarTrig) { m.sonarArmed = true; m.sonarTrig = false; } }
      const sr = m.parts.find(x => x.type === 'sr595' && x.latch === p.v);
      if (sr && lv) m.shiftLatched[sr.latch] = m.shiftBuf[sr.data] ?? 0;
      m.T('digitalWrite: el pin ' + pinName(p.v) + (lv ? ' pasa a HIGH (5 V).' : ' pasa a LOW (0 V).'));
    },
    digitalRead(m, [p], n) {
      checkPin(m, p.v, 'digitalRead', n.line);
      let lv = m.levelOf(p.v);
      if (lv === null) {
        m.warn('digitalRead(' + pinName(p.v) + '): el pin está al aire (flotante) y puede leer cualquier cosa. Usa INPUT_PULLUP o una resistencia.', n.line);
        lv = m.rand() & 1;
      }
      m.T('digitalRead: el pin ' + pinName(p.v) + ' se lee como ' + (lv ? 'HIGH (1).' : 'LOW (0).'));
      return I(lv);
    },
    analogRead(m, [p], n) {
      let pin = p.v;
      if (pin >= 0 && pin <= 5) pin += 14;
      if (pin < 14 || pin > 19) throw new SimError('analogRead(' + p.v + '): en el UNO solo hay entradas analógicas en A0–A5.', n.line);
      const v = pin in m.analog ? m.analog[pin] : 250 + (m.rand() % 300);
      m.T('analogRead: A' + (pin - 14) + ' mide ' + v + ' de 1023, unos ' + (v * 5 / 1023).toFixed(2) + ' V.');
      return I(v);
    },
    analogWrite(m, [p, v], n) {
      checkPin(m, p.v, 'analogWrite', n.line);
      let val = Math.trunc(num(v));
      if (val < 0 || val > 255) { m.warn('analogWrite: el valor ' + val + ' se sale del rango 0–255. Los bits de más se pierden; usa map() o constrain().', n.line); val &= 255; }
      const pin = m.pins[p.v];
      pin.mode = 1;
      if (!PWM_PINS.has(p.v)) {
        m.warn('El pin ' + pinName(p.v) + ' no tiene PWM. En el UNO son 3, 5, 6, 9, 10 y 11 (los marcados con ~). Aquí solo verás encendido (≥128) o apagado.', n.line);
        pin.pwm = null; pin.dig = val >= 128 ? 1 : 0;
      } else if (val === 0) { pin.pwm = null; pin.dig = 0; } else if (val === 255) { pin.pwm = null; pin.dig = 1; } else pin.pwm = val;
      m.logPin(p.v);
      m.T('analogWrite: el pin ' + pinName(p.v) + ' queda encendido ' + Math.round(val / 2.55) + ' % del tiempo (' + (val * 5 / 255).toFixed(2) + ' V de media).');
    },
    analogReference() { },
    tone(m, [p, f, d], n) {
      checkPin(m, p.v, 'tone', n.line);
      if (f.v < 31) m.warn('tone(): no se pueden generar tonos por debajo de 31 Hz.', n.line);
      m.toneS = { pin: p.v, freq: f.v, until: d ? m.now + d.v * 1000 : 0 };
      m.toneLog.push({ t: m.now / 1000, pin: p.v, freq: f.v, dur: d ? d.v : 0 });
      m.T('tone: el pin ' + pinName(p.v) + ' emite ' + f.v + ' Hz' + (d ? ' durante ' + d.v + ' ms (sin detener el programa).' : ' hasta que llames a noTone().'));
    },
    noTone(m) { m.toneS = null; m.T('noTone: silencio.'); },
    pulseIn(m, [p, v, to], n) {
      const timeout = to ? to.v : 1000000;
      const s = m.parts.find(x => x.type === 'sonar' && x.echo === p.v);
      if (s && m.sonarArmed) {
        m.sonarArmed = false;
        const us = Math.round(m.sonarCm * 58);
        if (us > timeout) { m.wakeAt = m.now + timeout; return UL(0); }
        m.wakeAt = m.now + us;
        m.T('pulseIn: el eco tardó ' + us + ' µs. Dividido entre 58 da ' + m.sonarCm + ' cm.');
        return UL(us);
      }
      if (s) m.warn('pulseIn: el HC-SR04 no recibió el pulso. Antes hay que poner TRIG en HIGH 10 µs y luego en LOW.', n.line);
      m.wakeAt = m.now + timeout;
      m.T('pulseIn: no llegó ningún pulso; devuelve 0 al agotar la espera.');
      return UL(0);
    },
    pulseInLong(m, a, n) { return BUILTIN.pulseIn(m, a, n); },
    shiftOut(m, [d, c, order, v]) {
      m.shiftBuf[d.v] = order.v === CONSTS.MSBFIRST ? (v.v & 255) : parseInt((v.v & 255).toString(2).padStart(8, '0').split('').reverse().join(''), 2);
      m.now += 8 * 2 * 6;
      m.T('shiftOut: salen 8 bits por el pin ' + d.v + ': ' + (v.v & 255).toString(2).padStart(8, '0'));
    },
    shiftIn() { return V('byte', 0); },
    delay(m, [ms], n) {
      const t = num(ms);
      if (m.inIsr) { m.warn('delay() no funciona dentro de una interrupción (ISR).', n.line); return; }
      m.wakeAt = m.now + Math.max(0, t) * 1000;
      m.T('delay: el programa se detiene ' + t + ' ms. Durante ese tiempo no hace nada más.');
    },
    delayMicroseconds(m, [us]) { if (!m.inIsr) m.wakeAt = m.now + Math.max(0, num(us)); else m.now += num(us); },
    millis(m, a, n) { const v = Math.floor(m.now / 1000); m.T('millis: han pasado ' + v + ' ms desde el arranque.'); return UL(v); },
    micros(m) { return UL(Math.floor(m.now / 4) * 4); },
    abs(m, [a]) { return V(a.t === 'float' ? 'float' : promote(a.t, 'int'), Math.abs(a.v)); },
    fabs(m, [a]) { return FL(Math.abs(a.v)); },
    constrain(m, [x, a, b]) {
      const t = promote(promote(x.t, a.t), b.t);
      const r = x.v < a.v ? a.v : x.v > b.v ? b.v : x.v;
      m.T('constrain: ' + x.v + ' limitado a [' + a.v + ', ' + b.v + '] da ' + r + '.');
      return V(t, r);
    },
    map(m, [x, a, b, c, d], n) {
      if (b.v === a.v) { m.warn('map(): el rango de entrada tiene tamaño cero.', n.line); return L(0); }
      const r = Math.trunc((x.v - a.v) * (d.v - c.v) / (b.v - a.v)) + c.v;
      m.T('map: ' + x.v + ' en [' + a.v + ', ' + b.v + '] equivale a ' + r + ' en [' + c.v + ', ' + d.v + '].');
      return L(r);
    },
    max(m, [a, b]) { return V(promote(a.t, b.t), Math.max(a.v, b.v)); },
    min(m, [a, b]) { return V(promote(a.t, b.t), Math.min(a.v, b.v)); },
    pow(m, [a, b]) { return FL(Math.pow(num(a), num(b))); },
    sq(m, [a]) { const t = a.t === 'float' ? 'float' : promote(a.t, 'int'); return V(t, wrap(t, mul(t, a.v, a.v))); },
    sqrt(m, [a]) { return FL(Math.sqrt(num(a))); },
    sin(m, [a]) { return FL(Math.sin(num(a))); },
    cos(m, [a]) { return FL(Math.cos(num(a))); },
    tan(m, [a]) { return FL(Math.tan(num(a))); },
    log(m, [a]) { return FL(Math.log(num(a))); },
    round(m, [a]) { return L(Math.round(num(a))); },
    floor(m, [a]) { return FL(Math.floor(num(a))); },
    ceil(m, [a]) { return FL(Math.ceil(num(a))); },
    radians(m, [a]) { return FL(num(a) * Math.PI / 180); },
    degrees(m, [a]) { return FL(num(a) * 180 / Math.PI); },
    random(m, [a, b], n) {
      const lo = b ? a.v : 0, hi = b ? b.v : a.v;
      if (hi <= lo) return L(lo);
      const r = lo + (m.rand() % (hi - lo));
      m.T('random: sale ' + r + ' (entre ' + lo + ' y ' + (hi - 1) + ').');
      return L(r);
    },
    randomSeed(m, [s]) { m.rng = (s.v * 2654435761 + 1) >>> 0 || 1; },
    bit(m, [n]) { return UL(1 << n.v); },
    bitRead(m, [x, n]) { return I((x.v >>> n.v) & 1); },
    bitSet(m, [x, n]) { x.v = wrap(x.t, x.v | (1 << n.v)); return x; },
    bitClear(m, [x, n]) { x.v = wrap(x.t, x.v & ~(1 << n.v)); return x; },
    bitWrite(m, [x, n, b]) { x.v = wrap(x.t, num(b) ? x.v | (1 << n.v) : x.v & ~(1 << n.v)); return x; },
    highByte(m, [x]) { return V('byte', (x.v >> 8) & 255); },
    lowByte(m, [x]) { return V('byte', x.v & 255); },
    digitalPinToInterrupt(m, [p], n) {
      if (p.v === 2) return I(0);
      if (p.v === 3) return I(1);
      m.warn('En el UNO solo los pines 2 y 3 admiten interrupciones externas (tú usaste ' + p.v + ').', n.line);
      return I(-1);
    },
    attachInterrupt(m, [i, f, md], n) {
      if (f.t !== 'fn') throw new SimError('attachInterrupt: el segundo dato debe ser el nombre de una función, sin paréntesis.', n.line);
      const pin = [2, 3][i.v];
      if (pin === undefined) return;
      m.isr[pin] = { fn: f.v, mode: md.v === 0 ? CONSTS.FALLING : md.v };
      m.T('attachInterrupt: la función ' + f.v + '() se ejecutará al detectar el cambio en el pin ' + pin + '.');
    },
    detachInterrupt(m, [i]) { delete m.isr[[2, 3][i.v]]; },
    interrupts(m) { m.intOn = true; },
    noInterrupts(m) { m.intOn = false; },
    F(m, [s]) { return s; },
    strlen(m, [s]) { return I(toStr(s).length); },
    strcmp(m, [a, b]) { const x = toStr(a), y = toStr(b); return I(x < y ? -1 : x > y ? 1 : 0); },
    strcpy(m, [a, b], n) {
      const s = toStr(b);
      if (a.t !== 'array' || s.length + 1 > a.arr.length) throw new SimError('strcpy: el texto no cabe en el destino.', n.line);
      for (let i = 0; i < s.length; i++) a.arr[i].v = s.charCodeAt(i);
      a.arr[s.length].v = 0;
    },
    atoi(m, [s]) { return I(parseInt(toStr(s), 10) || 0); },
    atof(m, [s]) { return FL(parseFloat(toStr(s)) || 0); }
  };

  function printText(a, fmt) {
    if (fmt && a.t !== 'float' && !isStr(a)) return (fmt.v === 10) ? String(Math.trunc(a.v)) : (() => { let v = a.v; if (v < 0) v = v >>> 0; return Math.trunc(v).toString(fmt.v).toUpperCase(); })();
    if (fmt && a.t === 'float') return fmtFloat(a.v, fmt.v);
    return toStr(a);
  }
  function lcdPrint(m, s) {
    const l = m.lcd; if (!l) return;
    for (const ch of s) {
      if (l.cy < l.lines.length && l.cx < l.lines[l.cy].length) {
        const row = l.lines[l.cy];
        l.lines[l.cy] = row.slice(0, l.cx) + ch + row.slice(l.cx + 1);
      }
      l.cx++;
    }
  }
  const lcdMethods = {
    begin(m) { if (m.lcd) m.lcd.begun = true; }, init(m) { if (m.lcd) m.lcd.begun = true; },
    backlight(m) { if (m.lcd) m.lcd.backlight = true; }, noBacklight(m) { if (m.lcd) m.lcd.backlight = false; },
    clear(m) { const l = m.lcd; l.lines = l.lines.map(x => ' '.repeat(x.length)); l.cx = l.cy = 0; m.T('lcd.clear: pantalla en blanco, cursor en 0,0.'); },
    home(m) { m.lcd.cx = m.lcd.cy = 0; },
    setCursor(m, o, [c, r]) { m.lcd.cx = c.v; m.lcd.cy = r.v; m.T('lcd.setCursor: lo siguiente se escribe en columna ' + c.v + ', fila ' + r.v + '.'); },
    print(m, o, [a, f], n) {
      if (!m.lcd.begun) m.warn('Usas la pantalla sin haber llamado a lcd.begin() (o lcd.init()) en setup().', n.line);
      const s = printText(a, f); lcdPrint(m, s); m.T('lcd.print: escribe "' + s + '".');
    },
    write(m, o, [a]) { lcdPrint(m, String.fromCharCode(a.v & 255)); },
    display(m) { m.lcd.on = true; }, noDisplay(m) { m.lcd.on = false; },
    blink() { }, noBlink() { }, cursor() { }, noCursor() { }
  };
  const OBJ = {
    Serial: {
      begin(m, o, [b]) { m.serialBegun = true; m.serialBaud = b.v; m.T('Serial.begin: abre el puerto serie a ' + b.v + ' baudios.'); },
      end(m) { m.serialBegun = false; },
      print(m, o, [a, f], n) {
        if (!a) return I(0);
        const s = printText(a, f);
        if (!m.serialBegun) { m.warn('Usas Serial.print sin Serial.begin(9600) en setup(): no saldrá nada.', n.line); return I(0); }
        m.serialOut += s; m.T('Serial.print: envía "' + s + '".');
        return I(s.length);
      },
      println(m, o, [a, f], n) {
        const s = a ? printText(a, f) : '';
        if (!m.serialBegun) { m.warn('Usas Serial.println sin Serial.begin(9600) en setup(): no saldrá nada.', n.line); return I(0); }
        m.serialOut += s + '\n'; m.T('Serial.println: envía "' + s + '" y salta de línea.');
        return I(s.length + 2);
      },
      write(m, o, [a]) {
        const s = isStr(a) ? toStr(a) : String.fromCharCode(a.v & 255);
        if (m.serialBegun) m.serialOut += s;
        return I(s.length);
      },
      available(m) { return I(m.serialIn.length); },
      availableForWrite() { return I(63); },
      read(m) { if (!m.serialIn.length) return I(-1); const c = m.serialIn.charCodeAt(0); m.serialIn = m.serialIn.slice(1); m.T('Serial.read: saca el carácter "' + String.fromCharCode(c).replace('\n', '\\n') + '" (código ' + c + ').'); return I(c); },
      peek(m) { return I(m.serialIn.length ? m.serialIn.charCodeAt(0) : -1); },
      flush() { },
      setTimeout(m, o, [t]) { m.serialTimeout = t.v; },
      parseInt(m) {
        const r = /^[^0-9-]*(-?[0-9]+)/.exec(m.serialIn);
        if (!r) { m.serialIn = ''; m.wakeAt = m.now + m.serialTimeout * 1000; return L(0); }
        m.serialIn = m.serialIn.slice(r[0].length);
        return L(parseInt(r[1], 10));
      },
      parseFloat(m) {
        const r = /^[^0-9-.]*(-?[0-9]*\.?[0-9]+)/.exec(m.serialIn);
        if (!r) { m.serialIn = ''; m.wakeAt = m.now + m.serialTimeout * 1000; return FL(0); }
        m.serialIn = m.serialIn.slice(r[0].length);
        return FL(parseFloat(r[1]));
      },
      readString(m) { const s = m.serialIn; m.serialIn = ''; m.wakeAt = m.now + m.serialTimeout * 1000; return V('String', s); },
      readStringUntil(m, o, [c]) {
        const ch = String.fromCharCode(c.v & 255), i = m.serialIn.indexOf(ch);
        if (i < 0) { const s = m.serialIn; m.serialIn = ''; m.wakeAt = m.now + m.serialTimeout * 1000; return V('String', s); }
        const s = m.serialIn.slice(0, i); m.serialIn = m.serialIn.slice(i + 1);
        return V('String', s);
      }
    },
    Servo: {
      attach(m, o, [p]) { o.pin = p.v; m.servos[p.v] = o.angle; m.T('servo.attach: el servo queda conectado al pin ' + p.v + '.'); return V('byte', 0); },
      write(m, o, [a], n) {
        if (o.pin === null) { m.warn('Usas servo.write sin servo.attach(pin) en setup().', n.line); return; }
        o.angle = Math.max(0, Math.min(180, a.v)); m.servos[o.pin] = o.angle;
        m.T('servo.write: el eje gira hasta ' + o.angle + '°.');
      },
      writeMicroseconds(m, o, [u]) { o.angle = Math.round(Math.max(0, Math.min(180, (u.v - 544) * 180 / (2400 - 544)))); if (o.pin !== null) m.servos[o.pin] = o.angle; },
      read(m, o) { return I(o.angle); },
      readMicroseconds(m, o) { return I(Math.round(544 + o.angle * (2400 - 544) / 180)); },
      attached(m, o) { return B(o.pin !== null); },
      detach(m, o) { if (o.pin !== null) delete m.servos[o.pin]; o.pin = null; }
    },
    LiquidCrystal: Object.fromEntries(Object.entries(lcdMethods).map(([k, f]) => [k, (m, o, a, n) => f(m, o, a, n)])),
    DHT: {
      begin() { },
      readTemperature(m) { m.T('dht.readTemperature: ' + m.dht.t + ' °C.'); return FL(m.dht.t); },
      readHumidity(m) { m.T('dht.readHumidity: ' + m.dht.h + ' %.'); return FL(m.dht.h); }
    },
    Wire: {
      begin() { }, setClock() { },
      beginTransmission(m, o, [a]) { m.wireTx = a.v; },
      write() { return I(1); },
      endTransmission(m) { const ok = m.i2cDevices.includes(m.wireTx); m.T('Wire.endTransmission: dirección 0x' + m.wireTx.toString(16) + (ok ? ' responde.' : ' no responde.')); return V('byte', ok ? 0 : 2); },
      requestFrom() { return V('byte', 0); }, available() { return I(0); }, read() { return I(-1); }
    },
    SPI: { begin() { }, end() { }, transfer() { return V('byte', 0); }, setBitOrder() { }, setClockDivider() { }, setDataMode() { } },
    EEPROM: {
      read(m, o, [a]) { return V('byte', m.eeprom[a.v] ?? 255); },
      write(m, o, [a, v]) { m.eeprom[a.v] = v.v & 255; m.now += 3300; m.T('EEPROM.write: guarda ' + (v.v & 255) + ' en la dirección ' + a.v + '. Tarda unos 3,3 ms.'); },
      update(m, o, [a, v]) { if (m.eeprom[a.v] !== (v.v & 255)) { m.eeprom[a.v] = v.v & 255; m.now += 3300; } },
      length() { return I(1024); },
      put(m, o, [a, c]) { const n = BYTES[c.t] || 2; let v = c.t === 'float' ? new Uint32Array(new Float32Array([c.v]).buffer)[0] : c.v; for (let i = 0; i < n; i++) { m.eeprom[a.v + i] = v & 255; v = v >>> 8; } },
      get(m, o, [a, c]) {
        const n = BYTES[c.t] || 2; let v = 0;
        for (let i = n - 1; i >= 0; i--) v = (v * 256) + m.eeprom[a.v + i];
        c.v = c.t === 'float' ? new Float32Array(new Uint32Array([v]).buffer)[0] : wrap(c.t, v);
        return c;
      }
    }
  };
  OBJ.LiquidCrystal_I2C = OBJ.LiquidCrystal;

  function stringMethod(m, o, name, a, n) {
    const s = o.v, mut = (v) => { if (o.t === 'String') o.v = v; };
    switch (name) {
      case 'length': return I(s.length);
      case 'charAt': return V('char', a[0].v < s.length ? s.charCodeAt(a[0].v) : 0);
      case 'setCharAt': if (a[0].v < s.length) mut(s.slice(0, a[0].v) + String.fromCharCode(a[1].v) + s.slice(a[0].v + 1)); return;
      case 'substring': return V('String', a[1] ? s.substring(a[0].v, a[1].v) : s.substring(a[0].v));
      case 'indexOf': return I(s.indexOf(isStr(a[0]) ? toStr(a[0]) : String.fromCharCode(a[0].v), a[1] ? a[1].v : 0));
      case 'lastIndexOf': return I(s.lastIndexOf(isStr(a[0]) ? toStr(a[0]) : String.fromCharCode(a[0].v)));
      case 'toInt': return L(parseInt(s, 10) || 0);
      case 'toFloat': return FL(parseFloat(s) || 0);
      case 'trim': mut(s.trim()); return;
      case 'toUpperCase': mut(s.toUpperCase()); return;
      case 'toLowerCase': mut(s.toLowerCase()); return;
      case 'equals': return B(s === toStr(a[0]));
      case 'equalsIgnoreCase': return B(s.toLowerCase() === toStr(a[0]).toLowerCase());
      case 'startsWith': return B(s.startsWith(toStr(a[0])));
      case 'endsWith': return B(s.endsWith(toStr(a[0])));
      case 'concat': mut(s + toStr(a[0])); return B(1);
      case 'replace': mut(s.split(toStr(a[0])).join(toStr(a[1]))); return;
      case 'remove': mut(a[1] ? s.slice(0, a[0].v) + s.slice(a[0].v + a[1].v) : s.slice(0, a[0].v)); return;
      case 'c_str': return V('cstr', s);
      case 'compareTo': { const y = toStr(a[0]); return I(s < y ? -1 : s > y ? 1 : 0); }
      case 'reserve': return B(1);
      case 'toCharArray': {
        const lim = a[1].v;
        for (let i = 0; i < lim; i++) { if (a[0].arr[i]) a[0].arr[i].v = i < lim - 1 && i < s.length ? s.charCodeAt(i) : 0; }
        return;
      }
    }
    throw new SimError('String.' + name + '() no está disponible en el simulador.', n.line);
  }

  const api = { Machine, SimError, PWM_PINS, CONSTS, METHODS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Pin13Sim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

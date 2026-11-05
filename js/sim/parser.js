/* Pin 13 — analizador del lenguaje de Arduino (subconjunto de C++).
   Convierte texto en un árbol sintáctico. Sin dependencias; también corre en Node para las pruebas. */
(function (root) {
  'use strict';

  class SimError extends Error {
    constructor(msg, line, hint) { super(msg); this.line = line; this.hint = hint; }
  }

  const TYPE_MAP = {
    void: 'void', bool: 'bool', boolean: 'bool', char: 'char', byte: 'byte', int: 'int', short: 'int', long: 'long',
    float: 'float', double: 'float', word: 'uint', size_t: 'uint', String: 'String',
    uint8_t: 'byte', int8_t: 'int8', uint16_t: 'uint', int16_t: 'int', uint32_t: 'ulong', int32_t: 'long'
  };
  const MODIFIERS = new Set(['const', 'volatile', 'static', 'unsigned', 'signed', 'PROGMEM', 'constexpr', 'inline']);
  // clase -> cabecera que hay que incluir
  const CLASSES = { Servo: 'Servo.h', LiquidCrystal: 'LiquidCrystal.h', LiquidCrystal_I2C: 'LiquidCrystal_I2C.h', DHT: 'DHT.h' };
  const GLOBAL_OBJECTS = { Serial: null, Wire: 'Wire.h', SPI: 'SPI.h', EEPROM: 'EEPROM.h' };

  const PUNCT = ['<<=', '>>=', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '->', '::',
    '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '&', '|', '^', '?', ':', ';', ',', '.', '(', ')', '{', '}', '[', ']'];

  function numberToken(text, line) {
    let s = text, suffix = '';
    const m = /[uUlLfF]+$/.exec(s);
    const isHexLike = /^0[xX]/.test(s);
    if (m && !(isHexLike && /[fF]/.test(m[0]))) { suffix = m[0].toLowerCase(); s = s.slice(0, -m[0].length); }
    let v, t;
    if (isHexLike) v = parseInt(s.slice(2), 16);
    else if (/^0[bB]/.test(s)) v = parseInt(s.slice(2), 2);
    else if (/[.eE]/.test(s)) { return { k: 'num', v: parseFloat(s), t: 'float', line }; }
    else if (suffix.includes('f')) { return { k: 'num', v: parseFloat(s), t: 'float', line }; }
    else if (/^0[0-7]+$/.test(s)) v = parseInt(s, 8);
    else v = parseInt(s, 10);
    const uns = suffix.includes('u'), lng = suffix.includes('l');
    if (uns && lng) t = 'ulong';
    else if (lng) t = v > 2147483647 ? 'ulong' : 'long';
    else if (uns) t = v > 65535 ? 'ulong' : 'uint';
    else if (v <= 32767) t = 'int';
    else if (isHexLike && v <= 65535) t = 'uint';
    else if (v <= 2147483647) t = 'long';
    else t = 'ulong';
    return { k: 'num', v, t, line };
  }

  const ESC = { n: 10, t: 9, r: 13, '0': 0, '\\': 92, "'": 39, '"': 34, a: 7, b: 8, f: 12, v: 11 };

  function tokenize(src) {
    const toks = [], includes = [], macros = Object.create(null);
    let i = 0, line = 1, atLineStart = true;
    const n = src.length;
    const push = (t) => {
      if (t.k === 'id' && macros[t.v]) { for (const mt of macros[t.v]) toks.push({ ...mt, line: t.line }); return; }
      toks.push(t);
    };
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; atLineStart = true; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') {
        const start = line; i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        if (i >= n) throw new SimError('Un comentario /* nunca se cierra.', start, 'Añade */ donde termine el comentario.');
        i += 2; continue;
      }
      if (c === '#' && atLineStart) {
        let e = i; while (e < n && src[e] !== '\n') e++;
        const text = src.slice(i, e).replace(/\/\/.*$/, '').trim();
        let m;
        if ((m = /^#\s*include\s*[<"]([^>"]+)[>"]/.exec(text))) includes.push(m[1]);
        else if ((m = /^#\s*define\s+([A-Za-z_]\w*)(\()?\s*(.*)$/.exec(text))) {
          if (m[2]) throw new SimError('El simulador no admite macros con parámetros (#define ' + m[1] + '(...)).', line, 'Escribe una función normal: es más segura y más fácil de depurar.');
          macros[m[1]] = tokenize(m[3]).toks.filter(t => t.k !== 'eof');
        } else if (/^#\s*(ifdef|ifndef|if|endif|else|elif|pragma|undef)/.test(text)) {
          throw new SimError('El simulador no admite la directiva "' + text.split(/\s+/)[0] + '".', line, 'Funciona en la placa real; aquí quítala para simular.');
        } else throw new SimError('No entiendo esta directiva: ' + text, line);
        i = e; continue;
      }
      atLineStart = false;
      if (c === '"') {
        let s = '', j = i + 1;
        while (j < n && src[j] !== '"') {
          if (src[j] === '\n') throw new SimError('Falta cerrar las comillas " de este texto.', line);
          if (src[j] === '\\') { j++; s += String.fromCharCode(ESC[src[j]] ?? src[j].charCodeAt(0)); j++; } else s += src[j++];
        }
        if (j >= n) throw new SimError('Falta cerrar las comillas " de este texto.', line);
        toks.push({ k: 'str', v: s, line }); i = j + 1; continue;
      }
      if (c === "'") {
        let j = i + 1, v;
        if (src[j] === '\\') { v = ESC[src[j + 1]] ?? src[j + 1].charCodeAt(0); j += 2; } else { v = src.charCodeAt(j); j++; }
        if (src[j] !== "'") throw new SimError("Las comillas simples ' son para UN solo carácter. Para texto usa comillas dobles \".", line);
        toks.push({ k: 'num', v, t: 'char', line }); i = j + 1; continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        const m = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)[uUlLfF]*/.exec(src.slice(i, i + 48));
        toks.push(numberToken(m[0], line)); i += m[0].length; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i + 1; while (j < n && /\w/.test(src[j])) j++;
        const w = src.slice(i, j); i = j;
        if (/^B[01]{1,8}$/.test(w)) { toks.push({ k: 'num', v: parseInt(w.slice(1), 2), t: 'int', line }); continue; }
        push({ k: 'id', v: w, line }); continue;
      }
      const p = PUNCT.find(x => src.startsWith(x, i));
      if (!p) throw new SimError('Hay un símbolo que no entiendo: ' + c, line);
      toks.push({ k: 'p', v: p, line }); i += p.length;
    }
    toks.push({ k: 'eof', v: 'fin del programa', line });
    return { toks, includes };
  }

  class Parser {
    constructor(src) {
      const r = tokenize(src);
      this.t = r.toks; this.includes = r.includes; this.i = 0;
      this.structs = Object.create(null); this.enums = Object.create(null);
    }
    get tk() { return this.t[this.i]; }
    peek(o = 1) { return this.t[Math.min(this.i + o, this.t.length - 1)]; }
    is(v) { const t = this.tk; return (t.k === 'p' || t.k === 'id') && t.v === v; }
    eat(v) { if (this.is(v)) { this.i++; return true; } return false; }
    prevLine() { return this.i > 0 ? this.t[this.i - 1].line : this.tk.line; }
    expect(v, ctx) {
      if (this.is(v)) return this.t[this.i++];
      const got = this.tk;
      if (v === ';') throw new SimError('Falta un punto y coma ; al final de esta línea.', this.prevLine(), 'En C++ cada instrucción termina con ;');
      if (v === ')') throw new SimError('Falta cerrar un paréntesis ) ' + (ctx || '') + '.', this.prevLine(), 'Cuenta: cada ( necesita su ).');
      if (v === '}') throw new SimError('Falta cerrar una llave } ' + (ctx || '') + '.', got.line, 'Cada { necesita su }. El auto-formato (Ctrl+T en el IDE) ayuda a verlo.');
      throw new SimError('Esperaba "' + v + '" ' + (ctx || '') + ' pero encontré "' + got.v + '".', got.line);
    }
    ident(ctx) {
      const t = this.tk;
      if (t.k !== 'id') throw new SimError('Esperaba un nombre ' + (ctx || '') + ' pero encontré "' + t.v + '".', t.line);
      this.i++; return t.v;
    }
    isTypeWord(t) {
      if (t.k !== 'id') return false;
      return t.v in TYPE_MAP || MODIFIERS.has(t.v) || t.v in CLASSES || t.v in this.structs || t.v in this.enums;
    }
    parseType() {
      const out = { base: null, isConst: false, isStatic: false, isVolatile: false };
      let uns = false, sgn = false, words = [];
      const start = this.tk;
      while (this.tk.k === 'id') {
        const w = this.tk.v;
        if (w === 'const' || w === 'constexpr') out.isConst = true;
        else if (w === 'static') out.isStatic = true;
        else if (w === 'volatile') out.isVolatile = true;
        else if (w === 'unsigned') uns = true;
        else if (w === 'signed') sgn = true;
        else if (w === 'PROGMEM' || w === 'inline') { /* se ignora */ }
        else if (w === 'struct' && this.peek().k === 'id') { this.i++; continue; }
        else if (w in TYPE_MAP || w in CLASSES || w in this.structs || w in this.enums) {
          if (words.length && !(w === 'int' || w === 'long')) break;
          words.push(w);
        } else break;
        this.i++;
      }
      const w = words[0];
      if (!w) out.base = uns ? 'uint' : 'int';
      else if (w in CLASSES) {
        if (!this.includes.includes(CLASSES[w])) throw new SimError('No sé qué es "' + w + '".', start.line, 'Falta #include <' + CLASSES[w] + '> al principio del programa.');
        out.base = w; out.isClass = true;
      } else if (w in this.structs) { out.base = w; out.isStruct = true; }
      else if (w in this.enums) out.base = 'int';
      else {
        let b = TYPE_MAP[w];
        if (uns) b = { char: 'byte', int: 'uint', long: 'ulong' }[b] || b;
        out.base = b;
      }
      if (sgn && out.base === 'char') out.base = 'int8';
      return out;
    }
    parsePointers(type) {
      if (this.is('*')) {
        if (type.base === 'char') { this.i++; if (this.is('const')) this.i++; type.base = 'String'; type.wasCharPtr = true; return; }
        throw new SimError('Este simulador no admite punteros (*).', this.tk.line, 'Puedes usar arrays y referencias (&). Los punteros se explican en la lección de memoria y funcionan en la placa real.');
      }
    }
    parseProgram() {
      const decls = [], fns = Object.create(null);
      while (this.tk.k !== 'eof') {
        if (this.eat(';')) continue;
        if (this.is('struct') && this.peek(2).v === '{') { this.parseStruct(); continue; }
        if (this.is('enum')) { decls.push(...this.parseEnum()); continue; }
        if (this.is('class') || this.is('template') || this.is('namespace') || this.is('using')) {
          throw new SimError('El simulador no admite "' + this.tk.v + '".', this.tk.line, 'Puedes usar funciones y struct. "' + this.tk.v + '" sí funciona en la placa real.');
        }
        if (!this.isTypeWord(this.tk)) {
          const t = this.tk;
          if (t.k === 'id' && this.peek().v === '(') throw new SimError('Falta el tipo de retorno de "' + t.v + '" (o esta instrucción está fuera de una función).', t.line, 'Las instrucciones van dentro de setup(), loop() u otra función. Una función se declara así: void ' + t.v + '() { ... }');
          if (t.v === '}') throw new SimError('Sobra una llave } aquí.', t.line, 'Revisa que cada { tenga su } y que no cierres dos veces.');
          if (t.k === 'id') throw new SimError('No entiendo "' + t.v + '" aquí: fuera de las funciones solo se declaran variables y funciones.', t.line);
          throw new SimError('No esperaba "' + t.v + '" aquí, fuera de una función.', t.line);
        }
        const line = this.tk.line, type = this.parseType();
        this.parsePointers(type);
        if (this.eat('&')) throw new SimError('Una función no puede devolver una referencia en este simulador.', line);
        const name = this.ident('para la declaración');
        if (this.is('(') && !type.isClass) {
          this.i++;
          const params = this.parseParams();
          this.expect(')', 'en los parámetros de ' + name);
          if (this.eat(';')) continue;
          if (!this.is('{')) throw new SimError('Esperaba { para abrir el cuerpo de la función ' + name + '.', this.tk.line);
          const body = this.parseBlock();
          (fns[name] = fns[name] || []).push({ name, ret: type.base, params, body, line });
        } else {
          decls.push(this.parseDeclRest(type, name, line));
          while (this.eat(',')) decls.push(this.parseDeclRest(type, this.ident('de variable'), line));
          this.expect(';');
        }
      }
      return { decls, fns, includes: this.includes, structs: this.structs };
    }
    parseStruct() {
      this.i++;
      const name = this.ident('del struct'); this.expect('{');
      const fields = [];
      this.structs[name] = fields;
      while (!this.is('}')) {
        const line = this.tk.line;
        if (!this.isTypeWord(this.tk)) throw new SimError('Dentro de un struct solo van campos (tipo y nombre).', line);
        const type = this.parseType(); this.parsePointers(type);
        do {
          const fname = this.ident('del campo'); const dims = this.parseDims();
          fields.push({ name: fname, type, dims });
        } while (this.eat(','));
        this.expect(';');
      }
      this.expect('}', 'del struct'); this.expect(';');
    }
    parseEnum() {
      const line = this.tk.line; this.i++;
      this.eat('class');
      let name = null;
      if (this.tk.k === 'id') name = this.ident();
      if (name) this.enums[name] = true;
      this.expect('{');
      let val = 0; const out = [];
      while (!this.is('}')) {
        const n = this.ident('de la constante');
        if (this.eat('=')) { const e = this.parseAssign(); if (e.k !== 'num') throw new SimError('En un enum el valor debe ser un número.', line); val = e.v; }
        out.push({ k: 'decl', name: n, type: { base: 'int', isConst: true }, dims: [], init: { k: 'num', v: val, t: 'int', line, val: { t: 'int', v: val } }, line });
        val++;
        if (!this.eat(',')) break;
      }
      this.expect('}', 'del enum'); this.expect(';');
      return out;
    }
    parseParams() {
      const ps = [];
      if (this.is(')')) return ps;
      if (this.is('void') && this.peek().v === ')') { this.i++; return ps; }
      do {
        const line = this.tk.line;
        if (!this.isTypeWord(this.tk)) throw new SimError('Cada parámetro necesita su tipo, por ejemplo: int ' + this.tk.v, line);
        const type = this.parseType(); this.parsePointers(type);
        const ref = this.eat('&');
        const name = this.ident('del parámetro');
        let isArr = false;
        while (this.eat('[')) { isArr = true; if (!this.is(']')) this.parseExpr(); this.expect(']'); }
        let def = null;
        if (this.eat('=')) def = this.parseAssign();
        ps.push({ name, type, ref, isArr, def, line });
      } while (this.eat(','));
      return ps;
    }
    parseDims() {
      const dims = [];
      while (this.eat('[')) { dims.push(this.is(']') ? null : this.parseExpr()); this.expect(']', 'del array'); }
      return dims;
    }
    parseDeclRest(type, name, line) {
      const d = { k: 'decl', name, type, dims: this.parseDims(), init: null, ctorArgs: null, line };
      this.eat('PROGMEM');
      if (this.is('(') && (type.isClass || !d.dims.length)) {
        this.i++; d.ctorArgs = [];
        if (!this.is(')')) do { d.ctorArgs.push(this.parseAssign()); } while (this.eat(','));
        this.expect(')', 'del constructor');
      } else if (this.eat('=')) {
        d.init = this.is('{') ? this.parseInitList() : this.parseAssign();
      }
      return d;
    }
    parseInitList() {
      const line = this.tk.line; this.expect('{');
      const items = [];
      while (!this.is('}')) {
        items.push(this.is('{') ? this.parseInitList() : this.parseAssign());
        if (!this.eat(',')) break;
      }
      this.expect('}', 'de la lista de valores');
      return { k: 'initlist', items, line };
    }
    parseBlock() {
      const line = this.tk.line; this.expect('{');
      const body = [];
      while (!this.is('}')) {
        if (this.tk.k === 'eof') throw new SimError('Falta cerrar una llave } de un bloque abierto en la línea ' + line + '.', line, 'Cada { necesita su }.');
        body.push(this.parseStmt());
      }
      this.i++;
      return { k: 'block', body, line };
    }
    parseStmt() {
      const t = this.tk, line = t.line;
      if (t.k === 'p') {
        if (t.v === '{') return this.parseBlock();
        if (t.v === ';') { this.i++; return { k: 'empty', line }; }
      }
      if (t.k === 'id') {
        switch (t.v) {
          case 'if': {
            this.i++; this.expect('(', 'después de if');
            const cond = this.parseExpr(); this.expect(')', 'de la condición del if');
            const then = this.parseStmt(); let other = null;
            if (this.eat('else')) other = this.parseStmt();
            return { k: 'if', cond, then, other, line };
          }
          case 'else': throw new SimError('Hay un else sin su if.', line, 'Revisa que no haya un ; justo después del if ni llaves mal cerradas.');
          case 'while': {
            this.i++; this.expect('(', 'después de while');
            const cond = this.parseExpr(); this.expect(')', 'de la condición del while');
            return { k: 'while', cond, body: this.parseStmt(), line };
          }
          case 'do': {
            this.i++; const body = this.parseStmt();
            this.expect('while', 'tras el cuerpo del do'); this.expect('(');
            const cond = this.parseExpr(); this.expect(')'); this.expect(';');
            return { k: 'dowhile', cond, body, line };
          }
          case 'for': return this.parseFor();
          case 'switch': return this.parseSwitch();
          case 'break': this.i++; this.expect(';'); return { k: 'break', line };
          case 'continue': this.i++; this.expect(';'); return { k: 'continue', line };
          case 'return': {
            this.i++; let val = null;
            if (!this.is(';')) val = this.parseExpr();
            this.expect(';');
            return { k: 'return', val, line };
          }
          case 'goto': throw new SimError('El simulador no admite goto.', line, 'Además, casi nunca hace falta: usa bucles y funciones.');
          case 'struct':
            if (this.peek(2).v === '{') throw new SimError('Declara los struct fuera de las funciones.', line);
        }
        if (this.isTypeWord(t) && !(t.v in TYPE_MAP && this.peek().v === '(')) return this.parseLocalDecl();
      }
      const e = this.parseExpr(); this.expect(';');
      return { k: 'expr', e, line };
    }
    parseLocalDecl() {
      const line = this.tk.line, type = this.parseType();
      this.parsePointers(type);
      const decls = [];
      do { decls.push(this.parseDeclRest(type, this.ident('de la variable'), line)); } while (this.eat(','));
      this.expect(';');
      return decls.length === 1 ? decls[0] : { k: 'decls', decls, line };
    }
    parseFor() {
      const line = this.tk.line; this.i++; this.expect('(', 'después de for');
      let init = null;
      if (!this.is(';')) {
        if (this.isTypeWord(this.tk)) init = this.parseLocalDecl();
        else { const es = [this.parseAssign()]; while (this.eat(',')) es.push(this.parseAssign()); this.expect(';'); init = { k: 'exprs', es, line }; }
      } else this.i++;
      let cond = null;
      if (!this.is(';')) cond = this.parseExpr();
      this.expect(';');
      const update = [];
      if (!this.is(')')) do { update.push(this.parseAssign()); } while (this.eat(','));
      this.expect(')', 'del for');
      return { k: 'for', init, cond, update, body: this.parseStmt(), line };
    }
    parseSwitch() {
      const line = this.tk.line; this.i++; this.expect('(', 'después de switch');
      const val = this.parseExpr(); this.expect(')'); this.expect('{');
      const stmts = [], labels = []; let def = -1;
      while (!this.is('}')) {
        if (this.tk.k === 'eof') throw new SimError('Falta cerrar la llave } del switch.', line);
        if (this.eat('case')) { const v = this.parseTernary(); this.expect(':', 'después de case'); labels.push({ v, at: stmts.length }); continue; }
        if (this.eat('default')) { this.expect(':', 'después de default'); def = stmts.length; continue; }
        if (!labels.length && def < 0) throw new SimError('Dentro de switch cada bloque empieza con case o default.', this.tk.line);
        stmts.push(this.parseStmt());
      }
      this.i++;
      return { k: 'switch', val, stmts, labels, def, line };
    }
    parseExpr() {
      let e = this.parseAssign();
      while (this.is(',')) { const line = this.tk.line; this.i++; e = { k: 'comma', l: e, r: this.parseAssign(), line }; }
      return e;
    }
    parseAssign() {
      const l = this.parseTernary(), t = this.tk;
      if (t.k === 'p' && ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='].includes(t.v)) {
        this.i++;
        if (!['id', 'index', 'member'].includes(l.k)) throw new SimError('A la izquierda de "' + t.v + '" debe haber una variable.', t.line);
        return { k: 'assign', op: t.v, l, r: this.parseAssign(), line: t.line };
      }
      return l;
    }
    parseTernary() {
      const c = this.parseBin(0);
      if (this.is('?')) {
        const line = this.tk.line; this.i++;
        const a = this.parseAssign(); this.expect(':', 'del operador ternario');
        return { k: 'ternary', c, a, b: this.parseAssign(), line };
      }
      return c;
    }
    parseBin(level) {
      const LV = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']];
      if (level >= LV.length) return this.parseUnary();
      let l = this.parseBin(level + 1);
      while (this.tk.k === 'p' && LV[level].includes(this.tk.v)) {
        const op = this.tk.v, line = this.tk.line; this.i++;
        l = { k: op === '&&' || op === '||' ? 'logic' : 'bin', op, l, r: this.parseBin(level + 1), line };
      }
      return l;
    }
    parseUnary() {
      const t = this.tk;
      if (t.k === 'p') {
        if (t.v === '!' || t.v === '-' || t.v === '~' || t.v === '+') { this.i++; return { k: 'unary', op: t.v, e: this.parseUnary(), line: t.line }; }
        if (t.v === '++' || t.v === '--') { this.i++; return { k: 'incdec', op: t.v, pre: true, e: this.parseUnary(), line: t.line }; }
        if (t.v === '*' || t.v === '&') throw new SimError('El simulador no admite punteros ("' + t.v + '" delante de un valor).', t.line, 'Usa arrays o referencias en los parámetros.');
        if (t.v === '(' && this.isTypeWord(this.peek()) && !(this.peek().v in this.enums && false)) {
          const save = this.i; this.i++;
          const type = this.parseType();
          if (this.eat(')')) return { k: 'cast', to: type.base, e: this.parseUnary(), line: t.line };
          this.i = save;
        }
      }
      if (t.k === 'id' && t.v === 'sizeof') {
        this.i++; this.expect('(', 'después de sizeof');
        let node;
        if (this.isTypeWord(this.tk)) node = { k: 'sizeofT', type: this.parseType(), line: t.line };
        else node = { k: 'sizeof', e: this.parseExpr(), line: t.line };
        this.expect(')', 'de sizeof');
        return node;
      }
      return this.parsePostfix();
    }
    parsePostfix() {
      let e = this.parsePrimary();
      for (;;) {
        const t = this.tk;
        if (t.k !== 'p') return e;
        if (t.v === '[') { this.i++; const idx = this.parseExpr(); this.expect(']', 'del índice'); e = { k: 'index', a: e, idx, line: t.line }; }
        else if (t.v === '.') {
          this.i++; const name = this.ident('tras el punto');
          if (this.is('(')) { this.i++; e = { k: 'method', o: e, name, args: this.parseArgs(name), line: t.line }; }
          else e = { k: 'member', o: e, name, line: t.line };
        } else if (t.v === '->') throw new SimError('El simulador no admite punteros (->).', t.line);
        else if (t.v === '++' || t.v === '--') { this.i++; e = { k: 'incdec', op: t.v, pre: false, e, line: t.line }; }
        else return e;
      }
    }
    parseArgs(name) {
      const args = [];
      if (!this.is(')')) do { args.push(this.parseAssign()); } while (this.eat(','));
      this.expect(')', 'en la llamada a ' + name + '()');
      return args;
    }
    parsePrimary() {
      const t = this.tk;
      if (t.k === 'num') { this.i++; return { k: 'num', v: t.v, t: t.t, line: t.line, val: { t: t.t, v: t.v } }; }
      if (t.k === 'str') {
        this.i++; let s = t.v;
        while (this.tk.k === 'str') { s += this.tk.v; this.i++; }
        return { k: 'str', v: s, line: t.line, val: { t: 'cstr', v: s } };
      }
      if (t.k === 'p' && t.v === '(') {
        this.i++; const e = this.parseExpr(); this.expect(')', 'de la expresión'); return e;
      }
      if (t.k === 'id') {
        if (t.v in TYPE_MAP && this.peek().v === '(') {
          this.i += 2; const args = this.parseArgs(t.v);
          return { k: 'ctorcast', to: TYPE_MAP[t.v], args, line: t.line };
        }
        if (['true', 'false'].includes(t.v)) { this.i++; const v = t.v === 'true' ? 1 : 0; return { k: 'num', v, t: 'bool', line: t.line, val: { t: 'bool', v } }; }
        this.i++;
        if (this.is('(')) { this.i++; return { k: 'call', name: t.v, args: this.parseArgs(t.v), line: t.line }; }
        return { k: 'id', name: t.v, line: t.line };
      }
      if (t.k === 'eof') throw new SimError('El programa termina a medias: falta algo por cerrar.', t.line, 'Suele ser una } o un ).');
      throw new SimError('No esperaba "' + t.v + '" aquí.', t.line, t.v === ')' ? 'Quizá sobra un paréntesis.' : undefined);
    }
  }

  const api = { SimError, Parser, tokenize, TYPE_MAP, CLASSES, GLOBAL_OBJECTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Pin13Parser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

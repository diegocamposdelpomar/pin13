/* Utilidades de interfaz: escape, formato de texto, coloreado de código y explicador de líneas. */
(function (root) {
  const Fn = root.Pin13Fn;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmt(text) {
    let s = esc(text);
    s = s.replace(/\[\[([^\]]+)\]\]/g, (_, n) => {
      const key = n.replace(/&#39;/g, "'");
      return `<button type="button" class="fnlink" data-fn="${key}">${key.includes('.') || Fn.byName[key]?.keyword ? key : key + '()'}</button>`;
    });
    s = s.replace(/\{\{(.+?)\}\}(?!\})/g, (_, x) => `<code>${x}</code>`);
    s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|\s)\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    return s;
  }

  const KW = new Set(['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'struct', 'enum', 'class', 'public', 'private', 'sizeof', 'const', 'static', 'volatile', 'unsigned', 'signed']);
  const TYPES = new Set(['void', 'bool', 'boolean', 'char', 'byte', 'int', 'short', 'long', 'float', 'double', 'word', 'String', 'size_t', 'uint8_t', 'int8_t', 'uint16_t', 'int16_t', 'uint32_t', 'int32_t', 'Servo', 'LiquidCrystal', 'LiquidCrystal_I2C', 'DHT', 'Stepper']);
  const CONST = new Set(['HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'true', 'false', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'DEC', 'HEX', 'OCT', 'BIN', 'RISING', 'FALLING', 'CHANGE', 'MSBFIRST', 'LSBFIRST', 'PI', 'DEFAULT', 'INTERNAL', 'EXTERNAL', 'DHT11', 'DHT22', 'NULL']);
  const OBJ_PREFIX = ['servo', 'lcd', 'String'];

  function fnKey(word, prev) {
    if (prev) {
      if (Fn.byName[prev + '.' + word]) return prev + '.' + word;
      for (const p of OBJ_PREFIX) if (Fn.byName[p + '.' + word]) return p + '.' + word;
      return null;
    }
    if (Fn.byName[word]) return word;
    return null;
  }

  // Devuelve HTML por líneas.
  function highlightLines(code, links = true) {
    const out = []; let cur = '';
    const push = (html) => { cur += html; };
    const brk = () => { out.push(cur); cur = ''; };
    const re = /(\/\/[^\n]*)|(\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?)|('(?:[^'\\\n]|\\.)*'?)|(^[ \t]*#[^\n]*)|(\b0[xXbB][0-9a-fA-F]+[uUlL]*\b|\b\d+\.?\d*(?:[eE][+-]?\d+)?[uUlLfF]*\b)|([A-Za-z_]\w*)|(\n)|([\s\S])/gm;
    let m, prevDot = null, prevWord = null;
    const span = (cls, t) => t.split('\n').forEach((p, i, a) => { push(`<span class="${cls}">${esc(p)}</span>`); if (i < a.length - 1) brk(); });
    while ((m = re.exec(code))) {
      if (m[1]) span('t-com', m[1]);
      else if (m[2]) span('t-com', m[2]);
      else if (m[3]) span('t-str', m[3]);
      else if (m[4]) span('t-str', m[4]);
      else if (m[5]) {
        const inc = m[5].trim().split(/\s+/)[0].replace(/\s/g, '');
        if (links && Fn.byName[inc]) push(`<button type="button" class="t-pre tfn" data-fn="${inc}" tabindex="-1">${esc(m[5])}</button>`);
        else span('t-pre', m[5]);
      } else if (m[6]) span('t-num', m[6]);
      else if (m[7]) {
        const w = m[7];
        const key = fnKey(w, prevDot);
        const isCallish = code[re.lastIndex] === '(' || prevDot;
        if (key && links && (isCallish || KW.has(w) || TYPES.has(w) || CONST.has(w))) {
          const cls = KW.has(w) ? 't-kw' : TYPES.has(w) ? 't-type' : CONST.has(w) ? 't-const' : 't-fn';
          push(`<button type="button" class="${cls} tfn" data-fn="${esc(key)}" tabindex="-1">${esc(w)}</button>`);
        } else if (KW.has(w)) span('t-kw', w);
        else if (TYPES.has(w)) span('t-type', w);
        else if (CONST.has(w)) span('t-const', w);
        else if (code[re.lastIndex] === '(') span('t-call', w);
        else span('t-id', w);
        prevWord = w;
        prevDot = null;
        continue;
      } else if (m[8]) { brk(); } else {
        const ch = m[9];
        if (ch === '.' && prevWord) { push('.'); prevDot = prevWord; prevWord = null; continue; }
        if (!/\s/.test(ch)) prevWord = null;
        push(esc(ch));
      }
      if (!m[7]) prevDot = null;
    }
    out.push(cur);
    return out;
  }

  const TYPE_NAMES = { int: 'entero (int)', float: 'decimal (float)', double: 'decimal (double)', long: 'entero grande (long)', byte: 'byte', char: 'carácter (char)', bool: 'verdadero/falso (bool)', boolean: 'verdadero/falso', String: 'texto (String)', 'unsigned long': 'entero grande sin signo (unsigned long)', 'unsigned int': 'entero sin signo (unsigned int)', void: 'nada' };
  const TYPE_RE = '(?:const\\s+|static\\s+|volatile\\s+)*(unsigned\\s+long|unsigned\\s+int|unsigned\\s+char|unsigned|long\\s+int|void|int|long|float|double|byte|char|bool|boolean|String|word|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)';

  // Explica en español una línea de código, sin ejecutarla.
  function explainLine(raw) {
    let line = raw.replace(/\/\/.*$/, '').trim();
    const comment = /\/\/\s*(.*)$/.exec(raw);
    if (!line) return comment ? 'Comentario: el programa lo ignora; es una nota para quien lee.' : '';
    if (/^\/\*/.test(line) || /^\*/.test(line) || /\*\/$/.test(line)) return 'Comentario: el programa lo ignora.';
    if (/^\}\s*(else)?/.test(line) && line.replace(/[}\s;]/g, '') === '') return 'Cierra el bloque abierto con {.';
    let m;
    const parts = [];
    if ((m = /^#include\s*[<"](.+)[>"]/.exec(line))) return `Añade la librería ${m[1].replace('.h', '')} al programa.`;
    if ((m = /^#define\s+(\w+)\s+(.+)$/.exec(line))) return `Antes de compilar, sustituye cada ${m[1]} por ${m[2]}.`;
    if (/^void\s+setup\s*\(/.test(line)) return 'Empieza setup(): se ejecuta una sola vez, al arrancar la placa.';
    if (/^void\s+loop\s*\(/.test(line)) return 'Empieza loop(): se repite sin parar mientras la placa tenga energía.';
    if ((m = new RegExp('^' + TYPE_RE + '\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{?$').exec(line))) {
      const ty = m[1].replace(/\s+/g, ' ');
      return `Define la función ${m[2]}(): ${m[3].trim() ? 'recibe ' + m[3].trim() : 'no recibe datos'}, y ${ty === 'void' ? 'no devuelve nada' : 'devuelve un valor de tipo ' + ty}.`;
    }
    if (/^enum\b/.test(line)) return 'Crea nombres para una lista de opciones numeradas desde 0.';
    if (/^struct\b/.test(line)) return 'Define un struct: un tipo propio que agrupa varios datos.';
    if ((m = /^(?:else\s+)?if\s*\((.*)\)\s*\{?$/.exec(line))) parts.push(`${/^else/.test(line) ? 'Si lo anterior fue falso, comprueba' : 'Comprueba'}: ¿${m[1]}? Si es verdad, entra en el bloque.`);
    else if (/^\}?\s*else\s*\{?$/.test(line)) return 'Si la condición anterior fue falsa, se ejecuta este bloque.';
    else if ((m = /^for\s*\(([^;]*);([^;]*);([^)]*)\)/.exec(line))) return `Bucle: empieza con ${m[1].trim()}, repite mientras ${m[2].trim()}, y tras cada vuelta hace ${m[3].trim()}.`;
    else if ((m = /^while\s*\((.*)\)/.exec(line))) parts.push(`Repite el bloque mientras se cumpla: ${m[1]}.`);
    else if ((m = /^switch\s*\((.*)\)/.exec(line))) return `Elige un caso según el valor de ${m[1]}.`;
    else if ((m = /^case\s+(.+):/.exec(line))) return `Este caso se ejecuta si el valor es ${m[1]}.`;
    else if (/^default\s*:/.test(line)) return 'Se ejecuta si ningún case coincide.';
    else if (/^break\s*;/.test(line)) return 'Sale del switch o del bucle.';
    else if (/^continue\s*;/.test(line)) return 'Salta a la siguiente vuelta del bucle.';
    else if ((m = /^return\s*(.*);/.exec(line))) return m[1] ? `Termina la función y devuelve ${m[1]}.` : 'Termina la función.';
    else if ((m = new RegExp('^(?:const\\s+)?' + TYPE_RE + '\\s+(\\w+)\\s*(\\[[^\\]]*\\])\\s*=?\\s*(.*);$').exec(line))) {
      parts.push(`Crea el array ${m[2]}, una lista de elementos de tipo ${m[1]}${m[4] ? ', con los valores ' + m[4] : ''}.`);
    } else if ((m = new RegExp('^' + TYPE_RE + '\\s+(\\w+)\\s*(?:=\\s*(.*))?;$').exec(line))) {
      const ty = m[1].replace(/\s+/g, ' ');
      const k = /const\s/.test(line) ? 'constante' : (/static\s/.test(line) ? 'variable static (recuerda su valor)' : 'variable');
      parts.push(`Crea la ${k} ${m[2]} de tipo ${TYPE_NAMES[ty] || ty}${m[3] ? ', con el valor ' + m[3] : ''}.`);
    } else if ((m = /^(\w+(?:\[[^\]]*\])?)\s*\+\+;/.exec(line))) return `Suma 1 a ${m[1]}.`;
    else if ((m = /^(\w+(?:\[[^\]]*\])?)\s*--;/.exec(line))) return `Resta 1 a ${m[1]}.`;
    else if ((m = /^(\w+(?:\[[^\]]*\]|\.\w+)?)\s*([+\-*/%&|^]|<<|>>)=\s*(.*);/.exec(line))) parts.push(`Actualiza ${m[1]}: aplica ${m[2]} con ${m[3]}.`);
    else if ((m = /^(\w+(?:\[[^\]]*\]|\.\w+)?)\s*=\s*(.*);/.exec(line))) parts.push(`Guarda en ${m[1]} el resultado de ${m[2]}.`);

    const seen = new Set();
    const re = /(?:(\w+)\.)?(\w+)\s*\(/g;
    let c;
    while ((c = re.exec(line))) {
      const key = fnKey(c[2], c[1]);
      if (key && !seen.has(key)) {
        seen.add(key);
        const f = Fn.byName[key];
        parts.push(`${key.replace(/^servo\.|^lcd\./, (c[1] || '') + '.')}: ${f.what.split(/(?<=[.:])\s/)[0]}`);
      } else if (!key && !seen.has(c[2]) && !['if', 'for', 'while', 'switch', 'sizeof'].includes(c[2]) && !TYPES.has(c[2])) {
        seen.add(c[2]);
        if (!parts.length || !c[1]) parts.push(`Llama a ${c[1] ? c[1] + '.' : ''}${c[2]}().`);
      }
    }
    if (!parts.length) return comment ? 'Comentario: ' + comment[1] : '';
    return parts.join(' ');
  }

  // Busca la función bajo el cursor del editor.
  function wordAt(text, pos) {
    let a = pos, b = pos;
    while (a > 0 && /[\w#]/.test(text[a - 1])) a--;
    while (b < text.length && /\w/.test(text[b])) b++;
    const w = text.slice(a, b);
    if (!w) return null;
    let prev = null;
    if (text[a - 1] === '.') { let p = a - 1, q = p; while (p > 0 && /\w/.test(text[p - 1])) p--; prev = text.slice(p, q); }
    return fnKey(w, prev);
  }

  root.Pin13UI = { esc, fmt, highlightLines, explainLine, wordAt, fnKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Pin13UI;
})(typeof globalThis !== 'undefined' ? globalThis : this);

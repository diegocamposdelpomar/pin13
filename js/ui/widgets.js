/* Calculadoras y visualizaciones interactivas de las lecciones. */
(function (root) {
  const Board = root.Pin13Board;
  const fmtN = (n, d = 2) => Number(n).toLocaleString('es', { maximumFractionDigits: d });
  const fmtA = (a) => a >= 1 ? fmtN(a) + ' A' : fmtN(a * 1000, 1) + ' mA';
  const fmtR = (r) => r >= 1e6 ? fmtN(r / 1e6) + ' MΩ' : r >= 1000 ? fmtN(r / 1000) + ' kΩ' : fmtN(r) + ' Ω';
  const STD = [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, 1000, 1200, 1500, 1800, 2200, 3300, 4700, 10000];

  const W = {
    ohm(el) {
      el.innerHTML = `<h4>Calculadora de la ley de Ohm</h4>
        <div class="w-row"><label>Voltaje <output data-o="v"></output><input type="range" min="1" max="12" step="0.1" value="5" data-i="v"/></label>
        <label>Resistencia <output data-o="r"></output><input type="range" min="50" max="10000" step="10" value="220" data-i="r"/></label></div>
        <div class="w-big" data-o="i"></div><p class="w-note" data-o="note" role="status"></p>`;
      const v = el.querySelector('[data-i="v"]'), r = el.querySelector('[data-i="r"]');
      const up = () => {
        const V = +v.value, R = +r.value, I = V / R;
        el.querySelector('[data-o="v"]').textContent = fmtN(V, 1) + ' V';
        el.querySelector('[data-o="r"]').textContent = fmtR(R);
        el.querySelector('[data-o="i"]').innerHTML = `I = ${fmtN(V, 1)} V / ${fmtN(R, 0)} Ω = <strong>${fmtA(I)}</strong>`;
        const ma = I * 1000, n = el.querySelector('[data-o="note"]');
        n.dataset.level = ma > 40 ? 'bad' : ma > 20 ? 'warn' : 'ok';
        n.textContent = ma > 40 ? 'Peligro: supera los 40 mA, el máximo absoluto de un pin del UNO R3.' : ma > 20 ? 'Justo: supera los 20 mA recomendados para un pin.' : 'Seguro para un pin del UNO R3.';
      };
      v.oninput = r.oninput = up; up();
    },
    ledres(el) {
      el.innerHTML = `<h4>¿Qué resistencia necesita mi LED?</h4>
        <div class="w-row"><label>Color del LED <select data-i="c"><option value="2">Rojo (≈ 2 V)</option><option value="2.1">Amarillo o ámbar (≈ 2,1 V)</option><option value="2.2">Verde clásico (≈ 2,2 V)</option><option value="3.1">Azul, blanco o verde brillante (≈ 3,1 V)</option></select></label>
        <label>Corriente <output data-o="ma"></output><input type="range" min="2" max="20" value="10" data-i="i"/></label></div>
        <div class="w-big" data-o="r"></div><p class="w-note" data-o="note"></p>`;
      const c = el.querySelector('[data-i="c"]'), i = el.querySelector('[data-i="i"]');
      const up = () => {
        const R = (5 - c.value) / (i.value / 1000);
        const std = STD.find(x => x >= R) || 10000;
        el.querySelector('[data-o="ma"]').textContent = i.value + ' mA';
        el.querySelector('[data-o="r"]').innerHTML = `R = (5 V − ${fmtN(c.value, 1)} V) / ${i.value} mA = ${fmtN(R, 0)} Ω → usa <strong>${fmtR(std)}</strong>`;
        el.querySelector('[data-o="note"]').textContent = 'Se elige el valor comercial inmediatamente superior. 220 Ω o 330 Ω van bien en casi todos los casos.';
      };
      c.onchange = i.oninput = up; up();
    },
    colors(el) {
      const C = [['Negro', '#111'], ['Marrón', '#7a4a21'], ['Rojo', '#d32f2f'], ['Naranja', '#f57c00'], ['Amarillo', '#fbc02d'], ['Verde', '#388e3c'], ['Azul', '#1976d2'], ['Violeta', '#7b1fa2'], ['Gris', '#8a8a8a'], ['Blanco', '#f4f4f4']];
      const opts = (sel) => C.map((c, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${c[0]}</option>`).join('');
      el.innerHTML = `<h4>Lector de bandas de colores</h4>
        <svg class="w-res" viewBox="0 0 300 70" role="img" aria-label="Resistencia"><line x1="0" y1="35" x2="300" y2="35" class="w-res-w"/><rect x="60" y="14" width="180" height="42" rx="16" class="w-res-b"/><rect data-b="0" x="88" y="14" width="14" height="42"/><rect data-b="1" x="118" y="14" width="14" height="42"/><rect data-b="2" x="148" y="14" width="14" height="42"/><rect x="202" y="14" width="10" height="42" fill="#c9a227"/></svg>
        <div class="w-row"><label>1.ª banda <select data-i="0">${opts(2)}</select></label><label>2.ª banda <select data-i="1">${opts(2)}</select></label><label>Multiplicador <select data-i="2">${opts(1)}</select></label></div>
        <div class="w-big" data-o="r"></div><p class="w-note">La banda dorada indica una tolerancia de ±5 %; la plateada, ±10 %.</p>`;
      const sel = [0, 1, 2].map(i => el.querySelector(`[data-i="${i}"]`));
      const up = () => {
        sel.forEach((s, i) => el.querySelector(`[data-b="${i}"]`).setAttribute('fill', C[s.value][1]));
        const r = (+sel[0].value * 10 + +sel[1].value) * Math.pow(10, +sel[2].value);
        el.querySelector('[data-o="r"]').innerHTML = `Valor: <strong>${fmtR(r)}</strong>`;
      };
      sel.forEach(s => { s.onchange = up; }); up();
    },
    divider(el) {
      el.innerHTML = `<h4>Divisor de voltaje con Vin = 5 V</h4>
        <div class="w-row"><label>R1 <output data-o="a"></output><input type="range" min="100" max="20000" step="100" value="10000" data-i="a"/></label><label>R2 <output data-o="b"></output><input type="range" min="100" max="20000" step="100" value="10000" data-i="b"/></label></div>
        <div class="w-big" data-o="v"></div><div class="w-meter"><span data-o="bar"></span></div><p class="w-note" data-o="adc"></p>`;
      const a = el.querySelector('[data-i="a"]'), b = el.querySelector('[data-i="b"]');
      const up = () => {
        const v = 5 * b.value / (+a.value + +b.value);
        el.querySelector('[data-o="a"]').textContent = fmtR(+a.value);
        el.querySelector('[data-o="b"]').textContent = fmtR(+b.value);
        el.querySelector('[data-o="v"]').innerHTML = `Salida: <strong>${fmtN(v)} V</strong>`;
        el.querySelector('[data-o="bar"]').style.width = (v / 5 * 100) + '%';
        el.querySelector('[data-o="adc"]').textContent = `analogRead() leería aproximadamente ${Math.round(v / 5 * 1023)}.`;
      };
      a.oninput = b.oninput = up; up();
    },
    adc(el) {
      el.innerHTML = `<h4>De voltaje a número</h4>
        <label>Voltaje en el pin <output data-o="v"></output><input type="range" min="0" max="5" step="0.01" value="2.5" data-i="v"/></label>
        <div class="w-big" data-o="n"></div><div class="w-meter"><span data-o="bar"></span></div><p class="w-note" data-o="step"></p>`;
      const v = el.querySelector('[data-i="v"]');
      const up = () => {
        const V = +v.value, n = Math.min(1023, Math.round(V / 5 * 1023));
        el.querySelector('[data-o="v"]').textContent = fmtN(V) + ' V';
        el.querySelector('[data-o="n"]').innerHTML = `analogRead() → <strong>${n}</strong>`;
        el.querySelector('[data-o="bar"]').style.width = (n / 1023 * 100) + '%';
        el.querySelector('[data-o="step"]').textContent = `En binario: ${n.toString(2).padStart(10, '0')}. Cada paso equivale a unos 4,9 mV.`;
      };
      v.oninput = up; up();
    },
    pwm(el) {
      el.innerHTML = `<h4>Cómo se ve una señal PWM</h4>
        <label>analogWrite(9, <output data-o="n"></output>)<input type="range" min="0" max="255" value="64" data-i="v"/></label>
        <svg class="w-wave" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true"><path data-o="wave" /></svg>
        <div class="w-pwm"><div class="led" data-o="led" style="--c:#ff4a3d"></div><div><div class="w-big" data-o="d"></div><p class="w-note" data-o="avg"></p></div></div>`;
      const v = el.querySelector('[data-i="v"]');
      const up = () => {
        const n = +v.value, d = n / 255;
        let p = 'M0 70', per = 80;
        for (let x = 0; x < 400; x += per) {
          if (d > 0) p += ` L${x} 10 L${x + per * d} 10`;
          p += ` L${x + per * d} 70 L${x + per} 70`;
        }
        el.querySelector('[data-o="wave"]').setAttribute('d', p);
        el.querySelector('[data-o="n"]').textContent = n;
        el.querySelector('[data-o="d"]').innerHTML = `Encendido el <strong>${Math.round(d * 100)} %</strong> del tiempo`;
        el.querySelector('[data-o="avg"]').textContent = `Voltaje medio: ${fmtN(d * 5)} V. El ojo promedia y ve un brillo intermedio.`;
        el.querySelector('[data-o="led"]').style.setProperty('--on', d);
      };
      v.oninput = up; up();
    },
    binary(el) {
      let val = 5;
      el.innerHTML = `<h4>Un byte por dentro</h4><div class="w-bits" role="group" aria-label="Bits del byte">${[7, 6, 5, 4, 3, 2, 1, 0].map(b => `<button type="button" data-bit="${b}"><small>${1 << b}</small><span></span></button>`).join('')}</div><div class="w-big" data-o="v"></div>`;
      const up = () => {
        el.querySelectorAll('[data-bit]').forEach(b => {
          const on = (val >> +b.dataset.bit) & 1;
          b.querySelector('span').textContent = on;
          b.classList.toggle('on', !!on);
          b.setAttribute('aria-pressed', !!on);
        });
        el.querySelector('[data-o="v"]').innerHTML = `Decimal <strong>${val}</strong> · Hexadecimal <strong>0x${val.toString(16).toUpperCase().padStart(2, '0')}</strong> · Binario <strong>0b${val.toString(2).padStart(8, '0')}</strong>`;
      };
      el.querySelectorAll('[data-bit]').forEach(b => { b.onclick = () => { val ^= 1 << +b.dataset.bit; up(); }; });
      up();
    },
    pinout(el) {
      el.innerHTML = `<div class="pinout"><div class="pinout-b">${Board.svg({ interactive: true })}</div><div class="pinout-info" data-o="info" role="status"><h4>Toca un pin o un componente</h4><p>Verás para qué sirve.</p>
        <ul class="legend"><li><i class="k k-d"></i>Digital</li><li><i class="k k-a"></i>Analógico</li><li><i class="k k-v"></i>Alimentación</li><li><i class="k k-g"></i>Tierra (GND)</li><li><i class="k k-s"></i>Serial</li></ul></div></div>`;
      const box = el.querySelector('[data-o="info"]');
      const show = (t, x) => { box.innerHTML = `<h4>${t}</h4><p>${x}</p>`; };
      const pick = (e) => {
        const g = e.target.closest('.bp, .bz');
        if (!g) return;
        el.querySelectorAll('.is-sel').forEach(x => x.classList.remove('is-sel'));
        g.classList.add('is-sel');
        if (g.dataset.name) { const i = Board.info(g.dataset.name); if (i) show(i.title, i.text); } else { const z = Board.ZONES[g.dataset.zone]; show(z[0], z[1]); }
      };
      el.addEventListener('click', pick);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
    }
  };
  root.Pin13Widgets = W;
})(typeof globalThis !== 'undefined' ? globalThis : this);

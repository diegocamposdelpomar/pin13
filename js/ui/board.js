/* Dibujo original de una placa tipo UNO en SVG. La usan el laboratorio (estado en vivo) y la lección de la placa. */
(function (root) {
  const TOP = [
    ['AREF', 'p', 'Referencia externa para analogRead(). Solo se usa con analogReference(EXTERNAL). No apliques más de 5 V.'],
    ['GND', 'g', 'Tierra: el 0 V de referencia. Todo circuito debe compartirla con la placa.'],
    ['13', 'd', 'Pin digital 13. Tiene el LED «L» integrado. También es SCK del bus SPI.', 13],
    ['12', 'd', 'Pin digital 12. También es MISO del bus SPI.', 12],
    ['~11', 'd', 'Pin digital 11 con PWM. También es MOSI del bus SPI. tone() interfiere con su PWM.', 11],
    ['~10', 'd', 'Pin digital 10 con PWM. También es SS del bus SPI. La librería Servo desactiva su PWM.', 10],
    ['~9', 'd', 'Pin digital 9 con PWM. La librería Servo desactiva su PWM.', 9],
    ['8', 'd', 'Pin digital 8.', 8],
    null,
    ['7', 'd', 'Pin digital 7.', 7],
    ['~6', 'd', 'Pin digital 6 con PWM a unos 980 Hz.', 6],
    ['~5', 'd', 'Pin digital 5 con PWM a unos 980 Hz.', 5],
    ['4', 'd', 'Pin digital 4.', 4],
    ['~3', 'd', 'Pin digital 3 con PWM. Admite interrupción externa. tone() interfiere con su PWM.', 3],
    ['2', 'd', 'Pin digital 2. Admite interrupción externa.', 2],
    ['TX→1', 's', 'Pin 1: transmite por Serial. Está ocupado cuando usas Serial o cargas un programa.', 1],
    ['RX←0', 's', 'Pin 0: recibe por Serial. Si conectas algo aquí, la carga de programas puede fallar.', 0]
  ];
  const BOT = [
    ['IOREF', 'p', 'Indica el voltaje de trabajo de la placa, para que los módulos se adapten: 5 V en el UNO R3.'],
    ['RESET', 'p', 'Unido a GND, reinicia la placa.'],
    ['3.3V', 'v', 'Salida regulada de 3,3 V, hasta 50 mA en el UNO R3.'],
    ['5V', 'v', 'Salida de 5 V para tus módulos. No conectes aquí una fuente que no sea de 5 V exactos.'],
    ['GND', 'g', 'Tierra (0 V).'],
    ['GND', 'g', 'Tierra (0 V).'],
    ['VIN', 'v', 'Entrada de alimentación de 7 a 12 V, antes del regulador. Equivale al conector redondo.'],
    null,
    ['A0', 'a', 'Entrada analógica 0 (0 a 1023). También funciona como pin digital 14.', 14],
    ['A1', 'a', 'Entrada analógica 1. También es el pin digital 15.', 15],
    ['A2', 'a', 'Entrada analógica 2. También es el pin digital 16.', 16],
    ['A3', 'a', 'Entrada analógica 3. También es el pin digital 17.', 17],
    ['A4', 'a', 'Entrada analógica 4. También es SDA del bus I2C.', 18],
    ['A5', 'a', 'Entrada analógica 5. También es SCL del bus I2C.', 19]
  ];
  const ZONES = {
    usb: ['Conector USB', 'Da 5 V a la placa, carga programas y transporta la comunicación Serial.'],
    jack: ['Conector de alimentación', 'Admite de 7 a 12 V recomendados. Pasa por el regulador de la placa.'],
    chip: ['ATmega328P', 'El cerebro: un microcontrolador de 8 bits a 16 MHz con 32 KB de Flash, 2 KB de SRAM y 1 KB de EEPROM.'],
    reset: ['Botón de reinicio', 'Reinicia el programa desde setup(). No borra el programa.'],
    led: ['LED integrado L', 'Está conectado al pin 13. Es el que hace parpadear el ejemplo Blink.'],
    tx: ['LED TX y RX', 'Parpadean cuando se envían o reciben datos por Serial.'],
    icsp: ['Conector ICSP', 'Permite programar el chip directamente, sin pasar por USB. También da acceso al bus SPI.'],
    power: ['LED ON', 'Indica que la placa tiene energía.']
  };

  function svg(opts = {}) {
    const W = 620, H = 350, step = 22;
    const row = (list, y, isTop) => {
      let x = 170, s = '';
      for (const p of list) {
        if (!p) { x += 16; continue; }
        const [name, kind, , num] = p;
        const lx = x + 8;
        s += `<g class="bp bp-${kind}" tabindex="${opts.interactive ? 0 : -1}" role="${opts.interactive ? 'button' : 'presentation'}" data-name="${name}" ${num !== undefined ? `data-pin="${num}"` : ''}>
          <rect class="bp-hit" x="${x - 2}" y="${isTop ? y - 56 : y - 4}" width="${step - 1}" height="74" />
          <rect class="bp-pad" x="${x + 1}" y="${y}" width="14" height="14" rx="2" />
          <text class="bp-t" transform="translate(${lx + 3} ${isTop ? y - 7 : y + 22}) rotate(-90)" text-anchor="${isTop ? 'start' : 'end'}">${name}</text>
        </g>`;
        x += step;
      }
      return s;
    };
    const zone = (id, inner) => `<g class="bz" tabindex="${opts.interactive ? 0 : -1}" role="${opts.interactive ? 'button' : 'presentation'}" data-zone="${id}">${inner}</g>`;
    return `<svg class="board" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-label="Placa de desarrollo tipo UNO">
      <rect class="b-pcb" x="10" y="16" width="${W - 40}" height="${H - 32}" rx="14" />
      <circle class="b-hole" cx="72" cy="36" r="6"/><circle class="b-hole" cx="72" cy="${H - 36}" r="6"/><circle class="b-hole" cx="${W - 48}" cy="${H - 36}" r="6"/><circle class="b-hole" cx="${W - 48}" cy="52" r="6"/>
      <path class="b-trace" d="M116 118 H 200 V 90 H 300 M 116 150 H 250 V 110 H 420 M 260 268 V 220 H 310 M 450 268 V 230 H 400 M 480 90 V 150 H 420" />
      ${zone('usb', `<rect class="b-metal" x="0" y="74" width="74" height="70" rx="4"/><text class="b-silk" x="36" y="114" text-anchor="middle">USB</text>`)}
      ${zone('jack', `<rect class="b-black" x="0" y="238" width="72" height="66" rx="5"/><circle class="b-metal" cx="30" cy="271" r="14"/>`)}
      ${zone('reset', `<rect class="b-metal" x="92" y="36" width="30" height="30" rx="3"/><circle class="b-red" cx="107" cy="51" r="9"/>`)}
      ${zone('chip', `<rect class="b-chip" x="295" y="146" width="212" height="56" rx="3"/><circle cx="306" cy="174" r="4" class="b-pcb"/><text class="b-chiptext" x="404" y="179" text-anchor="middle">ATMEGA328P</text>`)}
      ${zone('icsp', `<rect class="b-black" x="540" y="130" width="28" height="42" rx="2"/><text class="b-silk s" x="554" y="186" text-anchor="middle">ICSP</text>`)}
      ${zone('led', `<rect class="b-led-off" data-led="L" x="212" y="118" width="20" height="10" rx="2"/><text class="b-silk s" x="248" y="127">L</text>`)}
      ${zone('tx', `<rect class="b-led-off" data-led="TX" x="212" y="136" width="20" height="10" rx="2"/><text class="b-silk s" x="238" y="145">TX</text><rect class="b-led-off" data-led="RX" x="212" y="154" width="20" height="10" rx="2"/><text class="b-silk s" x="238" y="163">RX</text>`)}
      ${zone('power', `<rect class="b-led-on" x="500" y="222" width="20" height="10" rx="2"/><text class="b-silk s" x="526" y="232">ON</text>`)}
      <rect class="b-header" x="164" y="54" width="${step * 16 + 28}" height="22" rx="2"/>
      <rect class="b-header" x="164" y="268" width="${step * 13 + 28}" height="22" rx="2"/>
      ${row(TOP, 58, true)}
      ${row(BOT, 272, false)}
      <text class="b-silk s" x="300" y="48" style="display:none"></text>
      <text class="b-brand" x="90" y="200">PIN 13</text>
      <text class="b-silk s" x="92" y="218">placa virtual · UNO R3</text>
    </svg>`;
  }

  function info(name) {
    const p = [...TOP, ...BOT].filter(Boolean).find(x => x[0] === name);
    return p ? { title: 'Pin ' + name, text: p[2] } : null;
  }

  function update(rootEl, m) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.bp[data-pin]').forEach((g) => {
      const pin = +g.dataset.pin;
      const pad = g.querySelector('.bp-pad');
      const b = m ? m.brightness(pin) : 0;
      const isIn = m && m.pins[pin].mode !== 1;
      pad.style.setProperty('--on', b);
      g.classList.toggle('is-high', b > 0.01);
      g.classList.toggle('is-out', !!m && m.pins[pin].mode === 1);
      g.classList.toggle('is-in', !!m && isIn && m.pins[pin].mode === 2);
    });
    const L = rootEl.querySelector('[data-led="L"]');
    if (L) L.style.setProperty('--on', m ? m.brightness(13) : 0);
  }

  root.Pin13Board = { svg, info, update, ZONES };
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* Temario, parte 2: digital, analógico, comunicación y tiempo. */
(function (root) {
  const c = String.raw;
  const M = root.Pin13Modules = root.Pin13Modules || [];

  M.push({ id: 'digital', title: 'Entradas y salidas digitales', blurb: 'LEDs, botones, rebotes y detección de cambios.', lessons: [
    { id: 'semaforo', title: 'Salidas: un semáforo', min: 8, goal: 'Controlar varias salidas con una secuencia.', blocks: [
      { p: 'Una salida digital solo tiene dos estados. Combinando varias con tiempos se construyen comportamientos completos. Usa [[pinMode]] y [[digitalWrite]].' },
      { wire: [['Pin 11 → 220 Ω', 'LED rojo → GND'], ['Pin 10 → 220 Ω', 'LED ámbar → GND'], ['Pin 9 → 220 Ω', 'LED verde → GND']] },
      { lab: { code: c`const int ROJO = 11, AMBAR = 10, VERDE = 9;

void luces(int r, int a, int v, int ms) {
  digitalWrite(ROJO, r);
  digitalWrite(AMBAR, a);
  digitalWrite(VERDE, v);
  delay(ms);
}

void setup() {
  pinMode(ROJO, OUTPUT);
  pinMode(AMBAR, OUTPUT);
  pinMode(VERDE, OUTPUT);
}

void loop() {
  luces(HIGH, LOW, LOW, 2000);
  luces(LOW, LOW, HIGH, 2000);
  luces(LOW, HIGH, LOW, 700);
}`, parts: [{ type: 'led', pin: 11, color: 'rojo' }, { type: 'led', pin: 10, color: 'ambar' }, { type: 'led', pin: 9, color: 'verde' }] } },
      { challenge: { title: 'Secuencia del coche fantástico', desc: 'Enciende los pines 3, 4, 5 y 6 de uno en uno, ida y vuelta (3-4-5-6-5-4-3…), con **100 ms** en cada uno. Siempre debe haber un solo LED encendido.', start: c`void setup() {
  for (int p = 3; p <= 6; p++) {
    pinMode(p, OUTPUT);
  }
}

void loop() {
  // Tu código aquí
}`, parts: [{ type: 'led', pin: 3 }, { type: 'led', pin: 4 }, { type: 'led', pin: 5 }, { type: 'led', pin: 6 }], ms: 1500,
        check: (m) => { const on = m.pinLog.filter(e => e.v === 1 && e.t > 0).map(e => e.pin); if (on.length < 8) return 'Se encienden muy pocos LED.'; const start = on.indexOf(3); const s = on.slice(start, start + 6).join(''); if (s !== '345654') return 'El orden fue ' + on.slice(0, 8).join('-') + '. Debe ir 3-4-5-6-5-4-3.'; return true; },
        hint: 'Dos for: uno sube de 3 a 6 y otro baja de 5 a 4.', solution: c`void setup() {
  for (int p = 3; p <= 6; p++) {
    pinMode(p, OUTPUT);
  }
}

void loop() {
  for (int p = 3; p <= 6; p++) {
    digitalWrite(p, HIGH);
    delay(100);
    digitalWrite(p, LOW);
  }
  for (int p = 5; p >= 4; p--) {
    digitalWrite(p, HIGH);
    delay(100);
    digitalWrite(p, LOW);
  }
}` } },
      { quiz: [{ q: '¿Cuántos LED puede alimentar un pin a la vez sin peligro?', o: ['Tantos como quieras', 'Depende de su consumo total: 20 mA por pin', 'Solo si son rojos', 'Ninguno'], a: 1, why: 'El límite es de corriente. Además, el conjunto de pines tiene otro límite: unos 200 mA en el UNO R3.' }] }
    ] },
    { id: 'botones', title: 'Botones e INPUT_PULLUP', min: 9, goal: 'Leer un pulsador sin lecturas fantasma.', blocks: [
      { p: 'Con [[digitalRead]] preguntas al pin si tiene voltaje. Pero un pin de entrada sin conexión queda **«al aire»**: capta ruido y lee valores aleatorios. Por eso un botón necesita una resistencia que fije un nivel cuando no está pulsado.' },
      { table: { head: ['Montaje', 'Sin pulsar', 'Pulsado', 'Componentes'], rows: [['Pull-down + INPUT', 'LOW', 'HIGH', 'Resistencia de 10 kΩ a GND'], ['INPUT_PULLUP', 'HIGH', 'LOW', 'Ninguno: resistencia interna']] } },
      { p: 'La opción **INPUT_PULLUP** es la más cómoda: conecta el botón entre el pin y GND. La lógica queda invertida: pulsado = LOW.' },
      { wire: [['Pin 2', 'Una pata del botón'], ['Pata opuesta del botón', 'GND']] },
      { lab: { code: c`const int BOTON = 2, LED = 13;

void setup() {
  pinMode(BOTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
}

void loop() {
  if (digitalRead(BOTON) == LOW) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
}`, parts: [{ type: 'button', pin: 2 }, { type: 'led', pin: 13 }] } },
      { challenge: { title: 'Botón inverso', desc: 'Haz que el LED del pin 13 esté **encendido normalmente y se apague mientras pulsas** el botón del pin 2.', start: c`void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
}

void loop() {
  // Tu código aquí
}`, parts: [{ type: 'button', pin: 2 }, { type: 'led', pin: 13 }], ms: 400, stim: [{ at: 150, button: 2, pressed: true }, { at: 300, button: 2, pressed: false }],
        check: (m) => { const e = m.edges(13); const at = (t) => { let v = 0; for (const x of e) if (x.t <= t) v = x.v; return v; }; if (at(100) !== 1) return 'Sin pulsar, el LED debe estar encendido.'; if (at(250) !== 0) return 'Al pulsar debe apagarse.'; if (at(390) !== 1) return 'Al soltar debe volver a encenderse.'; return true; },
        hint: 'La lectura ya es HIGH sin pulsar: basta con escribirla directamente en el LED.', solution: c`void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, digitalRead(2));
}` } },
      { quiz: [{ q: 'Con INPUT_PULLUP, ¿qué lees sin pulsar?', o: ['LOW', 'HIGH', 'Un valor al azar', '512'], a: 1, why: 'La resistencia interna lleva el pin a 5 V. Al pulsar, el botón lo une a GND.' }] }
    ] },
    { id: 'flancos', title: 'Detectar la pulsación y evitar rebotes', min: 11, goal: 'Reaccionar una vez por pulsación con un botón real.', blocks: [
      { p: 'Con los montajes anteriores, un contador sumaría miles de veces en una pulsación, porque loop() es muchísimo más rápido que tu dedo. Lo que interesa es el **flanco**: el instante en que cambia.' },
      { p: 'Hay otro problema físico. Los contactos metálicos **rebotan** al cerrarse: durante unos milisegundos la señal oscila. El botón de este laboratorio simula ese rebote; pulsa y verás que el contador salta varias veces.' },
      { lab: { code: c`const int BOTON = 2;
int anterior = HIGH;
int cuenta = 0;

void setup() {
  Serial.begin(9600);
  pinMode(BOTON, INPUT_PULLUP);
}

void loop() {
  int ahora = digitalRead(BOTON);
  if (anterior == HIGH && ahora == LOW) {
    cuenta++;
    Serial.println(cuenta);
  }
  anterior = ahora;
}`, parts: [{ type: 'button', pin: 2, bounce: true, label: 'Botón con rebote' }] } },
      { h: 'Solución: filtrar con el tiempo' },
      { p: 'Solo aceptamos un cambio si la lectura permanece estable durante unos milisegundos.' },
      { code: c`if (lectura != ultimaLectura) {
  ultimoCambio = millis();
}
if (millis() - ultimoCambio > 30) {
  if (lectura != estable) {
    estable = lectura;
    if (estable == LOW) cuenta++;
  }
}
ultimaLectura = lectura;`, notes: { 1: '¿Cambió respecto a la última lectura? Puede ser un rebote.', 2: 'Reinicia el cronómetro.', 4: 'Si lleva 30 ms sin cambiar, la señal es estable.', 5: '¿El nuevo valor estable es distinto del anterior?', 7: 'Solo se cuenta al pasar a pulsado.', 10: 'Se recuerda para la siguiente vuelta.' } },
      { challenge: { title: 'Contador sin rebotes', desc: 'Completa el programa para que, con **tres pulsaciones con rebote**, imprima exactamente **1, 2 y 3**.', start: c`const int BOTON = 2;
int estable = HIGH;
int ultimaLectura = HIGH;
unsigned long ultimoCambio = 0;
int cuenta = 0;

void setup() {
  Serial.begin(9600);
  pinMode(BOTON, INPUT_PULLUP);
}

void loop() {
  int lectura = digitalRead(BOTON);
  // Tu filtro aquí
  ultimaLectura = lectura;
}`, parts: [{ type: 'button', pin: 2, bounce: true }], ms: 1200, stim: [{ at: 100, button: 2, pressed: true, bounce: true }, { at: 300, button: 2, pressed: false, bounce: true }, { at: 500, button: 2, pressed: true, bounce: true }, { at: 700, button: 2, pressed: false, bounce: true }, { at: 900, button: 2, pressed: true, bounce: true }, { at: 1100, button: 2, pressed: false, bounce: true }],
        check: (m) => m.serialOut.trim().split('\n').join(',') === '1,2,3' ? true : 'Se imprimió: ' + (m.serialOut.trim().split('\n').join(', ') || '(nada)') + '. Debe ser 1, 2, 3.',
        hint: 'Copia el filtro de arriba y añade Serial.println(cuenta) junto a cuenta++.', solution: c`const int BOTON = 2;
int estable = HIGH;
int ultimaLectura = HIGH;
unsigned long ultimoCambio = 0;
int cuenta = 0;

void setup() {
  Serial.begin(9600);
  pinMode(BOTON, INPUT_PULLUP);
}

void loop() {
  int lectura = digitalRead(BOTON);
  if (lectura != ultimaLectura) {
    ultimoCambio = millis();
  }
  if (millis() - ultimoCambio > 30) {
    if (lectura != estable) {
      estable = lectura;
      if (estable == LOW) {
        cuenta++;
        Serial.println(cuenta);
      }
    }
  }
  ultimaLectura = lectura;
}` } },
      { quiz: [{ q: '¿Qué es el rebote de un pulsador?', o: ['Que el botón vuelve a su sitio', 'Oscilaciones eléctricas breves al cerrar el contacto', 'Un error del compilador', 'Un tipo de resistencia'], a: 1, why: 'Por eso una pulsación puede leerse como varias si no se filtra.' }] }
    ] }
  ] });

  M.push({ id: 'analogico', title: 'Mundo analógico y PWM', blurb: 'Potenciómetros, sensores y brillo variable.', lessons: [
    { id: 'analogread', title: 'analogRead: medir voltajes', min: 9, goal: 'Convertir un voltaje en un número útil.', blocks: [
      { p: 'El mundo no es solo encendido o apagado. Los pines A0–A5 tienen un **ADC** (conversor analógico-digital) de 10 bits, que convierte de 0 a 5 V en un número de 0 a 1023.' },
      { widget: 'adc' },
      { p: 'Un **potenciómetro** es una resistencia variable: la pata central entrega un voltaje entre 0 y 5 V según el giro.' },
      { wire: [['Pata izquierda', '5 V'], ['Pata central', 'A0'], ['Pata derecha', 'GND']] },
      { lab: { code: c`void setup() {
  Serial.begin(9600);
}

void loop() {
  int lectura = analogRead(A0);
  float voltios = lectura * 5.0 / 1023.0;

  Serial.print(lectura);
  Serial.print(" = ");
  Serial.print(voltios);
  Serial.println(" V");
  delay(300);
}`, parts: [{ type: 'pot', pin: 14 }] } },
      { tip: 'Con la pestaña **Gráfica** del monitor verás los números como una curva, igual que el *Serial Plotter* del IDE.' },
      { quiz: [{ q: 'Si analogRead da 1023, ¿qué voltaje hay?', o: ['0 V', '1 V', '2,5 V', '5 V'], a: 3, why: 'Es la lectura máxima, con la referencia por defecto de 5 V.' }, { q: '¿Cuántos valores distintos da un ADC de 10 bits?', o: ['10', '256', '1024', '4096'], a: 2, why: '2 elevado a 10 = 1024: de 0 a 1023.' }] }
    ] },
    { id: 'pwm', title: 'PWM: analogWrite', min: 10, goal: 'Regular brillo y velocidad.', blocks: [
      { p: 'Arduino UNO R3 no produce voltajes intermedios de verdad. Hace un truco: enciende y apaga el pin muy rápido (unos 490 Hz; 980 Hz en los pines 5 y 6). Según el **porcentaje de tiempo encendido**, el LED parece más o menos brillante. Eso es **PWM**.' },
      { widget: 'pwm' },
      { p: 'Con [[analogWrite]], 0 es siempre apagado y 255, siempre encendido. Solo funciona en los pines con **~**.' },
      { lab: { code: c`const int LED = 9;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  for (int b = 0; b <= 255; b += 5) {
    analogWrite(LED, b);
    delay(15);
  }
  for (int b = 255; b >= 0; b -= 5) {
    analogWrite(LED, b);
    delay(15);
  }
}`, parts: [{ type: 'led', pin: 9 }] } },
      { h: 'De entrada a salida: map()' },
      { p: 'Un potenciómetro da de 0 a 1023, pero analogWrite pide de 0 a 255. [[map]] hace la conversión, y [[constrain]] evita que te salgas.' },
      { challenge: { title: 'Regulador de luz', desc: 'Haz que el potenciómetro de A0 regule el brillo del LED del pin 9. Con 1023 debe valer 255.', start: c`void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  // Tu código aquí
}`, parts: [{ type: 'pot', pin: 14, value: 0 }, { type: 'led', pin: 9 }], ms: 300, stim: [{ at: 50, analog: 14, value: 512 }, { at: 200, analog: 14, value: 1023 }],
        check: (m) => { const mid = m.pinLog.filter(e => e.pin === 9 && e.t > 60000 && e.t < 190000 && e.pwm !== null).pop(); if (!mid) return 'Con el potenciómetro a la mitad, el LED debe tener un brillo intermedio con analogWrite.'; if (Math.abs(mid.pwm - 127) > 2) return 'A media escala el valor fue ' + mid.pwm + '; debe ser alrededor de 127.'; return m.pins[9].dig === 1 && m.pins[9].pwm === null ? true : 'Con 1023 el pin debe quedar a 255.'; },
        hint: 'analogWrite(9, map(analogRead(A0), 0, 1023, 0, 255));', solution: c`void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  int v = analogRead(A0);
  analogWrite(9, map(v, 0, 1023, 0, 255));
}` } },
      { quiz: [{ q: '¿Qué pasa con analogWrite(7, 100) en un UNO?', o: ['Brillo medio', 'El pin 7 no tiene PWM: quedará apagado', 'Error de compilación', 'Se quema el pin'], a: 1, why: 'Sin PWM, valores por debajo de 128 dan LOW y por encima, HIGH.' }, { q: 'analogWrite(9, 64) está encendido aproximadamente el…', o: ['6 %', '25 %', '64 %', '100 %'], a: 1, why: '64 / 255 ≈ 25 %.' }] }
    ] },
    { id: 'rgb', title: 'LED RGB: millones de colores', min: 6, goal: 'Mezclar colores con tres canales PWM.', blocks: [
      { p: 'Un LED RGB son tres LED en un mismo encapsulado. Cada canal se regula con PWM y la mezcla da el color. Los hay de cátodo común (la pata larga a GND) y de ánodo común (a 5 V, con la lógica invertida).' },
      { wire: [['Pin 9 → 220 Ω', 'Patilla R'], ['Pin 10 → 220 Ω', 'Patilla G'], ['Pin 11 → 220 Ω', 'Patilla B'], ['Patilla larga', 'GND (cátodo común)']] },
      { lab: { code: c`void color(int r, int g, int b) {
  analogWrite(9, r);
  analogWrite(10, g);
  analogWrite(11, b);
  delay(800);
}

void setup() {
}

void loop() {
  color(255, 0, 0);     // rojo
  color(255, 120, 0);   // naranja
  color(0, 255, 0);     // verde
  color(0, 200, 255);   // cian
  color(120, 0, 255);   // violeta
  color(255, 255, 255); // blanco
}`, parts: [{ type: 'rgb', r: 9, g: 10, b: 11 }] } },
      { quiz: [{ q: '¿Qué color da rojo y verde al máximo con azul apagado?', o: ['Blanco', 'Amarillo', 'Violeta', 'Cian'], a: 1, why: 'La mezcla aditiva de rojo y verde produce amarillo.' }] }
    ] },
    { id: 'sensores-analog', title: 'Sensores de luz y temperatura', min: 9, goal: 'Convertir lecturas en magnitudes reales.', blocks: [
      { h: 'LDR: sensor de luz' },
      { p: 'Una LDR cambia su resistencia con la luz. Con una resistencia de 10 kΩ forma un divisor de voltaje que A0 puede leer.' },
      { wire: [['5 V', 'LDR'], ['LDR', 'A0 y resistencia de 10 kΩ'], ['Resistencia de 10 kΩ', 'GND']] },
      { h: 'TMP36: sensor de temperatura' },
      { p: 'Entrega 10 mV por grado, con 0,5 V a 0 °C. La fórmula es **T = (V − 0,5) × 100**.' },
      { lab: { code: c`void setup() {
  Serial.begin(9600);
}

void loop() {
  int lectura = analogRead(A1);
  float v = lectura * 5.0 / 1023.0;
  float t = (v - 0.5) * 100.0;
  Serial.println(t);
  delay(400);
}`, parts: [{ type: 'tmp36', pin: 15, value: 153 }] } },
      { h: 'Calibrar y filtrar' },
      { ul: ['**Mide los extremos:** los sensores rara vez usan todo el rango de 0 a 1023. Anota mínimo y máximo reales y aplica map().', '**Promedia varias lecturas** para reducir el ruido.', '**Añade histéresis:** usa dos umbrales distintos para que un relé no se active y desactive sin parar cerca del límite.'] },
      { challenge: { title: 'Promedio de 10 lecturas', desc: 'Lee A0 10 veces, calcula el promedio con división entera e imprímelo una sola vez en setup(). Con el potenciómetro fijo a 700, debe salir **700**.', start: c`void setup() {
  Serial.begin(9600);
  // Tu código aquí
}

void loop() {
}`, parts: [{ type: 'pot', pin: 14, value: 700 }], ms: 200,
        check: (m) => m.serialOut.trim() === '700' ? true : 'Salió «' + (m.serialOut.trim() || 'nada') + '» y se esperaba 700. Imprime solo el promedio, una vez.',
        hint: 'Acumula en long suma = 0 dentro de un for y divide entre 10 al final. Con 10 lecturas cabría en un int, pero con 40 lecturas de 1023 ya no: long es un buen hábito.', solution: c`void setup() {
  Serial.begin(9600);
  long suma = 0;
  for (int i = 0; i < 10; i++) {
    suma += analogRead(A0);
  }
  Serial.println(suma / 10);
}

void loop() {
}` } },
      { quiz: [{ q: 'Un TMP36 da 0,75 V. ¿Qué temperatura hay?', o: ['7,5 °C', '25 °C', '75 °C', '125 °C'], a: 1, why: '(0,75 − 0,5) × 100 = 25 °C.' }] }
    ] }
  ] });

  M.push({ id: 'comunicacion', title: 'Comunicación', blurb: 'Serial, I2C y SPI para hablar con todo.', lessons: [
    { id: 'serial-out', title: 'Serial: tu ventana al programa', min: 8, goal: 'Enviar datos al ordenador y depurar.', blocks: [
      { p: 'Serial envía datos por USB entre la placa y el ordenador. Es la herramienta principal para saber qué está pasando dentro de un programa.' },
      { lab: { code: c`int x = 42;
float pi = 3.14159;

void setup() {
  Serial.begin(9600);
  Serial.print("x vale ");
  Serial.println(x);
  Serial.println(x, BIN);
  Serial.println(x, HEX);
  Serial.println(pi);
  Serial.println(pi, 4);
  Serial.println(F("Texto en Flash"));
  Serial.write(65);
  Serial.println();
}

void loop() {
}`, parts: [] } },
      { table: { head: ['Instrucción', 'Salida'], rows: [['Serial.print(42)', '42'], ['Serial.println(42, BIN)', '101010 y salto de línea'], ['Serial.print(3.14159)', '3.14 (dos decimales por defecto)'], ['Serial.print(3.14159, 4)', '3.1416'], ['Serial.write(65)', 'A (envía el byte en bruto)']] } },
      { warn: 'La velocidad del monitor debe coincidir con la de {{Serial.begin}}. Si ves símbolos raros, casi siempre es eso.' },
      { quiz: [{ q: '¿Qué diferencia hay entre print y println?', o: ['println es más rápido', 'println añade un salto de línea', 'print solo admite números', 'Ninguna'], a: 1, why: 'println termina la línea tras enviar el dato.' }] }
    ] },
    { id: 'serial-in', title: 'Serial: recibir comandos', min: 10, goal: 'Controlar la placa escribiendo desde el ordenador.', blocks: [
      { p: 'También puedes enviar datos a la placa. Llegan a un búfer de 64 bytes. Compruébalo con [[Serial.available]] y léelos con [[Serial.read]] o [[Serial.readStringUntil]].' },
      { p: 'Escribe **on** u **off** en la caja del monitor serie y pulsa Enviar.' },
      { lab: { code: c`const int LED = 13;

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  Serial.println("Escribe on u off");
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "on") {
      digitalWrite(LED, HIGH);
      Serial.println("Encendido");
    } else if (cmd == "off") {
      digitalWrite(LED, LOW);
      Serial.println("Apagado");
    } else {
      Serial.println("No entiendo: " + cmd);
    }
  }
}`, parts: [{ type: 'led', pin: 13 }] } },
      { challenge: { title: 'La calculadora del doble', desc: 'Lee un número entero por Serial e imprime su doble. Al recibir «21» debe imprimir **42**.', start: c`void setup() {
  Serial.begin(9600);
}

void loop() {
  // Tu código aquí
}`, parts: [], ms: 2000, stim: [{ at: 50, serial: '21\n' }],
        check: (m) => m.serialOut.trim().split('\n').includes('42') ? true : 'Salió: «' + m.serialOut.trim() + '». Debe aparecer 42.',
        hint: 'if (Serial.available() > 0) { long n = Serial.parseInt(); ... } Cuidado: el \\n final también llega. Comprueba que n no sea 0.', solution: c`void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    String linea = Serial.readStringUntil('\n');
    Serial.println(linea.toInt() * 2);
  }
}` } },
      { quiz: [{ q: '¿Qué devuelve Serial.read() si no hay datos?', o: ['0', '-1', 'null', 'Espera a que lleguen'], a: 1, why: 'Por eso se comprueba available() antes de leer.' }] }
    ] },
    { id: 'i2c', title: 'I2C: muchos dispositivos, dos cables', min: 9, goal: 'Conectar sensores y pantallas por I2C.', blocks: [
      { p: 'I2C conecta muchos dispositivos usando solo **SDA** (datos) y **SCL** (reloj). En el UNO son A4 y A5, y también están repetidos junto a AREF. Cada dispositivo tiene una dirección, como 0x27.' },
      { h: 'Conexiones' },
      { wire: [['VCC del módulo', '5 V (o 3,3 V según el módulo)'], ['GND', 'GND'], ['SDA', 'A4'], ['SCL', 'A5']] },
      { h: 'Escáner I2C' },
      { p: 'Este programa pregunta en todas las direcciones. Es lo primero que debes ejecutar si un módulo no responde. El simulador tiene una pantalla virtual en 0x27.' },
      { lab: { code: c`#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Serial.println("Buscando...");
  for (byte dir = 1; dir < 127; dir++) {
    Wire.beginTransmission(dir);
    byte error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("Encontrado en 0x");
      Serial.println(dir, HEX);
    }
  }
  Serial.println("Fin");
}

void loop() {
}`, parts: [] } },
      { tip: 'Las pantallas LCD con adaptador I2C suelen usar 0x27 o 0x3F. Si no sale texto, ajusta también el contraste, el tornillo azul de atrás.' },
      { quiz: [{ q: '¿Qué pines son SDA y SCL en el UNO?', o: ['0 y 1', '10 y 11', 'A4 y A5', '2 y 3'], a: 2, why: 'A4 es SDA y A5 es SCL.' }] }
    ] },
    { id: 'spi-uart', title: 'SPI, UART: comparar protocolos', min: 6, goal: 'Elegir el protocolo adecuado.', blocks: [
      { table: { head: ['', 'UART (Serial)', 'I2C', 'SPI'], rows: [['Cables', '2 (TX, RX)', '2 (SDA, SCL)', '4 (MOSI, MISO, SCK, SS)'], ['Dispositivos', '2', 'Muchos, por dirección', 'Muchos: un SS por cada uno'], ['Velocidad', 'Baja', 'Media', 'Alta'], ['Pines UNO', '0, 1', 'A4, A5', '11, 12, 13, 10'], ['Ejemplos', 'GPS, Bluetooth', 'Pantallas, RTC, sensores', 'Tarjetas SD, RFID']] } },
      { lab: { code: c`#include <SPI.h>

const int SS_PIN = 10;

void setup() {
  SPI.begin();
  pinMode(SS_PIN, OUTPUT);
  digitalWrite(SS_PIN, HIGH);
}

void loop() {
  digitalWrite(SS_PIN, LOW);
  SPI.transfer(0x42);
  digitalWrite(SS_PIN, HIGH);
  delay(500);
}`, parts: [{ type: 'led', pin: 10, label: 'Línea SS' }] } },
      { warn: 'Muchos módulos modernos trabajan a 3,3 V. Revisa su ficha: conectarlos a 5 V sin adaptador de nivel puede dañarlos.' },
      { quiz: [{ q: 'Necesitas grabar datos en una SD. ¿Qué protocolo suele usar el módulo?', o: ['UART', 'I2C', 'SPI', 'PWM'], a: 2, why: 'Las tarjetas SD usan SPI por su alta velocidad.' }] }
    ] }
  ] });

  M.push({ id: 'tiempo', title: 'Tiempo y multitarea', blurb: 'millis(), máquinas de estados e interrupciones.', lessons: [
    { id: 'millis', title: 'Adiós a delay: millis()', min: 12, goal: 'Hacer varias cosas a la vez sin bloquear el programa.', blocks: [
      { p: '[[delay]] detiene todo: si pones {{delay(5000)}}, durante 5 segundos la placa no ve tu botón. La solución es no esperar, sino **mirar el reloj** y actuar cuando corresponda con [[millis]].' },
      { code: c`unsigned long antes = 0;
const long INTERVALO = 500;

void loop() {
  unsigned long ahora = millis();
  if (ahora - antes >= INTERVALO) {
    antes = ahora;
    // Lo que haya que hacer cada 500 ms
  }
}`, notes: { 1: 'Guarda cuándo se hizo por última vez. Debe ser unsigned long.', 5: 'La hora actual, en milisegundos desde el arranque.', 6: '¿Ya pasó el intervalo? Esta resta sigue siendo correcta cuando millis() da la vuelta.', 7: 'Actualiza la marca de tiempo.' } },
      { p: 'Dos LED con ritmos distintos, y el botón responde siempre. **Esto es imposible de hacer bien con delay.**' },
      { lab: { code: c`const int LED1 = 9, LED2 = 10, BOTON = 2, LED3 = 11;
unsigned long t1 = 0, t2 = 0;
int e1 = LOW, e2 = LOW;

void setup() {
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  pinMode(BOTON, INPUT_PULLUP);
}

void loop() {
  unsigned long ahora = millis();

  if (ahora - t1 >= 300) {
    t1 = ahora;
    e1 = !e1;
    digitalWrite(LED1, e1);
  }
  if (ahora - t2 >= 1100) {
    t2 = ahora;
    e2 = !e2;
    digitalWrite(LED2, e2);
  }
  digitalWrite(LED3, digitalRead(BOTON) == LOW);
}`, parts: [{ type: 'led', pin: 9 }, { type: 'led', pin: 10, color: 'verde' }, { type: 'led', pin: 11, color: 'azul' }, { type: 'button', pin: 2 }] } },
      { challenge: { title: 'Dos ritmos a la vez', desc: 'Sin usar delay: parpadea el pin 13 **cada 250 ms** e imprime **«tic» por Serial cada 1000 ms**.', start: c`void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}

void loop() {
  // Tu código aquí (sin delay)
}`, parts: [{ type: 'led', pin: 13 }], ms: 3100,
        check: (m) => { const e = m.edges(13).filter(x => x.t > 0); const tics = (m.serialOut.match(/tic/g) || []).length; if (e.length < 10) return 'El LED cambia pocas veces: ' + e.length + '.'; if (Math.abs(e[3].t - e[2].t - 250) > 5) return 'El intervalo del LED debe ser de 250 ms.'; if (tics !== 3) return 'En 3 s deben salir 3 «tic» y salieron ' + tics + '.'; return true; },
        hint: 'Dos variables de tiempo y dos if independientes.', solution: c`unsigned long tLed = 0, tTic = 0;
int estado = LOW;

void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}

void loop() {
  unsigned long ahora = millis();
  if (ahora - tLed >= 250) {
    tLed = ahora;
    estado = !estado;
    digitalWrite(13, estado);
  }
  if (ahora - tTic >= 1000) {
    tTic = ahora;
    Serial.println("tic");
  }
}` } },
      { quiz: [{ q: '¿Qué tipo debe tener la variable que guarda millis()?', o: ['int', 'float', 'unsigned long', 'byte'], a: 2, why: 'Un int desbordaría a los 32 segundos.' }] }
    ] },
    { id: 'estados', title: 'Máquinas de estados', min: 10, goal: 'Organizar programas complejos sin enredos.', blocks: [
      { p: 'Cuando un programa crece, los if anidados se vuelven inmanejables. La solución es pensar en **estados**: el sistema siempre está en uno, y ciertos eventos lo hacen cambiar a otro.' },
      { table: { head: ['Estado', 'Hace', 'Pasa a', 'Cuando'], rows: [['ESPERA', 'LED apagado', 'ACTIVO', 'Se pulsa el botón'], ['ACTIVO', 'LED encendido', 'ALARMA', 'Pasan 3 s'], ['ALARMA', 'Parpadea y suena', 'ESPERA', 'Se pulsa el botón']] } },
      { lab: { code: c`enum Estado { ESPERA, ACTIVO, ALARMA };
Estado estado = ESPERA;
unsigned long inicio = 0;
int anterior = HIGH;

void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
  pinMode(2, INPUT_PULLUP);
}

void loop() {
  int ahora = digitalRead(2);
  bool pulsado = anterior == HIGH && ahora == LOW;
  anterior = ahora;

  switch (estado) {
    case ESPERA:
      digitalWrite(13, LOW);
      if (pulsado) {
        estado = ACTIVO;
        inicio = millis();
        Serial.println("ACTIVO");
      }
      break;
    case ACTIVO:
      digitalWrite(13, HIGH);
      if (millis() - inicio > 3000) {
        estado = ALARMA;
        Serial.println("ALARMA");
      }
      break;
    case ALARMA:
      digitalWrite(13, (millis() / 150) % 2);
      tone(8, 880, 20);
      if (pulsado) {
        estado = ESPERA;
        Serial.println("ESPERA");
      }
      break;
  }
}`, parts: [{ type: 'button', pin: 2 }, { type: 'led', pin: 13 }, { type: 'buzzer', pin: 8 }] } },
      { tip: 'Dibuja primero los estados en un papel, con flechas. Luego traducir a código es casi automático. Este patrón se usa en ascensores, cafeteras y robots.' },
      { quiz: [{ q: '¿Qué ventaja da una máquina de estados?', o: ['Consume menos corriente', 'El comportamiento queda organizado y es fácil de ampliar', 'Hace el código más rápido', 'Quita la necesidad de loop()'], a: 1, why: 'Cada estado se entiende por separado, y añadir uno no rompe los demás.' }] }
    ] },
    { id: 'interrupciones', title: 'Interrupciones', min: 10, goal: 'Reaccionar a eventos al instante.', blocks: [
      { p: 'Una interrupción detiene el programa cuando ocurre un evento, ejecuta una función breve y luego continúa donde estaba. Con [[attachInterrupt]] no se pierde ni un pulso, aunque el programa esté en un {{delay}}. En el UNO hay interrupciones externas en los pines **2 y 3**.' },
      { h: 'Reglas de una rutina de interrupción (ISR)' },
      { ul: ['**Breve:** sube una bandera o cuenta, y deja el resto a loop().', '**Sin** delay(), y evita Serial.', 'Sin parámetros ni valor de retorno.', 'Las variables compartidas deben ser [[volatile]].', 'millis() no avanza dentro de una ISR.'] },
      { p: 'Observa que el LED cambia al instante aunque loop() esté atrapado en un delay de 2 segundos.' },
      { lab: { code: c`const int BOTON = 2, LED = 13;
volatile bool estado = false;
volatile int veces = 0;

void alPulsar() {
  estado = !estado;
  veces++;
}

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  pinMode(BOTON, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BOTON), alPulsar, FALLING);
}

void loop() {
  digitalWrite(LED, estado);
  Serial.println(veces);
  delay(100);
}`, parts: [{ type: 'button', pin: 2 }, { type: 'led', pin: 13 }] } },
      { tip: 'Las interrupciones son ideales para encoders y sensores de pulsos. Para un botón, millis() suele ser suficiente y más simple. El rebote también dispara la interrupción varias veces.' },
      { challenge: { title: 'Contador de pulsos', desc: 'Cuenta con una interrupción en el pin 3, en modo **FALLING**, y muestra la cuenta. Tras cuatro pulsaciones debe imprimir **4** al final.', start: c`volatile int pulsos = 0;

void setup() {
  Serial.begin(9600);
  pinMode(3, INPUT_PULLUP);
  // Conecta aquí la interrupción
}

void loop() {
  Serial.println(pulsos);
  delay(200);
}`, parts: [{ type: 'button', pin: 3 }], ms: 1100, stim: [100, 200, 300, 400, 500, 600, 700, 800].map((t, i) => ({ at: t, button: 3, pressed: i % 2 === 0 })),
        check: (m) => { const lines = m.serialOut.trim().split('\n'); return lines[lines.length - 1] === '4' ? true : 'Última cuenta: ' + lines[lines.length - 1] + '. Debe ser 4.'; },
        hint: 'Crea void contar() { pulsos++; } y conéctala con attachInterrupt.', solution: c`volatile int pulsos = 0;

void contar() {
  pulsos++;
}

void setup() {
  Serial.begin(9600);
  pinMode(3, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(3), contar, FALLING);
}

void loop() {
  Serial.println(pulsos);
  delay(200);
}` } },
      { quiz: [{ q: '¿Para qué sirve volatile?', o: ['Para ahorrar memoria', 'Avisa de que la variable puede cambiar en cualquier momento', 'Para que sea constante', 'Para que sea global'], a: 1, why: 'Así el compilador no la optimiza asumiendo que no cambia.' }] }
    ] }
  ] });
})(typeof globalThis !== 'undefined' ? globalThis : this);

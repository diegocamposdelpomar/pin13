/* Temario, parte 3: componentes, temas avanzados y proyectos. */
(function (root) {
  const c = String.raw;
  const M = root.Pin13Modules = root.Pin13Modules || [];

  M.push({ id: 'componentes', title: 'Sensores y actuadores', blurb: 'Zumbadores, servos, motores, ultrasonidos, pantallas.', lessons: [
    { id: 'buzzer', title: 'Zumbador y melodías', min: 7, goal: 'Generar sonido con tone().', blocks: [
      { p: 'Un zumbador pasivo suena a la frecuencia que le indiques con [[tone]]. Uno activo solo necesita HIGH y siempre da el mismo tono. Para melodías necesitas el pasivo.' },
      { wire: [['Pin 8', 'Zumbador (+)'], ['Zumbador (−)', 'GND']] },
      { table: { head: ['Nota', 'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do alto'], rows: [['Hz', '262', '294', '330', '349', '392', '440', '494', '523']] } },
      { p: 'Pulsa Ejecutar y activa el sonido en el zumbador virtual.' },
      { lab: { code: c`const int Z = 8;
int notas[] = {262, 262, 392, 392, 440, 440, 392};
int tiempos[] = {300, 300, 300, 300, 300, 300, 600};

void setup() {
  for (int i = 0; i < 7; i++) {
    tone(Z, notas[i], tiempos[i]);
    delay(tiempos[i] + 60);
  }
}

void loop() {
}`, parts: [{ type: 'buzzer', pin: 8 }] } },
      { warn: 'tone() no detiene el programa. Si no pones un delay después, la siguiente nota pisará a la anterior. También interfiere con el PWM en los pines 3 y 11.' },
      { challenge: { title: 'Sirena', desc: 'Alterna **600 Hz y 900 Hz** en el pin 8, 200 ms cada uno.', start: c`void setup() {
}

void loop() {
  // Tu código aquí
}`, parts: [{ type: 'buzzer', pin: 8 }], ms: 1300,
        check: (m) => { const f = m.toneLog.map(x => x.freq); if (f.length < 4) return 'Solo sonaron ' + f.length + ' tonos.'; if (!f.includes(600) || !f.includes(900)) return 'Las frecuencias deben ser 600 y 900 Hz.'; const dt = m.toneLog[1].t - m.toneLog[0].t; return Math.abs(dt - 200) < 10 ? true : 'Cada tono debe durar 200 ms; duró ' + Math.round(dt) + '.'; },
        hint: 'tone(8, 600); delay(200); tone(8, 900); delay(200);', solution: c`void setup() {
}

void loop() {
  tone(8, 600);
  delay(200);
  tone(8, 900);
  delay(200);
}` } },
      { quiz: [{ q: '¿Cuál es la frecuencia mínima de tone()?', o: ['1 Hz', '31 Hz', '440 Hz', '1000 Hz'], a: 1, why: 'Es un límite documentado de la función.' }] }
    ] },
    { id: 'servo', title: 'Servomotores', min: 8, goal: 'Posicionar un eje a un ángulo exacto.', blocks: [
      { p: 'Un servo tiene motor, engranajes y un circuito que busca un ángulo, normalmente entre 0° y 180°. Con la librería **Servo** basta con pedirle el ángulo.' },
      { wire: [['Cable rojo', '5 V (para muchos servos, usa una fuente externa)'], ['Cable marrón o negro', 'GND'], ['Cable naranja o amarillo', 'Pin 9']] },
      { lab: { code: c`#include <Servo.h>

Servo brazo;

void setup() {
  brazo.attach(9);
}

void loop() {
  int lectura = analogRead(A0);
  int angulo = map(lectura, 0, 1023, 0, 180);
  brazo.write(angulo);
  delay(15);
}`, parts: [{ type: 'pot', pin: 14 }, { type: 'servo', pin: 9 }] } },
      { warn: 'Un servo pequeño puede dar picos de consumo que reinician la placa. Con más de uno o dos, usa una fuente de 5 V aparte y **une los GND**. La librería desactiva además el PWM en los pines 9 y 10.' },
      { challenge: { title: 'Barrido', desc: 'Haz que el servo del pin 9 vaya de 0° a 180° y vuelva, de grado en grado, con 5 ms entre pasos.', start: c`#include <Servo.h>

Servo s;

void setup() {
  s.attach(9);
}

void loop() {
  // Tu código aquí
}`, parts: [{ type: 'servo', pin: 9 }], ms: 1700,
        check: (m) => m.servos[9] < 40 ? true : 'Tras 1,7 s el servo debería ir de vuelta y estar cerca de 0° (está en ' + m.servos[9] + '°). ¿Hiciste la ida y la vuelta con 5 ms por paso?',
        hint: 'Dos for con delay(5).', solution: c`#include <Servo.h>

Servo s;

void setup() {
  s.attach(9);
}

void loop() {
  for (int a = 0; a <= 180; a++) {
    s.write(a);
    delay(5);
  }
  for (int a = 180; a >= 0; a--) {
    s.write(a);
    delay(5);
  }
}` } },
      { quiz: [{ q: '¿Qué devuelve servo.read()?', o: ['La posición medida por un sensor', 'El último ángulo solicitado', 'La corriente', 'La velocidad'], a: 1, why: 'No hay realimentación hacia Arduino: solo recuerda lo último que pediste.' }] }
    ] },
    { id: 'motores', title: 'Motores DC, relés y paso a paso', min: 11, goal: 'Controlar cargas con la electrónica adecuada.', blocks: [
      { p: 'Un pin da 20 mA. Un motor pequeño pide fácilmente 200 mA o más. La regla es sencilla: **el pin controla, otro componente aguanta la potencia**.' },
      { h: 'Motor DC con transistor' },
      { p: 'El pin activa un transistor, que deja pasar la corriente de una fuente externa. El diodo en paralelo absorbe el pico de voltaje al apagar el motor. Con PWM se regula la velocidad.' },
      { wire: [['Pin 9 → 1 kΩ', 'Base del transistor NPN (p. ej. 2N2222)'], ['Emisor', 'GND'], ['Colector', 'Motor (−)'], ['Motor (+)', 'Fuente externa (+)'], ['Diodo 1N4007', 'En paralelo al motor, con la franja hacia (+)'], ['GND Arduino', 'GND de la fuente externa']] },
      { lab: { code: c`const int MOTOR = 9;

void setup() {
  pinMode(MOTOR, OUTPUT);
}

void loop() {
  int v = analogRead(A0);
  analogWrite(MOTOR, map(v, 0, 1023, 0, 255));
}`, parts: [{ type: 'pot', pin: 14, label: 'Velocidad' }, { type: 'motor', pin: 9 }] } },
      { h: 'Dos sentidos: puente H' },
      { p: 'Para girar en ambos sentidos se usa un driver como el **L298N** o el **TB6612**: dos pines marcan la dirección y uno con PWM, la velocidad.' },
      { h: 'Relés: encender aparatos' },
      { p: 'Un relé es un interruptor mecánico controlado por un electroimán, y permite conmutar cargas grandes con aislamiento eléctrico. Los módulos se manejan con un solo pin digital.' },
      { warn: '**La tensión de red (110/220 V) puede matar.** Si no tienes formación, no la manipules: practica con cargas de 12 V o menos.' },
      { h: 'Motores paso a paso' },
      { p: 'Se mueven por pasos exactos, sin necesidad de sensor. Un 28BYJ-48 con driver ULN2003 es la opción clásica de aprendizaje y se controla con la librería **Stepper**. En el simulador no está incluida, así que este ejemplo se debe probar en la placa.' },
      { code: c`#include <Stepper.h>

const int PASOS = 2048;
Stepper motor(PASOS, 8, 10, 9, 11);

void setup() {
  motor.setSpeed(10);
}

void loop() {
  motor.step(PASOS);
  delay(500);
  motor.step(-PASOS);
  delay(500);
}`, noSim: true, notes: { 4: 'En el 28BYJ-48 el orden de pines es 8, 10, 9, 11, en lugar de 8, 9, 10, 11.', 7: 'Revoluciones por minuto.', 11: 'Una vuelta completa. Esta función bloquea hasta terminar.', 13: 'Negativo: en sentido contrario.' } },
      { quiz: [{ q: '¿Para qué sirve el diodo en paralelo con un motor?', o: ['Para que brille', 'Para absorber el pico de voltaje al apagarse', 'Para limitar la velocidad', 'Para invertir el giro'], a: 1, why: 'Las bobinas generan un pico inverso que podría destruir el transistor.' }] }
    ] },
    { id: 'ultrasonido', title: 'Sensor ultrasónico HC-SR04', min: 8, goal: 'Medir distancias sin contacto.', blocks: [
      { p: 'Funciona como un murciélago: emite un pulso de sonido y mide cuánto tarda en volver. El sonido viaja a unos 343 m/s, es decir, tarda 58 µs por centímetro entre ida y vuelta. Su alcance típico es de 2 a 400 cm.' },
      { wire: [['VCC', '5 V'], ['TRIG', 'Pin 9'], ['ECHO', 'Pin 10'], ['GND', 'GND']] },
      { lab: { code: c`const int TRIG = 9, ECHO = 10;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
}

long medir() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 30000);
  return us / 58;
}

void loop() {
  long cm = medir();
  Serial.print(cm);
  Serial.println(" cm");
  delay(250);
}`, parts: [{ type: 'sonar', trig: 9, echo: 10, cm: 50 }] } },
      { tip: 'Pasa siempre un tiempo máximo a [[pulseIn]]. Sin él, si no hay eco, tu programa se queda parado hasta un segundo.' },
      { quiz: [{ q: 'pulseIn devuelve 1160 µs. ¿A qué distancia está el objeto?', o: ['5 cm', '20 cm', '58 cm', '116 cm'], a: 1, why: '1160 / 58 = 20 cm.' }] }
    ] },
    { id: 'lcd', title: 'Pantalla LCD 16×2', min: 8, goal: 'Mostrar información sin ordenador.', blocks: [
      { p: 'La LCD de 16 columnas y 2 filas es la pantalla clásica. Se puede conectar en paralelo, con 6 pines, o con un adaptador I2C, con solo 2. Filas y columnas se cuentan **desde 0**.' },
      { wire: [['RS, E', 'Pines 12, 11'], ['D4, D5, D6, D7', 'Pines 5, 4, 3, 2'], ['VSS, RW, K', 'GND'], ['VDD, A', '5 V (A con resistencia)'], ['V0', 'Pata central de un potenciómetro: contraste']] },
      { lab: { code: c`#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(16, 2);
  lcd.print("Hola, Arduino!");
}

void loop() {
  lcd.setCursor(0, 1);
  lcd.print("Segundos: ");
  lcd.print(millis() / 1000);
  delay(200);
}`, parts: [{ type: 'lcd' }] } },
      { p: 'Con adaptador I2C, solo cambia el principio; se instala la librería **LiquidCrystal_I2C** desde el gestor:' },
      { code: c`#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.print("Con 2 cables");
}

void loop() {
}`, notes: { 4: 'Dirección I2C, columnas y filas. Si no funciona, ejecuta el escáner: puede ser 0x3F.', 8: 'Enciende la luz de fondo.' } },
      { challenge: { title: 'Medidor en pantalla', desc: 'Muestra en la **fila 0** el texto **Valor:**, y en la **fila 1** la lectura de A0. Para que no queden restos, escribe dos espacios al final. Con 345, la fila 1 debe mostrar «345».', start: c`#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(16, 2);
}

void loop() {
  // Tu código aquí
  delay(100);
}`, parts: [{ type: 'lcd' }, { type: 'pot', pin: 14, value: 345 }], ms: 400,
        check: (m) => { if (!m.lcd.lines[0].startsWith('Valor:')) return 'La fila 0 muestra: «' + m.lcd.lines[0].trim() + '»'; return m.lcd.lines[1].trim() === '345' ? true : 'La fila 1 muestra: «' + m.lcd.lines[1].trim() + '»'; },
        hint: 'setCursor(0, 0); print("Valor:"); setCursor(0, 1); print(analogRead(A0)); print("  ");', solution: c`#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(16, 2);
}

void loop() {
  lcd.setCursor(0, 0);
  lcd.print("Valor:");
  lcd.setCursor(0, 1);
  lcd.print(analogRead(A0));
  lcd.print("  ");
  delay(100);
}` } },
      { quiz: [{ q: '¿Qué hace lcd.setCursor(4, 1)?', o: ['Columna 4, fila 2 (la de abajo)', 'Columna 1, fila 4', 'Escribe un 4', 'Borra 4 caracteres'], a: 0, why: 'Primero la columna y luego la fila, contando desde 0.' }] }
    ] },
    { id: 'dht-registro', title: 'DHT11 y registro 74HC595', min: 9, goal: 'Usar sensores digitales y ampliar salidas.', blocks: [
      { h: 'DHT11 / DHT22: temperatura y humedad' },
      { p: 'Estos sensores usan un protocolo digital propio, y la librería se encarga de todo. Instala **DHT sensor library** desde el gestor. El DHT11 es lento: no lo leas más de una vez por segundo. El DHT22 es más preciso, y necesita dos segundos entre lecturas.' },
      { lab: { code: c`#include <DHT.h>

DHT dht(2, DHT11);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  Serial.print(t);
  Serial.print(" °C, ");
  Serial.print(h);
  Serial.println(" %");
  delay(2000);
}`, parts: [{ type: 'dht', pin: 2 }] } },
      { h: 'Registro de desplazamiento 74HC595' },
      { p: '¿Te faltan pines? Este chip barato convierte 3 pines en 8 salidas, y se pueden encadenar varios. Se usa con [[shiftOut]].' },
      { wire: [['Pin 11', 'DS, pin 14 (datos)'], ['Pin 12', 'SH_CP, pin 11 (reloj)'], ['Pin 8', 'ST_CP, pin 12 (latch)'], ['Pines 10 y 16', '5 V'], ['Pines 8 y 13', 'GND']] },
      { lab: { code: c`const int DATA = 11, CLK = 12, LATCH = 8;
byte patron = 1;

void setup() {
  pinMode(DATA, OUTPUT);
  pinMode(CLK, OUTPUT);
  pinMode(LATCH, OUTPUT);
}

void loop() {
  digitalWrite(LATCH, LOW);
  shiftOut(DATA, CLK, MSBFIRST, patron);
  digitalWrite(LATCH, HIGH);
  patron = patron << 1;
  if (patron == 0) patron = 1;
  delay(150);
}`, parts: [{ type: 'sr595', data: 11, clock: 12, latch: 8 }] } },
      { quiz: [{ q: '¿Cuántos pines de Arduino necesita un 74HC595?', o: ['1', '3', '8', '16'], a: 1, why: 'Datos, reloj y latch.' }] }
    ] }
  ] });

  M.push({ id: 'avanzado', title: 'Más allá de lo básico', blurb: 'Memoria, bits, librerías, depuración, energía y otras placas.', lessons: [
    { id: 'memoria', title: 'Memoria: Flash, SRAM y EEPROM', min: 10, goal: 'Entender por qué se cuelga un programa y cómo evitarlo.', blocks: [
      { table: { head: ['Memoria', 'UNO R3', 'Guarda', '¿Al apagar?'], rows: [['Flash', '32 KB', 'Tu programa', 'Se conserva'], ['SRAM', '2 KB', 'Variables en ejecución', 'Se pierde'], ['EEPROM', '1 KB', 'Datos que eliges conservar', 'Se conserva']] } },
      { p: 'La SRAM es el recurso que se agota antes. Al compilar, el IDE te indica cuánta usas. Por encima del 75 % empieza el riesgo: variables y pila chocan, y aparecen fallos aparentemente al azar.' },
      { h: 'Cómo ahorrar SRAM' },
      { ul: ['Usa [[F]] en textos fijos: {{Serial.println(F("…"));}}', 'Elige el tipo más pequeño posible: byte en vez de int.', 'Usa [[const]] y evita copias innecesarias.', 'Evita manipular String repetidamente en loop().', 'Mueve tablas grandes a Flash con {{PROGMEM}}.'] },
      { h: 'EEPROM: guardar al apagar' },
      { p: 'Cada celda aguanta unas 100 000 escrituras. Usa [[EEPROM.update]] en lugar de [[EEPROM.write]]: solo escribe si el valor cambia.' },
      { lab: { code: c`#include <EEPROM.h>

void setup() {
  Serial.begin(9600);
  byte arranques = EEPROM.read(0);
  if (arranques == 255) arranques = 0;
  arranques++;
  EEPROM.update(0, arranques);
  Serial.print("Arranques: ");
  Serial.println(arranques);
}

void loop() {
}`, parts: [] } },
      { tip: 'En el laboratorio, pulsa Reiniciar y observa cómo el contador sigue subiendo: la EEPROM virtual sobrevive al reinicio, como la real.' },
      { quiz: [{ q: '¿Dónde se guardan las variables mientras el programa corre?', o: ['Flash', 'SRAM', 'EEPROM', 'USB'], a: 1, why: 'La SRAM es rápida, pero se borra al perder la energía.' }, { q: '¿Por qué usar EEPROM.update?', o: ['Es más rápido de escribir', 'Solo escribe si cambia, y alarga la vida de la celda', 'Admite más datos', 'Evita usar librerías'], a: 1, why: 'Las escrituras desgastan la celda; leer no.' }] }
    ] },
    { id: 'bits', title: 'Bits y registros', min: 11, goal: 'Trabajar a bajo nivel cuando la velocidad importa.', blocks: [
      { p: 'Todo dato se guarda en bits. Toca cada bit para ver cómo cambia el número.' },
      { widget: 'binary' },
      { h: 'Operaciones de bits' },
      { table: { head: ['Quiero', 'Código', 'Equivale a'], rows: [['Poner a 1 el bit n', 'x |= (1 << n)', 'bitSet(x, n)'], ['Poner a 0 el bit n', 'x &= ~(1 << n)', 'bitClear(x, n)'], ['Invertir el bit n', 'x ^= (1 << n)', '—'], ['Leer el bit n', '(x >> n) & 1', 'bitRead(x, n)']] } },
      { lab: { code: c`void setup() {
  Serial.begin(9600);
  byte x = 0b00001010;
  Serial.println(x, BIN);
  x |= (1 << 0);
  Serial.println(x, BIN);
  x &= ~(1 << 3);
  Serial.println(x, BIN);
  x ^= (1 << 7);
  Serial.println(x, BIN);
  Serial.println((x >> 1) & 1);
}

void loop() {
}`, parts: [] } },
      { h: 'Registros: acceso directo a los pines' },
      { p: 'digitalWrite comprueba varias cosas antes de actuar, y tarda varios microsegundos. Escribir directamente en los registros del ATmega328P es mucho más rápido y permite cambiar varios pines a la vez. El simulador no los emula: este ejemplo es para la placa.' },
      { code: c`void setup() {
  DDRB |= (1 << 5);
}

void loop() {
  PORTB |= (1 << 5);
  delay(500);
  PORTB &= ~(1 << 5);
  delay(500);
}`, noSim: true, notes: { 2: 'DDRB es la dirección del puerto B. El bit 5 corresponde al pin 13. Equivale a pinMode(13, OUTPUT).', 6: 'PORTB es el valor de salida. Pone el pin 13 a HIGH.', 8: 'Pone el pin 13 a LOW sin tocar los demás.' } },
      { warn: 'Los registros son específicos de cada chip: este código no funciona en un UNO R4 ni en un ESP32. Úsalo solo si lo necesitas.' },
      { challenge: { title: 'Máscara', desc: 'Partiendo de {{byte x = 0b11110000;}} usa una operación de bits para invertir los 4 bits bajos e imprime en binario. Debe salir **11111111**.', start: c`void setup() {
  Serial.begin(9600);
  byte x = 0b11110000;
  // Tu operación aquí
  Serial.println(x, BIN);
}

void loop() {
}`, parts: [], ms: 100,
        check: (m) => m.serialOut.trim() === '11111111' ? true : 'Salió «' + m.serialOut.trim() + '».',
        hint: 'x ^= 0b00001111;', solution: c`void setup() {
  Serial.begin(9600);
  byte x = 0b11110000;
  x ^= 0b00001111;
  Serial.println(x, BIN);
}

void loop() {
}` } },
      { quiz: [{ q: '¿Cuánto vale 1 << 4?', o: ['4', '5', '8', '16'], a: 3, why: 'Es 2 elevado a 4.' }] }
    ] },
    { id: 'librerias', title: 'Librerías: instalar y crear', min: 7, goal: 'Aprovechar código de otros y escribir el tuyo.', blocks: [
      { p: 'Una librería es código ya escrito para resolver una tarea. Hay miles para casi cualquier sensor. En el IDE: **Herramientas → Gestionar librerías**, busca e instala. Luego, añade {{#include}} y mira los ejemplos en **Archivo → Ejemplos**.' },
      { h: 'Librerías muy usadas' },
      { table: { head: ['Librería', 'Sirve para'], rows: [['Servo', 'Servomotores'], ['LiquidCrystal', 'Pantallas LCD'], ['Wire', 'Bus I2C'], ['SPI', 'Bus SPI'], ['SD', 'Tarjetas de memoria'], ['Stepper', 'Motores paso a paso'], ['EEPROM', 'Memoria permanente'], ['DHT sensor library', 'Sensores DHT'], ['Adafruit NeoPixel', 'Tiras de LED direccionables'], ['RTClib', 'Relojes de tiempo real'], ['TinyGPSPlus', 'Módulos GPS']] } },
      { h: 'Tu primera librería' },
      { p: 'Una librería son dos archivos en la carpeta {{Documentos/Arduino/libraries/Parpadeo/}}: la cabecera y la implementación. Requiere clases, que funcionan en la placa pero no en este simulador.' },
      { code: c`// Parpadeo.h
#ifndef PARPADEO_H
#define PARPADEO_H
#include <Arduino.h>

class Parpadeo {
  public:
    Parpadeo(int pin);
    void pulso(int ms);
  private:
    int _pin;
};
#endif`, noSim: true, notes: { 2: 'Evita que el archivo se incluya dos veces.', 4: 'Da acceso a las funciones de Arduino.', 6: 'Una clase agrupa datos y funciones.', 8: 'El constructor: se ejecuta al crear el objeto.', 11: 'Variable interna; el _ es una convención.' } },
      { code: c`// Parpadeo.cpp
#include "Parpadeo.h"

Parpadeo::Parpadeo(int pin) {
  _pin = pin;
  pinMode(_pin, OUTPUT);
}

void Parpadeo::pulso(int ms) {
  digitalWrite(_pin, HIGH);
  delay(ms);
  digitalWrite(_pin, LOW);
  delay(ms);
}`, noSim: true, notes: { 4: 'Implementación del constructor.', 9: 'Parpadeo:: indica que la función pertenece a la clase.' } },
      { quiz: [{ q: '¿Qué hace #include <Servo.h>?', o: ['Instala la librería', 'Añade la librería al programa', 'Conecta el servo', 'Mueve el servo'], a: 1, why: 'La librería debe estar instalada; #include la hace disponible en tu código.' }] }
    ] },
    { id: 'depurar', title: 'Depurar: encontrar errores', min: 9, goal: 'Aplicar un método para resolver cualquier fallo.', blocks: [
      { p: 'Depurar no es adivinar: es reducir las posibilidades. Este programa tiene **tres errores**. Encuéntralos con el paso a paso y los mensajes del simulador.' },
      { lab: { code: c`int contador = 0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int lectura = digitalRead(7);
  digitalWrite(13, lectura);
  contador = contador + 1;
  Serial.println(contador);
  analogWrite(13, 300);
  delay(500);
}`, parts: [{ type: 'led', pin: 13 }] } },
      { tip: 'Soluciones: falta {{pinMode(13, OUTPUT)}}; el pin 7 está al aire porque le falta {{INPUT_PULLUP}} y un botón; el pin 13 no tiene PWM y 300 se sale de 0–255.' },
      { h: 'Método en 6 pasos' },
      { ol: ['**Reproduce** el problema de forma fiable.', '**Aísla:** divídelo en mitades. ¿El fallo está en el circuito o en el código?', '**Mira dentro:** imprime valores con Serial.', '**Simplifica:** carga el ejemplo Blink. ¿Funciona la placa? ¿Funciona el componente solo?', '**Cambia una sola cosa** cada vez.', '**Explícalo en voz alta.** A menudo el error aparece al contarlo.'] },
      { h: 'Síntomas y causas frecuentes' },
      { table: { head: ['Síntoma', 'Causa probable'], rows: [['La lectura cambia sola', 'Pin al aire: falta una resistencia o INPUT_PULLUP'], ['El LED brilla muy poco', 'Falta pinMode OUTPUT'], ['La placa se reinicia', 'Consumo excesivo: motor o servo sin fuente aparte'], ['Fallo tras un rato', 'Sin memoria o int desbordado'], ['Símbolos raros en el monitor', 'Velocidad de baudios distinta'], ['«expected ; before…»', 'Falta ; en la línea anterior'], ['«was not declared in this scope»', 'Nombre mal escrito o alcance incorrecto']] } },
      { quiz: [{ q: 'Tu sensor da valores absurdos. ¿Qué haces primero?', o: ['Reescribir todo', 'Imprimir la lectura en bruto y revisar el cableado', 'Comprar otro Arduino', 'Añadir delays'], a: 1, why: 'Primero hay que ver el dato real y descartar lo físico.' }] }
    ] },
    { id: 'energia', title: 'Alimentación y bajo consumo', min: 7, goal: 'Dar energía correctamente a tus proyectos.', blocks: [
      { table: { head: ['Vía', 'Voltaje', 'Nota'], rows: [['USB', '5 V', 'Lo más simple, hasta unos 500 mA'], ['Conector jack', '7–12 V', 'Pasa por el regulador'], ['Pin VIN', '7–12 V', 'Igual que el jack'], ['Pin 5 V', '5 V exactos', 'Sin regulador ni protección: cuidado']] } },
      { warn: 'Una batería de 9 V cuadrada dura poco con Arduino y no da para motores. Considera 6 pilas AA, una batería LiPo con regulador o un power bank.' },
      { h: 'Reducir el consumo' },
      { p: 'Un UNO consume alrededor de 50 mA, incluso sin hacer nada: durarías pocos días con baterías. Algunas estrategias:' },
      { ul: ['**Modo sueño:** con {{<avr/sleep.h>}} o la librería **LowPower**, el micro se detiene y lo despierta una interrupción.', '**Quitar lo superfluo:** el LED de encendido y el chip USB gastan aunque no los uses. Un Pro Mini consume mucho menos que un UNO.', '**Apagar módulos** con un transistor mientras no se usan.', '**Elegir bien la placa:** las familias Nano 33 o MKR y un ESP32 en deep sleep están pensadas para baterías.'] },
      { quiz: [{ q: '¿Puedes conectar 9 V al pin de 5 V?', o: ['Sí', 'Sí, si pones un LED', 'No: sin regulador, dañarías la placa', 'Solo un momento'], a: 2, why: 'Los 9 V van a VIN o al conector, donde pasan por el regulador.' }] }
    ] },
    { id: 'placas', title: 'El mundo de placas', min: 8, goal: 'Saber qué placa elegir.', blocks: [
      { table: { head: ['Placa', 'Chip', 'Voltaje', 'Flash / SRAM', 'Destaca por'], rows: [
        ['UNO R3', 'ATmega328P, 16 MHz', '5 V', '32 KB / 2 KB', 'Referencia para aprender'],
        ['UNO R4 Minima', 'RA4M1, 48 MHz', '5 V', '256 KB / 32 KB', 'ADC de 14 bits y DAC; mucha más memoria'],
        ['UNO R4 WiFi', 'RA4M1 + ESP32-S3', '5 V', '256 KB / 32 KB', 'WiFi, Bluetooth y matriz de LED'],
        ['Nano', 'ATmega328P, 16 MHz', '5 V', '32 KB / 2 KB', 'Mismo cerebro que el UNO, cabe en una protoboard'],
        ['Mega 2560', 'ATmega2560, 16 MHz', '5 V', '256 KB / 8 KB', '54 pines digitales y 16 analógicos'],
        ['ESP32 (terceros)', 'Doble núcleo, hasta 240 MHz', '3,3 V', 'Según módulo', 'WiFi y Bluetooth a bajo coste'],
        ['Raspberry Pi Pico', 'RP2040, 133 MHz', '3,3 V', '2 MB / 264 KB', 'Barata y potente; también con Arduino']
      ] } },
      { h: 'Qué cambia al pasar del UNO R3 al R4' },
      { ul: ['**int ocupa 4 bytes:** ya no desborda en 32767.', '**Cada pin da menos corriente:** unos 8 mA frente a 20 mA. ¡Revisa los LED!', '**Más resolución:** [[analogReadResolution]] y [[analogWriteResolution]].', 'Se pierde el acceso directo a registros como PORTB, que son propios del AVR.'] },
      { warn: 'En las placas de **3,3 V**, como ESP32, nunca apliques 5 V a un pin de entrada. Usa un divisor de voltaje o un adaptador de nivel.' },
      { h: 'Conectarse a internet' },
      { p: 'Para IoT, lo habitual es usar una placa con WiFi. Tu programa se conecta a la red y envía datos con HTTP o MQTT. Este fragmento es para una placa con WiFi: requiere hardware real.' },
      { code: c`#include <WiFi.h>

const char* RED = "MiWifi";
const char* CLAVE = "secreto";

void setup() {
  Serial.begin(115200);
  WiFi.begin(RED, CLAVE);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.localIP());
}

void loop() {
}`, noSim: true, notes: { 1: 'En un UNO R4 WiFi la librería se llama WiFiS3.h.', 8: 'Inicia la conexión.', 9: 'Espera hasta estar conectado.', 13: 'Muestra la dirección IP asignada.' } },
      { quiz: [{ q: 'Te llevas código del UNO R3 al ESP32. ¿Cuál es el mayor peligro físico?', o: ['Que sea más rápido', 'Que sus pines son de 3,3 V y no toleran 5 V de forma fiable', 'Que no tiene loop()', 'Que no compile'], a: 1, why: 'Un sensor de 5 V puede dañar la entrada si no adaptas el nivel.' }] }
    ] }
  ] });

  M.push({ id: 'proyectos', title: 'Proyectos completos', blurb: 'Junta todo lo aprendido en sistemas reales.', lessons: [
    { id: 'alarma', title: 'Proyecto: alarma de proximidad', min: 15, goal: 'Combinar sensor, salidas y lógica sin bloquear.', blocks: [
      { p: 'Un sensor de aparcamiento: cuanto más cerca el objeto, más rápidos los pitidos. Mueve el deslizador de distancia y observa los cambios.' },
      { h: 'Cómo está pensado' },
      { ol: ['Mide la distancia cada 100 ms.', 'Calcula el intervalo con map(): cerca = rápido.', 'Con millis(), emite pitidos sin bloquear.', 'El LED verde indica vía libre; el rojo, peligro.'] },
      { lab: { code: c`const int TRIG = 9, ECHO = 10, ZUMB = 8, ROJO = 12, VERDE = 13;
unsigned long tMedir = 0, tBip = 0;
long cm = 100;

long medir() {
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  return pulseIn(ECHO, HIGH, 30000) / 58;
}

void setup() {
  Serial.begin(9600);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(ROJO, OUTPUT);
  pinMode(VERDE, OUTPUT);
}

void loop() {
  unsigned long ahora = millis();

  if (ahora - tMedir >= 100) {
    tMedir = ahora;
    cm = medir();
    Serial.println(cm);
  }

  bool cerca = cm > 0 && cm < 60;
  digitalWrite(ROJO, cerca);
  digitalWrite(VERDE, !cerca);

  if (cerca) {
    long pausa = map(constrain(cm, 5, 60), 5, 60, 80, 700);
    if (ahora - tBip >= pausa) {
      tBip = ahora;
      tone(ZUMB, 1500, 40);
    }
  }
}`, parts: [{ type: 'sonar', trig: 9, echo: 10, cm: 80 }, { type: 'buzzer', pin: 8 }, { type: 'led', pin: 12, color: 'rojo' }, { type: 'led', pin: 13, color: 'verde' }] } },
      { h: 'Amplíalo' },
      { ul: ['Añade un botón para silenciar.', 'Muestra la distancia en una LCD.', 'Guarda la distancia mínima en EEPROM.'] }
    ] },
    { id: 'termostato', title: 'Proyecto: termostato con pantalla', min: 15, goal: 'Controlar con histéresis y ajustar con botones.', blocks: [
      { p: 'Un termostato enciende un ventilador al superar una temperatura configurable. Se usa **histéresis**, un margen entre encendido y apagado, para que el motor no arranque y pare sin cesar.' },
      { lab: { code: c`#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

const int SENSOR = A1, FAN = 9, SUBE = 7, BAJA = 8;
const float MARGEN = 1.0;
float objetivo = 25.0;
bool activo = false;
int antS = HIGH, antB = HIGH;

float leerTemp() {
  float v = analogRead(SENSOR) * 5.0 / 1023.0;
  return (v - 0.5) * 100.0;
}

void setup() {
  lcd.begin(16, 2);
  pinMode(FAN, OUTPUT);
  pinMode(SUBE, INPUT_PULLUP);
  pinMode(BAJA, INPUT_PULLUP);
}

void loop() {
  int s = digitalRead(SUBE), b = digitalRead(BAJA);
  if (antS == HIGH && s == LOW) objetivo += 0.5;
  if (antB == HIGH && b == LOW) objetivo -= 0.5;
  antS = s;
  antB = b;

  float t = leerTemp();
  if (t > objetivo + MARGEN) activo = true;
  if (t < objetivo - MARGEN) activo = false;
  digitalWrite(FAN, activo);

  lcd.setCursor(0, 0);
  lcd.print("T: ");
  lcd.print(t, 1);
  lcd.print("   ");
  lcd.setCursor(0, 1);
  lcd.print("Obj: ");
  lcd.print(objetivo, 1);
  lcd.print(activo ? " ON " : " OFF");
  delay(50);
}`, parts: [{ type: 'lcd' }, { type: 'tmp36', pin: 15, value: 153 }, { type: 'motor', pin: 9, label: 'Ventilador' }, { type: 'button', pin: 7, label: 'Subir' }, { type: 'button', pin: 8, label: 'Bajar' }] } },
      { h: 'Amplíalo' },
      { ul: ['Regula la velocidad del ventilador con PWM según la diferencia.', 'Guarda el objetivo en EEPROM para que sobreviva al apagado.', 'Cambia el TMP36 por un DHT11 para medir humedad.'] }
    ] },
    { id: 'memoria-juego', title: 'Proyecto: juego de reflejos', min: 15, goal: 'Crear un juego con estados, azar y tiempo.', blocks: [
      { p: 'Un LED se enciende tras una espera al azar: pulsa lo más rápido posible. El programa mide tu tiempo y guarda tu mejor marca. Si pulsas antes de tiempo, pierdes.' },
      { lab: { code: c`enum Estado { LISTO, ESPERANDO, MIDIENDO };
Estado estado = LISTO;

const int BOTON = 2, LED = 13, ZUMB = 8;
unsigned long tiempo = 0, espera = 0;
unsigned long mejor = 99999UL;
int anterior = HIGH;

void setup() {
  Serial.begin(9600);
  pinMode(BOTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  randomSeed(analogRead(A0));
  Serial.println("Pulsa para empezar");
}

void loop() {
  int ahora = digitalRead(BOTON);
  bool pulsado = anterior == HIGH && ahora == LOW;
  anterior = ahora;

  switch (estado) {
    case LISTO:
      digitalWrite(LED, LOW);
      if (pulsado) {
        espera = random(1000, 4000);
        tiempo = millis();
        estado = ESPERANDO;
        Serial.println("Atento...");
      }
      break;

    case ESPERANDO:
      if (pulsado) {
        Serial.println("¡Demasiado pronto!");
        tone(ZUMB, 200, 400);
        estado = LISTO;
      } else if (millis() - tiempo >= espera) {
        digitalWrite(LED, HIGH);
        tiempo = millis();
        estado = MIDIENDO;
      }
      break;

    case MIDIENDO:
      if (pulsado) {
        unsigned long r = millis() - tiempo;
        Serial.print("Tu tiempo: ");
        Serial.print(r);
        Serial.println(" ms");
        if (r < mejor) {
          mejor = r;
          Serial.println("¡Nuevo récord!");
          tone(ZUMB, 1200, 200);
        }
        estado = LISTO;
      }
      break;
  }
}`, parts: [{ type: 'button', pin: 2, label: 'PULSA' }, { type: 'led', pin: 13 }, { type: 'buzzer', pin: 8 }] } },
      { h: 'Amplíalo' },
      { ul: ['Añade un segundo jugador con otro botón.', 'Guarda el récord en EEPROM.', 'Muestra los resultados en una LCD.'] },
      { h: '¿Y ahora qué?' },
      { p: 'Ya dominas lo esencial. Tu siguiente paso: elige un problema real de tu casa o tu trabajo, y resuélvelo con Arduino. En **Guías** encontrarás los documentos para seguir profundizando.' }
    ] }
  ] });
})(typeof globalThis !== 'undefined' ? globalThis : this);

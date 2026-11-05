/* Diccionario de funciones. Cada ficha explica qué hace, sus datos, lo que devuelve, un ejemplo ejecutable y los errores típicos.
   Redacción propia en español a partir de la referencia oficial de Arduino (docs.arduino.cc/language-reference). */
(function (root) {
  const c = String.raw;
  const FN = [];
  const REF = 'https://docs.arduino.cc/language-reference/en/functions/';
  const add = (cat, sub, list) => list.forEach(e => FN.push({ cat, ...e, link: e.link === undefined && sub ? REF + sub + '/' + e.name + '/' : e.link }));
  const LANG = 'https://docs.arduino.cc/language-reference/';
  const loopEmpty = (s) => `void setup() {\n  Serial.begin(9600);\n${s}\n}\n\nvoid loop() {\n}`;

  add('Estructura del programa', null, [
    { name: 'setup', sig: 'void setup() { ... }', what: 'Se ejecuta una sola vez, al encender o reiniciar la placa. Aquí se prepara todo: modos de los pines, Serial, pantallas.', like: 'Es como preparar la mesa antes de cocinar: se hace una vez y ya.', ret: 'Nada.', params: [], link: LANG,
      ex: c`void setup() {
  Serial.begin(9600);
  Serial.println("Esto sale solo una vez");
}

void loop() {
}`, oops: ['Olvidarla: aunque esté vacía es obligatoria.', 'Escribir Setup con mayúscula: C++ lo considera otra función.'] },
    { name: 'loop', sig: 'void loop() { ... }', what: 'Se repite sin parar, miles de veces por segundo, mientras la placa tenga energía. Aquí vive el comportamiento del programa.', like: 'Es la rutina de un vigilante: mira, decide, actúa… y vuelve a empezar.', ret: 'Nada.', params: [], link: LANG,
      ex: c`int vueltas = 0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  vueltas++;
  Serial.println(vueltas);
  delay(500);
}`, oops: ['Declarar dentro de loop() una variable que debe recordar su valor: se reinicia en cada vuelta. Hazla global o static.'] }
  ]);

  add('E/S digital', 'digital-io', [
    { name: 'pinMode', sig: 'pinMode(pin, modo)', what: 'Le dice a un pin si va a escuchar (entrada) o a hablar (salida). Se usa casi siempre en setup().', like: 'Como decidir si una puerta es de entrada o de salida antes de abrir el local.', params: [['pin', 'Número del pin: 0–13 o A0–A5.'], ['modo', 'OUTPUT (salida), INPUT (entrada) o INPUT_PULLUP (entrada con resistencia interna hacia 5 V).']], ret: 'Nada.',
      ex: c`void setup() {
  pinMode(13, OUTPUT);
  digitalWrite(13, HIGH);
}

void loop() {
}`, parts: [{ type: 'led', pin: 13 }], oops: ['Olvidarlo en una salida: el LED apenas brilla.', 'Usar INPUT con un botón sin resistencia: el pin queda «al aire» y lee valores al azar.'] },
    { name: 'digitalWrite', link: REF + 'digital-io/digitalwrite/', sig: 'digitalWrite(pin, valor)', what: 'Pone un pin de salida en 5 V (HIGH) o 0 V (LOW). Es el interruptor de la placa.', like: 'Un interruptor de luz controlado por tu programa.', params: [['pin', 'Pin configurado como OUTPUT.'], ['valor', 'HIGH (5 V) o LOW (0 V).']], ret: 'Nada.',
      ex: c`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}`, parts: [{ type: 'led', pin: 13 }], oops: ['Faltar pinMode(pin, OUTPUT).', 'Conectar un motor directo: un pin soporta poca corriente (40 mA máximo absoluto; mejor quedarse en 20 mA).'] },
    { name: 'digitalRead', link: REF + 'digital-io/digitalread/', sig: 'digitalRead(pin)', what: 'Mira si en un pin hay voltaje alto o bajo. Sirve para botones, finales de carrera y sensores de sí/no.', like: 'Preguntar «¿hay luz en esa habitación?»: la respuesta solo puede ser sí o no.', params: [['pin', 'Pin a leer.']], ret: 'HIGH (1) o LOW (0).',
      ex: c`void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
}

void loop() {
  int estado = digitalRead(2);
  if (estado == LOW) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
}`, parts: [{ type: 'button', pin: 2 }, { type: 'led', pin: 13 }], oops: ['Con INPUT_PULLUP la lógica va al revés: pulsado = LOW.'] }
  ]);

  add('E/S analógica', 'analog-io', [
    { name: 'analogRead', sig: 'analogRead(pin)', what: 'Mide el voltaje de una entrada analógica y lo convierte en un número de 0 a 1023 (0 V a 5 V en el UNO).', like: 'Un termómetro de voltaje con 1024 marcas.', params: [['pin', 'A0 a A5.']], ret: 'int de 0 a 1023. Voltios = lectura × 5 / 1023.',
      ex: c`void setup() {
  Serial.begin(9600);
}

void loop() {
  int lectura = analogRead(A0);
  float voltios = lectura * 5.0 / 1023.0;
  Serial.println(voltios);
  delay(300);
}`, parts: [{ type: 'pot', pin: 14 }], oops: ['Leer un pin sin nada conectado: da ruido, no cero.', 'Superar 5 V en el pin: puede dañar la placa.'] },
    { name: 'analogWrite', sig: 'analogWrite(pin, valor)', what: 'Genera una señal PWM: enciende y apaga el pin muy rápido para simular un voltaje intermedio. Regula brillo de LEDs y velocidad de motores.', like: 'Abrir y cerrar un grifo muy rápido: lo que importa es el porcentaje de tiempo abierto.', params: [['pin', 'Pin con PWM. En el UNO: 3, 5, 6, 9, 10 y 11 (marcados con ~).'], ['valor', '0 (siempre apagado) a 255 (siempre encendido).']], ret: 'Nada.',
      ex: c`void setup() {
}

void loop() {
  for (int b = 0; b <= 255; b += 5) {
    analogWrite(9, b);
    delay(20);
  }
}`, parts: [{ type: 'led', pin: 9 }], oops: ['Usar un pin sin ~.', 'Confundirlo con los pines A0–A5: no tiene relación con ellos.', 'Pasar 1023: el máximo es 255. Divide entre 4 o usa map().'] },
    { name: 'analogReference', sig: 'analogReference(tipo)', what: 'Cambia el voltaje que corresponde a la lectura máxima de analogRead(). Permite medir señales pequeñas con más detalle.', params: [['tipo', 'DEFAULT (5 V en el UNO), INTERNAL (1,1 V) o EXTERNAL (el voltaje del pin AREF).']], ret: 'Nada.',
      ex: c`void setup() {
  analogReference(DEFAULT);
  Serial.begin(9600);
  Serial.println(analogRead(A0));
}

void loop() {
}`, parts: [{ type: 'pot', pin: 14 }], oops: ['Usar EXTERNAL sin nada en AREF, o aplicar más de 5 V a AREF.'] },
    { name: 'analogReadResolution', sig: 'analogReadResolution(bits)', noSim: true, what: 'Cambia los bits de lectura del ADC en placas que lo admiten, como el UNO R4 (10 por defecto, hasta 14). No existe en el UNO R3.', params: [['bits', 'Número de bits: 10, 12 o 14 en el UNO R4.']], ret: 'Nada.', ex: c`void setup() {
  analogReadResolution(14); // UNO R4: lecturas de 0 a 16383
}

void loop() {
}` },
    { name: 'analogWriteResolution', sig: 'analogWriteResolution(bits)', noSim: true, what: 'Cambia la resolución de analogWrite() en placas compatibles, como el UNO R4 (8 bits por defecto, hasta 12). No existe en el UNO R3.', params: [['bits', 'Número de bits.']], ret: 'Nada.', ex: c`void setup() {
  analogWriteResolution(12); // UNO R4: valores de 0 a 4095
}

void loop() {
}` }
  ]);

  add('E/S avanzada', 'advanced-io', [
    { name: 'tone', sig: 'tone(pin, frecuencia, duración)', what: 'Genera una onda cuadrada con la frecuencia indicada para hacer sonar un zumbador. No detiene el programa mientras suena.', like: 'Hacer vibrar una membrana: más hertzios, sonido más agudo.', params: [['pin', 'Pin del zumbador.'], ['frecuencia', 'Hertzios (mínimo 31).'], ['duración', 'Opcional: milisegundos. Sin ella suena hasta noTone().']], ret: 'Nada.',
      ex: c`void setup() {
}

void loop() {
  tone(8, 440, 200);
  delay(400);
  tone(8, 660, 200);
  delay(400);
}`, parts: [{ type: 'buzzer', pin: 8 }], oops: ['Interfiere con el PWM de los pines 3 y 11.', 'Solo hay un tono a la vez.', 'Olvidar el delay: como no bloquea, el siguiente tone() pisa al anterior.'] },
    { name: 'noTone', sig: 'noTone(pin)', what: 'Detiene el sonido iniciado por tone().', params: [['pin', 'Pin donde suena.']], ret: 'Nada.',
      ex: c`void setup() {
  tone(8, 440);
  delay(500);
  noTone(8);
}

void loop() {
}`, parts: [{ type: 'buzzer', pin: 8 }] },
    { name: 'pulseIn', sig: 'pulseIn(pin, valor, espera)', what: 'Mide cuántos microsegundos dura un pulso. Es la base del sensor ultrasónico HC-SR04.', like: 'Un cronómetro que arranca cuando el pin cambia y para cuando vuelve.', params: [['pin', 'Pin a medir.'], ['valor', 'HIGH o LOW: tipo de pulso.'], ['espera', 'Opcional: µs máximos de espera (por defecto, un segundo).']], ret: 'unsigned long: duración en µs, o 0 si no llegó ningún pulso.',
      ex: c`const int TRIG = 9, ECHO = 10;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
}

void loop() {
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH);
  Serial.println(us / 58);
  delay(300);
}`, parts: [{ type: 'sonar', trig: 9, echo: 10 }], oops: ['Detiene el programa mientras espera; pasa un tiempo de espera corto si tienes prisa.'] },
    { name: 'pulseInLong', sig: 'pulseInLong(pin, valor, espera)', what: 'Igual que pulseIn(), pero más apta para pulsos largos. Usa interrupciones, así que deben estar activadas.', params: [['pin', 'Pin a medir.'], ['valor', 'HIGH o LOW.'], ['espera', 'Opcional: µs máximos de espera.']], ret: 'unsigned long: duración en µs, o 0.',
      ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(pulseInLong(7, HIGH, 2000));
}

void loop() {
}` },
    { name: 'shiftOut', sig: 'shiftOut(datos, reloj, orden, valor)', what: 'Saca un byte, bit a bit, por un pin mientras marca el ritmo en otro. Se usa con registros como el 74HC595 para controlar 8 salidas con 3 pines.', like: 'Pasar 8 cubos por una cadena de personas, uno a uno.', params: [['datos', 'Pin de datos.'], ['reloj', 'Pin de reloj.'], ['orden', 'MSBFIRST (primero el bit más alto) o LSBFIRST.'], ['valor', 'byte a enviar.']], ret: 'Nada.',
      ex: c`const int DATA = 11, CLK = 12, LATCH = 8;

void setup() {
  pinMode(DATA, OUTPUT);
  pinMode(CLK, OUTPUT);
  pinMode(LATCH, OUTPUT);
}

void loop() {
  for (int i = 0; i < 8; i++) {
    digitalWrite(LATCH, LOW);
    shiftOut(DATA, CLK, MSBFIRST, 1 << i);
    digitalWrite(LATCH, HIGH);
    delay(200);
  }
}`, parts: [{ type: 'sr595', data: 11, clock: 12, latch: 8 }], oops: ['Olvidar el pulso de LATCH: los datos entran pero no se muestran.'] },
    { name: 'shiftIn', sig: 'shiftIn(datos, reloj, orden)', what: 'Lee un byte bit a bit desde otro chip, como un registro 74HC165. En el simulador siempre devuelve 0.', params: [['datos', 'Pin de datos.'], ['reloj', 'Pin de reloj.'], ['orden', 'MSBFIRST o LSBFIRST.']], ret: 'byte leído.',
      ex: c`void setup() {
  Serial.begin(9600);
  pinMode(4, INPUT);
  pinMode(5, OUTPUT);
  Serial.println(shiftIn(4, 5, MSBFIRST));
}

void loop() {
}` }
  ]);

  add('Tiempo', 'time', [
    { name: 'delay', sig: 'delay(ms)', what: 'Detiene el programa durante los milisegundos indicados. Mientras tanto no lee botones ni sensores.', like: 'Quedarte dormido con la alarma puesta: no te enteras de nada hasta que suena.', params: [['ms', 'Milisegundos (1000 ms = 1 s).']], ret: 'Nada.',
      ex: c`void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println("Tic");
  delay(1000);
}`, oops: ['Abusar de él: un delay(5000) hace que los botones no respondan durante 5 s. Usa millis().', 'Usarlo dentro de una interrupción: no funciona.'] },
    { name: 'delayMicroseconds', sig: 'delayMicroseconds(us)', what: 'Pausa muy corta en microsegundos. Es útil para protocolos con tiempos exactos, como el pulso del HC-SR04.', params: [['us', 'Microsegundos. Es preciso hasta unos 16383.']], ret: 'Nada.',
      ex: c`void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  digitalWrite(9, HIGH);
  delayMicroseconds(10);
  digitalWrite(9, LOW);
  delay(100);
}`, parts: [{ type: 'led', pin: 9 }] },
    { name: 'millis', sig: 'millis()', what: 'Devuelve los milisegundos transcurridos desde que arrancó la placa. Es la llave de la multitarea: permite medir tiempo sin detener el programa. Vuelve a cero tras unos 50 días.', like: 'Mirar el reloj de vez en cuando en lugar de quedarte dormido.', params: [], ret: 'unsigned long con los milisegundos.',
      ex: c`unsigned long antes = 0;
int estado = LOW;

void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  if (millis() - antes >= 500) {
    antes = millis();
    estado = !estado;
    digitalWrite(13, estado);
  }
}`, parts: [{ type: 'led', pin: 13 }], oops: ['Guardarlo en un int: se desborda a los 32 segundos. Usa unsigned long.', 'Comparar con millis() > antes + 500. La resta millis() - antes sigue funcionando cuando el contador da la vuelta.'] },
    { name: 'micros', sig: 'micros()', what: 'Como millis(), pero en microsegundos. En el UNO a 16 MHz avanza de 4 en 4. Da la vuelta tras unos 70 minutos.', params: [], ret: 'unsigned long con los microsegundos.',
      ex: c`void setup() {
  Serial.begin(9600);
  unsigned long a = micros();
  delay(1);
  Serial.println(micros() - a);
}

void loop() {
}` }
  ]);

  add('Matemáticas', 'math', [
    { name: 'map', sig: 'map(x, deMin, deMax, aMin, aMax)', what: 'Convierte un número de una escala a otra con una regla de tres. Solo trabaja con enteros: descarta decimales.', like: 'Convertir una nota de 0–1023 a una escala de 0–255.', params: [['x', 'Valor a convertir.'], ['deMin, deMax', 'Rango original.'], ['aMin, aMax', 'Rango deseado (puede ir al revés).']], ret: 'long con el valor convertido. No limita: usa constrain() si x puede salirse.',
      ex: c`void setup() {
}

void loop() {
  int lectura = analogRead(A0);
  int brillo = map(lectura, 0, 1023, 0, 255);
  analogWrite(9, brillo);
}`, parts: [{ type: 'pot', pin: 14 }, { type: 'led', pin: 9 }], oops: ['Esperar decimales: devuelve enteros.'] },
    { name: 'constrain', sig: 'constrain(x, min, max)', what: 'Mantiene un número dentro de unos límites.', like: 'Un topo de puerta: no deja pasar de cierto punto.', params: [['x', 'Valor.'], ['min', 'Límite inferior.'], ['max', 'Límite superior.']], ret: 'x, o el límite que se haya pasado.',
      ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(constrain(300, 0, 255));
  Serial.println(constrain(-5, 0, 255));
  Serial.println(constrain(100, 0, 255));
}

void loop() {
}` },
    { name: 'abs', sig: 'abs(x)', what: 'Valor absoluto: quita el signo.', params: [['x', 'Número.']], ret: 'x si es positivo; -x si es negativo.',
      ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(abs(-7));
}

void loop() {
}`, oops: ['No pongas operaciones dentro, como abs(a++): por cómo está implementada, puede dar resultados incorrectos.'] },
    { name: 'max', sig: 'max(a, b)', what: 'Devuelve el mayor de dos números.', params: [['a, b', 'Números a comparar.']], ret: 'El mayor.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(max(3, 8));
}

void loop() {
}` },
    { name: 'min', sig: 'min(a, b)', what: 'Devuelve el menor de dos números.', params: [['a, b', 'Números a comparar.']], ret: 'El menor.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(min(3, 8));
}

void loop() {
}` },
    { name: 'pow', sig: 'pow(base, exponente)', what: 'Calcula una potencia.', params: [['base', 'Número.'], ['exponente', 'Potencia.']], ret: 'double con el resultado.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(pow(2, 10));
}

void loop() {
}` },
    { name: 'sq', sig: 'sq(x)', what: 'Calcula x al cuadrado.', params: [['x', 'Número.']], ret: 'x × x.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(sq(9));
}

void loop() {
}` },
    { name: 'sqrt', sig: 'sqrt(x)', what: 'Calcula la raíz cuadrada.', params: [['x', 'Número.']], ret: 'double con la raíz.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(sqrt(2));
}

void loop() {
}` }
  ]);

  const trig = (name, label) => ({ name, sig: name + '(radianes)', what: 'Calcula el ' + label + ' de un ángulo en radianes.', params: [['radianes', 'Ángulo. Grados × PI / 180.']], ret: 'double.', ex: `void setup() {\n  Serial.begin(9600);\n  Serial.println(${name}(PI / 4));\n}\n\nvoid loop() {\n}` });
  add('Trigonometría', 'trigonometry', [trig('sin', 'seno'), trig('cos', 'coseno'), trig('tan', 'tangente')]);

  const chr = (name, what, ch) => ({ name, sig: name + '(c)', what, params: [['c', 'El carácter a examinar.']], ret: 'true o false.', ex: `void setup() {\n  Serial.begin(9600);\n  Serial.println(${name}('${ch}'));\n}\n\nvoid loop() {\n}` });
  add('Caracteres', 'characters', [
    chr('isAlpha', 'Indica si es una letra.', 'a'), chr('isAlphaNumeric', 'Indica si es letra o número.', '7'), chr('isAscii', 'Indica si es un carácter ASCII (código menor que 128).', 'a'),
    chr('isControl', 'Indica si es un carácter de control, como el salto de línea.', 'a'), chr('isDigit', 'Indica si es un dígito del 0 al 9.', '7'), chr('isGraph', 'Indica si es imprimible y no es un espacio.', 'a'),
    chr('isHexadecimalDigit', 'Indica si es un dígito hexadecimal (0–9, A–F).', 'F'), chr('isLowerCase', 'Indica si es una minúscula.', 'a'), chr('isPrintable', 'Indica si se puede imprimir (incluye el espacio).', 'a'),
    chr('isPunct', 'Indica si es un signo de puntuación.', '.'), chr('isSpace', 'Indica si es espacio, tabulador o salto de línea.', ' '), chr('isUpperCase', 'Indica si es una mayúscula.', 'A'), chr('isWhitespace', 'Indica si es un espacio o un tabulador.', ' ')
  ]);

  add('Números aleatorios', 'random-numbers', [
    { name: 'random', sig: 'random(max)  ·  random(min, max)', what: 'Genera un número pseudoaleatorio. El máximo nunca sale: random(1, 7) es un dado de 1 a 6.', params: [['min', 'Opcional: mínimo incluido.'], ['max', 'Máximo excluido.']], ret: 'long.', ex: c`void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println(random(1, 7));
  delay(500);
}`, oops: ['Olvidar randomSeed(): la secuencia se repite igual tras cada reinicio.'] },
    { name: 'randomSeed', sig: 'randomSeed(semilla)', what: 'Elige el punto de partida de la secuencia. Con una lectura de un pin al aire cada arranque es distinto.', params: [['semilla', 'Número; típicamente analogRead(A0) sin nada conectado.']], ret: 'Nada.', ex: c`void setup() {
  Serial.begin(9600);
  randomSeed(analogRead(A0));
  Serial.println(random(100));
}

void loop() {
}` }
  ]);

  const bitEx = (b) => `void setup() {\n  Serial.begin(9600);\n  byte x = 0b00000101;\n${b}\n}\n\nvoid loop() {\n}`;
  add('Bits y bytes', 'bits-and-bytes', [
    { name: 'bit', sig: 'bit(n)', what: 'Devuelve el valor del bit n: bit(3) es 8.', params: [['n', 'Posición del bit; 0 es el de la derecha.']], ret: 'El valor (2 elevado a n).', ex: bitEx('  Serial.println(bit(3));') },
    { name: 'bitRead', sig: 'bitRead(x, n)', what: 'Lee un bit de un número.', params: [['x', 'Número.'], ['n', 'Posición.']], ret: '0 o 1.', ex: bitEx('  Serial.println(bitRead(x, 2));') },
    { name: 'bitSet', sig: 'bitSet(x, n)', what: 'Pone a 1 un bit de una variable.', params: [['x', 'Variable.'], ['n', 'Posición.']], ret: 'x modificada.', ex: bitEx('  bitSet(x, 1);\n  Serial.println(x, BIN);') },
    { name: 'bitClear', sig: 'bitClear(x, n)', what: 'Pone a 0 un bit de una variable.', params: [['x', 'Variable.'], ['n', 'Posición.']], ret: 'x modificada.', ex: bitEx('  bitClear(x, 0);\n  Serial.println(x, BIN);') },
    { name: 'bitWrite', sig: 'bitWrite(x, n, b)', what: 'Escribe un 0 o un 1 en un bit.', params: [['x', 'Variable.'], ['n', 'Posición.'], ['b', '0 o 1.']], ret: 'x modificada.', ex: bitEx('  bitWrite(x, 7, 1);\n  Serial.println(x, BIN);') },
    { name: 'highByte', sig: 'highByte(x)', what: 'Saca el byte alto de un número de 2 bytes. Muy útil al enviar enteros byte a byte.', params: [['x', 'Número.']], ret: 'byte.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(highByte(0x1234), HEX);
}

void loop() {
}` },
    { name: 'lowByte', sig: 'lowByte(x)', what: 'Saca el byte bajo de un número.', params: [['x', 'Número.']], ret: 'byte.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(lowByte(0x1234), HEX);
}

void loop() {
}` }
  ]);

  add('Interrupciones', 'external-interrupts', [
    { name: 'attachInterrupt', sig: 'attachInterrupt(digitalPinToInterrupt(pin), funcion, modo)', what: 'Hace que una función se ejecute al instante cuando cambia un pin, interrumpiendo lo que esté haciendo el programa. En el UNO funciona en los pines 2 y 3.', like: 'Un timbre: no hace falta vigilar la puerta; cuando suena, atiendes y vuelves a lo tuyo.', params: [['pin', '2 o 3 en el UNO.'], ['funcion', 'Función sin parámetros ni retorno (ISR), sin paréntesis.'], ['modo', 'LOW, CHANGE, RISING (de bajo a alto) o FALLING (de alto a bajo).']], ret: 'Nada.',
      ex: c`volatile int pulsos = 0;

void contar() {
  pulsos++;
}

void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(2), contar, FALLING);
}

void loop() {
  Serial.println(pulsos);
  delay(500);
}`, parts: [{ type: 'button', pin: 2 }], oops: ['No usar volatile en la variable compartida.', 'Poner delay() o Serial dentro de la ISR. Debe ser corta y rápida.', 'Escribir contar() con paréntesis: la llamarías en vez de pasarla.'] },
    { name: 'detachInterrupt', sig: 'detachInterrupt(digitalPinToInterrupt(pin))', what: 'Desactiva la interrupción de un pin.', params: [['pin', '2 o 3 en el UNO.']], ret: 'Nada.', ex: c`void f() {
}

void setup() {
  attachInterrupt(digitalPinToInterrupt(2), f, RISING);
  detachInterrupt(digitalPinToInterrupt(2));
}

void loop() {
}` },
    { name: 'digitalPinToInterrupt', sig: 'digitalPinToInterrupt(pin)', what: 'Traduce un número de pin al número de interrupción. Hace tu código portable entre placas.', params: [['pin', 'Pin.']], ret: 'Número de interrupción, o -1 si el pin no la admite.', ex: c`void setup() {
  Serial.begin(9600);
  Serial.println(digitalPinToInterrupt(3));
}

void loop() {
}` }
  ]);
  add('Interrupciones', 'interrupts', [
    { name: 'noInterrupts', sig: 'noInterrupts()', what: 'Desactiva las interrupciones durante un tramo crítico, como copiar una variable que modifica una ISR.', params: [], ret: 'Nada.', ex: c`volatile int n = 0;
int copia = 0;

void setup() {
}

void loop() {
  noInterrupts();
  copia = n;
  interrupts();
}` },
    { name: 'interrupts', sig: 'interrupts()', what: 'Vuelve a activar las interrupciones.', params: [], ret: 'Nada.', ex: c`void setup() {
  noInterrupts();
  interrupts();
}

void loop() {
}` }
  ]);

  const SER = 'https://docs.arduino.cc/language-reference/en/functions/communication/serial/';
  const S = (name, sig, what, params, ret, ex, oops) => ({ name: 'Serial.' + name, sig, what, params, ret, ex, oops, link: SER + name + '/' });
  add('Comunicación Serial', null, [
    S('begin', 'Serial.begin(velocidad)', 'Abre el canal de comunicación con el ordenador a la velocidad dada. Los pines 0 y 1 quedan ocupados.', [['velocidad', 'Baudios; lo habitual es 9600 o 115200. El monitor serie debe usar la misma.']], 'Nada.', loopEmpty('  Serial.println("Listo");'), ['Velocidad distinta en el monitor: verás símbolos raros.']),
    S('print', 'Serial.print(dato, formato)', 'Envía un dato como texto, sin saltar de línea.', [['dato', 'Número, texto o carácter.'], ['formato', 'Opcional: DEC, HEX, OCT, BIN, o decimales para un float.']], 'Número de bytes enviados.', loopEmpty('  Serial.print("Valor: ");\n  Serial.print(255, HEX);')),
    S('println', 'Serial.println(dato, formato)', 'Como print(), pero salta de línea al final. Es tu mejor herramienta de depuración.', [['dato', 'Opcional: número, texto o carácter.'], ['formato', 'Opcional.']], 'Número de bytes enviados.', loopEmpty('  Serial.println("Hola");\n  Serial.println(3.14159, 3);')),
    S('available', 'Serial.available()', 'Dice cuántos bytes han llegado y esperan a ser leídos.', [], 'int: bytes en espera (el búfer guarda hasta 64).', c`void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    Serial.println("Ha llegado algo");
    Serial.read();
  }
}`),
    S('read', 'Serial.read()', 'Saca el primer byte del búfer de llegada.', [], 'int: el byte, o -1 si no hay datos.', c`void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    Serial.print("Recibí: ");
    Serial.println(c);
  }
}`, ['Leer sin comprobar available(): devuelve -1.']),
    S('peek', 'Serial.peek()', 'Mira el siguiente byte sin sacarlo.', [], 'int: el byte, o -1.', loopEmpty('  Serial.println(Serial.peek());')),
    S('write', 'Serial.write(dato)', 'Envía bytes en bruto, sin convertirlos a texto: write(65) envía la letra A; print(65) envía «65».', [['dato', 'Byte o texto.']], 'Bytes enviados.', loopEmpty('  Serial.write(65);')),
    S('flush', 'Serial.flush()', 'Espera a que termine de enviarse todo lo pendiente. No vacía lo recibido.', [], 'Nada.', loopEmpty('  Serial.println("Hola");\n  Serial.flush();')),
    S('parseInt', 'Serial.parseInt()', 'Busca el siguiente número entero en lo recibido. Si no llega, espera hasta agotar el tiempo (1 s por defecto).', [], 'long: el número, o 0 si no hubo.', c`void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    long n = Serial.parseInt();
    Serial.println(n * 2);
  }
}`),
    S('parseFloat', 'Serial.parseFloat()', 'Busca el siguiente número con decimales.', [], 'float.', c`void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    Serial.println(Serial.parseFloat());
  }
}`),
    S('readString', 'Serial.readString()', 'Lee todo lo recibido hasta que pasa el tiempo de espera.', [], 'String.', c`void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    Serial.println(Serial.readString());
  }
}`, ['Es lenta: espera a que se agote el tiempo. Mejor readStringUntil(\'\\n\').']),
    S('readStringUntil', "Serial.readStringUntil(fin)", 'Lee hasta encontrar el carácter final. Es la forma cómoda de recibir comandos por líneas.', [['fin', "Carácter final, normalmente '\\n'."]], 'String sin el carácter final.', c`void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    Serial.println(cmd);
  }
}`),
    S('setTimeout', 'Serial.setTimeout(ms)', 'Cambia cuánto esperan parseInt(), readString() y similares.', [['ms', 'Milisegundos; 1000 por defecto.']], 'Nada.', loopEmpty('  Serial.setTimeout(100);'))
  ]);

  add('Texto (String)', null, [
    ['length', 's.length()', 'Número de caracteres.', [], 'int.', 'String s = "Hola";\n  Serial.println(s.length());'],
    ['charAt', 's.charAt(i)', 'Carácter en la posición i (empieza en 0).', [['i', 'Posición.']], 'char.', 'String s = "Hola";\n  Serial.println(s.charAt(1));'],
    ['substring', 's.substring(desde, hasta)', 'Trozo del texto; hasta no se incluye.', [['desde', 'Inicio.'], ['hasta', 'Opcional: fin.']], 'String.', 'String s = "temp=24";\n  Serial.println(s.substring(5));'],
    ['indexOf', 's.indexOf(buscado)', 'Busca un carácter o texto.', [['buscado', 'Lo que se busca.']], 'int: posición, o -1 si no está.', "String s = \"temp=24\";\n  Serial.println(s.indexOf('='));"],
    ['toInt', 's.toInt()', 'Convierte el texto en entero.', [], 'long; 0 si no es un número.', 'String s = "42";\n  Serial.println(s.toInt() + 1);'],
    ['toFloat', 's.toFloat()', 'Convierte el texto en decimal.', [], 'float.', 'String s = "3.5";\n  Serial.println(s.toFloat() * 2);'],
    ['trim', 's.trim()', 'Quita espacios y saltos de línea de los extremos. Modifica s.', [], 'Nada.', 'String s = "  hola\\n";\n  s.trim();\n  Serial.println(s);'],
    ['toUpperCase', 's.toUpperCase()', 'Convierte a mayúsculas. Modifica s.', [], 'Nada.', 'String s = "hola";\n  s.toUpperCase();\n  Serial.println(s);'],
    ['toLowerCase', 's.toLowerCase()', 'Convierte a minúsculas. Modifica s.', [], 'Nada.', 'String s = "HOLA";\n  s.toLowerCase();\n  Serial.println(s);'],
    ['equals', 's.equals(otro)', 'Compara dos textos; también puedes usar ==.', [['otro', 'Texto.']], 'true o false.', 'String s = "on";\n  Serial.println(s.equals("on"));'],
    ['startsWith', 's.startsWith(texto)', 'Indica si empieza por ese texto.', [['texto', 'Texto.']], 'true o false.', 'String s = "led:on";\n  Serial.println(s.startsWith("led"));'],
    ['replace', 's.replace(a, b)', 'Cambia todas las apariciones de a por b. Modifica s.', [['a', 'Texto buscado.'], ['b', 'Sustituto.']], 'Nada.', 'String s = "1,5";\n  s.replace(",", ".");\n  Serial.println(s);']
  ].map(([n, sig, what, params, ret, b]) => ({ name: 'String.' + n, sig, what, params, ret, ex: loopEmpty('  ' + b), link: 'https://docs.arduino.cc/language-reference/en/variables/data-types/stringObject/' })));

  const LIB = (u) => 'https://docs.arduino.cc/libraries/' + u + '/';
  const servoEx = (b) => `#include <Servo.h>\n\nServo brazo;\n\nvoid setup() {\n  brazo.attach(9);\n${b}\n}\n\nvoid loop() {\n}`;
  const lcdEx = (b) => `#include <LiquidCrystal.h>\n\nLiquidCrystal lcd(12, 11, 5, 4, 3, 2);\n\nvoid setup() {\n  lcd.begin(16, 2);\n${b}\n}\n\nvoid loop() {\n}`;
  add('Librería Servo', null, [
    { name: 'servo.attach', sig: 'servo.attach(pin)', what: 'Conecta el objeto Servo a un pin. Cualquier pin digital vale, pero usar la librería desactiva el PWM en los pines 9 y 10 (en placas que no son Mega).', params: [['pin', 'Pin de señal.']], ret: 'Canal asignado.', ex: servoEx('  brazo.write(90);'), parts: [{ type: 'servo', pin: 9 }], link: LIB('servo'), oops: ['Alimentar varios servos desde el pin 5 V: mejor con una fuente aparte y GND común.'] },
    { name: 'servo.write', sig: 'servo.write(ángulo)', what: 'Mueve el eje al ángulo indicado.', params: [['ángulo', '0 a 180 grados.']], ret: 'Nada.', ex: servoEx('  brazo.write(45);'), parts: [{ type: 'servo', pin: 9 }], link: LIB('servo') },
    { name: 'servo.read', sig: 'servo.read()', what: 'Devuelve el último ángulo que le pediste. No mide la posición real.', params: [], ret: 'int de 0 a 180.', ex: servoEx('  brazo.write(30);\n  Serial.begin(9600);\n  Serial.println(brazo.read());'), parts: [{ type: 'servo', pin: 9 }], link: LIB('servo') },
    { name: 'servo.detach', sig: 'servo.detach()', what: 'Libera el pin. El servo deja de sujetar su posición.', params: [], ret: 'Nada.', ex: servoEx('  brazo.detach();'), parts: [{ type: 'servo', pin: 9 }], link: LIB('servo') }
  ]);
  add('Pantalla LCD', null, [
    { name: 'lcd.begin', sig: 'lcd.begin(columnas, filas)', what: 'Inicia la pantalla con su tamaño.', params: [['columnas', 'Normalmente 16.'], ['filas', 'Normalmente 2.']], ret: 'Nada.', ex: lcdEx('  lcd.print("Hola");'), parts: [{ type: 'lcd' }], link: LIB('liquidcrystal') },
    { name: 'lcd.print', sig: 'lcd.print(dato)', what: 'Escribe texto o números donde esté el cursor.', params: [['dato', 'Texto o número.']], ret: 'Bytes escritos.', ex: lcdEx('  lcd.print("Temp: ");\n  lcd.print(24);'), parts: [{ type: 'lcd' }], link: LIB('liquidcrystal'), oops: ['Un número más corto que el anterior deja restos: escribe espacios o borra antes.'] },
    { name: 'lcd.setCursor', sig: 'lcd.setCursor(col, fila)', what: 'Coloca el cursor. Se cuenta desde 0.', params: [['col', '0 a 15.'], ['fila', '0 o 1.']], ret: 'Nada.', ex: lcdEx('  lcd.setCursor(3, 1);\n  lcd.print("abajo");'), parts: [{ type: 'lcd' }], link: LIB('liquidcrystal') },
    { name: 'lcd.clear', sig: 'lcd.clear()', what: 'Borra la pantalla y lleva el cursor a 0,0. Es lenta: no la llames en cada vuelta de loop().', params: [], ret: 'Nada.', ex: lcdEx('  lcd.print("adios");\n  lcd.clear();'), parts: [{ type: 'lcd' }], link: LIB('liquidcrystal') }
  ]);
  add('EEPROM (memoria permanente)', null, [
    { name: 'EEPROM.write', sig: 'EEPROM.write(dirección, valor)', what: 'Guarda un byte que sobrevive al apagado. El UNO R3 tiene 1 KB. Cada escritura tarda unos 3,3 ms y cada celda aguanta unas 100 000.', params: [['dirección', '0 a 1023.'], ['valor', '0 a 255.']], ret: 'Nada.', ex: c`#include <EEPROM.h>

void setup() {
  EEPROM.write(0, 42);
}

void loop() {
}`, link: 'https://docs.arduino.cc/learn/programming/eeprom-guide/', oops: ['Escribir en loop() sin control: desgastas la celda. Usa update().'] },
    { name: 'EEPROM.read', sig: 'EEPROM.read(dirección)', what: 'Lee un byte guardado. Una celda nunca escrita suele valer 255.', params: [['dirección', '0 a 1023.']], ret: 'byte.', ex: c`#include <EEPROM.h>

void setup() {
  Serial.begin(9600);
  EEPROM.write(0, 42);
  Serial.println(EEPROM.read(0));
}

void loop() {
}`, link: 'https://docs.arduino.cc/learn/programming/eeprom-guide/' },
    { name: 'EEPROM.update', sig: 'EEPROM.update(dirección, valor)', what: 'Escribe solo si el valor cambió. Alarga la vida de la memoria.', params: [['dirección', '0 a 1023.'], ['valor', '0 a 255.']], ret: 'Nada.', ex: c`#include <EEPROM.h>

void setup() {
  EEPROM.update(0, 42);
}

void loop() {
}`, link: 'https://docs.arduino.cc/learn/programming/eeprom-guide/' }
  ]);
  const W = 'https://docs.arduino.cc/language-reference/en/functions/communication/wire/';
  add('I2C (Wire)', null, [
    { name: 'Wire.begin', sig: 'Wire.begin()', what: 'Une el Arduino al bus I2C como controlador. En el UNO: SDA = A4, SCL = A5.', params: [], ret: 'Nada.', ex: c`#include <Wire.h>

void setup() {
  Wire.begin();
}

void loop() {
}`, link: W },
    { name: 'Wire.beginTransmission', sig: 'Wire.beginTransmission(dirección)', what: 'Empieza un mensaje para el dispositivo con esa dirección.', params: [['dirección', 'Dirección de 7 bits, como 0x27.']], ret: 'Nada.', ex: c`#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Wire.beginTransmission(0x27);
  byte r = Wire.endTransmission();
  Serial.println(r == 0 ? "Encontrado" : "No responde");
}

void loop() {
}`, link: W },
    { name: 'Wire.write', sig: 'Wire.write(dato)', what: 'Añade datos al mensaje en curso.', params: [['dato', 'Byte a enviar.']], ret: 'Bytes añadidos.', ex: c`#include <Wire.h>

void setup() {
  Wire.begin();
  Wire.beginTransmission(0x27);
  Wire.write(1);
  Wire.endTransmission();
}

void loop() {
}`, link: W },
    { name: 'Wire.endTransmission', sig: 'Wire.endTransmission()', what: 'Envía el mensaje y devuelve el resultado.', params: [], ret: '0 si fue bien; 2 si la dirección no responde.', ex: c`#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Wire.beginTransmission(0x10);
  Serial.println(Wire.endTransmission());
}

void loop() {
}`, link: W },
    { name: 'Wire.requestFrom', sig: 'Wire.requestFrom(dirección, cantidad)', what: 'Pide datos a un dispositivo. En el simulador no hay datos reales.', params: [['dirección', 'Dispositivo.'], ['cantidad', 'Bytes pedidos.']], ret: 'Bytes recibidos.', ex: c`#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Serial.println(Wire.requestFrom(0x27, 1));
}

void loop() {
}`, link: W }
  ]);
  add('SPI', null, [
    { name: 'SPI.begin', sig: 'SPI.begin()', what: 'Inicia el bus SPI. En el UNO: 11 MOSI, 12 MISO, 13 SCK y 10 SS.', params: [], ret: 'Nada.', ex: c`#include <SPI.h>

void setup() {
  SPI.begin();
}

void loop() {
}`, link: 'https://docs.arduino.cc/learn/communication/spi/' },
    { name: 'SPI.transfer', sig: 'SPI.transfer(byte)', what: 'Envía un byte y recibe otro a la vez. En el simulador lo recibido es siempre 0.', params: [['byte', 'Dato a enviar.']], ret: 'byte recibido.', ex: c`#include <SPI.h>

void setup() {
  SPI.begin();
  pinMode(10, OUTPUT);
  digitalWrite(10, LOW);
  SPI.transfer(0x42);
  digitalWrite(10, HIGH);
}

void loop() {
}`, link: 'https://docs.arduino.cc/learn/communication/spi/' }
  ]);

  const kw = (name, sig, what, ex, oops, like) => ({ name, sig, what, params: [], ret: '—', ex, oops, like, keyword: true, link: LANG });
  const inSetup = (b) => `void setup() {\n  Serial.begin(9600);\n${b}\n}\n\nvoid loop() {\n}`;
  add('Palabras clave del lenguaje', null, [
    kw('if', 'if (condición) { ... } else { ... }', 'Decide: ejecuta un bloque solo si la condición es verdadera. else indica qué hacer si no lo es.', inSetup('  int t = 30;\n  if (t > 25) {\n    Serial.println("Calor");\n  } else {\n    Serial.println("Fresco");\n  }'), ['Escribir = en vez de ==.', 'Poner ; después del paréntesis.'], 'Si llueve, coges paraguas; si no, gafas de sol.'),
    kw('for', 'for (inicio; condición; paso) { ... }', 'Repite un bloque un número conocido de veces.', inSetup('  for (int i = 0; i < 3; i++) {\n    Serial.println(i);\n  }'), ['Pasarte con <= en un array: a[3] no existe si tiene 3 elementos.'], 'Haz 10 flexiones: cuentas y paras.'),
    kw('while', 'while (condición) { ... }', 'Repite mientras la condición sea verdadera. Se usa cuando no sabes cuántas vueltas harán falta.', inSetup('  int n = 3;\n  while (n > 0) {\n    Serial.println(n);\n    n--;\n  }'), ['Si nada cambia la condición, el bucle no termina.']),
    kw('do', 'do { ... } while (condición);', 'Como while, pero el bloque se ejecuta al menos una vez.', inSetup('  int n = 0;\n  do {\n    Serial.println(n);\n    n++;\n  } while (n < 2);')),
    kw('switch', 'switch (valor) { case 1: ... break; default: ... }', 'Elige entre muchos caminos según un valor. Es la base de las máquinas de estados.', inSetup('  int modo = 2;\n  switch (modo) {\n    case 1:\n      Serial.println("Uno");\n      break;\n    case 2:\n      Serial.println("Dos");\n      break;\n    default:\n      Serial.println("Otro");\n  }'), ['Olvidar break: la ejecución sigue en el siguiente case.']),
    kw('break', 'break;', 'Sale inmediatamente del bucle o del switch actual.', inSetup('  for (int i = 0; i < 10; i++) {\n    if (i == 2) break;\n    Serial.println(i);\n  }')),
    kw('continue', 'continue;', 'Salta a la siguiente vuelta del bucle.', inSetup('  for (int i = 0; i < 4; i++) {\n    if (i == 2) continue;\n    Serial.println(i);\n  }')),
    kw('return', 'return valor;', 'Termina la función y entrega un resultado a quien la llamó.', `int doble(int x) {\n  return x * 2;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  Serial.println(doble(21));\n}\n\nvoid loop() {\n}`),
    kw('const', 'const int NOMBRE = valor;', 'Declara un valor que no puede cambiar. Es lo preferido para los números de pin.', `const int LED = 13;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n}`),
    kw('static', 'static int x = 0;', 'Una variable local que recuerda su valor entre llamadas.', `void contar() {\n  static int n = 0;\n  n++;\n  Serial.println(n);\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  contar();\n  contar();\n}\n\nvoid loop() {\n}`),
    kw('volatile', 'volatile int x;', 'Avisa al compilador de que la variable puede cambiar en una interrupción, para que no la optimice.', `volatile bool aviso = false;\n\nvoid f() {\n  aviso = true;\n}\n\nvoid setup() {\n  attachInterrupt(digitalPinToInterrupt(2), f, RISING);\n}\n\nvoid loop() {\n}`),
    kw('sizeof', 'sizeof(x)', 'Devuelve cuántos bytes ocupa algo. El tamaño de un array se calcula con sizeof(a) / sizeof(a[0]).', inSetup('  int a[5];\n  Serial.println(sizeof(a));\n  Serial.println(sizeof(a) / sizeof(a[0]));')),
    kw('#define', '#define NOMBRE valor', 'Sustituye un nombre por un valor antes de compilar. Sin ; ni =. Normalmente es mejor const.', `#define LED 13\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n}`),
    kw('#include', '#include <Libreria.h>', 'Añade una librería a tu programa.', `#include <Servo.h>\n\nServo s;\n\nvoid setup() {\n}\n\nvoid loop() {\n}`),
    kw('F', 'F("texto")', 'Guarda un texto fijo en la memoria Flash en lugar de en la SRAM. Ahorra memoria.', inSetup('  Serial.println(F("Texto en la Flash"));'))
  ]);

  const ty = (name, what, rng, ex) => ({ name, sig: name, what, range: rng, params: [], ret: '—', ex: inSetup(ex), keyword: true, isType: true, link: LANG });
  add('Tipos de datos (UNO R3)', null, [
    ty('bool', 'Verdadero o falso.', 'true / false — 1 byte', '  bool listo = true;\n  Serial.println(listo);'),
    ty('char', 'Un carácter o número pequeño.', '-128 a 127 — 1 byte', "  char letra = 'A';\n  Serial.println(letra);"),
    ty('byte', 'Número pequeño sin signo.', '0 a 255 — 1 byte', '  byte b = 200;\n  Serial.println(b);'),
    ty('int', 'El entero habitual. ¡Ojo! En el UNO R3 solo llega a 32767.', '-32768 a 32767 — 2 bytes', '  int a = 32767;\n  a = a + 1;\n  Serial.println(a);'),
    ty('unsigned int', 'Entero sin signo de 2 bytes.', '0 a 65535 — 2 bytes', '  unsigned int a = 40000;\n  Serial.println(a);'),
    ty('long', 'Entero grande.', '-2147483648 a 2147483647 — 4 bytes', '  long a = 100000L;\n  Serial.println(a);'),
    ty('unsigned long', 'Entero grande sin signo; es el tipo de millis().', '0 a 4294967295 — 4 bytes', '  unsigned long t = millis();\n  Serial.println(t);'),
    ty('float', 'Número con decimales. Precisión de unas 6–7 cifras. Más lento que los enteros.', '±3,4 × 10³⁸ — 4 bytes', '  float v = 3.3;\n  Serial.println(v * 2);'),
    ty('double', 'En el UNO R3 es igual que float. En placas de 32 bits puede ser más preciso.', '4 bytes en el UNO R3', '  double d = 1.5;\n  Serial.println(d);'),
    ty('String', 'Objeto de texto cómodo. Usa memoria dinámica: con poca RAM, abusar de él fragmenta la memoria.', 'Variable', '  String s = "Hola";\n  s += " UNO";\n  Serial.println(s);'),
    ty('array', 'Lista de valores del mismo tipo, numerados desde 0.', 'n × tamaño del tipo', '  int a[3] = {10, 20, 30};\n  Serial.println(a[1]);')
  ]);

  const co = (name, what) => ({ name, sig: name, what, params: [], ret: '—', keyword: true, isConst: true, link: LANG, ex: inSetup('  Serial.println(' + name.split(' ')[0] + ');') });
  add('Constantes', null, [
    co('HIGH', 'Nivel alto: 5 V en el UNO. Vale 1.'), co('LOW', 'Nivel bajo: 0 V. Vale 0.'),
    co('OUTPUT', 'Modo de pin para entregar señal.'), co('INPUT', 'Modo de pin para leer. El pin queda al aire si nada lo fija.'),
    co('INPUT_PULLUP', 'Modo de entrada que activa una resistencia interna hacia 5 V. El pin lee HIGH hasta que algo lo lleve a GND.'),
    co('LED_BUILTIN', 'El pin del LED integrado: 13 en el UNO.'), co('PI', 'El número π.')
  ]);

  const byName = Object.create(null);
  FN.forEach(f => { f.key = f.name; byName[f.name] = f; });
  // Alias: lo que se ve en el código -> ficha
  const ALIAS = { boolean: 'bool', unsigned: 'unsigned int', else: 'if', case: 'switch', default: 'switch', true: 'bool', false: 'bool', word: 'unsigned int', uint8_t: 'byte', uint16_t: 'unsigned int', uint32_t: 'unsigned long', int16_t: 'int', int32_t: 'long' };
  function lookup(token, prev) {
    if (prev) {
      for (const pre of [prev + '.' + token]) if (byName[pre]) return byName[pre];
    }
    if (byName[token]) return byName[token];
    if (ALIAS[token]) return byName[ALIAS[token]];
    return null;
  }
  root.Pin13Fn = { list: FN, byName, lookup };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Pin13Fn;
})(typeof globalThis !== 'undefined' ? globalThis : this);

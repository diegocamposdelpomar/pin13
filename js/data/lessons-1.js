/* Temario, parte 1: empezar, electrónica y fundamentos de programación. */
(function (root) {
  const c = String.raw;
  const M = root.Pin13Modules = root.Pin13Modules || [];

  M.push({ id: 'inicio', title: 'Primeros pasos', blurb: 'Qué es Arduino, cómo es la placa y tu primer programa.', lessons: [
    { id: 'que-es', title: '¿Qué es Arduino?', min: 6, goal: 'Entender qué es un microcontrolador y qué puedes construir con él.', blocks: [
      { p: 'Arduino es una plataforma abierta para crear objetos que **sienten** y **actúan**. Tiene dos partes: una **placa** con un pequeño ordenador y un **programa** para escribirle instrucciones desde tu computadora.' },
      { p: 'El corazón de la placa es un **microcontrolador**: un chip con procesador, memoria y patas capaces de leer y controlar voltajes. Tu lavadora, tu microondas y tu control remoto llevan uno. No tiene pantalla ni sistema operativo: hace una sola cosa, una y otra vez, durante años.' },
      { h: 'El ciclo de todo proyecto' },
      { table: { head: ['Etapa', 'Qué pasa', 'Ejemplo'], rows: [['Entrada', 'Un sensor mide el mundo', 'Sensor de distancia'], ['Proceso', 'Tu programa decide', '«Si hay algo a menos de 30 cm…»'], ['Salida', 'Un actuador responde', 'Suena un zumbador']] } },
      { h: '¿Arduino o Raspberry Pi?' },
      { p: 'Se confunden a menudo. Una Raspberry Pi es un ordenador completo con Linux; Arduino ejecuta un único programa y arranca al instante. Para controlar motores y sensores con tiempos precisos, Arduino es más simple. Para video, internet o interfaces complejas, conviene una Raspberry Pi. Muchos proyectos usan ambos.' },
      { tip: 'No necesitas placa para seguir este curso: el UNO virtual de la app ejecuta tu código de verdad. Cuando quieras pasar a lo físico, cada lección indica las conexiones.' },
      { quiz: [
        { q: '¿Qué es un microcontrolador?', o: ['Un sensor de temperatura', 'Un chip con procesador, memoria y patas de entrada y salida', 'Un programa para el ordenador', 'Un tipo de batería'], a: 1, why: 'Integra en un solo chip lo que necesita para ejecutar un programa y controlar señales eléctricas.' },
        { q: 'Quieres que un LED se encienda si está oscuro. ¿Cuál es la entrada?', o: ['El LED', 'El programa', 'El sensor de luz', 'El cable USB'], a: 2, why: 'La entrada es lo que mide el mundo. El LED sería la salida.' }
      ] }
    ] },
    { id: 'placa', title: 'Conoce la placa UNO', min: 8, goal: 'Reconocer cada zona de la placa y sus límites eléctricos.', blocks: [
      { p: 'El **UNO** es la placa de referencia para aprender. La versión R3 lleva un ATmega328P a 16 MHz. Toca cada pin de la imagen para saber para qué sirve.' },
      { widget: 'pinout' },
      { h: 'La ficha técnica que debes recordar' },
      { table: { head: ['Característica', 'UNO R3'], rows: [['Voltaje de trabajo', '5 V'], ['Pines digitales', '14 (0–13), 6 con PWM: 3, 5, 6, 9, 10, 11'], ['Entradas analógicas', '6 (A0–A5), 10 bits: 0 a 1023'], ['Memoria Flash (programa)', '32 KB'], ['SRAM (variables)', '2 KB'], ['EEPROM (datos permanentes)', '1 KB'], ['Corriente por pin', '20 mA recomendados; 40 mA es el máximo absoluto'], ['Alimentación por conector', '7–12 V recomendados']] } },
      { warn: '**Los dos límites que queman placas.** Nunca conectes más de 5 V a un pin, y nunca pidas a un pin más de 20 mA sostenidos: un motor conectado directamente puede dañarlo.' },
      { tip: 'Los pines 0 y 1 los usa la comunicación USB (Serial). Si conectas algo en ellos, la carga de programas puede fallar. Deja libres esos dos al empezar.' },
      { quiz: [
        { q: '¿Qué pines del UNO R3 pueden hacer PWM?', o: ['Todos', 'A0 a A5', '3, 5, 6, 9, 10 y 11', 'Solo el 13'], a: 2, why: 'Son los que llevan el símbolo ~ en la placa.' },
        { q: '¿Cuál es la corriente recomendada por pin?', o: ['1 A', '500 mA', '200 mA', '20 mA'], a: 3, why: '40 mA es el máximo absoluto; para trabajar seguro, no pases de 20 mA.' }
      ] }
    ] },
    { id: 'ide', title: 'Instala el Arduino IDE', min: 7, goal: 'Instalar el entorno y cargar un programa en una placa real.', blocks: [
      { p: 'El **Arduino IDE** es el programa oficial para escribir código, llamado *sketch*, compilarlo y enviarlo a la placa. Es gratuito y hay versión para Windows, macOS y Linux.' },
      { ol: ['Descarga el IDE 2 desde la [página oficial](https://www.arduino.cc/en/software/) e instálalo.', 'Conecta la placa por USB.', 'Arriba, en el selector, elige tu placa y su puerto (por ejemplo «Arduino UNO en COM3»).', 'Abre {{Archivo → Ejemplos → 01.Basics → Blink}}.', 'Pulsa **Verificar** (✓) para compilar y **Subir** (→) para enviar.', 'El LED marcado con la letra L debe parpadear. ¡Funciona!'] },
      { h: 'Los botones que usarás siempre' },
      { table: { head: ['Botón', 'Para qué sirve'], rows: [['✓ Verificar', 'Comprueba el código y lo traduce a lenguaje de máquina.'], ['→ Subir', 'Lo verifica y lo graba en la placa.'], ['Monitor serie (lupa)', 'Muestra lo que la placa te envía y te permite escribirle.'], ['Gestor de librerías', 'Instala código de otros para sensores y pantallas.']] } },
      { h: 'Si no carga' },
      { ul: ['**No aparece el puerto:** prueba otro cable; muchos solo cargan y no transmiten datos.', '**Placa clónica con chip CH340:** puede necesitar instalar su controlador.', '**«Access denied» o puerto ocupado:** cierra otros programas que lo usen, incluido un monitor serie abierto.', '**Error al subir:** desconecta lo que tengas en los pines 0 y 1.'] },
      { tip: 'Sin placa, también puedes practicar con simuladores en línea como [Wokwi](https://wokwi.com/) o [Tinkercad Circuits](https://www.tinkercad.com/circuits).' },
      { quiz: [{ q: '¿Qué hace el botón Verificar?', o: ['Graba el programa en la placa', 'Compila y comprueba el código sin subirlo', 'Prueba que la placa funciona', 'Actualiza el IDE'], a: 1, why: 'Traduce tu código y detecta errores. Para grabarlo está Subir.' }] }
    ] },
    { id: 'blink', title: 'Tu primer programa: Blink', min: 10, goal: 'Entender línea a línea un programa completo y modificarlo.', blocks: [
      { p: 'Todo programador de Arduino empieza igual: haciendo parpadear un LED. Pasa el cursor por cada línea para ver su explicación, y toca cualquier función en naranja para abrir su ficha.' },
      { code: c`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`, notes: { 1: 'setup() se ejecuta una sola vez al arrancar.', 2: 'Configura el pin 13 como salida. Sin esto, el LED apenas brillaría.', 3: 'Fin de setup().', 5: 'loop() se repite para siempre.', 6: 'Pone 5 V en el pin 13: el LED se enciende.', 7: 'Espera 1000 ms, es decir, 1 segundo.', 8: 'Pone 0 V en el pin 13: el LED se apaga.', 9: 'Espera otro segundo.', 10: 'Al llegar aquí, loop() vuelve a empezar desde arriba.' } },
      { h: 'Ejecútalo y míralo por dentro' },
      { p: 'Pulsa **Paso** para avanzar una instrucción cada vez: verás qué línea se ejecuta y qué le pasa a la placa. Después pulsa **Ejecutar** y cambia los números.' },
      { lab: { code: c`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`, parts: [{ type: 'led', pin: 13 }] } },
      { challenge: { title: 'Más rápido', desc: 'Modifica el programa para que el LED del pin 13 esté **200 ms encendido y 200 ms apagado**.', start: c`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`, parts: [{ type: 'led', pin: 13 }], ms: 2000,
        check: (m) => { const e = m.edges(13).filter(x => x.t > 0); if (e.length < 6) return 'El LED cambia muy pocas veces. Baja los dos delay.'; const d = e[3].t - e[2].t; return Math.abs(d - 200) < 10 && Math.abs(e[4].t - e[3].t - 200) < 10 ? true : 'Cada estado dura ' + Math.round(d) + ' ms; deben ser 200 ms.'; },
        hint: 'Solo tienes que cambiar los dos números de delay.', solution: c`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(200);
  digitalWrite(13, LOW);
  delay(200);
}` } },
      { quiz: [{ q: 'Si quitas el segundo delay(1000), ¿qué se ve?', o: ['El LED parpadea más rápido', 'El LED parece casi siempre encendido', 'El LED se apaga', 'Da un error'], a: 1, why: 'Tras apagarse, loop() vuelve a encender el LED en microsegundos: el apagado es tan breve que no se aprecia.' }] }
    ] }
  ] });

  M.push({ id: 'electronica', title: 'Electrónica esencial', blurb: 'Voltaje, corriente, resistencias y protoboard sin miedo.', lessons: [
    { id: 'ohm', title: 'Voltaje, corriente y ley de Ohm', min: 9, goal: 'Calcular corrientes para no quemar componentes.', blocks: [
      { p: 'Imagina agua en una tubería. El **voltaje** (V, voltios) es la presión que la empuja. La **corriente** (I, amperios) es cuánta agua pasa. La **resistencia** (R, ohmios Ω) es un estrechamiento que la frena.' },
      { p: 'Los tres se relacionan con la fórmula más útil de la electrónica: **V = I × R**. Conociendo dos valores, obtienes el tercero.' },
      { widget: 'ohm' },
      { h: 'Ejemplo real' },
      { p: 'Un pin da 5 V y conectas una resistencia de 1000 Ω a GND: I = 5 / 1000 = 0,005 A = **5 mA**. Está muy por debajo de los 20 mA recomendados, así que es seguro.' },
      { h: 'Tres ideas clave' },
      { ul: ['**GND es la referencia:** todo voltaje se mide respecto a él. Si conectas dos circuitos, une sus GND.', '**Corriente continua:** las pilas y el USB entregan voltaje constante, con polaridad + y −.', '**Cortocircuito:** unir + y − sin nada en medio hace pasar muchísima corriente. Es lo primero que debes evitar.'] },
      { quiz: [
        { q: 'Un pin a 5 V con una resistencia de 250 Ω a GND, ¿qué corriente consume?', o: ['2 mA', '20 mA', '200 mA', '1,25 A'], a: 1, why: '5 / 250 = 0,02 A = 20 mA.' },
        { q: 'En la analogía del agua, ¿qué es el voltaje?', o: ['La cantidad de agua', 'La presión', 'El estrechamiento', 'La tubería'], a: 1, why: 'El voltaje es el «empuje». La corriente es el caudal.' }
      ] }
    ] },
    { id: 'resistencias', title: 'Resistencias y código de colores', min: 7, goal: 'Leer el valor de una resistencia y calcular un divisor de voltaje.', blocks: [
      { p: 'Una resistencia limita la corriente. Su valor viene pintado en bandas de colores. Las dos primeras dan cifras, la tercera es el multiplicador y la última, la tolerancia.' },
      { widget: 'colors' },
      { h: 'Divisor de voltaje' },
      { p: 'Dos resistencias en serie reparten el voltaje. Así se leen muchos sensores resistivos, como una LDR, y se baja una señal de 5 V a 3,3 V: **Vsalida = Ventrada × R2 / (R1 + R2)**.' },
      { widget: 'divider' },
      { quiz: [
        { q: 'Marrón, negro, rojo. ¿Qué valor es?', o: ['100 Ω', '1 kΩ', '10 kΩ', '102 Ω'], a: 1, why: 'Marrón = 1, negro = 0, rojo = ×100: 10 × 100 = 1000 Ω.' },
        { q: 'Con R1 = R2 y 5 V a la entrada, ¿cuánto sale del divisor?', o: ['5 V', '2,5 V', '1 V', '0 V'], a: 1, why: 'El voltaje se reparte a partes iguales.' }
      ] }
    ] },
    { id: 'protoboard', title: 'Protoboard y tu primer circuito', min: 8, goal: 'Montar un LED con su resistencia correctamente.', blocks: [
      { p: 'La **protoboard** permite probar circuitos sin soldar. Las filas centrales están conectadas horizontalmente en grupos de 5 orificios, y el canal central las separa. Las líneas laterales + y − recorren toda la placa y se usan para llevar 5 V y GND.' },
      { h: 'El LED y su polaridad' },
      { p: 'Un LED solo funciona en un sentido. La **pata larga** es el ánodo (+); la corta, el cátodo (−). Además, **siempre** necesita una resistencia: sin ella consumiría demasiada corriente y podría quemarse él o el pin.' },
      { widget: 'ledres' },
      { h: 'Conexiones' },
      { wire: [['Pin 9', 'Resistencia de 220 Ω'], ['Resistencia', 'Pata larga del LED (+)'], ['Pata corta del LED (−)', 'GND']] },
      { lab: { code: c`const int LED = 9;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(300);
  digitalWrite(LED, LOW);
  delay(700);
}`, parts: [{ type: 'led', pin: 9, color: 'verde' }] } },
      { warn: 'Si el LED no se enciende, prueba a invertirlo; no se daña por estar al revés durante una prueba de 5 V con resistencia. Comprueba también que las patas estén en filas distintas.' },
      { quiz: [
        { q: '¿Qué pata del LED va hacia el positivo?', o: ['La corta', 'La larga', 'Cualquiera', 'Ninguna'], a: 1, why: 'La pata larga es el ánodo.' },
        { q: '¿Por qué lleva resistencia un LED?', o: ['Para que brille de colores', 'Para limitar la corriente', 'Para subir el voltaje', 'Para que parpadee'], a: 1, why: 'Sin ella, la corriente solo está limitada por el pin, y puede dañar el LED o la placa.' }
      ] }
    ] },
    { id: 'seguridad', title: 'Cómo no romper nada', min: 5, goal: 'Evitar los errores que dañan placas y componentes.', blocks: [
      { p: 'Arduino es bastante resistente, pero estas son las causas más comunes de averías:' },
      { table: { head: ['Error', 'Consecuencia', 'Cómo evitarlo'], rows: [
        ['Unir 5 V y GND', 'Calentamiento, el USB se protege o se avería', 'Revisa antes de conectar la energía'],
        ['Motor directo a un pin', 'El pin se quema', 'Usa un transistor o un driver'],
        ['Más de 5 V en un pin', 'Chip dañado', 'Usa un divisor de voltaje'],
        ['Motor sin diodo de protección', 'Picos de voltaje', 'Pon un diodo en paralelo'],
        ['9 V al pin 5 V', 'Placa dañada', 'Los 9 V van al conector o a VIN'],
        ['Conectar módulos con la placa encendida', 'Cortos accidentales', 'Desconecta primero el USB']
      ] } },
      { tip: 'Hábito de oro: **cablea sin energía, revisa, y conecta el USB al final.** Si algo huele o quema, desconéctalo enseguida.' },
      { quiz: [{ q: '¿Cómo controlas un motor desde Arduino?', o: ['Directo a un pin', 'Con un transistor o driver y fuente externa', 'Conectado a A0', 'Con una resistencia de 10 kΩ'], a: 1, why: 'El pin solo da la señal de control; la potencia viene de otra fuente a través del transistor o driver.' }] }
    ] }
  ] });

  M.push({ id: 'programar', title: 'Aprende a programar', blurb: 'Variables, decisiones, bucles, funciones: lo que sirve en cualquier lenguaje.', lessons: [
    { id: 'pensar', title: 'Cómo piensa un programa', min: 6, goal: 'Leer un programa como una secuencia de instrucciones y usar comentarios.', blocks: [
      { p: 'Un programa es una lista de instrucciones que se ejecutan **de arriba abajo, una a una**. La computadora no interpreta tus intenciones: hace exactamente lo que dices. Arduino usa **C++** con algunas facilidades.' },
      { h: 'Las reglas de escritura' },
      { ul: ['Cada instrucción termina con **;**', 'Las llaves **{ }** agrupan instrucciones en un bloque.', 'Se distinguen mayúsculas y minúsculas: {{digitalWrite}} funciona; {{digitalwrite}} no.', 'Los espacios y sangrías no cambian nada para la máquina, pero son vitales para quien lee.', 'Los **comentarios** no se ejecutan: {{// una línea}} o {{/* varias */}}.'] },
      { lab: { code: c`// Esto es un comentario: Arduino lo ignora.
/* Y este puede ocupar
   varias líneas. */

void setup() {
  Serial.begin(9600);       // Abre el canal de mensajes
  Serial.println("Hola");   // Primera instrucción
  Serial.println("mundo");  // Segunda: va después
}

void loop() {
  // Vacío: no se repite nada
}`, parts: [] } },
      { tip: '**Lee los errores.** Prueba a borrar un ; en el laboratorio: la app te señala la línea y explica qué pasa. Equivocarse es parte del oficio.' },
      { challenge: { title: 'Tu presentación', desc: 'Haz que el monitor serie muestre exactamente dos líneas: **Me llamo Pin** y **Tengo 13 años**.', start: c`void setup() {
  Serial.begin(9600);
  // Escribe aquí
}

void loop() {
}`, parts: [], ms: 200,
        check: (m) => m.serialOut.trim() === 'Me llamo Pin\nTengo 13 años' ? true : 'La salida fue: «' + m.serialOut.trim().replace(/\n/g, ' ⏎ ') + '». Revisa el texto, letra por letra.',
        hint: 'Usa dos veces Serial.println("...");', solution: c`void setup() {
  Serial.begin(9600);
  Serial.println("Me llamo Pin");
  Serial.println("Tengo 13 años");
}

void loop() {
}` } },
      { quiz: [{ q: '¿Qué pasa si escribes Serial.Println?', o: ['Funciona igual', 'Error de compilación: no existe', 'Imprime en mayúsculas', 'Se ignora'], a: 1, why: 'C++ distingue mayúsculas: Println y println son nombres distintos.' }] }
    ] },
    { id: 'variables', title: 'Variables y tipos de datos', min: 11, goal: 'Elegir el tipo adecuado y entender el desbordamiento.', blocks: [
      { p: 'Una **variable** es una caja con nombre para guardar un dato. Al crearla indicas su **tipo**: qué clase de dato guarda y cuánto ocupa.' },
      { code: c`int edad = 25;          // entero
float altura = 1.75;    // con decimales
char inicial = 'P';     // un carácter
bool encendido = true;  // verdadero o falso
String nombre = "Ana";  // texto`, notes: { 1: 'int guarda enteros. En el UNO R3 va de -32768 a 32767.', 2: 'float admite decimales. Se escriben con punto, no con coma.', 3: 'Un char va entre comillas simples.', 4: 'bool solo puede ser true o false.', 5: 'String guarda texto y va entre comillas dobles.' } },
      { h: 'Tipos en el UNO R3' },
      { table: { head: ['Tipo', 'Bytes', 'Rango', 'Úsalo para'], rows: [['bool', '1', 'true / false', 'Estados'], ['byte', '1', '0 a 255', 'Valores PWM, datos'], ['char', '1', '-128 a 127', 'Caracteres'], ['int', '2', '-32768 a 32767', 'Lo general, pines'], ['unsigned int', '2', '0 a 65535', 'Contadores positivos'], ['long', '4', '±2 147 483 647', 'Números grandes'], ['unsigned long', '4', '0 a 4 294 967 295', 'Tiempos de millis()'], ['float', '4', '6–7 cifras', 'Decimales']] } },
      { h: 'El desbordamiento: verlo para creerlo' },
      { p: 'Con 2 KB de RAM, cada byte cuenta, pero los tipos pequeños tienen un precio. Si te pasas del máximo, el número da la vuelta. Ejecuta esto:' },
      { lab: { code: c`int a = 32767;       // el máximo de un int
byte b = 255;        // el máximo de un byte

void setup() {
  Serial.begin(9600);
  a = a + 1;
  b = b + 1;
  Serial.println(a);   // ¿Qué sale?
  Serial.println(b);
  Serial.println(1000 * 60);    // ¡Cuidado!
  Serial.println(1000L * 60);   // Bien
}

void loop() {
}`, parts: [] } },
      { warn: '{{1000 * 60}} da **-5536** en el UNO R3: los dos son int, así que el resultado se calcula en int y desborda. Añade {{L}} a un número para que se calcule como long.' },
      { h: 'División entera' },
      { p: 'Otra sorpresa: {{7 / 2}} da **3**. Si los dos números son enteros, el resultado también lo es, y se descartan los decimales. Para obtener 3.5 escribe {{7.0 / 2}}.' },
      { challenge: { title: 'Temperatura en Fahrenheit', desc: 'Declara {{float celsius = 25.0;}} y muestra por Serial el resultado de **F = C × 9 / 5 + 32**. Debe salir **77.00**.', start: c`void setup() {
  Serial.begin(9600);
  // Tu código aquí
}

void loop() {
}`, parts: [], ms: 100,
        check: (m) => m.serialOut.trim() === '77.00' ? true : 'Salió «' + m.serialOut.trim() + '» y se esperaba 77.00. ¿La variable es float?',
        hint: 'Serial.println(celsius * 9 / 5 + 32);', solution: c`void setup() {
  Serial.begin(9600);
  float celsius = 25.0;
  Serial.println(celsius * 9 / 5 + 32);
}

void loop() {
}` } },
      { quiz: [
        { q: '¿Qué tipo usarías para guardar millis()?', o: ['int', 'byte', 'float', 'unsigned long'], a: 3, why: 'millis() crece mucho y nunca es negativo.' },
        { q: '¿Cuánto vale 5 / 2 en un programa?', o: ['2.5', '2', '3', 'Error'], a: 1, why: 'Dos enteros dan un resultado entero.' }
      ] }
    ] },
    { id: 'operadores', title: 'Operadores', min: 7, goal: 'Hacer cálculos y comparaciones.', blocks: [
      { table: { head: ['Clase', 'Operadores', 'Ejemplo'], rows: [['Aritméticos', '+ − * / %', '7 % 3 → 1 (el resto)'], ['Comparación', '== != < > <= >=', 'x >= 10'], ['Lógicos', '&& (y), || (o), ! (no)', 'a > 0 && a < 10'], ['Asignación', '= += -= *= /=', 'x += 2 equivale a x = x + 2'], ['Incremento', '++ --', 'x++ suma uno'], ['Bits', '& | ^ ~ << >>', '1 << 3 → 8']] } },
      { warn: '**= asigna; == compara.** {{if (x = 5)}} no compara: guarda 5 en x y la condición siempre es verdadera. Es el error más clásico en C++.' },
      { p: 'El operador **%** da el resto de una división, y es perfecto para repetir cada cierto tiempo o saber si un número es par.' },
      { lab: { code: c`void setup() {
  Serial.begin(9600);
  for (int n = 1; n <= 6; n++) {
    Serial.print(n);
    if (n % 2 == 0) {
      Serial.println(" es par");
    } else {
      Serial.println(" es impar");
    }
  }
}

void loop() {
}`, parts: [] } },
      { challenge: { title: 'FizzBuzz de 1 a 15', desc: 'Con un {{for}}, imprime los números del 1 al 15, uno por línea, pero: múltiplos de 3 → **Fizz**; de 5 → **Buzz**; de ambos → **FizzBuzz**.', start: c`void setup() {
  Serial.begin(9600);
  for (int i = 1; i <= 15; i++) {
    // Tu código aquí
  }
}

void loop() {
}`, parts: [], ms: 200,
        check: (m) => m.serialOut.trim().split('\n').join(',') === '1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz,11,Fizz,13,14,FizzBuzz' ? true : 'La secuencia no coincide. Comprueba primero el caso de múltiplos de 3 y 5 a la vez.',
        hint: 'Comprueba primero i % 15 == 0.', solution: c`void setup() {
  Serial.begin(9600);
  for (int i = 1; i <= 15; i++) {
    if (i % 15 == 0) {
      Serial.println("FizzBuzz");
    } else if (i % 3 == 0) {
      Serial.println("Fizz");
    } else if (i % 5 == 0) {
      Serial.println("Buzz");
    } else {
      Serial.println(i);
    }
  }
}

void loop() {
}` } },
      { quiz: [{ q: '¿Cuánto vale 17 % 5?', o: ['3', '2', '3.4', '12'], a: 1, why: '17 / 5 = 3 y sobran 2.' }, { q: '¿Cuál comprueba que x esté entre 10 y 20?', o: ['10 < x < 20', 'x > 10 && x < 20', 'x > 10 || x < 20', 'x == 10..20'], a: 1, why: 'Se necesitan dos comparaciones unidas con &&. La primera opción compila, pero no hace lo que parece.' }] }
    ] },
    { id: 'decisiones', title: 'Decisiones: if, else y switch', min: 8, goal: 'Hacer que el programa elija caminos.', blocks: [
      { p: 'Con [[if]] el programa toma decisiones. Si la condición es verdadera se ejecuta un bloque; si no, puede ejecutarse otro con {{else}}.' },
      { code: c`if (temperatura > 30) {
  Serial.println("Calor");
} else if (temperatura > 15) {
  Serial.println("Agradable");
} else {
  Serial.println("Frío");
}`, notes: { 1: 'Primera pregunta. Si es verdadera, entra aquí y se salta el resto.', 3: 'Solo se evalúa si la primera fue falsa.', 5: 'Se ejecuta si ninguna condición se cumplió.' } },
      { h: 'switch: elegir entre muchas opciones' },
      { p: 'Cuando comparas una misma variable con varios valores, [[switch]] queda más ordenado. Cada caso necesita su {{break}}; sin él, la ejecución sigue en el siguiente.' },
      { lab: { code: c`int nota = 7;

void setup() {
  Serial.begin(9600);
  if (nota >= 9) {
    Serial.println("Sobresaliente");
  } else if (nota >= 5) {
    Serial.println("Aprobado");
  } else {
    Serial.println("Suspenso");
  }

  switch (nota) {
    case 10:
      Serial.println("Perfecto");
      break;
    case 7:
      Serial.println("Un siete");
      break;
    default:
      Serial.println("Otra nota");
  }
}

void loop() {
}`, parts: [] } },
      { challenge: { title: 'LED según luz', desc: 'Lee {{analogRead(A0)}}. Si es **menor que 300** enciende el LED del pin 9; en caso contrario, apágalo. Mueve el deslizador para comprobarlo.', start: c`void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  int luz = analogRead(A0);
  // Tu código aquí
}`, parts: [{ type: 'ldr', pin: 14, value: 600 }, { type: 'led', pin: 9 }], ms: 400, stim: [{ at: 100, analog: 14, value: 100 }, { at: 250, analog: 14, value: 800 }],
        check: (m) => { const e = m.edges(9); const on = e.find(x => x.v === 1 && x.t >= 90); if (!on) return 'El LED no se encendió con poca luz.'; const off = e.find(x => x.v === 0 && x.t >= 240); return off ? true : 'El LED no se apagó al volver la luz.'; },
        hint: 'if (luz < 300) { digitalWrite(9, HIGH); } else { ... }', solution: c`void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  int luz = analogRead(A0);
  if (luz < 300) {
    digitalWrite(9, HIGH);
  } else {
    digitalWrite(9, LOW);
  }
}` } },
      { quiz: [{ q: '¿Qué pasa si falta break en un case?', o: ['Error de compilación', 'Sigue ejecutando el siguiente case', 'Sale del programa', 'Nada'], a: 1, why: 'Se llama «caída»: continúa hasta el siguiente break o el final del switch.' }] }
    ] },
    { id: 'bucles', title: 'Bucles: for y while', min: 9, goal: 'Repetir sin copiar código.', blocks: [
      { p: 'Si te ves copiando y pegando líneas, necesitas un bucle. [[for]] se usa cuando sabes cuántas veces repetir, y [[while]] cuando depende de una condición.' },
      { code: c`for (int i = 0; i < 5; i++) {
  Serial.println(i);
}`, notes: { 1: 'Tres partes: inicio (i = 0), condición para seguir (i < 5) y paso tras cada vuelta (i++).', 2: 'Se ejecuta 5 veces, con i = 0, 1, 2, 3 y 4.' } },
      { p: 'Ejecuta este programa **paso a paso**: verás cómo cambia {{i}} en el panel de variables, y el brillo de los LED.' },
      { lab: { code: c`void setup() {
  for (int pin = 3; pin <= 6; pin++) {
    pinMode(pin, OUTPUT);
  }
}

void loop() {
  for (int pin = 3; pin <= 6; pin++) {
    digitalWrite(pin, HIGH);
    delay(150);
    digitalWrite(pin, LOW);
  }
}`, parts: [{ type: 'led', pin: 3 }, { type: 'led', pin: 4, color: 'ambar' }, { type: 'led', pin: 5, color: 'verde' }, { type: 'led', pin: 6, color: 'azul' }] } },
      { warn: 'Un {{while}} sin salida bloquea todo: {{while (true) { }}} deja la placa en ese punto para siempre. A veces se hace a propósito para detener un programa.' },
      { challenge: { title: 'Cuenta atrás', desc: 'Imprime **5 4 3 2 1 ¡Despegue!**, una cosa por línea, con un bucle.', start: c`void setup() {
  Serial.begin(9600);
  // Tu bucle aquí
}

void loop() {
}`, parts: [], ms: 200,
        check: (m) => m.serialOut.trim().split('\n').join('|') === '5|4|3|2|1|¡Despegue!' ? true : 'Salió: ' + m.serialOut.trim().split('\n').join(', '),
        hint: 'for (int i = 5; i > 0; i--)', solution: c`void setup() {
  Serial.begin(9600);
  for (int i = 5; i > 0; i--) {
    Serial.println(i);
  }
  Serial.println("¡Despegue!");
}

void loop() {
}` } },
      { quiz: [{ q: '¿Cuántas vueltas da for (int i = 2; i < 8; i += 2)?', o: ['2', '3', '4', '6'], a: 1, why: 'i toma los valores 2, 4 y 6.' }] }
    ] },
    { id: 'funciones', title: 'Funciones propias', min: 10, goal: 'Dividir programas en piezas reutilizables.', blocks: [
      { p: 'Una función es un bloque con nombre. La escribes una vez y la llamas cuando la necesites. Ya usas muchas: {{delay}}, {{digitalWrite}}… Ahora crearás las tuyas.' },
      { code: c`int sumar(int a, int b) {
  int total = a + b;
  return total;
}`, notes: { 1: 'int: tipo de lo que devuelve. sumar: nombre. Entre paréntesis, los parámetros: los datos que recibe.', 2: 'El cuerpo de la función. total solo existe aquí dentro.', 3: 'return entrega el resultado a quien llamó. Si la función es void, no devuelve nada.' } },
      { lab: { code: c`const int LED = 13;

void parpadear(int veces, int pausa) {
  for (int i = 0; i < veces; i++) {
    digitalWrite(LED, HIGH);
    delay(pausa);
    digitalWrite(LED, LOW);
    delay(pausa);
  }
}

float aVoltios(int lectura) {
  return lectura * 5.0 / 1023.0;
}

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  Serial.println(aVoltios(512));
}

void loop() {
  parpadear(3, 100);
  delay(800);
}`, parts: [{ type: 'led', pin: 13 }] } },
      { h: 'Parámetros por valor y por referencia' },
      { p: 'Normalmente una función recibe una **copia** del dato. Si pones {{&}}, recibe la variable original y puede modificarla.' },
      { code: c`void duplicar(int &x) {
  x = x * 2;
}`, notes: { 1: 'El & hace que x sea la misma variable que la que se pasa al llamar.', 2: 'Este cambio se ve fuera de la función.' } },
      { challenge: { title: 'Función esPar', desc: 'Completa {{bool esPar(int n)}} para que devuelva true si n es par. El programa debe imprimir **1**, **0** y **1**.', start: c`bool esPar(int n) {
  // Tu código aquí
}

void setup() {
  Serial.begin(9600);
  Serial.println(esPar(4));
  Serial.println(esPar(7));
  Serial.println(esPar(0));
}

void loop() {
}`, parts: [], ms: 200,
        check: (m) => m.serialOut.trim().split('\n').join('') === '101' ? true : 'Salió: ' + m.serialOut.trim().split('\n').join(', ') + '. Debe ser 1, 0, 1.',
        hint: 'return n % 2 == 0;', solution: c`bool esPar(int n) {
  return n % 2 == 0;
}

void setup() {
  Serial.begin(9600);
  Serial.println(esPar(4));
  Serial.println(esPar(7));
  Serial.println(esPar(0));
}

void loop() {
}` } },
      { quiz: [{ q: '¿Qué significa void en una función?', o: ['Que está vacía', 'Que no devuelve nada', 'Que no recibe nada', 'Que es privada'], a: 1, why: 'void indica que no devuelve ningún valor; sí puede tener parámetros y cuerpo.' }] }
    ] },
    { id: 'arrays', title: 'Arrays: listas de datos', min: 9, goal: 'Guardar y recorrer colecciones.', blocks: [
      { p: 'Un **array** guarda varios valores del mismo tipo bajo un nombre. Se accede a cada uno por su **índice**, y **el primero es el 0**.' },
      { code: c`int pines[4] = {3, 5, 6, 9};
int n = sizeof(pines) / sizeof(pines[0]);`, notes: { 1: 'Reserva 4 enteros. pines[0] vale 3 y pines[3] vale 9. pines[4] no existe.', 2: 'Truco para calcular cuántos elementos tiene: bytes totales entre bytes de uno.' } },
      { lab: { code: c`int pines[] = {3, 5, 6, 9};
int notas[] = {262, 330, 392, 523};
const int N = 4;

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < N; i++) {
    pinMode(pines[i], OUTPUT);
  }
}

void loop() {
  for (int i = 0; i < N; i++) {
    digitalWrite(pines[i], HIGH);
    tone(8, notas[i], 150);
    Serial.println(notas[i]);
    delay(250);
    digitalWrite(pines[i], LOW);
  }
}`, parts: [{ type: 'led', pin: 3 }, { type: 'led', pin: 5, color: 'ambar' }, { type: 'led', pin: 6, color: 'verde' }, { type: 'led', pin: 9, color: 'azul' }, { type: 'buzzer', pin: 8 }] } },
      { warn: 'C++ no comprueba los límites. En una placa real, escribir en {{a[10]}} de un array de 5 pisa otra variable sin avisar y causa fallos muy raros. El simulador sí te lo advierte.' },
      { challenge: { title: 'El mayor', desc: 'Busca el valor máximo del array e imprímelo. Debe salir **91**.', start: c`int datos[] = {12, 45, 91, 8, 33, 67};
const int N = 6;

void setup() {
  Serial.begin(9600);
  // Tu código aquí
}

void loop() {
}`, parts: [], ms: 200,
        check: (m) => m.serialOut.trim() === '91' ? true : 'Salió «' + m.serialOut.trim() + '». Imprime solo el máximo.',
        hint: 'Guarda datos[0] en una variable y recorre el resto comparando.', solution: c`int datos[] = {12, 45, 91, 8, 33, 67};
const int N = 6;

void setup() {
  Serial.begin(9600);
  int mayor = datos[0];
  for (int i = 1; i < N; i++) {
    if (datos[i] > mayor) {
      mayor = datos[i];
    }
  }
  Serial.println(mayor);
}

void loop() {
}` } },
      { quiz: [{ q: 'En int a[5], ¿cuál es el último índice válido?', o: ['5', '4', '6', '0'], a: 1, why: 'Los índices van de 0 a 4.' }] }
    ] },
    { id: 'texto', title: 'Texto: String y char[]', min: 7, goal: 'Manipular texto y conocer sus costes.', blocks: [
      { p: 'Hay dos formas de guardar texto. Los **arrays de char** son la forma clásica de C: ligeros y terminados en un carácter nulo. La clase **String** es mucho más cómoda.' },
      { lab: { code: c`char saludo[] = "Hola";   // 5 bytes: H o l a \0

void setup() {
  Serial.begin(9600);
  Serial.println(saludo);
  Serial.println(sizeof(saludo));

  String s = "temp=24.5";
  int igual = s.indexOf('=');
  String clave = s.substring(0, igual);
  float valor = s.substring(igual + 1).toFloat();

  Serial.println(clave);
  Serial.println(valor + 1);
  s.toUpperCase();
  Serial.println(s);
}

void loop() {
}`, parts: [] } },
      { table: { head: ['', 'String', 'char[]'], rows: [['Comodidad', 'Alta: + , métodos', 'Baja: strcpy, strlen…'], ['Memoria', 'Dinámica, puede fragmentar', 'Fija, predecible'], ['Cuándo', 'Prototipos, textos cortos', 'Proyectos largos, 24/7']] } },
      { tip: 'En el UNO, los textos fijos gastan RAM. Envuélvelos con [[F]]: {{Serial.println(F("Texto largo"));}} los deja en la memoria Flash.' },
      { quiz: [{ q: '¿Cuántos bytes ocupa char t[] = "abc"?', o: ['3', '4', '6', '2'], a: 1, why: 'Tres letras más el carácter nulo final \\0.' }] }
    ] },
    { id: 'alcance', title: 'Alcance, const y struct', min: 8, goal: 'Saber dónde vive una variable y organizar datos.', blocks: [
      { p: 'Una variable existe solo dentro del bloque {{{ }}} donde se declara. Es su **alcance**. Las declaradas fuera de toda función son **globales**.' },
      { lab: { code: c`int global = 0;   // Vive siempre; la ven todas las funciones

void contar() {
  int local = 0;       // Nace y muere en cada llamada
  static int fija = 0; // Local, pero recuerda su valor
  local++;
  fija++;
  global++;
  Serial.print(local);
  Serial.print(" ");
  Serial.print(fija);
  Serial.print(" ");
  Serial.println(global);
}

void setup() {
  Serial.begin(9600);
  contar();
  contar();
  contar();
}

void loop() {
}`, parts: [] } },
      { h: 'const y enum: nombres en lugar de números' },
      { p: 'Un programa con {{digitalWrite(7, 1)}} es difícil de leer. Con [[const]] pones nombres a los pines, y con {{enum}} das nombre a una lista de opciones.' },
      { h: 'struct: agrupar datos' },
      { lab: { code: c`struct Sensor {
  int pin;
  int umbral;
};

Sensor luz = {14, 300};

enum Modo { APAGADO, NORMAL, ALARMA };
Modo modo = NORMAL;

void setup() {
  Serial.begin(9600);
  Serial.println(luz.umbral);
  Serial.println(modo);
}

void loop() {
}`, parts: [] } },
      { quiz: [{ q: 'Si declaras int x dentro de setup(), ¿puedes usarlo en loop()?', o: ['Sí', 'No, solo existe dentro de setup()', 'Solo si es const', 'Solo una vez'], a: 1, why: 'Declárala fuera de ambas funciones si la necesitan las dos.' }] }
    ] }
  ] });
})(typeof globalThis !== 'undefined' ? globalThis : this);

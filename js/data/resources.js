/* Biblioteca: enlaces comprobados el 05/11/2026. Los documentos pertenecen a sus autores: se enlazan, no se copian. */
(function (root) {
  root.Pin13Resources = [
    { group: 'PDF técnicos oficiales', note: 'Para consultar datos exactos. Están en inglés.', items: [
      ['Ficha técnica del Arduino UNO R3', 'https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf', 'PDF', 'Especificaciones, alimentación y conectores.'],
      ['Mapa completo de pines del UNO R3', 'https://docs.arduino.cc/resources/pinouts/A000066-full-pinout.pdf', 'PDF', 'Una página para imprimir y tener a mano.'],
      ['Esquema electrónico del UNO R3', 'https://docs.arduino.cc/resources/schematics/A000066-schematics.pdf', 'PDF', 'Para saber cómo está construida la placa.'],
      ['Ficha técnica del UNO R4 Minima', 'https://docs.arduino.cc/resources/datasheets/ABX00080-datasheet.pdf', 'PDF', 'Si das el salto a la nueva generación.'],
      ['Hoja de datos del ATmega328P (Microchip)', 'https://ww1.microchip.com/downloads/aemDocuments/documents/MCU08/ProductDocuments/DataSheets/ATmega48A-PA-88A-PA-168A-PA-328-P-DS-DS40002061B.pdf', 'PDF', 'El manual completo del chip: registros, temporizadores, consumo. Avanzado.']
    ] },
    { group: 'Guías en español', note: 'Para aprender con más ejemplos y montajes.', items: [
      ['Guía de Inventores SparkFun v3.0', 'https://www.electronicaembajadores.com/datos/pdf1/lc/lca1/lca1ks3.pdf', 'PDF', 'Circuitos guiados paso a paso. Traducción al español alojada por una tienda de electrónica.'],
      ['Tutoriales de Luis Llamas', 'https://www.luisllamas.es/tutoriales-arduino/', 'Web', 'Sensores y módulos explicados en detalle.'],
      ['Prometec', 'https://www.prometec.net/', 'Web', 'Cursos y tutoriales de Arduino y electrónica.'],
      ['Aprendiendo Arduino', 'https://aprendiendoarduino.wordpress.com/', 'Web', 'Material de cursos sobre programación y electrónica.'],
      ['Programar Fácil', 'https://www.programarfacil.com/', 'Web', 'Artículos prácticos para principiantes.']
    ] },
    { group: 'Documentación oficial', note: 'La referencia definitiva. En inglés; tu navegador puede traducirla.', items: [
      ['Referencia del lenguaje', 'https://docs.arduino.cc/language-reference/', 'Web', 'Todas las funciones, con su sintaxis.'],
      ['Primeros pasos con Arduino', 'https://docs.arduino.cc/learn/starting-guide/getting-started-arduino/', 'Web', 'Conceptos fundamentales.'],
      ['Ejemplos incluidos en el IDE', 'https://docs.arduino.cc/built-in-examples/', 'Web', 'Cada ejemplo con su circuito y código.'],
      ['Centro de aprendizaje', 'https://docs.arduino.cc/learn/', 'Web', 'Artículos sobre electrónica, comunicación y programación.'],
      ['Guía de memoria', 'https://docs.arduino.cc/learn/programming/memory-guide/', 'Web', 'Flash, SRAM y EEPROM en detalle.'],
      ['Guía de I2C', 'https://docs.arduino.cc/learn/communication/wire/', 'Web', 'El protocolo y la librería Wire.'],
      ['Guía de SPI', 'https://docs.arduino.cc/learn/communication/spi/', 'Web', 'Conexiones y funcionamiento.'],
      ['Crear tu propia librería', 'https://docs.arduino.cc/learn/contributions/arduino-creating-library-guide/', 'Web', 'Paso a paso.'],
      ['Página de hardware del UNO R3', 'https://docs.arduino.cc/hardware/uno-rev3/', 'Web', 'Documentación de la placa.'],
      ['UNO R4 Minima: guía rápida', 'https://docs.arduino.cc/tutorials/uno-r4-minima/cheat-sheet', 'Web', 'Diferencias y funciones nuevas.'],
      ['Arduino IDE', 'https://docs.arduino.cc/software/ide/', 'Web', 'Manual del entorno.'],
      ['Descargar el IDE', 'https://www.arduino.cc/en/software/', 'Web', 'Windows, macOS y Linux.']
    ] },
    { group: 'Practicar sin placa', note: 'Simuladores en línea más completos que el laboratorio de esta app.', items: [
      ['Wokwi', 'https://wokwi.com/', 'Web', 'Simula Arduino y ESP32 con cientos de componentes.'],
      ['Tinkercad Circuits', 'https://www.tinkercad.com/circuits', 'Web', 'Monta circuitos en una protoboard virtual.']
    ] },
    { group: 'Comunidad y proyectos', note: '', items: [
      ['Foro oficial de Arduino', 'https://forum.arduino.cc/', 'Web', 'Tiene secciones por idioma, incluido el español.'],
      ['Project Hub', 'https://projecthub.arduino.cc/', 'Web', 'Proyectos de la comunidad.'],
      ['Adafruit Learn', 'https://learn.adafruit.com/category/arduino', 'Web', 'Tutoriales muy cuidados, en inglés.'],
      ['Random Nerd Tutorials', 'https://randomnerdtutorials.com/', 'Web', 'Referente en ESP32, en inglés.'],
      ['Last Minute Engineers', 'https://lastminuteengineers.com/electronics/arduino-projects/', 'Web', 'Módulos explicados con gran detalle, en inglés.'],
      ['Nick Gammon: interrupciones', 'https://www.gammon.com.au/interrupts', 'Web', 'Lo que recomienda la propia documentación de Arduino. En inglés.'],
      ['Librerías oficiales en GitHub', 'https://github.com/arduino-libraries', 'Web', 'El código fuente de Servo, LiquidCrystal y otras.'],
      ['PlatformIO', 'https://docs.platformio.org/', 'Web', 'Un entorno profesional, para cuando el IDE se te quede corto.']
    ] }
  ];
  root.Pin13Books = [
    ['Aprende electrónica con Arduino', 'Jody Culkin y Eric Hagan · Marcombo, en español', 'Guía ilustrada para principiantes.'],
    ['Arduino: Guía práctica de fundamentos y simulación', 'Ra-Ma, en español', 'Fundamentos y simulación.'],
    ['Getting Started with Arduino', 'Massimo Banzi y Michael Shiloh · Make', 'La introducción de uno de los creadores de Arduino.'],
    ['Arduino Cookbook', 'Michael Margolis y otros · O’Reilly', 'Cientos de recetas. Ideal como consulta.'],
    ['Exploring Arduino', 'Jeremy Blum · Wiley', 'Proyectos con más profundidad técnica.']
  ];
  root.Pin13Glossary = [
    ['ADC', 'Conversor analógico-digital: convierte un voltaje en un número.'], ['Ánodo / cátodo', 'Patas positiva y negativa de un LED o diodo.'], ['Baudio', 'Unidad de velocidad de comunicación serie. 9600 baudios son unos 960 caracteres por segundo.'],
    ['Bootloader', 'Pequeño programa de fábrica que permite cargar tu código por USB.'], ['Bit / byte', 'Un bit es un 0 o 1. Un byte son 8 bits.'], ['Búfer', 'Memoria temporal donde esperan los datos.'],
    ['Compilar', 'Traducir tu código a instrucciones que entiende el chip.'], ['Desbordamiento', 'Cuando un número supera el máximo de su tipo y da la vuelta.'], ['Driver', 'Circuito que entrega la potencia que un pin no puede dar.'],
    ['EEPROM', 'Memoria que conserva datos sin energía.'], ['Flanco', 'El instante en que una señal cambia de nivel: de subida o de bajada.'], ['Flash', 'Memoria donde se guarda tu programa.'],
    ['Flotante (pin)', 'Pin de entrada sin conexión: lee valores al azar.'], ['GND', 'Tierra: la referencia de 0 V.'], ['Histéresis', 'Margen entre dos umbrales para evitar cambios constantes cerca del límite.'],
    ['I2C', 'Bus de dos cables para conectar muchos dispositivos.'], ['ISR', 'Función que se ejecuta como respuesta a una interrupción.'], ['Librería', 'Código reutilizable para una tarea concreta.'],
    ['Microcontrolador', 'Chip con procesador, memoria y entradas y salidas.'], ['Pull-up / pull-down', 'Resistencia que fija un pin en alto o en bajo cuando nada lo conecta.'], ['PWM', 'Encender y apagar rápido para simular un voltaje intermedio.'],
    ['Rebote', 'Oscilación breve al cerrar un contacto mecánico.'], ['Shield', 'Placa que se conecta encima de Arduino para añadirle funciones.'], ['Sketch', 'Un programa de Arduino.'],
    ['SPI', 'Bus rápido de cuatro cables.'], ['SRAM', 'Memoria donde viven las variables; se borra al apagar.'], ['UART', 'Comunicación serie por dos cables: TX y RX.']
  ];
})(typeof globalThis !== 'undefined' ? globalThis : this);

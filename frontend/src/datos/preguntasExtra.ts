import type { DificultadPregunta, PreguntaEstudio } from "../tipos";

// ---------------------------------------------------------------------------
// Banco ampliado (mock). Las pruebas pueden pedir hasta 25 preguntas con
// distintos perfiles de dificultad, así que cada tema necesita un banco mayor.
// Se suma al banco base de questions.ts sin modificarlo.
// ---------------------------------------------------------------------------

type D = DificultadPregunta;
const L = ["a", "b", "c", "d"];

function mc(idTema: string, n: number, dificultad: D, enunciado: string, opc: [string, string, string, string], correcta: 0 | 1 | 2 | 3, explicacion: string): PreguntaEstudio {
  return {
    id: `${idTema}-x${n}`,
    idTema,
    enunciado,
    tipo: "opcion-multiple",
    dificultad,
    opciones: opc.map((etiqueta, i) => ({ id: L[i], etiqueta })),
    idOpcionCorrecta: L[correcta],
    explicacion,
  };
}

function tf(idTema: string, n: number, dificultad: D, enunciado: string, verdad: boolean, explicacion: string): PreguntaEstudio {
  return {
    id: `${idTema}-x${n}`,
    idTema,
    enunciado,
    tipo: "verdadero-falso",
    dificultad,
    opciones: [
      { id: "v", etiqueta: "Verdadero" },
      { id: "f", etiqueta: "Falso" },
    ],
    idOpcionCorrecta: verdad ? "v" : "f",
    explicacion,
  };
}

/** Construye el banco de un tema numerando las preguntas de forma estable. */
function banco(idTema: string, construir: Array<(t: string, n: number) => PreguntaEstudio>): PreguntaEstudio[] {
  return construir.map((fn, i) => fn(idTema, i + 1));
}

const m = mc;

export const bancoPreguntasExtra: Record<string, PreguntaEstudio[]> = {
  // ------------------------------------------------------------------ 1 · Circulatorio
  "1": banco("1", [
    (t, n) => m(t, n, "facil", "¿Cómo se llaman los vasos que llevan la sangre desde el corazón hacia el cuerpo?", ["Arterias", "Venas", "Capilares", "Vasos linfáticos"], 0, "Las arterias conducen la sangre que sale del corazón; las venas la devuelven."),
    (t, n) => tf(t, n, "facil", "Los glóbulos rojos transportan oxígeno gracias a la hemoglobina.", true, "La hemoglobina es la proteína de los eritrocitos que se une al oxígeno."),
    (t, n) => m(t, n, "facil", "¿Cuántas cavidades tiene el corazón humano?", ["Dos", "Tres", "Cuatro", "Cinco"], 2, "Tiene dos aurículas y dos ventrículos."),
    (t, n) => m(t, n, "facil", "¿Qué órgano es el centro del sistema circulatorio?", ["Pulmón", "Corazón", "Hígado", "Riñón"], 1, "El corazón impulsa la sangre por todo el organismo."),
    (t, n) => tf(t, n, "facil", "Los capilares son los vasos sanguíneos de pared más delgada.", true, "Su pared de una sola capa de células permite el intercambio de gases y nutrientes."),
    (t, n) => m(t, n, "media", "¿Qué válvula separa la aurícula izquierda del ventrículo izquierdo?", ["Tricúspide", "Mitral", "Pulmonar", "Aórtica"], 1, "La válvula mitral (bicúspide) regula el paso entre la aurícula y el ventrículo izquierdos."),
    (t, n) => m(t, n, "media", "¿Qué vasos llevan sangre oxigenada desde los pulmones hasta el corazón?", ["Arteria pulmonar", "Venas pulmonares", "Vena cava superior", "Aorta"], 1, "Las venas pulmonares son la excepción: son venas que transportan sangre rica en oxígeno."),
    (t, n) => m(t, n, "media", "¿Qué componente de la sangre participa principalmente en la coagulación?", ["Plaquetas", "Glóbulos rojos", "Linfocitos", "Hemoglobina"], 0, "Las plaquetas forman el tapón inicial y activan la cascada de coagulación."),
    (t, n) => m(t, n, "media", "¿Cuál es la arteria más grande del cuerpo humano?", ["Carótida", "Aorta", "Arteria pulmonar", "Femoral"], 1, "La aorta nace en el ventrículo izquierdo y reparte sangre a todo el cuerpo."),
    (t, n) => tf(t, n, "media", "La arteria pulmonar transporta sangre pobre en oxígeno hacia los pulmones.", true, "Es la excepción entre las arterias: lleva sangre desoxigenada para que se oxigene."),
    (t, n) => m(t, n, "media", "¿Cuál es la función de las válvulas de las venas?", ["Producir glóbulos rojos", "Aumentar la presión arterial", "Evitar el retroceso de la sangre", "Filtrar toxinas"], 2, "Aseguran que la sangre avance hacia el corazón, sobre todo en las extremidades."),
    (t, n) => m(t, n, "media", "¿Qué sangre recibe la aurícula derecha?", ["Oxigenada de los pulmones", "Pobre en oxígeno proveniente del cuerpo", "Oxigenada de la aorta", "Solo plasma"], 1, "Las venas cavas desembocan en la aurícula derecha con sangre desoxigenada."),
    (t, n) => m(t, n, "dificil", "¿Qué estructura actúa como marcapasos natural del corazón?", ["Nodo auriculoventricular", "Nodo sinoauricular", "Haz de His", "Fibras de Purkinje"], 1, "El nodo sinoauricular genera el impulso eléctrico que inicia cada latido."),
    (t, n) => m(t, n, "dificil", "¿Por qué la pared del ventrículo izquierdo es más gruesa que la del derecho?", ["Porque almacena más sangre", "Porque debe vencer la mayor resistencia de la circulación sistémica", "Porque contiene el marcapasos", "Porque filtra la sangre"], 1, "Impulsa la sangre a todo el cuerpo, lo que exige más presión que la circulación pulmonar."),
    (t, n) => m(t, n, "dificil", "¿Cuál es el orden correcto del recorrido de la sangre desde la vena cava hasta la aorta?", ["Aurícula der. → ventrículo der. → pulmones → aurícula izq. → ventrículo izq.", "Aurícula izq. → ventrículo izq. → pulmones → aurícula der. → ventrículo der.", "Ventrículo der. → aurícula der. → pulmones → ventrículo izq. → aurícula izq.", "Aurícula der. → aurícula izq. → pulmones → ventrículo der. → ventrículo izq."], 0, "La sangre pasa por el corazón derecho, se oxigena en los pulmones y vuelve al corazón izquierdo."),
    (t, n) => m(t, n, "dificil", "Si aumenta la resistencia periférica y el gasto cardíaco se mantiene, ¿qué ocurre con la presión arterial?", ["Aumenta", "Disminuye", "Se mantiene igual", "Se anula"], 0, "La presión arterial es el producto del gasto cardíaco por la resistencia periférica."),
    (t, n) => m(t, n, "dificil", "¿Qué es la hematosis?", ["La formación de glóbulos rojos", "El intercambio de gases entre alvéolos y sangre", "La coagulación de la sangre", "La contracción del ventrículo"], 1, "En los alvéolos la sangre libera CO₂ y capta O₂."),
  ]),

  // ------------------------------------------------------------------ 2 · Revolución Francesa
  "2": banco("2", [
    (t, n) => m(t, n, "facil", "¿En qué año comenzó la Revolución Francesa?", ["1776", "1789", "1799", "1815"], 1, "La Revolución se inicia en 1789 con los Estados Generales y la toma de la Bastilla."),
    (t, n) => m(t, n, "facil", "¿Qué rey francés fue depuesto y ejecutado durante la Revolución?", ["Luis XIV", "Luis XV", "Luis XVI", "Carlos X"], 2, "Luis XVI fue guillotinado en enero de 1793."),
    (t, n) => tf(t, n, "facil", "La toma de la Bastilla ocurrió el 14 de julio de 1789.", true, "Es la fecha que hoy se celebra como fiesta nacional francesa."),
    (t, n) => m(t, n, "facil", "¿Qué lema resume los ideales de la Revolución Francesa?", ["Libertad, igualdad, fraternidad", "Dios, patria y rey", "Orden y progreso", "Paz, pan y tierra"], 0, "Libertad, igualdad y fraternidad se convirtió en el lema de la República."),
    (t, n) => m(t, n, "facil", "¿Qué estamento social representaba al clero?", ["Primer Estado", "Segundo Estado", "Tercer Estado", "Cuarto Estado"], 0, "El Primer Estado era el clero, el Segundo la nobleza y el Tercero el resto del pueblo."),
    (t, n) => tf(t, n, "facil", "La Revolución Francesa puso fin a la monarquía absoluta en Francia.", true, "Primero dio paso a una monarquía constitucional y luego a la República."),
    (t, n) => m(t, n, "media", "¿Qué asamblea formaron los representantes del Tercer Estado en junio de 1789?", ["Asamblea Nacional", "Convención", "Directorio", "Consulado"], 0, "Se proclamaron Asamblea Nacional al considerarse los verdaderos representantes de la nación."),
    (t, n) => m(t, n, "media", "¿Qué reunión convocó Luis XVI en 1789 ante la crisis financiera?", ["Los Estados Generales", "El Consejo de Regencia", "La Convención", "El Congreso de Viena"], 0, "Los Estados Generales no se reunían desde 1614."),
    (t, n) => m(t, n, "media", "¿Qué instrumento se asocia simbólicamente al periodo del Terror?", ["La horca", "La guillotina", "El cañón", "La hoguera"], 1, "La guillotina se utilizó como método de ejecución oficial."),
    (t, n) => m(t, n, "media", "¿Qué grupo político, el más radical, lideró Robespierre?", ["Girondinos", "Jacobinos", "Realistas", "Fuldenses"], 1, "Los jacobinos impulsaron las medidas más radicales de la etapa republicana."),
    (t, n) => tf(t, n, "media", "La Declaración de los Derechos del Hombre y del Ciudadano se aprobó en agosto de 1789.", true, "Fue aprobada por la Asamblea Nacional Constituyente el 26 de agosto."),
    (t, n) => m(t, n, "media", "¿Qué fue el Directorio?", ["Un gobierno de cinco directores entre 1795 y 1799", "Un tribunal revolucionario", "Un ejército de voluntarios", "Un impuesto sobre la sal"], 0, "Sucedió a la Convención y fue derrocado por Napoleón."),
    (t, n) => m(t, n, "media", "¿Qué pensador ilustrado defendió la separación de poderes?", ["Voltaire", "Montesquieu", "Diderot", "Descartes"], 1, "Montesquieu la planteó en «El espíritu de las leyes»."),
    (t, n) => m(t, n, "dificil", "¿Qué acontecimiento de julio de 1794 puso fin al gobierno de Robespierre?", ["El golpe de Termidor", "La huida a Varennes", "El 18 de Brumario", "La toma de las Tullerías"], 0, "Robespierre fue arrestado y guillotinado tras el golpe de 9 de Termidor."),
    (t, n) => m(t, n, "dificil", "¿Qué hecho de 1799 puso fin al Directorio y llevó a Napoleón al poder?", ["El golpe del 18 de Brumario", "El Terror", "La Constitución de 1791", "El Congreso de Viena"], 0, "Napoleón derrocó al Directorio y estableció el Consulado."),
    (t, n) => m(t, n, "dificil", "¿Qué intento de la familia real en 1791 desacreditó a la monarquía?", ["La huida a Varennes", "La toma de la Bastilla", "La abdicación voluntaria", "La guerra contra Inglaterra"], 0, "El rey fue detenido al intentar huir del país, lo que erosionó su legitimidad."),
    (t, n) => m(t, n, "dificil", "¿Qué medida de 1790 subordinó la Iglesia francesa al Estado?", ["Constitución Civil del Clero", "Concordato de 1801", "Código Napoleónico", "Edicto de Nantes"], 0, "Obligó al clero a jurar lealtad al Estado y provocó una profunda división."),
    (t, n) => tf(t, n, "dificil", "La Constitución de 1791 estableció una monarquía constitucional.", true, "Limitó los poderes del rey y estableció una Asamblea Legislativa."),
    (t, n) => m(t, n, "dificil", "¿Qué conflicto externo contribuyó a radicalizar la Revolución desde 1792?", ["Las guerras contra Austria y Prusia", "La guerra de los Treinta Años", "La guerra de Sucesión española", "La guerra de Crimea"], 0, "La guerra reforzó el temor a la contrarrevolución y la presión sobre el rey."),
  ]),

  // ------------------------------------------------------------------ 3 · POO
  "3": banco("3", [
    (t, n) => m(t, n, "facil", "¿Qué es un objeto en programación orientada a objetos?", ["Una instancia de una clase", "Un tipo de variable numérica", "Un archivo del proyecto", "Un error de compilación"], 0, "Un objeto es una instancia concreta creada a partir de una clase."),
    (t, n) => tf(t, n, "facil", "Un atributo es una característica o dato que describe a un objeto.", true, "Los atributos almacenan el estado del objeto."),
    (t, n) => m(t, n, "facil", "¿Qué palabra clave se usa en Java para crear un objeto nuevo?", ["create", "new", "make", "init"], 1, "El operador new reserva memoria e invoca al constructor."),
    (t, n) => tf(t, n, "facil", "Un método define un comportamiento que un objeto puede realizar.", true, "Los métodos son las operaciones asociadas a una clase."),
    (t, n) => m(t, n, "facil", "¿Cuál de estos lenguajes es orientado a objetos?", ["Java", "HTML", "CSS", "SQL"], 0, "Java está diseñado alrededor de clases y objetos."),
    (t, n) => m(t, n, "facil", "¿Qué significa «instanciar» una clase?", ["Eliminarla", "Crear un objeto a partir de ella", "Heredar de otra clase", "Compilarla"], 1, "Instanciar es crear un objeto concreto basado en la plantilla de la clase."),
    (t, n) => m(t, n, "media", "¿Qué modificador de acceso restringe un atributo a la propia clase?", ["public", "protected", "private", "static"], 2, "private impide el acceso directo desde fuera de la clase."),
    (t, n) => m(t, n, "media", "¿Qué es un constructor?", ["Un método especial que inicializa un objeto al crearlo", "Una clase abstracta", "Un atributo estático", "Un tipo de interfaz"], 0, "Se ejecuta automáticamente al instanciar y deja el objeto en un estado válido."),
    (t, n) => m(t, n, "media", "¿Qué palabra clave de Java se usa para heredar de otra clase?", ["implements", "extends", "inherits", "super"], 1, "extends establece la relación de herencia entre clases."),
    (t, n) => m(t, n, "media", "¿Qué permite la sobrecarga de métodos?", ["Varios métodos con el mismo nombre y distintos parámetros", "Redefinir un método en la subclase", "Ocultar atributos", "Crear clases anónimas"], 0, "La firma (parámetros) distingue a cada versión del método."),
    (t, n) => m(t, n, "media", "¿Qué es una clase abstracta?", ["Una clase que no puede instanciarse directamente", "Una clase sin atributos", "Una clase con un solo método", "Una clase privada"], 0, "Sirve de base común y puede declarar métodos sin implementar."),
    (t, n) => tf(t, n, "media", "Una subclase puede acceder directamente a los atributos privados de su superclase.", false, "Los atributos private no son visibles en la subclase; se usan getters o protected."),
    (t, n) => m(t, n, "media", "¿Qué método se usa habitualmente para leer un atributo privado?", ["Constructor", "Getter", "Destructor", "Main"], 1, "Un getter expone el valor sin romper el encapsulamiento."),
    (t, n) => m(t, n, "media", "¿Qué expresa la composición entre clases?", ["Una relación «tiene un»", "Una relación «es un»", "Una relación de sobrecarga", "Una relación de importación"], 0, "Un objeto contiene a otros objetos como parte de su estado."),
    (t, n) => m(t, n, "dificil", "¿Qué caracteriza al polimorfismo dinámico (enlace tardío)?", ["El método se decide en compilación", "El método ejecutado depende del tipo real del objeto en tiempo de ejecución", "Solo funciona con métodos estáticos", "Evita el uso de herencia"], 1, "Una referencia de la superclase puede ejecutar la versión de la subclase."),
    (t, n) => m(t, n, "dificil", "¿Qué problema evita Java al no permitir herencia múltiple de clases?", ["El problema del diamante", "El desbordamiento de pila", "La recursión infinita", "La fuga de memoria"], 0, "Evita la ambigüedad cuando dos superclases definen el mismo miembro."),
    (t, n) => m(t, n, "dificil", "¿Qué diferencia clave hay entre interfaz y clase abstracta en Java clásico?", ["Una clase puede implementar varias interfaces pero extender una sola clase", "Las interfaces tienen constructores", "Las clases abstractas no tienen métodos", "No existe diferencia"], 0, "Las interfaces permiten una forma de tipado múltiple sin herencia múltiple de estado."),
    (t, n) => m(t, n, "dificil", "¿Qué principio SOLID indica que una clase debe tener una única razón para cambiar?", ["Responsabilidad única (SRP)", "Abierto/cerrado (OCP)", "Sustitución de Liskov (LSP)", "Inversión de dependencias (DIP)"], 0, "SRP busca clases cohesionadas con una sola responsabilidad."),
    (t, n) => tf(t, n, "dificil", "La sobrecarga de métodos se resuelve en tiempo de compilación.", true, "El compilador elige la versión según los tipos de los argumentos."),
  ]),

  // ------------------------------------------------------------------ 4 · Cálculo diferencial
  "4": banco("4", [
    (t, n) => m(t, n, "facil", "¿Cuál es la derivada de una constante?", ["0", "1", "La constante", "x"], 0, "Una constante no cambia, por lo que su tasa de cambio es cero."),
    (t, n) => m(t, n, "facil", "¿Cuál es la derivada de x²?", ["x", "2x", "x²", "2"], 1, "Por la regla de la potencia: n·xⁿ⁻¹ = 2x."),
    (t, n) => m(t, n, "facil", "¿Cuál es la derivada de 5x?", ["5x", "x", "5", "0"], 2, "La derivada de ax es a."),
    (t, n) => m(t, n, "facil", "¿Qué estudia principalmente el cálculo diferencial?", ["Áreas bajo curvas", "La tasa de cambio de las funciones", "Ecuaciones lineales", "Probabilidades"], 1, "La derivada mide cómo cambia una función respecto a su variable."),
    (t, n) => m(t, n, "facil", "¿Cuál es el límite de f(x) = x + 2 cuando x tiende a 3?", ["3", "2", "5", "No existe"], 2, "Al ser continua, basta evaluar: 3 + 2 = 5."),
    (t, n) => tf(t, n, "facil", "La derivada de una suma es la suma de las derivadas.", true, "Es la propiedad de linealidad de la derivada."),
    (t, n) => m(t, n, "facil", "¿Cuál es la derivada de sen(x)?", ["cos(x)", "−cos(x)", "−sen(x)", "tan(x)"], 0, "d/dx sen(x) = cos(x)."),
    (t, n) => m(t, n, "media", "¿Cuál es la derivada de eˣ?", ["x·eˣ⁻¹", "eˣ", "ln(x)", "1/x"], 1, "La exponencial natural es su propia derivada."),
    (t, n) => m(t, n, "media", "¿Cuál es la derivada de ln(x)?", ["1/x", "x", "eˣ", "ln(x)/x"], 0, "d/dx ln(x) = 1/x para x > 0."),
    (t, n) => m(t, n, "media", "¿Cuál es la regla del producto para (f·g)'?", ["f'·g'", "f'·g + f·g'", "f'·g − f·g'", "f/g'"], 1, "Se deriva cada factor dejando el otro intacto y se suman los resultados."),
    (t, n) => m(t, n, "media", "¿Cuál es la derivada de cos(x)?", ["sen(x)", "−sen(x)", "cos(x)", "−cos(x)"], 1, "d/dx cos(x) = −sen(x)."),
    (t, n) => m(t, n, "media", "Si f'(x) > 0 en un intervalo, ¿qué se concluye?", ["f es decreciente", "f es constante", "f es creciente", "f no es continua"], 2, "Una derivada positiva indica que la función crece."),
    (t, n) => m(t, n, "media", "¿Cuál es la derivada de 3x⁴?", ["12x³", "3x³", "4x³", "12x⁴"], 0, "3 · 4 · x³ = 12x³."),
    (t, n) => m(t, n, "media", "¿Cuánto vale el límite de sen(x)/x cuando x tiende a 0?", ["0", "1", "∞", "No existe"], 1, "Es un límite notable cuyo valor es 1."),
    (t, n) => m(t, n, "dificil", "¿Cuál es la derivada de x·eˣ?", ["eˣ", "x·eˣ", "eˣ(1 + x)", "eˣ + x"], 2, "Por la regla del producto: eˣ + x·eˣ = eˣ(1 + x)."),
    (t, n) => m(t, n, "dificil", "¿Cuál es la regla del cociente para (f/g)'?", ["(f'g − fg')/g²", "(f'g + fg')/g²", "f'/g'", "(fg' − f'g)/g²"], 0, "Numerador: f'g − fg'; denominador: g²."),
    (t, n) => m(t, n, "dificil", "¿Qué es un punto de inflexión?", ["Donde la función se anula", "Donde cambia la concavidad de la función", "Donde la derivada es máxima siempre", "Donde la función es discontinua"], 1, "La segunda derivada cambia de signo en ese punto."),
    (t, n) => m(t, n, "dificil", "¿Cuál es la derivada de sen(x²)?", ["cos(x²)", "2x·cos(x²)", "2x·sen(x²)", "−2x·cos(x²)"], 1, "Regla de la cadena: cos(x²) · 2x."),
    (t, n) => tf(t, n, "dificil", "Si f'(c) = 0, entonces f tiene necesariamente un máximo o un mínimo en c.", false, "Contraejemplo: f(x) = x³ en x = 0 tiene derivada nula y no es extremo."),
    (t, n) => m(t, n, "dificil", "¿Qué enuncia el Teorema del Valor Medio?", ["Existe c con f'(c) = (f(b) − f(a))/(b − a)", "Toda función continua es derivable", "El límite siempre existe", "Toda derivada es continua"], 0, "Hay un punto donde la pendiente tangente iguala la pendiente de la secante."),
  ]),

  // ------------------------------------------------------------------ 5 · Sistema nervioso
  "5": banco("5", [
    (t, n) => m(t, n, "facil", "¿Cuál es la unidad básica del sistema nervioso?", ["La nefrona", "La neurona", "El alvéolo", "El sarcómero"], 1, "La neurona es la célula especializada en transmitir señales."),
    (t, n) => tf(t, n, "facil", "El encéfalo forma parte del sistema nervioso central.", true, "El SNC está formado por el encéfalo y la médula espinal."),
    (t, n) => m(t, n, "facil", "¿Dónde se encuentra la médula espinal?", ["Dentro de la columna vertebral", "En el tórax", "En el abdomen", "Bajo la piel del brazo"], 0, "La columna vertebral la protege."),
    (t, n) => m(t, n, "facil", "¿Qué órgano se encarga del pensamiento y la memoria?", ["Cerebro", "Corazón", "Estómago", "Hígado"], 0, "La corteza cerebral participa en las funciones cognitivas."),
    (t, n) => tf(t, n, "facil", "Los nervios forman parte del sistema nervioso periférico.", true, "El SNP conecta el SNC con el resto del cuerpo."),
    (t, n) => m(t, n, "facil", "¿Cuántos pares de nervios craneales tiene el ser humano?", ["8", "10", "12", "31"], 2, "Son 12 pares; los 31 pares corresponden a nervios espinales."),
    (t, n) => m(t, n, "facil", "¿Qué parte de la neurona recibe las señales de otras células?", ["Dendritas", "Axón", "Vaina de mielina", "Terminal axónico"], 0, "Las dendritas son prolongaciones receptoras."),
    (t, n) => m(t, n, "media", "¿Qué parte de la neurona conduce el impulso lejos del soma?", ["Dendrita", "Axón", "Núcleo", "Membrana basal"], 1, "El axón transmite el potencial de acción hacia otras células."),
    (t, n) => m(t, n, "media", "¿Qué cubre los axones y acelera la conducción nerviosa?", ["Vaina de mielina", "Plasma", "Colágeno", "Queratina"], 0, "La mielina permite la conducción saltatoria del impulso."),
    (t, n) => m(t, n, "media", "¿Qué parte del encéfalo coordina el equilibrio y los movimientos finos?", ["Cerebelo", "Tálamo", "Hipófisis", "Bulbo raquídeo"], 0, "El cerebelo integra información para el control motor."),
    (t, n) => m(t, n, "media", "¿Qué división del sistema autónomo favorece el reposo y la digestión?", ["Simpática", "Parasimpática", "Somática", "Entérica motora"], 1, "El parasimpático conserva energía y activa funciones digestivas."),
    (t, n) => m(t, n, "media", "¿Qué son los neurotransmisores?", ["Mensajeros químicos que cruzan la sinapsis", "Vainas que aíslan axones", "Células de soporte", "Vasos del encéfalo"], 0, "Transmiten la señal de una neurona a la siguiente."),
    (t, n) => m(t, n, "media", "¿Qué estructura regula funciones vitales como la respiración y el ritmo cardíaco?", ["Bulbo raquídeo", "Lóbulo frontal", "Cerebelo", "Corteza visual"], 0, "El bulbo raquídeo controla funciones autónomas esenciales."),
    (t, n) => m(t, n, "media", "¿Qué lóbulo cerebral se asocia principalmente con la visión?", ["Frontal", "Parietal", "Temporal", "Occipital"], 3, "La corteza visual primaria está en el lóbulo occipital."),
    (t, n) => tf(t, n, "media", "Las neuronas sensitivas llevan información desde los receptores hacia el sistema nervioso central.", true, "Son las neuronas aferentes."),
    (t, n) => m(t, n, "dificil", "¿Qué ión entra a la neurona durante la despolarización del potencial de acción?", ["Na⁺", "K⁺", "Cl⁻", "Ca²⁺ exclusivamente"], 0, "La entrada de sodio invierte la polaridad de la membrana."),
    (t, n) => m(t, n, "dificil", "¿Qué estructura actúa como relevo de la información sensorial hacia la corteza?", ["Tálamo", "Cerebelo", "Médula espinal", "Hipocampo"], 0, "Casi toda la información sensorial pasa por el tálamo antes de llegar a la corteza."),
    (t, n) => m(t, n, "dificil", "¿Qué células gliales producen la mielina en el sistema nervioso central?", ["Células de Schwann", "Oligodendrocitos", "Astrocitos", "Microglía"], 1, "En el SNP la mielina la forman las células de Schwann."),
    (t, n) => m(t, n, "dificil", "¿Qué neurotransmisor activa la contracción muscular en la unión neuromuscular?", ["Dopamina", "Serotonina", "Acetilcolina", "GABA"], 2, "La acetilcolina se une a receptores de la fibra muscular."),
    (t, n) => m(t, n, "dificil", "¿Cuál es una función principal del hipotálamo?", ["Coordinar el equilibrio", "Regular homeostasis como temperatura, hambre y sed", "Almacenar recuerdos a largo plazo", "Procesar la visión"], 1, "Vincula el sistema nervioso con el endocrino a través de la hipófisis."),
    (t, n) => tf(t, n, "dificil", "El potencial de acción sigue la ley del «todo o nada».", true, "Si se supera el umbral se produce completo; si no, no se produce."),
  ]),
};

import type { TopicSummary } from "../types";

export const summaries: Record<string, TopicSummary> = {
  "1": {
    topicId: "1",
    essential: {
      intro:
        "El sistema circulatorio es la red de órganos que transporta sangre, oxígeno, nutrientes y desechos por todo el cuerpo. Comprender cinco conceptos básicos te permite entender casi todo el temario: el corazón como bomba, los vasos como red de transporte, la sangre como medio de intercambio, y los dos circuitos (pulmonar y sistémico) que organizan el recorrido.",
      keyConcepts: [
        { order: 1, term: "Corazón", definition: "Órgano muscular hueco que actúa como bomba, impulsando la sangre mediante contracciones rítmicas (sístole y diástole)." },
        { order: 2, term: "Vasos sanguíneos", definition: "Conductos por los que circula la sangre: arterias (llevan sangre desde el corazón), venas (la devuelven) y capilares (intercambio con los tejidos)." },
        { order: 3, term: "Sangre", definition: "Tejido líquido compuesto por plasma, glóbulos rojos, glóbulos blancos y plaquetas, encargado del transporte de sustancias." },
        { order: 4, term: "Circulación pulmonar", definition: "Trayecto corto entre el corazón y los pulmones, donde la sangre se oxigena." },
        { order: 5, term: "Circulación sistémica", definition: "Trayecto largo que lleva sangre oxigenada desde el corazón a todo el cuerpo y regresa con dióxido de carbono." },
      ],
      relations: [
        "El corazón conecta ambos circuitos: recibe sangre pobre en oxígeno del cuerpo y la envía a los pulmones; recibe sangre oxigenada de los pulmones y la envía al cuerpo.",
        "Las arterias se ramifican en arteriolas y luego en capilares, donde ocurre el intercambio real de gases y nutrientes.",
        "La presión arterial depende de la fuerza de bombeo del corazón y de la resistencia que ofrecen los vasos.",
      ],
    },
    complete: {
      sections: [
        {
          heading: "Anatomía del corazón",
          body: "El corazón humano tiene cuatro cavidades: dos aurículas (superiores) y dos ventrículos (inferiores). Las aurículas reciben sangre y los ventrículos la expulsan hacia las arterias. Válvulas unidireccionales impiden el reflujo entre cavidades.",
          bullets: [
            "Aurícula derecha: recibe sangre venosa del cuerpo por las venas cavas.",
            "Ventrículo derecho: bombea sangre hacia los pulmones por la arteria pulmonar.",
            "Aurícula izquierda: recibe sangre oxigenada de los pulmones por las venas pulmonares.",
            "Ventrículo izquierdo: bombea sangre oxigenada al cuerpo por la aorta; es la cavidad de pared más gruesa.",
          ],
        },
        {
          heading: "El ciclo cardíaco",
          body: "Cada latido comprende dos fases: la sístole, en la que el músculo cardíaco se contrae y expulsa sangre, y la diástole, en la que se relaja y se llena de sangre. Este ciclo se repite entre 60 y 100 veces por minuto en un adulto en reposo.",
        },
        {
          heading: "Composición de la sangre",
          body: "La sangre está formada por plasma (aproximadamente 55%) y elementos formes (45%): glóbulos rojos (eritrocitos), glóbulos blancos (leucocitos) y plaquetas.",
          bullets: [
            "Eritrocitos: transportan oxígeno gracias a la hemoglobina.",
            "Leucocitos: participan en la respuesta inmunitaria.",
            "Plaquetas: intervienen en la coagulación.",
            "Plasma: agua, proteínas, sales minerales, hormonas y productos de desecho.",
          ],
        },
        {
          heading: "Circulación mayor y menor",
          body: "La circulación menor (o pulmonar) transporta sangre del ventrículo derecho a los pulmones y de vuelta a la aurícula izquierda, permitiendo el intercambio de dióxido de carbono por oxígeno. La circulación mayor (o sistémica) lleva sangre oxigenada desde el ventrículo izquierdo a todos los tejidos del cuerpo y devuelve sangre desoxigenada a la aurícula derecha.",
        },
        {
          heading: "Regulación de la presión arterial",
          body: "La presión arterial se mide en dos valores: la presión sistólica (durante la contracción) y la diastólica (durante la relajación). Factores como el volumen sanguíneo, la elasticidad de las arterias y el sistema nervioso autónomo influyen en su regulación.",
        },
      ],
    },
  },
  "2": {
    topicId: "2",
    essential: {
      intro:
        "La Revolución Francesa (1789-1799) transformó el sistema político y social de Francia, poniendo fin al Antiguo Régimen. Cinco ideas permiten entender el proceso: la crisis del absolutismo, la toma de la Bastilla, la Declaración de los Derechos del Hombre, el ascenso del Terror y la llegada de Napoleón.",
      keyConcepts: [
        { order: 1, term: "Antiguo Régimen", definition: "Sistema social y político previo a 1789, basado en la monarquía absoluta y la división en tres estamentos." },
        { order: 2, term: "Toma de la Bastilla", definition: "Asalto popular a la prisión-fortaleza de París el 14 de julio de 1789, símbolo del inicio de la revolución." },
        { order: 3, term: "Declaración de los Derechos del Hombre", definition: "Documento de agosto de 1789 que proclamó la libertad, igualdad y soberanía nacional." },
        { order: 4, term: "El Terror", definition: "Período de 1793-1794 marcado por la represión política bajo el gobierno de Robespierre y el Comité de Salvación Pública." },
        { order: 5, term: "Napoleón Bonaparte", definition: "General que tomó el poder en 1799 mediante el golpe de Estado del 18 de Brumario, cerrando el período revolucionario." },
      ],
      relations: [
        "La crisis financiera y las malas cosechas agravaron el descontento popular que desembocó en la toma de la Bastilla.",
        "La Declaración de los Derechos del Hombre sentó las bases ideológicas que después se radicalizaron durante el Terror.",
        "La inestabilidad política tras el Terror facilitó el ascenso de una figura militar fuerte como Napoleón.",
      ],
    },
    complete: {
      sections: [
        {
          heading: "Causas de la revolución",
          body: "Francia atravesaba una profunda crisis financiera producto de guerras costosas y un sistema fiscal injusto que exoneraba a la nobleza y el clero. A esto se sumaron malas cosechas, el hambre y la difusión de las ideas ilustradas sobre soberanía popular y separación de poderes.",
        },
        {
          heading: "Los Estados Generales y la Asamblea Nacional",
          body: "En mayo de 1789 Luis XVI convocó a los Estados Generales para resolver la crisis fiscal. El Tercer Estado, representando a la mayoría de la población, se proclamó Asamblea Nacional, iniciando la ruptura con el orden estamental.",
        },
        {
          heading: "1789: el estallido revolucionario",
          body: "El 14 de julio, el pueblo de París asaltó la Bastilla en busca de armas, un hecho que se convirtió en símbolo de la revolución. En agosto se abolieron los privilegios feudales y se aprobó la Declaración de los Derechos del Hombre y del Ciudadano.",
          bullets: [
            "Abolición de los privilegios feudales (4 de agosto de 1789).",
            "Declaración de los Derechos del Hombre y del Ciudadano (26 de agosto de 1789).",
            "Constitución civil del clero (1790).",
          ],
        },
        {
          heading: "La radicalización y el Terror",
          body: "Tras la ejecución de Luis XVI en 1793, la República se vio amenazada por guerras externas y levantamientos internos. El Comité de Salvación Pública, liderado por Robespierre, impulsó una política de represión conocida como el Terror, que causó miles de ejecuciones.",
        },
        {
          heading: "El Directorio y el ascenso de Napoleón",
          body: "Tras la caída de Robespierre en 1794, el Directorio gobernó con inestabilidad política y económica. En 1799, Napoleón Bonaparte tomó el poder mediante un golpe de Estado, dando paso al Consulado y, más adelante, al Imperio.",
        },
      ],
    },
  },
  "3": {
    topicId: "3",
    essential: {
      intro:
        "La programación orientada a objetos (POO) organiza el software en torno a objetos que combinan datos y comportamiento. Cinco pilares explican la mayoría de sus aplicaciones: clases y objetos, encapsulamiento, herencia, polimorfismo y abstracción.",
      keyConcepts: [
        { order: 1, term: "Clase", definition: "Plantilla que define los atributos y métodos comunes a un conjunto de objetos." },
        { order: 2, term: "Objeto", definition: "Instancia concreta de una clase, con su propio estado interno." },
        { order: 3, term: "Encapsulamiento", definition: "Principio que oculta los detalles internos de un objeto y expone solo lo necesario a través de métodos públicos." },
        { order: 4, term: "Herencia", definition: "Mecanismo que permite que una clase adquiera atributos y métodos de otra clase base." },
        { order: 5, term: "Polimorfismo", definition: "Capacidad de que distintas clases respondan de forma diferente al mismo mensaje o método." },
      ],
      relations: [
        "Una clase actúa como plano y un objeto es la construcción real basada en ese plano.",
        "El encapsulamiento protege el estado interno, mientras que la herencia permite reutilizar comportamiento entre clases relacionadas.",
        "El polimorfismo se apoya en la herencia: una subclase puede redefinir el comportamiento heredado.",
      ],
    },
    complete: {
      sections: [
        {
          heading: "Clases y objetos",
          body: "Una clase describe la estructura (atributos) y el comportamiento (métodos) que tendrán sus instancias. Un objeto es una instancia concreta creada a partir de esa clase, con valores propios para cada atributo.",
        },
        {
          heading: "Encapsulamiento",
          body: "Consiste en restringir el acceso directo a los atributos de un objeto, exponiendo su manipulación mediante métodos públicos (getters y setters). Esto protege la integridad de los datos y reduce el acoplamiento entre componentes.",
        },
        {
          heading: "Herencia",
          body: "Permite crear una nueva clase (subclase) a partir de una clase existente (superclase), heredando sus atributos y métodos. Favorece la reutilización de código y modela relaciones del tipo 'es un'.",
          bullets: [
            "Herencia simple: una subclase hereda de una única superclase.",
            "Herencia múltiple: algunos lenguajes permiten heredar de varias clases (Java no lo permite directamente, pero sí mediante interfaces).",
            "Sobrescritura de métodos: una subclase puede redefinir el comportamiento heredado.",
          ],
        },
        {
          heading: "Polimorfismo",
          body: "Permite que un mismo método se comporte de manera distinta según el objeto que lo invoque. Existen dos formas principales: polimorfismo en tiempo de compilación (sobrecarga de métodos) y en tiempo de ejecución (sobrescritura mediante herencia).",
        },
        {
          heading: "Abstracción",
          body: "Se centra en modelar los aspectos esenciales de un problema, ignorando los detalles irrelevantes. Se implementa mediante clases abstractas e interfaces, que definen un contrato sin especificar toda la implementación.",
        },
      ],
    },
  },
  "4": {
    topicId: "4",
    essential: {
      intro:
        "El cálculo diferencial estudia cómo cambian las funciones. Su idea central es la derivada: una medida instantánea de la razón de cambio. Cinco conceptos son suficientes para comprender la mayoría de los ejercicios: límite, continuidad, derivada, regla de la cadena y aplicaciones de la derivada.",
      keyConcepts: [
        { order: 1, term: "Límite", definition: "Valor al que se aproxima una función cuando su variable se acerca a un punto determinado." },
        { order: 2, term: "Continuidad", definition: "Propiedad de una función cuyo límite en un punto coincide con el valor de la función en ese punto." },
        { order: 3, term: "Derivada", definition: "Razón de cambio instantánea de una función respecto a su variable; geométricamente, la pendiente de la recta tangente." },
        { order: 4, term: "Regla de la cadena", definition: "Método para derivar funciones compuestas, multiplicando las derivadas de cada función involucrada." },
        { order: 5, term: "Aplicaciones de la derivada", definition: "Uso de la derivada para hallar máximos, mínimos, y analizar el crecimiento o decrecimiento de una función." },
      ],
      relations: [
        "La derivada se define formalmente como el límite del cociente incremental cuando el incremento tiende a cero.",
        "Una función debe ser continua en un punto para que exista la posibilidad de que sea derivable en él.",
        "La regla de la cadena extiende el cálculo de derivadas a funciones compuestas, esenciales en modelos más complejos.",
      ],
    },
    complete: {
      sections: [
        {
          heading: "El concepto de límite",
          body: "El límite formaliza la idea de aproximación: describe el valor hacia el cual tiende una función a medida que su variable independiente se acerca a un punto, sin necesidad de que la función esté definida exactamente en ese punto.",
        },
        {
          heading: "Definición de la derivada",
          body: "La derivada de una función f en un punto x se define como el límite del cociente incremental [f(x+h) - f(x)] / h cuando h tiende a 0. Representa la pendiente de la recta tangente a la curva en ese punto.",
        },
        {
          heading: "Reglas básicas de derivación",
          body: "Existen reglas que simplifican el cálculo de derivadas sin recurrir a la definición por límites en cada caso.",
          bullets: [
            "Regla de la potencia: la derivada de x^n es n·x^(n-1).",
            "Regla del producto: (f·g)' = f'·g + f·g'.",
            "Regla del cociente: (f/g)' = (f'·g - f·g') / g².",
            "Regla de la cadena: (f(g(x)))' = f'(g(x))·g'(x).",
          ],
        },
        {
          heading: "Aplicaciones: máximos, mínimos y crecimiento",
          body: "Los puntos donde la derivada se anula (puntos críticos) permiten identificar máximos y mínimos locales de una función. El signo de la derivada indica si la función crece o decrece en un intervalo determinado.",
        },
      ],
    },
  },
  "5": {
    topicId: "5",
    essential: {
      intro:
        "El sistema nervioso coordina las funciones del cuerpo mediante señales eléctricas y químicas. Cinco conceptos permiten entender su organización básica: la neurona, el sistema nervioso central, el sistema nervioso periférico, la sinapsis y los reflejos.",
      keyConcepts: [
        { order: 1, term: "Neurona", definition: "Célula especializada en la transmisión de impulsos nerviosos, compuesta por dendritas, cuerpo celular y axón." },
        { order: 2, term: "Sistema nervioso central (SNC)", definition: "Formado por el encéfalo y la médula espinal; procesa e integra la información." },
        { order: 3, term: "Sistema nervioso periférico (SNP)", definition: "Red de nervios que conecta el SNC con el resto del cuerpo." },
        { order: 4, term: "Sinapsis", definition: "Punto de comunicación entre dos neuronas, donde se transmite la señal mediante neurotransmisores." },
        { order: 5, term: "Reflejo", definition: "Respuesta rápida e involuntaria ante un estímulo, mediada generalmente por la médula espinal." },
      ],
      relations: [
        "El SNC procesa la información que recibe a través del SNP, formado por nervios sensoriales y motores.",
        "La comunicación entre neuronas ocurre en la sinapsis mediante la liberación de neurotransmisores.",
        "Los reflejos permiten respuestas rápidas sin necesidad de que la señal llegue hasta el encéfalo.",
      ],
    },
    complete: {
      sections: [
        {
          heading: "La neurona como unidad funcional",
          body: "Las neuronas son las células responsables de generar y transmitir impulsos nerviosos. Constan de dendritas (reciben señales), un cuerpo celular o soma (contiene el núcleo) y un axón (transmite la señal a otras células).",
        },
        {
          heading: "Sistema nervioso central",
          body: "Compuesto por el encéfalo (cerebro, cerebelo y tronco encefálico) y la médula espinal, el SNC procesa la información sensorial y genera las respuestas motoras y cognitivas.",
        },
        {
          heading: "Sistema nervioso periférico",
          body: "Formado por los nervios craneales y espinales, conecta el SNC con los órganos, músculos y receptores sensoriales. Se divide en sistema somático (control voluntario) y sistema autónomo (funciones involuntarias como la digestión).",
          bullets: [
            "División simpática: prepara al cuerpo para la acción ('lucha o huida').",
            "División parasimpática: favorece el reposo y la digestión.",
          ],
        },
        {
          heading: "La sinapsis y los neurotransmisores",
          body: "La transmisión de información entre neuronas ocurre en la sinapsis, donde un impulso eléctrico provoca la liberación de neurotransmisores (como la dopamina o la serotonina) que se unen a receptores en la neurona siguiente.",
        },
        {
          heading: "Arcos reflejos",
          body: "Un reflejo es una respuesta automática ante un estímulo, como retirar la mano al tocar algo caliente. La señal viaja desde el receptor sensorial hasta la médula espinal y regresa como respuesta motora, sin pasar necesariamente por el encéfalo.",
        },
      ],
    },
  },
};

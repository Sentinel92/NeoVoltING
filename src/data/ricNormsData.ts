import { RicNormRule } from "../types";

export const RIC_NORMS_DATA: RicNormRule[] = [
  {
    num: "RIC N°01",
    title: "Empalmes e Instalaciones de Enlace",
    summary: "Condiciones técnicas de seguridad y ubicación del medidor y caja de empalme.",
    detailText: `Regula los requisitos técnicos para los empalmes y las instalaciones de enlace en baja tensión.
• Debe instalarse en un lugar libremente accesible desde la vía pública en el límite de propiedad.
• El ducto del alimentador desde el medidor hasta el TDA principal debe ser continuo y rígido.
• Exige interruptor de corte general o limitador de potencia según la potencia contratada con la distribuidora (CGE, Enel, Saesa, Chilquinta, etc.).`,
    keyPoints: [
      "Ubicación accesible en deslinde de propiedad.",
      "Conductores de entrada protegidos en tubo rígido.",
      "Conexión a tierra de protección en la caja de empalme."
    ]
  },
  {
    num: "RIC N°02",
    title: "Tableros Eléctricos y Protecciones (TDA)",
    summary: "Requisitos de montaje, espacio, reserva del 25% y marcación del tablero de distribución.",
    detailText: `Especifica el diseño, construcción y ubicación de los Tableros de Distribución de Alumbrado (TDA):
• Altura de montaje: Entre 1,20 m y 1,80 m medidos desde el nivel de piso terminado hasta la arista superior de la cubierta.
• Reserva obligatoria: Espacio físico libre de al menos un 25% de la capacidad de módulos utilizados para ampliaciones futuras.
• Cubierta de protección (Mando y Cubierta): Protección IP40 en interiores e IP65 en intemperie o zonas húmedas.
• Barras de distribución (N y PE): Separadas e identificadas en bornes independientes. Prohibido puentear N y PE dentro del tablero de distribución de la propiedad.
• Cuadro y directorio de circuitos legible grabado o impreso al interior de la puerta.`,
    keyPoints: [
      "25% de módulos libres de reserva obligatoria.",
      "Altura 1.20m a 1.80m sobre piso terminado.",
      "Barra de Neutro (Blanco) y Barra de Tierra PE (Verde) separadas.",
      "IP40 mínimo interior / IP65 exterior."
    ]
  },
  {
    num: "RIC N°03",
    title: "Alimentadores y Subalimentadores",
    summary: "Cálculo de sección de conductores por capacidad de corriente y caída de tensión.",
    detailText: `Regula el cálculo y dimensionamiento de alimentadores desde el empalme/medidor hasta el tablero principal:
• Caída de Tensión Máxima Permitida en Alimentador: Máximo 3.0% de la tensión nominal (6.6V en 220V / 11.4V en 380V).
• Caída de Tensión Total Máxima (Alimentador + Circuito Final): Máximo 5.0%.
• Factor de demanda aplicable según el tipo de edificio y potencia instalada.
• Conductor mínimo en alimentador principal: 4.0 mm² en Cobre (Cu) EVA Libre de Halógenos.`,
    keyPoints: [
      "Máximo 3% caída de tensión en alimentador.",
      "Máximo 5% caída total hasta el centro más alejado.",
      "Sección mínima de cobre: 4.0 mm² para alimentadores principales."
    ]
  },
  {
    num: "RIC N°04",
    title: "Conductores y Canalizaciones (EVA / Conduit / EMT)",
    summary: "Uso obligatorio de cables EVA Libre de Halógenos y código oficial de colores SEC.",
    detailText: `Establece los requisitos para los tipos de cables y canalizaciones:
• Conductores EVA (H07Z1-K / Libre de Halógenos): Obligatorios en todas las edificaciones residenciales, comerciales y lugares de reunión de personas (prohibido cable NYA de PVC tradicional en obra nueva).
• Código Oficial de Colores SEC:
  - Fase L1 / Monofásico: Azul, Negro o Rojo.
  - Neutro N: Blanco.
  - Tierra de Protección PE: Verde o Verde/Amarillo.
• Ocupación máxima de ductos: El total de conductores no debe ocupar más del 40% de la sección transversal interna de la tubería (PVC Conduit o EMT).`,
    keyPoints: [
      "Cable EVA Libre de Halógenos obligatorio en vivienda y comercios.",
      "Fase: Azul/Negro/Rojo | Neutro: Blanco | Tierra PE: Verde.",
      "Máximo 40% de llenado en canalización PVC/EMT."
    ]
  },
  {
    num: "RIC N°05",
    title: "Medidas de Protección contra Tensiones Peligrosas y RCDs",
    summary: "Obligatoriedad de Diferenciales (RCD 30mA) y límite máximo de 3 circuitos por RCD.",
    detailText: `Define las medidas de seguridad contra contactos directos e indirectos:
• Protección Diferencial (RCD) obligatoria con sensibilidad máxima de 30 mA para todos los circuitos de enchufes, baños, cocinas y zonas húmedas.
• Límite Normativo SEC: Se permite un MÁXIMO DE 3 CIRCUITOS asociables a un mismo Interruptor Diferencial.
• Inmunidad: Todos los diferenciales deben ser de sensibilidad 30mA e ininterrumpibles en fallas a tierra.
• Protector de Sobretensión (DPS): Obligatorio en cabecera para prevenir picos atmosféricos o transitorios de red.`,
    keyPoints: [
      "Protección Diferencial de 30mA obligatoria.",
      "MÁXIMO 3 CIRCUITOS por cada Interruptor Diferencial.",
      "Protector contra sobretensiones transitorias (DPS) Categoría II."
    ]
  },
  {
    num: "RIC N°06",
    title: "Puesta a Tierra y Malla de Protección",
    summary: "Resistencia de puesta a tierra, barra Cooperweld y equipotencialidad.",
    detailText: `Establece el diseño e instalación del sistema de puesta a tierra de protección (SPT):
• Valor de Resistencia de Puesta a Tierra recomendado: Inferior a 20 Ohmios (óptimo < 5 Ohmios para protección de equipos electrónicos y RCDs).
• Electrodo mínimo: Barra de acero recubierta en cobre (Cooperweld) de 5/8" x 1.5m o 2.0m de largo con cámara de inspección.
• Uniones enterradas mediante soldadura exotérmica o conectores normados a compresión.`,
    keyPoints: [
      "Resistencia objetivo < 20 Ω.",
      "Barra Cooperweld con cámara de registro e inspección accesible.",
      "Equipotencialidad obligatoria de masas metálicas."
    ]
  },
  {
    num: "RIC N°10",
    title: "Instalaciones de Uso General y Viviendas",
    summary: "Límites de centros por circuito y circuitos dedicados para cargas pesadas.",
    detailText: `Norma específica para proyectos eléctricos en casas, departamentos y locales de uso general:
• Circuitos de Alumbrado: Máximo 12 a 15 centros por circuito. Protección de 1x10A Curva C, cable EVA 1.5 mm².
• Circuitos de Enchufes Generales: Máximo 10 enchufes (monofásicos dobles/triples) por circuito. Protección de 1x16A Curva C, cable EVA 2.5 mm².
• Conexión de Enchufes Múltiples (Dobles / Triples): Deben ser módulos interconectados internamente en fábrica (pletinas de cobre continuas). Se alimentan exclusivamente con 3 conductores de 2.5 mm² (Fase L, Neutro N, Tierra PE) sin puentes de cable externos entre alvéolos.
• Cargas Pesadas (> 1500W / 1.5 kW): Artefactos como Horno Eléctrico, Encimera Inducción/Vitrocerámica, Termo Eléctrico, Aire Acondicionado, Lavadora o Wallbox EV REQUIEREN circuito dedicado independiente con disyuntor individual.
• Enchufes en Cocina y Baños: Ubicación a más de 60cm de la proyección de lavamanos, lavaplatos o duchas.`,
    keyPoints: [
      "Máximo 12-15 centros por cto alumbrado (10A, 1.5mm²).",
      "Enchufes dobles/triples con puenteado interno (solo 3 cables: L, N, PE).",
      "Máximo 10 centros por cto enchufes (16A, 2.5mm²).",
      "Cargas >1500W EXIGEN circuito exclusivo independiente."
    ]
  }
];

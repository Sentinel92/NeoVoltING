import { RicNormRule } from "../types";

export type RicNormItem = RicNormRule;

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
    num: "RIC N°07",
    title: "Instalaciones de Equipos y Motores",
    summary: "Requisitos para conexión de maquinaria, motores, bombas y transformadores.",
    detailText: `Regula la conexión de receptores de fuerza motriz y equipamiento especial:
• Todo motor debe contar con protección contra sobrecargas (relé térmico o guardamotor) y cortocircuitos.
• Exige seccionamiento visible a la vista del operador para mantención segura.
• Compensación de factor de potencia con bancos de condensadores si el FP es inferior a 0.93.`,
    keyPoints: [
      "Protección por guardamotor o relé térmico calibrado a corriente nominal In.",
      "Interruptor de desconexión visible en proximidad del equipo.",
      "Factor de potencia mínimo exigido: 0.93."
    ]
  },
  {
    num: "RIC N°08",
    title: "Sistemas de Emergencia y Autonomía",
    summary: "Generadores, UPS y luminarias de emergencia autónomas.",
    detailText: `Establece exigencias para suministros de respaldo y seguridad:
• Alumbrado de emergencia con autonomía mínima de 90 minutos para evacuación expedita.
• Transferencia automática con enclavamiento mecánico y eléctrico para evitar inyección involuntaria a la red pública.
• Ventilación y canalizaciones resistentes al fuego en salas de generadores.`,
    keyPoints: [
      "Luminarias de emergencia autónomas mín. 90 min.",
      "Enclavamiento mecánico y eléctrico en tablero de transferencia.",
      "Canalizaciones resistentes al fuego en vías de evacuación."
    ]
  },
  {
    num: "RIC N°09",
    title: "Sistemas de Autogeneración (Ley Net Billing)",
    summary: "Inversores solares fotovoltaicos, protecciones anti-isla y empalmes bidireccionales.",
    detailText: `Norma técnica para instalaciones de generación distribuida para autoconsumo:
• Inversores certificados por la SEC con protección anti-isla integrada.
• Interruptor de desconexión rápida accesible para bomberos y personal de distribución.
• Rotulado de advertencia reflectante en tableros: "PELIGRO: INSTALACIÓN CON AUTOGENERACIÓN".`,
    keyPoints: [
      "Inversor con función de desconexión anti-isla certificada.",
      "Disyuntor de corte visible para desconexión de emergencia.",
      "Rotulación de advertencia visible en tablero principal."
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
  },
  {
    num: "RIC N°11",
    title: "Instalaciones Especiales y Locales Húmedos",
    summary: "Piscinas, saunas, recintos médicos y ambientes con riesgo de explosión.",
    detailText: `Regula los requisitos de seguridad en recintos con riesgos particulares:
• Zonas de volumen 0, 1 y 2 en baños y piscinas con protecciones MBTS (Muy Baja Tensión de Seguridad <= 12V AC).
• Diferenciales de alta sensibilidad (10mA o 30mA) y grado IP mínimo IPX4 / IPX7 según zona.
• Conexión equipotencial suplementaria obligatoria en todas las canalizaciones y armaduras metálicas.`,
    keyPoints: [
      "Volúmenes de seguridad y grado IP específico para baños y piscinas.",
      "Transformadores de aislamiento para recintos de cuidado médico.",
      "Equipotencialidad suplementaria en zonas húmedas."
    ]
  },
  {
    num: "RIC N°15",
    title: "Infraestructura de Recarga de Vehículos Eléctricos (EV)",
    summary: "Cargadores Wallbox, canalizaciones dedicadas y protecciones Tipo B / A-EV.",
    detailText: `Especificaciones para la electromovilidad:
• Circuito exclusivo desde el tablero principal con disyuntor dedicado de capacidad según potencia del cargador.
• Interruptor diferencial Clase A con detección de corriente continua de 6mA (Clase B o A-EV).
• Factor de simultaneidad igual a 1.0 para el cálculo de potencia y caída de tensión.`,
    keyPoints: [
      "Circuito exclusivo con factor de simultaneidad 1.0.",
      "Diferencial Tipo B o Clase A con filtro DC 6mA.",
      "Protector de sobretensión DPS obligatorio en tablero."
    ]
  },
  {
    num: "RIC N°19",
    title: "Puesta en Servicio, Pruebas y Certificación TE1",
    summary: "Protocolo de ensayos: aislamiento > 1 MΩ, prueba de disparo RCD y resistencia de tierra.",
    detailText: `Define los ensayos y verificaciones obligatorias previas a la puesta en servicio y trámite TE1:
• Ensayo de resistencia de aislamiento con megóhmetro a 500V DC: Mínimo 1.0 MΩ entre conductores activos y tierra.
• Verificación de disparo de todos los diferenciales con instrumento de prueba de RCD (< 300 ms a 30mA).
• Medición de continuidad del conductor de protección PE en todos los puntos y prueba de resistencia de tierra.`,
    keyPoints: [
      "Resistencia de aislamiento >= 1.0 MΩ a 500V DC.",
      "Prueba de disparo de todos los RCD con telurómetro/probador.",
      "Requisito fundamental para aprobación de Declaración TE1 SEC."
    ]
  }
];

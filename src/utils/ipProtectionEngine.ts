/**
 * IP (Ingress Protection) Degree & Enclosure Protection Engine
 * Standards: IEC 60529 / SEC Pliego Técnico RIC N°02, RIC N°10, RIC N°11 (Instalaciones en Locales Especiales y Exteriores)
 */

import { SectorType } from './technicalSurveyEngine';

export interface IpRatingDefinition {
  ipCode: string;
  solidDigit: number;
  waterDigit: number;
  solidDescription: string;
  waterDescription: string;
  typicalApplications: string[];
}

export interface EnvironmentIpStandard {
  id: string;
  name: string;
  sector: SectorType;
  zoneDescription: string;
  minRequiredIp: string;
  recommendedIp: string;
  ricReference: string;
  riskDescription: string;
  typicalItems: string[];
}

export const IP_SOLID_DIGITS: Record<number, { level: string; description: string }> = {
  0: { level: 'Sin protección', description: 'Ninguna protección contra contacto o penetración de objetos.' },
  1: { level: 'Cuerpos > 50 mm', description: 'Protección contra contacto accidental de mano u objetos de gran tamaño.' },
  2: { level: 'Cuerpos > 12.5 mm', description: 'Protección contra dedos u objetos de tamaño mediano (Estándar interior seco).' },
  3: { level: 'Cuerpos > 2.5 mm', description: 'Protección contra herramientas, alambres gruesos.' },
  4: { level: 'Cuerpos > 1.0 mm', description: 'Protección contra alambres finos, pequeños tornillos y partículas > 1mm.' },
  5: { level: 'Protegido contra polvo', description: 'El polvo puede entrar en cantidad limitada pero no interfiere en el funcionamiento seguro.' },
  6: { level: 'Totalmente estanco al polvo', description: 'Protección total contra la entrada de polvo (vacío continuo).' },
};

export const IP_WATER_DIGITS: Record<number, { level: string; description: string }> = {
  0: { level: 'Sin protección', description: 'Ninguna protección contra líquidos.' },
  1: { level: 'Goteo vertical', description: 'Protección contra gotas de agua que caen verticalmente (condensación leve).' },
  2: { level: 'Goteo inclinado 15°', description: 'Protección contra goteo de agua con inclinación de hasta 15°.' },
  3: { level: 'Agua pulverizada', description: 'Protección contra lluvia o rocío hasta 60° respecto a la vertical.' },
  4: { level: 'Salpicaduras de agua', description: 'Protección contra salpicaduras en todas las direcciones (Ej. Baños zona 2, Logias).' },
  5: { level: 'Chorros de agua', description: 'Protección contra chorros de agua con boquilla (Ej. Mangueras de baja presión, patios).' },
  6: { level: 'Chorros potentes / Olas', description: 'Protección contra chorros fuertes de agua de alta presión o intemperie severa.' },
  7: { level: 'Inmersión temporal', description: 'Inmersión temporal en agua hasta 1 metro durante 30 minutos.' },
  8: { level: 'Inmersión continua', description: 'Inmersión continua y prolongada bajo agua (Bombas sumergibles, piscinas).' },
};

export const ENVIRONMENT_IP_STANDARDS: EnvironmentIpStandard[] = [
  {
    id: 'indoor_dry',
    name: 'Interior Seco Habitual (Dormitorios, Living, Oficinas)',
    sector: 'dormitorios',
    zoneDescription: 'Áreas habitables cerradas, libres de condensación, salpicaduras o vapor.',
    minRequiredIp: 'IP20',
    recommendedIp: 'IP20',
    ricReference: 'RIC N°02 Art. 5 & RIC N°10',
    riskDescription: 'Riesgo bajo de humedad; requiere protección mínima contra contacto directo (IP2X).',
    typicalItems: ['Placas de enchufe modulares estándar', 'Interruptores 9/12', 'Cajas embutidas'],
  },
  {
    id: 'kitchen_counter',
    name: 'Cocina / Mesones de Preparación y Lavaplatos',
    sector: 'cocina_logia',
    zoneDescription: 'Cercanía a grifería de lavaplatos (radio < 0.6m) o áreas con vapores de cocción.',
    minRequiredIp: 'IP44',
    recommendedIp: 'IP44',
    ricReference: 'RIC N°10 Art. 6.2 & RIC N°11',
    riskDescription: 'Salpicaduras continuas de agua al lavar utensilios o acumulación de grasa/vapor húmedo.',
    typicalItems: ['Enchufes con tapa abatible con sello de goma', 'Cajas de derivación estancas'],
  },
  {
    id: 'logia_laundry',
    name: 'Logia / Lavandería / Zona de Lavadora',
    sector: 'cocina_logia',
    zoneDescription: 'Proximidad a tomas de agua, desagües y artefactos con vapor (lavadoras, secadoras).',
    minRequiredIp: 'IP44',
    recommendedIp: 'IP55',
    ricReference: 'RIC N°10 Art. 6.3 & RIC N°11',
    riskDescription: 'Filtraciones o salpicaduras directas durante ciclos de carga/descarga y lavado.',
    typicalItems: ['Enchufes sobrepuestos herméticos con membrana', 'Canalización con prensaestopas'],
  },
  {
    id: 'bathroom_zone0',
    name: 'Baño - Zona 0 (Interior de Tina o Ducha)',
    sector: 'banos',
    zoneDescription: 'Volumen interior de la tina, receptáculo o plato de ducha.',
    minRequiredIp: 'IPX7',
    recommendedIp: 'IP67',
    ricReference: 'RIC N°11 Art. 4.2 (Locales Húmedos y Mojados)',
    riskDescription: 'Inmersión continua/accidental; solo permitida tensión de seguridad MBTS ≤ 12V.',
    typicalItems: ['Solo focos sumergibles MBTS 12V (Prohibidos enchufes o interruptores)'],
  },
  {
    id: 'bathroom_zone1',
    name: 'Baño - Zona 1 (Sobre Tina/Ducha hasta 2.25m)',
    sector: 'banos',
    zoneDescription: 'Plano vertical sobre la tina hasta 2.25m de altura desde el suelo.',
    minRequiredIp: 'IPX5',
    recommendedIp: 'IP65',
    ricReference: 'RIC N°11 Art. 4.3',
    riskDescription: 'Chorros directos de ducha; solo calentadores o extractores con grado IP elevado y RCD 30mA.',
    typicalItems: ['Luminarias LED estancas IP65', 'Extractores de aire protegidos'],
  },
  {
    id: 'bathroom_zone2',
    name: 'Baño - Zona 2 (Radio 0.6m alrededor de Zona 1)',
    sector: 'banos',
    zoneDescription: 'Hasta 0.6m desde el borde de la tina o lavamanos.',
    minRequiredIp: 'IPX4',
    recommendedIp: 'IP44',
    ricReference: 'RIC N°11 Art. 4.4',
    riskDescription: 'Salpicaduras frecuentes de agua desde la ducha o lavamanos.',
    typicalItems: ['Enchufe con tapa IP44 con protección RCD 30mA', 'Lámparas de espejo IP44'],
  },
  {
    id: 'outdoor_sheltered',
    name: 'Exterior Bajo Techo / Terraza Cubierta',
    sector: 'exterior_patio',
    zoneDescription: 'Protegido de lluvia directa pero expuesto a humedad nocturna, polvo y rocío.',
    minRequiredIp: 'IP44',
    recommendedIp: 'IP55',
    ricReference: 'RIC N°10 Art. 7 & RIC N°02',
    riskDescription: 'Condensación ambiental y entrada de partículas en suspensión e insectos.',
    typicalItems: ['Enchufes con tapa abatible', 'Apliques de pared para exterior'],
  },
  {
    id: 'outdoor_exposed',
    name: 'Exterior Intemperie / Patio / Jardín / Fachada',
    sector: 'exterior_patio',
    zoneDescription: 'Expuesto directamente a lluvia, viento, polvo y riego por aspersión.',
    minRequiredIp: 'IP55',
    recommendedIp: 'IP65',
    ricReference: 'RIC N°10 Art. 7.2 & RIC N°11',
    riskDescription: 'Penetración de lluvia torrencial o chorros de manguera con cortocircuito directo.',
    typicalItems: ['Cajas estancas IP65 con prensacable', 'Enchufes industriales o estancos IP66'],
  },
  {
    id: 'parking_ev',
    name: 'Estacionamiento / Lavado Vehicular / Cargador EV',
    sector: 'estacionamiento_acceso',
    zoneDescription: 'Zona de tránsito vehicular, limpieza con manguera o punto de recarga de vehículo eléctrico.',
    minRequiredIp: 'IP54',
    recommendedIp: 'IP65',
    ricReference: 'RIC N°15 (Infraestructura de Recarga de VE) & RIC N°10',
    riskDescription: 'Impactos mecánicos moderados (IK08), chorros de agua de lavado y polvo de rodado.',
    typicalItems: ['Wallbox IP54/IP65', 'Enchufe Schuko/Cetac IP67 con tapa'],
  },
  {
    id: 'main_board_tda',
    name: 'Tablero Eléctrico General (TDA / TDF)',
    sector: 'tablero_principal',
    zoneDescription: 'Gabinete de protecciones generales y barras de distribución.',
    minRequiredIp: 'IP40',
    recommendedIp: 'IP65',
    ricReference: 'RIC N°02 Art. 5.1 & RIC N°03',
    riskDescription: 'Si está en exterior debe ser mínimo IP54/IP65; en interior seco mínimo IP40/IP41 con puerta.',
    typicalItems: ['Gabinete metálico o policarbonato con burlete de sellado y cerradura'],
  },
];

/**
 * Parses IP string (e.g. "IP44", "IP65", "IP20", "IPX4") into numeric digits
 */
export function parseIpRating(ipCode: string): { solid: number; water: number } {
  if (!ipCode) return { solid: 2, water: 0 };
  const clean = ipCode.toUpperCase().replace(/\s+/g, '');
  const match = clean.match(/IP([0-6X])([0-9])/);
  if (!match) return { solid: 2, water: 0 };

  const solidStr = match[1];
  const waterStr = match[2];

  const solid = solidStr === 'X' ? 2 : parseInt(solidStr, 10);
  const water = parseInt(waterStr, 10);

  return {
    solid: isNaN(solid) ? 2 : solid,
    water: isNaN(water) ? 0 : water,
  };
}

export interface IpEvaluationResult {
  isSufficient: boolean;
  currentIpCode: string;
  minRequiredIp: string;
  recommendedIp: string;
  severity: 'CRITICO' | 'MAYOR' | 'OK';
  title: string;
  message: string;
  ricRef: string;
  actionRequired?: string;
  suggestedMaterial?: {
    name: string;
    sku: string;
    unitPriceClp: number;
  };
}

/**
 * Evaluates whether a current IP code is sufficient for a specific sector and environment
 */
export function evaluatePointIpProtection(
  currentIpCode: string = 'IP20',
  sector: SectorType = 'dormitorios',
  environmentId?: string
): IpEvaluationResult {
  // Find matching standard
  let standard = ENVIRONMENT_IP_STANDARDS.find((s) => s.id === environmentId);
  if (!standard) {
    standard = ENVIRONMENT_IP_STANDARDS.find((s) => s.sector === sector) || ENVIRONMENT_IP_STANDARDS[0];
  }

  const current = parseIpRating(currentIpCode);
  const required = parseIpRating(standard.minRequiredIp);
  const recommended = parseIpRating(standard.recommendedIp);

  const isWaterDeficient = current.water < required.water;
  const isSolidDeficient = current.solid < required.solid;
  const isSufficient = !isWaterDeficient && !isSolidDeficient;

  if (isSufficient) {
    return {
      isSufficient: true,
      currentIpCode,
      minRequiredIp: standard.minRequiredIp,
      recommendedIp: standard.recommendedIp,
      severity: 'OK',
      title: `Grado ${currentIpCode} Conforme para el Entorno`,
      message: `El grado de protección ${currentIpCode} cumple satisfactoriamente con la exigencia (${standard.minRequiredIp}) para ${standard.name}.`,
      ricRef: standard.ricReference,
    };
  }

  // Deficient case
  const isCritical = (sector === 'banos' && current.water < 4) || (sector === 'exterior_patio' && current.water < 4);
  const severity: 'CRITICO' | 'MAYOR' = isCritical ? 'CRITICO' : 'MAYOR';

  let deficientAspects: string[] = [];
  if (isWaterDeficient) {
    deficientAspects.push(`Protección contra líquidos insuficiente (Actual: ${IP_WATER_DIGITS[current.water]?.level || 'Baja'}, Requerido: ${IP_WATER_DIGITS[required.water]?.level || 'Alta'})`);
  }
  if (isSolidDeficient) {
    deficientAspects.push(`Protección contra sólidos/polvo insuficiente (Actual: ${IP_SOLID_DIGITS[current.solid]?.level || 'Baja'}, Requerido: ${IP_SOLID_DIGITS[required.solid]?.level || 'Alta'})`);
  }

  const action = `Reemplazar accesorio o caja existente por envolvente certificada ${standard.recommendedIp} con tapas herméticas y prensacables.`;

  let suggestedMaterial = {
    name: `Caja / Módulo Enchufe Estanco ${standard.recommendedIp}`,
    sku: `IP-ENCL-${standard.recommendedIp}`,
    unitPriceClp: standard.recommendedIp === 'IP65' ? 9500 : 5800,
  };

  return {
    isSufficient: false,
    currentIpCode,
    minRequiredIp: standard.minRequiredIp,
    recommendedIp: standard.recommendedIp,
    severity,
    title: `Alerta Grado IP Insuficiente (${currentIpCode} vs Exigido ${standard.minRequiredIp})`,
    message: `${deficientAspects.join('. ')}. ${standard.riskDescription}`,
    ricRef: standard.ricReference,
    actionRequired: action,
    suggestedMaterial,
  };
}

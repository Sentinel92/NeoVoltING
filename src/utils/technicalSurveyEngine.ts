/**
 * Technical Field Survey & SEC/RIC Audit Diagnostics Engine
 * Standard: Pliegos Técnicos RIC N°01 - RIC N°19 (SEC Chile)
 */

export type SectorType = 'tablero_principal' | 'tablero_secundario' | 'cocina_logia' | 'dormitorios' | 'living_comedor' | 'banos' | 'exterior_patio' | 'estacionamiento_acceso' | 'otros';

export type WireCondition = 'bueno_normado' | 'envejecido_reseco' | 'sin_codigo_colores' | 'subdimensionado' | 'empalme_defectuoso';
export type WireType = 'eva_libre_halogeno' | 'h07v_k' | 'nylon_thhn' | 'alambre_antiguo_nyya' | 'cordon_paralelo_taller';
export type WireGauge = '1.5' | '2.5' | '4.0' | '6.0' | '10.0' | '16.0' | 'antiguo_desconocido';

export type BreakerType = 'curva_c_6ka' | 'curva_c_4_5ka' | 'curva_b' | 'antiguo_tapon_fusible' | 'antiguo_1_5ka_domestico' | 'sin_proteccion';
export type BreakerRating = '6A' | '10A' | '16A' | '20A' | '25A' | '32A' | '40A' | '50A' | '63A';

export type RcdPresence = 'presente_30ma_tipo_a' | 'presente_30ma_tipo_ac' | 'presente_300ma_no_apto' | 'ausente_sin_diferencial' | 'averiado_no_dispara';
export type GroundPresence = 'presente_pe_continuo' | 'presente_sin_continuidad' | 'ausente_sin_tierra' | 'puente_tierra_neutro_prohibido';
export type ConduitType = 'conduit_pvc_embutido' | 'conduit_pvc_a la vista' | 'conduit_metalico_cag' | 'cable_a_la_vista_sin_tubo' | 'canaleta_pvc' | 'otro';
export type VisualBoxCondition = 'buena_estanca' | 'caja_quebrada_abierta' | 'saturacion_conductores' | 'humedad_oxido' | 'sin_tapa';

export interface SurveyPointRecord {
  id: string;
  name: string;
  sector: SectorType;
  pointType: 'circuito_tablero' | 'enchufe_fuerza' | 'centro_alumbrado' | 'artefacto_fijo' | 'caja_derivacion' | 'empalme_alimentador';
  
  // Electrical Characteristics Captured
  wireType: WireType;
  wireGaugeMm2: WireGauge;
  wireCondition: WireCondition;
  wireColorCoded: boolean;
  
  breakerType: BreakerType;
  breakerRating: BreakerRating;
  isBreakerOversized?: boolean;
  
  rcdStatus: RcdPresence;
  groundStatus: GroundPresence;
  conduitType: ConduitType;
  boxCondition: VisualBoxCondition;
  ipRating?: string;
  ipEnvironment?: string;
  
  measuredVoltageV?: number;
  measuredLoopOhm?: number;
  notes?: string;
  photoDataUrl?: string;
}

export type SeverityLevel = 'CRITICO' | 'MAYOR' | 'MENOR';

export interface AuditAnomaly {
  id: string;
  pointId: string;
  pointName: string;
  sector: SectorType;
  severity: SeverityLevel;
  codeRIC: string; // e.g. "RIC N°02 Art. 6.4", "RIC N°06 Art. 5", "RIC N°10"
  title: string;
  description: string;
  riskDescription: string;
  recommendedAction: string;
  estimatedMaterialCostClp: number;
  estimatedLaborMinutes: number;
  requiredMaterials: Array<{
    name: string;
    qty: number;
    unit: string;
    unitPrice: number;
    category: string;
    sku: string;
  }>;
}

export interface MaterialBillItem {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPriceClp: number;
  totalPriceClp: number;
}

export interface RepairPlanSummary {
  totalAnomalies: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  anomaliesList: AuditAnomaly[];
  materialBill: MaterialBillItem[];
  totalMaterialCostClp: number;
  totalLaborHours: number;
  recommendedLaborRatePerHour: number;
  totalLaborCostClp: number;
  netTotalClp: number;
  ivaClp: number;
  grandTotalClp: number;
  auditScore100: number; // 0 to 100
  secComplianceStatus: 'NO_CUMPLE_CRITICO' | 'OBSERVADO_MAYOR' | 'REGULARIZABLE' | 'CONFORME_TOTAL';
}

export const SECTOR_METADATA: Record<SectorType, { label: string; icon: string; defaultPoints: string[] }> = {
  tablero_principal: {
    label: 'Tablero Eléctrico Principal (TDA)',
    icon: 'Zap',
    defaultPoints: ['Interruptor General IGA', 'Diferencial General RCD', 'Circuito Alumbrado C1', 'Circuito Enchufes C2', 'Barra de Tierra PE', 'Barra Neutro N'],
  },
  tablero_secundario: {
    label: 'Tablero Secundario / Subdistribución',
    icon: 'Layers',
    defaultPoints: ['Alimentador Secundario', 'Protecciones Sub-tablero'],
  },
  cocina_logia: {
    label: 'Cocina & Logia (Zona Húmeda / Alta Carga)',
    icon: 'Flame',
    defaultPoints: ['Enchufe Horno / Encimera', 'Enchufe Refrigerador', 'Enchufes Mesón / Hervidor', 'Alimentación Lavadora / Secadora', 'Caja Derivación'],
  },
  dormitorios: {
    label: 'Dormitorios & Pasillos',
    icon: 'Home',
    defaultPoints: ['Enchufes Cabecera', 'Centro Iluminación', 'Enchufe Escritorio / Clima'],
  },
  living_comedor: {
    label: 'Living / Comedor / Estar',
    icon: 'Tv',
    defaultPoints: ['Centro Alumbrado Principal', 'Enchufes Multimedia / TV', 'Interruptor Combinación 9/24'],
  },
  banos: {
    label: 'Baños (Zonas de Salpicadura IP)',
    icon: 'Sparkles',
    defaultPoints: ['Enchufe Espejo / Secador', 'Foco Iluminación IP44', 'Extractor / Termo'],
  },
  exterior_patio: {
    label: 'Exterior, Patio & Jardín',
    icon: 'Sun',
    defaultPoints: ['Enchufes Exteriores IP65', 'Focos Proyectores Led', 'Bomba de Agua / Riego'],
  },
  estacionamiento_acceso: {
    label: 'Estacionamiento & Acceso',
    icon: 'ShieldAlert',
    defaultPoints: ['Portón Eléctrico', 'Luminarias Acceso', 'Cargador EV'],
  },
  otros: {
    label: 'Otros Recintos / Bodega / Ático',
    icon: 'Wrench',
    defaultPoints: ['Enchufe Auxiliar', 'Luz Bodega'],
  },
};

/**
 * Evaluates points against SEC / RIC Pliegos Técnicos
 */
export function evaluatePointNormativeRIC(point: SurveyPointRecord): AuditAnomaly[] {
  const anomalies: AuditAnomaly[] = [];

  // RULE 1: Pliego RIC N°05 / N°06 - Ausencia de Diferencial (RCD) en Circuitos de Enchufe o Zonas Húmedas
  if (
    (point.pointType === 'enchufe_fuerza' || point.sector === 'cocina_logia' || point.sector === 'banos' || point.sector === 'exterior_patio') &&
    (point.rcdStatus === 'ausente_sin_diferencial' || point.rcdStatus === 'averiado_no_dispara')
  ) {
    anomalies.push({
      id: `anom_rcd_${point.id}`,
      pointId: point.id,
      pointName: point.name,
      sector: point.sector,
      severity: 'CRITICO',
      codeRIC: 'RIC N°05 Art. 6.2 & RIC N°06',
      title: 'Ausencia o Falla de Protector Diferencial (RCD 30mA)',
      description: `El punto "${point.name}" no cuenta con protección diferencial de alta sensibilidad (30mA) operativa.`,
      riskDescription: 'Riesgo inminente de electrocución por contacto directo/indirecto en caso de falla de aislamiento o humedad.',
      recommendedAction: 'Instalar Interruptor Diferencial bipolar 2x25A 30mA Clase A o Tipo AC certificado SEC.',
      estimatedMaterialCostClp: 19500,
      estimatedLaborMinutes: 35,
      requiredMaterials: [
        { name: 'Protector Diferencial 2x25A 30mA Clase A', qty: 1, unit: 'unid', unitPrice: 19500, category: 'Protecciones', sku: 'RCD-2X25-30MA' },
      ],
    });
  }

  // RULE 2: Pliego RIC N°06 Art. 5 - Falta de Conductor de Puesta a Tierra (PE)
  if (point.groundStatus === 'ausente_sin_tierra') {
    const isCritical = point.sector === 'cocina_logia' || point.sector === 'banos' || point.pointType === 'enchufe_fuerza';
    anomalies.push({
      id: `anom_pe_${point.id}`,
      pointId: point.id,
      pointName: point.name,
      sector: point.sector,
      severity: isCritical ? 'CRITICO' : 'MAYOR',
      codeRIC: 'RIC N°06 Art. 5.1 & RIC N°10',
      title: 'Inexistencia de Conductor de Tierra de Protección (PE)',
      description: `Enchufes o masas metálicas en "${point.name}" sin línea de tierra conectada a la barra de electrodo.`,
      riskDescription: 'Tensión de contacto peligrosa en chasis de electrodomésticos; imposibilita la operación automática del RCD.',
      recommendedAction: 'Cablear conductor verde/amarillo EVA 2.5 mm² desde barra PE del tablero hasta el punto.',
      estimatedMaterialCostClp: 14000,
      estimatedLaborMinutes: 45,
      requiredMaterials: [
        { name: 'Conductor EVA 2.5 mm² Verde/Amarillo (Tierra)', qty: 15, unit: 'm', unitPrice: 650, category: 'Conductores', sku: 'CAB-EVA-2.5-V' },
        { name: 'Terminal Ojo/Puntera Aislada 2.5mm', qty: 2, unit: 'unid', unitPrice: 350, category: 'Fijaciones', sku: 'TERM-PUNT-2.5' },
      ],
    });
  } else if (point.groundStatus === 'puente_tierra_neutro_prohibido') {
    anomalies.push({
      id: `anom_bridge_${point.id}`,
      pointId: point.id,
      pointName: point.name,
      sector: point.sector,
      severity: 'CRITICO',
      codeRIC: 'RIC N°06 Art. 6.8 & RIC N°02',
      title: 'Puente Prohibido Neutro-Tierra en Enchufe/Receptor',
      description: `Se detectó neutralización forzada ("puente neutro-tierra") dentro de la caja de "${point.name}".`,
      riskDescription: 'Peligro extremo: si el neutro aguas arriba se interrumpe, el chasis queda energizado a 220V.',
      recommendedAction: 'Eliminar de inmediato el puente y tender línea independiente de PE hasta el tablero.',
      estimatedMaterialCostClp: 12000,
      estimatedLaborMinutes: 40,
      requiredMaterials: [
        { name: 'Conductor EVA 2.5 mm² Verde/Amarillo', qty: 12, unit: 'm', unitPrice: 650, category: 'Conductores', sku: 'CAB-EVA-2.5-V' },
      ],
    });
  }

  // RULE 3: Pliego RIC N°03 Art. 5 - Sobrecarga de Conductor por Disyuntor Sobredimensionado
  // Wire 1.5mm2 max 10A-16A (norma 10A-13.5A en ducto). If breaker >= 20A or 25A -> SEVERE FIRE HAZARD
  const gaugeNum = parseFloat(point.wireGaugeMm2);
  const breakerNum = parseInt(point.breakerRating.replace('A', ''), 10);

  if (!isNaN(gaugeNum) && !isNaN(breakerNum)) {
    let maxAllowedBreaker = 10;
    if (gaugeNum >= 4.0) maxAllowedBreaker = 25;
    else if (gaugeNum >= 2.5) maxAllowedBreaker = 16;
    else if (gaugeNum >= 1.5) maxAllowedBreaker = 10;

    if (breakerNum > maxAllowedBreaker) {
      anomalies.push({
        id: `anom_breaker_oversize_${point.id}`,
        pointId: point.id,
        pointName: point.name,
        sector: point.sector,
        severity: 'CRITICO',
        codeRIC: 'RIC N°03 Art. 5.2 & RIC N°02 Art. 6',
        title: `Disyuntor Sobredimensionado (${point.breakerRating} vs Cable ${point.wireGaugeMm2} mm²)`,
        description: `El disyuntor de ${point.breakerRating} excede la corriente admisible del conductor de ${point.wireGaugeMm2} mm² (Límite: ${maxAllowedBreaker}A).`,
        riskDescription: 'El cable puede sobrecalentarse e iniciar un incendio antes de que el interruptor automático alcance a disparar.',
        recommendedAction: `Reemplazar disyuntor por modelo de 1x${maxAllowedBreaker}A Curva C 6kA o recablear a mayor sección.`,
        estimatedMaterialCostClp: 5500,
        estimatedLaborMinutes: 25,
        requiredMaterials: [
          { name: `Disyuntor Termomagnético 1x${maxAllowedBreaker}A 6kA Curva C`, qty: 1, unit: 'unid', unitPrice: 5500, category: 'Protecciones', sku: `MCB-1X${maxAllowedBreaker}-6KA` },
        ],
      });
    }
  }

  // RULE 4: Pliego RIC N°04 Art. 7 - Conductor Antiguo Reseco, NYYA o Cordón Paralelo
  if (point.wireType === 'cordon_paralelo_taller' || point.wireType === 'alambre_antiguo_nyya' || point.wireCondition === 'envejecido_reseco') {
    anomalies.push({
      id: `anom_wire_decay_${point.id}`,
      pointId: point.id,
      pointName: point.name,
      sector: point.sector,
      severity: point.wireType === 'cordon_paralelo_taller' ? 'CRITICO' : 'MAYOR',
      codeRIC: 'RIC N°04 Art. 7.1',
      title: 'Conductor Fuera de Norma (Cordón Taller / Aislación Cristalizada)',
      description: `El circuito "${point.name}" utiliza conductores con aislación degradada o cordón flexible prohibido para instalaciones fijas embutidas.`,
      riskDescription: 'Pérdida de aislamiento dieléctrico, cortocircuitos internos y emisión de gases tóxicos en caso de incendio.',
      recommendedAction: 'Retirar alambrado obsoleto y recablear con conductores certificados EVA H07Z1-K libres de halógenos.',
      estimatedMaterialCostClp: 28000,
      estimatedLaborMinutes: 60,
      requiredMaterials: [
        { name: 'Conductor EVA 2.5 mm² Rojo (Fase)', qty: 15, unit: 'm', unitPrice: 650, category: 'Conductores', sku: 'CAB-EVA-2.5-R' },
        { name: 'Conductor EVA 2.5 mm² Azul (Neutro)', qty: 15, unit: 'm', unitPrice: 650, category: 'Conductores', sku: 'CAB-EVA-2.5-A' },
        { name: 'Conductor EVA 2.5 mm² Verde/Amarillo (Tierra)', qty: 15, unit: 'm', unitPrice: 650, category: 'Conductores', sku: 'CAB-EVA-2.5-V' },
      ],
    });
  }

  // RULE 5: Pliego RIC N°04 Art. 5 - Código de Colores No Respetado
  if (!point.wireColorCoded) {
    anomalies.push({
      id: `anom_color_${point.id}`,
      pointId: point.id,
      pointName: point.name,
      sector: point.sector,
      severity: 'MENOR',
      codeRIC: 'RIC N°04 Art. 5.3',
      title: 'Incumplimiento de Código de Colores Reglamentario',
      description: `En "${point.name}" no se respetan los colores normados SEC (Fase: Azul/Negro/Rojo, Neutro: Blanco, PE: Verde/Amarillo).`,
      riskDescription: 'Confusión en futuras labores de mantenimiento y riesgo de invertir fase con neutro o energizar chasis.',
      recommendedAction: 'Identificar con termocontraíble normado o reemplazar tramo.',
      estimatedMaterialCostClp: 3500,
      estimatedLaborMinutes: 15,
      requiredMaterials: [
        { name: 'Kit Marcadores Termocontraíbles / Cinta Normada', qty: 1, unit: 'pack', unitPrice: 3500, category: 'Insumos', sku: 'INS-TERM-KIT' },
      ],
    });
  }

  // RULE 6: Pliego RIC N°04 & N°07 - Canalización Expuesta o Sin Tubo
  if (point.conduitType === 'cable_a_la_vista_sin_tubo') {
    anomalies.push({
      id: `anom_conduit_${point.id}`,
      pointId: point.id,
      pointName: point.name,
      sector: point.sector,
      severity: 'MAYOR',
      codeRIC: 'RIC N°04 Art. 8 & RIC N°07',
      title: 'Conductores a la Vista Sin Canalización Protectora',
      description: `Cables expuestos sin protección mecánica en "${point.name}".`,
      riskDescription: 'Vulnerabilidad ante golpes mecánicos, roedores, aplastamiento o contacto accidental.',
      recommendedAction: 'Instalar tubería Conduit PVC rígido 20mm o canaleta de superficie autoextinguible con accesorios.',
      estimatedMaterialCostClp: 8500,
      estimatedLaborMinutes: 30,
      requiredMaterials: [
        { name: 'Tubería Conduit PVC 20mm x 3m', qty: 2, unit: 'tira', unitPrice: 2450, category: 'Canalizaciones', sku: 'TUB-PVC-20MM' },
        { name: 'Abrazadera Conduit 20mm + Tarugos', qty: 6, unit: 'unid', unitPrice: 350, category: 'Fijaciones', sku: 'ABR-PVC-20' },
        { name: 'Curva Conduit PVC 20mm', qty: 2, unit: 'unid', unitPrice: 750, category: 'Canalizaciones', sku: 'CUR-PVC-20' },
      ],
    });
  }

  // RULE 7: Cajas Quebradas, Sin Tapa o Saturadas
  if (point.boxCondition === 'caja_quebrada_abierta' || point.boxCondition === 'sin_tapa' || point.boxCondition === 'saturacion_conductores') {
    anomalies.push({
      id: `anom_box_${point.id}`,
      pointId: point.id,
      pointName: point.name,
      sector: point.sector,
      severity: 'MAYOR',
      codeRIC: 'RIC N°04 Art. 11',
      title: 'Caja de Derivación Insegura / Sin Tapa Protectora',
      description: `Caja en "${point.name}" rota, saturada o sin tapa ciega reglamentaria.`,
      riskDescription: 'Exposición de empalmes con tensión accesible a dedos o ingreso de insectos/polvo combustible.',
      recommendedAction: 'Reemplazar caja de derivación y colocar tapa atornillada con sellos.',
      estimatedMaterialCostClp: 4200,
      estimatedLaborMinutes: 20,
      requiredMaterials: [
        { name: 'Caja de Derivación Chuqui / Redonda con Tapa', qty: 1, unit: 'unid', unitPrice: 1800, category: 'Cajas', sku: 'CAJ-DER-CHUQUI' },
        { name: 'Conectores Resorte 3M / Regleta Rápida Wago', qty: 4, unit: 'unid', unitPrice: 600, category: 'Insumos', sku: 'CON-WAGO-3P' },
      ],
    });
  }

  // RULE 8: Pliego RIC N°10 & N°11 - Grado de Protección IP Insuficiente según Ubicación
  const currentIp = point.ipRating || (point.sector === 'exterior_patio' ? 'IP20' : point.sector === 'banos' ? 'IP20' : 'IP20');
  const needsHighIp = point.sector === 'exterior_patio' || point.sector === 'banos' || point.sector === 'cocina_logia' || point.sector === 'estacionamiento_acceso';
  
  if (needsHighIp) {
    let minRequiredWater = 4; // IPX4 for bathrooms zone 2 and kitchen
    let minIpLabel = 'IP44';
    if (point.sector === 'exterior_patio') {
      minRequiredWater = 5; // IP55 / IP65 for outdoor patio
      minIpLabel = 'IP55/IP65';
    } else if (point.sector === 'estacionamiento_acceso') {
      minRequiredWater = 4; // IP54 for parking/EV
      minIpLabel = 'IP54';
    }

    const match = currentIp.toUpperCase().match(/IP[0-6X]([0-9])/);
    const waterDigit = match ? parseInt(match[1], 10) : 0;

    if (waterDigit < minRequiredWater) {
      const isCritical = point.sector === 'exterior_patio' || (point.sector === 'banos' && waterDigit < 2);
      anomalies.push({
        id: `anom_ip_${point.id}`,
        pointId: point.id,
        pointName: point.name,
        sector: point.sector,
        severity: isCritical ? 'CRITICO' : 'MAYOR',
        codeRIC: point.sector === 'banos' ? 'RIC N°11 Art. 4' : 'RIC N°10 Art. 7',
        title: `Envolvente con Grado IP Insuficiente (${currentIp} vs Exigido ${minIpLabel})`,
        description: `El punto "${point.name}" en zona húmeda o intemperie cuenta con envolvente ${currentIp}, insuficiente para soportar salpicaduras o chorros de agua.`,
        riskDescription: 'Filtración de humedad al interior del mecanismo, degradación dieléctrica, cortocircuitos por agua y riesgo de electrocución.',
        recommendedAction: `Reemplazar placa o caja por módulo estanco con grado de estanqueidad mínimo ${minIpLabel} con sellos de neopreno.`,
        estimatedMaterialCostClp: minRequiredWater >= 5 ? 9500 : 5800,
        estimatedLaborMinutes: 25,
        requiredMaterials: [
          {
            name: `Caja / Placa Enchufe Estanca ${minIpLabel} con Tapa y Membrana`,
            qty: 1,
            unit: 'unid',
            unitPrice: minRequiredWater >= 5 ? 9500 : 5800,
            category: 'Accesorios',
            sku: `ACC-IP-BOX-${minIpLabel.replace('/', '-')}`,
          },
        ],
      });
    }
  }

  return anomalies;
}

/**
 * Calculates complete repair budget and material cubications
 */
export function calculateRepairPlan(points: SurveyPointRecord[], laborHourlyRateClp: number = 22000): RepairPlanSummary {
  const allAnomalies: AuditAnomaly[] = [];

  points.forEach((p) => {
    const pointAnomalies = evaluatePointNormativeRIC(p);
    allAnomalies.push(...pointAnomalies);
  });

  const criticalCount = allAnomalies.filter((a) => a.severity === 'CRITICO').length;
  const majorCount = allAnomalies.filter((a) => a.severity === 'MAYOR').length;
  const minorCount = allAnomalies.filter((a) => a.severity === 'MENOR').length;

  // Aggregate Material Bill
  const materialMap = new Map<string, MaterialBillItem>();

  allAnomalies.forEach((anom) => {
    anom.requiredMaterials.forEach((mat) => {
      if (materialMap.has(mat.sku)) {
        const existing = materialMap.get(mat.sku)!;
        existing.quantity += mat.qty;
        existing.totalPriceClp = existing.quantity * existing.unitPriceClp;
      } else {
        materialMap.set(mat.sku, {
          sku: mat.sku,
          name: mat.name,
          category: mat.category,
          quantity: mat.qty,
          unit: mat.unit,
          unitPriceClp: mat.unitPrice,
          totalPriceClp: mat.qty * mat.unitPrice,
        });
      }
    });
  });

  const materialBill = Array.from(materialMap.values()).sort((a, b) => b.totalPriceClp - a.totalPriceClp);
  const totalMaterialCostClp = materialBill.reduce((sum, item) => sum + item.totalPriceClp, 0);

  const totalLaborMinutes = allAnomalies.reduce((sum, item) => sum + item.estimatedLaborMinutes, 0);
  const totalLaborHours = Math.max(1, +(totalLaborMinutes / 60).toFixed(1));
  const totalLaborCostClp = Math.round(totalLaborHours * laborHourlyRateClp);

  const netTotalClp = totalMaterialCostClp + totalLaborCostClp;
  const ivaClp = Math.round(netTotalClp * 0.19);
  const grandTotalClp = netTotalClp + ivaClp;

  // Calculate Technical Score (100 Base, -20 per Critical, -8 per Major, -2 per Minor)
  let score = 100 - (criticalCount * 22) - (majorCount * 9) - (minorCount * 3);
  if (points.length === 0) score = 100;
  score = Math.max(5, Math.min(100, score));

  let secComplianceStatus: RepairPlanSummary['secComplianceStatus'] = 'CONFORME_TOTAL';
  if (criticalCount > 0) secComplianceStatus = 'NO_CUMPLE_CRITICO';
  else if (majorCount > 0) secComplianceStatus = 'OBSERVADO_MAYOR';
  else if (minorCount > 0) secComplianceStatus = 'REGULARIZABLE';

  return {
    totalAnomalies: allAnomalies.length,
    criticalCount,
    majorCount,
    minorCount,
    anomaliesList: allAnomalies,
    materialBill,
    totalMaterialCostClp,
    totalLaborHours,
    recommendedLaborRatePerHour: laborHourlyRateClp,
    totalLaborCostClp,
    netTotalClp,
    ivaClp,
    grandTotalClp,
    auditScore100: score,
    secComplianceStatus,
  };
}

export const INITIAL_DEFAULT_POINTS: SurveyPointRecord[] = [
  {
    id: 'pt_1',
    name: 'Interruptor General Tablero (IGA)',
    sector: 'tablero_principal',
    pointType: 'circuito_tablero',
    wireType: 'h07v_k',
    wireGaugeMm2: '4.0',
    wireCondition: 'bueno_normado',
    wireColorCoded: true,
    breakerType: 'curva_c_6ka',
    breakerRating: '32A',
    rcdStatus: 'presente_30ma_tipo_a',
    groundStatus: 'presente_pe_continuo',
    conduitType: 'conduit_pvc_embutido',
    boxCondition: 'buena_estanca',
    measuredVoltageV: 224,
    notes: 'Bornera en buen estado. Tensión dentro de rango SEC.',
  },
  {
    id: 'pt_2',
    name: 'Circuito C1 - Iluminación General',
    sector: 'tablero_principal',
    pointType: 'circuito_tablero',
    wireType: 'eva_libre_halogeno',
    wireGaugeMm2: '1.5',
    wireCondition: 'bueno_normado',
    wireColorCoded: true,
    breakerType: 'curva_c_6ka',
    breakerRating: '10A',
    rcdStatus: 'presente_30ma_tipo_a',
    groundStatus: 'presente_pe_continuo',
    conduitType: 'conduit_pvc_embutido',
    boxCondition: 'buena_estanca',
  },
  {
    id: 'pt_3',
    name: 'Circuito C2 - Enchufes Living / Dormitorios',
    sector: 'tablero_principal',
    pointType: 'circuito_tablero',
    wireType: 'alambre_antiguo_nyya',
    wireGaugeMm2: '1.5',
    wireCondition: 'envejecido_reseco',
    wireColorCoded: false,
    breakerType: 'curva_c_6ka',
    breakerRating: '25A', // ANOMALÍA: 25A en cable de 1.5mm2
    rcdStatus: 'ausente_sin_diferencial', // ANOMALÍA: Sin RCD
    groundStatus: 'ausente_sin_tierra', // ANOMALÍA: Sin PE
    conduitType: 'conduit_pvc_embutido',
    boxCondition: 'buena_estanca',
    notes: 'Circuito modificado informalmente por usuario anterior.',
  },
  {
    id: 'pt_4',
    name: 'Enchufes Mesón Cocina & Hervidor',
    sector: 'cocina_logia',
    pointType: 'enchufe_fuerza',
    wireType: 'alambre_antiguo_nyya',
    wireGaugeMm2: '1.5',
    wireCondition: 'envejecido_reseco',
    wireColorCoded: false,
    breakerType: 'curva_c_6ka',
    breakerRating: '20A',
    rcdStatus: 'ausente_sin_diferencial',
    groundStatus: 'puente_tierra_neutro_prohibido', // ANOMALÍA: Puente neutro-tierra
    conduitType: 'conduit_pvc_embutido',
    boxCondition: 'humedad_oxido',
    notes: 'Caja tras mesón con signos de humedad y grasa.',
  },
  {
    id: 'pt_5',
    name: 'Alimentación Exterior Patio & Jardín',
    sector: 'exterior_patio',
    pointType: 'enchufe_fuerza',
    wireType: 'cordon_paralelo_taller',
    wireGaugeMm2: '1.5',
    wireCondition: 'envejecido_reseco',
    wireColorCoded: false,
    breakerType: 'antiguo_1_5ka_domestico',
    breakerRating: '16A',
    rcdStatus: 'ausente_sin_diferencial',
    groundStatus: 'ausente_sin_tierra',
    conduitType: 'cable_a_la_vista_sin_tubo', // ANOMALÍA: Sin tubo
    boxCondition: 'caja_quebrada_abierta', // ANOMALÍA: Caja rota
    notes: 'Cordón blanco engrapado en muro exterior expuesto a lluvia y sol.',
  },
];

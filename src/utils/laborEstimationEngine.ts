/**
 * Labor & Man-Hours (Horas-Hombre) Estimation Engine for Electrical Repairs & Field Surveys
 * Calibrated according to Chilean electrical construction benchmarks (SEC / RIC standards)
 */

import { SurveyPointRecord } from './technicalSurveyEngine';

export type CrewType = 'solo_technician' | 'master_and_helper' | 'two_masters';
export type SiteComplexity = 'low_accessible' | 'medium_occupied' | 'high_obstructed_height';

export interface PointLaborBreakdown {
  pointType: 'enchufe_fuerza' | 'centro_alumbrado' | 'circuito_tablero' | 'canalizacion_caja' | 'otro';
  label: string;
  count: number;
  baseMinutesPerUnit: number;
  totalBaseMinutes: number;
  totalAdjustedMinutes: number;
  totalManHoursHH: number;
  tasksDescription: string[];
}

export interface PhaseScheduleItem {
  phaseNumber: number;
  name: string;
  description: string;
  percentageOfWork: number;
  estimatedMinutes: number;
  estimatedManHoursHH: number;
  estimatedDays: number;
  iconName: string;
}

export interface LaborEstimationResult {
  // Counts
  powerPointsCount: number;      // Puntos de fuerza / enchufes
  lightingPointsCount: number;   // Centros de alumbrado e interruptores
  boardCircuitsCount: number;    // Circuitos de tablero y protecciones
  conduitBoxesCount: number;     // Cajas de paso, derivación y canalizaciones
  totalPointsEvaluated: number;

  // Man-Hours Calculations
  baseManHoursHH: number;
  adjustedManHoursHH: number;
  
  // Complexity & Multipliers
  crewType: CrewType;
  crewWorkersCount: number;
  crewParallelEfficiency: number; // e.g. 1.0, 1.75, 1.9
  siteComplexity: SiteComplexity;
  complexityMultiplier: number;   // e.g. 1.0, 1.15, 1.30

  // Duration
  effectiveWorkHoursPerDay: number; // default 8 hrs
  projectedDurationDays: number;
  projectedDurationHours: number;

  // Breakdown by point type
  breakdownByPointType: PointLaborBreakdown[];

  // Detailed Phase Work Breakdown Schedule
  phasesSchedule: PhaseScheduleItem[];

  // Economic
  hourlyRateClp: number;
  totalLaborCostClp: number;
  costPerPointAvgClp: number;
}

export const CREW_CONFIGS: Record<CrewType, { label: string; workers: number; efficiency: number; description: string }> = {
  solo_technician: {
    label: '1 Técnico / Instalador Autorizado SEC',
    workers: 1,
    efficiency: 1.0,
    description: 'Trabajo individual secuencial. Ideal para reparaciones menores o recintos puntuales.',
  },
  master_and_helper: {
    label: '1 Maestro Eléctrico SEC + 1 Ayudante Calificado',
    workers: 2,
    efficiency: 1.75,
    description: 'Cuadrilla estándar de alto rendimiento. El ayudante guía conductores mientras el maestro conecta.',
  },
  two_masters: {
    label: '2 Maestros Eléctricos SEC (Doble Frente)',
    workers: 2,
    efficiency: 1.9,
    description: 'Dos especialistas simultáneos (uno en tablero y alimentador, otro en recintos). Máxima celeridad.',
  },
};

export const COMPLEXITY_CONFIGS: Record<SiteComplexity, { label: string; multiplier: number; description: string }> = {
  low_accessible: {
    label: 'Baja (Obra desocupada / Ductos despejados)',
    multiplier: 1.0,
    description: 'Acceso inmediato sin muebles, ductos libres y distancias cortas.',
  },
  medium_occupied: {
    label: 'Media (Vivienda/Local habitado con mobiliario)',
    multiplier: 1.18,
    description: 'Requiere protección de muebles, despeje de áreas y cables antiguos con cierta resistencia.',
  },
  high_obstructed_height: {
    label: 'Alta (Ductos colapsados / Techos / Trabajos en Altura)',
    multiplier: 1.35,
    description: 'Ductos atascados que requieren laucha de acero o canaleta adicional, escalas y zonas húmedas.',
  },
};

/**
 * Calculates comprehensive labor time and man-hours from surveyed points
 */
export function calculateLaborTimeEstimation(
  points: SurveyPointRecord[],
  options?: {
    crewType?: CrewType;
    siteComplexity?: SiteComplexity;
    hourlyRateClp?: number;
    effectiveHoursPerDay?: number;
  }
): LaborEstimationResult {
  const crew = options?.crewType || 'master_and_helper';
  const complexity = options?.siteComplexity || 'medium_occupied';
  const hourlyRate = options?.hourlyRateClp ?? 22000;
  const workHoursPerDay = options?.effectiveHoursPerDay ?? 8;

  const crewMeta = CREW_CONFIGS[crew];
  const complexityMeta = COMPLEXITY_CONFIGS[complexity];

  // 1. Categorize surveyed points
  let powerPointsCount = 0;
  let lightingPointsCount = 0;
  let boardCircuitsCount = 0;
  let conduitBoxesCount = 0;

  points.forEach((p) => {
    if (p.pointType === 'enchufe_fuerza' || p.pointType === 'artefacto_fijo') {
      powerPointsCount++;
    } else if (p.pointType === 'centro_alumbrado') {
      lightingPointsCount++;
    } else if (p.pointType === 'circuito_tablero' || p.sector === 'tablero_principal' || p.sector === 'tablero_secundario') {
      boardCircuitsCount++;
    } else if (p.pointType === 'caja_derivacion' || p.pointType === 'empalme_alimentador' || p.conduitType === 'cable_a_la_vista_sin_tubo') {
      conduitBoxesCount++;
    } else {
      // Default fallback based on sector
      if (p.sector === 'living_comedor' || p.sector === 'dormitorios') {
        powerPointsCount++;
      } else {
        conduitBoxesCount++;
      }
    }
  });

  // Ensure minimum baseline if survey has just started
  if (points.length === 0) {
    powerPointsCount = 2;
    lightingPointsCount = 2;
    boardCircuitsCount = 2;
  }

  // 2. Unit Yields (Minutes per Point) calibrated for Chilean field labor
  // Power Points: Diagnostic, rewiring, PE ground connection, module tightening, test
  const minPerPowerPoint = 42; 
  // Lighting Centers: Ceiling center, switch 9/12 or 9/24 combination, lamp connection, phase test
  const minPerLightingPoint = 36;
  // Board Circuits: MCB/RCD rail mounting, comb busbar, cable stripping, torque tightening, labelling
  const minPerBoardCircuit = 45;
  // Conduits / Derivations: Conduit mounting, WAGO / spring twist splicing, waterproof seal
  const minPerConduitBox = 30;

  const powerTotalBaseMin = powerPointsCount * minPerPowerPoint;
  const lightingTotalBaseMin = lightingPointsCount * minPerLightingPoint;
  const boardTotalBaseMin = boardCircuitsCount * minPerBoardCircuit;
  const conduitTotalBaseMin = conduitBoxesCount * minPerConduitBox;

  const totalBaseMinutes = powerTotalBaseMin + lightingTotalBaseMin + boardTotalBaseMin + conduitTotalBaseMin;
  const baseManHoursHH = +(totalBaseMinutes / 60).toFixed(1);

  // Adjusted minutes based on site complexity
  const adjustedMultiplier = complexityMeta.multiplier;
  const powerAdjustedMin = Math.round(powerTotalBaseMin * adjustedMultiplier);
  const lightingAdjustedMin = Math.round(lightingTotalBaseMin * adjustedMultiplier);
  const boardAdjustedMin = Math.round(boardTotalBaseMin * adjustedMultiplier);
  const conduitAdjustedMin = Math.round(conduitTotalBaseMin * adjustedMultiplier);

  const totalAdjustedMinutes = powerAdjustedMin + lightingAdjustedMin + boardAdjustedMin + conduitAdjustedMin;
  const adjustedManHoursHH = Math.max(1, +(totalAdjustedMinutes / 60).toFixed(1));

  // Calendar Duration depending on Crew
  // Effective clock hours = Adjusted Man-Hours / crew efficiency
  const projectedDurationHours = +(adjustedManHoursHH / crewMeta.efficiency).toFixed(1);
  const projectedDurationDays = Math.max(0.5, +(projectedDurationHours / workHoursPerDay).toFixed(1));

  // Economic Calculation
  const totalLaborCostClp = Math.round(adjustedManHoursHH * hourlyRate);
  const totalPointsEvaluated = powerPointsCount + lightingPointsCount + boardCircuitsCount + conduitBoxesCount;
  const costPerPointAvgClp = totalPointsEvaluated > 0 ? Math.round(totalLaborCostClp / totalPointsEvaluated) : 0;

  // Breakdown array
  const breakdownByPointType: PointLaborBreakdown[] = [
    {
      pointType: 'enchufe_fuerza',
      label: 'Puntos de Fuerza & Enchufes',
      count: powerPointsCount,
      baseMinutesPerUnit: minPerPowerPoint,
      totalBaseMinutes: powerTotalBaseMin,
      totalAdjustedMinutes: powerAdjustedMin,
      totalManHoursHH: +(powerAdjustedMin / 60).toFixed(1),
      tasksDescription: [
        'Desalambrado y retiro de cables fuera de norma / NYYA',
        'Tendido de cables certificados EVA 2.5 mm² (Fase, Neutro y PE)',
        'Conexionado de módulos de enchufe y apriete con torque adecuado',
        'Verificación de polaridad (Fase-Neutro-Tierra) y disparo diferencial',
      ],
    },
    {
      pointType: 'centro_alumbrado',
      label: 'Centros de Alumbrado & Interruptores',
      count: lightingPointsCount,
      baseMinutesPerUnit: minPerLightingPoint,
      totalBaseMinutes: lightingTotalBaseMin,
      totalAdjustedMinutes: lightingAdjustedMin,
      totalManHoursHH: +(lightingAdjustedMin / 60).toFixed(1),
      tasksDescription: [
        'Recableado de retornos y centros con EVA 1.5 mm²',
        'Montaje y conexionado de interruptores 9/12, 9/15 o 9/24',
        'Conexión segura de portalámparas / plafones LED con bornera',
        'Comprobación de encendido y corte efectivo de fase (no neutro)',
      ],
    },
    {
      pointType: 'circuito_tablero',
      label: 'Circuitos de Tablero & Protecciones',
      count: boardCircuitsCount,
      baseMinutesPerUnit: minPerBoardCircuit,
      totalBaseMinutes: boardTotalBaseMin,
      totalAdjustedMinutes: boardAdjustedMin,
      totalManHoursHH: +(boardAdjustedMin / 60).toFixed(1),
      tasksDescription: [
        'Montaje de disyuntores termomagnéticos 6kA Curva C en riel DIN',
        'Instalación de protector diferencial 30mA Clase A / Tipo AC',
        'Peinado de cables, barra equipotencial PE y barra de neutro',
        'Rotulado reglamentario y diagrama unilineal plastificado',
      ],
    },
  ];

  if (conduitBoxesCount > 0) {
    breakdownByPointType.push({
      pointType: 'canalizacion_caja',
      label: 'Canalizaciones & Cajas de Derivación',
      count: conduitBoxesCount,
      baseMinutesPerUnit: minPerConduitBox,
      totalBaseMinutes: conduitTotalBaseMin,
      totalAdjustedMinutes: conduitAdjustedMin,
      totalManHoursHH: +(conduitAdjustedMin / 60).toFixed(1),
      tasksDescription: [
        'Fijación de tubería Conduit PVC rígido 20mm o canaleta autoextinguible',
        'Reemplazo de cajas chuqui y tapas de protección',
        'Ejecución de empalmes con regletas rápidas WAGO o resorte',
      ],
    });
  }

  // 3. Phases Schedule breakdown (5 Standard Construction Phases)
  const phasesSchedule: PhaseScheduleItem[] = [
    {
      phaseNumber: 1,
      name: 'Fase 1: Bloqueo, Desenergización y Desalambrado',
      description: 'Corte seguro de suministro, verificación de ausencia de tensión y retiro de conductores cristalizados/obsoletos.',
      percentageOfWork: 15,
      estimatedMinutes: Math.round(totalAdjustedMinutes * 0.15),
      estimatedManHoursHH: +(adjustedManHoursHH * 0.15).toFixed(1),
      estimatedDays: +((projectedDurationDays * 0.15)).toFixed(1) || 0.2,
      iconName: 'ShieldAlert',
    },
    {
      phaseNumber: 2,
      name: 'Fase 2: Adecuación de Canalizaciones y Cajas',
      description: 'Instalación de ductos conduit faltantes, reposición de cajas quebradas y limpieza de ductos con laucha.',
      percentageOfWork: 20,
      estimatedMinutes: Math.round(totalAdjustedMinutes * 0.20),
      estimatedManHoursHH: +(adjustedManHoursHH * 0.20).toFixed(1),
      estimatedDays: +((projectedDurationDays * 0.20)).toFixed(1) || 0.3,
      iconName: 'Wrench',
    },
    {
      phaseNumber: 3,
      name: 'Fase 3: Cableado y Montaje de Puntos (Fuerza & Alumbrado)',
      description: 'Enhebrado de conductores libres de halógeno EVA y conexionado de todos los enchufes, centros e interruptores.',
      percentageOfWork: 40,
      estimatedMinutes: Math.round(totalAdjustedMinutes * 0.40),
      estimatedManHoursHH: +(adjustedManHoursHH * 0.40).toFixed(1),
      estimatedDays: +((projectedDurationDays * 0.40)).toFixed(1) || 0.5,
      iconName: 'Zap',
    },
    {
      phaseNumber: 4,
      name: 'Fase 4: Armado de Tablero (TDA) & Protecciones',
      description: 'Instalación de disyuntores Curva C, interruptor diferencial 30mA, barra PE, peines y rotulación reglamentaria.',
      percentageOfWork: 15,
      estimatedMinutes: Math.round(totalAdjustedMinutes * 0.15),
      estimatedManHoursHH: +(adjustedManHoursHH * 0.15).toFixed(1),
      estimatedDays: +((projectedDurationDays * 0.15)).toFixed(1) || 0.2,
      iconName: 'Layers',
    },
    {
      phaseNumber: 5,
      name: 'Fase 5: Pruebas SEC, Medición y Entrega de Obra',
      description: 'Prueba de disparo por pulsador de test diferencial, medición de aislamiento con megóhmetro, verificación de lazo y entrega al cliente.',
      percentageOfWork: 10,
      estimatedMinutes: Math.round(totalAdjustedMinutes * 0.10),
      estimatedManHoursHH: +(adjustedManHoursHH * 0.10).toFixed(1),
      estimatedDays: +((projectedDurationDays * 0.10)).toFixed(1) || 0.1,
      iconName: 'CheckCircle2',
    },
  ];

  return {
    powerPointsCount,
    lightingPointsCount,
    boardCircuitsCount,
    conduitBoxesCount,
    totalPointsEvaluated,
    baseManHoursHH,
    adjustedManHoursHH,
    crewType: crew,
    crewWorkersCount: crewMeta.workers,
    crewParallelEfficiency: crewMeta.efficiency,
    siteComplexity: complexity,
    complexityMultiplier: complexityMeta.multiplier,
    effectiveWorkHoursPerDay: workHoursPerDay,
    projectedDurationDays,
    projectedDurationHours,
    breakdownByPointType,
    phasesSchedule,
    hourlyRateClp: hourlyRate,
    totalLaborCostClp,
    costPerPointAvgClp,
  };
}

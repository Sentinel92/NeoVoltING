/**
 * Thermal Simulation and Heat Dissipation Engine (IEC 60890 & SEC RIC N°02)
 * Calculates Joule losses, mutual thermal coupling between DIN rail devices,
 * enclosure temperature rise, and thermographic false-color palettes.
 */

export interface ComponentThermalData {
  compId: string;
  compName: string;
  compTag: string;
  compType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ampacity: number;
  activeCurrentAmps: number;
  loadPercentage: number;
  powerLossWatts: number;
  temperatureCelsius: number;
  deltaTCelsius: number;
  heatRatio: number; // 0.0 (Cold/Ambient) to 1.0+ (Extreme Hotspot)
  colorHex: string;
  glowColorHex: string;
  riskLevel: 'NORMAL' | 'ELEVATED' | 'WARNING' | 'HOTSPOT_CRITICAL';
  statusMessage: string;
}

export interface BoardThermalSummary {
  ambientTempCelsius: number;
  totalLossWatts: number;
  maxTempCelsius: number;
  minTempCelsius: number;
  avgTempCelsius: number;
  hotspotCompId: string | null;
  hotspotCompName: string | null;
  enclosureAirTempCelsius: number;
  overallThermalRisk: 'SAFE' | 'MODERATE' | 'ATTENTION' | 'CRITICAL';
  complianceNote: string;
  componentsData: Record<string, ComponentThermalData>;
}

export type ThermalPaletteType = 'ironbow' | 'rainbow' | 'white_hot';

/**
 * Standard nominal Joule losses (Watts) at rated current In per DIN pole according to IEC 60898-1 / IEC 60947
 */
export const NOMINAL_DISSIPATION_WATTS: Record<string, number> = {
  MCB: 2.8,
  IGA: 6.5,
  RCD: 4.8,
  DPS: 1.2,
  PILOT_LIGHTS: 1.5,
  BAR_N: 1.8,
  BAR_PE: 0.8,
  GRID: 2.0,
  LOAD: 0.5,
};

/**
 * Thermal resistance approximation per module to ambient air (deg C / Watt)
 */
const THERMAL_RESISTANCE_RTH = 5.2; // °C/W

/**
 * Interpolates color along the FLIR Ironbow / Thermographic false color gradient
 */
export function getThermalColor(ratio: number, palette: ThermalPaletteType = 'ironbow'): string {
  const clamped = Math.max(0, Math.min(1.2, ratio));

  if (palette === 'white_hot') {
    // Grayscale thermography: Dark to Glowing White
    const val = Math.min(255, Math.round(clamped * 230 + 25));
    return `rgb(${val}, ${val}, ${val})`;
  }

  if (palette === 'rainbow') {
    // Classic Rainbow: Blue -> Cyan -> Green -> Yellow -> Red -> Magenta
    if (clamped <= 0.2) {
      const t = clamped / 0.2;
      return interpolateRgb([30, 27, 75], [6, 182, 212], t);
    } else if (clamped <= 0.4) {
      const t = (clamped - 0.2) / 0.2;
      return interpolateRgb([6, 182, 212], [34, 197, 94], t);
    } else if (clamped <= 0.65) {
      const t = (clamped - 0.4) / 0.25;
      return interpolateRgb([34, 197, 94], [250, 204, 21], t);
    } else if (clamped <= 0.9) {
      const t = (clamped - 0.65) / 0.25;
      return interpolateRgb([250, 204, 21], [239, 68, 68], t);
    } else {
      const t = Math.min(1, (clamped - 0.9) / 0.3);
      return interpolateRgb([239, 68, 68], [244, 63, 94], t);
    }
  }

  // FLIR Ironbow Palette: Deep Violet -> Blue -> Magenta -> Orange -> Yellow -> White
  if (clamped <= 0.15) {
    const t = clamped / 0.15;
    return interpolateRgb([15, 23, 42], [30, 58, 138], t);
  } else if (clamped <= 0.35) {
    const t = (clamped - 0.15) / 0.2;
    return interpolateRgb([30, 58, 138], [124, 58, 237], t);
  } else if (clamped <= 0.6) {
    const t = (clamped - 0.35) / 0.25;
    return interpolateRgb([124, 58, 237], [225, 29, 72], t);
  } else if (clamped <= 0.85) {
    const t = (clamped - 0.6) / 0.25;
    return interpolateRgb([225, 29, 72], [249, 115, 22], t);
  } else if (clamped <= 1.05) {
    const t = Math.min(1, (clamped - 0.85) / 0.2);
    return interpolateRgb([249, 115, 22], [253, 224, 71], t);
  } else {
    const t = Math.min(1, (clamped - 1.05) / 0.15);
    return interpolateRgb([253, 224, 71], [255, 255, 255], t);
  }
}

function interpolateRgb(rgb1: [number, number, number], rgb2: [number, number, number], t: number): string {
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Calculates complete thermal profile for all components in the board
 */
export function calculateBoardThermalProfile(params: {
  components: Array<{
    id: string;
    name: string;
    tag?: string;
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    ampacity?: number;
    isOff?: boolean;
    isTripped?: boolean;
  }>;
  isEnergized: boolean;
  ambientTempCelsius?: number;
  simultaneityFactor?: number; // 0.2 to 1.5
  palette?: ThermalPaletteType;
  supplyType?: 'MONOFASICO_220' | 'TRIFASICO_380';
}): BoardThermalSummary {
  const {
    components,
    isEnergized,
    ambientTempCelsius = 25,
    simultaneityFactor = 0.85,
    palette = 'ironbow',
  } = params;

  const resultComponents: Record<string, ComponentThermalData> = {};
  let totalLossWatts = 0;
  let maxTemp = ambientTempCelsius;
  let minTemp = ambientTempCelsius;
  let hotspotCompId: string | null = null;
  let hotspotCompName: string | null = null;

  // First pass: Calculate isolated component losses and load currents
  const initialData: Array<{
    comp: (typeof components)[0];
    currentAmps: number;
    nominalIn: number;
    loadRatio: number;
    powerLoss: number;
  }> = [];

  // Estimate branch circuit distribution
  const mcbList = components.filter(c => c.type === 'MCB');
  let branchTotalAmps = 0;

  components.forEach(comp => {
    const nominalIn = comp.ampacity || (comp.type === 'IGA' ? 40 : comp.type === 'RCD' ? 40 : 16);
    let currentAmps = 0;

    if (isEnergized && !comp.isOff && !comp.isTripped) {
      if (comp.type === 'MCB') {
        // Realistic branch circuit load estimation based on name / tag / ampacity
        const nameLower = comp.name.toLowerCase();
        let estimatedLoadW = 1200;
        if (nameLower.includes('alumbrado') || nameLower.includes('luz')) {
          estimatedLoadW = 650;
        } else if (nameLower.includes('cocina') || nameLower.includes('horno')) {
          estimatedLoadW = 2800;
        } else if (nameLower.includes('clima') || nameLower.includes('hvac') || nameLower.includes('fuerza')) {
          estimatedLoadW = 3200;
        } else if (nameLower.includes('termo') || nameLower.includes('caldera')) {
          estimatedLoadW = 2000;
        } else if (nameLower.includes('enchufe')) {
          estimatedLoadW = 1800;
        } else {
          estimatedLoadW = nominalIn * 160; // ~70% load
        }

        currentAmps = +( (estimatedLoadW / 220) * simultaneityFactor ).toFixed(1);
        branchTotalAmps += currentAmps;
      } else if (comp.type === 'RCD') {
        // Differential carries active branch current
        currentAmps = +(Math.min(nominalIn * 1.1, Math.max(8, branchTotalAmps * 0.75))).toFixed(1);
      } else if (comp.type === 'IGA') {
        // Main breaker carries total board load
        currentAmps = +(Math.min(nominalIn * 1.2, Math.max(12, branchTotalAmps * 0.85))).toFixed(1);
      } else if (comp.type === 'DPS') {
        currentAmps = 0.2; // Leakage & monitoring current
      } else if (comp.type === 'PILOT_LIGHTS') {
        currentAmps = 0.05;
      } else if (comp.type === 'BAR_N') {
        currentAmps = +(branchTotalAmps * 0.8).toFixed(1);
      } else if (comp.type === 'BAR_PE') {
        currentAmps = 0; // Normal state
      } else if (comp.type === 'GRID') {
        currentAmps = +(branchTotalAmps * 0.85).toFixed(1);
      }
    }

    const loadRatio = nominalIn > 0 ? currentAmps / nominalIn : 0;
    const baseDissipation = NOMINAL_DISSIPATION_WATTS[comp.type] || 2.0;
    
    // Joule loss follows P = P_base * (I / In)^1.85 + Standby loss
    const powerLoss = isEnergized && !comp.isOff && !comp.isTripped
      ? +(baseDissipation * Math.pow(Math.max(0.1, loadRatio), 1.85) + 0.2).toFixed(2)
      : 0;

    initialData.push({ comp, currentAmps, nominalIn, loadRatio, powerLoss });
  });

  // Second pass: Calculate thermal dissipation with mutual DIN rail coupling (adjacent module heat spread)
  initialData.forEach((item, idx) => {
    const { comp, currentAmps, nominalIn, loadRatio, powerLoss } = item;
    totalLossWatts += powerLoss;

    // Mutual heating from adjacent components on the same DIN rail (distance < 120px)
    let neighborCouplingLoss = 0;
    initialData.forEach((other, otherIdx) => {
      if (idx !== otherIdx) {
        const dx = Math.abs(comp.x - other.comp.x);
        const dy = Math.abs(comp.y - other.comp.y);
        if (dy < 40 && dx < 110) {
          // Adjacent horizontally on same rail
          const proximityFactor = Math.max(0, 1 - dx / 110);
          neighborCouplingLoss += other.powerLoss * 0.18 * proximityFactor;
        }
      }
    });

    const effectivePowerLoss = powerLoss + neighborCouplingLoss;
    const deltaT = +(effectivePowerLoss * THERMAL_RESISTANCE_RTH).toFixed(1);
    const temperature = +(ambientTempCelsius + deltaT).toFixed(1);

    // Heat ratio mapping (25°C base, 75°C max critical ceiling)
    const heatRatio = Math.max(0, (temperature - ambientTempCelsius) / 45);

    let riskLevel: ComponentThermalData['riskLevel'] = 'NORMAL';
    let statusMessage = 'Temperatura nominal óptima.';

    if (temperature >= 68 || loadRatio > 0.95) {
      riskLevel = 'HOTSPOT_CRITICAL';
      statusMessage = '⚠️ PUNTO CALIENTE: Concentración térmica crítica. Riesgo de disparo prematuro (RIC N°02).';
    } else if (temperature >= 54 || loadRatio > 0.75) {
      riskLevel = 'WARNING';
      statusMessage = 'Precaución: Carga elevada y calentamiento significativo.';
    } else if (temperature >= 40 || loadRatio > 0.45) {
      riskLevel = 'ELEVATED';
      statusMessage = 'Régimen de trabajo normal con elevación térmica moderada.';
    }

    const colorHex = getThermalColor(heatRatio, palette);
    const glowColorHex = heatRatio > 0.7 ? '#ef4444' : heatRatio > 0.4 ? '#f59e0b' : '#06b6d4';

    if (temperature > maxTemp) {
      maxTemp = temperature;
      hotspotCompId = comp.id;
      hotspotCompName = comp.tag || comp.name;
    }
    if (temperature < minTemp) {
      minTemp = temperature;
    }

    resultComponents[comp.id] = {
      compId: comp.id,
      compName: comp.name,
      compTag: comp.tag || comp.name.split(' ')[0],
      compType: comp.type,
      x: comp.x,
      y: comp.y,
      w: comp.w,
      h: comp.h,
      ampacity: nominalIn,
      activeCurrentAmps: currentAmps,
      loadPercentage: Math.round(loadRatio * 100),
      powerLossWatts: powerLoss,
      temperatureCelsius: temperature,
      deltaTCelsius: deltaT,
      heatRatio,
      colorHex,
      glowColorHex,
      riskLevel,
      statusMessage,
    };
  });

  const totalLoss = +totalLossWatts.toFixed(1);
  const avgTemp = +(
    Object.values(resultComponents).reduce((acc, c) => acc + c.temperatureCelsius, 0) /
    Math.max(1, Object.keys(resultComponents).length)
  ).toFixed(1);

  // IEC 60890 internal enclosure air temperature rise estimate
  // Delta T_internal ~ k * (Total Losses)^0.8
  const enclosureDeltaT = +(0.85 * Math.pow(Math.max(0.1, totalLoss), 0.78)).toFixed(1);
  const enclosureAirTemp = +(ambientTempCelsius + Number(enclosureDeltaT)).toFixed(1);

  let overallThermalRisk: BoardThermalSummary['overallThermalRisk'] = 'SAFE';
  let complianceNote = 'Tablero dentro de límites de disipación térmica admisibles según RIC N°02.';

  if (maxTemp >= 68 || enclosureAirTemp >= 55) {
    overallThermalRisk = 'CRITICAL';
    complianceNote = 'ALERTA TÉRMICA: Puntos calientes exceden 68°C. Se recomienda ventilación forzada o modularización.';
  } else if (maxTemp >= 54 || enclosureAirTemp >= 45) {
    overallThermalRisk = 'ATTENTION';
    complianceNote = 'ATENCIÓN: Cargas térmicas elevadas. Verificar torque de apriete en bornes y separación DIN.';
  } else if (maxTemp >= 40) {
    overallThermalRisk = 'MODERATE';
    complianceNote = 'Régimen térmico normal para funcionamiento continuo.';
  }

  return {
    ambientTempCelsius,
    totalLossWatts: totalLoss,
    maxTempCelsius: maxTemp,
    minTempCelsius: minTemp,
    avgTempCelsius: avgTemp,
    hotspotCompId,
    hotspotCompName,
    enclosureAirTempCelsius: enclosureAirTemp,
    overallThermalRisk,
    complianceNote,
    componentsData: resultComponents,
  };
}

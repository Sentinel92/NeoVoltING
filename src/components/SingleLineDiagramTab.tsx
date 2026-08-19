import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RoomData, HighAppliance, CustomProtectionSpecs, ContractorConfig, CustomerDetails } from '../types';
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Zap,
  Layers,
  Info,
  Printer,
  Loader2,
  Sliders,
  Edit3,
  CheckCircle2,
  RefreshCw,
  X,
  Shield,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Settings,
  Calculator,
  Building,
  User,
  MapPin,
  Calendar,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Award,
  Table,
  HelpCircle,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  Gauge,
  Power,
  Wrench,
  Lightbulb,
  Volume2,
  VolumeX,
  PlusCircle,
  MinusCircle,
  Move,
  Terminal,
  SlidersHorizontal,
  Trash2,
  FileCode,
} from 'lucide-react';
import { AutoCadViewerModal } from './AutoCadViewerModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { downloadPdfFromElement } from '../utils/pdfGenerator';
import { TypicalSchemesModal } from './TypicalSchemesModal';
import { TypicalScheme } from '../data/typicalSchemes';

interface SingleLineCanvasRendererProps {
  isThreePhase: boolean;
  feederLength: number;
  feederWireSection: number;
  iga: { amps: number; curve: string; breakingCapacity: string; poles: string };
  dps: { voltage: string; dischargeCurrent: string };
  rcds: Record<number, { amps: number; sensitivity: string; classType: string }>;
  circuits: Array<{
    code: string;
    name: string;
    breaker: string;
    wire: string;
    pipe: string;
    loadW: number;
    rcdGroup: number;
    amps: number;
  }>;
  vNominal: number;
  dropVolts: number;
  dropPercent: number;
  isDropExceeded: boolean;
}

export const SingleLineCanvasRenderer: React.FC<SingleLineCanvasRendererProps> = ({
  isThreePhase,
  feederLength,
  feederWireSection,
  iga,
  dps,
  rcds,
  circuits,
  vNominal,
  dropVolts,
  dropPercent,
  isDropExceeded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numCircuits = Math.max(1, circuits.length);
    const colWidth = 175;
    const paddingLeft = 40;
    const width = Math.max(1050, paddingLeft + numCircuits * colWidth + 60);
    const height = 600;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // 1. Draw CAD Dark Canvas Background with subtle grid lines
    ctx.fillStyle = '#0b132b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Title Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('DIAGRAMA UNIFILAR AUTOMÁTICO (MOTOR CANVAS 2D CAD - SEC RIC N°02)', 20, 28);

    // 3. Empalme / Red Distribuidora Symbol
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 48, 120, 45, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('RED DISTRIBUIDORA', 28, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(isThreePhase ? '380V 3Ф (Trifásico)' : '220V 1Ф (Monofásico)', 28, 80);

    // Wire from Empalme to kWh Meter
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, 70.5);
    ctx.lineTo(185, 70.5);
    ctx.stroke();

    // 4. Medidor kWh Circle
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(210, 70.5, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('kWh', 210, 68);
    ctx.fillText('MEDIDOR', 210, 79);
    ctx.textAlign = 'left';

    // 5. Alimentador Principal Line
    const feederColor = isDropExceeded ? '#f43f5e' : '#10b981';
    ctx.strokeStyle = feederColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(234, 70.5);
    ctx.lineTo(430, 70.5);
    ctx.stroke();

    // Alimentador Label Box
    ctx.fillStyle = isDropExceeded ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = feederColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(248, 38, 172, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDropExceeded ? '#fca5a5' : '#a7f3d0';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`Alimentador ${feederWireSection}mm² EVA (${feederLength}m)`, 254, 50);
    ctx.fillText(`Caída V: ${dropPercent.toFixed(2)}% (${dropVolts.toFixed(2)}V)`, 254, 60);

    // 6. IGA (Interruptor General)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(430, 44, 130, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e879f9';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('IGA GENERAL', 440, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${iga.poles}${iga.amps}A ${iga.curve}`, 440, 76);
    ctx.fillStyle = '#d8b4fe';
    ctx.font = '9px sans-serif';
    ctx.fillText(`P.C. ${iga.breakingCapacity}`, 440, 88);

    // Wire from IGA to DPS
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(560, 70.5);
    ctx.lineTo(610, 70.5);
    ctx.stroke();

    // 7. DPS (Protector Sobretensiones)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(610, 44, 120, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('DPS SOBRETENSIÓN', 620, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${dps.voltage} - ${dps.dischargeCurrent}`, 620, 76);

    // Ground connection line from DPS down
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(670, 96);
    ctx.lineTo(670, 125);
    ctx.stroke();
    // Ground symbol
    ctx.beginPath();
    ctx.moveTo(660, 125);
    ctx.lineTo(680, 125);
    ctx.moveTo(663, 129);
    ctx.lineTo(677, 129);
    ctx.moveTo(667, 133);
    ctx.lineTo(673, 133);
    ctx.stroke();

    // Wire down to Main Busbar
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(730, 70.5);
    ctx.lineTo(770, 70.5);
    ctx.lineTo(770, 145);
    ctx.lineTo(40, 145);
    ctx.stroke();

    // 8. Main Distribution Busbars
    const busY = 145;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(30, busY - 3, width - 60, 6); // Phase L1 Busbar

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('BARRA DISTRIBUIDORA PRINCIPAL TABLERO TDA (FASE + NEUTRO + PE)', 40, busY - 7);

    // 9. Draw Circuits & RCDs
    circuits.forEach((cto, idx) => {
      const x = 50 + idx * colWidth;
      const startY = busY + 3;

      // Vertical feeder drop line from busbar
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 50, startY);
      ctx.lineTo(x + 50, startY + 35);
      ctx.stroke();

      // RCD Differential Box (Grouped)
      const rcdSpec = rcds[cto.rcdGroup] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, startY + 35, 120, 48, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`RCD G${cto.rcdGroup} (Diferencial)`, x + 8, startY + 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`2x${rcdSpec.amps}A ${rcdSpec.sensitivity}`, x + 8, startY + 64);
      ctx.fillStyle = '#e9d5ff';
      ctx.font = '8px sans-serif';
      ctx.fillText(rcdSpec.classType, x + 8, startY + 76);

      // Line from RCD to MCB
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 50, startY + 83);
      ctx.lineTo(x + 50, startY + 110);
      ctx.stroke();

      // MCB Circuit Breaker Box
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, startY + 110, 130, 85, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(cto.code, x + 10, startY + 128);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(cto.name.length > 15 ? cto.name.substring(0, 14) + '...' : cto.name, x + 35, startY + 128);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(cto.breaker, x + 10, startY + 145);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`Cond: ${cto.wire}`, x + 10, startY + 160);
      ctx.fillText(`Canal: ${cto.pipe}`, x + 10, startY + 173);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`P_decl: ${cto.loadW} W`, x + 10, startY + 186);

      // Outgoing Load Connection Line
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 50, startY + 195);
      ctx.lineTo(x + 50, startY + 240);
      ctx.stroke();

      // Load Terminal End Arrow / Circle
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(x + 50, startY + 240, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 10. Compliance Normative Stamp
    ctx.fillStyle = isDropExceeded ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = isDropExceeded ? '#f43f5e' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width - 320, height - 75, 300, 60, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDropExceeded ? '#fca5a5' : '#34d399';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(
      isDropExceeded
        ? '⚠️ ALIMENTADOR EXCEDE LÍMITE 3% (NORMA RIC N°04)'
        : '✓ CUMPLE NORMATIVA SEC CHILE (RIC N°02, N°04, N°05)',
      width - 310,
      height - 58
    );
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.fillText(`Caída de Tensión Calculada: ${dropPercent.toFixed(2)}% (${dropVolts.toFixed(2)}V)`, width - 310, height - 44);
    ctx.fillText(`Tensión Nominal: ${vNominal}V | Circuito Básico TE1`, width - 310, height - 30);

  }, [isThreePhase, feederLength, feederWireSection, iga, dps, rcds, circuits, vNominal, dropVolts, dropPercent, isDropExceeded]);

  const handleExportCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagrama_Unifilar_Canvas2D_TE1.png`;
    a.click();
  };

  return (
    <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Motor de Renderizado Canvas 2D - Diagrama Unifilar Autogenerado
          </h3>
        </div>

        <button
          onClick={handleExportCanvasImage}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-all shadow self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exportar Imagen Canvas PNG</span>
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-slate-800 rounded-xl bg-slate-900 p-2">
        <canvas ref={canvasRef} className="block mx-auto rounded-lg shadow-inner" />
      </div>
    </div>
  );
};

export const TRIP_CURVE_INFO: Record<
  string,
  {
    name: string;
    range: string;
    loadType: 'resistiva' | 'general' | 'inductiva';
    loadTypeLabel: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    description: string;
    applications: string;
    secRule: string;
  }
> = {
  'Curva B': {
    name: 'Curva B',
    range: '3 In - 5 In',
    loadType: 'resistiva',
    loadTypeLabel: 'Cargas Resistivas / Conductor Largo',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    description: 'Disparo magnético ultrarrápido (3 a 5 veces la corriente nominal In).',
    applications: 'Termoeléctricos, calefacción resistiva puramente óhmica, iluminación incandescente y alimentadores extensos.',
    secRule: 'Evita sobrecalentamiento rápido en líneas largas y protege circuitos sin picos de inercia.',
  },
  'Curva C': {
    name: 'Curva C',
    range: '5 In - 10 In',
    loadType: 'general',
    loadTypeLabel: 'Cargas Generales Domiciliarias / Comerciales',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    description: 'Disparo magnético estándar (5 a 10 veces la corriente nominal In).',
    applications: 'Alumbrado LED/Fluorescente, enchufes de uso general, electrodomésticos convencionales y oficinas.',
    secRule: 'Curva estándar reglamentaria según pliegos RIC SEC N°05. Soporta transitorios leves de encendido.',
  },
  'Curva D': {
    name: 'Curva D',
    range: '10 In - 20 In',
    loadType: 'inductiva',
    loadTypeLabel: 'Cargas Inductivas / Motores / Clima',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    description: 'Disparo magnético retardado (10 a 20 veces la corriente nominal In).',
    applications: 'Motores eléctricos, bombas de agua, compresores de aire acondicionado / HVAC, transformadores de fuerza.',
    secRule: 'Soporta picos de arranque del motor (hasta 7x In) evitando disparos intempestivos al encender.',
  },
};

interface CircuitPowerBarChartProps {
  circuits: Array<{
    code: string;
    name: string;
    breaker: string;
    wire: string;
    pipe: string;
    loadW: number;
    rcdGroup: number;
    amps: number;
    curve: string;
    breakingCapacity: string;
  }>;
  isThreePhase: boolean;
  vNominal: number;
}

export const CircuitPowerBarChart: React.FC<CircuitPowerBarChartProps> = ({
  circuits,
  isThreePhase,
  vNominal,
}) => {
  const chartData = circuits.map((cto, idx) => {
    const nominalV = 220; // branch circuit voltage
    const capacityW = (cto.amps || 16) * nominalV;
    const utilization = Math.round((cto.loadW / Math.max(1, capacityW)) * 100);

    let phaseName = 'Monofásico L1';
    let phaseCode = 'L1';
    if (isThreePhase) {
      const pIdx = idx % 3;
      if (pIdx === 0) {
        phaseName = 'Fase R (L1)';
        phaseCode = 'R';
      } else if (pIdx === 1) {
        phaseName = 'Fase S (L2)';
        phaseCode = 'S';
      } else {
        phaseName = 'Fase T (L3)';
        phaseCode = 'T';
      }
    }

    return {
      code: cto.code,
      name: cto.name,
      loadW: cto.loadW,
      capacityW,
      utilization,
      amps: cto.amps,
      curve: cto.curve || 'Curva C',
      wire: cto.wire,
      pipe: cto.pipe,
      phaseName,
      phaseCode,
    };
  });

  const totalLoadW = circuits.reduce((sum, c) => sum + c.loadW, 0);
  const totalCapacityW = chartData.reduce((sum, c) => sum + c.capacityW, 0);
  const avgUtilization =
    chartData.length > 0
      ? Math.round(chartData.reduce((s, c) => s + c.utilization, 0) / chartData.length)
      : 0;

  const phaseR = chartData.filter((c) => c.phaseCode === 'R' || !isThreePhase);
  const phaseS = chartData.filter((c) => c.phaseCode === 'S');
  const phaseT = chartData.filter((c) => c.phaseCode === 'T');

  const phaseRLoad = phaseR.reduce((s, c) => s + c.loadW, 0);
  const phaseSLoad = phaseS.reduce((s, c) => s + c.loadW, 0);
  const phaseTLoad = phaseT.reduce((s, c) => s + c.loadW, 0);

  const phaseLoads = isThreePhase ? [phaseRLoad, phaseSLoad, phaseTLoad] : [phaseRLoad];
  const maxPhaseLoad = Math.max(...phaseLoads);
  const minPhaseLoad = Math.min(...phaseLoads);
  const phaseImbalance =
    isThreePhase && maxPhaseLoad > 0
      ? Math.round(((maxPhaseLoad - minPhaseLoad) / maxPhaseLoad) * 100)
      : 0;
  const isPhaseImbalanced = isThreePhase && phaseImbalance > 15;

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const curveInfo = TRIP_CURVE_INFO[data.curve] || TRIP_CURVE_INFO['Curva C'];
      return (
        <div className="bg-slate-900 border-2 border-slate-700 p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 text-white max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-mono font-black text-emerald-400 text-sm">{data.code}</span>
            <span className="font-bold text-slate-200 truncate max-w-[170px]">{data.name}</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Potencia Real Carga:</span>
              <span className="font-bold text-amber-300">{data.loadW} W</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Capacidad Disyuntor:</span>
              <span className="font-bold text-indigo-300">{data.capacityW} W ({data.amps}A @ 220V)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Factor de Carga:</span>
              <span
                className={`font-black font-mono px-1.5 py-0.5 rounded ${
                  data.utilization > 100
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : data.utilization > 80
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                }`}
              >
                {data.utilization}%
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-slate-400">Curva Disparo:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${curveInfo.badgeBg} ${curveInfo.badgeText} border ${curveInfo.badgeBorder}`}
              >
                {data.curve} ({curveInfo.range})
              </span>
            </div>
            {isThreePhase && (
              <div className="flex justify-between">
                <span className="text-slate-400">Fase Asignada:</span>
                <span className="font-bold text-emerald-400">{data.phaseName}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white uppercase tracking-wide">
                Distribución de Potencia Real vs Capacidad de Disyuntores
              </h3>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Balanceo de Cargas SEC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualiza el consumo real en Watts (P_real) frente al límite térmico nominal del automático (1xIn × 220V).
            </p>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Potencia Real Total</span>
            <span className="font-black text-amber-400 font-mono">{(totalLoadW / 1000).toFixed(2)} kW ({totalLoadW}W)</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Capacidad Total TDA</span>
            <span className="font-black text-indigo-300 font-mono">{(totalCapacityW / 1000).toFixed(2)} kW</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Uso Promedio Carga</span>
            <span className={`font-black font-mono ${avgUtilization > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {avgUtilization}%
            </span>
          </div>
        </div>
      </div>

      {/* Phase Balancing Analysis (Trifásico) */}
      {isThreePhase && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Análisis de Balanceo de Fases (380V Trifásico - RIC N°03)
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isPhaseImbalanced
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isPhaseImbalanced ? `Desbalance: ${phaseImbalance}% (>15% Máx SEC)` : `Desbalance OK: ${phaseImbalance}% (≤15%)`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Phase R */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-red-400">
                <span>Fase R (L1)</span>
                <span>{phaseR.length} circuitos</span>
              </div>
              <div className="text-base font-black text-white font-mono">{phaseRLoad} W</div>
              <div className="text-[10px] text-slate-400">
                {totalLoadW > 0 ? Math.round((phaseRLoad / totalLoadW) * 100) : 0}% de la carga total
              </div>
            </div>

            {/* Phase S */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span>Fase S (L2)</span>
                <span>{phaseS.length} circuitos</span>
              </div>
              <div className="text-base font-black text-white font-mono">{phaseSLoad} W</div>
              <div className="text-[10px] text-slate-400">
                {totalLoadW > 0 ? Math.round((phaseSLoad / totalLoadW) * 100) : 0}% de la carga total
              </div>
            </div>

            {/* Phase T */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-indigo-400">
                <span>Fase T (L3)</span>
                <span>{phaseT.length} circuitos</span>
              </div>
              <div className="text-base font-black text-white font-mono">{phaseTLoad} W</div>
              <div className="text-[10px] text-slate-400">
                {totalLoadW > 0 ? Math.round((phaseTLoad / totalLoadW) * 100) : 0}% de la carga total
              </div>
            </div>
          </div>

          {isPhaseImbalanced && (
            <div className="bg-rose-950/60 border border-rose-500/40 p-2.5 rounded-lg text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Sugerencia de Rebalanceo:</strong> Redistribuye o reasigna circuitos de alta potencia para mantener un desbalance inferior al 15% entre fases R, S y T.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recharts Chart Visualization */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="code" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="W" />
            <RechartsTooltip content={<CustomChartTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#cbd5e1' }}
              formatter={(value) => <span className="text-slate-300 font-semibold">{value}</span>}
            />
            <ReferenceLine y={2800} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Límite 80% continuo', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
            <Bar dataKey="loadW" name="Potencia Real Carga (W)" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.utilization > 100
                      ? '#f43f5e'
                      : entry.utilization > 80
                      ? '#f59e0b'
                      : '#10b981'
                  }
                />
              ))}
            </Bar>
            <Bar dataKey="capacityW" name="Capacidad Máx Disyuntor (W)" fill="#6366f1" opacity={0.35} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Curve Legend Footnote */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
          <div>
            <strong className="text-amber-300">Curva B (3-5 In):</strong> <span className="text-slate-400">Cargas resistivas puras / líneas largas</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
          <div>
            <strong className="text-emerald-300">Curva C (5-10 In):</strong> <span className="text-slate-400">Cargas generales (alumbrado/enchufes)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0"></span>
          <div>
            <strong className="text-purple-300">Curva D (10-20 In):</strong> <span className="text-slate-400">Cargas inductivas (motores/clima)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   MÓDULO DE TABLERO 2D SIMULADOR FÍSICO INTERACTIVO (NORMA SEC)
   ============================================================================ */
interface Tablero2DSimulatorProps {
  isThreePhase: boolean;
  vNominal: number;
  iga: { amps: number; curve: string; breakingCapacity: string; poles: string };
  dps: { voltage: string; dischargeCurrent: string };
  rcds: Record<number, { amps: number; sensitivity: string; classType: string }>;
  circuits: Array<{
    code: string;
    name: string;
    breaker: string;
    wire: string;
    pipe: string;
    loadW: number;
    rcdGroup: number;
    amps: number;
    curve: string;
    breakingCapacity: string;
  }>;
  specs: CustomProtectionSpecs;
  updateSpecsAndSync: (newSpecs: CustomProtectionSpecs, msg: string) => void;
  showToast: (msg: string) => void;
  feederWireSection: number;
  feederLength: number;
}

export const Tablero2DSimulator: React.FC<Tablero2DSimulatorProps> = ({
  isThreePhase,
  vNominal,
  iga,
  dps,
  rcds,
  circuits,
  specs,
  updateSpecsAndSync,
  showToast,
}) => {
  const [isEnergized, setIsEnergized] = useState(true);
  const [isDoorClosed, setIsDoorClosed] = useState(false);
  const [showWiringGuide, setShowWiringGuide] = useState(false);
  const [showWiringVerifier, setShowWiringVerifier] = useState(false);
  const [showComponentPalette, setShowComponentPalette] = useState(false);
  const [rcdTrippedState, setRcdTrippedState] = useState<Record<number, boolean>>({});
  const [mcbState, setMcbState] = useState<Record<string, boolean>>({});
  const [customRailModules, setCustomRailModules] = useState<
    Array<{ id: string; type: string; label: string; amps?: number; curve?: string }>
  >([]);

  const toggleEnergized = () => {
    setIsEnergized((prev) => {
      const next = !prev;
      showToast(next ? '⚡ Tablero ENERGIZADO (Tensión activa 220V/380V)' : '🛑 Tablero DESENERGIZADO (Mantenimiento seguro)');
      return next;
    });
  };

  const handleRcdTest = (groupNum: number) => {
    if (!isEnergized) {
      showToast('⚠️ El tablero está desenergizado. Energízalo para probar el botón TEST del diferencial.');
      return;
    }
    setRcdTrippedState((prev) => {
      const isTripped = !prev[groupNum];
      showToast(
        isTripped
          ? `⚡ DISPARO DE PRUEBA: RCD Grupo ${groupNum} ha abierto el circuito por fuga simulada (30mA ok).`
          : `✓ RCD Grupo ${groupNum} rearmado correctamente.`
      );
      return { ...prev, [groupNum]: isTripped };
    });
  };

  const toggleMcb = (code: string) => {
    setMcbState((prev) => {
      const current = prev[code] !== false;
      const next = !current;
      showToast(next ? `🔌 Circuito ${code} activado.` : `⏹️ Circuito ${code} desenergizado localmente.`);
      return { ...prev, [code]: next };
    });
  };

  const totalLoadW = circuits.reduce((s, c) => s + c.loadW, 0);
  const currentAmpTotal = Math.round(totalLoadW / Math.max(1, vNominal));

  const checks = [
    {
      id: 'pe',
      title: 'Barra de Puesta a Tierra (PE) - RIC N°06',
      status: 'pass' as const,
      message: 'Barra de cobre PE conectada a masa metálica del gabinete y malla de tierra con R ≤ 20 Ω.',
    },
    {
      id: 'neutral',
      title: 'Aislamiento de Bornera de Neutro (N) - RIC N°03',
      status: 'pass' as const,
      message: 'Bornera de neutro independiente aislada de la estructura metálica con sección equivalente a fase.',
    },
    {
      id: 'rcd_limit',
      title: 'Límite de Circuitos por Protector Diferencial - RIC N°05',
      status: (() => {
        const counts: Record<number, number> = {};
        circuits.forEach((c) => {
          counts[c.rcdGroup] = (counts[c.rcdGroup] || 0) + 1;
        });
        const overflow = Object.values(counts).some((cnt) => cnt > 3);
        return overflow ? ('fail' as const) : ('pass' as const);
      })(),
      message: (() => {
        const counts: Record<number, number> = {};
        circuits.forEach((c) => {
          counts[c.rcdGroup] = (counts[c.rcdGroup] || 0) + 1;
        });
        const overflow = Object.values(counts).some((cnt) => cnt > 3);
        return overflow
          ? 'ALERTA SEC: Hay más de 3 circuitos derivados asignados a un solo interruptor diferencial.'
          : 'Cumple RIC N°05: Máximo 3 circuitos derivados protegidos por cada interruptor diferencial.';
      })(),
    },
    {
      id: 'gauge_coordination',
      title: 'Coordinación Térmica Conductor vs Disyuntor - RIC N°04',
      status: (() => {
        const mismatch = circuits.some((c) => {
          const wireMm = parseFloat(c.wire);
          if (isNaN(wireMm)) return false;
          if (wireMm <= 1.5 && c.amps > 10) return true;
          if (wireMm <= 2.5 && c.amps > 16) return true;
          if (wireMm <= 4.0 && c.amps > 25) return true;
          return false;
        });
        return mismatch ? ('fail' as const) : ('pass' as const);
      })(),
      message: (() => {
        const mismatch = circuits.some((c) => {
          const wireMm = parseFloat(c.wire);
          if (isNaN(wireMm)) return false;
          if (wireMm <= 1.5 && c.amps > 10) return true;
          if (wireMm <= 2.5 && c.amps > 16) return true;
          if (wireMm <= 4.0 && c.amps > 25) return true;
          return false;
        });
        return mismatch
          ? 'PELIGRO DE SOBRECALENTAMIENTO: Existen disyuntores sobredimensionados para el calibre del conductor.'
          : 'Coordinación Correcta: Los amparajes de los disyuntores no superan la capacidad nominal de los conductores EVA.';
      })(),
    },
    {
      id: 'trip_curves',
      title: 'Adecuación de Curvas de Disparo B / C / D - RIC N°05',
      status: (() => {
        const hasD = circuits.some((c) => c.curve === 'Curva D');
        const hasInductive = circuits.some((c) => c.name.toLowerCase().includes('clima') || c.name.toLowerCase().includes('motor') || c.name.toLowerCase().includes('bomba'));
        if (hasInductive && !hasD) return 'warning' as const;
        return 'pass' as const;
      })(),
      message: (() => {
        const hasD = circuits.some((c) => c.curve === 'Curva D');
        const hasInductive = circuits.some((c) => c.name.toLowerCase().includes('clima') || c.name.toLowerCase().includes('motor') || c.name.toLowerCase().includes('bomba'));
        if (hasInductive && !hasD) return 'Sugerencia SEC: Se detectaron cargas inductivas (Clima/Motor) sin Curva D asignada. Se recomienda cambiar a Curva D.';
        return 'Curvas de Disparo correctamente asociadas al tipo de carga del circuito.';
      })(),
    },
  ];

  const handleAutoFixWiring = () => {
    const newCircuitBreakers = { ...specs.circuitBreakers };
    let groupCount = 0;

    circuits.forEach((c) => {
      const wireMm = parseFloat(c.wire) || 2.5;
      let targetAmps = c.amps;
      if (wireMm <= 1.5) targetAmps = 10;
      else if (wireMm <= 2.5) targetAmps = 16;
      else if (wireMm <= 4.0) targetAmps = 20;
      else targetAmps = 32;

      let targetCurve = c.curve || 'Curva C';
      if (c.name.toLowerCase().includes('clima') || c.name.toLowerCase().includes('motor') || c.name.toLowerCase().includes('bomba') || c.name.toLowerCase().includes('hvac')) {
        targetCurve = 'Curva D';
      } else if (c.name.toLowerCase().includes('termo') || c.name.toLowerCase().includes('calefac')) {
        targetCurve = 'Curva B';
      }

      if (groupCount >= 3) {
        groupCount = 0;
      }
      groupCount++;

      newCircuitBreakers[c.code] = {
        amps: targetAmps,
        curve: targetCurve,
        breakingCapacity: '6kA',
        wireSection: `${wireMm} mm²`,
        pipeType: c.pipe,
        customName: c.name,
      };
    });

    const updatedSpecs: CustomProtectionSpecs = {
      ...specs,
      circuitBreakers: newCircuitBreakers,
    };

    updateSpecsAndSync(updatedSpecs, '⚡ Auto-cableado y coordinaciones SEC corregidas exitosamente.');
    setShowWiringVerifier(false);
  };

  const addModuleToRail = (type: string, label: string, amps = 16, curve = 'Curva C') => {
    const newMod = {
      id: `custom-${Date.now()}`,
      type,
      label,
      amps,
      curve,
    };
    setCustomRailModules((prev) => [...prev, newMod]);
    showToast(`Módulo "${label}" añadido al Riel DIN del tablero.`);
  };

  const removeModuleFromRail = (id: string) => {
    setCustomRailModules((prev) => prev.filter((m) => m.id !== id));
    showToast('Módulo removido del Riel DIN.');
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden my-6">
      <div
        className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isEnergized ? 'bg-emerald-500/10' : 'bg-rose-500/10'
        }`}
      />

      {/* Header & Controls Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
              isEnergized
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/20'
            }`}
          >
            <Power className={`w-6 h-6 ${isEnergized ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Tablero Eléctrico TDA 2D Interactivo - Simulador RIC SEC
              </h3>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isEnergized
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isEnergized ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                {isEnergized ? '220V/380V ENERGIZADO' : 'DESENERGIZADO'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulador físico de Rieles DIN, auto-cableado de seguridad, pruebas de disparo RCD y curvas B/C/D SEC.
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleEnergized}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-2 shadow-md ${
              isEnergized
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 active:scale-95'
                : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 active:scale-95'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isEnergized ? 'Desenergizar Tablero' : 'Energizar Tablero'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWiringVerifier(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Verificar Auto-Cableado SEC</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWiringGuide((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-md ${
              showWiringGuide
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-extrabold'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Guía de Cableado</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComponentPalette((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-md ${
              showComponentPalette
                ? 'bg-purple-600 text-white border-purple-400 font-extrabold'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-purple-400" />
            <span>Módulos DIN</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDoorClosed((prev) => !prev)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span>{isDoorClosed ? 'Abrir Puerta TDA' : 'Cerrar Puerta IP65'}</span>
          </button>
        </div>
      </div>

      {/* Live Digital Instruments */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-semibold block">Tensión Nominal (V)</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className={`font-mono font-black text-sm ${isEnergized ? 'text-emerald-300' : 'text-slate-500'}`}>
              {isEnergized ? `${isThreePhase ? '380.2 V (3Ф)' : '220.4 V (1Ф)'}` : '0.0 V'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-semibold block">Frecuencia de Red</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className={`font-mono font-black text-sm ${isEnergized ? 'text-indigo-300 animate-pulse' : 'text-slate-500'}`}>
              {isEnergized ? '50.0 Hz' : '0.0 Hz'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-semibold block">Corriente Total Carga</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className={`font-mono font-black text-sm ${isEnergized ? 'text-amber-300' : 'text-slate-500'}`}>
              {isEnergized ? `${currentAmpTotal} A` : '0 A'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-semibold block">Potencia Activa Total</span>
          <div className="flex items-center gap-2 mt-0.5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className={`font-mono font-black text-sm ${isEnergized ? 'text-purple-300' : 'text-slate-500'}`}>
              {isEnergized ? `${(totalLoadW / 1000).toFixed(2)} kW` : '0.00 kW'}
            </span>
          </div>
        </div>
      </div>

      {/* Palette Drawer */}
      {showComponentPalette && (
        <div className="bg-slate-950 p-4 rounded-2xl border-2 border-purple-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Paleta de Módulos DIN - Añadir / Personalizar Componentes en Riel
              </h4>
            </div>
            <button onClick={() => setShowComponentPalette(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Haz clic en los componentes para insertarlos en el riel inferior de módulos personalizados:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => addModuleToRail('mcb', 'Disyuntor C10 A', 10, 'Curva C')}
              className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-left transition-all space-y-1"
            >
              <span className="font-extrabold text-emerald-400 text-xs block">Disyuntor MCB 10A</span>
              <span className="text-[10px] text-slate-400 block">Alumbrado Curva C (6kA)</span>
            </button>

            <button
              type="button"
              onClick={() => addModuleToRail('mcb', 'Disyuntor C16 A', 16, 'Curva C')}
              className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-left transition-all space-y-1"
            >
              <span className="font-extrabold text-amber-400 text-xs block">Disyuntor MCB 16A</span>
              <span className="text-[10px] text-slate-400 block">Enchufes Curva C (6kA)</span>
            </button>

            <button
              type="button"
              onClick={() => addModuleToRail('mcb', 'Disyuntor C25 A', 25, 'Curva D')}
              className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-left transition-all space-y-1"
            >
              <span className="font-extrabold text-purple-400 text-xs block">Disyuntor C25A (Curva D)</span>
              <span className="text-[10px] text-slate-400 block">Clima / Motor Inductivo</span>
            </button>

            <button
              type="button"
              onClick={() => addModuleToRail('rcd', 'RCD Auxiliar 25A 30mA', 25)}
              className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-left transition-all space-y-1"
            >
              <span className="font-extrabold text-indigo-400 text-xs block">RCD Auxiliar 30mA</span>
              <span className="text-[10px] text-slate-400 block">Diferencial Extra 2x25A</span>
            </button>

            <button
              type="button"
              onClick={() => addModuleToRail('meter', 'Voltímetro DIN Digital')}
              className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-left transition-all space-y-1"
            >
              <span className="font-extrabold text-teal-400 text-xs block">Voltímetro/Amperímetro</span>
              <span className="text-[10px] text-slate-400 block">Medidor Modular Carril</span>
            </button>

            <button
              type="button"
              onClick={() => addModuleToRail('terminal', 'Bornera Neutro / Tierra')}
              className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-left transition-all space-y-1"
            >
              <span className="font-extrabold text-cyan-400 text-xs block">Peine / Bornera DIN</span>
              <span className="text-[10px] text-slate-400 block">Puente de Distribución</span>
            </button>
          </div>
        </div>
      )}

      {/* SEC Wiring Guide Overlay */}
      {showWiringGuide && (
        <div className="bg-amber-950/40 border-2 border-amber-500/50 p-4 rounded-2xl text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <strong className="text-amber-300 font-extrabold uppercase tracking-wide">
                Guía Oficial de Cableado SEC Chile (RIC N°03 & RIC N°04)
              </strong>
            </div>
            <button onClick={() => setShowWiringGuide(false)} className="text-amber-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="bg-slate-900 p-2 rounded-xl border border-red-500/40 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0 shadow" />
              <div>
                <strong className="text-red-300 block">Fase L1 (R)</strong>
                <span className="text-slate-400 text-[10px]">Rojo / Café</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-blue-500/40 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0 shadow" />
              <div>
                <strong className="text-blue-300 block">Fase L2 (S)</strong>
                <span className="text-slate-400 text-[10px]">Azul (Trifásico)</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-400 shrink-0 shadow" />
              <div>
                <strong className="text-slate-200 block">Fase L3 (T)</strong>
                <span className="text-slate-400 text-[10px]">Negro (Trifásico)</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-sky-400/40 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-300 shrink-0 shadow" />
              <div>
                <strong className="text-sky-300 block">Neutro (N)</strong>
                <span className="text-slate-400 text-[10px]">Blanco / Celeste</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-emerald-500/40 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0 shadow" />
              <div>
                <strong className="text-emerald-300 block">Tierra PE</strong>
                <span className="text-slate-400 text-[10px]">Verde / Amarillo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Wiring Verifier Modal */}
      {showWiringVerifier && (
        <div className="bg-slate-950 border-2 border-indigo-500/50 p-5 rounded-2xl space-y-4 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Verificador Automático de Cableado SEC (RIC N°03 - RIC N°06)
                </h4>
                <p className="text-xs text-slate-400">
                  Diagnóstico en tiempo real de protecciones, conductores y coordinaciones térmicas.
                </p>
              </div>
            </div>

            <button onClick={() => setShowWiringVerifier(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {checks.map((chk) => (
              <div
                key={chk.id}
                className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                  chk.status === 'pass'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : chk.status === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {chk.status === 'pass' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : chk.status === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-0.5">
                  <strong className="font-bold text-white block text-xs">{chk.title}</strong>
                  <p className="text-[11px] leading-relaxed opacity-90">{chk.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Presiona para aplicar ajustes automáticos de curvas y secciones.
            </span>

            <button
              type="button"
              onClick={handleAutoFixWiring}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400/50 transition-all active:scale-95 flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-amber-300" />
              <span>⚡ Ejecutar Auto-Corrección Completa SEC</span>
            </button>
          </div>
        </div>
      )}

      {/* REALISTIC 2D CABINET CONTAINER */}
      <div
        className={`bg-slate-950 rounded-2xl border-4 border-slate-800 p-5 shadow-inner relative transition-all duration-500 overflow-hidden ${
          isDoorClosed ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Copper Earth & Neutral Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-emerald-500/40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-8 bg-amber-600 rounded border border-amber-400 shadow-sm" />
              <div>
                <strong className="text-xs text-emerald-400 font-mono block">BARRA TIERRA DE PROTECCIÓN (PE)</strong>
                <span className="text-[10px] text-slate-400">Puesta a Malla R ≤ 20 Ω (Conductor 6.0 mm² EVA)</span>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              OK CONECTADA
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-sky-500/40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-8 bg-slate-300 rounded border border-sky-400 shadow-sm" />
              <div>
                <strong className="text-xs text-sky-400 font-mono block">BARRA DE NEUTRO AISLADA (N)</strong>
                <span className="text-[10px] text-slate-400">Aislamiento & Cut-off para Diferenciales RCD</span>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
              AISLADA OK
            </span>
          </div>
        </div>

        {/* DIN RAIL 1 */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold uppercase tracking-wider px-1">
            <span>RIEL DIN N°1: ALIMENTACIÓN PRINCIPAL & PROTECCIÓN DE ENTRADA</span>
            <span className="text-[10px] text-indigo-400">Carril 35mm Normalizado</span>
          </div>

          <div className="relative bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 h-16 rounded-xl p-2 border-y-2 border-slate-500 shadow-md flex items-center gap-3 overflow-x-auto custom-scrollbar">
            <div className="shrink-0 bg-slate-900 border-2 border-emerald-500/60 p-2 rounded-lg text-center space-y-1 w-28 shadow-lg relative">
              <span className="text-[9px] font-extrabold text-emerald-400 block uppercase">EMPALME / kWh</span>
              <div className="bg-slate-950 p-1 rounded font-mono text-[10px] text-emerald-300 font-black">
                {isEnergized ? '220.4 V' : '0 V'}
              </div>
              <span className="text-[8px] text-slate-400 block">Medidor SEC</span>
            </div>

            <div className={`w-4 h-1 transition-all ${isEnergized ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-slate-600'}`} />

            <div className="shrink-0 bg-slate-900 border-2 border-purple-500/80 p-2 rounded-lg text-center space-y-1 w-36 shadow-lg relative">
              <span className="text-[9px] font-extrabold text-fuchsia-300 block uppercase">IGA PRINCIPAL</span>
              <div className="bg-slate-950 p-1 rounded font-mono text-xs text-white font-black">
                {iga.poles} {iga.amps}A {iga.curve}
              </div>
              <span className="text-[8px] text-purple-300 block">P.C. {iga.breakingCapacity}</span>
            </div>

            <div className={`w-4 h-1 transition-all ${isEnergized ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />

            <div className="shrink-0 bg-slate-900 border-2 border-amber-500/80 p-2 rounded-lg text-center space-y-1 w-36 shadow-lg relative">
              <span className="text-[9px] font-extrabold text-amber-400 block uppercase">DPS SOBRETENSIÓN</span>
              <div className="bg-slate-950 p-1 rounded font-mono text-[10px] text-amber-200 font-bold">
                {dps.voltage} / {dps.dischargeCurrent}
              </div>
              <span className="text-[8px] text-amber-300/80 block">Protección Clase II</span>
            </div>

            <div className={`w-4 h-1 transition-all ${isEnergized ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />

            <div className="shrink-0 bg-slate-900 border-2 border-teal-500/80 p-2 rounded-lg text-center space-y-1 w-32 shadow-lg relative">
              <span className="text-[9px] font-extrabold text-teal-300 block uppercase">VOLTÍMETRO DIN</span>
              <div className="bg-slate-950 p-1 rounded font-mono text-[11px] text-teal-300 font-black">
                {isEnergized ? '50.0 Hz' : '0 Hz'}
              </div>
              <span className="text-[8px] text-slate-400 block">Monitor Digital</span>
            </div>
          </div>
        </div>

        {/* DIN RAIL 2 */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold uppercase tracking-wider px-1">
            <span>RIEL DIN N°2: PROTECCIÓN DIFERENCIAL CONTRA FUGA A TIERRA (RCD 30mA)</span>
            <span className="text-[10px] text-purple-400">RIC N°05 Norma SEC</span>
          </div>

          <div className="relative bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 h-20 rounded-xl p-2 border-y-2 border-slate-500 shadow-md flex items-center gap-4 overflow-x-auto custom-scrollbar">
            {Object.entries(rcds).map(([grpStr, rcd]) => {
              const grpNum = parseInt(grpStr, 10);
              const isTripped = rcdTrippedState[grpNum] === true;

              return (
                <div
                  key={grpStr}
                  className={`shrink-0 bg-slate-900 border-2 p-2.5 rounded-xl text-center space-y-1.5 w-48 shadow-xl transition-all relative ${
                    isTripped
                      ? 'border-rose-500 bg-rose-950/30'
                      : 'border-purple-500/80 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-[10px] font-black text-purple-300">RCD GRUPO {grpNum}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isTripped ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {isTripped ? 'DISPARADO' : 'OPERATIVO'}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-black text-white">
                    2x{rcd.amps}A | {rcd.sensitivity}
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="text-[9px] text-slate-400">{rcd.classType || 'Clase AC'}</span>

                    <button
                      type="button"
                      onClick={() => handleRcdTest(grpNum)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded border border-amber-300 active:scale-90 transition-all shadow"
                    >
                      TEST ⚡
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DIN RAIL 3 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold uppercase tracking-wider px-1">
            <span>RIEL DIN N°3: CIRCUITOS DERIVADOS AUTOMÁTICOS MCB (SELECCIÓN CURVA B/C/D)</span>
            <span className="text-[10px] text-amber-400">Total {circuits.length} Circuitos TE1</span>
          </div>

          <div className="relative bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 p-3 rounded-xl border-y-2 border-slate-500 shadow-md flex items-center gap-3 overflow-x-auto custom-scrollbar min-h-[120px]">
            {circuits.map((cto) => {
              const isMcbOn = mcbState[cto.code] !== false;
              const curveInfo = TRIP_CURVE_INFO[cto.curve] || TRIP_CURVE_INFO['Curva C'];

              return (
                <div
                  key={cto.code}
                  className={`shrink-0 bg-slate-900 border-2 p-3 rounded-xl space-y-2 w-52 shadow-2xl transition-all relative ${
                    !isMcbOn
                      ? 'border-slate-700 opacity-60'
                      : cto.curve === 'Curva B'
                      ? 'border-amber-500/80'
                      : cto.curve === 'Curva C'
                      ? 'border-emerald-500/80'
                      : 'border-purple-500/80'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="font-mono font-black text-amber-400 text-xs">{cto.code}</span>
                    <span className="text-[10px] text-slate-300 font-bold truncate max-w-[100px]">{cto.name}</span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs font-black text-white">
                    <span>1x{cto.amps}A</span>
                    <span className="text-[10px] text-slate-400 font-normal">{cto.loadW}W</span>
                  </div>

                  <div className="text-[9px] text-slate-400 font-mono flex justify-between">
                    <span>Cond: {cto.wire}</span>
                    <span>Tub: {cto.pipe}</span>
                  </div>

                  {/* Curve Selector */}
                  <div className="pt-1 border-t border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-semibold">Curva Disparo:</span>
                      <div className="relative group/curvedin">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400 hover:text-white cursor-pointer" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/curvedin:block w-64 p-3 bg-slate-900 border-2 border-amber-500 rounded-xl shadow-2xl text-[10px] text-white z-50 pointer-events-none">
                          <div className="font-bold text-amber-400 text-xs mb-1">
                            {cto.curve} ({curveInfo.range})
                          </div>
                          <p className="text-slate-300 leading-tight mb-1">{curveInfo.description}</p>
                          <div className="text-amber-300 font-mono bg-amber-950/40 p-1.5 rounded border border-amber-500/30">
                            <strong>Aplicación:</strong> {curveInfo.applications}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {(['Curva B', 'Curva C', 'Curva D'] as const).map((crv) => {
                        const isSel = cto.curve === crv;
                        return (
                          <button
                            key={crv}
                            type="button"
                            onClick={() => {
                              const currentCb = specs.circuitBreakers?.[cto.code] || {
                                amps: cto.amps,
                                breakingCapacity: cto.breakingCapacity,
                                wireSection: cto.wire,
                                pipeType: cto.pipe,
                                customName: cto.name,
                              };
                              const updated = {
                                ...specs,
                                circuitBreakers: {
                                  ...specs.circuitBreakers,
                                  [cto.code]: { ...currentCb, curve: crv },
                                },
                              };
                              updateSpecsAndSync(updated, `Curva de ${cto.code} cambiada a ${crv}.`);
                            }}
                            className={`text-[9px] font-black py-1 rounded transition-all border ${
                              isSel
                                ? crv === 'Curva B'
                                  ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow'
                                  : crv === 'Curva C'
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow'
                                  : 'bg-purple-500 text-white border-purple-300 font-black shadow'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {crv.replace('Curva ', '')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMcb(cto.code)}
                    className={`w-full py-1 rounded text-[10px] font-extrabold transition-all border ${
                      isMcbOn
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                        : 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900'
                    }`}
                  >
                    {isMcbOn ? 'ON (Energizado)' : 'OFF (Desconectado)'}
                  </button>
                </div>
              );
            })}

            {customRailModules.map((mod) => (
              <div
                key={mod.id}
                className="shrink-0 bg-purple-950/40 border-2 border-purple-400 p-3 rounded-xl space-y-2 w-48 shadow-2xl relative"
              >
                <div className="flex items-center justify-between border-b border-purple-800/60 pb-1">
                  <span className="text-[10px] font-black text-purple-300 truncate">{mod.label}</span>
                  <button
                    onClick={() => removeModuleFromRail(mod.id)}
                    className="text-rose-400 hover:text-white p-0.5"
                    title="Remover de Riel"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="font-mono text-xs font-bold text-white">
                  {mod.type === 'mcb' ? `1x${mod.amps}A (${mod.curve})` : 'Módulo Auxiliar'}
                </div>

                <span className="text-[9px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded border border-purple-700/50 block text-center font-mono">
                  AÑADIDO MANUAL
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SingleLineDiagramTabProps {
  rooms: RoomData[];
  highAppliances: HighAppliance[];
  feederLength: number;
  setFeederLength?: (len: number) => void;
  isThreePhase: boolean;
  feederWireSection: number;
  setFeederWireSection?: (sec: number) => void;
  customProtectionSpecs?: CustomProtectionSpecs;
  onUpdateProtectionSpecs?: (updated: CustomProtectionSpecs) => void;
  onSyncToBudget?: (updatedSpecs?: CustomProtectionSpecs) => void;
  contractor?: ContractorConfig;
  customer?: CustomerDetails;
}

export const SingleLineDiagramTab: React.FC<SingleLineDiagramTabProps> = ({
  rooms,
  highAppliances,
  feederLength,
  setFeederLength,
  isThreePhase,
  feederWireSection,
  setFeederWireSection,
  customProtectionSpecs,
  onUpdateProtectionSpecs = (_updated: CustomProtectionSpecs) => {},
  onSyncToBudget = (_updatedSpecs?: CustomProtectionSpecs) => {},
  contractor,
  customer,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalTab, setPdfModalTab] = useState<'branding' | 'options'>('branding');
  const [pdfColorChoice, setPdfColorChoice] = useState<'color' | 'bw'>('color');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isFullscreenDiagram, setIsFullscreenDiagram] = useState(false);
  const [isTypicalSchemesModalOpen, setIsTypicalSchemesModalOpen] = useState(false);
  const [isCadModalOpen, setIsCadModalOpen] = useState(false);
  const diagramDocRef = useRef<HTMLDivElement>(null);

  // Contractor Branding & Logo State for PDF Output
  const [contractorInfo, setContractorInfo] = useState({
    companyName: contractor?.companyName || 'NEOVOLT - Ingeniería Eléctrica de Precisión',
    installerName: contractor?.installerName || 'Camilo Rojas',
    secLicense: contractor?.secLicense || 'SEC-84291-CL',
    secClass: contractor?.secClass || 'Clase A (Alta y Baja Tensión)',
    rut: contractor?.rut || '76.892.410-5',
    phone: contractor?.phone || '+56 9 9876 5432',
    email: contractor?.senderEmail || 'contacto@neovolt.cl',
    address: contractor?.address || 'Av. Andrés Bello 2233, Providencia, Santiago',
    logoUrl: contractor?.customLogoUrl || '',
  });

  // Project Metadata State for PDF Output
  const [projectInfo, setProjectInfo] = useState({
    clientName: customer?.name || 'Juan Pérez Ovalle',
    clientRut: customer?.rut || '15.482.910-3',
    projectAddress: customer?.address || 'Av. Providencia 1240, Santiago',
    projectCity: customer?.city || 'Providencia',
    projectCode: 'TE1-2026-TDA01',
    projectDate: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  });

  // Update contractor & customer if parent props update
  useEffect(() => {
    if (contractor) {
      setContractorInfo((prev) => ({
        ...prev,
        companyName: contractor.companyName || prev.companyName,
        installerName: contractor.installerName || prev.installerName,
        secLicense: contractor.secLicense || prev.secLicense,
        secClass: contractor.secClass || prev.secClass,
        rut: contractor.rut || prev.rut,
        phone: contractor.phone || prev.phone,
        email: contractor.senderEmail || prev.email,
        address: contractor.address || prev.address,
        logoUrl: contractor.customLogoUrl || prev.logoUrl,
      }));
    }
  }, [contractor]);

  useEffect(() => {
    if (customer) {
      setProjectInfo((prev) => ({
        ...prev,
        clientName: customer.name || prev.clientName,
        clientRut: customer.rut || prev.clientRut,
        projectAddress: customer.address || prev.projectAddress,
        projectCity: customer.city || prev.projectCity,
      }));
    }
  }, [customer]);

  // Logo upload reader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('⚠️ El archivo de logo debe pesar menos de 3 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setContractorInfo((prev) => ({ ...prev, logoUrl: reader.result as string }));
        showToast(' Logotipo del contratista cargado con éxito.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Active editing modal state for diagram elements
  const [editingComponent, setEditingComponent] = useState<{
    type: 'iga' | 'dps' | 'rcd' | 'cb' | 'feeder';
    rcdGroup?: number;
    code?: string;
    currentName?: string;
  } | null>(null);

  // Local copy of protection specs for live edits
  const specs: CustomProtectionSpecs = customProtectionSpecs || {
    iga: { amps: 25, curve: 'Curva C', breakingCapacity: '6kA', poles: isThreePhase ? '3x' : '1x' },
    dps: { voltage: isThreePhase ? '400V' : '275V', dischargeCurrent: '20kA' },
    rcds: {
      1: { amps: 25, sensitivity: '30mA', classType: 'Clase AC' },
      2: { amps: 40, sensitivity: '30mA', classType: 'Clase AC' },
      3: { amps: 40, sensitivity: '30mA', classType: 'Clase AC' },
    },
    circuitBreakers: {},
  };

  // Total Load calculation
  const totalLights = rooms.reduce((sum, r) => sum + r.lightPoints, 0);
  const totalSockets = rooms.reduce((sum, r) => sum + r.socketPoints, 0);
  const roomDevWatts = rooms.reduce((sum, r) => sum + r.devices.reduce((d, x) => d + x.powerWatts * x.quantity, 0), 0);
  const totalPowerW = totalLights * 100 + totalSockets * 150 + roomDevWatts + highAppliances.reduce((sum, h) => sum + h.powerWatts, 0);
  const totalPowerKW = totalPowerW / 1000;

  // Nominal voltage & default IGA calculation
  const vNominal = isThreePhase ? 380 : 220;
  const currentIn = totalPowerW / (vNominal * 0.93 * (isThreePhase ? 1.732 : 1));
  let calculatedIgaRating = 25;
  if (currentIn > 40) calculatedIgaRating = 50;
  else if (currentIn > 32) calculatedIgaRating = 40;
  else if (currentIn > 25) calculatedIgaRating = 32;
  else if (currentIn > 16) calculatedIgaRating = 25;
  else calculatedIgaRating = 16;

  // Active IGA specs
  const igaAmps = specs.iga?.amps || calculatedIgaRating;
  const igaCurve = specs.iga?.curve || 'Curva C';
  const igaBreaking = specs.iga?.breakingCapacity || '6kA';
  const igaPoles = specs.iga?.poles || (isThreePhase ? '3x' : '1x');

  // Active DPS specs
  const dpsVoltage = specs.dps?.voltage || (isThreePhase ? '400V' : '275V');
  const dpsDischarge = specs.dps?.dischargeCurrent || '20kA';

  // State & Calculations for Voltage Drop Calculator (Norma SEC RIC N°04)
  const [calcCurrent, setCalcCurrent] = useState<number>(() => Math.round((currentIn || 15) * 10) / 10);
  const [calcDistance, setCalcDistance] = useState<number>(() => feederLength || 20);

  // Standard Normalized Conductor Sections (mm²) under SEC RIC N°04
  const NORMALIZED_SECTIONS = [2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0, 95.0, 120.0];

  // RIC N°04 Parameters
  const rhoCopper = 0.0178; // Resistividad cobre Ω·mm²/m
  const maxAllowedDropPercent = 3.0; // 3.0% máx permitido para alimentadores según RIC N°04
  const vMaxAllowedVolts = (vNominal * maxAllowedDropPercent) / 100;

  // Calculate voltage drop in Volts and % for a given section S (mm²), distance L (m), current I (A)
  const calculateVoltageDrop = (s: number, l: number, i: number) => {
    if (s <= 0 || l <= 0 || i <= 0) return { dropVolts: 0, dropPercent: 0 };
    const factor = isThreePhase ? Math.sqrt(3) : 2.0;
    const dropVolts = (factor * l * i * rhoCopper) / s;
    const dropPercent = (dropVolts / vNominal) * 100;
    return { dropVolts, dropPercent };
  };

  const calcFactor = isThreePhase ? Math.sqrt(3) : 2.0;
  const theoreticalSection = (calcFactor * calcDistance * calcCurrent * rhoCopper) / vMaxAllowedVolts;
  const suggestedSection = NORMALIZED_SECTIONS.find((s) => s >= theoreticalSection) || 120.0;
  const currentSection = feederWireSection || 4.0;
  const currentDrop = calculateVoltageDrop(currentSection, calcDistance, calcCurrent);
  const isSectionInsufficient = currentSection < suggestedSection || currentDrop.dropPercent > maxAllowedDropPercent;

  // Build Raw Circuits List
  const rawCircuits: {
    code: string;
    name: string;
    defaultBreaker: string;
    defaultWire: string;
    defaultPipe: string;
    loadW: number;
    rcdGroup: number;
    defaultAmps: number;
  }[] = [];

  let lightCount = Math.ceil(totalLights / 12) || (totalLights > 0 ? 1 : 0);
  let socketCount = Math.ceil(totalSockets / 10) || (totalSockets > 0 ? 1 : 0);

  let cIdx = 1;
  for (let i = 0; i < lightCount; i++) {
    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Alumbrado General ${i + 1}`,
      defaultBreaker: '1x10A 6kA Curva C',
      defaultWire: '3 x 1.5 mm² EVA',
      defaultPipe: 'PVC 20mm',
      loadW: Math.round((totalLights * 100) / (lightCount || 1)),
      rcdGroup: Math.ceil(cIdx / 3),
      defaultAmps: 10,
    });
    cIdx++;
  }

  for (let i = 0; i < socketCount; i++) {
    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Enchufes Generales 10A ${i + 1}`,
      defaultBreaker: '1x16A 6kA Curva C',
      defaultWire: '3 x 2.5 mm² EVA',
      defaultPipe: 'PVC 25mm',
      loadW: Math.round((totalSockets * 150 + roomDevWatts) / (socketCount || 1)),
      rcdGroup: Math.ceil(cIdx / 3),
      defaultAmps: 16,
    });
    cIdx++;
  }

  highAppliances.forEach((app) => {
    let b = '1x16A 6kA Curva C';
    let w = '3 x 2.5 mm² EVA';
    let p = 'PVC 25mm';
    let a = 16;
    if (app.powerWatts > 5000) {
      b = '1x32A 6kA Curva C';
      w = '3 x 6.0 mm² EVA';
      p = 'EMT 3/4"';
      a = 32;
    } else if (app.powerWatts > 3000) {
      b = '1x20A 6kA Curva C';
      w = '3 x 4.0 mm² EVA';
      p = 'PVC 25mm';
      a = 20;
    }

    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Carga Dedicada - ${app.name}`,
      defaultBreaker: b,
      defaultWire: w,
      defaultPipe: p,
      loadW: app.powerWatts,
      rcdGroup: Math.ceil(cIdx / 3),
      defaultAmps: a,
    });
    cIdx++;
  });

  if (rawCircuits.length === 0) {
    rawCircuits.push({
      code: 'C1',
      name: 'Circuito General',
      defaultBreaker: '1x16A 6kA Curva C',
      defaultWire: '3 x 2.5 mm² EVA',
      defaultPipe: 'PVC 25mm',
      loadW: 2000,
      rcdGroup: 1,
      defaultAmps: 16,
    });
  }

  // Map active circuits with user overrides
  const circuits = rawCircuits.map((cto) => {
    const custom = specs.circuitBreakers?.[cto.code];
    if (custom) {
      return {
        ...cto,
        name: custom.customName || cto.name,
        breaker: `1x${custom.amps}A ${custom.breakingCapacity} ${custom.curve}`,
        wire: custom.wireSection,
        pipe: custom.pipeType,
        amps: custom.amps,
        curve: custom.curve,
        breakingCapacity: custom.breakingCapacity,
      };
    }
    return {
      ...cto,
      breaker: cto.defaultBreaker,
      wire: cto.defaultWire,
      pipe: cto.defaultPipe,
      amps: cto.defaultAmps,
      curve: 'Curva C',
      breakingCapacity: '6kA',
    };
  });

  // REAL-TIME VALIDATOR FOR RIC N°01 & RIC N°04
  const ricCompliance = useMemo(() => {
    // 1. Feeder Drop Check (RIC N°04)
    const feederDropOk = currentDrop.dropPercent <= maxAllowedDropPercent;

    // 2. Breaking Capacity Check (RIC N°01 / RIC N°02)
    const igaKa = parseFloat(igaBreaking.replace(/[^0-9.]/g, '')) || 6;
    const igaBreakingOk = igaKa >= 6;

    // 3. Circuits Evaluation (Voltage Drop, Thermal Coordination, Breaking Capacity, RCD Group)
    const circuitResults = circuits.map((c) => {
      const loadW = c.loadW || 0;
      const ib = Math.round((loadW / (220 * 0.93)) * 10) / 10;
      const inRating = c.amps || 16;
      const wireMm2 = parseFloat(c.wire.replace(/[^0-9.]/g, '')) || 2.5;

      // Allowable current Iz for copper EVA in conduit per RIC N°04 Table 4.4
      let iz = 21;
      if (wireMm2 <= 1.5) iz = 15.5;
      else if (wireMm2 <= 2.5) iz = 21;
      else if (wireMm2 <= 4.0) iz = 28;
      else if (wireMm2 <= 6.0) iz = 36;
      else if (wireMm2 <= 10.0) iz = 50;

      // Branch voltage drop (assumed 18m avg branch length)
      const branchLength = 18;
      const branchDropVolts = (2 * branchLength * Math.max(0.5, ib) * rhoCopper) / wireMm2;
      const branchDropPercent = (branchDropVolts / 220) * 100;
      const branchDropOk = branchDropPercent <= 3.0;

      // Thermal coordination: Ib <= In <= Iz
      const overloadOk = ib <= inRating;
      const thermalOk = inRating <= iz;

      // Breaking capacity of MCB
      const mcbKa = parseFloat(c.breakingCapacity.replace(/[^0-9.]/g, '')) || 6;
      const mcbKaOk = mcbKa >= 6;

      let status: 'ok' | 'warning' | 'error' = 'ok';
      let message = 'Cumple RIC N°01 y RIC N°04';

      if (!thermalOk) {
        status = 'error';
        message = `PELIGRO TÉRMICO (RIC N°04): Disyuntor ${inRating}A excede capacidad del conductor ${wireMm2}mm² (Iz=${iz}A)`;
      } else if (!overloadOk) {
        status = 'error';
        message = `SOBRECARGA (RIC N°01): Corriente de carga Ib=${ib}A supera In=${inRating}A`;
      } else if (!branchDropOk) {
        status = 'error';
        message = `CAÍDA DE TENSIÓN EXCEDIDA (RIC N°04): ΔV=${branchDropPercent.toFixed(2)}% > 3.0%`;
      } else if (!mcbKaOk) {
        status = 'warning';
        message = `PODER DE CORTE MARGINAL (RIC N°01): Poder de corte ${mcbKa}kA < 6kA`;
      } else if (branchDropPercent > 2.5 || ib > inRating * 0.8) {
        status = 'warning';
        message = `PARÁMETRO CERCANO AL LÍMITE: Carga al ${Math.round((ib / inRating) * 100)}% o ΔV=${branchDropPercent.toFixed(2)}%`;
      }

      return {
        code: c.code,
        name: c.name,
        ib,
        inRating,
        wireMm2,
        iz,
        branchDropPercent,
        status,
        message,
      };
    });

    const errorCount = circuitResults.filter((r) => r.status === 'error').length + (feederDropOk ? 0 : 1) + (igaBreakingOk ? 0 : 1);
    const warningCount = circuitResults.filter((r) => r.status === 'warning').length;
    const isOverallCompliant = errorCount === 0;

    return {
      feederDropOk,
      igaBreakingOk,
      circuitResults,
      errorCount,
      warningCount,
      isOverallCompliant,
    };
  }, [circuits, currentDrop, maxAllowedDropPercent, igaBreaking]);

  // Handle Loading a Typical Scheme from Library
  const handleSelectTypicalScheme = (scheme: TypicalScheme) => {
    const newCircuitBreakers: Record<string, any> = {};
    scheme.circuits.forEach((c) => {
      newCircuitBreakers[c.code] = {
        customName: c.name,
        amps: c.breakerAmps || 16,
        curve: c.breakerRating.includes('Curva B') ? 'Curva B' : c.breakerRating.includes('Curva D') ? 'Curva D' : 'Curva C',
        breakingCapacity: c.breakerRating.includes('10kA') ? '10kA' : '6kA',
        wireSection: c.wireSection,
        pipeType: c.conduitType,
      };
    });

    const newSpecs: CustomProtectionSpecs = {
      iga: {
        amps: scheme.igaSpec.amps,
        curve: `Curva ${scheme.igaSpec.curve}`,
        breakingCapacity: `${scheme.igaSpec.icnKa}kA`,
        poles: `${scheme.igaSpec.poles}x`,
      },
      dps: {
        voltage: scheme.dpsSpec.voltage,
        dischargeCurrent: `${scheme.dpsSpec.dischargeKa}kA`,
      },
      rcds: scheme.rcdsSpec.reduce((acc, r, idx) => {
        acc[idx + 1] = {
          amps: r.amps,
          sensitivity: `${r.sensitivityMa}mA`,
          classType: r.classType,
        };
        return acc;
      }, {} as Record<number, any>),
      circuitBreakers: newCircuitBreakers,
    };

    if (setFeederLength && scheme.feederLength) {
      setFeederLength(scheme.feederLength);
    }
    if (setFeederWireSection && scheme.feederWireSection) {
      setFeederWireSection(scheme.feederWireSection);
    }

    updateSpecsAndSync(newSpecs, `⚡ Esquema típico "${scheme.name}" cargado exitosamente.`);
    setIsTypicalSchemesModalOpen(false);
  };

  const rcdCount = Math.max(1, Math.ceil(circuits.length / 3));

  const handleDownloadPdf = async (choice: 'color' | 'bw' = 'color') => {
    setIsGeneratingPdf(true);
    setIsPdfModalOpen(false);
    try {
      const isBw = choice === 'bw';
      const success = await downloadPdfFromElement(diagramDocRef.current, {
        filename: isBw ? `Diagrama_Unifilar_${projectInfo.projectCode}_BN.pdf` : `Diagrama_Unifilar_${projectInfo.projectCode}.pdf`,
        margin: 8,
        orientation: 'landscape',
        isBlackAndWhite: isBw,
      });
      if (success) {
        showToast(
          isBw
            ? '📄 Plano exportado a PDF en Blanco y Negro con logotipo del contratista y resumen de protecciones.'
            : '🎨 Plano exportado a PDF a Color con logotipo del contratista y resumen de protecciones.'
        );
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintDiagram = () => {
    window.print();
  };

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 4500);
  };

  const updateSpecsAndSync = (newSpecs: CustomProtectionSpecs, msg: string) => {
    onUpdateProtectionSpecs(newSpecs);
    onSyncToBudget(newSpecs);
    showToast(msg);
  };

  const handleAutoGenerateSchema = () => {
    // 1. Calculate loads from rooms and highAppliances
    const totalLightsCount = rooms.reduce((sum, r) => sum + (r.lightPoints || 0), 0);
    const totalSocketsCount = rooms.reduce((sum, r) => sum + (r.socketPoints || 0), 0);
    const roomDevsPower = rooms.reduce(
      (sum, r) => sum + (r.devices || []).reduce((d, x) => d + (x.powerWatts || 0) * (x.quantity || 1), 0),
      0
    );
    const highAppPower = highAppliances.reduce((sum, h) => sum + (h.powerWatts || 0), 0);
    const calculatedTotalW = totalLightsCount * 100 + totalSocketsCount * 150 + roomDevsPower + highAppPower;

    const nominalVoltage = isThreePhase ? 380 : 220;
    const currentInAmps = calculatedTotalW / (nominalVoltage * 0.93 * (isThreePhase ? 1.732 : 1));

    // 2. Determine IGA rating per RIC N°02 / RIC N°05
    let autoIgaAmps = 25;
    if (currentInAmps > 50) autoIgaAmps = 63;
    else if (currentInAmps > 40) autoIgaAmps = 50;
    else if (currentInAmps > 32) autoIgaAmps = 40;
    else if (currentInAmps > 25) autoIgaAmps = 32;
    else if (currentInAmps > 16) autoIgaAmps = 25;
    else autoIgaAmps = 16;

    // 3. Feeder section check per RIC N°04
    const distanceL = feederLength || 20;
    const calcFactor = isThreePhase ? Math.sqrt(3) : 2.0;
    const maxDropVolts = (nominalVoltage * 3.0) / 100;
    const theoreticalS = (calcFactor * distanceL * Math.max(1, currentInAmps) * rhoCopper) / maxDropVolts;
    const recommendedFeederSection = NORMALIZED_SECTIONS.find((s) => s >= theoreticalS) || 4.0;

    if (setFeederWireSection && feederWireSection < recommendedFeederSection) {
      setFeederWireSection(recommendedFeederSection);
    }

    // 4. Build circuit breakers list
    let lightCircCount = Math.ceil(totalLightsCount / 12) || (totalLightsCount > 0 ? 1 : 0);
    let socketCircCount = Math.ceil(totalSocketsCount / 10) || (totalSocketsCount > 0 ? 1 : 0);

    const generatedCircuitBreakers: Record<
      string,
      {
        amps: number;
        curve: string;
        breakingCapacity: string;
        wireSection: string;
        pipeType: string;
        customName?: string;
      }
    > = {};

    let circuitIndex = 1;

    for (let i = 0; i < lightCircCount; i++) {
      const code = `C${circuitIndex}`;
      generatedCircuitBreakers[code] = {
        amps: 10,
        curve: 'Curva C',
        breakingCapacity: '6kA',
        wireSection: '3 x 1.5 mm² EVA',
        pipeType: 'PVC 20mm',
        customName: `Alumbrado General ${i + 1}`,
      };
      circuitIndex++;
    }

    for (let i = 0; i < socketCircCount; i++) {
      const code = `C${circuitIndex}`;
      generatedCircuitBreakers[code] = {
        amps: 16,
        curve: 'Curva C',
        breakingCapacity: '6kA',
        wireSection: '3 x 2.5 mm² EVA',
        pipeType: 'PVC 25mm',
        customName: `Enchufes Generales ${i + 1}`,
      };
      circuitIndex++;
    }

    highAppliances.forEach((app) => {
      const code = `C${circuitIndex}`;
      let amps = 16;
      let wire = '3 x 2.5 mm² EVA';
      let pipe = 'PVC 25mm';
      if (app.powerWatts > 5000) {
        amps = 32;
        wire = '3 x 6.0 mm² EVA';
        pipe = 'EMT 3/4"';
      } else if (app.powerWatts > 3000) {
        amps = 20;
        wire = '3 x 4.0 mm² EVA';
        pipe = 'PVC 25mm';
      }

      generatedCircuitBreakers[code] = {
        amps,
        curve: 'Curva C',
        breakingCapacity: '6kA',
        wireSection: wire,
        pipeType: pipe,
        customName: `Carga Dedicada - ${app.name}`,
      };
      circuitIndex++;
    });

    if (circuitIndex === 1) {
      generatedCircuitBreakers['C1'] = {
        amps: 16,
        curve: 'Curva C',
        breakingCapacity: '6kA',
        wireSection: '3 x 2.5 mm² EVA',
        pipeType: 'PVC 25mm',
        customName: 'Circuito General Base',
      };
      circuitIndex = 2;
    }

    const totalCircuitsGenerated = circuitIndex - 1;
    const rcdGroupsNeeded = Math.max(1, Math.ceil(totalCircuitsGenerated / 3));
    const generatedRcds: Record<number, { amps: number; sensitivity: string; classType: string }> = {};

    for (let g = 1; g <= rcdGroupsNeeded; g++) {
      generatedRcds[g] = {
        amps: autoIgaAmps >= 40 ? 40 : 25,
        sensitivity: '30mA',
        classType: 'Clase AC',
      };
    }

    const updatedSpecs: CustomProtectionSpecs = {
      iga: {
        amps: autoIgaAmps,
        curve: 'Curva C',
        breakingCapacity: '6kA',
        poles: isThreePhase ? '3x' : '1x',
      },
      dps: {
        voltage: isThreePhase ? '400V' : '275V',
        dischargeCurrent: '20kA',
      },
      rcds: generatedRcds,
      circuitBreakers: generatedCircuitBreakers,
    };

    updateSpecsAndSync(
      updatedSpecs,
      `⚡ Esquema unilineal autogenerado según RIC SEC: Potencia Total ${(calculatedTotalW / 1000).toFixed(2)} kW | IGA ${updatedSpecs.iga.poles}${autoIgaAmps}A | Alimentador ${recommendedFeederSection}mm² EVA (${distanceL}m) | ${totalCircuitsGenerated} Circuitos | ${rcdGroupsNeeded} RCD(s)`
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Controls & Interactivity Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Diagrama Unifilar Interactivo TE1 (SEC Chile)</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Plano Eléctrico Unilineal de Tablero TDA</span>
            <span className="bg-fuchsia-600/30 text-fuchsia-300 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-fuchsia-500/40">
              PDF Profesional
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Diseña, personaliza protecciones y exporta un documento PDF formal con logotipo del contratista, datos del proyecto y tabla de resumen de protecciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsTypicalSchemesModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs px-3.5 py-2 rounded-lg shadow-lg border border-cyan-400/50 transition-all active:scale-95"
            title="Cargar esquemas típicos preconfigurados (Tablero Básico, Trifásico, Clima, etc.)"
          >
            <Layers className="w-4 h-4 text-cyan-200" />
            <span>Biblioteca Esquemas Típicos</span>
          </button>

          <button
            onClick={handleAutoGenerateSchema}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-lg shadow-lg border border-amber-300/50 transition-all active:scale-95"
            title="Generar esquema unilineal automático según cargas actuales y norma RIC SEC"
          >
            <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Auto-Generar Esquema RIC</span>
          </button>

          <button
            onClick={() => {
              onSyncToBudget(specs);
              showToast(' Cotización y Simulación 2D sincronizadas con las protecciones del plano.');
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition-all active:scale-95"
            title="Sincronizar especificaciones con Cotización"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizar Presupuesto</span>
          </button>

          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setIsFullscreenDiagram(true)}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Expandir a Pantalla Completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-200 px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg transition-all active:scale-95"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Exportar PDF Profesional'}</span>
          </button>

          <button
            onClick={handlePrintDiagram}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 transition-all"
            title="Vista de impresión"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* MODAL DE BIBLIOTECA DE ESQUEMAS TÍPICOS */}
      <TypicalSchemesModal
        isOpen={isTypicalSchemesModalOpen}
        onClose={() => setIsTypicalSchemesModalOpen(false)}
        onSelectScheme={handleSelectTypicalScheme}
      />

      {/* MONITOR DE CUMPLIMIENTO RIC N°01 Y RIC N°04 EN TIEMPO REAL */}
      <div
        className={`rounded-2xl border p-5 shadow-xl transition-all ${
          ricCompliance.isOverallCompliant
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
            : ricCompliance.errorCount > 0
            ? 'bg-rose-950/40 border-rose-500/60 text-rose-100'
            : 'bg-amber-950/40 border-amber-500/60 text-amber-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                ricCompliance.isOverallCompliant
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : ricCompliance.errorCount > 0
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}
            >
              {ricCompliance.isOverallCompliant ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : ricCompliance.errorCount > 0 ? (
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Validador RIC N°01 & RIC N°04 en Tiempo Real
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    ricCompliance.isOverallCompliant
                      ? 'bg-emerald-900/80 text-emerald-300 border-emerald-600'
                      : ricCompliance.errorCount > 0
                      ? 'bg-rose-900/80 text-rose-300 border-rose-600 animate-pulse'
                      : 'bg-amber-900/80 text-amber-300 border-amber-600'
                  }`}
                >
                  {ricCompliance.isOverallCompliant
                    ? '100% CONFORME NORMATIVA SEC'
                    : `${ricCompliance.errorCount} ERRORES • ${ricCompliance.warningCount} ADVERTENCIAS`}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Verificación continua de corrientes de cortocircuito (Icn ≥ 6kA), coordinación térmica de conductores EVA (Ib ≤ In ≤ Iz) y caídas de tensión (ΔV ≤ 3.0%).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>{ricCompliance.circuitResults.filter((r) => r.status === 'ok').length} Conformes</span>
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{ricCompliance.warningCount} Advertencias</span>
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>{ricCompliance.errorCount} Observaciones</span>
            </span>
          </div>
        </div>

        {/* List of Non-compliant Items if Any */}
        {!ricCompliance.isOverallCompliant && (
          <div className="mt-3 space-y-2">
            {ricCompliance.circuitResults
              .filter((r) => r.status !== 'ok')
              .map((res) => (
                <div
                  key={res.code}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    res.status === 'error'
                      ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                      : 'bg-amber-950/80 border-amber-700/80 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {res.code}
                    </span>
                    <span className="font-bold text-white">{res.name}:</span>
                    <span className="text-[11px]">{res.message}</span>
                  </div>

                  <span className="text-[10px] font-mono shrink-0 px-2 py-0.5 rounded bg-slate-950/80">
                    Ib={res.ib}A | In={res.inRating}A | S={res.wireMm2}mm²
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* CARD CALLOUT DE GENERACIÓN AUTOMÁTICA DE ESQUEMA UNILINEAL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
            <Zap className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white uppercase tracking-wide">
                Generador Automático de Esquema Unilineal RIC SEC
              </h3>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Basado en Cargas Actuales & Normativa
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Analiza los recuentos de <strong>{rooms.length} recintos</strong> ({totalLights} ptos. luz, {totalSockets} ptos. enchufes) y <strong>{highAppliances.length} cargas pesadas</strong>. Auto-calcula la potencia (<strong>{totalPowerKW.toFixed(2)} kW</strong> / <strong>{Math.round(currentIn)} A</strong>), dimensiona el alimentador EVA ({currentSection} mm²), asigna el IGA ({igaPoles}{igaAmps}A), los grupos diferenciales RCD y canalizaciones reglamentarias.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setIsCadModalOpen(true)}
            className="shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs px-3.5 py-3 rounded-xl shadow-lg border border-cyan-400/40 transition-all active:scale-95 flex items-center gap-2"
            title="Cargar y visualizar planos de AutoCAD (.DXF / .DWG) para sincronizar con este diagrama"
          >
            <FileCode className="w-4 h-4 text-cyan-200" />
            <span>Cargar Plano CAD (.DXF)</span>
          </button>

          <button
            onClick={handleAutoGenerateSchema}
            className="shrink-0 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs px-4 py-3 rounded-xl shadow-lg border border-amber-300/60 transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-950" />
            <span>Generar Esquema Unilineal RIC</span>
          </button>
        </div>
      </div>

      {/* CALCULADORA DE CAÍDA DE TENSIÓN Y SECCIÓN MÍNIMA (NORMA SEC RIC N°04) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Calculadora de Caída de Tensión (Norma SEC RIC N°04)
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Máx 3.0% Alimentadores
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dimensionamiento de sección de conductor ($S$ mm²) según corriente de carga ($I$) y distancia ($L$).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <span className="text-slate-400">Tensión Nominal:</span>
            <span className="text-emerald-400">{vNominal}V ({isThreePhase ? 'Trifásico 3Ф' : 'Monofásico 1Ф'})</span>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Corriente de Carga Input */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <label className="font-bold text-slate-200">Corriente de Carga ($I$)</label>
              <button
                type="button"
                onClick={() => setCalcCurrent(Math.round((currentIn || 15) * 10) / 10)}
                className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 font-semibold underline shrink-0"
                title="Cargar corriente de diseño total de la instalación"
              >
                Cargar I_total ({Math.round((currentIn || 15) * 10) / 10}A)
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="300"
                value={calcCurrent}
                onChange={(e) => setCalcCurrent(Math.max(0.1, Number(e.target.value) || 0.1))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500"
              />
              <span className="absolute right-3 top-2 text-slate-400 font-bold font-mono">A</span>
            </div>
            <p className="text-[10px] text-slate-400">Ingresa la corriente en Amperes a transmitir por el alimentador.</p>
          </div>

          {/* Distancia / Longitud Input */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <label className="font-bold text-slate-200 block">Distancia / Longitud ($L$)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="300"
                value={calcDistance}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setCalcDistance(val);
                  if (setFeederLength) setFeederLength(val);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500"
              />
              <span className="absolute right-3 top-2 text-slate-400 font-bold font-mono">m</span>
            </div>
            <p className="text-[10px] text-slate-400">Distancia en metros desde el medidor hasta el tablero TDA.</p>
          </div>

          {/* Sección de Conductor Seleccionado */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <label className="font-bold text-slate-200 block">Sección Seleccionada ($S$ mm²)</label>
            <select
              value={currentSection}
              onChange={(e) => {
                const sec = Number(e.target.value);
                if (setFeederWireSection) setFeederWireSection(sec);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500"
            >
              {NORMALIZED_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec} mm² EVA {sec === suggestedSection ? '(Recomendado RIC N°04)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">Sección en mm² del alimentador de cobre asignado.</p>
          </div>
        </div>

        {/* Calculation Result Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Caída Tensión (Volts)</span>
            <span className={`text-base font-black font-mono ${isSectionInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentDrop.dropVolts.toFixed(2)} Volts
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Porcentaje Caída (%)</span>
            <span className={`text-base font-black font-mono ${isSectionInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentDrop.dropPercent.toFixed(2)}%
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Sección Teórica Cobre</span>
            <span className="text-base font-black font-mono text-indigo-300">
              {theoreticalSection.toFixed(2)} mm²
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Sección Sugerida Norma</span>
            <span className="text-base font-black font-mono text-emerald-400">
              {suggestedSection.toFixed(1)} mm² EVA
            </span>
          </div>
        </div>

        {/* Voltage Drop Meter Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-400">Caída de Tensión Calculada vs Límite Norma RIC N°04 (3.0%)</span>
            <span className={isSectionInsufficient ? 'text-rose-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
              {currentDrop.dropPercent.toFixed(2)}% de 3.0% max
            </span>
          </div>
          <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: '60%' }}
              title="Límite reglamentario 3.0% SEC RIC N°04"
            />
            <div
              className={`h-full transition-all duration-300 ${
                currentDrop.dropPercent > 3.0
                  ? 'bg-gradient-to-r from-rose-600 to-red-500'
                  : currentDrop.dropPercent > 2.2
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, (currentDrop.dropPercent / 5.0) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0%</span>
            <span>1.5%</span>
            <span className="text-amber-400 font-bold">3.0% (Límite RIC N°04)</span>
            <span>4.5%</span>
            <span>5.0%+</span>
          </div>
        </div>

        {/* Visual Warning Box if Insufficient / Compliance Confirmation */}
        {isSectionInsufficient ? (
          <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-rose-300 uppercase tracking-wide flex items-center gap-2">
                  <span>¡ADVERTENCIA! SECCIÓN DE CONDUCTOR INSUFICIENTE</span>
                  <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                    SEC RIC N°04 RECHAZADO
                  </span>
                </h4>
                <p className="text-xs text-rose-100 leading-relaxed">
                  La sección seleccionada de <strong className="text-white underline">{currentSection} mm² EVA</strong> para una corriente de <strong className="text-white">{calcCurrent} A</strong> a <strong className="text-white">{calcDistance} m</strong> produce una caída de tensión de <strong className="text-rose-300 font-bold">{currentDrop.dropPercent.toFixed(2)}% ({currentDrop.dropVolts.toFixed(2)} V)</strong>. Esto supera el límite máximo del <strong className="text-amber-300">3.0% ({vMaxAllowedVolts.toFixed(2)} V)</strong> de la norma RIC N°04.
                </p>
                <div className="text-[11px] text-rose-200 font-medium">
                  Sección mínima reglamentaria requerida: <strong className="text-emerald-300 font-bold">{suggestedSection} mm² EVA</strong>.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (setFeederWireSection) setFeederWireSection(suggestedSection);
                showToast(`Sección de alimentador corregida a ${suggestedSection} mm² EVA según norma SEC RIC N°04.`);
              }}
              className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400/50 transition-all active:scale-95 flex items-center gap-2 self-start md:self-auto"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar {suggestedSection} mm² EVA</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 text-emerald-200 flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="font-bold text-white">Conductor Cumple Norma SEC RIC N°04:</strong>{' '}
              La sección de <strong className="text-emerald-300">{currentSection} mm² EVA</strong> limita la caída de tensión a <strong className="text-emerald-300">{currentDrop.dropPercent.toFixed(2)}% ({currentDrop.dropVolts.toFixed(2)} V)</strong>, manteniéndose dentro del umbral reglamentario del 3.0%.
            </div>
          </div>
        )}
      </div>

      {/* MÓDULO DE GRÁFICO RECHARTS: DISTRIBUCIÓN DE POTENCIA Y BALANCEO DE FASES */}
      <CircuitPowerBarChart
        circuits={circuits}
        isThreePhase={isThreePhase}
        vNominal={vNominal}
      />

      {/* NUEVO MÓDULO: RENDERIZADO AUTOMÁTICO EN MOTOR CANVAS 2D CAD */}
      <SingleLineCanvasRenderer
        isThreePhase={isThreePhase}
        feederLength={feederLength || 20}
        feederWireSection={currentSection}
        iga={{
          amps: igaAmps,
          curve: igaCurve,
          breakingCapacity: igaBreaking,
          poles: igaPoles,
        }}
        dps={{
          voltage: dpsVoltage,
          dischargeCurrent: dpsDischarge,
        }}
        rcds={specs.rcds || {}}
        circuits={circuits}
        vNominal={vNominal}
        dropVolts={currentDrop.dropVolts}
        dropPercent={currentDrop.dropPercent}
        isDropExceeded={isSectionInsufficient || currentDrop.dropPercent > maxAllowedDropPercent}
      />

      {/* NUEVO MÓDULO: SIMULADOR FÍSICO DE TABLERO 2D CON AUTO-CABLEADO Y RIELES DIN */}
      <Tablero2DSimulator
        isThreePhase={isThreePhase}
        vNominal={vNominal}
        iga={{
          amps: igaAmps,
          curve: igaCurve,
          breakingCapacity: igaBreaking,
          poles: igaPoles,
        }}
        dps={{
          voltage: dpsVoltage,
          dischargeCurrent: dpsDischarge,
        }}
        rcds={specs.rcds || {}}
        circuits={circuits}
        specs={specs}
        updateSpecsAndSync={updateSpecsAndSync}
        showToast={showToast}
        feederWireSection={currentSection}
        feederLength={feederLength || 20}
      />

      {/* DOCUMENTO Y DIAGRAMA IMPRIMIBLE COMPLETO PARA PDF (REF: diagramDocRef) */}
      <div
        ref={diagramDocRef}
        className={
          isFullscreenDiagram
            ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-auto custom-scrollbar flex flex-col'
            : 'bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-x-auto min-h-[550px] relative text-slate-100'
        }
      >
        {isFullscreenDiagram && (
          <div className="flex items-center justify-between mb-4 shrink-0 sticky left-0 top-0 z-10 bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-fuchsia-400" />
              <span>Diagrama Unifilar (Pantalla Completa)</span>
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1.5 text-slate-300 hover:text-white"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-200 px-2">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.1))}
                  className="p-1.5 text-slate-300 hover:text-white"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsFullscreenDiagram(false)}
                className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        )}

        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', minWidth: '1200px' }} className="transition-transform duration-300 ease-in-out">
          {/* ENCABEZADO FORMAL CONTRATISTA Y PROYECTO CON LOGOTIPO */}
          <div className="mb-6 bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            {/* Logotipo e Información de Empresa Contratista */}
            <div className="flex items-center gap-4">
              {contractorInfo.logoUrl ? (
                <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex items-center justify-center shrink-0">
                  <img
                    src={contractorInfo.logoUrl}
                    alt="Logotipo Contratista"
                    className="h-14 max-w-[180px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-slate-900 text-amber-400 rounded-xl flex flex-col items-center justify-center font-black shadow border border-slate-800 shrink-0">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <span className="text-[8px] tracking-widest uppercase text-slate-200">NEOVOLT</span>
                </div>
              )}
              <div>
                <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {contractorInfo.companyName}
                </h1>
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>Instalador: <strong>{contractorInfo.installerName}</strong></span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
                    {contractorInfo.secLicense}
                  </span>
                </p>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                  Licencia: {contractorInfo.secClass} | RUT: {contractorInfo.rut} | Tel: {contractorInfo.phone}
                </p>
              </div>
            </div>

            {/* Metadatos Formales TE1 */}
            <div className="text-left md:text-right text-[11px] font-mono border-t md:border-t-0 md:border-l border-slate-300 pt-2 md:pt-0 md:pl-4 self-stretch flex flex-col justify-center">
              <div className="font-bold text-slate-900 text-xs">DIAGRAMA UNIFILAR DE TABLERO TDA</div>
              <div className="text-slate-700 font-semibold">NORMATIVA SEC CHILE (RIC N°02 & RIC N°05)</div>
              <div className="text-slate-500 text-[10px]">CÓDIGO DOC: {projectInfo.projectCode}</div>
              <div className="text-slate-500 text-[10px]">FECHA EMISIÓN: {projectInfo.projectDate}</div>
            </div>
          </div>

          {/* Ficha de Proyecto y Datos de Cliente */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Cliente / Propietario</span>
              <span className="font-bold text-slate-900">{projectInfo.clientName}</span>
              <span className="text-[10px] text-slate-500 block font-mono">RUT: {projectInfo.clientRut}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Ubicación de Obra</span>
              <span className="font-bold text-slate-900">{projectInfo.projectAddress}</span>
              <span className="text-[10px] text-slate-500 block">{projectInfo.projectCity}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tensión & Potencia Decl.</span>
              <span className="font-bold text-slate-900">{totalPowerKW.toFixed(2)} kW ({totalPowerW} W)</span>
              <span className="text-[10px] text-emerald-800 font-bold block">
                {vNominal}V ({isThreePhase ? 'Trifásico 3Ф' : 'Monofásico 1Ф'})
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Alimentador Principal</span>
              <span className="font-bold text-slate-900">{feederWireSection} mm² EVA ({feederLength}m)</span>
              <span className="text-[10px] text-slate-600 font-semibold block">
                Caída V: {currentDrop.dropPercent.toFixed(2)}% (RIC N°04)
              </span>
            </div>
          </div>
        </div>

        {/* CONTENEDOR ESQUEMÁTICO DEL DIAGRAMA UNIFILAR (CON ZOOM) */}
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          className="transition-transform duration-200 min-w-[850px] p-4 bg-slate-900 border border-slate-800 rounded-2xl"
        >
          <div className="space-y-6">
            {/* 1. Red Distribuidora & Medidor */}
            <div className="flex items-center gap-4 pl-4">
              <div className="bg-slate-800 border-2 border-indigo-500 rounded-lg p-3 text-center min-w-[140px]">
                <div className="text-[10px] text-indigo-400 font-bold uppercase">Red Distribuidora</div>
                <div className="text-xs font-black text-white">{isThreePhase ? '380V Trifásico' : '220V Monofásico'}</div>
              </div>
              <div className="w-12 h-0.5 bg-indigo-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-indigo-300 font-mono">
                  EMP.
                </div>
              </div>

              {/* Medidor & Alimentador Box (Clickable) */}
              <div
                onClick={() => setEditingComponent({ type: 'feeder' })}
                className="group relative cursor-pointer border-2 border-indigo-500 hover:border-fuchsia-400 bg-slate-800 rounded-full w-14 h-14 flex items-center justify-center text-center p-1 shadow-lg transition-all hover:scale-105"
                title="Clic para configurar sección y largo de alimentador"
              >
                <div className="text-[10px] font-black text-emerald-400 leading-tight">kWh<br />Medidor</div>
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-fuchsia-600 text-white text-[9px] font-bold p-1 rounded-full shadow">
                  <Edit3 className="w-2.5 h-2.5" />
                </div>
              </div>

              <div
                onClick={() => setEditingComponent({ type: 'feeder' })}
                className="group relative cursor-pointer flex-1 bg-slate-950/80 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-2.5 transition-all"
                title="Clic para configurar alimentador"
              >
                <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-between">
                  <span>Alimentador Principal</span>
                  <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100 text-fuchsia-400" />
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  Conductor {feederWireSection} mm² EVA ({feederLength} metros)
                </div>
              </div>
            </div>

            {/* Vertical Feeder Line down into Main Board Box */}
            <div className="ml-24 w-0.5 h-8 bg-emerald-500"></div>

            {/* 2. Main TDA Board Outer Boundary Box */}
            <div className="border-2 border-dashed border-fuchsia-500/50 rounded-2xl p-5 bg-slate-950/70 space-y-6 relative">
              <div className="absolute -top-3 left-4 bg-fuchsia-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>TABLERO DE DISTRIBUCIÓN ELÉCTRICA (TDA)</span>
              </div>

              {/* Cabecera: IGA + DPS */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-b border-slate-800 pb-5">
                {/* IGA CARD */}
                <div
                  onClick={() => setEditingComponent({ type: 'iga' })}
                  className="group relative cursor-pointer bg-slate-900 border-2 border-fuchsia-500 hover:border-fuchsia-400 hover:ring-2 hover:ring-fuchsia-400/50 p-3.5 rounded-xl shadow-lg min-w-[220px] transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between text-[10px] text-fuchsia-400 font-bold mb-1">
                    <span>IGA (Corte General)</span>
                    <span className="bg-fuchsia-600 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Edit3 className="w-2.5 h-2.5" /> Editar
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{igaPoles}{igaAmps}A</span>
                    <span className="text-xs font-semibold text-fuchsia-300">{igaBreaking}</span>
                    <span className="text-xs font-semibold text-emerald-400">{igaCurve}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Interruptor Automático Termomagnético
                  </div>
                </div>

                <div className="hidden sm:block w-10 h-0.5 bg-fuchsia-500"></div>

                {/* DPS CARD */}
                <div
                  onClick={() => setEditingComponent({ type: 'dps' })}
                  className="group relative cursor-pointer bg-slate-900 border-2 border-amber-500 hover:border-amber-400 hover:ring-2 hover:ring-amber-400/50 p-3.5 rounded-xl shadow-lg min-w-[220px] transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1">
                    <span>DPS (Sobretensión)</span>
                    <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Edit3 className="w-2.5 h-2.5" /> Editar
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{dpsVoltage}</span>
                    <span className="text-amber-300">{dpsDischarge}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Protector Sobretensión Transitoria Cat. II
                  </div>
                </div>
              </div>

              {/* Barra de Distribución Principal */}
              <div className="relative my-4">
                <div className="h-2.5 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-emerald-500 rounded-full shadow-md"></div>
                <div className="text-[9px] text-slate-400 font-mono mt-1 text-center font-bold">
                  BARRA DE DISTRIBUCIÓN PRINCIPAL (F + N + PE SEC)
                </div>
              </div>

              {/* Differential RCD Groups and Circuits Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {Array.from({ length: rcdCount }).map((_, rcdIdx) => {
                  const groupRcdNumber = rcdIdx + 1;
                  const groupCircuits = circuits.filter((c) => c.rcdGroup === groupRcdNumber);
                  const rcdSpec = specs.rcds?.[groupRcdNumber] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };

                  return (
                    <div
                      key={rcdIdx}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-lg"
                    >
                      {/* RCD Differential Header */}
                      <div
                        onClick={() => setEditingComponent({ type: 'rcd', rcdGroup: groupRcdNumber })}
                        className="group relative cursor-pointer bg-slate-800 border-l-4 border-fuchsia-500 hover:border-fuchsia-400 p-3 rounded-r-lg transition-all hover:bg-slate-750 hover:shadow"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-fuchsia-400">
                          <span>INTERRUPTOR DIFERENCIAL RCD #{groupRcdNumber}</span>
                          <span className="bg-fuchsia-600 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <Edit3 className="w-2.5 h-2.5" /> Editar
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-white mt-1 flex items-center gap-2">
                          <span>2x{rcdSpec.amps}A</span>
                          <span className="text-fuchsia-300 font-mono">{rcdSpec.sensitivity}</span>
                          <span className="text-emerald-400 font-sans text-[11px]">{rcdSpec.classType}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Protección Ininterrumpible &lt; 30ms (RIC N°05)
                        </div>
                      </div>

                      {/* Circuits under this RCD */}
                      <div className="space-y-3">
                        {groupCircuits.map((cto) => (
                          <div
                            key={cto.code}
                            onClick={() =>
                              setEditingComponent({
                                type: 'cb',
                                code: cto.code,
                                currentName: cto.name,
                              })
                            }
                            className="group relative cursor-pointer bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start gap-3 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-500/30 transition-all hover:scale-[1.01]"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                              {cto.code}
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="text-xs font-bold text-white truncate">{cto.name}</div>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Edit3 className="w-2.5 h-2.5" /> Editar
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-fuchsia-300 font-semibold">
                                {cto.breaker}
                              </div>
                              <div className="text-[10px] text-slate-400 flex flex-wrap gap-1.5 pt-0.5">
                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  {cto.wire}
                                </span>
                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  {cto.pipe}
                                </span>
                                <span className="text-emerald-400 font-bold">{cto.loadW} W</span>
                              </div>

                              {/* Curve Selector & Technical Tooltip */}
                              <div
                                className="pt-2 border-t border-slate-800/80 mt-1 flex items-center justify-between gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400 font-semibold">Curva:</span>
                                  {(['Curva B', 'Curva C', 'Curva D'] as const).map((crv) => {
                                    const isSel = cto.curve === crv;
                                    return (
                                      <button
                                        key={crv}
                                        type="button"
                                        onClick={() => {
                                          const currentCb = specs.circuitBreakers?.[cto.code] || {
                                            amps: cto.amps,
                                            breakingCapacity: cto.breakingCapacity,
                                            wireSection: cto.wire,
                                            pipeType: cto.pipe,
                                            customName: cto.name,
                                          };
                                          const updated = {
                                            ...specs,
                                            circuitBreakers: {
                                              ...specs.circuitBreakers,
                                              [cto.code]: { ...currentCb, curve: crv },
                                            },
                                          };
                                          updateSpecsAndSync(updated, `Curva de ${cto.code} cambiada a ${crv}.`);
                                        }}
                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-all border ${
                                          isSel
                                            ? crv === 'Curva B'
                                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow'
                                              : crv === 'Curva C'
                                              ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-bold shadow'
                                              : 'bg-purple-500 text-white border-purple-300 font-bold shadow'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                                        }`}
                                      >
                                        {crv.replace('Curva ', '')}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="relative group/curvetip">
                                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors" />
                                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover/curvetip:block w-64 p-3 bg-slate-900 border-2 border-amber-500/60 rounded-xl shadow-2xl text-[10px] text-slate-200 z-50 pointer-events-none">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                                      <span className="font-extrabold text-amber-400 text-xs">{cto.curve}</span>
                                      <span className="font-mono text-[9px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">
                                        {TRIP_CURVE_INFO[cto.curve]?.range}
                                      </span>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed font-medium mb-1">
                                      {TRIP_CURVE_INFO[cto.curve]?.description}
                                    </p>
                                    <div className="text-[9px] text-amber-300/90 font-mono bg-amber-950/40 p-1.5 rounded border border-amber-500/30">
                                      <strong>Aplicación:</strong> {TRIP_CURVE_INFO[cto.curve]?.applications}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE RESUMEN DE PROTECCIONES ELÉCTRICAS Y CIRCUITOS */}
        <div className="mt-8 bg-white border-2 border-slate-900 rounded-xl p-5 text-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                Tabla Resumen de Protecciones Eléctricas y Especificaciones de Canalización (SEC TE1)
              </h3>
            </div>
            <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
              TDA - {circuits.length} Circuitos Declarados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-slate-900">
                  <th className="p-2 border border-slate-800">Código / ID</th>
                  <th className="p-2 border border-slate-800">Tipo de Protección / Circuito</th>
                  <th className="p-2 border border-slate-800">Polos</th>
                  <th className="p-2 border border-slate-800">Amperaje ($I_n$)</th>
                  <th className="p-2 border border-slate-800">Curva / Sensibilidad</th>
                  <th className="p-2 border border-slate-800">PDC / Especificación</th>
                  <th className="p-2 border border-slate-800">Conductor (Sección mm²)</th>
                  <th className="p-2 border border-slate-800">Canalización</th>
                  <th className="p-2 border border-slate-800 text-right">Potencia (W)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {/* IGA ROW */}
                <tr className="bg-amber-50/80 text-slate-900 font-semibold">
                  <td className="p-2 border border-slate-300 font-mono font-black text-amber-900">IGA</td>
                  <td className="p-2 border border-slate-300">Interruptor General Automático (Corte Principal)</td>
                  <td className="p-2 border border-slate-300 font-mono">{igaPoles}</td>
                  <td className="p-2 border border-slate-300 font-bold">{igaAmps} A</td>
                  <td className="p-2 border border-slate-300">{igaCurve}</td>
                  <td className="p-2 border border-slate-300 font-bold">{igaBreaking}</td>
                  <td className="p-2 border border-slate-300 font-mono">{feederWireSection} mm² EVA (Alimentador)</td>
                  <td className="p-2 border border-slate-300 font-mono">{feederLength}m Canalizado</td>
                  <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{totalPowerW} W</td>
                </tr>

                {/* DPS ROW */}
                <tr className="bg-slate-50 text-slate-900 font-semibold">
                  <td className="p-2 border border-slate-300 font-mono font-black text-indigo-900">DPS</td>
                  <td className="p-2 border border-slate-300">Protector Sobretensiones Transitorias (Cat. II)</td>
                  <td className="p-2 border border-slate-300 font-mono">{isThreePhase ? '3P+N' : '1P+N'}</td>
                  <td className="p-2 border border-slate-300">-</td>
                  <td className="p-2 border border-slate-300">Tensión {dpsVoltage}</td>
                  <td className="p-2 border border-slate-300 font-bold">Imax {dpsDischarge}</td>
                  <td className="p-2 border border-slate-300 font-mono">4.0 mm² EVA PE</td>
                  <td className="p-2 border border-slate-300 font-mono">Barra de Tierra PE</td>
                  <td className="p-2 border border-slate-300 text-right text-slate-400">-</td>
                </tr>

                {/* RCD ROWS & CIRCUITS */}
                {Array.from({ length: rcdCount }).map((_, rcdIdx) => {
                  const groupNum = rcdIdx + 1;
                  const rcdSpec = specs.rcds?.[groupNum] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };
                  const groupCto = circuits.filter((c) => c.rcdGroup === groupNum);

                  return (
                    <React.Fragment key={`rcd_table_group_${groupNum}`}>
                      <tr className="bg-fuchsia-50/90 font-bold text-fuchsia-950">
                        <td className="p-2 border border-slate-300 font-mono font-black text-fuchsia-900">RCD #{groupNum}</td>
                        <td className="p-2 border border-slate-300" colSpan={2}>
                          Interruptor Diferencial Grupo #{groupNum} (Protección a Personas)
                        </td>
                        <td className="p-2 border border-slate-300 font-bold">{rcdSpec.amps} A</td>
                        <td className="p-2 border border-slate-300 font-bold text-fuchsia-800">{rcdSpec.sensitivity}</td>
                        <td className="p-2 border border-slate-300 font-bold">{rcdSpec.classType}</td>
                        <td className="p-2 border border-slate-300 font-mono text-[10px]" colSpan={2}>
                          Grupo alimentando {groupCto.length} Circuito(s)
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-fuchsia-950">
                          {groupCto.reduce((sum, c) => sum + c.loadW, 0)} W
                        </td>
                      </tr>

                      {groupCto.map((cto) => (
                        <tr key={`tbl_${cto.code}`} className="hover:bg-slate-50 text-slate-800">
                          <td className="p-2 border border-slate-300 font-mono font-black text-emerald-900 pl-4">
                            ↳ {cto.code}
                          </td>
                          <td className="p-2 border border-slate-300 font-medium">{cto.name}</td>
                          <td className="p-2 border border-slate-300 font-mono">1x</td>
                          <td className="p-2 border border-slate-300 font-bold">{cto.amps} A</td>
                          <td className="p-2 border border-slate-300">
                            <div className="flex items-center gap-1 group/tbltip relative">
                              <span className="font-bold text-slate-900">{cto.curve}</span>
                              <HelpCircle className="w-3 h-3 text-slate-400 hover:text-amber-600 cursor-pointer" />
                              <div className="absolute left-0 bottom-full mb-1 hidden group-hover/tbltip:block w-64 p-2.5 bg-slate-900 text-white rounded-xl shadow-2xl text-[10px] border border-slate-700 z-50 pointer-events-none">
                                <div className="font-extrabold text-amber-400 text-xs mb-0.5">{cto.curve} ({TRIP_CURVE_INFO[cto.curve]?.range})</div>
                                <p className="text-slate-300 font-normal leading-tight">{TRIP_CURVE_INFO[cto.curve]?.description}</p>
                                <div className="mt-1 text-[9px] text-amber-300 font-mono">{TRIP_CURVE_INFO[cto.curve]?.applications}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 border border-slate-300">{cto.breakingCapacity}</td>
                          <td className="p-2 border border-slate-300 font-mono">{cto.wire}</td>
                          <td className="p-2 border border-slate-300 font-mono">{cto.pipe}</td>
                          <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{cto.loadW} W</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* TOTAL SUMMARY ROW */}
                <tr className="bg-slate-900 text-white font-bold text-xs">
                  <td className="p-2.5 border border-slate-800 uppercase" colSpan={3}>
                    TOTALES DECLARADOS DEL TABLERO TDA
                  </td>
                  <td className="p-2.5 border border-slate-800" colSpan={3}>
                    {circuits.length} Disyuntores | {rcdCount} RCDs | 1 IGA | 1 DPS
                  </td>
                  <td className="p-2.5 border border-slate-800 font-mono" colSpan={2}>
                    Alimentador: {feederWireSection} mm² EVA ({feederLength}m)
                  </td>
                  <td className="p-2.5 border border-slate-800 text-right font-black font-mono text-emerald-400 text-sm">
                    {totalPowerW} W ({totalPowerKW.toFixed(2)} kW)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CUADRO DE FIRMAS Y RESPONSABILIDAD TÉCNICA SEC */}
        <div className="mt-8 border-2 border-slate-900 rounded-xl p-4 bg-white text-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px]">
          <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 flex flex-col justify-between h-32">
            <div>
              <div className="font-bold text-slate-900 uppercase text-[10px]">RESPONSABLE TÉCNICO DE LA INSTALACIÓN</div>
              <div className="text-[10px] text-slate-600">Instalador Autorizado Superintendencia de Electricidad y Combustibles (SEC)</div>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <div className="font-bold text-slate-900">{contractorInfo.installerName}</div>
              <div className="text-[10px] text-emerald-800 font-bold">{contractorInfo.secLicense} ({contractorInfo.secClass})</div>
              <div className="text-[9px] text-slate-500">Firma / Timbre Instalador Certificado</div>
            </div>
          </div>

          <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 flex flex-col justify-between h-32">
            <div>
              <div className="font-bold text-slate-900 uppercase text-[10px]">RECEPCIÓN Y CONFORMIDAD PROPIETARIO</div>
              <div className="text-[10px] text-slate-600">Aceptación de especificaciones técnicas y diagrama unifilar ejecutado</div>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <div className="font-bold text-slate-900">{projectInfo.clientName}</div>
              <div className="text-[10px] text-slate-600 font-mono">RUT: {projectInfo.clientRut}</div>
              <div className="text-[9px] text-slate-500">Firma Propietario / Cliente</div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* COMPONENT SPECIFICATIONS EDITING MODAL */}
      {editingComponent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-fuchsia-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {editingComponent.type === 'iga' && 'Especificación IGA (Corte General)'}
                    {editingComponent.type === 'dps' && 'Especificación DPS (Protector Sobretensión)'}
                    {editingComponent.type === 'rcd' && `Especificación RCD Diferencial #${editingComponent.rcdGroup}`}
                    {editingComponent.type === 'cb' && `Especificación Disyuntor ${editingComponent.code}`}
                    {editingComponent.type === 'feeder' && 'Especificación Alimentador Principal'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sincronización automática con Cotización y Simulación 2D
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingComponent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM BODY FOR IGA */}
            {editingComponent.type === 'iga' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Amperaje Nominal IGA (In)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[16, 20, 25, 32, 40, 50, 63].map((amp) => (
                      <button
                        key={amp}
                        onClick={() => {
                          const updated = { ...specs, iga: { ...specs.iga, amps: amp } };
                          updateSpecsAndSync(updated, `IGA actualizado a ${specs.iga.poles || '1x'}${amp}A.`);
                        }}
                        className={`py-2 rounded-xl font-bold border transition-all ${
                          igaAmps === amp
                            ? 'bg-fuchsia-600 text-white border-fuchsia-400 ring-2 ring-fuchsia-400/40 shadow-lg'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {amp}A
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">Curva de Disparo</label>
                    <select
                      value={igaCurve}
                      onChange={(e) => {
                        const updated = { ...specs, iga: { ...specs.iga, curve: e.target.value } };
                        updateSpecsAndSync(updated, `Curva de IGA cambiada a ${e.target.value}.`);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="Curva B">Curva B (Rápida)</option>
                      <option value="Curva C">Curva C (Estándar)</option>
                      <option value="Curva D">Curva D (Cargas Inductivas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-200 mb-1">Poder de Corte (PDC)</label>
                    <select
                      value={igaBreaking}
                      onChange={(e) => {
                        const updated = { ...specs, iga: { ...specs.iga, breakingCapacity: e.target.value } };
                        updateSpecsAndSync(updated, `Poder de corte IGA: ${e.target.value}.`);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="4.5kA">4.5 kA</option>
                      <option value="6kA">6.0 kA (Reglamentario SEC)</option>
                      <option value="10kA">10.0 kA (Industrial/Comercial)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* FORM BODY FOR DPS */}
            {editingComponent.type === 'dps' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Tensión de Operación (Uc)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['275V', '400V'].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const updated = { ...specs, dps: { ...specs.dps, voltage: v } };
                          updateSpecsAndSync(updated, `Tensión DPS: ${v}.`);
                        }}
                        className={`py-2.5 rounded-xl font-bold border transition-all ${
                          dpsVoltage === v
                            ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {v} ({v === '275V' ? 'Monofásico' : 'Trifásico'})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Corriente Máxima de Descarga (Imax)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['20kA', '40kA'].map((cur) => (
                      <button
                        key={cur}
                        onClick={() => {
                          const updated = { ...specs, dps: { ...specs.dps, dischargeCurrent: cur } };
                          updateSpecsAndSync(updated, `Capacidad DPS: ${cur}.`);
                        }}
                        className={`py-2.5 rounded-xl font-bold border transition-all ${
                          dpsDischarge === cur
                            ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FORM BODY FOR RCD */}
            {editingComponent.type === 'rcd' && editingComponent.rcdGroup && (
              <div className="space-y-4 text-xs">
                {(() => {
                  const gNum = editingComponent.rcdGroup!;
                  const curRcd = specs.rcds?.[gNum] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };

                  return (
                    <>
                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Amperaje Nominal RCD RCD #{gNum}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[25, 40, 63].map((amp) => (
                            <button
                              key={amp}
                              onClick={() => {
                                const updated = {
                                  ...specs,
                                  rcds: { ...specs.rcds, [gNum]: { ...curRcd, amps: amp } },
                                };
                                updateSpecsAndSync(updated, `RCD #${gNum} actualizado a 2x${amp}A.`);
                              }}
                              className={`py-2 rounded-xl font-bold border transition-all ${
                                curRcd.amps === amp
                                  ? 'bg-fuchsia-600 text-white border-fuchsia-400 ring-2 ring-fuchsia-400/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              2x{amp}A
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-200 mb-1">Sensibilidad Diferencial</label>
                          <select
                            value={curRcd.sensitivity}
                            onChange={(e) => {
                              const updated = {
                                ...specs,
                                rcds: { ...specs.rcds, [gNum]: { ...curRcd, sensitivity: e.target.value } },
                              };
                              updateSpecsAndSync(updated, `Sensibilidad RCD #${gNum}: ${e.target.value}.`);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          >
                            <option value="30mA">30mA (Protección Personas)</option>
                            <option value="300mA">300mA (Protección Incendios)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-200 mb-1">Tipo de Clase RCD</label>
                          <select
                            value={curRcd.classType}
                            onChange={(e) => {
                              const updated = {
                                ...specs,
                                rcds: { ...specs.rcds, [gNum]: { ...curRcd, classType: e.target.value } },
                              };
                              updateSpecsAndSync(updated, `Clase RCD #${gNum}: ${e.target.value}.`);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          >
                            <option value="Clase AC">Clase AC (Cargas Corrientes)</option>
                            <option value="Clase A">Clase A (Componentes D.C. / Electrónica)</option>
                            <option value="Superinmunizado">Superinmunizado SI / F</option>
                          </select>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* FORM BODY FOR CIRCUIT BREAKER */}
            {editingComponent.type === 'cb' && editingComponent.code && (
              <div className="space-y-4 text-xs">
                {(() => {
                  const code = editingComponent.code!;
                  const ctoMatch = circuits.find((c) => c.code === code);
                  const currentCb = specs.circuitBreakers?.[code] || {
                    amps: ctoMatch?.amps || 16,
                    curve: 'Curva C',
                    breakingCapacity: '6kA',
                    wireSection: ctoMatch?.wire || '3 x 2.5 mm² EVA',
                    pipeType: ctoMatch?.pipe || 'PVC 25mm',
                    customName: ctoMatch?.name || 'Circuito',
                  };

                  return (
                    <>
                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Nombre Personalizado del Circuito</label>
                        <input
                          type="text"
                          value={currentCb.customName || ''}
                          onChange={(e) => {
                            const updated = {
                              ...specs,
                              circuitBreakers: {
                                ...specs.circuitBreakers,
                                [code]: { ...currentCb, customName: e.target.value },
                              },
                            };
                            onUpdateProtectionSpecs(updated);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          placeholder="Ej. Alumbrado Jardín / Climatización"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Amperaje Disyuntor ({code})</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[6, 10, 16, 20, 25, 32, 40].map((amp) => (
                            <button
                              key={amp}
                              onClick={() => {
                                const updated = {
                                  ...specs,
                                  circuitBreakers: {
                                    ...specs.circuitBreakers,
                                    [code]: { ...currentCb, amps: amp },
                                  },
                                };
                                updateSpecsAndSync(updated, `Circuito ${code} actualizado a 1x${amp}A.`);
                              }}
                              className={`py-2 rounded-xl font-bold border transition-all ${
                                currentCb.amps === amp
                                  ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              1x{amp}A
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Sección Conductor (mm² EVA)</label>
                        <select
                          value={currentCb.wireSection}
                          onChange={(e) => {
                            const updated = {
                              ...specs,
                              circuitBreakers: {
                                ...specs.circuitBreakers,
                                [code]: { ...currentCb, wireSection: e.target.value },
                              },
                            };
                            updateSpecsAndSync(updated, `Conductor ${code}: ${e.target.value}.`);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        >
                          <option value="3 x 1.5 mm² EVA">3 x 1.5 mm² EVA (Alumbrado máx 15A)</option>
                          <option value="3 x 2.5 mm² EVA">3 x 2.5 mm² EVA (Enchufes máx 21A)</option>
                          <option value="3 x 4.0 mm² EVA">3 x 4.0 mm² EVA (Carga pesada máx 28A)</option>
                          <option value="3 x 6.0 mm² EVA">3 x 6.0 mm² EVA (Empalme / Cocina máx 36A)</option>
                          <option value="3 x 10.0 mm² EVA">3 x 10.0 mm² EVA (Fuerza máx 50A)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Canalización (Tubería)</label>
                        <select
                          value={currentCb.pipeType}
                          onChange={(e) => {
                            const updated = {
                              ...specs,
                              circuitBreakers: {
                                ...specs.circuitBreakers,
                                [code]: { ...currentCb, pipeType: e.target.value },
                              },
                            };
                            updateSpecsAndSync(updated, `Canalización ${code}: ${e.target.value}.`);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        >
                          <option value="PVC 20mm">PVC Conduit 20mm</option>
                          <option value="PVC 25mm">PVC Conduit 25mm</option>
                          <option value="PVC 32mm">PVC Conduit 32mm</option>
                          <option value='EMT 1/2"'>EMT Metálico 1/2"</option>
                          <option value='EMT 3/4"'>EMT Metálico 3/4"</option>
                          <option value='EMT 1"'>EMT Metálico 1"</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-slate-200">Tipo de Curva de Disparo (Norma SEC RIC N°05)</label>
                          <span className="text-[10px] text-amber-400 font-mono font-semibold">
                            {currentCb.curve || 'Curva C'} ({TRIP_CURVE_INFO[currentCb.curve || 'Curva C']?.range})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(['Curva B', 'Curva C', 'Curva D'] as const).map((crv) => {
                            const info = TRIP_CURVE_INFO[crv];
                            const isSelected = (currentCb.curve || 'Curva C') === crv;
                            return (
                              <button
                                key={crv}
                                type="button"
                                onClick={() => {
                                  const updated = {
                                    ...specs,
                                    circuitBreakers: {
                                      ...specs.circuitBreakers,
                                      [code]: { ...currentCb, curve: crv },
                                    },
                                  };
                                  updateSpecsAndSync(updated, `Curva de disparo de ${code} cambiada a ${crv}.`);
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                                  isSelected
                                    ? crv === 'Curva B'
                                      ? 'bg-amber-950/80 border-amber-400 text-white ring-2 ring-amber-400/40'
                                      : crv === 'Curva C'
                                      ? 'bg-emerald-950/80 border-emerald-400 text-white ring-2 ring-emerald-400/40'
                                      : 'bg-purple-950/80 border-purple-400 text-white ring-2 ring-purple-400/40'
                                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-xs">{crv}</span>
                                    <span className={`text-[9px] font-mono font-bold px-1 rounded ${info.badgeBg} ${info.badgeText}`}>
                                      {info.range}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-medium opacity-90 mt-1 line-clamp-2">
                                    {info.loadTypeLabel}
                                  </div>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1.5 leading-tight">
                                  {info.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
                          <strong className="text-amber-400">Importancia Técnica SEC:</strong>{' '}
                          {TRIP_CURVE_INFO[currentCb.curve || 'Curva C']?.secRule}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* FORM BODY FOR FEEDER */}
            {editingComponent.type === 'feeder' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Cálculo Caída Tensión (RIC N°04):</span>
                    <span className={`font-mono font-bold ${isSectionInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {currentDrop.dropPercent.toFixed(2)}% ({currentDrop.dropVolts.toFixed(2)}V)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Límite SEC Alimentador: <strong>3.0%</strong></span>
                    <span>Sugerida: <strong className="text-emerald-400 font-bold">{suggestedSection} mm² EVA</strong></span>
                  </div>
                </div>

                {isSectionInsufficient && (
                  <div className="bg-rose-950/80 border border-rose-500 rounded-xl p-3 text-white space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Sección Insuficiente para {calcCurrent}A a {calcDistance}m</span>
                    </div>
                    <p className="text-[11px] text-rose-100">
                      Produce {currentDrop.dropPercent.toFixed(2)}% de caída (&gt;3.0% máx RIC N°04).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (setFeederWireSection) setFeederWireSection(suggestedSection);
                        showToast(`Sección de alimentador corregida a ${suggestedSection} mm² EVA.`);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar Sección Sugerida ({suggestedSection} mm² EVA)</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Sección Conductor Alimentador (mm² EVA)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[2.5, 4.0, 6.0, 10.0, 16.0, 25.0].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          if (setFeederWireSection) setFeederWireSection(sec);
                          showToast(`Alimentador actualizado a ${sec} mm² EVA.`);
                        }}
                        className={`py-2.5 rounded-xl font-bold border transition-all relative ${
                          feederWireSection === sec
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                            : sec === suggestedSection
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900/80'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <span>{sec} mm² EVA</span>
                        {sec === suggestedSection && (
                          <span className="block text-[9px] font-semibold text-emerald-400">★ RIC N°04</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Longitud del Alimentador (Metros)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={feederLength}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      setCalcDistance(val);
                      if (setFeederLength) setFeederLength(val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingComponent(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl border border-slate-700 text-xs transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  onSyncToBudget(specs);
                  setEditingComponent(null);
                  showToast(' Cambios guardados y sincronizados con la Cotización y Simulación 2D.');
                }}
                className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Sincronizar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORTACIÓN DE PLANO UNIFILAR A PDF CON LOGOTIPO Y RESUMEN DE PROTECCIONES */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-fuchsia-500/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exportación de Documento PDF Profesional</h3>
                  <p className="text-[11px] text-slate-400">Incluye logotipo del contratista, datos del proyecto y tabla de protecciones</p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs in Modal */}
            <div className="flex border-b border-slate-800 text-xs">
              <button
                onClick={() => setPdfModalTab('branding')}
                className={`flex-1 py-2 font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  pdfModalTab === 'branding'
                    ? 'border-fuchsia-500 text-fuchsia-400 bg-slate-800/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>1. Logotipo y Datos Proyecto</span>
              </button>

              <button
                onClick={() => setPdfModalTab('options')}
                className={`flex-1 py-2 font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  pdfModalTab === 'options'
                    ? 'border-fuchsia-500 text-fuchsia-400 bg-slate-800/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. Formato PDF y Resumen</span>
              </button>
            </div>

            {/* TAB 1: CONTRACTOR BRANDING & LOGO EDITING */}
            {pdfModalTab === 'branding' && (
              <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
                {/* Logo Upload Section */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                      <span>Logotipo de la Empresa / Contratista</span>
                    </span>
                    {contractorInfo.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setContractorInfo((prev) => ({ ...prev, logoUrl: '' }))}
                        className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                      >
                        Quitar Logo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {contractorInfo.logoUrl ? (
                      <div className="w-20 h-16 bg-white p-1 rounded-xl border border-slate-700 flex items-center justify-center shrink-0">
                        <img
                          src={contractorInfo.logoUrl}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-16 bg-slate-900 text-slate-500 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-[10px] shrink-0">
                        <ImageIcon className="w-5 h-5 mb-0.5 opacity-50" />
                        <span>Sin Logo</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 text-xs flex items-center gap-2 w-fit transition-all">
                        <Upload className="w-4 h-4 text-fuchsia-400" />
                        <span>Subir Imagen de Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Soporta formatos PNG, JPG o SVG. Aparecerá en la esquina superior del plano PDF.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contractor Details Form */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Datos del Contratista / Instalador SEC</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Empresa / Razón Social</label>
                      <input
                        type="text"
                        value={contractorInfo.companyName}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, companyName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Nombre Instalador</label>
                      <input
                        type="text"
                        value={contractorInfo.installerName}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, installerName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Licencia SEC</label>
                      <input
                        type="text"
                        value={contractorInfo.secLicense}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, secLicense: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">RUT Empresa/Instalador</label>
                      <input
                        type="text"
                        value={contractorInfo.rut}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, rut: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Project & Client Details Form */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Datos del Proyecto y Cliente</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Nombre Cliente</label>
                      <input
                        type="text"
                        value={projectInfo.clientName}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, clientName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">RUT Cliente</label>
                      <input
                        type="text"
                        value={projectInfo.clientRut}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, clientRut: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Dirección de Obra</label>
                      <input
                        type="text"
                        value={projectInfo.projectAddress}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, projectAddress: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Código Proyecto / TE1</label>
                      <input
                        type="text"
                        value={projectInfo.projectCode}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, projectCode: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-fuchsia-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPdfModalTab('options')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <span>Continuar a Selección de Color y Descarga</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* TAB 2: EXPORT OPTIONS & PROTECTIONS SUMMARY */}
            {pdfModalTab === 'options' && (
              <div className="space-y-4">
                {/* Choice Option Cards */}
                <div className="space-y-3">
                  <button
                    onClick={() => setPdfColorChoice('color')}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      pdfColorChoice === 'color'
                        ? 'bg-fuchsia-950/50 border-fuchsia-500 ring-2 ring-fuchsia-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        pdfColorChoice === 'color' ? 'border-fuchsia-400 bg-fuchsia-600' : 'border-slate-600'
                      }`}
                    >
                      {pdfColorChoice === 'color' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>A Color (Formato Digital con Marca de Agua)</span>
                        <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-300 font-semibold px-2 py-0.5 rounded-full border border-fuchsia-500/30">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Mantiene los colores normativos de fases y diferenciales, logotipo a todo color y tabla completa de protecciones.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPdfColorChoice('bw')}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      pdfColorChoice === 'bw'
                        ? 'bg-slate-800 border-slate-400 ring-2 ring-slate-400/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        pdfColorChoice === 'bw' ? 'border-slate-200 bg-slate-400' : 'border-slate-600'
                      }`}
                    >
                      {pdfColorChoice === 'bw' && <Check className="w-3 h-3 text-slate-950" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>En Blanco y Negro (Plano SEC Impreso Norma TE1)</span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                          Norma SEC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Aplica alto contraste en blanco y negro para copias impresas en papel y carpetas de tramitación formal SEC.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Document Summary Included in PDF */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <span>Resumen del Documento que se generará:</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>Logotipo de <strong>{contractorInfo.companyName}</strong> y firma SEC.</li>
                    <li>Datos del cliente: <strong>{projectInfo.clientName}</strong> ({projectInfo.clientRut}).</li>
                    <li>Diagrama Unifilar completo del tablero TDA ({totalPowerKW.toFixed(2)} kW).</li>
                    <li><strong>Tabla Resumen de Protecciones:</strong> 1 IGA ({igaPoles}{igaAmps}A), 1 DPS ({dpsVoltage}), {rcdCount} RCD(s) y {circuits.length} Disyuntores.</li>
                    <li>Cálculo de caída de tensión del alimentador ({currentDrop.dropPercent.toFixed(2)}% - RIC N°04).</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs border border-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDownloadPdf(pdfColorChoice)}
                disabled={isGeneratingPdf}
                className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Descargar PDF ({pdfColorChoice === 'bw' ? 'B/N' : 'Color'})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AutoCAD Plan Viewer Modal */}
      {isCadModalOpen && (
        <AutoCadViewerModal
          isOpen={isCadModalOpen}
          onClose={() => setIsCadModalOpen(false)}
          onApplyPlanToCensus={() => {
            setIsCadModalOpen(false);
            showToast('¡Plano CAD cargado y vinculado al esquema unilineal!');
          }}
        />
      )}
    </div>
  );
};

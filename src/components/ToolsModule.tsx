import React, { useState } from 'react';
import { 
  Wrench, 
  Calculator, 
  Zap, 
  BookOpen, 
  ShieldAlert, 
  ChevronRight, 
  CheckCircle2,
  HelpCircle,
  X,
  Ruler,
  Box,
  FileText,
  Share2,
  Cable,
  ShieldCheck,
  Activity,
  Thermometer,
  Sun,
  Flame,
  Maximize2,
  DollarSign,
  Grid,
  FileSpreadsheet,
  AlertTriangle,
  Sliders,
  Check,
  Gauge,
  FileCode
} from 'lucide-react';
import { RoomData, HighAppliance, BudgetItem } from '../types';
import { WireCalculationModule } from './WireCalculationModule';
import { DemandCalculationModule } from './DemandCalculationModule';
import { LaborPricingCalculatorModal } from './LaborPricingCalculatorModal';
import { AutoCadViewerModal } from './AutoCadViewerModal';

interface ToolsModuleProps {
  onNavigateToTab?: (tab: string) => void;
  rooms?: RoomData[];
  highAppliances?: HighAppliance[];
  onExportWiresToBudget?: (items: BudgetItem[]) => void;
  currentLaborCost?: number;
  onApplyLaborCost?: (newCost: number) => void;
}

export const ToolsModule: React.FC<ToolsModuleProps> = ({
  onNavigateToTab,
  rooms = [],
  highAppliances = [],
  onExportWiresToBudget = () => {},
  currentLaborCost = 0,
  onApplyLaborCost = () => {}
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // States for embedded quick tools modals
  // 1. Malla a tierra
  const [soilRes, setSoilRes] = useState<number>(100);
  const [rodLength, setRodLength] = useState<number>(2.5);
  const [rodCount, setRodCount] = useState<number>(1);

  // 2. Factor de Potencia
  const [powerKw, setPowerKw] = useState<number>(15);
  const [currentPf, setCurrentPf] = useState<number>(0.78);
  const [targetPf, setTargetPf] = useState<number>(0.95);

  // 3. Cubicaje Conduit
  const [pipeDiameter, setPipeDiameter] = useState<number>(20);
  const [wireSec, setWireSec] = useState<number>(2.5);
  const [wireQty, setWireQty] = useState<number>(3);

  // 4. Luxómetro
  const [roomAreaM2, setRoomAreaM2] = useState<number>(25);
  const [requiredLux, setRequiredLux] = useState<number>(300);

  // 5. Megger Aislamiento
  const [meggerVoltage, setMeggerVoltage] = useState<number>(500);
  const [meggerResistance, setMeggerResistance] = useState<number>(2.5);

  // 6. Termografía Delta T
  const [deltaT, setDeltaT] = useState<number>(12);

  // Calculation helpers
  const calculateGroundingResistance = () => {
    // Formula aproximada de Dwight para n barras en paralelo
    const rSingle = (soilRes / (2 * Math.PI * rodLength)) * (Math.log((8 * rodLength) / 0.016) - 1);
    const rTotal = rSingle / Math.pow(rodCount, 0.85);
    return Math.max(0.1, Math.round(rTotal * 10) / 10);
  };

  const calculateKvarCorrection = () => {
    const phi1 = Math.acos(Math.min(0.99, currentPf));
    const phi2 = Math.acos(Math.min(0.99, targetPf));
    const kvar = powerKw * (Math.tan(phi1) - Math.tan(phi2));
    return Math.max(0, Math.round(kvar * 10) / 10);
  };

  const calculatePipeFill = () => {
    // Diámetros exteriores típicos conductor mm2 (incluyendo aislación EVA/THHN)
    const wireOuterDiameters: Record<number, number> = {
      1.5: 3.2,
      2.5: 3.8,
      4.0: 4.4,
      6.0: 5.0,
      10.0: 6.2,
      16.0: 7.6
    };
    const wireD = wireOuterDiameters[wireSec] || 3.8;
    const wireArea = Math.PI * Math.pow(wireD / 2, 2) * wireQty;
    const innerPipeD = pipeDiameter - 2; // espesor promedio 1mm
    const pipeArea = Math.PI * Math.pow(innerPipeD / 2, 2);
    const fillPercent = (wireArea / pipeArea) * 100;
    return {
      fillPercent: Math.round(fillPercent * 10) / 10,
      isCompliant: fillPercent <= (wireQty <= 2 ? 40 : 35)
    };
  };

  const calculateLumensAndPanels = () => {
    const totalLumens = (roomAreaM2 * requiredLux) / 0.6; // Factor de utilización 0.6
    const panelsCount = Math.ceil(totalLumens / 1800); // Panel LED 18W ~ 1800 lm
    return {
      totalLumens: Math.round(totalLumens),
      panelsCount
    };
  };

  const handleCardClick = (id: string, targetTab?: string) => {
    if (targetTab && onNavigateToTab) {
      onNavigateToTab(targetTab);
    } else {
      setActiveModal(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4 text-fuchsia-400" />
            <span>Suite Técnica de Terreno</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Caja de Herramientas Eléctricas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculadoras normativas SEC/RIC, conversores de calibre, simuladores de medición y guías técnicas directas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categoría 1: Cálculos Eléctricos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span>Cálculos Eléctricos</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Norma RIC
            </span>
          </h3>
          <div className="space-y-3">
            <ToolCard 
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              title="Calculadora de Alimentadores"
              desc="Caída de tensión y dimensionamiento de conductores"
              onClick={() => handleCardClick('wire_calc')}
            />
            <ToolCard 
              icon={<Activity className="w-5 h-5 text-rose-400" />}
              title="Cálculo de Máxima Demanda"
              desc="Factores de diversidad y demanda Norma RIC N°01"
              onClick={() => handleCardClick('demand_calc')}
            />
            <ToolCard 
              icon={<Cable className="w-5 h-5 text-emerald-400" />}
              title="Malla a Tierra (RIC N°06)"
              desc="Resistencia con barras Cooperweld y tierra de protección"
              onClick={() => handleCardClick('grounding_calc')}
            />
            <ToolCard 
              icon={<Flame className="w-5 h-5 text-amber-500" />}
              title="Factor de Potencia (RIC N°03)"
              desc="Compensación de reactivos y banco de condensadores"
              onClick={() => handleCardClick('pf_calc')}
            />
            <ToolCard 
              icon={<Ruler className="w-5 h-5 text-indigo-400" />}
              title="Conversor AWG a mm²"
              desc="Equivalencias y ampacidad por tipo de aislación"
              onClick={() => handleCardClick('awg_converter')}
            />
            <ToolCard 
              icon={<Box className="w-5 h-5 text-blue-400" />}
              title="Cubicaje de Ductos (RIC N°04)"
              desc="Factor de relleno máximo 35%-40% en conduits"
              onClick={() => handleCardClick('pipe_conduit')}
            />
            <ToolCard 
              icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
              title="Calculadora de Mano de Obra"
              desc="Costeo de tarifario por punto y tablero"
              onClick={() => handleCardClick('labor_pricing')}
            />
          </div>
        </div>

        {/* Categoría 2: Guías y Normativa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-fuchsia-400 border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Guías y Normativa SEC</span>
            </div>
            <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/30 px-2 py-0.5 rounded-full">
              Chile 2026
            </span>
          </h3>
          <div className="space-y-3">
            <ToolCard 
              icon={<FileCode className="w-5 h-5 text-cyan-400" />}
              title="Lector & Visor de Planos AutoCAD (.DXF / .DWG)"
              desc="Abre planos CAD con capas, cotas, centros de luz y cubicación SEC"
              onClick={() => handleCardClick('autocad_viewer')}
            />
            <ToolCard 
              icon={<ShieldCheck className="w-5 h-5 text-fuchsia-400" />}
              title="Normativa RICs (SEC)"
              desc="Consulta interactiva de los 19 Pliegos Técnicos RIC"
              onClick={() => handleCardClick('ric_norms', 'norms')}
            />
            <ToolCard 
              icon={<FileText className="w-5 h-5 text-teal-400" />}
              title="Guía de Empalmes SEC"
              desc="Esquemas de empalmes A6, A9, A12, S7, S9, Trifásicos T-12"
              onClick={() => handleCardClick('empalmes_guide')}
            />
            <ToolCard 
              icon={<Share2 className="w-5 h-5 text-violet-400" />}
              title="Diagramas de Conexión & Unilineal"
              desc="Esquemas unilineales, 9/12, 9/15, 9/24 e interconexión"
              onClick={() => handleCardClick('singleline', 'singleline')}
            />
            <ToolCard 
              icon={<Grid className="w-5 h-5 text-amber-400" />}
              title="Simulador de Tablero 2D"
              desc="Montaje en Riel DIN con chequeo físico de espacio"
              onClick={() => handleCardClick('physical', 'physical')}
            />
            <ToolCard 
              icon={<FileSpreadsheet className="w-5 h-5 text-emerald-400" />}
              title="Formulario de Declaración TE1"
              desc="Módulo oficial de trámite TE1 para la SEC"
              onClick={() => handleCardClick('te1', 'te1')}
            />
          </div>
        </div>

        {/* Categoría 3: Herramientas e Instrumentos de Terreno */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Instrumentos de Inspección</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Mediciones
            </span>
          </h3>
          <div className="space-y-3">
            <ToolCard 
              icon={<Gauge className="w-5 h-5 text-cyan-400" />}
              title="Simulador Megger (RIC N°19)"
              desc="Ensayo de resistencia de aislamiento en MΩ"
              onClick={() => handleCardClick('megger_simulator')}
            />
            <ToolCard 
              icon={<Thermometer className="w-5 h-5 text-rose-500" />}
              title="Termografía y Puntos Calientes"
              desc="Diagnóstico por sobretemperatura ΔT en protecciones"
              onClick={() => handleCardClick('thermography')}
            />
            <ToolCard 
              icon={<Sun className="w-5 h-5 text-yellow-300" />}
              title="Luxómetro e Iluminación (RIC N°10)"
              desc="Niveles de iluminancia en luxes y paneles LED requeridos"
              onClick={() => handleCardClick('luxmeter')}
            />
          </div>
        </div>
      </div>

      {/* --- MODALES INTERACTIVOS --- */}

      {/* 1. Wire Calculation Module Modal */}
      {activeModal === 'wire_calc' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Calculadora de Alimentadores y Conductores</span>
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <WireCalculationModule 
              rooms={rooms}
              highAppliances={highAppliances}
              onExportWiresToBudget={onExportWiresToBudget}
            />
          </div>
        </div>
      )}

      {/* 2. Demand Calculation Module Modal */}
      {activeModal === 'demand_calc' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-400" />
                <span>Cálculo de Máxima Demanda Norma RIC N°01</span>
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DemandCalculationModule 
              rooms={rooms}
              highAppliances={highAppliances}
            />
          </div>
        </div>
      )}

      {/* 3. Labor Pricing Calculator Modal */}
      {activeModal === 'labor_pricing' && (
        <LaborPricingCalculatorModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          rooms={rooms}
          highAppliances={highAppliances}
          currentLaborCost={currentLaborCost}
          onApplyLaborCost={onApplyLaborCost}
        />
      )}

      {/* AutoCAD Plan Viewer Modal */}
      {activeModal === 'autocad_viewer' && (
        <AutoCadViewerModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onApplyPlanToCensus={(scannedRooms, scannedHigh) => {
            if (onNavigateToTab) onNavigateToTab('census');
            setActiveModal(null);
          }}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* 4. Malla a Tierra Modal */}
      {activeModal === 'grounding_calc' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cable className="w-5 h-5 text-emerald-400" />
                <span>Malla a Tierra y Puesta a Tierra (RIC N°06)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Resistividad del Terreno (ρ en Ω·m):</label>
                <input 
                  type="number"
                  value={soilRes}
                  onChange={(e) => setSoilRes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Húmedo/Arcilloso ~50-100 Ωm | Arenoso/Seco ~300-800 Ωm</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Largo Barra Cooperweld (m):</label>
                  <select 
                    value={rodLength} 
                    onChange={(e) => setRodLength(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={1.5}>1.5 metros (5/8")</option>
                    <option value={2.0}>2.0 metros (5/8")</option>
                    <option value={2.5}>2.5 metros (5/8")</option>
                    <option value={3.0}>3.0 metros (3/4")</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">N° Barras en Paralelo:</label>
                  <input 
                    type="number"
                    min={1}
                    max={10}
                    value={rodCount}
                    onChange={(e) => setRodCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Resultado */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Resistencia Estimada (R):</span>
                  <span className={`text-lg font-extrabold font-mono ${calculateGroundingResistance() <= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {calculateGroundingResistance()} Ω
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {calculateGroundingResistance() <= 20 ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> CUMPLE NORMA RIC N°06 (R ≤ 20 Ω)
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-4 h-4" /> RECHAZADO SEC: Agregar más barras o tratamiento de gel.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Factor de Potencia Modal */}
      {activeModal === 'pf_calc' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Compensación de Factor de Potencia (RIC N°03)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Potencia Activa Total (P en kW):</label>
                <input 
                  type="number"
                  value={powerKw}
                  onChange={(e) => setPowerKw(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">FP Actual (cos φ1):</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="0.99"
                    value={currentPf}
                    onChange={(e) => setCurrentPf(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">FP Objetivo (cos φ2):</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.93"
                    max="0.99"
                    value={targetPf}
                    onChange={(e) => setTargetPf(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Banco de Condensadores Requerido:</span>
                  <span className="text-lg font-extrabold font-mono text-fuchsia-400">
                    {calculateKvarCorrection()} kVAR
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Asegura evitar multas por energía reactiva de la distribuidora eléctrica (cos φ ≥ 0.93 exigido por SEC).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Conversor AWG a mm2 Modal */}
      {activeModal === 'awg_converter' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Ruler className="w-5 h-5 text-indigo-400" />
                <span>Conversor de Calibres AWG a mm² y Ampacidad</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/60">
                    <th className="p-2">Calibre AWG</th>
                    <th className="p-2">Sección (mm²)</th>
                    <th className="p-2">Diámetro (mm)</th>
                    <th className="p-2">Ampacidad (EVA / THHN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  <tr><td className="p-2 font-bold text-indigo-400">14 AWG</td><td className="p-2">2.08 mm² (Norma 1.5/2.5)</td><td className="p-2">1.63 mm</td><td className="p-2 text-emerald-400">15 A - 20 A</td></tr>
                  <tr><td className="p-2 font-bold text-indigo-400">12 AWG</td><td className="p-2">3.31 mm² (Norma 2.5/4.0)</td><td className="p-2">2.05 mm</td><td className="p-2 text-emerald-400">20 A - 25 A</td></tr>
                  <tr><td className="p-2 font-bold text-indigo-400">10 AWG</td><td className="p-2">5.26 mm² (Norma 4.0/6.0)</td><td className="p-2">2.59 mm</td><td className="p-2 text-emerald-400">30 A - 35 A</td></tr>
                  <tr><td className="p-2 font-bold text-indigo-400">8 AWG</td><td className="p-2">8.37 mm² (Norma 10.0)</td><td className="p-2">3.26 mm</td><td className="p-2 text-emerald-400">40 A - 50 A</td></tr>
                  <tr><td className="p-2 font-bold text-indigo-400">6 AWG</td><td className="p-2">13.3 mm² (Norma 16.0)</td><td className="p-2">4.11 mm</td><td className="p-2 text-emerald-400">55 A - 65 A</td></tr>
                  <tr><td className="p-2 font-bold text-indigo-400">4 AWG</td><td className="p-2">21.2 mm² (Norma 25.0)</td><td className="p-2">5.19 mm</td><td className="p-2 text-emerald-400">80 A - 95 A</td></tr>
                  <tr><td className="p-2 font-bold text-indigo-400">2 AWG</td><td className="p-2">33.6 mm² (Norma 35.0)</td><td className="p-2">6.54 mm</td><td className="p-2 text-emerald-400">110 A - 130 A</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Cubicaje de Ductos Modal */}
      {activeModal === 'pipe_conduit' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-400" />
                <span>Cubicaje y Factor de Relleno de Ductos (RIC N°04)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Diámetro Conduit (mm):</label>
                  <select 
                    value={pipeDiameter} 
                    onChange={(e) => setPipeDiameter(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={16}>16 mm (1/2")</option>
                    <option value={20}>20 mm (3/4")</option>
                    <option value={25}>25 mm (1")</option>
                    <option value={32}>32 mm (1 1/4")</option>
                    <option value={40}>40 mm (1 1/2")</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sección Conductor (mm²):</label>
                  <select 
                    value={wireSec} 
                    onChange={(e) => setWireSec(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={1.5}>1.5 mm²</option>
                    <option value={2.5}>2.5 mm²</option>
                    <option value={4.0}>4.0 mm²</option>
                    <option value={6.0}>6.0 mm²</option>
                    <option value={10.0}>10.0 mm²</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Cantidad de Conductores en el Ducto:</label>
                <input 
                  type="number"
                  min={1}
                  max={20}
                  value={wireQty}
                  onChange={(e) => setWireQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              {/* Resultado */}
              {(() => {
                const res = calculatePipeFill();
                return (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Porcentaje de Relleno:</span>
                      <span className={`text-lg font-extrabold font-mono ${res.isCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {res.fillPercent}%
                      </span>
                    </div>
                    <p className={`text-[11px] font-bold ${res.isCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {res.isCompliant 
                        ? '✓ DENTRO DE NORMA RIC N°04 (Máx. 35% para 3+ cond)' 
                        : '✕ EXCEDIDO: Aumente el diámetro del ducto conduit para evitar sobrecalentamiento.'}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 8. Guía de Empalmes Modal */}
      {activeModal === 'empalmes_guide' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <span>Guía Oficial de Empalmes Monofásicos y Trifásicos (SEC)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400 text-sm">Empalme A-6 (Monofásico Aéreo)</h4>
                <p className="text-slate-300">Interruptor termomagnético 10A a 16A | Potencia hasta 2.2 kW | Conductor acometida 2x4 mm² / Concentrico</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-emerald-400 text-sm">Empalme A-9 (Monofásico Aéreo Reforzado)</h4>
                <p className="text-slate-300">Interruptor termomagnético 25A a 32A | Potencia hasta 7.0 kW | Conductor acometida 2x6 mm²</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-cyan-400 text-sm">Empalme S-9 / S-15 (Subterráneo)</h4>
                <p className="text-slate-300">Acometida subterránea en conduit ducto HDPE de 32mm / Cajas de protección selladas SEC.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-fuchsia-400 text-sm">Empalme T-12 / T-18 / T-27 (Trifásico Industrial)</h4>
                <p className="text-slate-300">Tensión 380V / 220V | Interruptor 3x25A a 3x60A | Acometida 4x10 mm² o superior.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Megger Simulator Modal */}
      {activeModal === 'megger_simulator' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <span>Simulador Megger - Test Aislamiento (RIC N°19)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tensión de Ensayo Generada (V DC):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[250, 500, 1000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMeggerVoltage(v)}
                      className={`p-2 rounded-xl border font-bold transition-all ${
                        meggerVoltage === v 
                          ? 'bg-cyan-600 text-white border-cyan-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {v} V DC
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Resistencia de Aislamiento Medida (MΩ):</label>
                <input 
                  type="number"
                  step="0.1"
                  value={meggerResistance}
                  onChange={(e) => setMeggerResistance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Evaluación SEC:</span>
                  <span className={`text-base font-bold ${meggerResistance >= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {meggerResistance >= 1.0 ? '✓ AISLAMIENTO CORRECTO (≥ 1.0 MΩ)' : '✕ CRÍTICO: FUGA A TIERRA (R < 1.0 MΩ)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Termografía Modal */}
      {activeModal === 'thermography' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-rose-500" />
                <span>Diagnóstico Termográfico y Sobretemperatura ΔT</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Sobretemperatura en Borne / Protección (ΔT en °C):</label>
                <input 
                  type="number"
                  value={deltaT}
                  onChange={(e) => setDeltaT(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                {deltaT < 10 && (
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>NORMAL: Gradiente de temperatura aceptable (ΔT &lt; 10°C).</span>
                  </div>
                )}
                {deltaT >= 10 && deltaT <= 30 && (
                  <div className="text-amber-400 font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>ALERTA MODERADA: Torquear bornes de conexión y reequilibrar fases (ΔT 10-30°C).</span>
                  </div>
                )}
                {deltaT > 30 && (
                  <div className="text-rose-400 font-bold flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    <span>CRÍTICO: RIESGO DE INCENDIO / PUNTO CALIENTE. Reemplazar protección inmediatamente.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. Luxómetro Modal */}
      {activeModal === 'luxmeter' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-300" />
                <span>Cálculo de Iluminación y Lúmenes (RIC N°10)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Área del Local (m²):</label>
                  <input 
                    type="number"
                    value={roomAreaM2}
                    onChange={(e) => setRoomAreaM2(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nivel Exigido (Lux):</label>
                  <select 
                    value={requiredLux} 
                    onChange={(e) => setRequiredLux(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={150}>150 Lux (Residencial general)</option>
                    <option value={300}>300 Lux (Cocina / Aulas)</option>
                    <option value={500}>500 Lux (Oficinas / Trabajo)</option>
                    <option value={750}>750 Lux (Dibujo técnico / Taller)</option>
                  </select>
                </div>
              </div>

              {(() => {
                const res = calculateLumensAndPanels();
                return (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Flujo Luminoso Requerido:</span>
                      <span className="text-base font-bold font-mono text-amber-300">{res.totalLumens} Lumens</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Paneles LED 18W Recomendados:</span>
                      <span className="text-base font-bold font-mono text-emerald-400">{res.panelsCount} Luminarias</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const ToolCard = ({ 
  icon, 
  title, 
  desc, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
  onClick: () => void;
}) => (
  <button 
    type="button"
    onClick={onClick}
    className="flex items-center gap-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-fuchsia-500/50 p-3 rounded-xl transition-all text-left w-full group shadow-md"
  >
    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-fuchsia-500/30 group-hover:scale-105 transition-all shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-bold text-slate-200 group-hover:text-fuchsia-300 transition-colors truncate">{title}</h4>
      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{desc}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all shrink-0" />
  </button>
);

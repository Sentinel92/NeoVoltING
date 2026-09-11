import React, { useState } from 'react';
import {
  Clock,
  Users,
  Sliders,
  Zap,
  Sun,
  Layers,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShoppingCart,
  FileDown,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { SurveyPointRecord } from '../utils/technicalSurveyEngine';
import {
  calculateLaborTimeEstimation,
  CrewType,
  SiteComplexity,
  CREW_CONFIGS,
  COMPLEXITY_CONFIGS,
  LaborEstimationResult,
} from '../utils/laborEstimationEngine';
import { BudgetItem } from '../types';

interface LaborTimeEstimatorViewProps {
  points: SurveyPointRecord[];
  onTransferLaborToQuote?: (items: BudgetItem[]) => void;
  hourlyRate?: number;
  onRateChange?: (newRate: number) => void;
}

export function LaborTimeEstimatorView({
  points,
  onTransferLaborToQuote,
  hourlyRate = 22000,
  onRateChange,
}: LaborTimeEstimatorViewProps) {
  const [selectedCrew, setSelectedCrew] = useState<CrewType>('master_and_helper');
  const [selectedComplexity, setSelectedComplexity] = useState<SiteComplexity>('medium_occupied');
  const [activeTab, setActiveTab] = useState<'summary' | 'breakdown' | 'schedule'>('summary');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const estimation: LaborEstimationResult = calculateLaborTimeEstimation(points, {
    crewType: selectedCrew,
    siteComplexity: selectedComplexity,
    hourlyRateClp: hourlyRate,
    effectiveHoursPerDay: 8,
  });

  const handleTransferToQuote = () => {
    if (!onTransferLaborToQuote) return;

    const items: BudgetItem[] = [];

    // Main consolidated item
    items.push({
      id: `quote_labor_hh_${Date.now()}`,
      name: `Mano de Obra: Reparación y Normalización (${estimation.powerPointsCount} Puntos de Fuerza + ${estimation.lightingPointsCount} Centros de Alumbrado + ${estimation.boardCircuitsCount} Circuitos Tablero) • Cuadrilla: ${CREW_CONFIGS[selectedCrew].label}`,
      quantity: estimation.adjustedManHoursHH,
      price: hourlyRate,
      category: 'MANO DE OBRA',
      unit: 'HH (Horas-Hombre)',
      skuCode: 'MO-HH-ESTIMADA',
    });

    onTransferLaborToQuote(items);
    setToastMessage('✓ Estimación de Horas-Hombre transferida a Cotización.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white font-bold">✕</button>
        </div>
      )}

      {/* HEADER BANNER WITH EXECUTIVE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Man-Hours Card */}
        <div className="p-4 rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/50 border-fuchsia-500/60 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-fuchsia-300">
                Total Horas-Hombre (HH)
              </span>
              <Clock className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white mt-1">
              {estimation.adjustedManHoursHH} <span className="text-sm font-normal text-fuchsia-300">HH</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Base: {estimation.baseManHoursHH} HH • Factor: ×{estimation.complexityMultiplier}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800 font-mono">
            {estimation.totalPointsEvaluated} puntos auditados en terreno
          </div>
        </div>

        {/* Calendar Duration Card */}
        <div className="p-4 rounded-2xl border bg-slate-900/90 border-slate-800 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold text-amber-300">
                Plazo Estimado de Faena
              </span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black font-mono text-amber-300 mt-1">
              {estimation.projectedDurationDays} <span className="text-sm font-normal text-slate-400">Días</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              ~{estimation.projectedDurationHours} hrs reloj efectivas (Turnos 8h)
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800 font-mono">
            Eficiencia Cuadrilla: <strong>×{estimation.crewParallelEfficiency}</strong>
          </div>
        </div>

        {/* Force vs Lighting Ratio Card */}
        <div className="p-4 rounded-2xl border bg-slate-900/90 border-slate-800 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold text-cyan-300">
                Puntos de Fuerza & Alumbrado
              </span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Fuerza / Enchufes:</span>
                <span className="text-base font-black font-mono text-cyan-300">
                  {estimation.powerPointsCount} pts
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Alumbrado:</span>
                <span className="text-base font-black font-mono text-amber-300">
                  {estimation.lightingPointsCount} pts
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">
            + {estimation.boardCircuitsCount} circuitos de tablero
          </div>
        </div>

        {/* Labor Budget Card */}
        <div className="p-4 rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/50 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold text-emerald-300">
                Presupuesto Mano de Obra
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
              ${estimation.totalLaborCostClp.toLocaleString('es-CL')} <span className="text-xs text-slate-400 font-normal">CLP</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Tarifa: ${hourlyRate.toLocaleString('es-CL')} / HH
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              Promedio: <strong>${estimation.costPerPointAvgClp.toLocaleString('es-CL')}/pto</strong>
            </span>
            <button
              onClick={handleTransferToQuote}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg shadow transition flex items-center gap-1"
              title="Transferir HH al Cotizador"
            >
              <ShoppingCart className="w-3 h-3" />
              <span>Cotizar HH</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: CREW & COMPLEXITY SELECTORS */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-fuchsia-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Parámetros de Rendimiento de Cuadrilla & Complejidad en Terreno
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Rendimientos estándar SEC Chile
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Crew Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Composición de Cuadrilla:</span>
            </label>
            <select
              value={selectedCrew}
              onChange={(e) => setSelectedCrew(e.target.value as CrewType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-fuchsia-500 focus:outline-none"
            >
              {(Object.keys(CREW_CONFIGS) as CrewType[]).map((cKey) => (
                <option key={cKey} value={cKey}>
                  {CREW_CONFIGS[cKey].label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {CREW_CONFIGS[selectedCrew].description}
            </p>
          </div>

          {/* Complexity Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Complejidad del Inmueble:</span>
            </label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value as SiteComplexity)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-fuchsia-500 focus:outline-none"
            >
              {(Object.keys(COMPLEXITY_CONFIGS) as SiteComplexity[]).map((cmpKey) => (
                <option key={cmpKey} value={cmpKey}>
                  {COMPLEXITY_CONFIGS[cmpKey].label} (Factor ×{COMPLEXITY_CONFIGS[cmpKey].multiplier})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {COMPLEXITY_CONFIGS[selectedComplexity].description}
            </p>
          </div>

          {/* Hourly Rate Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tarifa Mano de Obra:</span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ${hourlyRate.toLocaleString('es-CL')} / hr
              </span>
            </div>
            <input
              type="range"
              min="14000"
              max="45000"
              step="1000"
              value={hourlyRate}
              onChange={(e) => onRateChange && onRateChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>$14.000 (Base)</span>
              <span>$22.000 (Estándar)</span>
              <span>$35.000+ (Urgencia)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS: SUMMARY DISTRIBUTION VS DETAILED BREAKDOWN VS PHASES SCHEDULE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Desglose por Tipo de Punto</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Cronograma de 5 Fases de Faena</span>
          </button>
        </div>

        {/* TAB 1: BREAKDOWN BY POINT TYPE */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {estimation.breakdownByPointType.map((item) => {
                const percentage = Math.round((item.totalAdjustedMinutes / (estimation.adjustedManHoursHH * 60)) * 100) || 0;
                return (
                  <div
                    key={item.pointType}
                    className="p-4 rounded-2xl border bg-slate-900/90 border-slate-800 space-y-3 flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-black tracking-wider uppercase bg-slate-800 text-slate-300">
                          {item.count} {item.count === 1 ? 'Punto' : 'Puntos'}
                        </span>
                        <span className="text-xs font-mono font-bold text-fuchsia-400">
                          {item.totalManHoursHH} HH ({percentage}%)
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{item.label}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mb-2">
                        Rendimiento: ~{item.baseMinutesPerUnit} min/punto base
                      </p>

                      <div className="space-y-1 text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                          Actividades Incluidas:
                        </span>
                        {item.tasksDescription.map((task, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-fuchsia-400 font-bold">•</span>
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Costo HH:</span>
                      <span className="font-bold text-emerald-400">
                        ${Math.round(item.totalManHoursHH * hourlyRate).toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: 5 PHASES SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Cronograma Estructurado de Ejecución (Secuencia SEC)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Duración total estimada: <strong>{estimation.projectedDurationDays} Días Hábiles</strong> con cuadrilla de {CREW_CONFIGS[selectedCrew].workers} personas.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {estimation.phasesSchedule.map((phase) => (
                  <div
                    key={phase.phaseNumber}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-fuchsia-600/20 text-fuchsia-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        F{phase.phaseNumber}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">{phase.name}</h5>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                          {phase.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-xs md:text-right">
                      <div>
                        <span className="text-[9.5px] text-slate-500 block uppercase">Carga</span>
                        <span className="font-bold text-fuchsia-300">{phase.percentageOfWork}%</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 block uppercase">Horas-Hombre</span>
                        <span className="font-bold text-amber-300">{phase.estimatedManHoursHH} HH</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 block uppercase">Plazo</span>
                        <span className="font-bold text-emerald-400">~{phase.estimatedDays} d</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

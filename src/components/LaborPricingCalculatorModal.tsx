import React, { useState } from 'react';
import { RoomData, HighAppliance } from '../types';
import { Calculator, Check, X, Sliders, DollarSign, Edit3, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface LaborPricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomData[];
  highAppliances: HighAppliance[];
  currentLaborCost: number;
  onApplyLaborCost: (newCost: number) => void;
}

export const LaborPricingCalculatorModal: React.FC<LaborPricingCalculatorModalProps> = ({
  isOpen,
  onClose,
  rooms,
  highAppliances,
  currentLaborCost,
  onApplyLaborCost,
}) => {
  // Count totals
  const totalLights = rooms.reduce((sum, r) => sum + r.lightPoints, 0);
  const totalSockets = rooms.reduce((sum, r) => sum + r.socketPoints, 0);
  const totalHeavy = highAppliances.length;

  // Unit Rates state (Editable in real-time)
  const [ratePerLightPoint, setRatePerLightPoint] = useState<number>(12000);
  const [ratePerSocketPoint, setRatePerSocketPoint] = useState<number>(14000);
  const [ratePerHeavyCircuit, setRatePerHeavyCircuit] = useState<number>(38000);
  const [rateBoardAssembly, setRateBoardAssembly] = useState<number>(65000);
  const [rateGroundingRod, setRateGroundingRod] = useState<number>(45000);
  const [rateTe1Process, setRateTe1Process] = useState<number>(120000);

  // Multiplier Factor (1.0 = Normal, 1.25 = Dificultad Media, 1.5 = Alta / Urgencia)
  const [difficultyMultiplier, setDifficultyMultiplier] = useState<number>(1.0);
  const [includeTe1InLabor, setIncludeTe1InLabor] = useState<boolean>(true);
  const [includeGroundingInLabor, setIncludeGroundingInLabor] = useState<boolean>(true);

  if (!isOpen) return null;

  // Subtotals
  const subtotalLights = totalLights * ratePerLightPoint;
  const subtotalSockets = totalSockets * ratePerSocketPoint;
  const subtotalHeavy = totalHeavy * ratePerHeavyCircuit;
  const subtotalBoard = rateBoardAssembly;
  const subtotalGrounding = includeGroundingInLabor ? rateGroundingRod : 0;
  const subtotalTe1 = includeTe1InLabor ? rateTe1Process : 0;

  const rawSubtotal =
    subtotalLights + subtotalSockets + subtotalHeavy + subtotalBoard + subtotalGrounding + subtotalTe1;

  const calculatedLaborTotal = Math.round(rawSubtotal * difficultyMultiplier);

  const handleApply = () => {
    onApplyLaborCost(calculatedLaborTotal);
    onClose();
  };

  const handleResetDefaults = () => {
    setRatePerLightPoint(12000);
    setRatePerSocketPoint(14000);
    setRatePerHeavyCircuit(38000);
    setRateBoardAssembly(65000);
    setRateGroundingRod(45000);
    setRateTe1Process(120000);
    setDifficultyMultiplier(1.0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn my-auto max-h-[90vh] flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Calculadora & Sugerencia de Tarifario de Mano de Obra</h3>
              <p className="text-xs text-slate-400">
                Tarifas de referencia mercado chileno (SEC). Modifica los precios unitarios libremente para ajustar tus honorarios.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editable Rate Table */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>1. Tarifario Unitario Editable ($ CLP por ítem)</span>
              </span>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                title="Restablecer precios estándar"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Precios Estándar SEC</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Light points */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold">Punto de Alumbrado (Luz):</span>
                  <span className="font-mono text-fuchsia-400 font-bold">{totalLights} centro(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    value={ratePerLightPoint}
                    onChange={(e) => setRatePerLightPoint(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">/pto</span>
                </div>
                <div className="text-right text-[10px] text-emerald-400 font-bold">
                  Subtotal: ${subtotalLights.toLocaleString('es-CL')} CLP
                </div>
              </div>

              {/* Socket points */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold">Punto de Enchufe 10A/16A:</span>
                  <span className="font-mono text-fuchsia-400 font-bold">{totalSockets} centro(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    value={ratePerSocketPoint}
                    onChange={(e) => setRatePerSocketPoint(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">/pto</span>
                </div>
                <div className="text-right text-[10px] text-emerald-400 font-bold">
                  Subtotal: ${subtotalSockets.toLocaleString('es-CL')} CLP
                </div>
              </div>

              {/* Heavy circuits */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold">Circuito Dedicado / Clima:</span>
                  <span className="font-mono text-fuchsia-400 font-bold">{totalHeavy} cto(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    value={ratePerHeavyCircuit}
                    onChange={(e) => setRatePerHeavyCircuit(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">/cto</span>
                </div>
                <div className="text-right text-[10px] text-emerald-400 font-bold">
                  Subtotal: ${subtotalHeavy.toLocaleString('es-CL')} CLP
                </div>
              </div>

              {/* TDA Assembly */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold">Armado & Montaje TDA:</span>
                  <span className="font-mono text-emerald-400 font-bold">Base Obra</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    value={rateBoardAssembly}
                    onChange={(e) => setRateBoardAssembly(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">global</span>
                </div>
                <div className="text-right text-[10px] text-emerald-400 font-bold">
                  Subtotal: ${subtotalBoard.toLocaleString('es-CL')} CLP
                </div>
              </div>

              {/* Grounding Rod */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeGroundingInLabor}
                      onChange={(e) => setIncludeGroundingInLabor(e.target.checked)}
                      className="rounded accent-fuchsia-600"
                    />
                    <span className="font-semibold">Malla / Puesta a Tierra:</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    disabled={!includeGroundingInLabor}
                    value={rateGroundingRod}
                    onChange={(e) => setRateGroundingRod(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right disabled:opacity-40"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">global</span>
                </div>
                <div className="text-right text-[10px] text-emerald-400 font-bold">
                  Subtotal: ${subtotalGrounding.toLocaleString('es-CL')} CLP
                </div>
              </div>

              {/* TE1 SEC Process */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTe1InLabor}
                      onChange={(e) => setIncludeTe1InLabor(e.target.value)}
                      className="rounded accent-fuchsia-600"
                    />
                    <span className="font-semibold">Trámite TE1 SEC e-Declarador:</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    disabled={!includeTe1InLabor}
                    value={rateTe1Process}
                    onChange={(e) => setRateTe1Process(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right disabled:opacity-40"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">honorarios</span>
                </div>
                <div className="text-right text-[10px] text-emerald-400 font-bold">
                  Subtotal: ${subtotalTe1.toLocaleString('es-CL')} CLP
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty Factor Slider */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>2. Factor de Dificultad, Acceso y Complejidad de Obra</span>
              </span>
              <span className="font-mono font-bold text-fuchsia-300 bg-fuchsia-500/20 px-2 py-0.5 rounded border border-fuchsia-500/30">
                {(difficultyMultiplier * 100).toFixed(0)}% ({difficultyMultiplier}x)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Normal / Monofásica (1.0x)', val: 1.0 },
                { label: 'Dificultad Media / Altura (1.25x)', val: 1.25 },
                { label: 'Alta / Urgencia / Noche (1.5x)', val: 1.5 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDifficultyMultiplier(opt.val)}
                  className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                    difficultyMultiplier === opt.val
                      ? 'bg-fuchsia-600 border-fuchsia-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total Calculation Display */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Mano de Obra Calculada Sugerida</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                ${calculatedLaborTotal.toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-400">CLP</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              Mano de Obra Actual en Cotización: <strong className="text-slate-200 font-mono">${currentLaborCost.toLocaleString('es-CL')} CLP</strong>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Valor Sugerido a Cotización</span>
          </button>
        </div>
      </div>
    </div>
  );
};

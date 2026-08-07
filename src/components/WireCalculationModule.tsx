import React, { useState } from 'react';
import { RoomData, HighAppliance, BudgetItem } from '../types';
import { Zap, Calculator, Check, AlertTriangle, ShieldCheck, ArrowRight, Download, Plus, Scale } from 'lucide-react';

interface WireCalculationModuleProps {
  rooms: RoomData[];
  highAppliances: HighAppliance[];
  onExportWiresToBudget: (items: BudgetItem[]) => void;
}

interface CircuitWireCalc {
  code: string;
  name: string;
  loadWatts: number;
  currentAmps: number;
  distanceMeters: number; // distance from TDA board to furthest point
  suggestedSectionMm2: number; // 1.5, 2.5, 4.0, 6.0, 10.0
  conductorsCount: number; // e.g. 3 (L, N, PE) or 4 (L, N, PE, Return)
  voltageDropV: number;
  voltageDropPercent: number;
  isSecCompliant: boolean; // % <= 3.0%
  phaseMeters: number;
  neutralMeters: number;
  earthMeters: number;
  totalCircuitWireMeters: number;
}

export const WireCalculationModule: React.FC<WireCalculationModuleProps> = ({
  rooms,
  highAppliances,
  onExportWiresToBudget,
}) => {
  // Margin factor for box loops and wastage (demasía)
  const [marginPercent, setMarginPercent] = useState<number>(10);
  const [defaultDistanceMeters, setDefaultDistanceMeters] = useState<number>(15);
  const [addedToBudgetSuccess, setAddedToBudgetSuccess] = useState(false);

  // Generate circuits from current project rooms and high appliances
  const totalLights = rooms.reduce((sum, r) => sum + r.lightPoints, 0);
  const totalSockets = rooms.reduce((sum, r) => sum + r.socketPoints, 0);

  const rawCircuits: Array<{ code: string; name: string; type: 'alumbrado' | 'enchufes' | 'fuerza'; watts: number; defaultDist: number }> = [];

  let cIdx = 1;

  // Alumbrado circuits (12 points per circuit)
  let lightCircuitsCount = Math.ceil(totalLights / 12) || (totalLights > 0 ? 1 : 0);
  for (let i = 0; i < lightCircuitsCount; i++) {
    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Alumbrado G.${i + 1}`,
      type: 'alumbrado',
      watts: Math.round((totalLights / lightCircuitsCount) * 100),
      defaultDist: defaultDistanceMeters,
    });
    cIdx++;
  }

  // Socket circuits (10 points per circuit)
  let socketCircuitsCount = Math.ceil(totalSockets / 10) || (totalSockets > 0 ? 1 : 0);
  for (let i = 0; i < socketCircuitsCount; i++) {
    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Enchufes General G.${i + 1}`,
      type: 'enchufes',
      watts: Math.round((totalSockets / socketCircuitsCount) * 150) + 1000,
      defaultDist: defaultDistanceMeters + 2,
    });
    cIdx++;
  }

  // Dedicated High appliances
  highAppliances.forEach((app) => {
    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Dedicado: ${app.name}`,
      type: 'fuerza',
      watts: app.powerWatts,
      defaultDist: defaultDistanceMeters + 5,
    });
    cIdx++;
  });

  // State for distances per circuit
  const [circuitDistances, setCircuitDistances] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    rawCircuits.forEach((c) => {
      initial[c.code] = c.defaultDist;
    });
    return initial;
  });

  const handleDistanceChange = (code: string, meters: number) => {
    setCircuitDistances((prev) => ({
      ...prev,
      [code]: Math.max(1, meters),
    }));
  };

  // SEC RIC N°03 Calculation constants
  const VOLTAGE_MONO = 220; // Volts
  const COPPER_RHO = 0.018; // Ohm * mm2 / m

  // Perform calculation for each circuit
  const calculatedCircuits: CircuitWireCalc[] = rawCircuits.map((c) => {
    const dist = circuitDistances[c.code] ?? c.defaultDist;
    const currentAmps = Number((c.watts / VOLTAGE_MONO).toFixed(2));

    // Recommend wire section according to load current and minimum RIC N°03 rules
    let section = 1.5;
    if (c.type === 'alumbrado') {
      section = 1.5;
    } else if (c.type === 'enchufes') {
      section = 2.5;
    } else {
      if (currentAmps > 25) section = 6.0;
      else if (currentAmps > 16) section = 4.0;
      else section = 2.5;
    }

    // Single phase voltage drop DV = (2 * L * I * Rho) / S
    let vDrop = (2 * dist * currentAmps * COPPER_RHO) / section;
    let vDropPercent = (vDrop / VOLTAGE_MONO) * 100;

    // Auto upsize wire section if voltage drop exceeds 3.0%
    if (vDropPercent > 3.0) {
      if (section === 1.5) section = 2.5;
      else if (section === 2.5) section = 4.0;
      else if (section === 4.0) section = 6.0;
      else if (section === 6.0) section = 10.0;

      // Recalculate with upsized section
      vDrop = (2 * dist * currentAmps * COPPER_RHO) / section;
      vDropPercent = (vDrop / VOLTAGE_MONO) * 100;
    }

    const marginMultiplier = 1 + marginPercent / 100;
    const conductors = c.type === 'alumbrado' ? 4 : 3; // 4 includes return wire for switch

    const phaseMeters = Math.ceil(dist * marginMultiplier);
    const neutralMeters = Math.ceil(dist * marginMultiplier);
    const earthMeters = Math.ceil(dist * marginMultiplier);

    const totalCircuitWireMeters = Math.ceil(dist * conductors * marginMultiplier);

    return {
      code: c.code,
      name: c.name,
      loadWatts: c.watts,
      currentAmps,
      distanceMeters: dist,
      suggestedSectionMm2: section,
      conductorsCount: conductors,
      voltageDropV: Number(vDrop.toFixed(2)),
      voltageDropPercent: Number(vDropPercent.toFixed(2)),
      isSecCompliant: vDropPercent <= 3.0,
      phaseMeters,
      neutralMeters,
      earthMeters,
      totalCircuitWireMeters,
    };
  });

  // Group total meters required by wire section (mm2) and color
  const totalsBySection = calculatedCircuits.reduce((acc, c) => {
    const sec = c.suggestedSectionMm2;
    if (!acc[sec]) {
      acc[sec] = { phase: 0, neutral: 0, earth: 0, totalMeters: 0 };
    }
    acc[sec].phase += c.phaseMeters;
    acc[sec].neutral += c.neutralMeters;
    acc[sec].earth += c.earthMeters;
    acc[sec].totalMeters += c.totalCircuitWireMeters;
    return acc;
  }, {} as Record<number, { phase: number; neutral: number; earth: number; totalMeters: number }>);

  // Handle export to budget / cotización
  const handleExportToBudget = () => {
    const itemsToExport: BudgetItem[] = [];

    // Unit prices based on real Chilean market reference
    const PRICE_PER_METER: Record<number, number> = {
      1.5: 450,
      2.5: 690,
      4.0: 1150,
      6.0: 1850,
      10.0: 2950,
    };

    Object.entries(totalsBySection).forEach(([secStr, totals]) => {
      const sec = Number(secStr);
      const unitPrice = PRICE_PER_METER[sec] || 700;

      if (totals.phase > 0) {
        itemsToExport.push({
          id: `wire_p_${sec}_${Date.now()}`,
          name: `Cable EVA ${sec}mm² Rojo (Fase Libre Halógenos H07Z1-K)`,
          quantity: totals.phase,
          price: unitPrice,
          category: 'CONDUCTORES',
          unit: 'metro',
          skuCode: `CAT-EVA-${sec}R`,
          imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=300&auto=format&fit=crop&q=60',
        });
      }

      if (totals.neutral > 0) {
        itemsToExport.push({
          id: `wire_n_${sec}_${Date.now()}`,
          name: `Cable EVA ${sec}mm² Azul (Neutro Libre Halógenos H07Z1-K)`,
          quantity: totals.neutral,
          price: unitPrice,
          category: 'CONDUCTORES',
          unit: 'metro',
          skuCode: `CAT-EVA-${sec}A`,
          imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=300&auto=format&fit=crop&q=60',
        });
      }

      if (totals.earth > 0) {
        itemsToExport.push({
          id: `wire_pe_${sec}_${Date.now()}`,
          name: `Cable EVA ${sec}mm² Verde (Tierra PE Libre Halógenos H07Z1-K)`,
          quantity: totals.earth,
          price: unitPrice,
          category: 'CONDUCTORES',
          unit: 'metro',
          skuCode: `CAT-EVA-${sec}V`,
          imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=300&auto=format&fit=crop&q=60',
        });
      }
    });

    onExportWiresToBudget(itemsToExport);
    setAddedToBudgetSuccess(true);
    setTimeout(() => setAddedToBudgetSuccess(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Cálculo de Conductores & Metraje • SEC RIC N°03</span>
          </div>
          <h2 className="text-xl font-bold text-white">Dimensionamiento de Cables y Caída de Tensión (ΔV)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Calcula la sección en mm², metros lineales por color (Fase, Neutro, PE), rollos y verifica el cumplimiento de caída de tensión ≤ 3%.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block font-semibold">Margen Demasía (%):</label>
              <select
                value={marginPercent}
                onChange={(e) => setMarginPercent(Number(e.target.value))}
                className="bg-slate-800 text-white font-bold rounded px-2 py-1 text-xs border border-slate-700 focus:outline-none"
              >
                <option value={5}>+5% (Mínimo)</option>
                <option value={10}>+10% (Recomendado)</option>
                <option value={15}>+15% (Extenso / Tubos)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block font-semibold">Distancia Base (m):</label>
              <input
                type="number"
                min={5}
                max={100}
                value={defaultDistanceMeters}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDefaultDistanceMeters(val);
                  setCircuitDistances((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => (next[k] = val));
                    return next;
                  });
                }}
                className="w-16 bg-slate-800 text-white font-bold rounded px-2 py-1 text-xs border border-slate-700 text-center"
              />
            </div>
          </div>

          <button
            onClick={handleExportToBudget}
            className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Exportar Cables a Cotización</span>
          </button>
        </div>
      </div>

      {addedToBudgetSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>¡Todos los metros y rollos de cable EVA han sido agregados con éxito a la Cotización!</span>
        </div>
      )}

      {/* Summary Cards by Section (mm2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(totalsBySection).map(([secStr, totals]) => {
          const sec = Number(secStr);
          const rolls100m = Math.ceil(totals.totalMeters / 100);

          return (
            <div key={sec} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-fuchsia-500"></div>
                  <span className="font-extrabold text-white text-sm">Sección {sec} mm² EVA</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded border border-fuchsia-500/30">
                  {rolls100m} Rollo(s) 100m
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-rose-300">
                  <span>● Fase Rojo (L):</span>
                  <strong className="font-mono">{totals.phase} m</strong>
                </div>
                <div className="flex justify-between items-center text-sky-300">
                  <span>● Neutro Azul (N):</span>
                  <strong className="font-mono">{totals.neutral} m</strong>
                </div>
                <div className="flex justify-between items-center text-emerald-300">
                  <span>● Tierra Verde (PE):</span>
                  <strong className="font-mono">{totals.earth} m</strong>
                </div>
                <div className="pt-2 border-t border-slate-900 flex justify-between items-center font-bold text-white">
                  <span>Total Metros Requeridos:</span>
                  <span className="text-fuchsia-400 text-sm font-extrabold">{totals.totalMeters} m</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Circuits Distance & Voltage Drop Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Detalle de Cálculo por Circuito (Distancia a Tablero TDA y ΔV RIC N°03)</span>
          </div>
          <span className="text-[10px] text-slate-400">Tensión Nominal: 220V Monofásico • Cobre 75°C</span>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="p-2.5">Cto.</th>
              <th className="p-2.5">Nombre Circuito</th>
              <th className="p-2.5">Potencia / Amperes</th>
              <th className="p-2.5">Distancia (m)</th>
              <th className="p-2.5">Sección Rec.</th>
              <th className="p-2.5">Caída Tensión (ΔV)</th>
              <th className="p-2.5">Verificación SEC</th>
              <th className="p-2.5 text-right">Metraje Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {calculatedCircuits.map((c) => (
              <tr key={c.code} className="hover:bg-slate-900/50 transition-colors">
                <td className="p-2.5 font-bold font-mono text-fuchsia-400">{c.code}</td>
                <td className="p-2.5 font-bold text-white">{c.name}</td>
                <td className="p-2.5 font-mono">
                  {c.loadWatts}W / <span className="text-emerald-400 font-bold">{c.currentAmps}A</span>
                </td>
                <td className="p-2.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={c.distanceMeters}
                      onChange={(e) => handleDistanceChange(c.code, Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 font-bold text-xs focus:border-fuchsia-500 text-center"
                    />
                    <span className="text-[10px] text-slate-400">m</span>
                  </div>
                </td>
                <td className="p-2.5 font-bold text-emerald-400 font-mono">
                  {c.suggestedSectionMm2} mm² EVA
                </td>
                <td className="p-2.5 font-mono">
                  {c.voltageDropV}V ({c.voltageDropPercent}%)
                </td>
                <td className="p-2.5">
                  {c.isSecCompliant ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Cumple ΔV ≤ 3%</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Excesivo &gt; 3%</span>
                    </span>
                  )}
                </td>
                <td className="p-2.5 text-right font-bold text-fuchsia-300 font-mono">
                  {c.totalCircuitWireMeters} m ({c.conductorsCount} cond.)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

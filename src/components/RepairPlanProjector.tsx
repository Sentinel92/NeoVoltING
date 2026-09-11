import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Clock,
  Send,
  FileDown,
  Layers,
  Wrench,
  Sparkles,
  RefreshCw,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  SurveyPointRecord,
  RepairPlanSummary,
  AuditAnomaly,
  calculateRepairPlan,
  SECTOR_METADATA,
} from '../utils/technicalSurveyEngine';
import { calculateLaborTimeEstimation } from '../utils/laborEstimationEngine';
import { exportTechnicalAuditReportPdf } from '../utils/technicalAuditReportPdf';
import { BudgetItem, CustomerDetails, ContractorConfig } from '../types';

interface RepairPlanProjectorProps {
  points: SurveyPointRecord[];
  customer?: CustomerDetails;
  contractor?: ContractorConfig;
  onTransferToQuote?: (items: BudgetItem[]) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function RepairPlanProjector({
  points,
  customer = { name: 'Cliente Particular', address: 'Instalación en Terreno', phone: '', email: '', emergencyPhone: '' },
  contractor = {
    companyName: 'Servicios Eléctricos Integrales',
    installerName: 'Instalador Autorizado SEC',
    secLicense: 'Clase A',
    secClass: 'Clase A',
    rut: '',
    phone: '',
    address: '',
    senderEmail: '',
    bankDetails: { bankName: '', accountType: '', accountNumber: '', holderName: '', holderRut: '', emailForNotify: '' },
  },
  onTransferToQuote,
  onNavigateToTab,
}: RepairPlanProjectorProps) {
  const [laborHourlyRate, setLaborHourlyRate] = useState<number>(22000);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const repairPlan: RepairPlanSummary = calculateRepairPlan(points, laborHourlyRate);
  const laborCalc = calculateLaborTimeEstimation(points, { hourlyRateClp: laborHourlyRate });

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportTechnicalAuditReportPdf({
        points,
        repairPlan,
        customer,
        contractor,
      });
      setExportNotice('✓ Informe Técnico descargado exitosamente listo para cliente.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      console.error('Error al exportar PDF:', e);
      setExportNotice('⚠️ Error al generar el informe en PDF.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleTransferRepairsToQuote = () => {
    if (!onTransferToQuote) return;

    const items: BudgetItem[] = [];

    // 1. Add Material Bill Items
    repairPlan.materialBill.forEach((mat) => {
      items.push({
        id: `quote_mat_${mat.sku}_${Date.now()}`,
        name: `${mat.name} (${mat.category})`,
        quantity: mat.quantity,
        price: mat.unitPriceClp,
        category: 'MATERIALES REPARACIÓN',
        unit: mat.unit,
        skuCode: mat.sku,
      });
    });

    // 2. Add Labor Service Item with automatic hours calculation based on power & lighting points
    if (laborCalc.adjustedManHoursHH > 0) {
      items.push({
        id: `quote_labor_${Date.now()}`,
        name: `Mano de Obra Calificada: Reparación y Normalización SEC (${laborCalc.powerPointsCount} Pts Fuerza + ${laborCalc.lightingPointsCount} Centros Alumbrado + ${laborCalc.boardCircuitsCount} Circuitos Tablero) [${laborCalc.projectedDurationDays} Días Est.]`,
        quantity: laborCalc.adjustedManHoursHH,
        price: laborHourlyRate,
        category: 'MANO DE OBRA',
        unit: 'HH',
        skuCode: 'MO-AUDIT-RIC',
      });
    }

    onTransferToQuote(items);
    setExportNotice('✓ Propuesta, cubicación y Horas-Hombre transferidas al Cotizador.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  const filteredAnomalies = filterSeverity === 'all'
    ? repairPlan.anomaliesList
    : repairPlan.anomaliesList.filter((a) => a.severity === filterSeverity);

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center justify-between animate-fade-in">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-white font-bold">✕</button>
        </div>
      )}

      {/* EXECUTIVE SCORE BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
        {/* Score Card */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            repairPlan.secComplianceStatus === 'NO_CUMPLE_CRITICO'
              ? 'bg-rose-950/40 border-rose-500/80 text-rose-100'
              : repairPlan.secComplianceStatus === 'OBSERVADO_MAYOR'
              ? 'bg-amber-950/40 border-amber-500/80 text-amber-100'
              : 'bg-emerald-950/40 border-emerald-500/80 text-emerald-100'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-300">
                Índice Seguridad SEC
              </span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black font-mono mt-1">
              {repairPlan.auditScore100} / 100
            </div>
            <div className="text-xs font-bold mt-1">
              {repairPlan.secComplianceStatus === 'NO_CUMPLE_CRITICO'
                ? '⚠️ Riesgo Vital / Incendio'
                : repairPlan.secComplianceStatus === 'OBSERVADO_MAYOR'
                ? '⚡ Observaciones Mayores'
                : '✓ Instalación Conforme'}
            </div>
          </div>
          <div className="text-[10.5px] text-slate-300 mt-3 pt-2 border-t border-slate-700/50">
            {points.length} puntos evaluados bajo pliegos RIC N°01 a N°19.
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="p-4 rounded-2xl border bg-slate-900/90 border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Hallazgos por Severidad
            </span>
            <div className="space-y-1.5 mt-2 text-xs">
              <div className="flex justify-between items-center text-rose-400 font-bold">
                <span>🔥 Críticos (Riesgo):</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 font-mono">
                  {repairPlan.criticalCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-400 font-bold">
                <span>⚡ Mayores (Normativo):</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 font-mono">
                  {repairPlan.majorCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>💡 Menores (Mejoras):</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 font-mono">
                  {repairPlan.minorCount}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">
            Total Anomalías: <strong>{repairPlan.totalAnomalies}</strong>
          </div>
        </div>

        {/* Materials Cubication Card */}
        <div className="p-4 rounded-2xl border bg-slate-900/90 border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Cubicado de Insumos
            </span>
            <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
              ${repairPlan.totalMaterialCostClp.toLocaleString('es-CL')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {repairPlan.materialBill.length} tipos de materiales requeridos
            </div>
          </div>
          <div className="text-[10.5px] text-slate-400 mt-3 pt-2 border-t border-slate-800 font-mono">
            EVA, disyuntores, RCD y cajas.
          </div>
        </div>

        {/* Total Projected Repair Budget Card */}
        <div className="p-4 rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/60 border-fuchsia-500/50 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-fuchsia-300 block mb-1">
              Presupuesto Proyectado
            </span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              ${(repairPlan.totalMaterialCostClp + laborCalc.totalLaborCostClp + Math.round((repairPlan.totalMaterialCostClp + laborCalc.totalLaborCostClp) * 0.19)).toLocaleString('es-CL')} <span className="text-xs text-slate-400 font-normal">CLP</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {laborCalc.adjustedManHoursHH} HH ({laborCalc.powerPointsCount} Fuerza + {laborCalc.lightingPointsCount} Alumb.) • ~{laborCalc.projectedDurationDays}d
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1"
              title="Descargar Informe Técnico de Auditoría en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isExportingPdf ? 'Exportando...' : 'Informe PDF'}</span>
            </button>

            <button
              onClick={handleTransferRepairsToQuote}
              className="flex-1 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[11px] font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1"
              title="Traspasar materiales y mano de obra a la pestaña de Cotizaciones"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-300" />
              <span>Cotizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABS & CONFIGURATION BAR */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Filtrar Anomalías:</span>
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'CRITICO', label: '🔥 Críticas' },
              { key: 'MAYOR', label: '⚡ Mayores' },
              { key: 'MENOR', label: '💡 Menores' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterSeverity(tab.key)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  filterSeverity === tab.key
                    ? 'bg-fuchsia-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Labor Rate Config Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Valor Hora Mano de Obra:
          </span>
          <span className="text-xs font-bold font-mono text-amber-300">
            ${laborHourlyRate.toLocaleString('es-CL')} / hr
          </span>
          <input
            type="range"
            min="12000"
            max="45000"
            step="1000"
            value={laborHourlyRate}
            onChange={(e) => setLaborHourlyRate(parseInt(e.target.value, 10))}
            className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      </div>

      {/* SECTION 1: MATRIZ DE ANOMALÍAS & ACCIONES CORRECTIVAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Matriz de Diagnóstico y Acciones Correctivas (Pliegos RIC)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredAnomalies.length} hallazgos visualizados
          </span>
        </div>

        {filteredAnomalies.length === 0 ? (
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            ✓ No hay anomalías en este filtro. Todos los puntos evaluados cumplen con la reglamentación.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAnomalies.map((anom) => (
              <div
                key={anom.id}
                className={`p-4 rounded-2xl border transition-all ${
                  anom.severity === 'CRITICO'
                    ? 'bg-rose-950/30 border-rose-500/60'
                    : anom.severity === 'MAYOR'
                    ? 'bg-amber-950/20 border-amber-500/50'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          anom.severity === 'CRITICO'
                            ? 'bg-rose-500 text-slate-950 font-black'
                            : anom.severity === 'MAYOR'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-emerald-500 text-slate-950 font-bold'
                        }`}
                      >
                        {anom.severity}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                        {anom.codeRIC}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {anom.pointName}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{anom.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{anom.description}</p>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1 mt-2">
                      <div className="text-rose-300 font-semibold flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                        <span><strong>Riesgo Técnico:</strong> {anom.riskDescription}</span>
                      </div>
                      <div className="text-emerald-300 font-semibold flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        <span><strong>Acción Correctiva:</strong> {anom.recommendedAction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Labor Column */}
                  <div className="md:text-right shrink-0 bg-slate-950/80 p-3 rounded-xl border border-slate-800 md:min-w-[170px] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Insumos Estimados</span>
                    <span className="text-base font-black font-mono text-cyan-300 block">
                      ${anom.estimatedMaterialCostClp.toLocaleString('es-CL')}
                    </span>
                    <div className="text-[11px] text-slate-400 flex items-center md:justify-end gap-1 font-mono pt-1 border-t border-slate-800">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{anom.estimatedLaborMinutes} min MO</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: CUBICADO ESTIMADO DE MATERIALES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Cubicación Consolidada de Materiales e Insumos</span>
          </h3>
          <span className="text-xs font-mono text-cyan-300 font-bold">
            Total Materiales: ${repairPlan.totalMaterialCostClp.toLocaleString('es-CL')} CLP
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Código SKU</th>
                <th className="p-3">Material / Insumo</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-center">Cantidad</th>
                <th className="p-3 text-right">P. Unitario</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {repairPlan.materialBill.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                    No se requieren materiales correctivos.
                  </td>
                </tr>
              ) : (
                repairPlan.materialBill.map((m) => (
                  <tr key={m.sku} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{m.sku}</td>
                    <td className="p-3 font-bold text-white">{m.name}</td>
                    <td className="p-3 text-slate-400">{m.category}</td>
                    <td className="p-3 text-center font-mono font-bold text-cyan-300">
                      {m.quantity} {m.unit}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      ${m.unitPriceClp.toLocaleString('es-CL')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      ${m.totalPriceClp.toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

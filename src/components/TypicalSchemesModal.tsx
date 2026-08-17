import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Zap,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building,
  Home,
  Factory,
  Sun,
  Utensils,
  Gauge,
  Cpu,
  Info,
  Check,
} from 'lucide-react';
import { TYPICAL_SCHEMES, TypicalScheme } from '../data/typicalSchemes';

interface TypicalSchemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScheme: (scheme: TypicalScheme) => void;
}

export const TypicalSchemesModal: React.FC<TypicalSchemesModalProps> = ({
  isOpen,
  onClose,
  onSelectScheme,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activePreviewId, setActivePreviewId] = useState<string>(TYPICAL_SCHEMES[0].id);

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'Todos los Esquemas', icon: Layers },
    { id: 'RESIDENCIAL', label: 'Residencial', icon: Home },
    { id: 'TRIFASICO_FUERZA', label: 'Trifásico / Fuerza', icon: Factory },
    { id: 'SERVICIOS_COMUNES', label: 'Servicios Comunes', icon: Building },
    { id: 'COMERCIAL_GASTRONOMIA', label: 'Gastronómico', icon: Utensils },
    { id: 'FOTOVOLTAICO', label: 'Solar / Net-Billing', icon: Sun },
  ];

  const filteredSchemes =
    selectedCategory === 'ALL'
      ? TYPICAL_SCHEMES
      : TYPICAL_SCHEMES.filter((s) => s.category === selectedCategory);

  const activeScheme = TYPICAL_SCHEMES.find((s) => s.id === activePreviewId) || TYPICAL_SCHEMES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Biblioteca SEC RIC
                </span>
                <span className="text-xs text-slate-400">Carga en 1 Clic</span>
              </div>
              <h2 className="text-lg font-bold text-white">Esquemas Típicos Preconfigurados</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content: Split Master-Detail */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left: Scheme Cards List */}
          <div className="md:col-span-5 p-4 space-y-3 overflow-y-auto max-h-[60vh]">
            {filteredSchemes.map((scheme) => {
              const isSelected = scheme.id === activePreviewId;
              return (
                <div
                  key={scheme.id}
                  onClick={() => setActivePreviewId(scheme.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        scheme.isThreePhase
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          : 'bg-sky-950 text-sky-300 border border-sky-800/50'
                      }`}
                    >
                      {scheme.isThreePhase ? '380V Trifásico' : '220V Monofásico'}
                    </span>
                    <span className="text-xs font-extrabold text-cyan-400">
                      {(scheme.totalPowerWatts / 1000).toFixed(1)} kW • {scheme.empalmeAmps}A
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{scheme.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{scheme.tagline}</p>
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Preview of Active Scheme */}
          <div className="md:col-span-7 p-5 space-y-4 bg-slate-950/30 overflow-y-auto max-h-[60vh]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Detalle del Esquema Seleccionado
                </span>
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  ✓ Validado RIC SEC
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{activeScheme.name}</h3>
              <p className="text-xs text-slate-300">{activeScheme.description}</p>
            </div>

            {/* Quick Spec Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Suministro / IGA</span>
                <span className="font-bold text-white">
                  {activeScheme.igaSpec.poles}x{activeScheme.igaSpec.amps}A Curva {activeScheme.igaSpec.curve}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">DPS Sobretensión</span>
                <span className="font-bold text-cyan-300">
                  {activeScheme.dpsSpec.dischargeKa} kA ({activeScheme.dpsSpec.voltage})
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Alimentador</span>
                <span className="font-bold text-amber-300">
                  {activeScheme.feederWireSection} mm² EVA ({activeScheme.feederLength}m)
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Malla de Tierra</span>
                <span className="font-bold text-emerald-400">
                  {activeScheme.groundResistanceOhms} Ω (≤ 20Ω)
                </span>
              </div>
            </div>

            {/* Circuits Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Desglose de Circuitos ({activeScheme.circuits.length} Circuitos)</span>
              </h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3">Cód</th>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3">Potencia</th>
                      <th className="py-2 px-3">Disyuntor</th>
                      <th className="py-2 px-3">Conductor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 font-mono text-[11px]">
                    {activeScheme.circuits.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/40">
                        <td className="py-1.5 px-3 font-bold text-cyan-400">{c.code}</td>
                        <td className="py-1.5 px-3 font-sans text-slate-200">{c.name}</td>
                        <td className="py-1.5 px-3 text-white">{c.loadWatts} W</td>
                        <td className="py-1.5 px-3 text-amber-300">{c.breakerRating.split(' ')[0]}</td>
                        <td className="py-1.5 px-3 text-slate-400">{c.wireSection.split(' ')[0]} mm²</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Normative Badges */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cumplimiento Normativo SEC RIC:
              </span>
              {activeScheme.normativeNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSelectScheme(activeScheme);
              onClose();
            }}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Cargar Esquema "{activeScheme.name}"</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

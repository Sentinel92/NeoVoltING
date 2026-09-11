import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Box,
  HelpCircle,
  X,
  ArrowRight,
  Info,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ENVIRONMENT_IP_STANDARDS,
  IP_SOLID_DIGITS,
  IP_WATER_DIGITS,
  evaluatePointIpProtection,
  parseIpRating,
  EnvironmentIpStandard,
} from '../utils/ipProtectionEngine';
import { SectorType } from '../utils/technicalSurveyEngine';

interface IpProtectionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSector: SectorType;
  pointName?: string;
  initialIpCode?: string;
  onSelectIp: (ipCode: string, environmentStandardId?: string) => void;
}

export function IpProtectionSelectorModal({
  isOpen,
  onClose,
  currentSector,
  pointName = 'Punto de Terreno',
  initialIpCode = 'IP20',
  onSelectIp,
}: IpProtectionSelectorModalProps) {
  // Find default environment for sector
  const defaultEnv = ENVIRONMENT_IP_STANDARDS.find((s) => s.sector === currentSector) || ENVIRONMENT_IP_STANDARDS[0];
  const [selectedEnvId, setSelectedEnvId] = useState<string>(defaultEnv.id);

  // Current chosen digits
  const initialParsed = parseIpRating(initialIpCode);
  const [solidDigit, setSolidDigit] = useState<number>(initialParsed.solid);
  const [waterDigit, setWaterDigit] = useState<number>(initialParsed.water);

  if (!isOpen) return null;

  const currentIpCode = `IP${solidDigit}${waterDigit}`;
  const selectedEnv = ENVIRONMENT_IP_STANDARDS.find((s) => s.id === selectedEnvId) || defaultEnv;
  const evaluation = evaluatePointIpProtection(currentIpCode, currentSector, selectedEnvId);

  const handleApplyPreset = (env: EnvironmentIpStandard) => {
    setSelectedEnvId(env.id);
    const parsedRec = parseIpRating(env.recommendedIp);
    setSolidDigit(parsedRec.solid);
    setWaterDigit(parsedRec.water);
  };

  const handleConfirm = () => {
    onSelectIp(currentIpCode, selectedEnvId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Selector & Validador de Grado IP</h3>
                <span className="text-[10px] bg-cyan-900/80 text-cyan-200 border border-cyan-700 px-2 py-0.5 rounded-full font-bold">
                  IEC 60529 / SEC RIC N°10-11
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluación para: <strong className="text-slate-200">{pointName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* 1. PRESET ENVIRONMENT QUICK SELECTOR */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. Selecciona el Entorno o Zona de Exposición:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ENVIRONMENT_IP_STANDARDS.map((env) => {
                const isSelected = env.id === selectedEnvId;
                const isMatchingSector = env.sector === currentSector;
                return (
                  <button
                    key={env.id}
                    onClick={() => handleApplyPreset(env)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/50'
                        : isMatchingSector
                        ? 'bg-slate-950/70 border-slate-700 text-slate-300 hover:border-slate-600'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs truncate text-white">{env.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-cyan-300">
                        {env.recommendedIp}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 line-clamp-1 leading-snug">
                      {env.zoneDescription}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DUAL DIGIT SELECTOR (SOLIDS & LIQUIDS) */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-xs text-slate-200">
                2. Configuración Personalizada de Dígitos IP:
              </span>
              <span className="text-xl font-black font-mono tracking-widest text-cyan-400 bg-slate-900 px-3 py-1 rounded-xl border border-cyan-700/50">
                {currentIpCode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1st Digit: Solids */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" />
                  <span>1er Dígito: Protección contra Sólidos / Polvo (0 - 6)</span>
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => setSolidDigit(digit)}
                      className={`h-9 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition ${
                        solidDigit === digit
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-400'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <strong>Nivel {solidDigit}:</strong> {IP_SOLID_DIGITS[solidDigit]?.level} — {IP_SOLID_DIGITS[solidDigit]?.description}
                </p>
              </div>

              {/* 2nd Digit: Liquids */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>2do Dígito: Protección contra Agua / Humedad (0 - 8)</span>
                </label>
                <div className="grid grid-cols-9 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => setWaterDigit(digit)}
                      className={`h-9 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition ${
                        waterDigit === digit
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-black ring-1 ring-cyan-400'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <strong>Nivel {waterDigit}:</strong> {IP_WATER_DIGITS[waterDigit]?.level} — {IP_WATER_DIGITS[waterDigit]?.description}
                </p>
              </div>
            </div>
          </div>

          {/* 3. REAL-TIME EVALUATION & WARNING ALERT */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              evaluation.isSufficient
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                : evaluation.severity === 'CRITICO'
                ? 'bg-rose-950/50 border-rose-500 text-rose-200 shadow-lg shadow-rose-950/40'
                : 'bg-amber-950/50 border-amber-500 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {evaluation.isSufficient ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                )}
              </div>
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                    {evaluation.title}
                  </h4>
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                    {evaluation.ricRef}
                  </span>
                </div>
                <p className="text-[11.5px] leading-snug">
                  {evaluation.message}
                </p>
                {!evaluation.isSufficient && evaluation.actionRequired && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                    <span className="font-bold text-amber-300">Acción Requerida:</span> {evaluation.actionRequired}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="text-[11px] text-slate-400">
            Recomendado para la zona: <strong className="text-cyan-300">{selectedEnv.recommendedIp}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/50 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Grado {currentIpCode}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

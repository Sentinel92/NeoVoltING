import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Thermometer,
  ShieldAlert,
  Sliders,
  Eye,
  Info,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BoardThermalSummary,
  ComponentThermalData,
  ThermalPaletteType,
  getThermalColor,
} from '../utils/thermalSimulation';

interface BoardThermalHeatmapOverlayProps {
  summary: BoardThermalSummary;
  isActive: boolean;
  onToggleActive: () => void;
  ambientTemp: number;
  onAmbientTempChange: (val: number) => void;
  loadFactor: number;
  onLoadFactorChange: (val: number) => void;
  palette: ThermalPaletteType;
  onPaletteChange: (palette: ThermalPaletteType) => void;
  selectedHotspotId?: string | null;
  onSelectComponent?: (id: string) => void;
}

/**
 * SVG Elements to be rendered inside the SVG canvas under/over components
 */
export function SvgThermalHeatmapGlows({
  summary,
  palette,
  isEnergized,
}: {
  summary: BoardThermalSummary;
  palette: ThermalPaletteType;
  isEnergized: boolean;
}) {
  const componentsList = Object.values(summary.componentsData);

  return (
    <g className="thermal-heatmap-svg-layer transition-opacity duration-300">
      <defs>
        {/* Soft thermal blur for realistic infrared spread */}
        <filter id="thermalBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18" result="blur1" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="thermalWideBlur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="32" />
        </filter>

        {/* Dynamic radial gradients for each component */}
        {componentsList.map(comp => {
          const cCenter = comp.colorHex;
          const cMid = getThermalColor(Math.max(0, comp.heatRatio * 0.65), palette);
          return (
            <radialGradient
              key={`grad_${comp.compId}`}
              id={`thermalGrad_${comp.compId}`}
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor={cCenter} stopOpacity="0.85" />
              <stop offset="45%" stopColor={cMid} stopOpacity="0.6" />
              <stop offset="75%" stopColor={cMid} stopOpacity="0.3" />
              <stop offset="100%" stopColor={cCenter} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      {/* DIN RAIL HEAT DIFFUSION CORRIDOR (HORIZONTAL HEAT CONDUCTION) */}
      {isEnergized && (
        <g className="rail-thermal-corridor" opacity="0.45" filter="url(#thermalWideBlur)">
          {/* Top DIN Rail glow */}
          <rect
            x="40"
            y="170"
            width="800"
            height="140"
            rx="30"
            fill={getThermalColor(summary.maxTempCelsius > 55 ? 0.65 : 0.35, palette)}
          />
          {/* Bottom DIN Rail glow */}
          <rect
            x="40"
            y="350"
            width="800"
            height="140"
            rx="30"
            fill={getThermalColor(summary.maxTempCelsius > 55 ? 0.5 : 0.25, palette)}
          />
        </g>
      )}

      {/* INDIVIDUAL COMPONENT THERMAL HALOS */}
      {componentsList.map(comp => {
        const radiusMultiplier = comp.riskLevel === 'HOTSPOT_CRITICAL' ? 1.6 : 1.35;
        const width = comp.w * radiusMultiplier + 40;
        const height = comp.h * radiusMultiplier + 40;
        const x = comp.x - (width - comp.w) / 2;
        const y = comp.y - (height - comp.h) / 2;

        return (
          <g key={`halo_${comp.compId}`}>
            {/* Heat aura background */}
            <ellipse
              cx={comp.x + comp.w / 2}
              cy={comp.y + comp.h / 2}
              rx={width / 2}
              ry={height / 2}
              fill={`url(#thermalGrad_${comp.compId})`}
              filter="url(#thermalBlur)"
              opacity={isEnergized ? (comp.riskLevel === 'HOTSPOT_CRITICAL' ? 0.95 : 0.78) : 0.2}
              style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}
            />

            {/* Pulsing Hotspot rings if temperature is critical */}
            {comp.riskLevel === 'HOTSPOT_CRITICAL' && isEnergized && (
              <g transform={`translate(${comp.x + comp.w / 2}, ${comp.y + comp.h / 2})`}>
                <circle
                  cx={0}
                  cy={0}
                  r={Math.max(comp.w, comp.h) * 0.6}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="animate-ping"
                  opacity="0.8"
                />
                <circle
                  cx={0}
                  cy={0}
                  r={Math.max(comp.w, comp.h) * 0.75}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  className="animate-pulse"
                  opacity="0.6"
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Component-level Thermal Labels and Badges rendered directly on SVG devices
 */
export function SvgThermalComponentBadges({
  summary,
  isEnergized,
}: {
  summary: BoardThermalSummary;
  isEnergized: boolean;
}) {
  const componentsList = Object.values(summary.componentsData);

  return (
    <g className="thermal-badges-layer" style={{ pointerEvents: 'none' }}>
      {componentsList.map(comp => {
        const isCritical = comp.riskLevel === 'HOTSPOT_CRITICAL';
        const isWarning = comp.riskLevel === 'WARNING';

        return (
          <g key={`badge_${comp.compId}`} transform={`translate(${comp.x}, ${comp.y})`}>
            {/* Top Thermal Header Ribbon */}
            <g transform={`translate(${comp.w / 2}, -11)`}>
              <rect
                x={-34}
                y={-8}
                width={68}
                height={16}
                rx={4}
                fill={isCritical ? '#7f1d1d' : isWarning ? '#78350f' : '#042f2e'}
                stroke={isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#14b8a6'}
                strokeWidth={isCritical ? 1.5 : 1}
                className={isCritical ? 'animate-pulse' : ''}
              />
              <text
                x={0}
                y={3.5}
                textAnchor="middle"
                fill={isCritical ? '#fecaca' : isWarning ? '#fef08a' : '#ccfbf1'}
                fontSize="8"
                fontWeight="900"
                fontFamily="monospace"
              >
                {isEnergized ? `🔥 ${comp.temperatureCelsius}°C` : `❄️ ${comp.temperatureCelsius}°C`}
              </text>
            </g>

            {/* Bottom Thermal Wattage / Load Pill */}
            {isEnergized && comp.powerLossWatts > 0 && (
              <g transform={`translate(${comp.w / 2}, ${comp.h + 10})`}>
                <rect
                  x={-28}
                  y={-7}
                  width={56}
                  height={14}
                  rx={3}
                  fill="#020617"
                  stroke="#334155"
                  strokeWidth={0.8}
                />
                <text
                  x={0}
                  y={3}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="7"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {comp.powerLossWatts}W • {comp.loadPercentage}%
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Floating Thermal Dashboard HUD with controls & metrics
 */
export function BoardThermalHeatmapOverlay({
  summary,
  isActive,
  onToggleActive,
  ambientTemp,
  onAmbientTempChange,
  loadFactor,
  onLoadFactorChange,
  palette,
  onPaletteChange,
  onSelectComponent,
}: BoardThermalHeatmapOverlayProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  if (!isActive) return null;

  return (
    <>
      {/* FLOATING THERMAL CONTROL PANEL & HUD (BOTTOM-RIGHT) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="absolute bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-xl border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans"
      >
        {/* PANEL HEADER */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/80 px-4 py-3 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs uppercase tracking-wider text-amber-200">
                  Mapa de Calor Térmico
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                  IEC 60890
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Disipación Joule y Puntos Calientes (RIC N°02)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-lg transition"
              title="Guía técnica sobre cálculo térmico de tableros (RIC N°02)"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE BODY */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 space-y-3.5"
            >
              {/* METRIC SUMMARY CARDS */}
              <div className="grid grid-cols-3 gap-2">
                {/* Max Temp */}
                <div
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    summary.maxTempCelsius >= 65
                      ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                      : summary.maxTempCelsius >= 50
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                      : 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                  }`}
                  onClick={() => {
                    if (summary.hotspotCompId && onSelectComponent) {
                      onSelectComponent(summary.hotspotCompId);
                    }
                  }}
                  title={
                    summary.hotspotCompName
                      ? `Hotspot en: ${summary.hotspotCompName} (Click para seleccionar)`
                      : undefined
                  }
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    <span>Pico Máx</span>
                  </div>
                  <div className="text-lg font-black font-mono tracking-tight mt-0.5">
                    {summary.maxTempCelsius}°C
                  </div>
                  <div className="text-[9px] truncate font-medium mt-0.5 text-slate-300">
                    {summary.hotspotCompName || 'Normal'}
                  </div>
                </div>

                {/* Total Joule Dissipation */}
                <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Pérdidas</span>
                  </div>
                  <div className="text-lg font-black font-mono tracking-tight mt-0.5 text-amber-300">
                    {summary.totalLossWatts} W
                  </div>
                  <div className="text-[9px] font-medium text-slate-400 mt-0.5">
                    Joule Total
                  </div>
                </div>

                {/* Enclosure Air Temp */}
                <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>Aire Gabinete</span>
                  </div>
                  <div className="text-lg font-black font-mono tracking-tight mt-0.5 text-cyan-300">
                    {summary.enclosureAirTempCelsius}°C
                  </div>
                  <div className="text-[9px] font-medium text-slate-400 mt-0.5">
                    ΔT +{(summary.enclosureAirTempCelsius - ambientTemp).toFixed(1)}°C
                  </div>
                </div>
              </div>

              {/* COMPLIANCE STATUS BAR */}
              <div
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                  summary.overallThermalRisk === 'CRITICAL'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                    : summary.overallThermalRisk === 'ATTENTION'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                    : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                }`}
              >
                <ShieldAlert
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    summary.overallThermalRisk === 'CRITICAL'
                      ? 'text-rose-400 animate-bounce'
                      : summary.overallThermalRisk === 'ATTENTION'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold block">
                    {summary.overallThermalRisk === 'CRITICAL'
                      ? '⚠️ Alerta por Concentración Térmica'
                      : summary.overallThermalRisk === 'ATTENTION'
                      ? '⚡ Advertencia de Elevación de Temperatura'
                      : '✓ Estado Térmico Seguro (RIC N°02)'}
                  </span>
                  <span className="text-slate-300 text-[10.5px] mt-0.5 block">
                    {summary.complianceNote}
                  </span>
                </div>
              </div>

              {/* THERMAL PALETTE IRONBOW COLOR SCALE BAR */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Escala Termográfica ({palette === 'ironbow' ? 'FLIR Ironbow' : palette === 'rainbow' ? 'Rainbow' : 'White Hot'})</span>
                  <span className="font-mono text-slate-300">
                    {summary.ambientTempCelsius}°C → 75°C+
                  </span>
                </div>
                <div
                  className="h-3.5 rounded-lg w-full border border-slate-700 shadow-inner"
                  style={{
                    background:
                      palette === 'ironbow'
                        ? 'linear-gradient(to right, #0f172a, #1e3a8a, #7c3aed, #e11d48, #f97316, #fde047, #ffffff)'
                        : palette === 'rainbow'
                        ? 'linear-gradient(to right, #1e1b4b, #06b6d4, #22c55e, #facc15, #ef4444, #f43f5e)'
                        : 'linear-gradient(to right, #18181b, #52525b, #a1a1aa, #f4f4f5, #ffffff)',
                  }}
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>{summary.ambientTempCelsius}°C (Ambiente)</span>
                  <span>45°C</span>
                  <span>60°C (Atención)</span>
                  <span>75°C+ (Crítico)</span>
                </div>
              </div>

              {/* SIMULATION SLIDERS & CONFIG */}
              <div className="space-y-2.5 pt-1 border-t border-slate-800">
                {/* Ambient Temperature Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-cyan-400" />
                      Temperatura Ambiente (Chile)
                    </span>
                    <span className="font-mono text-cyan-300">{ambientTemp}°C</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="45"
                    step="1"
                    value={ambientTemp}
                    onChange={e => onAmbientTempChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[8.5px] text-slate-500 font-mono mt-0.5">
                    <span>15°C (Invierno)</span>
                    <span>25°C (Norma SEC)</span>
                    <span>40°C (Verano Extremo)</span>
                  </div>
                </div>

                {/* Simultaneous Load Factor Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-amber-400" />
                      Factor de Carga / Demanda
                    </span>
                    <span className="font-mono text-amber-300">
                      {Math.round(loadFactor * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={loadFactor}
                    onChange={e => onLoadFactorChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[8.5px] text-slate-500 font-mono mt-0.5">
                    <span>30% (Reposo)</span>
                    <span>85% (Régimen Pleno)</span>
                    <span>140% (Sobrecarga)</span>
                  </div>
                </div>

                {/* Palette Selector */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Paleta Térmica:</span>
                  <div className="flex gap-1">
                    {(['ironbow', 'rainbow', 'white_hot'] as ThermalPaletteType[]).map(p => (
                      <button
                        key={p}
                        onClick={() => onPaletteChange(p)}
                        className={`px-2 py-1 text-[9.5px] font-bold rounded-lg transition capitalize ${
                          palette === p
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {p === 'ironbow' ? 'FLIR' : p === 'rainbow' ? 'Arcoíris' : 'White Hot'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* TECHNICAL THERMAL GUIDE MODAL (RIC N°02 & IEC 60890) */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <Flame className="w-5 h-5" />
                  <span>Guía Térmica de Tableros Eléctricos (RIC N°02 / IEC 60890)</span>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-3 leading-relaxed text-slate-300 max-h-[65vh] overflow-y-auto pr-1">
                <p>
                  El <strong>Mapa de Calor Térmico</strong> calcula la concentración calórica generada por el <strong>Efecto Joule ($P = I^2 \cdot R$)</strong> en cada interruptor automático, diferencial y barra de distribución.
                </p>

                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-1">
                  <span className="font-bold text-amber-300 text-[11px] block">
                    📌 Exigencia Normativa SEC (RIC N°02 Art. 5):
                  </span>
                  <p className="text-[11px] text-amber-200/90">
                    Los interruptores termomagnéticos basan su disparo por sobrecarga en un bimetal térmico calibrado a <strong>30°C o 40°C</strong> de referencia. Si varios automáticos contiguos operan a plena carga, el calor acumulado provoca un disparo térmico prematuro (de-rating térmico), reduciendo la capacidad efectiva de los circuitos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-400 block mb-1">
                      🌡️ Temperatura &lt; 50°C (Óptimo)
                    </span>
                    <p className="text-slate-400">
                      Disipación normal, bornes con apriete correcto, holgura térmica suficiente en el riel DIN.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-rose-400 block mb-1">
                      🔥 Temperatura &gt; 65°C (Punto Caliente)
                    </span>
                    <p className="text-slate-400">
                      Riesgo de envejecimiento del aislamiento de conductores PVC/EVA y disparos intempestivos. Requiere separadores DIN o mayor sección.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  <em>Fórmula IEC 60890:</em> El cálculo considera la resistencia térmica de contacto en bornes, la potencia nominal disipada por polo y la convección del aire interior del gabinete.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

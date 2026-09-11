import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Zap,
  Layers,
  Home,
  Sparkles,
  Sun,
  Tv,
  Wrench,
  HelpCircle,
  Eye,
  Droplets,
  ShieldCheck,
} from 'lucide-react';
import { IpProtectionSelectorModal } from './IpProtectionSelectorModal';
import { evaluatePointIpProtection } from '../utils/ipProtectionEngine';
import {
  SurveyPointRecord,
  SectorType,
  WireType,
  WireGauge,
  WireCondition,
  BreakerType,
  BreakerRating,
  RcdPresence,
  GroundPresence,
  ConduitType,
  VisualBoxCondition,
  SECTOR_METADATA,
  evaluatePointNormativeRIC,
} from '../utils/technicalSurveyEngine';

interface FieldSurveyPointsManagerProps {
  points: SurveyPointRecord[];
  onAddPoint: (point: SurveyPointRecord) => void;
  onUpdatePoint: (point: SurveyPointRecord) => void;
  onDeletePoint: (pointId: string) => void;
  onLoadPresetPoints: () => void;
}

export function FieldSurveyPointsManager({
  points,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onLoadPresetPoints,
}: FieldSurveyPointsManagerProps) {
  const [selectedSector, setSelectedSector] = useState<SectorType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingPoint, setEditingPoint] = useState<SurveyPointRecord | null>(null);

  // Form State for Add / Edit Point
  const [formName, setFormName] = useState('Circuito Enchufes Mesón Cocina');
  const [formSector, setFormSector] = useState<SectorType>('cocina_logia');
  const [formPointType, setFormPointType] = useState<SurveyPointRecord['pointType']>('enchufe_fuerza');
  const [formWireType, setFormWireType] = useState<WireType>('eva_libre_halogeno');
  const [formWireGauge, setFormWireGauge] = useState<WireGauge>('2.5');
  const [formWireCondition, setFormWireCondition] = useState<WireCondition>('bueno_normado');
  const [formWireColorCoded, setFormWireColorCoded] = useState<boolean>(true);
  const [formBreakerType, setFormBreakerType] = useState<BreakerType>('curva_c_6ka');
  const [formBreakerRating, setFormBreakerRating] = useState<BreakerRating>('16A');
  const [formRcdStatus, setFormRcdStatus] = useState<RcdPresence>('presente_30ma_tipo_a');
  const [formGroundStatus, setFormGroundStatus] = useState<GroundPresence>('presente_pe_continuo');
  const [formConduitType, setFormConduitType] = useState<ConduitType>('conduit_pvc_embutido');
  const [formBoxCondition, setFormBoxCondition] = useState<VisualBoxCondition>('buena_estanca');
  const [formIpRating, setFormIpRating] = useState<string>('IP20');
  const [formIpEnv, setFormIpEnv] = useState<string>('indoor_dry');
  const [formVoltage, setFormVoltage] = useState<number>(220);
  const [formNotes, setFormNotes] = useState<string>('');

  // IP Selector Modal State
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [ipModalTargetPoint, setIpModalTargetPoint] = useState<{ id?: string; name: string; sector: SectorType; currentIp: string } | null>(null);

  const openAddModal = (sectorPreset?: SectorType) => {
    setEditingPoint(null);
    const sec = sectorPreset || 'tablero_principal';
    setFormName(sectorPreset ? `${SECTOR_METADATA[sectorPreset].defaultPoints[0] || 'Nuevo Punto'}` : 'Punto de Instalación');
    setFormSector(sec);
    setFormPointType('enchufe_fuerza');
    setFormWireType('eva_libre_halogeno');
    setFormWireGauge('2.5');
    setFormWireCondition('bueno_normado');
    setFormWireColorCoded(true);
    setFormBreakerType('curva_c_6ka');
    setFormBreakerRating('16A');
    setFormRcdStatus('presente_30ma_tipo_a');
    setFormGroundStatus('presente_pe_continuo');
    setFormConduitType('conduit_pvc_embutido');
    setFormBoxCondition('buena_estanca');
    setFormIpRating(sec === 'exterior_patio' ? 'IP55' : sec === 'banos' ? 'IP44' : 'IP20');
    setFormIpEnv(sec === 'exterior_patio' ? 'outdoor_exposed' : sec === 'banos' ? 'bathroom_zone2' : 'indoor_dry');
    setFormVoltage(220);
    setFormNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (p: SurveyPointRecord) => {
    setEditingPoint(p);
    setFormName(p.name);
    setFormSector(p.sector);
    setFormPointType(p.pointType);
    setFormWireType(p.wireType);
    setFormWireGauge(p.wireGaugeMm2);
    setFormWireCondition(p.wireCondition);
    setFormWireColorCoded(p.wireColorCoded);
    setFormBreakerType(p.breakerType);
    setFormBreakerRating(p.breakerRating);
    setFormRcdStatus(p.rcdStatus);
    setFormGroundStatus(p.groundStatus);
    setFormConduitType(p.conduitType);
    setFormBoxCondition(p.boxCondition);
    setFormIpRating(p.ipRating || (p.sector === 'exterior_patio' ? 'IP55' : p.sector === 'banos' ? 'IP44' : 'IP20'));
    setFormIpEnv(p.ipEnvironment || 'indoor_dry');
    setFormVoltage(p.measuredVoltageV || 220);
    setFormNotes(p.notes || '');
    setShowAddModal(true);
  };

  const handleOpenIpModalForForm = () => {
    setIpModalTargetPoint({
      name: formName,
      sector: formSector,
      currentIp: formIpRating,
    });
    setIsIpModalOpen(true);
  };

  const handleOpenIpModalForExistingPoint = (p: SurveyPointRecord) => {
    setIpModalTargetPoint({
      id: p.id,
      name: p.name,
      sector: p.sector,
      currentIp: p.ipRating || 'IP20',
    });
    setIsIpModalOpen(true);
  };

  const handleApplyIpSelection = (ipCode: string, envId?: string) => {
    if (ipModalTargetPoint?.id) {
      // Update existing point directly
      const pt = points.find((p) => p.id === ipModalTargetPoint.id);
      if (pt) {
        onUpdatePoint({
          ...pt,
          ipRating: ipCode,
          ipEnvironment: envId,
        });
      }
    } else {
      // Update modal form
      setFormIpRating(ipCode);
      if (envId) setFormIpEnv(envId);
    }
  };

  const handleSavePoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const pointRecord: SurveyPointRecord = {
      id: editingPoint ? editingPoint.id : `survey_pt_${Date.now()}`,
      name: formName.trim(),
      sector: formSector,
      pointType: formPointType,
      wireType: formWireType,
      wireGaugeMm2: formWireGauge,
      wireCondition: formWireCondition,
      wireColorCoded: formWireColorCoded,
      breakerType: formBreakerType,
      breakerRating: formBreakerRating,
      rcdStatus: formRcdStatus,
      groundStatus: formGroundStatus,
      conduitType: formConduitType,
      boxCondition: formBoxCondition,
      ipRating: formIpRating,
      ipEnvironment: formIpEnv,
      measuredVoltageV: formVoltage,
      notes: formNotes.trim(),
    };

    if (editingPoint) {
      onUpdatePoint(pointRecord);
    } else {
      onAddPoint(pointRecord);
    }

    setShowAddModal(false);
  };

  const filteredPoints = selectedSector === 'all'
    ? points
    : points.filter((p) => p.sector === selectedSector);

  const sectorCounts = Object.keys(SECTOR_METADATA).reduce((acc, secKey) => {
    acc[secKey] = points.filter((p) => p.sector === secKey).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Top Bar Actions & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedSector === 'all'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Todos ({points.length})
          </button>
          {(Object.keys(SECTOR_METADATA) as SectorType[]).map((sec) => {
            const count = sectorCounts[sec] || 0;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  selectedSector === sec
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{SECTOR_METADATA[sec].label.split(' ')[0]}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 text-fuchsia-300 font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {points.length === 0 && (
            <button
              onClick={onLoadPresetPoints}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              Cargar Censo de Ejemplo
            </button>
          )}
          <button
            onClick={() => openAddModal(selectedSector !== 'all' ? selectedSector : undefined)}
            className="px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Punto / Circuito</span>
          </button>
        </div>
      </div>

      {/* Grid of Surveyed Points Cards */}
      {filteredPoints.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No hay puntos censados en este sector</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Registra los circuitos del tablero, enchufes y centros auditados para que el motor RIC analice automáticamente su estado de conformidad.
          </p>
          <button
            onClick={() => openAddModal(selectedSector !== 'all' ? selectedSector : undefined)}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Primer Punto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPoints.map((pt) => {
            const anomalies = evaluatePointNormativeRIC(pt);
            const hasCritical = anomalies.some((a) => a.severity === 'CRITICO');
            const hasMajor = anomalies.some((a) => a.severity === 'MAYOR');

            return (
              <div
                key={pt.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  hasCritical
                    ? 'bg-rose-950/30 border-rose-500/60 hover:border-rose-400'
                    : hasMajor
                    ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar with Sector & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {SECTOR_METADATA[pt.sector]?.label.split(' ')[0]}
                    </span>
                    {anomalies.length > 0 ? (
                      <span
                        className={`text-[9.5px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 ${
                          hasCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>{anomalies.length} {anomalies.length === 1 ? 'Falla RIC' : 'Fallas RIC'}</span>
                      </span>
                    ) : (
                      <span className="text-[9.5px] px-2 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Conforme SEC</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 leading-snug">{pt.name}</h4>

                  {/* Technical Attributes Pills */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-3 font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[9px] block text-slate-400 font-sans">Conductor & Calibre:</span>
                      <span className="font-bold text-slate-200">
                        {pt.wireGaugeMm2} mm² {pt.wireType === 'eva_libre_halogeno' ? 'EVA' : pt.wireType.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[9px] block text-slate-400 font-sans">Protección Automática:</span>
                      <span className="font-bold text-amber-300">{pt.breakerRating} ({pt.breakerType.split('_')[0].toUpperCase()})</span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[9px] block text-slate-400 font-sans">Diferencial (RCD):</span>
                      <span
                        className={`font-bold ${
                          pt.rcdStatus.includes('presente') ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pt.rcdStatus.includes('presente') ? '✓ 30mA Presente' : '❌ Ausente/Falla'}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[9px] block text-slate-400 font-sans">Puesta a Tierra (PE):</span>
                      <span
                        className={`font-bold ${
                          pt.groundStatus === 'presente_pe_continuo'
                            ? 'text-emerald-400'
                            : pt.groundStatus === 'puente_tierra_neutro_prohibido'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {pt.groundStatus === 'presente_pe_continuo'
                          ? '✓ Conforme (PE)'
                          : pt.groundStatus === 'puente_tierra_neutro_prohibido'
                          ? '❌ Puente Ilegal'
                          : '⚠️ Sin Conexión'}
                      </span>
                    </div>

                    {/* IP Protection Metric */}
                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] block text-slate-400 font-sans">Grado IP Envolvente (IEC 60529):</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/50">
                            {pt.ipRating || 'IP20'}
                          </span>
                          {(() => {
                            const ipEval = evaluatePointIpProtection(pt.ipRating || 'IP20', pt.sector, pt.ipEnvironment);
                            if (!ipEval.isSufficient) {
                              return (
                                <span className="text-[9.5px] font-bold text-rose-300 bg-rose-950/80 border border-rose-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                                  <span>Insuficiente ({ipEval.minRequiredIp} mín)</span>
                                </span>
                              );
                            }
                            return (
                              <span className="text-[9.5px] font-bold text-emerald-400 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Apto Entorno</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenIpModalForExistingPoint(pt)}
                        className="text-[10px] bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg font-bold transition flex items-center gap-1"
                        title="Seleccionar grado IP según entorno"
                      >
                        <Droplets className="w-3 h-3 text-cyan-400" />
                        <span>Ajustar IP</span>
                      </button>
                    </div>
                  </div>

                  {pt.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 mb-2">
                      "{pt.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Voltaje: <strong className="text-slate-300">{pt.measuredVoltageV || 220}V</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(pt)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDeletePoint(pt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      title="Eliminar punto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT SURVEY POINT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-600/20 text-fuchsia-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPoint ? 'Editar Punto Auditado' : 'Registrar Punto de Terreno'}
                  </h3>
                  <p className="text-xs text-slate-400">Captura de condiciones eléctricas reales y protecciones</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePoint} className="space-y-4">
              {/* Row 1: Name and Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nombre / Identificación del Punto</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Ej: Enchufe Horno Eléctrico Cocina"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-fuchsia-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Sector / Ubicación</label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value as SectorType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-fuchsia-500 focus:outline-none"
                  >
                    {(Object.keys(SECTOR_METADATA) as SectorType[]).map((sec) => (
                      <option key={sec} value={sec}>
                        {SECTOR_METADATA[sec].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Conductores (Calibre, Tipo, Condición, Código Colores) */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  1. Estado del Alambrado & Conductores (RIC N°04)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Calibre Conductor</label>
                    <select
                      value={formWireGauge}
                      onChange={(e) => setFormWireGauge(e.target.value as WireGauge)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="1.5">1.5 mm² (Alumbrado)</option>
                      <option value="2.5">2.5 mm² (Enchufes)</option>
                      <option value="4.0">4.0 mm² (Fuerza Media)</option>
                      <option value="6.0">6.0 mm² (Alimentador)</option>
                      <option value="10.0">10.0 mm² (Acometida)</option>
                      <option value="antiguo_desconocido">Desconocido / Antiguo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Tipo de Cable</label>
                    <select
                      value={formWireType}
                      onChange={(e) => setFormWireType(e.target.value as WireType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="eva_libre_halogeno">EVA (H07Z1-K) Normado</option>
                      <option value="h07v_k">H07V-K / THHN</option>
                      <option value="nylon_thhn">NYA / THHN Flexible</option>
                      <option value="alambre_antiguo_nyya">Alambre Antiguo NYYA</option>
                      <option value="cordon_paralelo_taller">Cordón Taller Paralelo (Prohibido)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Estado de Aislamiento</label>
                    <select
                      value={formWireCondition}
                      onChange={(e) => setFormWireCondition(e.target.value as WireCondition)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="bueno_normado">Bueno / Flexible</option>
                      <option value="envejecido_reseco">Envejecido / Cristalizado</option>
                      <option value="sin_codigo_colores">Sin Código de Colores</option>
                      <option value="empalme_defectuoso">Empalmes con Huincha Reseca</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formWireColorCoded}
                        onChange={(e) => setFormWireColorCoded(e.target.checked)}
                        className="w-4 h-4 rounded text-fuchsia-600 bg-slate-900 border-slate-700"
                      />
                      <span>Respeta Colores SEC</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 3: Protecciones Eléctricas (MCB, RCD, Tierra) */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  2. Protecciones & Puesta a Tierra (RIC N°02, N°05, N°06)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Disyuntor Termomagnético</label>
                    <div className="flex gap-1.5">
                      <select
                        value={formBreakerRating}
                        onChange={(e) => setFormBreakerRating(e.target.value as BreakerRating)}
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="10A">1x10A</option>
                        <option value="16A">1x16A</option>
                        <option value="20A">1x20A</option>
                        <option value="25A">1x25A</option>
                        <option value="32A">1x32A</option>
                        <option value="40A">1x40A</option>
                      </select>
                      <select
                        value={formBreakerType}
                        onChange={(e) => setFormBreakerType(e.target.value as BreakerType)}
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="curva_c_6ka">Curva C 6kA</option>
                        <option value="curva_c_4_5ka">Curva C 4.5kA</option>
                        <option value="antiguo_tapon_fusible">Tapón Fusible</option>
                        <option value="antiguo_1_5ka_domestico">Antiguo 1.5kA</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Protector Diferencial (RCD)</label>
                    <select
                      value={formRcdStatus}
                      onChange={(e) => setFormRcdStatus(e.target.value as RcdPresence)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="presente_30ma_tipo_a">Presente 30mA Clase A</option>
                      <option value="presente_30ma_tipo_ac">Presente 30mA Clase AC</option>
                      <option value="ausente_sin_diferencial">❌ Ausente (Sin RCD)</option>
                      <option value="averiado_no_dispara">⚠️ Averiado / No Dispara</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Tierra de Protección (PE)</label>
                    <select
                      value={formGroundStatus}
                      onChange={(e) => setFormGroundStatus(e.target.value as GroundPresence)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="presente_pe_continuo">✓ Presente & Continua (PE)</option>
                      <option value="ausente_sin_tierra">❌ Ausente (Sin Tierra)</option>
                      <option value="puente_tierra_neutro_prohibido">⚠️ Puente Prohibido Neutro-Tierra</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 4: Canalización, Cajas & Grado IP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Canalización</label>
                  <select
                    value={formConduitType}
                    onChange={(e) => setFormConduitType(e.target.value as ConduitType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="conduit_pvc_embutido">Conduit PVC Embutido</option>
                    <option value="conduit_pvc_a la vista">Conduit PVC a la vista</option>
                    <option value="canaleta_pvc">Canaleta PVC Sobrepuesta</option>
                    <option value="cable_a_la_vista_sin_tubo">❌ Cable a la vista (Sin Tubo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Estado Caja / Enchufe</label>
                  <select
                    value={formBoxCondition}
                    onChange={(e) => setFormBoxCondition(e.target.value as VisualBoxCondition)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="buena_estanca">Buena / Con Tapa</option>
                    <option value="sin_tapa">Sin Tapa Ciega</option>
                    <option value="caja_quebrada_abierta">Caja Quebrada / Abierta</option>
                    <option value="humedad_oxido">Humedad / Óxido</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Grado IP Envolvente</label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-cyan-300">
                      {formIpRating}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenIpModalForForm}
                      className="flex-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Validar IP</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Voltaje Medido en Bornes (V)</label>
                <input
                  type="number"
                  value={formVoltage}
                  onChange={(e) => setFormVoltage(parseFloat(e.target.value) || 220)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Observaciones Visuales de Terreno</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre deterioro, bornes sueltos, empalmes con cinta o ubicación específica..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-fuchsia-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
                >
                  {editingPoint ? 'Guardar Cambios' : 'Registrar Punto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IP RATING SELECTOR MODAL */}
      {isIpModalOpen && ipModalTargetPoint && (
        <IpProtectionSelectorModal
          isOpen={isIpModalOpen}
          onClose={() => setIsIpModalOpen(false)}
          currentSector={ipModalTargetPoint.sector}
          pointName={ipModalTargetPoint.name}
          initialIpCode={ipModalTargetPoint.currentIp}
          onSelectIp={handleApplyIpSelection}
        />
      )}
    </div>
  );
}

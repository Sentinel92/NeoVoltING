import React, { useState } from 'react';
import { RoomData, HighAppliance } from '../types';
import { FileUp, Sparkles, Check, X, Building2, Upload, AlertCircle, Scan, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface PlanScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlanToCensus: (extractedRooms: RoomData[], extractedAppliances: HighAppliance[]) => void;
}

export const PlanScannerModal: React.FC<PlanScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyPlanToCensus,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [planType, setPlanType] = useState('Plano Residencial Casa/Depto');
  const [planNotes, setPlanNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [extractedData, setExtractedData] = useState<{
    detectedSurfaceM2: number;
    summary: string;
    recommendedCircuitsCount: number;
    rooms: RoomData[];
    highAppliances: HighAppliance[];
  } | null>(null);

  if (!isOpen) return null;

  const sampleBlueprints = [
    {
      title: 'Plano Casa Residencial 75m²',
      desc: '3 Dormitorios, 2 Baños, Cocina, Estar y Logia con Clima.',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
      type: 'Casa 75m²',
    },
    {
      title: 'Plano Departamento 48m²',
      desc: '2 Dormitorios, 1 Baño, Cocina Americana con encimera.',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
      type: 'Depto 48m²',
    },
    {
      title: 'Plano Local Comercial / Oficina 110m²',
      desc: 'Planta libre, 2 Baños, Kichenette y Sala de Racks.',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
      type: 'Comercial 110m²',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: typeof sampleBlueprints[0]) => {
    setSelectedFile(null);
    setPreviewUrl(sample.url);
    setPlanType(sample.type);
    setPlanNotes(sample.desc);
  };

  const handleAnalyzePlan = async () => {
    setLoading(true);
    setExtractedData(null);

    try {
      let imageBase64 = previewUrl;
      // If sample URL, fetch base64 or pass as reference
      if (previewUrl && !previewUrl.startsWith('data:')) {
        // Simple base64 fallback or handle directly
      }

      const res = await fetch('/api/analyze-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          planType,
          planNotes,
        }),
      });

      const data = await res.json();
      if (data.planData) {
        // Map data into RoomData format
        const rooms: RoomData[] = data.planData.rooms.map((r: any, idx: number) => ({
          id: `room_plan_${Date.now()}_${idx}`,
          name: r.roomName || `Recinto ${idx + 1}`,
          surfaceM2: r.surfaceM2 || 12,
          lightPoints: r.lightPoints || 2,
          socketPoints: r.socketPoints || 4,
          devices: r.devices || [],
        }));

        const highAppliances: HighAppliance[] = (data.planData.highAppliances || []).map(
          (h: any, idx: number) => ({
            id: `app_plan_${Date.now()}_${idx}`,
            name: h.name || 'Carga Dedicada',
            powerWatts: h.powerWatts || 2000,
            isDedicatedCircuit: h.isDedicatedCircuit ?? true,
          })
        );

        setExtractedData({
          detectedSurfaceM2: data.planData.detectedSurfaceM2 || 75,
          summary: data.planData.summary || 'Escaneo de plano procesado.',
          recommendedCircuitsCount: data.planData.recommendedCircuitsCount || 4,
          rooms,
          highAppliances,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCensus = () => {
    if (!extractedData) return;
    onApplyPlanToCensus(extractedData.rooms, extractedData.highAppliances);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn my-auto max-h-[90vh] flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-xl">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Escáner & Carga de Planos Arquitectónicos IA</h3>
              <p className="text-xs text-slate-400">
                Sube la foto o plano de tu proyecto para calcular automáticamente recintos, puntos de luz, enchufes y tableros.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Preset Blueprint Samples */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Planas de Ejemplo o Carga Directa de Archivo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleBlueprints.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-1 ${
                    previewUrl === s.url
                      ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-200">{s.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-fuchsia-500/80 bg-slate-950/60 rounded-2xl p-4 text-center cursor-pointer transition-all relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Vista previa del plano"
                  className="max-h-40 mx-auto rounded-xl object-cover border border-slate-800"
                />
                <span className="text-xs text-fuchsia-400 font-bold block">
                  {selectedFile ? selectedFile.name : 'Plano Seleccionado'} (Clic para cambiar)
                </span>
              </div>
            ) : (
              <div className="py-4 space-y-2">
                <FileUp className="w-8 h-8 text-fuchsia-400 mx-auto" />
                <div className="text-xs font-bold text-white">Haz clic o arrastra aquí la foto/plano de la obra</div>
                <div className="text-[10px] text-slate-400">Soporta imágenes JPG, PNG o esquemas en PDF</div>
              </div>
            )}
          </div>

          {/* Options Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Tipo de Propiedad / Destino:</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
              >
                <option value="Plano Residencial Casa/Depto">Plano Residencial Casa / Depto</option>
                <option value="Plano Local Comercial / Tienda">Plano Local Comercial / Tienda</option>
                <option value="Plano Oficina / Edificio">Plano Oficina / Edificio</option>
                <option value="Plano Galpón / Bodega Industrial">Plano Galpón Industrial</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Notas de Lectura:</label>
              <input
                type="text"
                placeholder="Ej: Incluir cargas de aire acondicionado en dormitorios"
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          {/* Analyze Trigger */}
          <button
            type="button"
            onClick={handleAnalyzePlan}
            disabled={loading || !previewUrl}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>Escaneando plano con IA Gemini y extrayendo cubicación SEC...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Escanear Plano & Calcular Levantamiento Automático</span>
              </>
            )}
          </button>

          {/* Results Preview */}
          {extractedData && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Resultado del Escaneo Automático del Plano:</span>
                </span>
                <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded font-mono font-bold">
                  {extractedData.detectedSurfaceM2} m² Detectados
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{extractedData.summary}</p>

              {/* Rooms List Preview */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Recintos Identificados ({extractedData.rooms.length}):</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {extractedData.rooms.map((r, i) => (
                    <div key={i} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{r.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {r.lightPoints} Luces • {r.socketPoints} Enchufes
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">{r.surfaceM2} m²</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heavy loads */}
              {extractedData.highAppliances.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-amber-400 uppercase">Cargas Especiales Detectadas:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.highAppliances.map((h, i) => (
                      <span key={i} className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        {h.name} ({h.powerWatts}W)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

          {extractedData && (
            <button
              type="button"
              onClick={handleApplyToCensus}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Importar Cargas al Levantamiento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

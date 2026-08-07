import React, { useState, useRef } from 'react';
import { UserSession } from '../types';
import {
  Wrench,
  AlertTriangle,
  Sparkles,
  Send,
  Copy,
  Check,
  Cpu,
  HelpCircle,
  Share2,
  User,
  Key,
  LogIn,
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileCode2,
  ShieldCheck,
  RefreshCw,
  Mic,
  MicOff,
  Save,
} from 'lucide-react';
import Markdown from 'react-markdown';

interface AiDiagnosticConsultantTabProps {
  isSecCertified?: boolean;
  currentUser?: UserSession;
  onUpdateUserSession?: (updated: UserSession) => void;
}

export const AiDiagnosticConsultantTab: React.FC<AiDiagnosticConsultantTabProps> = ({
  isSecCertified = true,
  currentUser = {
    email: 'ineovolt@gmail.com',
    name: 'Instalador NEOVOLT',
    secNumber: 'SEC-84291-CL',
    isLoggedIn: true,
    role: 'engineer',
    customGeminiApiKey: undefined,
  },
  onUpdateUserSession,
}) => {
  const [faultDescription, setFaultDescription] = useState('');
  const [installationType, setInstallationType] = useState('Monofásica 220V Residencial');
  const [selectedMissingTools, setSelectedMissingTools] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { id: string; name: string; dataUrl: string; sizeKb: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Safari modernos.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (isListening) {
      setIsListening(false);
      return;
    }

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFaultDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Modal State for Account & Gemini API Key
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState(currentUser.email || 'ineovolt@gmail.com');
  const [switchName, setSwitchName] = useState(currentUser.name || 'Instalador NEOVOLT');
  const [customApiKey, setCustomApiKey] = useState(currentUser.customGeminiApiKey || '');

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const commonFaultTemplates = [
    {
      title: '📷 Foto de Tablero o Quemadura en Bornes',
      desc: 'Adjuntar foto del tablero TDA, disyuntores calientes o cables sulfatados para evaluación visual.',
      toolsMissing: ['Cámara Termográfica'],
    },
    {
      title: '⚡ Salta el Diferencial (RCD) sin causa aparente',
      desc: 'El interruptor diferencial salta a distintas horas o al conectar cierto electrodoméstico.',
      toolsMissing: ['Megóhmetro (500V)', 'Pinza Fuga mA'],
    },
    {
      title: '🔥 Calentamiento o zumbido en Tablero / Disyuntor',
      desc: 'Disyuntor C16 o IGA está caliente al tacto o emite un zumbido/chispazo constante.',
      toolsMissing: ['Cámara Termográfica', 'Multímetro RMS'],
    },
    {
      title: '🔌 Enchufes sin energía pero ningún disyuntor caído',
      desc: 'Se perdió la tensión en un sector de la propiedad, pero en el tablero todo está arriba.',
      toolsMissing: ['Buscapolos Digital', 'Probador de Enchufes RCD'],
    },
    {
      title: '💡 Luces parpadean al encender motor o hervidor',
      desc: 'Caída de tensión severa o variación de luminosidad en el circuito de alumbrado.',
      toolsMissing: ['Analizador de Redes', 'Pinza Amperimétrica'],
    },
  ];

  const availableMissingToolOptions = [
    'Megóhmetro / Medidor de Aislamiento 500V',
    'Pinza Amperimétrica de Fuga en mA',
    'Multímetro Digital RMS',
    'Telurómetro (Medidor de Puesta a Tierra)',
    'Buscapolos Inductivo sin Contacto',
    'Cámara Termográfica de Tableros',
  ];

  const toggleMissingTool = (tool: string) => {
    if (selectedMissingTools.includes(tool)) {
      setSelectedMissingTools(selectedMissingTools.filter((t) => t !== tool));
    } else {
      setSelectedMissingTools([...selectedMissingTools, tool]);
    }
  };

  const handleSelectTemplate = (template: typeof commonFaultTemplates[0]) => {
    setFaultDescription(template.desc);
    setSelectedMissingTools(template.toolsMissing);
  };

  // Image Upload Handlers
  const handlePhotoFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione únicamente archivos de imagen (JPG, PNG, WEBP).');
        return;
      }

      if (uploadedPhotos.length >= 4) {
        alert('Puede adjuntar un máximo de 4 fotografías por consulta.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const sizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

            const newPhoto = {
              id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              dataUrl: compressedDataUrl,
              sizeKb,
            };
            setUploadedPhotos((prev) => [...prev, newPhoto].slice(0, 4));
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveAccountSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchEmail.trim()) return;

    if (onUpdateUserSession) {
      onUpdateUserSession({
        ...currentUser,
        email: switchEmail.trim(),
        name: switchName.trim() || switchEmail.split('@')[0],
        isLoggedIn: true,
        customGeminiApiKey: customApiKey.trim() || undefined,
      });
    }
    setIsAccountModalOpen(false);
  };

  const handleRunDiagnostic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!faultDescription.trim() && uploadedPhotos.length === 0) {
      alert('Por favor ingrese una descripción del problema o adjunte al menos una fotografía.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const imagesBase64 = uploadedPhotos.map((p) => p.dataUrl);

      const res = await fetch('/api/diagnostic-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultDescription: faultDescription || 'Inspección de imágenes adjuntas del tablero/falla.',
          installationType,
          missingTools: selectedMissingTools,
          contextNotes: customContext,
          userEmail: currentUser.email,
          customGeminiApiKey: currentUser.customGeminiApiKey,
          imagesBase64,
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      } else if (data.error) {
        setAnalysisResult(`❌ Error en la consulta: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setAnalysisResult('❌ Ocurrió un fallo de conexión. Verifique su red e intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!analysisResult) return;
    const text = encodeURIComponent(
      `⚡ *CONSULTA & DIAGNÓSTICO FOTOGRÁFICO NEOVOLT SEC* ⚡\n\n*Falla Reportada:* ${
        faultDescription || 'Inspección Fotográfica de Tablero'
      }\n\n${analysisResult}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse text-fuchsia-400" />
            <span>Consultor IA Multimodal Gemini 3.6 • Reconocimiento Fotográfico SEC</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <span>Consultor Eléctrico IA & Análisis de Fotos</span>
            <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 px-2.5 py-1 rounded-full font-mono">
              Fotos + Visión IA
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Sube fotos de tableros, disyuntores quemados o fallas en terreno. Gemini analizará la imagen, la física del problema y las exigencias de los pliegos normativos RIC N°01-11.
          </p>
        </div>

        {/* User Chip */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow transition-all group"
          >
            <User className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Cuenta Activa:</div>
              <div className="font-bold text-white text-xs truncate max-w-[140px]">
                {currentUser.email || 'ineovolt@gmail.com'}
              </div>
            </div>
            <span className="text-[10px] bg-fuchsia-600/30 text-fuchsia-300 px-2 py-0.5 rounded-md font-mono ml-1">
              Configurar
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls & Photo Uploader (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Preset Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-fuchsia-400" />
              <span>Plantillas Rápidas & Ejemplos con Fotografía</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {commonFaultTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className="text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-fuchsia-500/50 p-3 rounded-2xl transition-all group space-y-1"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-fuchsia-300 truncate">
                    {tpl.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {tpl.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostic Query Form */}
          <form onSubmit={handleRunDiagnostic} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            {/* PHOTO UPLOAD SECTION */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Camera className="w-4 h-4 text-fuchsia-400" />
                  <span>Subir o Tomar Fotos de la Falla / Tablero (Opcional - Hasta 4)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {uploadedPhotos.length} / 4 adjuntas
                </span>
              </div>

              {/* Upload Drop Zone / Camera Trigger */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-fuchsia-950/40 hover:bg-fuchsia-900/60 border border-fuchsia-800/50 hover:border-fuchsia-500 text-fuchsia-200 p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Camera className="w-4 h-4 text-fuchsia-400" />
                  <span>Tomar Foto con Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Subir Imagen de Galería</span>
                </button>

                {/* Hidden Native File Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoFilesSelected(e.target.files)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoFilesSelected(e.target.files)}
                />
              </div>

              {/* Uploaded Photos Thumbnails Preview */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-md">
                      <img src={photo.dataUrl} alt={photo.name} className="w-full h-24 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="bg-rose-600 text-white p-1.5 rounded-full shadow hover:bg-rose-500 transition-transform"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-1 bg-slate-900/90 text-[9px] text-slate-300 font-mono truncate text-center">
                        {photo.name} ({photo.sizeKb} KB)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Descripción de la Falla o Consulta Técnica:
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    isListening ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-fuchsia-400'
                  }`}
                  title="Dictar por voz"
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Escuchando...' : 'Dictar'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={faultDescription}
                onChange={(e) => setFaultDescription(e.target.value)}
                placeholder="Ejemplo: Salta el diferencial RCD de 30mA cada vez que se enciende el aire acondicionado. Adjunto foto del tablero para ver la disposición de automáticos..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Tipo de Instalación</label>
                <select
                  value={installationType}
                  onChange={(e) => setInstallationType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="Monofásica 220V Residencial">Monofásica 220V Residencial</option>
                  <option value="Monofásica 220V Comercial">Monofásica 220V Comercial</option>
                  <option value="Trifásica 380V Industrial">Trifásica 380V Industrial</option>
                  <option value="Comunidad / Edificio de Departamentos">Comunidad / Edificio</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Notas Adicionales de Contexto</label>
                <input
                  type="text"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Ej: Casa antigua con cableado NYA sin tierra"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>
            </div>

            {/* Missing Tools Checklist */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>¿Qué instrumentos NO tienes a mano en la obra?</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Selecciona los equipos que te faltan. Gemini te entregará un procedimiento seguro de descarte metódico en terreno sin ellos.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {availableMissingToolOptions.map((tool, idx) => {
                  const isChecked = selectedMissingTools.includes(tool);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleMissingTool(tool)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 border ${
                        isChecked
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{isChecked ? '✕ No la tengo:' : '+'}</span>
                      <span>{tool}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || (!faultDescription.trim() && uploadedPhotos.length === 0)}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analizando imagen y Normativa RIC...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Generar Dictamen & Análisis Fotográfico</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: AI Output Display (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 min-h-[500px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>Dictamen del Consultor IA Gemini</span>
                </h3>

                {analysisResult && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => alert('Dictamen guardado en el Proyecto Actual exitosamente.')}
                      className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-xl text-xs flex items-center gap-1 border border-indigo-500/30"
                      title="Guardar en el Proyecto Actual"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1"
                      title="Copiar dictamen"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleShareWhatsApp}
                      className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-xl text-xs flex items-center gap-1 border border-emerald-500/30"
                      title="Enviar Informe por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-fuchsia-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">Procesando imágenes y física de la falla...</p>
                    <p className="text-[11px] text-slate-400">Verificando pliegos de la normativa SEC RIC N°01-11.</p>
                  </div>
                </div>
              ) : analysisResult ? (
                <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed overflow-y-auto max-h-[580px] scrollbar-thin markdown-body">
                  <Markdown>{analysisResult}</Markdown>
                </div>
              ) : (
                <div className="bg-slate-950 p-10 rounded-2xl border border-slate-800/80 text-center space-y-4 text-slate-400">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-fuchsia-400 border border-slate-800 shadow-inner">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">Aún no has realizado una consulta</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Toma una foto del tablero o describe el problema eléctrico a la izquierda para recibir la auditoría en tiempo real.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Cuenta: <strong className="text-slate-300">{currentUser.email || 'ineovolt@gmail.com'}</strong></span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RIC SEC Chile</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACCOUNT & GEMINI API KEY MODAL */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-fuchsia-400" />
                <span>Configurar Cuenta & Clave Gemini IA</span>
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountSwitch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Correo Electrónico (Cualquier cuenta):</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@gmail.com o ineovolt@gmail.com"
                  value={switchEmail}
                  onChange={(e) => setSwitchEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nombre del Instalador / Empresa:</label>
                <input
                  type="text"
                  placeholder="Ej: Camilo Rojas (NEOVOLT)"
                  value={switchName}
                  onChange={(e) => setSwitchName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clave API Personal Gemini (Opcional):</span>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Dejar en blanco para usar la del servidor)"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-fuchsia-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Si no especificas una clave propia, el sistema usará automáticamente el servidor predeterminado.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
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
  Paperclip,
  Image as ImageIcon,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Mic,
  MicOff,
  Save,
  MessageSquare,
  PlusCircle,
  AlertCircle,
  Bot,
  UserCheck
} from 'lucide-react';
import Markdown from 'react-markdown';

interface AiDiagnosticConsultantTabProps {
  isSecCertified?: boolean;
  currentUser?: UserSession;
  onUpdateUserSession?: (updated: UserSession) => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: { id: string; name: string; dataUrl: string }[];
  installationType?: string;
  missingTools?: string[];
  timestamp: string;
  isError?: boolean;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome_init',
  role: 'model',
  text: '¡Hola! Soy tu Copiloto Eléctrico NEOVOLT. Puedo ayudarte a diagnosticar fallas, guiarte en instalaciones según norma RIC/SEC o analizar fotos de tableros. ¿En qué trabajamos hoy?',
  timestamp: 'Ahora',
};

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
  // Chat History State initialized with welcome copilot greeting
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [faultDescription, setFaultDescription] = useState('');
  const [installationType, setInstallationType] = useState('Monofásica 220V Residencial');
  const [selectedMissingTools, setSelectedMissingTools] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { id: string; name: string; dataUrl: string; sizeKb: number }[]
  >([]);
  
  // Loading & UI States
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Api Key input state (for inline or modal custom key or localStorage)
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    if (currentUser.customGeminiApiKey) return currentUser.customGeminiApiKey;
    try {
      return localStorage.getItem('NEOVOLT_PERMANENT_GEMINI_KEY') || '';
    } catch {
      return '';
    }
  });
  const [showApiKeyNotice, setShowApiKeyNotice] = useState<boolean>(false);

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState(currentUser.email || 'ineovolt@gmail.com');
  const [switchName, setSwitchName] = useState(currentUser.name || 'Instalador NEOVOLT');
  const [customApiKeyModal, setCustomApiKeyModal] = useState(currentUser.customGeminiApiKey || '');

  // File Input & Chat Scroll Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  const commonFaultTemplates = [
    {
      title: '📷 Foto de Tablero o Quemadura en Bornes',
      desc: 'Adjuntar foto del tablero TDA, disyuntores calientes o cables sulfatados para evaluación visual.',
      toolsMissing: ['Cámara Termográfica'],
    },
    {
      title: '⚡ Salta el Diferencial (RCD) sin causa aparente',
      desc: 'El interruptor diferencial salta a distintas horas o al conectar cierto electrodoméstico.',
      toolsMissing: ['Megóhmetro / Medidor de Aislamiento 500V', 'Pinza Amperimétrica de Fuga en mA'],
    },
    {
      title: '🔥 Calentamiento o zumbido en Tablero / Disyuntor',
      desc: 'Disyuntor C16 o IGA está caliente al tacto o emite un zumbido/chispazo constante.',
      toolsMissing: ['Cámara Termográfica', 'Multímetro Digital RMS'],
    },
    {
      title: '🔌 Enchufes sin energía pero ningún disyuntor caído',
      desc: 'Se perdió la tensión en un sector de la propiedad, pero en el tablero todo está arriba.',
      toolsMissing: ['Buscapolos Inductivo sin Contacto'],
    },
    {
      title: '💡 Luces parpadean al encender motor o hervidor',
      desc: 'Caída de tensión severa o variación de luminosidad en el circuito de alumbrado.',
      toolsMissing: ['Pinza Amperimétrica de Fuga en mA'],
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

    const keyToUse = customApiKeyModal.trim() || undefined;
    setApiKeyInput(customApiKeyModal.trim());
    if (customApiKeyModal.trim()) {
      try {
        localStorage.setItem('NEOVOLT_PERMANENT_GEMINI_KEY', customApiKeyModal.trim());
      } catch (err) {
        console.error(err);
      }
    }

    if (onUpdateUserSession) {
      onUpdateUserSession({
        ...currentUser,
        email: switchEmail.trim(),
        name: switchName.trim() || switchEmail.split('@')[0],
        isLoggedIn: true,
        customGeminiApiKey: keyToUse,
      });
    }
    setIsAccountModalOpen(false);
    setShowApiKeyNotice(false);
  };

  const handleSaveApiKeyInline = () => {
    if (!apiKeyInput.trim()) return;
    try {
      localStorage.setItem('NEOVOLT_PERMANENT_GEMINI_KEY', apiKeyInput.trim());
    } catch (err) {
      console.error(err);
    }
    if (onUpdateUserSession) {
      onUpdateUserSession({
        ...currentUser,
        customGeminiApiKey: apiKeyInput.trim(),
      });
    }
    setShowApiKeyNotice(false);
  };

  const handleClearChat = () => {
    if (confirm('¿Deseas iniciar una nueva consulta y reiniciar la conversación con tu Copiloto?')) {
      setMessages([INITIAL_WELCOME_MESSAGE]);
      setFaultDescription('');
      setUploadedPhotos([]);
      setErrorMessage(null);
    }
  };

  const handleSendQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = faultDescription.trim();

    if (!promptText && uploadedPhotos.length === 0) {
      alert('Por favor ingrese una descripción de la falla o adjunte al menos una fotografía.');
      return;
    }

    setErrorMessage(null);
    const activeApiKey = apiKeyInput.trim() || currentUser.customGeminiApiKey;

    // Create user message for chat log
    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: promptText || 'Análisis fotográfico de componentes/tablero.',
      images: uploadedPhotos.map((p) => ({ id: p.id, name: p.name, dataUrl: p.dataUrl })),
      installationType,
      missingTools: selectedMissingTools.length > 0 ? [...selectedMissingTools] : undefined,
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Prepare current images payload
    const currentImagesBase64 = uploadedPhotos.map((p) => p.dataUrl);

    // Clear current inputs for smooth chat flow
    setFaultDescription('');
    setUploadedPhotos([]);

    try {
      // Build server chat history parameter from existing messages
      const chatHistoryPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/diagnostic-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultDescription: promptText || 'Inspección de imágenes adjuntas.',
          installationType,
          missingTools: selectedMissingTools,
          contextNotes: customContext,
          userEmail: currentUser.email,
          customGeminiApiKey: activeApiKey,
          imagesBase64: currentImagesBase64,
          chatHistory: chatHistoryPayload,
        }),
      });

      const data = await res.json();

      if (data.analysis) {
        const modelMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'model',
          text: data.analysis,
          timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, modelMsg]);
      } else if (data.error) {
        setErrorMessage(data.error);
        if (data.error.includes('cuota') || data.error.includes('API Key')) {
          setShowApiKeyNotice(true);
        }
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          role: 'model',
          text: `⚠️ **Aviso del Sistema:** ${data.error}`,
          timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      console.error(err);
      const connErrText = '❌ Ocurrió un fallo de conexión. Verifique su red de datos e intente nuevamente.';
      setErrorMessage(connErrText);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: connErrText,
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (textToShare: string) => {
    const text = encodeURIComponent(
      `⚡ *CONSULTA & DIAGNÓSTICO ELÉCTRICO NEOVOLT SEC* ⚡\n\n${textToShare}`
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
            <span>Consultor IA Multimodal Gemini 2.5 Flash • Asistente SEC Chile</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <span>Consultor Técnico Eléctrico & Chat Multimodal</span>
            <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 px-2.5 py-1 rounded-full font-mono">
              Visión + Conversación
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Sube fotos de tableros, disyuntores o fallas en terreno y conversa con la IA. Recibe diagnósticos normativos rigurosos según Pliegos RIC N°01-11.
          </p>
        </div>

        {/* User Account & Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="flex items-center gap-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow transition-all"
              title="Iniciar una consulta limpia"
            >
              <PlusCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
              <span className="hidden sm:inline">Nueva Consulta</span>
            </button>
          )}

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
              API Key
            </span>
          </button>
        </div>
      </div>

      {/* Optional Gemini API Key Banner if quota error occurs or explicitly requested */}
      {showApiKeyNotice && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-300 block">Ingresa tu API Key de Google Gemini (Opcional)</span>
              <p className="text-amber-200/80">
                Puedes ingresar tu propia API Key de Google AI Studio si el servidor alcanza su límite temporal de cuota.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 w-44"
            />
            <button
              onClick={handleSaveApiKeyInline}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow transition-all"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Preset Templates & Tool Settings (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Preset Fault Templates */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-fuchsia-400" />
              <span>Plantillas Rápidas & Casos Frecuentes</span>
            </h3>

            <div className="space-y-2">
              {commonFaultTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className="w-full text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-fuchsia-500/50 p-3 rounded-2xl transition-all group space-y-1"
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

          {/* Installation Context Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-fuchsia-400" />
              <span>Parámetros de la Obra / Terreno</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Tipo de Instalación</label>
                <select
                  value={installationType}
                  onChange={(e) => setInstallationType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
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
                  placeholder="Ej: Tablero de madera sin aislamiento"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              {/* Missing Tools Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>¿Qué instrumentos NO tienes a mano?</span>
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {availableMissingToolOptions.map((tool, idx) => {
                    const isChecked = selectedMissingTools.includes(tool);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleMissingTool(tool)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 border ${
                          isChecked
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{isChecked ? '✕ Sin:' : '+'}</span>
                        <span className="truncate max-w-[180px]">{tool}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Conversational Interactive Chat Feed (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col h-[680px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Chat Header Bar */}
          <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Consultor IA Gemini SEC Chile</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Respuesta inmediata con análisis técnico de fotos y pliegos RIC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                {installationType}
              </span>
            </div>
          </div>

          {/* Chat Messages Log Scrollable Container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-400">
                <div className="w-16 h-16 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center text-fuchsia-400 shadow-2xl">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-sm font-bold text-white">Inicia la Consulta Técnica o Sube Fotos</h4>
                  <p className="text-xs text-slate-400">
                    Escribe tu inquietud eléctrica o adjunta imágenes de tableros, disyuntores quemados o fallas en el campo de texto inferior.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bot Avatar for AI responses */}
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400 shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Content Bubble */}
                  <div
                    className={`max-w-[85%] rounded-3xl p-4 space-y-3 text-xs leading-relaxed shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-fuchsia-950/80 text-fuchsia-100 border border-fuchsia-800/60 rounded-tr-sm'
                        : msg.isError
                        ? 'bg-rose-950/60 text-rose-200 border border-rose-800/80 rounded-tl-sm'
                        : 'bg-slate-950 text-slate-100 border border-slate-800 rounded-tl-sm'
                    }`}
                  >
                    {/* User Sent Images Thumbnails */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-fuchsia-800/40">
                        {msg.images.map((img) => (
                          <div key={img.id} className="rounded-xl overflow-hidden border border-fuchsia-700/50 bg-black/40">
                            <img src={img.dataUrl} alt={img.name} className="w-full h-24 object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Body */}
                    {msg.role === 'model' ? (
                      <div className="markdown-body text-xs font-mono text-slate-200">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap font-sans text-xs">{msg.text}</p>
                    )}

                    {/* User Metadata Tags */}
                    {msg.role === 'user' && msg.missingTools && msg.missingTools.length > 0 && (
                      <div className="pt-2 border-t border-fuchsia-800/30 flex flex-wrap gap-1">
                        <span className="text-[10px] text-amber-300 font-bold">Sin instrumentos:</span>
                        {msg.missingTools.map((tool, idx) => (
                          <span key={idx} className="text-[9px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-md font-mono">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Toolbar for AI Messages */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="font-mono">{msg.timestamp}</span>

                      {msg.role === 'model' && !msg.isError && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                            title="Copiar texto"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(msg.text)}
                            className="p-1.5 hover:bg-emerald-950/50 text-emerald-400 rounded-lg transition-colors flex items-center gap-1"
                            title="Compartir por WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-fuchsia-300 shrink-0 mt-1">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Thinking / Analyzing Animated Loader */}
            {loading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-3xl rounded-tl-sm p-4 space-y-2 text-xs text-slate-300 max-w-xs shadow-lg">
                  <div className="flex items-center gap-2 text-fuchsia-400 font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analizando imagen y normativa SEC...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Verificando parámetros de seguridad y física de fallas.
                  </p>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Attached Photos Thumbnails Preview bar */}
          {uploadedPhotos.length > 0 && (
            <div className="bg-slate-950/90 border-t border-slate-800 p-3 px-6 flex items-center gap-3 overflow-x-auto">
              <span className="text-[10px] text-fuchsia-400 font-extrabold uppercase shrink-0">
                Fotos a enviar ({uploadedPhotos.length}/4):
              </span>
              <div className="flex items-center gap-2">
                {uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-700 w-12 h-12">
                    <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute inset-0 bg-rose-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Chat Input Controls Form */}
          <form onSubmit={handleSendQuery} className="bg-slate-950 p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              {/* Camera Trigger */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-fuchsia-500 text-fuchsia-400 rounded-2xl transition-all shadow shrink-0"
                title="Tomar foto con cámara"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Attach / File Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-fuchsia-500 text-slate-300 rounded-2xl transition-all shadow shrink-0"
                title="Adjuntar fotos de tableros o fallas"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Hidden File Inputs */}
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

              {/* Text Input Area */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder={
                    messages.length > 0
                      ? 'Haz una repregunta o aclara detalles...'
                      : 'Describe la falla o pregunta sobre la foto...'
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-4 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 shadow-inner"
                />

                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isListening ? 'text-rose-400 animate-pulse' : 'text-slate-400 hover:text-fuchsia-400'
                  }`}
                  title="Dictar por voz"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || (!faultDescription.trim() && uploadedPhotos.length === 0)}
                className="p-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-2xl shadow-lg transition-all shrink-0 flex items-center justify-center font-bold"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
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
                <label className="block text-slate-400 mb-1 font-semibold">Correo Electrónico:</label>
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
                  value={customApiKeyModal}
                  onChange={(e) => setCustomApiKeyModal(e.target.value)}
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

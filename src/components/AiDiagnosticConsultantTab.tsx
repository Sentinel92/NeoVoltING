import React, { useState, useRef, useEffect } from 'react';
import { UserSession } from '../types';
import { RIC_NORMS_DATA, RicNormItem } from '../data/ricNormsData';
import { exportChatHistoryToJsPdf } from '../utils/aiChatPdfExporter';
import {
  Wrench,
  AlertTriangle,
  Sparkles,
  Send,
  Copy,
  Check,
  HelpCircle,
  Share2,
  User,
  Key,
  LogIn,
  X,
  Camera,
  Paperclip,
  Trash2,
  RefreshCw,
  Mic,
  MicOff,
  PlusCircle,
  AlertCircle,
  Bot,
  UserCheck,
  Download,
  FileText,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import Markdown from 'react-markdown';

interface AiDiagnosticConsultantTabProps {
  isSecCertified?: boolean;
  currentUser?: UserSession;
  onUpdateUserSession?: (updated: UserSession) => void;
  onAppendToWorkReport?: (summaryText: string) => void;
  onNavigateToTab?: (tab: string, targetNorm?: string) => void;
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
  text: '¡Hola! Soy tu Copiloto Eléctrico NEOVOLT. Puedo ayudarte a diagnosticar fallas en terreno, guiarte en instalaciones según pliegos técnicos RIC/SEC o analizar fotos de tableros. ¿En qué trabajamos hoy?',
  timestamp: 'Ahora',
};

const CHAT_STORAGE_KEY = 'NEOVOLT_COPILOT_CHAT_HISTORY_V1';

// Helper to extract referenced RIC norms from text
export const extractRicNormsFromText = (text: string): RicNormItem[] => {
  if (!text) return [];
  const found = new Set<string>();
  
  // Match patterns like "RIC N°02", "RIC N° 02", "RIC 02", "RIC N°2", "RIC 2", "RIC Nº02", "RIC Nº2"
  const regex = /RIC\s*(?:N[°ºo]?\.?\s*)?0?([1-9]|1[0-9])\b/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const formattedNum = `RIC N°${num < 10 ? '0' + num : num}`;
    found.add(formattedNum);
  }

  return RIC_NORMS_DATA.filter((norm) => found.has(norm.num));
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
  onAppendToWorkReport,
  onNavigateToTab,
}) => {
  // Chat History State initialized from localStorage or default greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar el historial de chat de localStorage:', err);
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

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
  const [voiceTranscriptFeedback, setVoiceTranscriptFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApiKeyNotice, setShowApiKeyNotice] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Feature Modals & Actions States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState(currentUser.email || '');
  const [switchName, setSwitchName] = useState(currentUser.name || '');
  const [customApiKeyModal, setCustomApiKeyModal] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedNormModal, setSelectedNormModal] = useState<RicNormItem | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [attachedReportFeedback, setAttachedReportFeedback] = useState<string | null>(null);

  // References
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom whenever messages array changes or while loading
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Persist chat history to localStorage whenever messages update
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (err) {
      console.warn('Error al guardar historial de chat en localStorage:', err);
    }
  }, [messages]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Initialize Account Switch Form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setSwitchEmail(currentUser.email || '');
      setSwitchName(currentUser.name || '');
      setCustomApiKeyModal(currentUser.customGeminiApiKey || '');
      if (currentUser.customGeminiApiKey) {
        setApiKeyInput(currentUser.customGeminiApiKey);
      }
    }
  }, [currentUser]);

  // Web Speech API Voice Recognition
  const toggleVoiceRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no cuenta con soporte para la Web Speech API. Te recomendamos Google Chrome, Microsoft Edge o Safari en iOS/macOS.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CL';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscriptFeedback('🎙️ Escuchando consulta técnica por voz... Habla con normalidad');
      };

      recognition.onresult = (event: any) => {
        let accumulatedFinal = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedFinal += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (accumulatedFinal.trim()) {
          setFaultDescription((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${accumulatedFinal.trim()}` : accumulatedFinal.trim();
          });
          setVoiceTranscriptFeedback(`Texto reconocido: "${accumulatedFinal.trim()}"`);
        } else if (interimText.trim()) {
          setVoiceTranscriptFeedback(`Escuchando: "${interimText.trim()}"...`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Error de reconocimiento Web Speech API:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceTranscriptFeedback('Permiso de micrófono denegado en el navegador.');
        } else if (event.error === 'no-speech') {
          setVoiceTranscriptFeedback('No se detectó audio.');
        } else {
          setVoiceTranscriptFeedback(`Error de voz: ${event.error}`);
        }
        setTimeout(() => setVoiceTranscriptFeedback(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceTranscriptFeedback(null), 3000);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error al iniciar Web Speech API:', err);
      setIsListening(false);
      setVoiceTranscriptFeedback('No se pudo activar el micrófono.');
    }
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
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } catch (err) {
        console.warn('Error al limpiar localStorage:', err);
      }
    }
  };

  // Helper to format Base64 into Gemini inlineData object
  const formatInlineData = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
    if (match) {
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    }
    return {
      inlineData: {
        mimeType: 'image/jpeg',
        data: dataUrl.replace(/^data:.*?;base64,/, ''),
      },
    };
  };

  const getEffectiveApiKey = () => {
    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      localStorage.getItem('NEOVOLT_PERMANENT_GEMINI_KEY') ||
      localStorage.getItem('gemini_api_key') ||
      currentUser?.customGeminiApiKey ||
      apiKeyInput.trim();

    return (apiKey || '').trim();
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = faultDescription.trim();

    if (!promptText && uploadedPhotos.length === 0) {
      alert('Por favor ingrese una descripción de la falla o adjunte al menos una fotografía.');
      return;
    }

    setErrorMessage(null);
    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      localStorage.getItem('NEOVOLT_PERMANENT_GEMINI_KEY') ||
      localStorage.getItem('gemini_api_key') ||
      currentUser?.customGeminiApiKey ||
      apiKeyInput.trim() ||
      '';

    const activeApiKey = apiKey.trim();

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
      let analysisText = '';

      if (activeApiKey) {
        // Direct call to Gemini 1.5 Flash API (v1beta)
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeApiKey}`;

        // Build continuous chat contents
        const contents: any[] = [];

        // Add history (excluding welcome & error messages)
        messages
          .filter((m) => m.id !== 'welcome_init' && !m.isError && m.text.trim())
          .forEach((m) => {
            const parts: any[] = [];
            if (m.images && m.images.length > 0) {
              m.images.forEach((img) => {
                parts.push(formatInlineData(img.dataUrl));
              });
            }
            parts.push({ text: m.text });
            contents.push({
              role: m.role === 'user' ? 'user' : 'model',
              parts,
            });
          });

        // Add current user turn
        const currentParts: any[] = [];
        currentImagesBase64.forEach((dataUrl) => {
          currentParts.push(formatInlineData(dataUrl));
        });

        let fullPrompt = promptText || 'Análisis técnico y normativo de las fotografías adjuntas.';
        if (installationType) {
          fullPrompt = `[Tipo de Instalación: ${installationType}]\n` + fullPrompt;
        }
        if (selectedMissingTools.length > 0) {
          fullPrompt += `\n[Herramientas No Disponibles en Terreno: ${selectedMissingTools.join(', ')}. Sugerir método de descarte seguro alternativo]`;
        }
        if (customContext.trim()) {
          fullPrompt += `\n[Contexto Adicional: ${customContext.trim()}]`;
        }

        currentParts.push({ text: fullPrompt });

        contents.push({
          role: 'user',
          parts: currentParts,
        });

        const systemInstruction = {
          role: 'user',
          parts: [
            {
              text: 'Eres el Copiloto Eléctrico y Consultor Técnico Senior de NEOVOLT, experto en Ingeniería Eléctrica y normativa chilena SEC (Pliegos Técnicos RIC N°01 al N°19). Analizas fotos de tableros, conexiones, disyuntores y fallas para emitir diagnósticos normativos precisos, guiando en terreno con pasos estructurados, detallando causas probables, medidas de seguridad inmediatas y solución técnica paso a paso con citas normativas RIC.',
            },
          ],
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            system_instruction: systemInstruction,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (!response.ok) {
          let detailMsg = `Error ${response.status}: ${response.statusText}`;
          let errorJson: any = null;
          try {
            errorJson = await response.json();
            if (errorJson?.error?.message) {
              detailMsg = `Error ${errorJson.error.code || response.status} (${errorJson.error.status || 'API_ERROR'}): ${errorJson.error.message}`;
            } else if (errorJson?.error) {
              detailMsg = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
            }
          } catch {}

          throw new Error(detailMsg);
        }

        const resultData = await response.json();
        analysisText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!analysisText) {
          throw new Error(`Respuesta vacía o bloqueada por políticas de seguridad de Google: ${JSON.stringify(resultData)}`);
        }
      } else {
        // Fallback to server proxy endpoint
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
          analysisText = data.analysis;
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error('Respuesta inválida del servidor (sin campo de análisis).');
        }
      }

      const modelMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'model',
        text: analysisText,
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (error: any) {
      console.error('Gemini Error:', error);
      const exactErrorMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error)) || 'Error desconocido al conectar con Google Gemini.';
      setErrorMessage(exactErrorMsg);
      setShowApiKeyNotice(true);

      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `🛑 **Error de la API de Google Gemini:**\n\n\`${exactErrorMsg}\`\n\n*Por favor verifique su API Key en Google AI Studio o ingrésela en el panel.*`,
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuery = sendMessage;

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

  // Helper to attach any specific diagnostic text directly to Work Report
  const handleAttachSpecificTextToWorkReport = (textToAttach: string, title = 'Diagnóstico Técnico SEC') => {
    if (!textToAttach.trim()) return;
    if (onAppendToWorkReport) {
      const formattedSnippet = `### ${title.toUpperCase()}\n${textToAttach.trim()}`;
      onAppendToWorkReport(formattedSnippet);
      setAttachedReportFeedback('¡Diagnóstico adjuntado correctamente al Informe de Obra!');
      setTimeout(() => setAttachedReportFeedback(null), 4000);
    } else {
      alert('El módulo de informes de obra no está disponible en este momento.');
    }
  };

  // Feature 1: Export Conversation to PDF
  const handleExportPdf = () => {
    if (messages.length === 0) {
      alert('No hay mensajes en la conversación para exportar.');
      return;
    }
    setIsExportingPdf(true);
    try {
      exportChatHistoryToJsPdf({
        messages,
        currentUser,
        installationType,
        selectedMissingTools,
        contextNotes: customContext,
      });
      setExportFeedback('¡PDF descargado con éxito!');
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error exportando PDF:', err);
      alert(`Ocurrió un error al generar el PDF: ${err?.message || err}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Feature 3: Secondary Gemini Call to Summarize for Work Report
  const handleSummarizeForWorkReport = async () => {
    if (messages.length <= 1) {
      alert('Inicia una consulta con tu Copiloto antes de sintetizar un informe.');
      return;
    }

    setIsSummarizing(true);
    const activeApiKey = getEffectiveApiKey().trim();

    try {
      let generatedSummary = '';

      if (activeApiKey) {
        // Direct Gemini call for summary
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeApiKey}`;
        const chatLogText = messages
          .filter((m) => !m.isError && m.text.trim())
          .map((m) => `${m.role === 'user' ? 'Técnico' : 'Copiloto IA'}: ${m.text}`)
          .join('\n\n');

        const prompt = `Actúa como un Auditor Eléctrico Autorizado SEC de Chile.
Genera una SÍNTESIS TÉCNICA Y EJECUTIVA de la siguiente conversación de diagnóstico en terreno para adjuntarla directamente al Informe de Obra (Work Report).

DATOS:
- Instalación: ${installationType}
- Contexto: ${customContext || 'Inspección técnica regular'}

HISTORIAL DE CONSULTA:
${chatLogText}

ESTRUCTURA OBLIGATORIA DEL RESUMEN:
- **1. Motivo de la Consulta / Falla Evaluada:** (Breve descripción)
- **2. Diagnóstico & Causa Raíz:** (Explicación técnica de la falla)
- **3. Acciones Normativas RIC Ejecutadas:** (Pasos de corrección según pliegos RIC N°01 a N°19)
- **4. Medidas de Seguridad & Estado Final:** (Verificación de aislamiento, diferenciales 30mA, puesta a tierra)

Redacta de forma clara, técnica, profesional y en español chileno normativo.`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        });

        if (!response.ok) {
          throw new Error(`Error en API Gemini al sintetizar: ${response.statusText}`);
        }

        const data = await response.json();
        generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        // Call server proxy route
        const res = await fetch('/api/summarize-diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatHistory: messages.map((m) => ({ role: m.role, text: m.text })),
            customGeminiApiKey: activeApiKey,
            installationType,
            clientName: currentUser.name || 'Cliente Particular',
          }),
        });

        const data = await res.json();
        if (data.summary) {
          generatedSummary = data.summary;
        } else {
          throw new Error(data.error || 'Respuesta no válida al sintetizar.');
        }
      }

      if (generatedSummary) {
        setSummaryResult(generatedSummary);
        setShowSummaryModal(true);
        if (onAppendToWorkReport) {
          onAppendToWorkReport(generatedSummary);
        }
      }
    } catch (err: any) {
      console.error('Error al generar resumen:', err);
      alert(`No se pudo generar la síntesis automática: ${err?.message || err}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse text-fuchsia-400" />
            <span>Consultor IA Multimodal Gemini • Asistente SEC Chile</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <span>Consultor Técnico Eléctrico & Chat Multimodal</span>
            <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 px-2.5 py-1 rounded-full font-mono">
              Visión + Dictado + PDF
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Sube fotos de tableros o describe fallas en terreno por voz. Recibe diagnósticos normativos rigurosos según Pliegos RIC N°01 al N°19 y exporta informes certificados.
          </p>
        </div>

        {/* User Account & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 relative z-10">
          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || messages.length === 0}
            className="flex items-center gap-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 hover:border-indigo-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow transition-all disabled:opacity-40"
            title="Exportar conversación a informe PDF estilizado"
          >
            {isExportingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Exportar PDF</span>
          </button>

          {/* Summarize for Work Report Button */}
          <button
            type="button"
            onClick={handleSummarizeForWorkReport}
            disabled={isSummarizing || messages.length <= 1}
            className="flex items-center gap-1.5 bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-200 border border-fuchsia-500/40 hover:border-fuchsia-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow transition-all disabled:opacity-40"
            title="Generar resumen con IA e incorporarlo al Informe de Obra"
          >
            {isSummarizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Sintetizar a Informe</span>
          </button>

          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 px-3 py-2.5 rounded-2xl text-xs font-semibold shadow transition-all"
              title="Iniciar una consulta limpia"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Nueva Consulta</span>
            </button>
          )}

          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow transition-all group"
          >
            <User className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-transform" />
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-slate-400 leading-none">Cuenta Activa:</div>
              <div className="font-bold text-white text-xs truncate max-w-[120px]">
                {currentUser.email || 'ineovolt@gmail.com'}
              </div>
            </div>
            <span className="text-[10px] bg-fuchsia-600/30 text-fuchsia-300 px-2 py-0.5 rounded-md font-mono ml-1">
              API Key
            </span>
          </button>
        </div>
      </div>

      {/* Floating feedback alert for PDF */}
      {exportFeedback && (
        <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-200 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{exportFeedback}</span>
          </div>
        </div>
      )}

      {/* Floating feedback alert for Work Report attachment */}
      {attachedReportFeedback && (
        <div className="bg-fuchsia-950/70 border border-fuchsia-700/60 rounded-2xl p-3.5 flex items-center justify-between text-xs text-fuchsia-200 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-fuchsia-400" />
            <span>{attachedReportFeedback}</span>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('report')}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1 transition-all"
            >
              <span>Ver Informe</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

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
                  key={`tpl-${i}-${tpl.title}`}
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
                        key={`missing-opt-${tool}-${idx}`}
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
        <div className="lg:col-span-8 flex flex-col h-[700px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
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
                  Respuesta inmediata con análisis técnico de fotos, audio y pliegos RIC
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
                  <h4 className="text-sm font-bold text-white">Inicia la Consulta Técnica, Graba por Voz o Sube Fotos</h4>
                  <p className="text-xs text-slate-400">
                    Dicta tu inquietud por voz con el micrófono, escribe en el campo inferior o adjunta fotografías de tableros y disyuntores.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, msgIndex) => {
                const referencedNorms = msg.role === 'model' && !msg.isError ? extractRicNormsFromText(msg.text) : [];

                return (
                  <div
                    key={msg.id || `msg-${msgIndex}-${msg.timestamp}`}
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
                          {msg.images.map((img, imgIdx) => (
                            <div key={img.id || `msg-img-${msgIndex}-${imgIdx}`} className="rounded-xl overflow-hidden border border-fuchsia-700/50 bg-black/40">
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

                      {/* Feature 4: Interactive Norma Reference quick-links inside chat message */}
                      {referencedNorms.length > 0 && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Pliegos RIC Citados en este Diagnóstico:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {referencedNorms.map((norm, normIdx) => (
                              <button
                                key={`ric-tag-${msg.id || msgIndex}-${norm.num}-${normIdx}`}
                                type="button"
                                onClick={() => setSelectedNormModal(norm)}
                                className="flex items-center gap-1.5 bg-fuchsia-950/50 hover:bg-fuchsia-900/60 text-fuchsia-300 hover:text-white border border-fuchsia-700/50 hover:border-fuchsia-500 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shadow-sm"
                                title={`Ver detalles de ${norm.num}: ${norm.title}`}
                              >
                                <span>📖 {norm.num}</span>
                                <span className="text-[9px] text-fuchsia-200/80 truncate max-w-[120px]">{norm.title.split(':')[0]}</span>
                                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* User Metadata Tags */}
                      {msg.role === 'user' && msg.missingTools && msg.missingTools.length > 0 && (
                        <div className="pt-2 border-t border-fuchsia-800/30 flex flex-wrap gap-1">
                          <span className="text-[10px] text-amber-300 font-bold">Sin instrumentos:</span>
                          {msg.missingTools.map((tool, idx) => (
                            <span key={`msg-tool-${msg.id || msgIndex}-${tool}-${idx}`} className="text-[9px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-md font-mono">
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
                              onClick={() => handleAttachSpecificTextToWorkReport(msg.text, 'Diagnóstico Consultor IA')}
                              className="px-2 py-1 bg-fuchsia-950/60 hover:bg-fuchsia-900/70 text-fuchsia-300 border border-fuchsia-700/50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                              title="Adjuntar este diagnóstico directamente al Informe de Obra (WorkReportTab)"
                            >
                              <FileText className="w-3 h-3 text-fuchsia-400" />
                              <span>Adjuntar a Informe</span>
                            </button>
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
                );
              })
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
                    <span>Analizando consulta y normativa SEC...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Verificando parámetros de seguridad y física de fallas.
                  </p>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Voice Feedback Banner */}
          {isListening && (
            <div className="bg-rose-950/80 border-t border-rose-800 px-6 py-2 flex items-center justify-between text-xs text-rose-200 animate-pulse shrink-0">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>Dictado por voz activo en terreno... Habla ahora</span>
              </div>
              <button
                type="button"
                onClick={toggleVoiceRecognition}
                className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
              >
                Detener
              </button>
            </div>
          )}

          {/* Bottom Attached Photos Thumbnails Preview bar */}
          {uploadedPhotos.length > 0 && (
            <div className="bg-slate-950/90 border-t border-slate-800 p-3 px-6 flex items-center gap-3 overflow-x-auto shrink-0">
              <span className="text-[10px] text-fuchsia-400 font-extrabold uppercase shrink-0">
                Fotos a enviar ({uploadedPhotos.length}/4):
              </span>
              <div className="flex items-center gap-2">
                {uploadedPhotos.map((photo, photoIdx) => (
                  <div key={photo.id || `uploaded-photo-${photoIdx}`} className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-700 w-12 h-12">
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
          <form onSubmit={handleSendQuery} className="bg-slate-950 p-4 border-t border-slate-800 space-y-3 shrink-0">
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

              {/* Text Input Area with Speech Mic Button */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Dictando consulta por voz...'
                      : messages.length > 0
                      ? 'Haz una repregunta o aclara detalles...'
                      : 'Describe la falla o pregunta sobre la foto...'
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-4 pr-11 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 shadow-inner"
                />

                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500 animate-pulse'
                      : 'text-slate-400 hover:text-fuchsia-400 hover:bg-slate-800'
                  }`}
                  title={isListening ? 'Detener dictado de voz' : 'Grabar consulta por voz (Web Speech API)'}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
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

      {/* MODAL: RIC NORMA REFERENCE DETAIL POPUP */}
      {selectedNormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 px-2.5 py-0.5 rounded-md">
                  {selectedNormModal.num} • {selectedNormModal.category}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedNormModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNormModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-fuchsia-400 mb-1">Resumen del Pliego SEC:</h4>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                  {selectedNormModal.summary}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-fuchsia-400 mb-1">Disposiciones Técnicas & Obligaciones:</h4>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-wrap">
                  {selectedNormModal.detailText}
                </p>
              </div>

              {selectedNormModal.keyPoints && selectedNormModal.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-bold text-fuchsia-400 mb-1.5">Puntos Clave Exigidos por la SEC:</h4>
                  <ul className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {selectedNormModal.keyPoints.map((pt, idx) => (
                      <li key={`norm-kp-${selectedNormModal.num}-${idx}`} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToTab('norms', selectedNormModal.num);
                    setSelectedNormModal(null);
                  }}
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Ver en Compendio Completo RIC</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedNormModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI CONVERSATION SUMMARY FOR WORK REPORT */}
      {showSummaryModal && summaryResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-fuchsia-400" />
                <span>Síntesis de Diagnóstico Generada con Éxito</span>
              </h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-3 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>El resumen ha sido incorporado automáticamente en la pestaña <strong>Informe de Obra</strong>.</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 overflow-y-auto max-h-72">
                <div className="markdown-body">
                  <Markdown>{summaryResult}</Markdown>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSummaryModal(false);
                    onNavigateToTab('report');
                  }}
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Ir al Informe de Obra</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onAppendToWorkReport) {
                    onAppendToWorkReport(summaryResult);
                    setAttachedReportFeedback('¡Resumen ejecutivo adjuntado al Informe de Obra!');
                    setTimeout(() => setAttachedReportFeedback(null), 4000);
                  }
                }}
                className="bg-fuchsia-950/80 hover:bg-fuchsia-900 text-fuchsia-200 border border-fuchsia-600/50 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                title="Volver a insertar en el Informe de Obra"
              >
                <FileText className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Adjuntar a Informe</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(summaryResult);
                  alert('Resumen copiado al portapapeles.');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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

export const AIDiagnosticConsultantTab = AiDiagnosticConsultantTab;
export default AiDiagnosticConsultantTab;

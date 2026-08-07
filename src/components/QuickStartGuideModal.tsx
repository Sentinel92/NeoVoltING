import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Cpu, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Sparkles, 
  HelpCircle,
  Play
} from 'lucide-react';

interface QuickStartGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const STEPS = [
  {
    id: 'censo',
    tab: 'census',
    stepNumber: '01',
    title: 'Censo de Cargas & Recintos (RIC N°10)',
    subtitle: 'El punto de partida de todo proyecto eléctrico SEC',
    icon: Zap,
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    glowColor: 'bg-emerald-500/10',
    description: 'Ingresa o escanea los recintos de la propiedad, artefactos de alto consumo, potencia estimada (kW) y metros de alimentadores para determinar el consumo total del empalme.',
    features: [
      'Conteo rápido por recintos y potencia en Watts',
      'Cálculo de corriente nominal In (Amperes)',
      'Límite de caída de tensión según RIC N°03 (máx. 3%)',
      'Sugerencia de sección de conductor y alimentador'
    ],
    actionLabel: 'Ir al Censo de Cargas',
  },
  {
    id: 'tablero',
    tab: 'board',
    stepNumber: '02',
    title: 'Ensamblador de Tableros & Protecciones',
    subtitle: 'Diseña el tablero TDA con balance de fases',
    icon: Cpu,
    color: 'fuchsia',
    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
    iconBg: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40',
    glowColor: 'bg-fuchsia-500/10',
    description: 'Genera el cuadro de cargas unilineal, organiza los circuitos por protecciones termomagnéticas (MCB), diferenciales (RCD) y ajusta la distribución triphasica R-S-T.',
    features: [
      'Agrupación inteligente de circuitos de alumbrado y enchufes',
      'Validación de curvas C y sensibilidades de 30mA',
      'Diagrama unilineal exportable en alta resolución',
      'Simulador visual 2D del gabinete físico'
    ],
    actionLabel: 'Ir al Ensamblador de Tablero',
  },
  {
    id: 'cotizacion',
    tab: 'quote',
    stepNumber: '03',
    title: 'Cotización & Presupuesto Comercial',
    subtitle: 'Calcula tu mano de obra y entrega un PDF profesional',
    icon: FileText,
    color: 'blue',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    glowColor: 'bg-blue-500/10',
    description: 'Convierte el censo y tablero en una propuesta comercial completa. Añade costo de mano de obra por punto, insumos del catálogo y emite un PDF imprimible para el cliente.',
    features: [
      'Calculadora de mano de obra según dificultad técnica',
      'Integración con datos del cliente y firma del instalador',
      'PDF formal listo para enviar por WhatsApp o correo',
      'Respaldo automático en la nube y Firebase'
    ],
    actionLabel: 'Ir al Cotizador',
  },
];

export const QuickStartGuideModal: React.FC<QuickStartGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = (targetTab?: string) => {
    localStorage.setItem('neovolt_quickstart_seen', 'true');
    onClose();
    if (targetTab && onNavigateToTab) {
      onNavigateToTab(targetTab);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                  <span>Guía de Inicio Rápido NEOVOLT SEC</span>
                </h3>
                <p className="text-[11px] text-slate-400">Flujo de trabajo optimizado para proyectos eléctricos</p>
              </div>
            </div>

            <button
              onClick={() => handleComplete()}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
              title="Cerrar guía"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Dots & Progress */}
          <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {STEPS.map((s, idx) => {
                const isActive = idx === currentStep;
                const isPassed = idx < currentStep;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      isActive
                        ? `${s.badgeBg}`
                        : isPassed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span>{s.stepNumber}</span>
                    <span className="hidden sm:inline">{s.title.split(' ')[0]}</span>
                    {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Paso {currentStep + 1} de {STEPS.length}
            </span>
          </div>

          {/* Step Content */}
          <div className="p-6 sm:p-8 relative">
            <div className={`absolute top-0 right-0 w-64 h-64 ${step.glowColor} rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-500`}></div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Title & Icon */}
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-2xl border ${step.iconBg} shadow-lg shrink-0`}>
                    <StepIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-1 border bg-slate-800 text-slate-300 border-slate-700">
                      <span>Etapa {step.stepNumber}</span>
                    </div>
                    <h2 className="text-xl font-black text-white">{step.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{step.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  {step.description}
                </p>

                {/* Feature Checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Capacidades Claves de este Paso:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {step.features.map((feat, i) => (
                      <div
                        key={i}
                        className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2 text-xs text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Control Buttons */}
          <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => handleComplete()}
                className="text-xs text-slate-400 hover:text-slate-200 font-medium px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors"
              >
                Omitir guía
              </button>

              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleComplete(step.tab)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all hover:text-white"
              >
                <Play className="w-3.5 h-3.5 text-fuchsia-400 fill-fuchsia-400" />
                <span>{step.actionLabel}</span>
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-fuchsia-900/30 transition-all active:scale-95"
              >
                <span>{currentStep === STEPS.length - 1 ? 'Finalizar Guía' : 'Siguiente'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

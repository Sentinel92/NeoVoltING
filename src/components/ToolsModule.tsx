import React from 'react';
import { Wrench, 
  Calculator, Zap, ShieldAlert, Ruler, Box, 
  BookOpen, FileText, Share2, Cable, ShieldCheck, 
  Activity, Thermometer, Sun, Flame
} from 'lucide-react';

export const ToolsModule: React.FC = () => {
  return (
    <div className="space-y-6 pb-20 sm:pb-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wrench className="w-6 h-6 text-fuchsia-400" />
          <span>Caja de Herramientas Técnicas</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Calculadoras eléctricas, guías normativas SEC/RIC e instrumentos de inspección avanzados para terreno.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cálculos Eléctricos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Cálculos Eléctricos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <ToolCard 
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              title="Calculadora de Alimentadores"
              desc="Sección por caída de tensión"
            />
            <ToolCard 
              icon={<Activity className="w-5 h-5 text-rose-400" />}
              title="Factor de Potencia"
              desc="Cálculo banco de condensadores"
            />
            <ToolCard 
              icon={<Cable className="w-5 h-5 text-emerald-500" />}
              title="Malla a Tierra"
              desc="Resistencia y resistividad"
            />
            <ToolCard 
              icon={<Ruler className="w-5 h-5 text-indigo-400" />}
              title="Conversor AWG a mm²"
              desc="Tablas de equivalencia rápida"
            />
            <ToolCard 
              icon={<Box className="w-5 h-5 text-blue-400" />}
              title="Cubicaje de Ductos"
              desc="Sección transversal Norma RIC N°4"
            />
          </div>
        </div>

        {/* Guías y Normativa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-fuchsia-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Guías y Normativa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <ToolCard 
              icon={<ShieldCheck className="w-5 h-5 text-slate-300" />}
              title="Normativa RICs (SEC)"
              desc="Pliegos técnicos oficiales"
            />
            <ToolCard 
              icon={<FileText className="w-5 h-5 text-teal-400" />}
              title="Guía de Empalmes"
              desc="Esquemas de conexión monofásicos y trifásicos"
            />
            <ToolCard 
              icon={<Share2 className="w-5 h-5 text-violet-400" />}
              title="Diagramas de Conexión"
              desc="Tableros, Motores, 9/12, 9/15, 9/24"
            />
          </div>
        </div>

        {/* Herramientas Avanzadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Herramientas Avanzadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <ToolCard 
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              title="Simulador Megger"
              desc="Test aislamiento y telurómetro"
            />
            <ToolCard 
              icon={<Thermometer className="w-5 h-5 text-rose-500" />}
              title="Termografía"
              desc="Análisis de calidad de energía"
            />
            <ToolCard 
              icon={<Sun className="w-5 h-5 text-yellow-300" />}
              title="Luxómetro"
              desc="Cálculo de lúmenes e iluminación"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <button className="flex items-center gap-3 bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-3 rounded-xl transition-all text-left w-full group">
    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:bg-slate-800 transition-colors shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{title}</h4>
      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{desc}</p>
    </div>
  </button>
);

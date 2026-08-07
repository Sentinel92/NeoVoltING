import React, { useState } from 'react';
import { RIC_NORMS_DATA } from '../data/ricNormsData';
import { ShieldCheck, Search, BookOpen, Printer, CheckCircle2 } from 'lucide-react';

export const RicNormsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expandedNum, setExpandedNum] = useState<string | null>('RIC N°02');

  const filtered = RIC_NORMS_DATA.filter(
    (r) =>
      r.num.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase()) ||
      r.detailText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Etapa 8 • Compendio Interactivo de Pliegos Técnicos SEC</span>
          </div>
          <h2 className="text-xl font-bold text-white">Reglamento Técnico RIC SEC (Chile)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Consulta rápida de los Pliegos Técnicos Normativos (RIC N°01 al RIC N°11) vigentes para instaladores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar norma..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition-all shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Resumen</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((ric) => {
          const isExpanded = expandedNum === ric.num;

          return (
            <div
              key={ric.num}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md transition-all"
            >
              <button
                onClick={() => setExpandedNum(isExpanded ? null : ric.num)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 font-black text-xs px-2.5 py-1 rounded-lg">
                    {ric.num}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{ric.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{ric.summary}</p>
                  </div>
                </div>
                <span className="text-slate-400 font-bold text-xs">
                  {isExpanded ? 'Ver Menos -' : 'Ver Detalles +'}
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs space-y-3 text-slate-300 leading-relaxed animate-fadeIn">
                  <p className="whitespace-pre-line">{ric.detailText}</p>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-emerald-400 text-[11px] block">
                      Puntos Clave Exigidos por la SEC:
                    </span>
                    <ul className="space-y-1">
                      {ric.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

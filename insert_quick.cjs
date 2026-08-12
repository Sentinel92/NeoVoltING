const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardModule.tsx', 'utf-8');

const quickAccess = `

      {/* Access to Physical Board Generator (Tablero 2D) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-fuchsia-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-fuchsia-500/20 transition-all"></div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg">Generador de Tableros 2D Físicos</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Diseña el diagrama unilineal y físico de tus tableros de forma interactiva.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('physical')}
            className="w-full sm:w-auto bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Abrir Simulador 2D</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
`;

code = code.replace(/\{(\/\*\s*Top KPI Summary Cards\s*\*\/)\}/, match => quickAccess + '\n      ' + match);
fs.writeFileSync('src/components/DashboardModule.tsx', code);

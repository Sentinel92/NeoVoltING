const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const breadcrumb = `
      <div className="bg-slate-900 border-b border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center text-[11px] text-slate-400 font-medium">
          <button onClick={() => setActiveTab("dashboard")} className="hover:text-white transition-colors flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Inicio
          </button>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-600" />
          <span className="text-fuchsia-400">{TAB_LABELS[activeTab] || activeTab}</span>
        </div>
      </div>
`;

code = code.replace(/<HeaderNavbar[^>]*\/>/g, match => match + breadcrumb);

fs.writeFileSync('src/App.tsx', code);

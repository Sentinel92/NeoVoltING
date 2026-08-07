const fs = require('fs');
let content = fs.readFileSync('src/components/ProjectsManagerModule.tsx', 'utf8');

const anchor = `                <div className="flex items-center gap-2">
                  {activeModalTab !== 'scope_quote' ? (`;

const injection = `
              {/* TAB 4: VERSION HISTORY */}
              {activeModalTab === 'history' && editingProject && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-fuchsia-400" />
                      Historial de Modificaciones
                    </h3>
                    
                    {!editingProject.versionHistory || editingProject.versionHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-6">
                        No hay historial de versiones para este proyecto.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {editingProject.versionHistory.map((version, idx) => (
                          <div key={version.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-400">Versión {idx + 1}</span>
                              <p className="text-slate-300">{version.changesSummary}</p>
                              <p className="text-[10px] text-slate-500">
                                Fecha: {version.timestamp} • Editado por: {version.modifiedBy}
                              </p>
                            </div>
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 shrink-0 self-start sm:self-auto min-w-[150px]">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-slate-400">Materiales:</span>
                                <span className="text-white font-mono">
                                  \${version.materialsPriceOld.toLocaleString('es-CL')} -> \${version.materialsPriceNew.toLocaleString('es-CL')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Mano de Obra:</span>
                                <span className="text-white font-mono">
                                  \${version.laborPriceOld.toLocaleString('es-CL')} -> \${version.laborPriceNew.toLocaleString('es-CL')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
`;

if (content.includes(anchor)) {
    // To place it right above the footer controls entirely, we can place it above: 
    // <div className="flex items-center justify-between border-t border-slate-800 pt-4"> (which we couldn't find exactly)
    // Actually let's search for "Cancelar" button's container.
    const container = `                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}`;
                    
    const index = content.lastIndexOf(container);
    if (index !== -1) {
        // find the start of the <div className="flex items-center justify-between ..."> just before this.
        const earlierIndex = content.lastIndexOf('<div className="flex items-center', index);
        
        const before = content.substring(0, earlierIndex);
        const after = content.substring(earlierIndex);
        
        fs.writeFileSync('src/components/ProjectsManagerModule.tsx', before + injection + after);
        console.log('Injected successfully');
    }
} else {
    console.log('Not found anchor');
}

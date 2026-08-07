const fs = require('fs');
let content = fs.readFileSync('src/components/ProjectsManagerModule.tsx', 'utf8');

const targetStr = `              {/* Modal Footer Controls */}`;
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

if (content.includes(targetStr)) {
    content = content.replace(targetStr, injection + '\n' + targetStr);
    fs.writeFileSync('src/components/ProjectsManagerModule.tsx', content);
    console.log("Tab 4 injected");
} else {
    // If not found, let's search for the footer div manually
    const altTargetStr = `                <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-6">`;
    if (content.includes(altTargetStr)) {
        content = content.replace(altTargetStr, injection + '\n' + altTargetStr);
        fs.writeFileSync('src/components/ProjectsManagerModule.tsx', content);
        console.log("Tab 4 injected (alt)");
    } else {
        console.log("Could not find injection point for Tab 4");
    }
}

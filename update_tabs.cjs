const fs = require('fs');
let content = fs.readFileSync('src/components/ProjectsManagerModule.tsx', 'utf8');

const targetTabs = `                <span>3. Calculador de Presupuesto (\${totalConIva.toLocaleString('es-CL')})</span>
              </button>
            </div>`;

const replaceWithTabs = `                <span>3. Calculador de Presupuesto (\${totalConIva.toLocaleString('es-CL')})</span>
              </button>
              {editingProject && (
                <button
                  type="button"
                  onClick={() => setActiveModalTab('history')}
                  className={\`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 \${
                    activeModalTab === 'history'
                      ? 'bg-fuchsia-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }\`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>4. Historial de Versiones</span>
                </button>
              )}
            </div>`;

if (content.includes(targetTabs)) {
    content = content.replace(targetTabs, replaceWithTabs);
    fs.writeFileSync('src/components/ProjectsManagerModule.tsx', content);
    console.log("Modal Tabs updated!");
} else {
    console.log("Could not find Modal Tabs");
}

const fs = require('fs');
let content = fs.readFileSync('src/components/ProjectsManagerModule.tsx', 'utf8');

const targetSaveBlock = `    if (editingProject) {
      const updated: ElectricalProject = {
        ...editingProject,
        code: projectCode,
        title: projectTitle,
        projectType: selectedServiceType as ProjectType,
        status: projectStatus,
        client: { ...clientDetails },
        description: projectDescription,
        attachments: [...attachments],
        scopeItems: [...finalScopeItems],
        materialsPrice: totalMaterials,
        laborPrice: totalLabor,
        totalPrice: totalConIva,
        includeTaxIVA: includeTaxIVA,
        notes: projectNotes,
        updatedAt: now,
        targetDeadline: targetDeadline,
      };`;

const replaceWithSaveBlock = `    if (editingProject) {
      const newVersion = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('es-CL'),
        modifiedBy: 'Usuario Actual',
        changesSummary: \`Actualización de presupuesto - Total anterior: \${editingProject.totalPrice} - Total nuevo: \${totalConIva}\`,
        materialsPriceOld: editingProject.materialsPrice,
        materialsPriceNew: totalMaterials,
        laborPriceOld: editingProject.laborPrice,
        laborPriceNew: totalLabor
      };
      
      const history = editingProject.versionHistory ? [...editingProject.versionHistory, newVersion] : [newVersion];

      const updated: ElectricalProject = {
        ...editingProject,
        code: projectCode,
        title: projectTitle,
        projectType: selectedServiceType as ProjectType,
        status: projectStatus,
        client: { ...clientDetails },
        description: projectDescription,
        attachments: [...attachments],
        scopeItems: [...finalScopeItems],
        materialsPrice: totalMaterials,
        laborPrice: totalLabor,
        totalPrice: totalConIva,
        includeTaxIVA: includeTaxIVA,
        notes: projectNotes,
        updatedAt: now,
        targetDeadline: targetDeadline,
        versionHistory: history
      };`;

if (content.includes(targetSaveBlock)) {
    content = content.replace(targetSaveBlock, replaceWithSaveBlock);
    fs.writeFileSync('src/components/ProjectsManagerModule.tsx', content);
    console.log("handleSaveProject updated!");
} else {
    console.log("Could not find save block");
}

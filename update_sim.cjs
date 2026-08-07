const fs = require('fs');

let content = fs.readFileSync('src/components/PhysicalBoardSimulationTab.tsx', 'utf8');

const targetCheckNorms = "  const checkNorms = () => {";
const endCheckNorms = "    return { isOk, msgs };\n  };";

const replaceWith = `  const checkNorms = () => {
    const msgs: string[] = [];
    let isOk = true;

    // Check sizes
    const iga = components.find(c => c.type === 'IGA');
    const rcd = components.find(c => c.type === 'RCD');
    const mcbs = components.filter(c => c.type === 'MCB');

    const totalAmps = calculateTotalCurrent(loads);

    if (iga) {
      if ((iga.ampacity || 0) < totalAmps) {
        msgs.push(\`RIESGO DE DISPARO: La capacidad del IGA (\${iga.ampacity}A) es menor a la demanda total del proyecto (\${totalAmps.toFixed(1)}A).\`);
        isOk = false;
      } else {
        msgs.push(\`CAPACIDAD IGA CORRECTA: IGA de \${iga.ampacity}A soporta la demanda de \${totalAmps.toFixed(1)}A.\`);
      }
    }

    if (iga && rcd) {
      if ((iga.ampacity || 0) > (rcd.ampacity || 0)) {
        msgs.push(\`RIC N°03: La capacidad del RCD (\${rcd.ampacity}A) debe ser mayor o igual al IGA (\${iga.ampacity}A) que lo protege.\`);
        isOk = false;
      }
    }
    
    if (mcbs.length > 0) {
      // Rule: max 3 circuits per RCD generally (rule of thumb)
      if (mcbs.length > 3) {
        msgs.push(\`Recomendación RIC N°03: Considerar más de un Diferencial (RCD) si hay más de 3 circuitos derivados para evitar disparos intempestivos.\`);
        isOk = false; // Soft fail for simulation purposes
      }
    }
    return { isOk, msgs };
  };`;

const startIdx = content.indexOf(targetCheckNorms);
const endIdx = content.indexOf(endCheckNorms) + endCheckNorms.length;

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);
    fs.writeFileSync('src/components/PhysicalBoardSimulationTab.tsx', before + replaceWith + after);
    console.log("Updated checkNorms successfully!");
} else {
    console.log("Could not find checkNorms");
}

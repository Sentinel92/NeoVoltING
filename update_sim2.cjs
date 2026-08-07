const fs = require('fs');

let content = fs.readFileSync('src/components/PhysicalBoardSimulationTab.tsx', 'utf8');

const targetBlock = `    if (hasError) {
      setSimulationState('error');
      setSimulationMessages(msgs);
    } else {
      setSimulationState('success');
      setSimulationMessages(['¡Auditoría SEC exitosa! El tablero simulado tiene continuidad, cableado correcto y cumple Normativa RIC N°03 y RIC N°04.']);
    }`;

const replaceWith = `    if (hasError) {
      setSimulationState('error');
      setSimulationMessages(msgs);
    } else {
      setSimulationState('success');
      // add normCheck msgs as they include the green 'CAPACIDAD IGA CORRECTA' etc.
      setSimulationMessages([
        '¡Auditoría SEC exitosa! El tablero simulado tiene continuidad, cableado correcto.',
        ...normCheck.msgs
      ]);
    }`;

if (content.includes(targetBlock)) {
    fs.writeFileSync('src/components/PhysicalBoardSimulationTab.tsx', content.replace(targetBlock, replaceWith));
    console.log("Updated simulateBoard end block successfully!");
} else {
    console.log("Could not find simulateBoard block");
}

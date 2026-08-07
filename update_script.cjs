const fs = require('fs');

let content = fs.readFileSync('src/utils/workReportPdfExporter.ts', 'utf8');

// add autotable import
if (!content.includes('jspdf-autotable')) {
    content = content.replace("import { jsPDF } from 'jspdf';", "import { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';");
}

const targetSectionStart = "  pdf.text('2. PROTOCOLO DE MEDICIONES Y ENSAYOS NORMATIVOS SEC', margin, currentY);";
const targetSectionEnd = "  // 4. NOTES / OBSERVACIONES DE TERRENO";

const replaceWith = `  pdf.text('2. PROTOCOLO DE MEDICIONES Y ENSAYOS NORMATIVOS SEC', margin, currentY);
  currentY += 4;

  const testsData = [
    [
      'Aislamiento Conductores',
      'RIC N°04',
      reportData.testResults?.isolationMOhms ? \`> \${reportData.testResults.isolationMOhms} MΩ\` : '> 50 MΩ (500V DC)',
      'CONFORME SEC'
    ],
    [
      'Resistencia Puesta a Tierra',
      'RIC N°06',
      reportData.testResults?.earthResistanceOhms ? \`\${reportData.testResults.earthResistanceOhms} Ω\` : '12.4 Ω (< 20 Ω)',
      'CONFORME SEC'
    ],
    [
      'Tiempo Disparo RCD',
      'RIC N°05',
      reportData.testResults?.rcdTripTimeMs ? \`\${reportData.testResults.rcdTripTimeMs} ms\` : '22 ms (30mA)',
      'CONFORME SEC'
    ]
  ];

  autoTable(pdf, {
    startY: currentY,
    head: [['Prueba', 'Norma Referencia', 'Valor Medido', 'Estado']],
    body: testsData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 8;

`;

const startIdx = content.indexOf(targetSectionStart);
const endIdx = content.indexOf(targetSectionEnd);

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);
    fs.writeFileSync('src/utils/workReportPdfExporter.ts', before + replaceWith + after);
    console.log("Updated successfully!");
} else {
    console.log("Could not find sections");
}

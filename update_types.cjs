const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

const projectVersionIfc = `
export interface ProjectVersion {
  id: string;
  timestamp: string;
  modifiedBy: string;
  changesSummary: string;
  materialsPriceOld: number;
  materialsPriceNew: number;
  laborPriceOld: number;
  laborPriceNew: number;
}
`;

if (!content.includes('ProjectVersion')) {
  content = content.replace("export interface ElectricalProject {", projectVersionIfc + "\nexport interface ElectricalProject {");
  content = content.replace("  boardConfig?: ProjectBoardConfig;\n}", "  boardConfig?: ProjectBoardConfig;\n  versionHistory?: ProjectVersion[];\n}");
  fs.writeFileSync('src/types.ts', content);
  console.log("Types updated");
} else {
  console.log("Already updated");
}

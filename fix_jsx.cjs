const fs = require('fs');
let content = fs.readFileSync('src/components/ProjectsManagerModule.tsx', 'utf8');

content = content.replace(/->/g, '{"->"}');

fs.writeFileSync('src/components/ProjectsManagerModule.tsx', content);
console.log('Fixed JSX');

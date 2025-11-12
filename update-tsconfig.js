const fs = require('fs');
const path = require('path');

// Backup the current tsconfig.json
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
const backupPath = path.join(__dirname, 'tsconfig.backup.json');

if (fs.existsSync(tsconfigPath)) {
  fs.copyFileSync(tsconfigPath, backupPath);
  console.log('Backed up tsconfig.json to tsconfig.backup.json');
}

// Write the minimal config
const minimalConfig = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "es5"],
    "module": "esnext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`;

fs.writeFileSync(tsconfigPath, minimalConfig);
console.log('Updated tsconfig.json with minimal configuration');

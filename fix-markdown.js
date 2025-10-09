const fs = require('fs');
const path = require('path');

// Liste des fichiers Markdown à corriger
const files = [
  'ANDROID_SETUP.md',
  'AUTORISATIONS_ANDROID.md',
  'CORRECTIONS_APPLIQUEES.md',
  'DEPLOIEMENT_SAMSUNG_S10_ULTRA.md',
  'INSTALLATION_COMPLETE.md',
  'PROBLEMES_IMAGES_RESOLUS.md',
  'RAPPORT_VERIFICATION.md',
  'README.md',
  'RESUME_FINAL.md'
];

function fixMarkdown(content) {
  let fixed = content;

  // Ajouter une ligne vide avant les listes qui suivent un paragraphe
  fixed = fixed.replace(/([^\n])\n([-*] )/g, '$1\n\n$2');

  // Ajouter une ligne vide après les titres (###)
  fixed = fixed.replace(/(#{1,6} [^\n]+)\n([^#\n-])/g, '$1\n\n$2');

  // Ajouter une ligne vide avant et après les blocs de code
  fixed = fixed.replace(/([^\n])\n```/g, '$1\n\n```');
  fixed = fixed.replace(/```\n([^`\n])/g, '```\n\n$1');

  // Ajouter 'bash' aux blocs de code qui commencent par npm, npx, adb, cd, etc.
  fixed = fixed.replace(/```\n(npm |npx |adb |cd |del |rmdir |git |node )/g, '```bash\n$1');

  // Ajouter 'text' aux blocs de code qui ressemblent à des structures de fichiers
  fixed = fixed.replace(/```\n([a-zA-Z0-9_-]+\/)/g, '```text\n$1');

  // Ajouter 'json' aux blocs de code JSON
  fixed = fixed.replace(/```\n\{/g, '```json\n{');

  // Ajouter 'xml' aux blocs de code XML
  fixed = fixed.replace(/```\n<\?xml/g, '```xml\n<?xml');
  fixed = fixed.replace(/```\n</g, '```xml\n<');

  // Corriger les URLs nues (ajouter < >)
  fixed = fixed.replace(/([^<])(https?:\/\/[^\s)]+)([^>])/g, '$1<$2>$3');

  return fixed;
}

// Corriger tous les fichiers
files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    console.log(`Correction de ${file}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixMarkdown(content);
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✓ ${file} corrigé`);
  } else {
    console.log(`✗ ${file} non trouvé`);
  }
});

console.log('\n✅ Tous les fichiers Markdown ont été corrigés !');

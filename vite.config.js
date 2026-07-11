import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Utilise des chemins relatifs pour que l'application fonctionne sur n'importe quel sous-dossier de GitHub Pages
  build: {
    outDir: 'dist'
  }
});

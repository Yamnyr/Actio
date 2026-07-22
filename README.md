# DoIt ⚡

**DoIt** (anciennement Actio) est une application web de gestion de tâches et de planification de projets de vie, conçue pour allier une ergonomie ultra-fluide à un design moderne et personnalisable. 

L'application est pensée pour être instantanée, esthétique et entièrement pilotable au clavier comme à la souris.

---

## 🌟 Fonctionnalités Clés

### 1. Double Flux de Productivité
*   **Tâches Rapides (Semaine)** : Gagnez en clarté sur vos objectifs immédiats. Organisez vos tâches de la semaine dans trois colonnes temporelles (*Aujourd'hui*, *Cette Semaine*, *Plus Tard*) grâce au glisser-déposer (**drag & drop**).
*   **Projets de Vie (Long Terme)** : Structurez vos grands objectifs (ex: *Voyage au Japon*, *Reconversion Professionnelle*). Chaque projet comporte des sous-tâches détaillées avec un suivi de progression visuel en temps réel.

### 2. Génération de Sous-tâches Assistée
*   **Mode Local Intelligent** : Détecte automatiquement des mots-clés dans vos titres (ex: *coder*, *voyage*, *nettoyer*, *sport*, *acheter*) pour vous proposer instantanément un plan d'action de 5 à 7 étapes adaptées.
*   **Mode IA avec Google Gemini** : Configurez votre clé d'API Gemini gratuite dans les paramètres pour générer des étapes sur-mesure pour n'importe quel projet complexe.

### 3. Ergonomie & Design Premium
*   **Design Glassmorphism** : Interface sombre soignée avec flous d'arrière-plan, halos lumineux colorés et transitions fluides (120ms) sans saccades lors des changements d'onglets.
*   **Navigation au Clavier** : 
    *   <kbd>N</kbd> : Ouvrir le formulaire de création d'une tâche/projet.
    *   <kbd>/</kbd> : Focaliser directement la barre de recherche.
    *   <kbd>Échap</kbd> : Fermer les fenêtres modales ouvertes.
*   **Changement de Disposition** : Basculez en un clic entre l'affichage en **Cartes/Grille** et un affichage en **Liste Compacte** horizontale, selon votre préférence (paramètre persistant).

### 4. Confidentialité et Gestion des Données
*   **100% Client-Side** : Vos données restent sur votre machine et ne transitent par aucun serveur externe. Vos clés et tâches sont stockées dans le `localStorage` de votre navigateur.
*   **Export / Import** : Sauvegardez vos données dans un fichier `doit_export.json` ou importez-les pour changer de machine ou de navigateur.

---

## 🛠️ Installation & Démarrage

DoIt est construit avec des technologies web natives (HTML5, CSS3, JavaScript ES modules) et utilise **Vite** comme serveur de développement local léger pour éviter les blocages CORS.

### Prérequis
*   [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)

### Lancement du projet

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Lancez le serveur de développement local :
   ```bash
   npm run dev
   ```

3. Ouvrez votre navigateur sur l'adresse indiquée par le terminal (généralement `http://localhost:5173`).

### Compiler pour la production
Pour générer les fichiers statiques optimisés dans le dossier `dist/` :
```bash
npm run build
```
Puis pour les prévisualiser localement :
```bash
npm run preview
```

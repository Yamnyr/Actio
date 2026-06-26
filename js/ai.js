/* ==========================================================================
   Actio AI Subtask Generation Module
   ========================================================================== */

import { state } from './state.js';

// --- Local Template Database ---
const LOCAL_TEMPLATES = [
  {
    keywords: ['voyage', 'vacances', 'trip', 'visiter', 'partir', 'sejour', 'italie', 'japon', 'espagne', 'route'],
    subtasks: [
      'Définir la destination exacte, la durée et les dates précises',
      'Établir un budget estimatif détaillé (transport, logement, repas, activités)',
      'Rechercher et réserver les moyens de transport (avions, trains, location de voiture)',
      'Trouver et réserver les hébergements adaptés (hôtels, Airbnb, auberges)',
      'Lister les activités incontournables et créer un itinéraire au jour le jour',
      'Vérifier la validité des documents (passeport, cartes de crédit, assurances)',
      'Faire une liste de bagages et préparer sa valise 48h à l\'avance'
    ]
  },
  {
    keywords: ['apprendre', 'etudier', 'cours', 'formation', 'ecole', 'lire', 'livre', 'tuto', 'video', 'langue', 'japonais', 'anglais', 'piano', 'guitare'],
    subtasks: [
      'Définir l\'objectif final précis de cet apprentissage (ex: niveau A2, jouer un morceau)',
      'Sélectionner les meilleures ressources (livres de référence, cours en ligne, tuteurs)',
      'Bloquer des créneaux fixes dans son calendrier (ex: 20 min par jour)',
      'Installer les outils ou applications nécessaires pour pratiquer',
      'Créer des fiches mémo ou des cartes de révision (Anki, carnets)',
      'S\'exercer de manière active (écrire, coder, parler ou jouer)',
      'Faire une auto-évaluation après 2 semaines pour ajuster la méthode'
    ]
  },
  {
    keywords: ['coder', 'developper', 'programmer', 'site', 'application', 'dev', 'logiciel', 'javascript', 'python', 'react', 'base de donnees', 'api'],
    subtasks: [
      'Rédiger un mini-cahier des charges avec les fonctionnalités principales',
      'Concevoir le schéma de la base de données et l\'architecture générale',
      'Créer les maquettes fil de fer (wireframes) de l\'interface utilisateur',
      'Initialiser le projet (Git, structure de dossiers, dépendances)',
      'Développer l\'interface utilisateur statique (front-end)',
      'Implémenter la logique métier, la persistance et les routes (back-end)',
      'Tester les différents scénarios d\'utilisation et corriger les bugs',
      'Déployer l\'application en production (Vercel, Netlify, Github Pages)'
    ]
  },
  {
    keywords: ['sport', 'musculation', 'running', 'courir', 'entrainement', 'fitness', 'marathon', 'hiit', 'poids', 'sante', 'regime', 'nutrition'],
    subtasks: [
      'Consulter un médecin si nécessaire pour obtenir un feu vert médical',
      'Établir un plan d\'entraînement réaliste adapté à son niveau actuel',
      'Acheter l\'équipement de base approprié (chaussures, tapis, vêtements)',
      'Planifier les séances dans sa routine hebdomadaire (jours et heures fixes)',
      'Préparer son sac et sa gourde la veille pour réduire la friction',
      'Suivre sa progression dans un carnet (poids soulevés, distances, temps)',
      'Optimiser le sommeil et l\'alimentation pour favoriser la récupération'
    ]
  },
  {
    keywords: ['nettoyer', 'rangement', 'ranger', 'menage', 'maison', 'tri', 'trier', 'garage', 'chambre', 'cuisine', 'placard', 'vide'],
    subtasks: [
      'Déterminer la pièce ou le meuble à traiter en priorité',
      'Sortir absolument tous les objets de la zone pour repartir de zéro',
      'Faire 4 piles distinctes : Garder, Donner/Vendre, Jeter, À réparer',
      'Nettoyer à fond les surfaces vides (poussière, lingette, aspirateur)',
      'Organiser le rangement des objets conservés (utiliser des boîtes et étiquettes)',
      'Remettre en place en facilitant l\'accès aux objets les plus utilisés',
      'Prendre 5 minutes par jour pour maintenir cet espace ordonné'
    ]
  },
  {
    keywords: ['demenagement', 'demenager', 'appartement', 'maison', 'logement', 'carton', 'bail', 'preavis'],
    subtasks: [
      'Envoyer la lettre de préavis de départ au propriétaire actuel',
      'Faire le tri dans ses affaires pour jeter ou donner le superflu',
      'Se procurer des cartons de tailles diverses et du ruban adhésif robuste',
      'Commencer à emballer les objets non indispensables au quotidien',
      'Réserver un utilitaire de déménagement ou faire des devis de professionnels',
      'Effectuer le transfert des contrats (électricité, eau, gaz, internet, courrier)',
      'Nettoyer l\'ancien logement pour l\'état des lieux de sortie'
    ]
  },
  {
    keywords: ['acheter', 'achat', 'voiture', 'pc', 'ordinateur', 'immobilier', 'appartement', 'maison', 'telephone', 'materiel'],
    subtasks: [
      'Lister ses besoins essentiels et son budget maximal (frais annexes inclus)',
      'Rechercher des comparatifs techniques et lire les avis des utilisateurs',
      'Sélectionner 2 ou 3 modèles ou opportunités phares',
      'Faire des visites de contrôle ou tester le matériel en magasin',
      'Négocier le prix d\'achat ou demander des gestes commerciaux',
      'Souscrire aux assurances ou extensions de garantie si nécessaire',
      'Vérifier la facture et les conditions de retour/SAV'
    ]
  }
];

const FALLBACK_TEMPLATE = [
  'Définir clairement l\'objectif final et le critère de réussite',
  'Lister le matériel, les compétences ou les ressources nécessaires',
  'Identifier les principaux obstacles potentiels et comment les surmonter',
  'Planifier la toute première étape (action simple de moins de 10 min)',
  'Bloquer un créneau horaire dans son agenda pour s\'y consacrer',
  'Exécuter les tâches principales dans l\'ordre logique',
  'Passer en revue le résultat obtenu et noter les apprentissages clés'
];

// --- Subtask Generator Function ---
export async function generateSubtasks(title, description = '') {
  const apiKey = state.getGeminiKey();
  
  if (!apiKey) {
    // Return local heuristic list with a short delay to simulate thought process
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getLocalSubtasks(title);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Tu es un assistant expert en productivité et gestion de projet. 
Génère une liste de sous-tâches détaillées, concrètes et séquentielles pour le projet/objectif suivant :
Titre : "${title}"
Description : "${description || 'Pas de description supplémentaire.'}"

Consignes strictes :
1. Renvoie entre 4 et 8 sous-tâches ordonnées de manière logique pour mener à bien le projet.
2. Écris en français.
3. Rends les sous-tâches orientées action (commencer par un verbe à l'infinitif).
4. Renvoie UNIQUEMENT un tableau JSON de chaînes de caractères (ex: ["Étape 1", "Étape 2"]). Ne mets aucun texte d'explication avant ou après. N'inclus pas de balises de code Markdown de type \`\`\`json ou \`\`\`. Renvoie le tableau JSON brut.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API Gemini:', errorData);
      throw new Error(errorData.error?.message || `Erreur API (${response.status})`);
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Réponse vide reçue de l\'IA.');
    }

    // Attempt to parse JSON. Sometimes LLMs return formatting code blocks even when asked not to.
    let cleanedText = textResponse.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const subtasks = JSON.parse(cleanedText);
    if (!Array.isArray(subtasks)) {
      throw new Error('Le format retourné par l\'IA n\'est pas un tableau.');
    }

    return subtasks;
  } catch (error) {
    console.error('Erreur lors de la génération IA, bascule en local:', error);
    // Fallback to local generator but append an error notice to the console/UI if needed
    throw error; // Let UI handle notification, and fall back to local if desired.
  }
}

// --- Local Engine Helper ---
function getLocalSubtasks(title) {
  const cleanTitle = title.toLowerCase().trim();
  
  // Look for keyword match
  for (const template of LOCAL_TEMPLATES) {
    const hasMatch = template.keywords.some(keyword => cleanTitle.includes(keyword));
    if (hasMatch) {
      // Pick 5 to 7 subtasks randomly or take all
      return [...template.subtasks];
    }
  }

  // Fallback template
  return [...FALLBACK_TEMPLATE];
}

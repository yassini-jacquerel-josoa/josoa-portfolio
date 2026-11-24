/**
 * Visuels de la galerie (section « Galerie » / origin) et des projets :
 * - efficashLanding : landing page effi'Cash, « Pilotez vos kiosques Mobile Money du terrain au bureau »
 * - efficashPoster   : affiche design de l'application effi'Cash
 * - efficashWordmark: wordmark effi'Cash
 * - dashboard        : tableau de bord
 * - portrait / code  : collage de la section introductive
 * - projectVisuals  : efficash-app (mockup généré depuis phone-efficash),
 *                     zhay-awards (accueil du site), smartbots (sélection des agents),
 *                     myracingcoach (mockup tablette/iPhone de l'app de coaching karting).
 */

export type Visual = {
  src: string;
  alt: string;
};

export const gallery = {
  portrait: {
    src: "/images/portrait.png",
    alt: "Portrait de JOSOA Yassini Jacquerel",
  },
  code: {
    src: "/images/code.jpg",
    alt: "Éditeur de code sur un ordinateur portable",
  },
  efficashLanding: {
    src: "/images/efficash-landing.jpg",
    alt: "Présentation effi'Cash : Pilotez vos kiosques Mobile Money du terrain au bureau",
  },
  efficashPoster: {
    src: "/images/efficash-poster.jpg",
    alt: "Affiche design de l'application effi'Cash : logo et composition typographique",
  },
  dashboard: {
    src: "/images/dashboard.jpg",
    alt: "Tableau de bord affiché sur un ordinateur portable",
  },
  efficashWordmark: {
    src: "/images/efficash-wordmark.png",
    alt: "Wordmark effi'Cash",
  },
} as const satisfies Record<string, Visual>;

export const projectVisuals: Record<string, Visual> = {
  "effi'Cash": {
    src: "/images/payment.jpg",
    alt: "Paiement sans contact sur un téléphone",
  },
  "Z'Hay Awards": {
    src: "/images/concert.jpg",
    alt: "Foule face à une scène de concert",
  },
  Wondergeorge: {
    src: "/images/devices.jpg",
    alt: "Écrans d’ordinateur, de tablette et de téléphone",
  },
  SmartBots: {
    src: "/images/circuit.jpg",
    alt: "Carte électronique en gros plan",
  },
  MyRacingCoach: {
    src: "/images/kart.jpg",
    alt: "Karting sur un circuit",
  },
};

export const fallbackVisual: Visual = {
  src: "/images/devices.jpg",
  alt: "Écrans d’ordinateur, de tablette et de téléphone",
};

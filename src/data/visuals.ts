/**
 * Photos Unsplash (licence Unsplash, usage libre).
 * workspace 1498050108023-c5249f4df085 · code 1555066931-4365d14bab8c
 * architecture 1487958449943-2429e8be8625 · mobile 1512941937669-90a1b58e7e9c
 * stage 1470229722913-7c0e2dbbafd3 · concert 1514525253161-7a46d19cd819
 * payment 1726056652582-7c9d202d4018 · dashboard 1460925895917-afdab827c52f
 * devices 1547658719-da2b51169166 · circuit 1518770660439-4636190af475
 * kart 1703152668664-6ea8897602cf
 */

export type Visual = {
  src: string;
  alt: string;
};

export const gallery = {
  workspace: {
    src: "/images/portrait.png",
    alt: "Portrait de JOSOA Yassini Jacquerel",
  },
  code: {
    src: "/images/code.jpg",
    alt: "Éditeur de code sur un ordinateur portable",
  },
  architecture: {
    src: "/images/architecture.jpg",
    alt: "Façade d’un bâtiment contemporain en verre",
  },
  mobile: {
    src: "/images/mobile.jpg",
    alt: "Écran d’un téléphone affichant des applications",
  },
  stage: {
    src: "/images/stage.jpg",
    alt: "Scène éclairée devant une foule",
  },
  dashboard: {
    src: "/images/dashboard.jpg",
    alt: "Tableau de bord affiché sur un ordinateur portable",
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

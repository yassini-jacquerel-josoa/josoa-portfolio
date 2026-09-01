const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  TableOfContents, PageBreak, Header, Footer, PageNumber,
  LevelFormat, VerticalAlign,
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Cahier_des_Charges_Gestionnaire_Pharmacie.docx');

// ---------- Palette ----------
const PRIMARY = '15495C';
const ACCENT = '1E8A82';
const LIGHTBG = 'E7F2F1';
const SUBTLE = '5B6B6B';
const TEXT = '222222';

// ---------- Helpers ----------

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text })],
    spacing: { before: 480, after: 220 },
    border: { bottom: { color: ACCENT, space: 4, style: BorderStyle.SINGLE, size: 8 } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text })],
    spacing: { before: 320, after: 140 },
  });
}

function para(text, opts = {}) {
  const { alignment, ...runOpts } = opts;
  return new Paragraph({
    children: [new TextRun({ text, size: 21, color: TEXT, ...runOpts })],
    spacing: { after: 140 },
    alignment: alignment || AlignmentType.JUSTIFIED,
  });
}

function objectifPara(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: 'Objectif : ', bold: true, italics: true, size: 21, color: ACCENT }),
      new TextRun({ text, italics: true, size: 21, color: SUBTLE }),
    ],
    spacing: { after: 160 },
  });
}

function bullet(leadOrText, rest, level = 0) {
  const children = rest
    ? [
        new TextRun({ text: leadOrText, bold: true, size: 21, color: TEXT }),
        new TextRun({ text: rest, size: 21, color: TEXT }),
      ]
    : [new TextRun({ text: leadOrText, size: 21, color: TEXT })];
  return new Paragraph({
    children,
    numbering: { reference: 'bullets', level },
    spacing: { after: 90 },
  });
}

function moduleSection(title, objectif, features) {
  const out = [h2(title), objectifPara(objectif)];
  features.forEach((f) => {
    if (Array.isArray(f)) out.push(bullet(f[0], f[1]));
    else out.push(bullet(f));
  });
  return out;
}

function makeTable(headers, rows, widths) {
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((htext, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: PRIMARY },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: htext, bold: true, color: 'FFFFFF', size: 20 })] })],
    })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((cellText, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? 'FFFFFF' : LIGHTBG },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 70, bottom: 70, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: cellText, size: 19, color: TEXT })] })],
    })),
  }));
  return new Table({
    columnWidths: widths,
    width: { size: totalWidth, type: WidthType.DXA },
    rows: [headerRow, ...bodyRows],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ---------- Page de titre ----------

function titlePage() {
  return [
    new Paragraph({ text: '', spacing: { before: 2200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'CAHIER DES CHARGES', bold: true, size: 56, color: PRIMARY })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Gestionnaire de Pharmacie', bold: true, size: 40, color: ACCENT })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Système de gestion intégré pour officine', size: 26, italics: true, color: SUBTLE })],
      spacing: { after: 900 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Version 1.0', size: 24, color: TEXT })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '3 août 2026', size: 24, color: TEXT })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Contexte : Madagascar (structure adaptable à d'autres marchés)", size: 22, color: SUBTLE, italics: true })],
      spacing: { after: 2000 },
    }),
    pageBreak(),
  ];
}

// ---------- Section 1 ----------

function section1() {
  return [
    h1('1. Présentation du projet'),
    h2('1.1 Contexte'),
    para("Le secteur pharmaceutique nécessite une gestion rigoureuse combinant contraintes commerciales (vente, stock, rentabilité) et contraintes réglementaires strictes propres au médicament (traçabilité, ordonnances, conformité). Ce document définit les besoins fonctionnels et techniques d'un logiciel de gestion de pharmacie (« gestionnaire de pharmacie ») destiné à couvrir l'ensemble du cycle d'exploitation d'une officine : de la réception des marchandises jusqu'à la délivrance au patient, en passant par la comptabilité et le reporting."),
    para("Le projet est cadré pour une officine opérant à Madagascar, sous la tutelle réglementaire de l'Agence du Médicament de Madagascar (AMM, anciennement AGMED). Les principes généraux restent transposables à d'autres marchés moyennant adaptation du module de conformité réglementaire (section 5)."),
    h2('1.2 Objectifs du projet'),
    bullet("Informatiser et fiabiliser l'ensemble des opérations courantes de l'officine (vente, stock, ordonnances)"),
    bullet('Réduire les erreurs de saisie et les risques liés à la péremption ou aux ruptures de stock'),
    bullet('Assurer la conformité réglementaire (traçabilité des stupéfiants, AMM des produits vendus, archivage des ordonnances)'),
    bullet('Fournir une vision financière et analytique en temps réel à la direction'),
    bullet('Garantir la continuité de service même en cas de coupure internet (mode hors-ligne)'),
    bullet("Poser les bases d'une évolution future vers le multi-officine et vers de nouvelles intégrations externes (assurances, tiers payant)"),
    h2('1.3 Périmètre du projet'),
    para('Le périmètre couvre les onze modules fonctionnels détaillés en section 3, ainsi que les exigences techniques transverses (section 4) et le cadre réglementaire applicable (section 5).'),
    para('Sont explicitement hors périmètre de ce document, à cadrer séparément si besoin :'),
    bullet("Le développement d'un module de télémédecine ou de téléconsultation"),
    bullet("La gestion d'un laboratoire de fabrication (matières premières, production)"),
    bullet('La comptabilité générale complète de l\'entreprise — le module 7 couvre le suivi opérationnel, pas la comptabilité légale complète'),
    h2('1.4 Public cible'),
    para('Les utilisateurs finaux du système sont détaillés en section 2 (Acteurs et rôles utilisateurs).'),
  ];
}

// ---------- Section 2 ----------

function section2() {
  return [
    h1('2. Acteurs et rôles utilisateurs'),
    para("Le système doit gérer un accès différencié selon le profil de l'utilisateur, avec un principe de moindre privilège : chaque rôle n'accède qu'aux fonctionnalités nécessaires à sa mission."),
    makeTable(
      ['Rôle', 'Responsabilités principales', "Niveau d'accès"],
      [
        ['Pharmacien titulaire', "Validation des ordonnances sensibles, supervision globale de l'officine, paramétrage réglementaire", 'Accès complet'],
        ['Pharmacien assistant', 'Délivrance, conseil pharmaceutique, validation des ordonnances courantes', 'Accès élevé (hors paramétrage système)'],
        ['Préparateur en pharmacie', 'Préparation des commandes, gestion des stocks, vente des produits sans ordonnance', 'Accès opérationnel'],
        ['Caissier / vendeur', 'Encaissement, vente de parapharmacie et de produits en vente libre (OTC)', 'Accès limité au module Ventes'],
        ['Gérant / responsable administratif', 'Achats, fournisseurs, suivi financier, ressources humaines', 'Accès modules Achats, Finance, RH, Reporting'],
        ['Administrateur système (IT)', 'Paramétrage technique, gestion des comptes, sauvegardes, sécurité', 'Accès technique complet'],
      ],
      [2400, 4300, 2300],
    ),
  ];
}

// ---------- Section 3 ----------

function section3() {
  return [
    h1('3. Spécifications fonctionnelles détaillées'),
    para('Cette section détaille, module par module, les fonctionnalités attendues du gestionnaire de pharmacie.'),
    ...moduleSection(
      '3.1 Module 1 — Gestion des ventes / Point de vente (POS)',
      'Permettre un encaissement rapide, fiable et conforme, avec ou sans ordonnance.',
      [
        ['Scan de codes-barres', ' (EAN-13/GS1) et recherche rapide par nom, DCI ou code produit'],
        ['Vente avec ou sans ordonnance', ', avec liaison automatique au dossier patient lorsque applicable'],
        ['Calcul automatique', ' des taxes, remises et promotions en cours'],
        ['Paiements multiples', ' : espèces, carte bancaire, mobile money (Mvola, Orange Money, Airtel Money), tiers payant/assurance'],
        ['Émission', ' de factures et tickets de caisse conformes à la réglementation'],
        ['Gestion des retours et remboursements', ', avec motif obligatoire à la saisie'],
        ['Ouverture / fermeture de caisse', ' avec rapprochement automatique et détection des écarts'],
        ['Vente suspendue', ' / panier mis de côté, pour les clients qui reviennent plus tard'],
      ],
    ),
    ...moduleSection(
      '3.2 Module 2 — Gestion des stocks et inventaire',
      'Garantir la disponibilité des produits tout en minimisant pertes et périmés.',
      [
        ['Suivi en temps réel', ' des quantités par produit, par lot et par emplacement'],
        ['Gestion des dates de péremption', ' avec alertes graduées (J-90, J-60, J-30) et sortie FEFO (First Expired, First Out)'],
        ['Seuils de réapprovisionnement', ' personnalisables par produit, avec alertes de stock bas ou de rupture'],
        ['Gestion des lots', ' pour une traçabilité complète, essentielle en cas de rappel'],
        ['Inventaire physique périodique', ' avec calcul automatique des écarts'],
        ['Gestion multi-dépôts / multi-officines', ' avec transferts inter-sites'],
        ['Registre de destruction', ' des produits périmés ou invendables, avec traçabilité (date, quantité, motif, responsable)'],
      ],
    ),
    ...moduleSection(
      '3.3 Module 3 — Gestion des ordonnances et prescriptions',
      'Sécuriser la délivrance et assurer la traçabilité légale des prescriptions.',
      [
        ["Numérisation de l'ordonnance", ' (photo ou scan), rattachée à la vente correspondante'],
        ['Détection des interactions médicamenteuses', ' et des contre-indications, en lien avec le module 4'],
        ['Suivi des traitements chroniques', ' et gestion des renouvellements'],
        ['Historique médicamenteux complet', ' par patient'],
        ['Registre spécial et sécurisé', ' pour les stupéfiants et psychotropes, avec numérotation et double contrôle'],
        ['Circuit de validation pharmacien', ' obligatoire avant délivrance des produits sur liste'],
      ],
    ),
    ...moduleSection(
      '3.4 Module 4 — Référentiel médicament (base de données de référence)',
      'Garantir que tout produit vendu est légalement enregistré et à jour, et fiabiliser la saisie produit.',
      [
        ["Vérification du statut d'AMM", " (Autorisation de Mise sur le Marché) avant l'ajout d'un produit au catalogue"],
        ['Auto-remplissage de la fiche produit', ' (DCI, dosage, forme, laboratoire) à partir du référentiel'],
        ['Alertes automatiques', ' en cas de rappel de lot publié par le régulateur'],
        ['Blocage de la vente', " d'un produit dont l'AMM a été retirée ou suspendue"],
        ['Cache local du référentiel', ' pour permettre un fonctionnement hors-ligne'],
        ['Import/synchronisation', " avec les listes officielles de l'AMM Madagascar (traitement des publications PDF périodiques — voir section 5.2)"],
        ['Module optionnel de vérification anti-contrefaçon', ' (type SMS ou scan de code de sécurité), activable pour les produits jugés à risque'],
        ['Interconnexion possible avec des référentiels internationaux', ' (classification ATC, RxNorm) pour la standardisation et le contrôle d\'interactions si aucune base locale n\'en propose'],
      ],
    ),
    ...moduleSection(
      '3.5 Module 5 — Gestion des patients / clients',
      'Personnaliser le suivi et fidéliser la patientèle.',
      [
        ['Dossier patient', ' : allergies, antécédents, traitements en cours'],
        ['Historique complet des achats'],
        ['Programme de fidélité', ' avec points cumulables'],
        ['Rappels automatiques', " (renouvellement d'ordonnance, prise de traitement)"],
        ['Communication multicanal', ' : SMS, email, notifications applicatives'],
        ['Gestion du consentement', ' et de la confidentialité des données de santé (voir section 4.4)'],
      ],
    ),
    ...moduleSection(
      '3.6 Module 6 — Fournisseurs et achats',
      'Optimiser les approvisionnements et sécuriser la relation fournisseurs.',
      [
        ['Base de données fournisseurs', ' avec conditions commerciales (délais, remises, modalités de paiement)'],
        ['Génération de bons de commande', ' automatiques (basés sur les seuils de stock) ou manuels'],
        ['Réception de marchandises', ' avec contrôle qualité/quantité et rapprochement avec le bon de commande'],
        ['Suivi des délais de livraison', ' et scoring fournisseur'],
        ['Gestion des litiges et retours fournisseurs'],
      ],
    ),
    ...moduleSection(
      '3.7 Module 7 — Gestion financière et comptabilité',
      "Donner une vision claire de la performance économique de l'officine.",
      [
        ['Suivi du chiffre d\'affaires', ' (jour, semaine, mois, année) avec comparatifs'],
        ['Calcul des marges', ' par produit, catégorie et famille thérapeutique'],
        ['Rapprochement bancaire'],
        ['Gestion des créances', ' (assurances, tiers payant, comptes clients professionnels)'],
        ['Export vers logiciels comptables tiers', ' (CSV, Excel, ou API selon compatibilité)'],
        ['Gestion de la TVA', ' et des taxes locales applicables'],
      ],
    ),
    ...moduleSection(
      '3.8 Module 8 — Conformité réglementaire et traçabilité',
      'Répondre aux obligations légales et faciliter les contrôles.',
      [
        ['Respect des normes pharmaceutiques nationales', ' (enregistrement des stupéfiants, etc.)'],
        ['Génération de rapports formatés', ' pour les autorités sanitaires (AMM, Ministère de la Santé)'],
        ['Traçabilité complète bout-en-bout', ' (fournisseur → lot → patient)'],
        ['Gestion des rappels de lots', ' avec identification immédiate des ventes concernées'],
        ['Archivage légal et sécurisé des ordonnances', ', avec durée de conservation conforme à la réglementation'],
      ],
    ),
    ...moduleSection(
      '3.9 Module 9 — Gestion du personnel',
      "Structurer les accès et assurer l'auditabilité des actions.",
      [
        ['Gestion des accès par rôle', ' (cf. matrice section 2), avec paramétrage fin des permissions'],
        ['Suivi des horaires et présences'],
        ["Journal d'audit horodaté", ' de toutes les actions sensibles (qui a fait quoi, quand)'],
        ['Gestion des habilitations spécifiques', ' (ex. : qui est autorisé à délivrer des stupéfiants)'],
      ],
    ),
    ...moduleSection(
      '3.10 Module 10 — Reporting et analytics',
      "Transformer les données d'exploitation en aide à la décision.",
      [
        ['Tableaux de bord configurables', ' (ventes, stocks, marges, trésorerie)'],
        ['Classement des produits', ' les plus et les moins vendus'],
        ['Analyse des tendances saisonnières', ' (ex. : pics de vente liés à la saison des pluies ou aux épidémies grippales)'],
        ['Prévisions de la demande', " basées sur l'historique des ventes"],
        ['Rapports personnalisables et exportables', ' (PDF, Excel)'],
      ],
    ),
    ...moduleSection(
      '3.11 Module 11 — Fonctionnalités transversales',
      "Garantir la robustesse, la sécurité et l'accessibilité du système.",
      [
        ['Sécurité des données', ' : chiffrement au repos et en transit, sauvegardes automatiques régulières'],
        ['Protection des données de santé', ', selon des principes proches du RGPD, à adapter au cadre légal malgache'],
        ['Mode hors-ligne', ' avec synchronisation différée dès rétablissement de la connexion'],
        ['Multi-langue', ' (français / malgache) et gestion de la devise locale (Ariary)'],
        ['Intégrations API', ' : référentiel médicament (module 4), assurances, mobile money'],
        ['Application mobile', ' pour consultation à distance ou vente ambulante'],
        ['Interface e-commerce optionnelle', ' en cas de vente en ligne avec livraison'],
        ['Support technique et politique de mises à jour régulières'],
      ],
    ),
  ];
}

// ---------- Section 4 ----------

function section4() {
  return [
    h1('4. Spécifications techniques'),
    h2('4.1 Architecture générale'),
    para("Architecture recommandée : application web accessible via navigateur, avec base de données centralisée, doublée d'un client léger capable de fonctionner en local (cache) pour assurer la continuité de service hors-ligne."),
    bullet('Séparation claire entre le back-office (gestion, reporting) et l\'interface de caisse (rapide, optimisée pour un usage tactile)'),
    h2('4.2 Plateformes cibles'),
    bullet('Poste de caisse : ordinateur ou tablette, via navigateur web ou application dédiée'),
    bullet('Back-office : accessible depuis un ordinateur (gérant, pharmacien titulaire)'),
    bullet('Application mobile : consultation et alertes pour le titulaire ou le gérant'),
    h2('4.3 Exigences de performance'),
    bullet("Temps de réponse à l'encaissement inférieur à 1 seconde par scan produit"),
    bullet('Disponibilité cible de 99,5 %, hors maintenance planifiée'),
    bullet('Capacité à gérer plusieurs postes de caisse simultanés sans conflit de stock'),
    h2('4.4 Sécurité et protection des données'),
    bullet('Chiffrement des données sensibles (dossiers patients, historique médicamenteux)'),
    bullet("Gestion fine des droits d'accès par rôle, selon le principe du moindre privilège"),
    bullet('Sauvegardes automatiques quotidiennes, avec test de restauration périodique'),
    bullet('Journalisation des accès aux données de santé'),
    h2('4.5 Fonctionnement hors-ligne'),
    bullet('Cache local des données critiques : catalogue produit, référentiel médicament, stocks, patients récents'),
    bullet("File d'attente des transactions en cas de coupure, synchronisée automatiquement au retour de connexion"),
    bullet('Gestion des conflits de synchronisation (ex. : vente du même lot sur deux postes en simultané hors-ligne)'),
    h2('4.6 Intégrations externes (API et bases tierces)'),
    para('Le tableau ci-dessous synthétise les intégrations envisagées, avec leur statut de disponibilité identifié à ce jour.'),
    makeTable(
      ['Intégration', 'Usage', 'Statut identifié'],
      [
        ['AMM Madagascar (ex-AGMED)', "Vérification de l'enregistrement des médicaments (module 4)", "Listes PDF périodiques ; pas d'API publique identifiée à ce jour"],
        ['BDPM France — référence de conception', 'Modèle de référentiel médicament complet et ouvert', 'Open data + API REST/GraphQL tierces disponibles'],
        ['openFDA / RxNorm (USA) — référence de conception', 'Modèle de classification et de normalisation des noms de médicaments', 'API publiques gratuites'],
        ['Mobile money (Mvola, Orange Money, Airtel Money)', 'Paiement en caisse', 'À intégrer via les API propres à chaque opérateur'],
        ['Anti-contrefaçon (type mPedigree / Sproxil)', "Vérification d'authenticité produit (optionnel)", "Déployés dans plusieurs pays anglophones d'Afrique ; présence à Madagascar non confirmée"],
      ],
      [2700, 3900, 2400],
    ),
  ];
}

// ---------- Section 5 ----------

function section5() {
  return [
    h1('5. Cadre réglementaire (Madagascar)'),
    h2('5.1 Autorité compétente'),
    para("L'Agence du Médicament de Madagascar (AMM, anciennement AGMED) est l'Établissement Public à caractère Administratif chargé de l'enregistrement des médicaments, de la délivrance des Autorisations de Mise sur le Marché (AMM), de l'inspection des établissements pharmaceutiques et du suivi de la pharmacovigilance."),
    h2('5.2 Base de référence des médicaments enregistrés'),
    para("L'AMM publie, à intervalles réguliers (à peu près mensuels), la « Liste des médicaments enregistrés à Madagascar », disponible en PDF sur son site (amm.mg). En l'absence d'API publique identifiée à ce jour, le système devra intégrer un processus d'import — manuel ou semi-automatisé — de ces publications afin de maintenir à jour le référentiel local du module 4. Une prise de contact directe avec l'AMM est recommandée pour explorer la possibilité d'un accès à des données structurées."),
    h2('5.3 Obligations légales complémentaires'),
    bullet('Respect du Code de la Santé malgache pour la vente, la conservation et la traçabilité des médicaments'),
    bullet('Registre spécifique et sécurisé pour les stupéfiants et substances psychotropes'),
    bullet('Conservation des ordonnances selon la durée légale en vigueur'),
    h2('5.4 Protection des données de santé'),
    para("Le système doit appliquer des principes de protection des données personnelles de santé (consentement, minimisation, sécurisation), à aligner avec la législation malgache applicable. Ce document a une vocation fonctionnelle et ne constitue pas un avis juridique : une validation par un conseil juridique local est recommandée avant mise en production."),
  ];
}

// ---------- Section 6 ----------

function section6() {
  return [
    h1('6. Livrables attendus'),
    bullet('Spécifications techniques détaillées (architecture, modèle de données)'),
    bullet('Maquettes et prototypes des interfaces (caisse, back-office, mobile)'),
    bullet('Application fonctionnelle couvrant a minima les modules du MVP (voir section 7)'),
    bullet("Documentation utilisateur et guide d'administration"),
    bullet('Plan de formation des équipes de l\'officine'),
    bullet('Plan de sauvegarde et de reprise d\'activité'),
  ];
}

// ---------- Section 7 ----------

function section7() {
  return [
    h1('7. Phasage / feuille de route indicative'),
    makeTable(
      ['Phase', 'Modules concernés', 'Objectif'],
      [
        ['Phase 1 — MVP', 'Module 1 (Ventes), Module 2 (Stocks), Module 4 partiel (Référentiel médicament), Module 9 partiel (accès de base)', 'Permettre la vente et la gestion de stock au quotidien avec un référentiel produit fiable'],
        ['Phase 2 — Extension', 'Module 3 (Ordonnances), Module 5 (Patients), Module 6 (Fournisseurs), Module 8 (Conformité)', 'Sécuriser les ordonnances, la relation patient/fournisseurs et la conformité réglementaire'],
        ['Phase 3 — Avancé', 'Module 7 (Finance), Module 10 (Reporting), Module 11 avancé, intégrations mobile money et anti-contrefaçon', 'Piloter la performance financière et ouvrir le système vers l\'extérieur'],
      ],
      [1900, 3550, 3550],
    ),
    para('Ce phasage est indicatif : il devra être ajusté selon les priorités métier, le budget et les ressources de développement disponibles.', { italics: true, color: SUBTLE }),
  ];
}

// ---------- Section 8 ----------

function section8() {
  return [
    h1('8. Critères de réussite / indicateurs'),
    bullet("Réduction du temps moyen d'encaissement"),
    bullet('Réduction du taux de produits périmés non détectés à temps'),
    bullet('Taux de disponibilité du système, y compris en mode hors-ligne'),
    bullet("Taux d'erreurs de saisie produit, avant/après mise en place du référentiel médicament"),
    bullet('Délai de génération des rapports réglementaires'),
  ];
}

// ---------- Section 9 ----------

function section9() {
  return [
    h1('9. Annexes'),
    h2('9.1 Glossaire'),
    bullet('AMM', " : Autorisation de Mise sur le Marché (également nom de l'Agence du Médicament de Madagascar)"),
    bullet('DCI', ' : Dénomination Commune Internationale'),
    bullet('FEFO', ' : First Expired, First Out — méthode de sortie des stocks par date de péremption la plus proche'),
    bullet('OTC', ' : Over The Counter — vente libre, sans ordonnance'),
    bullet('POS', ' : Point Of Sale — point de vente / caisse'),
    bullet('BDPM', ' : Base de Données Publique des Médicaments (France)'),
    bullet('NDC', ' : National Drug Code (États-Unis)'),
    bullet('ATC', ' : Classification Anatomique, Thérapeutique et Chimique (OMS)'),
    h2('9.2 Comparatif des référentiels médicaments évoqués'),
    makeTable(
      ['Pays / zone', 'Base de référence', "Type d'accès identifié"],
      [
        ['Madagascar', 'AMM (ex-AGMED) — Liste des médicaments enregistrés', "PDF périodiques ; pas d'API publique confirmée"],
        ['France', 'BDPM (ANSM)', 'Open data (CSV/JSON) + API REST/GraphQL tierces'],
        ['États-Unis', 'openFDA (NDC) / RxNorm (NLM)', 'API publiques gratuites'],
        ['Afrique anglophone (Ghana, Nigeria, Kenya...)', 'mPedigree / Sproxil', 'Vérification unitaire par SMS (anti-contrefaçon), hors périmètre référentiel produit classique'],
      ],
      [2300, 3400, 3300],
    ),
    h2('9.3 Hypothèses et points ouverts'),
    bullet("Hypothèse : l'officine cible opère initialement sur un site unique (extension multi-officine envisageable en phase 3)"),
    bullet("Point ouvert : modalités exactes d'obtention d'un accès à des données structurées auprès de l'AMM Madagascar, à confirmer directement auprès de l'agence"),
    bullet('Point ouvert : choix définitif de la plateforme technique (web responsive ou application native), à trancher selon les contraintes d\'infrastructure et de connectivité du site'),
  ];
}

// ---------- Assemblage du document ----------

const header = new Header({
  children: [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { color: 'CCCCCC', space: 4, style: BorderStyle.SINGLE, size: 4 } },
      children: [new TextRun({ text: 'Cahier des charges — Gestionnaire de Pharmacie', size: 16, color: '888888' })],
    }),
  ],
});

const footer = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Page ', size: 16, color: '888888' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
        new TextRun({ text: ' / ', size: 16, color: '888888' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888' }),
      ],
    }),
  ],
});

const blankHeader = new Header({ children: [new Paragraph({ text: '' })] });
const blankFooter = new Footer({ children: [new Paragraph({ text: '' })] });

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Calibri', size: 21 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { bold: true, size: 30, color: PRIMARY, font: 'Calibri' },
        paragraph: { spacing: { before: 480, after: 220 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { bold: true, size: 24, color: ACCENT, font: 'Calibri' },
        paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0, format: LevelFormat.BULLET, text: '●', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 460, hanging: 260 } } },
          },
          {
            level: 1, format: LevelFormat.BULLET, text: '○', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 920, hanging: 260 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        titlePage: true,
      },
      headers: { default: header, first: blankHeader },
      footers: { default: footer, first: blankFooter },
      children: [
        ...titlePage(),
        new Paragraph({
          children: [new TextRun({ text: 'Table des matières', bold: true, size: 32, color: PRIMARY })],
          spacing: { after: 200 },
        }),
        new TableOfContents('Table des matières', { hyperlink: true, headingStyleRange: '1-2' }),
        pageBreak(),
        ...section1(),
        ...section2(),
        ...section3(),
        pageBreak(),
        ...section4(),
        ...section5(),
        ...section6(),
        ...section7(),
        ...section8(),
        pageBreak(),
        ...section9(),
      ],
    },
  ],
});

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync(OUTPUT_FILE, buffer);
    console.log(`OK: document généré → ${OUTPUT_FILE}`);
  })
  .catch((err) => {
    console.error('ERREUR:', err);
    process.exit(1);
  });

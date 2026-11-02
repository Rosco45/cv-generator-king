export const SECTION_LABELS = {
  fr: {
    profil: 'Profil Professionnel',
    experiences: 'Expériences Professionnelles',
    formations: 'Formations & Diplômes',
    competences: 'Compétences Clés',
    langues: 'Langues',
    certifications: 'Certifications',
    projets: 'Projets Réalisés',
    centresInteret: "Centres d'intérêt",
    contact: 'Coordonnées',
    permis: 'Permis de conduire',
    present: 'Présent',
  },
  en: {
    profil: 'Professional Summary',
    experiences: 'Work Experience',
    formations: 'Education',
    competences: 'Core Skills',
    langues: 'Languages',
    certifications: 'Certifications',
    projets: 'Key Projects',
    centresInteret: 'Interests',
    contact: 'Contact Info',
    permis: 'Driving License',
    present: 'Present',
  },
  es: {
    profil: 'Perfil Profesional',
    experiences: 'Experiencia Laboral',
    formations: 'Educación y Formación',
    competences: 'Habilidades Clave',
    langues: 'Idiomas',
    certifications: 'Certificaciones',
    projets: 'Proyectos Destacados',
    centresInteret: 'Intereses',
    contact: 'Contacto',
    permis: 'Permiso de conducir',
    present: 'Actualidad',
  },
  de: {
    profil: 'Berufsprofil',
    experiences: 'Berufserfahrung',
    formations: 'Ausbildung & Studium',
    competences: 'Kernkompetenzen',
    langues: 'Sprachen',
    certifications: 'Zertifizierungen',
    projets: 'Projekte',
    centresInteret: 'Interessen',
    contact: 'Kontakt',
    permis: 'Führerschein',
    present: 'Heute',
  },
};

export const TEMPLATES = [
  {
    id: 'imported_clone',
    name: 'Design Original (Importé)',
    badge: '👑 Fidélité CV',
    description: 'Reproduit fidèlement la mise en page, les couleurs et la structure du CV que vous avez importé.',
  },
  {
    id: 'sidebar_left',
    name: 'Sidebar Gauche',
    badge: 'Populaire',
    description: 'Colonne latérale gauche colorée pour les contacts et compétences, corps principal aéré.',
  },
  {
    id: 'modern',
    name: 'Moderne',
    badge: 'ATS Pro',
    description: 'Structure contemporaine à deux colonnes équilibrées avec accents visuels dynamiques.',
  },
  {
    id: 'fancy_header',
    name: 'Élégant (Bandeau)',
    badge: 'Royal',
    description: 'Grand bandeau supérieur en couleur avec photo mise en valeur et corps structuré.',
  },
  {
    id: 'sidebar_right',
    name: 'Sidebar Droite',
    badge: 'Créatif',
    description: 'Expériences en lecture prioritaire à gauche et colonne de synthèse à droite.',
  },
  {
    id: 'executive',
    name: 'Exécutif Royal',
    badge: 'Direction',
    description: 'Style prestige avec filets dorés/accentués, idéal pour cadres, ingénieurs seniors et dirigeants.',
  },
  {
    id: 'classic',
    name: 'Classique',
    badge: '100% ATS',
    description: 'Mise en page traditionnelle mono-colonne ultra-lisible par tous les logiciels de recrutement.',
  },
  {
    id: 'creative',
    name: 'Créatif Studio',
    badge: 'Design',
    description: 'Cartes de sections stylisées, badges arrondis et hiérarchie visuelle audacieuse.',
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    badge: 'Épuré',
    description: 'Typographie soignée, espaces blancs généreux et élégance sobre.',
  },
];

export const ROYAL_PALETTES = [
  { name: 'Bleu Royal', primary: '#1e40af', secondary: '#d4af37', sidebarBg: '#1e3a8a', sidebarText: '#ffffff' },
  { name: 'Or Impérial & Nuit', primary: '#0f172a', secondary: '#d97706', sidebarBg: '#0f172a', sidebarText: '#f8fafc' },
  { name: 'Émeraude Prestige', primary: '#065f46', secondary: '#10b981', sidebarBg: '#064e3b', sidebarText: '#ffffff' },
  { name: 'Bordeaux Noble', primary: '#881337', secondary: '#f43f5e', sidebarBg: '#4c0519', sidebarText: '#ffffff' },
  { name: 'Violet Souverain', primary: '#5b21b6', secondary: '#8b5cf6', sidebarBg: '#3b0764', sidebarText: '#ffffff' },
  { name: 'Océan Azur', primary: '#0369a1', secondary: '#38bdf8', sidebarBg: '#0c4a6e', sidebarText: '#ffffff' },
  { name: 'Ardoise Moderne', primary: '#334155', secondary: '#64748b', sidebarBg: '#1e293b', sidebarText: '#f8fafc' },
  { name: 'Terracotta Créatif', primary: '#c2410c', secondary: '#fb923c', sidebarBg: '#7c2d12', sidebarText: '#ffffff' },
];

export const FONTS = [
  { id: 'Inter', name: 'Inter (Moderne & Net)', family: "'Inter', sans-serif" },
  { id: 'Poppins', name: 'Poppins (Géométrique & Dynamique)', family: "'Poppins', sans-serif" },
  { id: 'Roboto', name: 'Roboto (Standard ATS)', family: "'Roboto', sans-serif" },
  { id: 'Merriweather', name: 'Merriweather (Sérif Classique)', family: "'Merriweather', Georgia, serif" },
  { id: 'Playfair Display', name: 'Playfair Display (Prestige & Luxe)', family: "'Playfair Display', Georgia, serif" },
];

export const DEFAULT_CV = {
  id: 'cv-king-default',
  versionName: 'CV Principal',
  lastModified: new Date().toISOString(),
  langueCV: 'fr',
  personnel: {
    nomComplet: 'Alexandre Mercier',
    titrePoste: 'Architecte Full-Stack & Ingénieur IA Senior',
    email: 'alexandre.mercier@email.com',
    telephone: '+33 6 45 78 90 12',
    adresse: 'Paris, France (Télétravail / Hybride)',
    linkedin: 'linkedin.com/in/alexandre-mercier',
    github: 'github.com/amercier-dev',
    siteWeb: 'alexandre-mercier.dev',
    permisDeConduire: 'Permis B — Véhiculé',
    photo: '',
    resume:
      "Ingénieur Full-Stack et Architecte Cloud avec plus de 6 ans d'expérience dans la conception d'applications web haute performance et l'intégration de solutions d'Intelligence Artificielle générative. Orienté résultats, j'accompagne les équipes techniques de l'architecture au déploiement en production avec une exigence constante de qualité, de sécurité et d'expérience utilisateur.",
  },
  experiences: [
    {
      id: 'exp-1',
      poste: 'Lead Développeur Full-Stack & IA',
      entreprise: 'NovaTech Solutions — Paris',
      dateDebut: 'Jan 2023',
      dateFin: 'Présent',
      description:
        "• Architecture et développement d'une plateforme SaaS B2B en React, TypeScript, Node.js et PostgreSQL (+120 000 utilisateurs actifs).\n• Intégration de pipelines LLM et d'analyse documentaire automatisée réduisant le temps de traitement client de 65%.\n• Encadrement technique d'une équipe Agile de 7 développeurs, revues de code et CI/CD sur AWS & Docker.",
    },
    {
      id: 'exp-2',
      poste: 'Ingénieur Logiciel Full-Stack',
      entreprise: 'KlipMedia Digital — Lyon',
      dateDebut: 'Sept 2020',
      dateFin: 'Déc 2022',
      description:
        "• Conception et refonte complète d'applications web et mobiles (React, React Native, FastAPI, MongoDB).\n• Optimisation des performances front-end et API (temps de réponse divisé par 2, score Lighthouse 98/100).\n• Mise en place de tests automatisés (Jest, Playwright) et déploiement continu.",
    },
    {
      id: 'exp-3',
      poste: 'Développeur Web Front-End & Back-End',
      entreprise: 'Studio WebCréa — Bordeaux',
      dateDebut: 'Fév 2019',
      dateFin: 'Août 2020',
      description:
        "• Développement de portails métiers sur-mesure et plateformes e-commerce (Vue.js, Laravel, MySQL).\n• Collaboration étroite avec les designers UI/UX pour garantir une accessibilité et un responsive design irréprochables.",
    },
  ],
  formations: [
    {
      id: 'form-1',
      diplome: 'Master Ingénierie Informatique, Cloud & IA',
      ecole: 'Institut Polytechnique / Université Paris-Saclay',
      dateDebut: '2017',
      dateFin: '2019',
      description: 'Spécialisation Architecture Logicielle, Systèmes Distribués et Apprentissage Automatique. Mention Bien.',
    },
    {
      id: 'form-2',
      diplome: 'Licence Informatique & Mathématiques Appliquées',
      ecole: 'Université de Bordeaux',
      dateDebut: '2014',
      dateFin: '2017',
      description: 'Algorithmique avancée, Bases de données relationnelles, Réseaux et Génie logiciel.',
    },
  ],
  competences: [
    { id: 'comp-1', nom: 'React / Next.js', niveau: 95, categorie: 'Frontend' },
    { id: 'comp-2', nom: 'TypeScript / JavaScript', niveau: 95, categorie: 'Langages' },
    { id: 'comp-3', nom: 'Node.js / Express / FastAPI', niveau: 90, categorie: 'Backend' },
    { id: 'comp-4', nom: 'Python & IA Générative (LLM)', niveau: 85, categorie: 'IA & Data' },
    { id: 'comp-5', nom: 'PostgreSQL / MongoDB / Redis', niveau: 88, categorie: 'Base de données' },
    { id: 'comp-6', nom: 'Docker / Kubernetes / AWS', niveau: 85, categorie: 'DevOps & Cloud' },
    { id: 'comp-7', nom: 'Tailwind CSS & Design System', niveau: 92, categorie: 'UI/UX' },
    { id: 'comp-8', nom: 'Architecture Microservices & CI/CD', niveau: 88, categorie: 'Architecture' },
  ],
  langues: [
    { id: 'lang-1', nom: 'Français', niveau: 'Langue maternelle (C2)' },
    { id: 'lang-2', nom: 'Anglais', niveau: 'Courant professionnel (C1 - TOEIC 945)' },
    { id: 'lang-3', nom: 'Espagnol', niveau: 'Intermédiaire (B2)' },
  ],
  certifications: [
    { id: 'cert-1', nom: 'AWS Certified Solutions Architect – Associate', organisme: 'Amazon Web Services', date: '2024' },
    { id: 'cert-2', nom: 'Professional Scrum Master I (PSM I)', organisme: 'Scrum.org', date: '2023' },
  ],
  projets: [
    {
      id: 'proj-1',
      nom: 'CV Generator King',
      technologies: 'React, Tailwind CSS, PDF.js, DOCX, IA',
      lien: 'github.com/amercier-dev/cv-generator-king',
      description: 'Application royale de génération et d’édition intelligente de CV multi-formats avec conservation du design.',
    },
    {
      id: 'proj-2',
      nom: 'CloudGuard Monitor',
      technologies: 'Go, React, Docker, Prometheus',
      lien: 'github.com/amercier-dev/cloudguard',
      description: 'Tableau de bord open-source de supervision de clusters Cloud en temps réel.',
    },
  ],
  centresInteret: [
    { id: 'int-1', nom: 'Veille technologique & Open Source' },
    { id: 'int-2', nom: 'Cybersécurité & CTF' },
    { id: 'int-3', nom: 'Échecs en compétition' },
    { id: 'int-4', nom: 'Photographie & Voyage' },
  ],
  parametres: {
    template: 'sidebar_left',
    couleurPrincipale: '#1e40af',
    couleurSecondaire: '#d4af37',
    sidebarBg: '#1e3a8a',
    sidebarText: '#ffffff',
    headerBg: '#1e40af',
    headerText: '#ffffff',
    police: 'Inter',
    taillePolice: 'normal', // 'compact' | 'normal' | 'large'
    espacement: 'normal', // 'compact' | 'normal' | 'aere'
    formePhoto: 'circle', // 'circle' | 'rounded' | 'square' | 'none'
    afficherBarresCompetences: true,
    afficherQrCode: true,
    qrCodeUrl: 'https://linkedin.com/in/alexandre-mercier',
    modeEditionDirecteSurOriginal: false, // Bascule entre le CV reconstruit au design fidèle et le calque PDF/Image original pixel-perfect
  },
  // Métadonnées du design original lorsqu'un CV existant est importé
  importedDesign: null,
  // Lettre de motivation assortie
  lettreMotivation: {
    destinataireNom: 'Service Recrutement',
    destinataireEntreprise: 'Entreprise Cible',
    destinataireAdresse: 'Paris, France',
    objet: 'Candidature au poste de Lead Développeur Full-Stack & IA',
    lieuDate: `Paris, le ${new Date().toLocaleDateString('fr-FR')}`,
    corps: `Madame, Monsieur,\n\nPassionné par l'architecture logicielle et les technologies web modernes, je vous soumets ma candidature pour le poste de Lead Développeur Full-Stack au sein de votre organisation.\n\nAu cours de mes 6 années d'expérience, et notamment chez NovaTech Solutions, j'ai piloté la conception d'applications critiques à fort trafic tout en intégrant des briques d'intelligence artificielle qui ont réduit de 65% les délais de traitement métier. Mon expertise couvre l'ensemble de la chaîne de valeur technique : du front-end réactif (React, TypeScript) aux architectures cloud résilientes (Node.js, Python, Docker, AWS).\n\nRejoindre votre équipe serait pour moi l'opportunité de mettre ma rigueur technique, mon sens du leadership bienveillant et ma capacité d'innovation au service de vos projets les plus ambitieux.\n\nJe me tiens à votre entière disposition pour un entretien afin d'échanger sur la manière dont mes compétences pourront contribuer concrètement à vos objectifs.\n\nDans cette attente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
};

export function createBlankCV() {
  return {
    ...DEFAULT_CV,
    id: 'cv-' + Date.now(),
    versionName: 'Nouveau CV Vierge',
    lastModified: new Date().toISOString(),
    personnel: {
      nomComplet: '',
      titrePoste: '',
      email: '',
      telephone: '',
      adresse: '',
      linkedin: '',
      github: '',
      siteWeb: '',
      permisDeConduire: '',
      photo: '',
      resume: '',
    },
    experiences: [],
    formations: [],
    competences: [],
    langues: [],
    certifications: [],
    projets: [],
    centresInteret: [],
    importedDesign: null,
    parametres: {
      ...DEFAULT_CV.parametres,
      template: 'modern',
      afficherQrCode: false,
      modeEditionDirecteSurOriginal: false,
    },
  };
}

export const PRESET_PROFILES = [
  {
    id: 'fullstack',
    label: 'Ingénieur Full-Stack & IA',
    cv: DEFAULT_CV,
  },
  {
    id: 'marketing',
    label: 'Directrice Marketing & Growth',
    cv: {
      ...DEFAULT_CV,
      id: 'cv-marketing',
      versionName: 'Profil Marketing',
      personnel: {
        nomComplet: 'Camille Laurent',
        titrePoste: 'Directrice Marketing Digital & Acquisition (CMO)',
        email: 'camille.laurent@email.fr',
        telephone: '+33 6 82 14 59 03',
        adresse: 'Lyon, France',
        linkedin: 'linkedin.com/in/camille-laurent-cmo',
        github: '',
        siteWeb: 'camillelaurent-growth.fr',
        permisDeConduire: 'Permis B',
        photo: '',
        resume:
          "Stratège Marketing Digital avec 8 ans d'expérience dans l'accélération de la croissance B2B & B2C. Experte en acquisition payante (SEA/Social Ads), SEO, Marketing Automation et pilotage du ROI. Habituée à diriger des équipes pluridisciplinaires pour doubler le pipeline commercial.",
      },
      experiences: [
        {
          id: 'm-exp-1',
          poste: 'Head of Growth & Marketing Digital',
          entreprise: 'ScaleUp Pay — Lyon',
          dateDebut: 'Mars 2022',
          dateFin: 'Présent',
          description:
            "• Pilotage d'un budget média annuel de 1,2M€ avec une réduction du coût d'acquisition client (CAC) de 38%.\n• Croissance du trafic organique SEO de +210% en 18 mois via une stratégie de contenu ciblée.\n• Management d'une équipe de 6 spécialistes (SEO, Paid Media, CRM, Brand Design).",
        },
        {
          id: 'm-exp-2',
          poste: 'Responsable Acquisition & CRM',
          entreprise: 'Maison Éclat — Paris',
          dateDebut: 'Sept 2019',
          dateFin: 'Fév 2022',
          description:
            "• Déploiement de HubSpot et automatisation des parcours d'onboarding (+45% de taux de conversion Lead-to-Customer).\n• Lancement de campagnes internationales en France, Belgique et Suisse.",
        },
      ],
      competences: [
        { id: 'mc-1', nom: 'Stratégie Growth & Acquisition', niveau: 95 },
        { id: 'mc-2', nom: 'Google Ads / Meta Ads / LinkedIn Ads', niveau: 92 },
        { id: 'mc-3', nom: 'SEO Technique & Éditorial', niveau: 90 },
        { id: 'mc-4', nom: 'HubSpot / Salesforce / CRM', niveau: 90 },
        { id: 'mc-5', nom: 'Google Analytics 4 & Data Studio', niveau: 88 },
        { id: 'mc-6', nom: 'Management & Pilotage Budgétaire', niveau: 94 },
      ],
      parametres: {
        ...DEFAULT_CV.parametres,
        template: 'fancy_header',
        couleurPrincipale: '#881337',
        couleurSecondaire: '#f43f5e',
        sidebarBg: '#4c0519',
        headerBg: '#881337',
        police: 'Playfair Display',
      },
    },
  },
  {
    id: 'finance',
    label: 'Contrôleur de Gestion / Finance',
    cv: {
      ...DEFAULT_CV,
      id: 'cv-finance',
      versionName: 'Profil Finance & Audit',
      personnel: {
        nomComplet: 'Thomas Delacroix',
        titrePoste: 'Responsable Contrôle de Gestion & FP&A',
        email: 't.delacroix@finance-pro.fr',
        telephone: '+33 6 19 28 37 46',
        adresse: 'Paris La Défense, France',
        linkedin: 'linkedin.com/in/thomas-delacroix-fpa',
        github: '',
        siteWeb: '',
        permisDeConduire: 'Permis B',
        photo: '',
        resume:
          "Responsable Financier et Contrôleur de Gestion Senior fort de 7 ans d'expérience en cabinet d'audit Big 4 et en direction financière internationale. Spécialiste du pilotage budgétaire, de la modélisation financière (Power BI, SAP) et de l'optimisation de la rentabilité opérationnelle.",
      },
      experiences: [
        {
          id: 'f-exp-1',
          poste: 'Responsable Contrôle de Gestion Groupe',
          entreprise: 'AéroIndustrie Europe — Paris',
          dateDebut: 'Jan 2022',
          dateFin: 'Présent',
          description:
            "• Supervision du processus budgétaire et des clôtures mensuelles pour 5 filiales européennes (CA : 180M€).\n• Automatisation des tableaux de bord financiers sous Power BI et SAP S/4HANA (gain de 4 jours par clôture).\n• Accompagnement stratégique du COMEX dans l'amélioration de l'EBITDA (+3,2 points).",
        },
        {
          id: 'f-exp-2',
          poste: 'Auditeur Financier Senior',
          entreprise: 'Deloitte — Paris La Défense',
          dateDebut: 'Sept 2018',
          dateFin: 'Déc 2021',
          description:
            "• Audit légal et contractuel des comptes consolidés (normes IFRS et French GAAP) de grands groupes cotés.\n• Évaluation du contrôle interne et recommandations d'optimisation des flux de trésorerie.",
        },
      ],
      competences: [
        { id: 'fc-1', nom: 'Pilotage Budgétaire & Forecast (FP&A)', niveau: 96 },
        { id: 'fc-2', nom: 'SAP S/4HANA & Oracle NetSuite', niveau: 90 },
        { id: 'fc-3', nom: 'Power BI, DAX & Excel VBA Avancé', niveau: 95 },
        { id: 'fc-4', nom: 'Normes IFRS & Consolidation', niveau: 88 },
        { id: 'fc-5', nom: 'Analyse de Rentabilité & Cash-Flow', niveau: 92 },
      ],
      parametres: {
        ...DEFAULT_CV.parametres,
        template: 'executive',
        couleurPrincipale: '#0f172a',
        couleurSecondaire: '#d97706',
        sidebarBg: '#0f172a',
        headerBg: '#0f172a',
        police: 'Merriweather',
      },
    },
  },
];

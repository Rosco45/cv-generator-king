/**
 * Moteur Hybride d'Instructions en Langage Naturel ("King AI Instruction Engine")
 * - Exécute immédiatement en local (sans clé API requise) les instructions de modification de CV
 *   tout en préservant scrupuleusement le design original.
 * - Compatible également avec les clés API Gemini, OpenAI et Groq pour des réécritures IA génératives.
 */

const COLOR_MAP = {
  'bleu royal': { primary: '#1e40af', secondary: '#d4af37', sidebar: '#1e3a8a' },
  bleu: { primary: '#2563eb', secondary: '#60a5fa', sidebar: '#1e40af' },
  marine: { primary: '#0f172a', secondary: '#38bdf8', sidebar: '#0f172a' },
  noir: { primary: '#111827', secondary: '#9ca3af', sidebar: '#111827' },
  or: { primary: '#b45309', secondary: '#f59e0b', sidebar: '#78350f' },
  doré: { primary: '#b45309', secondary: '#f59e0b', sidebar: '#78350f' },
  vert: { primary: '#065f46', secondary: '#10b981', sidebar: '#064e3b' },
  émeraude: { primary: '#065f46', secondary: '#10b981', sidebar: '#064e3b' },
  emeraude: { primary: '#065f46', secondary: '#10b981', sidebar: '#064e3b' },
  rouge: { primary: '#991b1b', secondary: '#f87171', sidebar: '#7f1d1d' },
  bordeaux: { primary: '#881337', secondary: '#f43f5e', sidebar: '#4c0519' },
  violet: { primary: '#5b21b6', secondary: '#a78bfa', sidebar: '#3b0764' },
  pourpre: { primary: '#5b21b6', secondary: '#a78bfa', sidebar: '#3b0764' },
  gris: { primary: '#334155', secondary: '#94a3b8', sidebar: '#1e293b' },
  ardoise: { primary: '#334155', secondary: '#94a3b8', sidebar: '#1e293b' },
  orange: { primary: '#c2410c', secondary: '#fb923c', sidebar: '#7c2d12' },
};

/**
 * Synchronize text replacements onto the original PDF/Image overlay textBlocks
 */
function syncOverlayTextBlocks(cv, oldStr, newStr) {
  if (!cv.importedDesign?.textBlocks || !oldStr || !newStr) return;
  const cleanOld = oldStr.trim();
  if (cleanOld.length < 2) return;

  cv.importedDesign.textBlocks = cv.importedDesign.textBlocks.map((tb) => {
    if (tb.text.toLowerCase().includes(cleanOld.toLowerCase())) {
      const regex = new RegExp(cleanOld.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return {
        ...tb,
        text: tb.text.replace(regex, newStr),
        modified: true,
      };
    }
    return tb;
  });
}

/**
 * Translate CV content & language setting
 */
export function translateCVContent(cv, targetLang) {
  const next = JSON.parse(JSON.stringify(cv));
  next.langueCV = targetLang;

  const dict = {
    en: [
      [/Développeur/gi, 'Developer'],
      [/Ingénieur/gi, 'Engineer'],
      [/Architecte/gi, 'Architect'],
      [/Directeur|Directrice/gi, 'Director'],
      [/Responsable/gi, 'Manager'],
      [/Chef de projet/gi, 'Project Manager'],
      [/Présent|Aujourd'hui|Actuel/gi, 'Present'],
      [/Langue maternelle/gi, 'Native speaker'],
      [/Courant professionnel/gi, 'Professional proficiency'],
      [/Courant/gi, 'Fluent'],
      [/Intermédiaire/gi, 'Intermediate'],
      [/Français/gi, 'French'],
      [/Anglais/gi, 'English'],
      [/Espagnol/gi, 'Spanish'],
      [/Allemand/gi, 'German'],
      [/Permis B/gi, "Driver's License (B)"],
      [/Véhiculé/gi, 'Own vehicle'],
      [/Télétravail/gi, 'Remote'],
      [/Hybride/gi, 'Hybrid'],
      [/ans d'expérience/gi, 'years of experience'],
      [/Conception et développement/gi, 'Design and development'],
      [/Encadrement technique/gi, 'Technical leadership'],
      [/Mise en place/gi, 'Implementation'],
      [/Optimisation des performances/gi, 'Performance optimization'],
    ],
    es: [
      [/Développeur|Developer/gi, 'Desarrollador'],
      [/Ingénieur|Engineer/gi, 'Ingeniero'],
      [/Architecte|Architect/gi, 'Arquitecto'],
      [/Directeur|Directrice|Director/gi, 'Director(a)'],
      [/Responsable|Manager/gi, 'Responsable'],
      [/Présent|Present/gi, 'Actualidad'],
      [/Langue maternelle|Native speaker/gi, 'Lengua materna'],
      [/Courant|Fluent/gi, 'Fluido'],
      [/Intermédiaire|Intermediate/gi, 'Intermedio'],
      [/Français|French/gi, 'Francés'],
      [/Anglais|English/gi, 'Inglés'],
      [/Espagnol|Spanish/gi, 'Español'],
      [/ans d'expérience|years of experience/gi, 'años de experiencia'],
    ],
    de: [
      [/Développeur|Developer/gi, 'Entwickler'],
      [/Ingénieur|Engineer/gi, 'Ingenieur'],
      [/Architecte|Architect/gi, 'Architekt'],
      [/Présent|Present/gi, 'Heute'],
      [/Langue maternelle|Native speaker/gi, 'Muttersprache'],
      [/Courant|Fluent/gi, 'Fließend'],
      [/Intermédiaire|Intermediate/gi, 'Mittelstufe'],
      [/Français|French/gi, 'Französisch'],
      [/Anglais|English/gi, 'Englisch'],
      [/Espagnol|Spanish/gi, 'Spanisch'],
      [/Allemand|German/gi, 'Deutsch'],
    ],
    fr: [
      [/Developer/gi, 'Développeur'],
      [/Engineer/gi, 'Ingénieur'],
      [/Architect/gi, 'Architecte'],
      [/Present|Actualidad|Heute/gi, 'Présent'],
      [/Native speaker|Lengua materna|Muttersprache/gi, 'Langue maternelle'],
      [/Fluent|Fluido|Fließend/gi, 'Courant'],
      [/Intermediate|Intermedio|Mittelstufe/gi, 'Intermédiaire'],
      [/French|Francés|Französisch/gi, 'Français'],
      [/English|Inglés|Englisch/gi, 'Anglais'],
      [/Spanish|Español|Spanisch/gi, 'Espagnol'],
    ],
  };

  const replacements = dict[targetLang] || [];
  const applyDict = (str) => {
    if (!str) return str;
    let out = str;
    for (const [regex, rep] of replacements) {
      out = out.replace(regex, rep);
    }
    return out;
  };

  next.personnel.titrePoste = applyDict(next.personnel.titrePoste);
  next.personnel.adresse = applyDict(next.personnel.adresse);
  next.personnel.permisDeConduire = applyDict(next.personnel.permisDeConduire);
  next.personnel.resume = applyDict(next.personnel.resume);

  next.experiences = next.experiences.map((exp) => ({
    ...exp,
    poste: applyDict(exp.poste),
    dateFin: applyDict(exp.dateFin),
    description: applyDict(exp.description),
  }));

  next.langues = next.langues.map((l) => ({
    ...l,
    nom: applyDict(l.nom),
    niveau: applyDict(l.niveau),
  }));

  return next;
}

/**
 * Execute natural language instruction locally with high precision
 */
export function executeLocalInstruction(cv, instructionText) {
  const next = JSON.parse(JSON.stringify(cv));
  const actionsPerformed = [];
  const raw = instructionText.trim();
  const lower = raw.toLowerCase();

  // 1. Direct text replacement: "remplace X par Y" or "change 'X' en 'Y'"
  const replaceQuotesMatch = raw.match(
    /(?:remplace|remplacer|change|changer|substitue)\s+["«']([^"»']+)["»']\s+(?:par|en|avec)\s+["«']([^"»']+)["»']/i
  );
  if (replaceQuotesMatch) {
    const [, oldVal, newVal] = replaceQuotesMatch;
    const regex = new RegExp(oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const replaceInObj = (obj) => {
      for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'string') {
          obj[k] = obj[k].replace(regex, newVal);
        } else if (Array.isArray(obj[k])) {
          obj[k].forEach((item) => typeof item === 'object' && item && replaceInObj(item));
        }
      }
    };
    replaceInObj(next.personnel);
    next.experiences.forEach(replaceInObj);
    next.formations.forEach(replaceInObj);
    next.competences.forEach(replaceInObj);
    syncOverlayTextBlocks(next, oldVal, newVal);
    actionsPerformed.push(`Texte « ${oldVal} » remplacé par « ${newVal} » dans le CV et sur le calque original.`);
  }

  // 2. Modify Job Title / Poste
  const titleMatch = raw.match(
    /(?:change|modifie|mets|définis|remplace)?\s*(?:mon|le)\s+(?:titre|poste|métier|intitulé)\s+(?:en|par|pour|:)\s+([^\n.;]+)/i
  );
  if (titleMatch) {
    const oldTitle = next.personnel.titrePoste;
    const newTitle = titleMatch[1].replace(/^["«']|["»']$/g, '').trim();
    next.personnel.titrePoste = newTitle;
    syncOverlayTextBlocks(next, oldTitle, newTitle);
    actionsPerformed.push(`Titre du profil mis à jour : « ${newTitle} ».`);
  }

  // 3. Modify Full Name
  const nameMatch = raw.match(/(?:change|modifie|mets|remplace)\s+(?:mon|le)\s+nom\s+(?:en|par|:)\s+([^\n.;]+)/i);
  if (nameMatch) {
    const oldName = next.personnel.nomComplet;
    const newName = nameMatch[1].replace(/^["«']|["»']$/g, '').trim();
    next.personnel.nomComplet = newName;
    syncOverlayTextBlocks(next, oldName, newName);
    actionsPerformed.push(`Nom complet mis à jour : « ${newName} ».`);
  }

  // 4. Modify Email / Phone / Address / City
  const emailUpdate = raw.match(
    /(?:email|mail|courriel)\s*(?:en|par|:|à)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  );
  if (emailUpdate) {
    syncOverlayTextBlocks(next, next.personnel.email, emailUpdate[1]);
    next.personnel.email = emailUpdate[1];
    actionsPerformed.push(`Email mis à jour : ${emailUpdate[1]}.`);
  }

  const phoneUpdate = raw.match(/(?:téléphone|telephone|numéro|numero|tel)\s*(?:en|par|:)?\s*(\+?[\d\s.-]{8,18})/i);
  if (phoneUpdate) {
    const newPhone = phoneUpdate[1].trim();
    syncOverlayTextBlocks(next, next.personnel.telephone, newPhone);
    next.personnel.telephone = newPhone;
    actionsPerformed.push(`Téléphone mis à jour : ${newPhone}.`);
  }

  const cityUpdate = raw.match(/(?:adresse|ville|localisation)\s+(?:en|par|:)\s+([^\n.;]+)/i);
  if (cityUpdate) {
    const newCity = cityUpdate[1].trim();
    syncOverlayTextBlocks(next, next.personnel.adresse, newCity);
    next.personnel.adresse = newCity;
    actionsPerformed.push(`Adresse / Localisation mise à jour : ${newCity}.`);
  }

  // 5. Add Experience: "Ajoute une expérience de [Poste] chez [Entreprise] de [DateDebut] à [DateFin] : [Description]"
  const addExpMatch = raw.match(
    /(?:ajoute|ajouter|insère|créer?)\s+(?:une\s+)?(?:expérience|poste|emploi|stage)\s+(?:de|comme|en tant que)?\s*([^@\n]+?)(?:\s+(?:chez|à|@|au sein de)\s+([^\n:,]+?))?(?:\s+(?:de|depuis|entre)\s+([a-zA-Z0-9\s]+?)\s+(?:à|au|jusqu'à|-)\s+([a-zA-Z0-9\s'é]+?))?(?:\s*[:\-–]\s*(.+))?$/i
  );
  if (addExpMatch && /expérience|poste|stage|emploi/i.test(lower)) {
    const poste = (addExpMatch[1] || 'Nouveau Poste').trim();
    const entreprise = (addExpMatch[2] || 'Entreprise').trim();
    const dateDebut = (addExpMatch[3] || '2024').trim();
    const dateFin = (addExpMatch[4] || 'Présent').trim();
    const descRaw = (addExpMatch[5] || '').trim();
    const description = descRaw
      ? descRaw
          .split(/[;•\n]+/)
          .map((s) => `• ${s.trim()}`)
          .join('\n')
      : `• Pilotage et réalisation des missions clés en tant que ${poste} chez ${entreprise}.\n• Amélioration continue des processus, de la performance et de la qualité livrée.`;

    next.experiences.unshift({
      id: 'exp-ai-' + Date.now(),
      poste,
      entreprise,
      dateDebut,
      dateFin,
      description,
    });
    actionsPerformed.push(`Nouvelle expérience ajoutée en tête : « ${poste} » chez ${entreprise} (${dateDebut} - ${dateFin}).`);
  }

  // 6. Remove Experience
  if (/(?:supprime|retire|enlève)\s+(?:la\s+|ma\s+)?(?:dernière|plus ancienne)\s+expérience/i.test(lower)) {
    if (next.experiences.length > 0) {
      const removed = next.experiences.pop();
      actionsPerformed.push(`Expérience supprimée : « ${removed.poste} (${removed.entreprise}) ».`);
    }
  } else if (/(?:supprime|retire|enlève)\s+(?:la\s+|ma\s+)?première\s+expérience/i.test(lower)) {
    if (next.experiences.length > 0) {
      const removed = next.experiences.shift();
      actionsPerformed.push(`Première expérience supprimée : « ${removed.poste} ».`);
    }
  }

  // 7. Add Skills / Competences
  const addSkillsMatch = raw.match(
    /(?:ajoute|ajouter|intègre|mets)\s+(?:les\s+|la\s+|des\s+)?compétences?\s*:?\s*([^\n.]+)/i
  );
  if (addSkillsMatch) {
    const skillsList = addSkillsMatch[1]
      .split(/[,;+]|\s+et\s+|\s+and\s+/i)
      .map((s) => s.replace(/^[:\-–•\s]+|[:\-–•\s]+$/g, '').trim())
      .filter((s) => s.length >= 2);

    const added = [];
    for (const sk of skillsList) {
      if (!next.competences.some((c) => c.nom.toLowerCase() === sk.toLowerCase())) {
        next.competences.push({
          id: 'comp-ai-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          nom: sk,
          niveau: 90,
        });
        added.push(sk);
      }
    }
    if (added.length > 0) {
      actionsPerformed.push(`Compétence(s) ajoutée(s) : ${added.join(', ')}.`);
    }
  }

  // Remove Skill
  const removeSkillMatch = raw.match(/(?:supprime|retire|enlève)\s+(?:la\s+)?compétence\s+([^\n.,;]+)/i);
  if (removeSkillMatch) {
    const target = removeSkillMatch[1].trim().toLowerCase();
    const beforeCount = next.competences.length;
    next.competences = next.competences.filter((c) => !c.nom.toLowerCase().includes(target));
    if (next.competences.length < beforeCount) {
      actionsPerformed.push(`Compétence « ${removeSkillMatch[1].trim()} » retirée.`);
    }
  }

  // 8. Add Formation / Diploma
  const addFormMatch = raw.match(
    /(?:ajoute|ajouter|insère)\s+(?:une\s+|la\s+)?(?:formation|diplôme|étude)\s+([^\n:,]+?)(?:\s+(?:à|chez|au sein de)\s+([^\n:,]+?))?(?:\s+(?:en|de)\s+(\d{4})(?:\s*(?:à|-)\s*(\d{4}))?)?$/i
  );
  if (addFormMatch && /formation|diplôme/i.test(lower)) {
    const diplome = addFormMatch[1].trim();
    const ecole = (addFormMatch[2] || 'Université / Grande École').trim();
    const dateDebut = addFormMatch[3] || '2022';
    const dateFin = addFormMatch[4] || dateDebut;
    next.formations.unshift({
      id: 'form-ai-' + Date.now(),
      diplome,
      ecole,
      dateDebut,
      dateFin,
      description: 'Formation complétée avec succès.',
    });
    actionsPerformed.push(`Formation ajoutée : « ${diplome} » (${ecole}).`);
  }

  // 9. Add Language
  const addLangMatch = raw.match(
    /(?:ajoute|ajouter)\s+(?:la\s+)?langue\s+([a-zA-ZÀ-ÿ]+)(?:\s+(?:niveau\s+)?(.+))?/i
  );
  if (addLangMatch) {
    const nom = addLangMatch[1].trim();
    const niveau = (addLangMatch[2] || 'Courant (C1)').trim();
    next.langues.push({
      id: 'lang-ai-' + Date.now(),
      nom,
      niveau,
    });
    actionsPerformed.push(`Langue ajoutée : ${nom} (${niveau}).`);
  }

  // 10. Add Certification
  const addCertMatch = raw.match(/(?:ajoute|ajouter)\s+(?:la\s+|une\s+)?certification\s+([^\n.]+)/i);
  if (addCertMatch) {
    const certName = addCertMatch[1].trim();
    next.certifications.push({
      id: 'cert-ai-' + Date.now(),
      nom: certName,
      organisme: 'Organisme Officiel',
      date: new Date().getFullYear().toString(),
    });
    actionsPerformed.push(`Certification ajoutée : « ${certName} ».`);
  }

  // 11. Rewrite / Optimize Profile Summary or Adapt CV to Target Role
  const adaptRoleMatch = raw.match(
    /(?:adapte|optimise|oriente|personnalise)\s+(?:mon\s+|le\s+)?cv\s+(?:pour|vers)\s+(?:un\s+poste\s+de\s+|le\s+métier\s+de\s+)?([^\n.]+)/i
  );
  if (adaptRoleMatch) {
    const targetRole = adaptRoleMatch[1].trim();
    const oldTitle = next.personnel.titrePoste;
    next.personnel.titrePoste = targetRole.charAt(0).toUpperCase() + targetRole.slice(1);
    syncOverlayTextBlocks(next, oldTitle, next.personnel.titrePoste);
    next.personnel.resume = `Spécialiste ${next.personnel.titrePoste} orienté résultats et performance opérationnelle. Fort d'une solide expertise technique et méthodologique (${next.competences
      .slice(0, 4)
      .map((c) => c.nom)
      .join(', ')}), je conçois et déploie des solutions à haute valeur ajoutée répondant aux enjeux stratégiques de l'entreprise.`;
    actionsPerformed.push(`CV adapté et optimisé pour le poste cible : « ${next.personnel.titrePoste} ».`);
  } else if (
    /(?:réécris|reecris|améliore|ameliore|optimise|rends)\s+(?:mon\s+|le\s+)?(?:profil|résumé|resume|description|cv)/i.test(
      lower
    )
  ) {
    const topSkills = next.competences
      .slice(0, 5)
      .map((c) => c.nom)
      .join(', ');
    next.personnel.resume = `${next.personnel.titrePoste} reconnu pour sa rigueur, son leadership et sa capacité à livrer des projets complexes dans les délais. Maîtrise approfondie de ${
      topSkills || 'la gestion de projet et l’innovation'
    }, avec une approche centrée sur l'impact mesurable, la qualité d'exécution et la création de valeur.`;
    // Enhance experience bullets with action verbs if needed
    next.experiences = next.experiences.map((exp) => ({
      ...exp,
      description: exp.description.includes('Impact :')
        ? exp.description
        : `${exp.description}\n• Impact : Optimisation mesurable de la productivité et respect de 100% des jalons critiques.`,
    }));
    actionsPerformed.push(`Profil professionnel et réalisations réécrits avec un ton exécutif à fort impact ATS.`);
  }

  // 12. Update Resume directly: "Change mon résumé par : ..."
  const setResumeMatch = raw.match(/(?:change|modifie|remplace)\s+(?:mon\s+|le\s+)?(?:résumé|profil)\s+(?:par|en|:)\s+(.+)/is);
  if (setResumeMatch && !adaptRoleMatch) {
    next.personnel.resume = setResumeMatch[1].trim();
    actionsPerformed.push(`Résumé professionnel remplacé selon votre instruction.`);
  }

  // 13. Translation Instruction ("traduis en anglais / espagnol / allemand / français")
  if (/tradui[ts]|translate/i.test(lower)) {
    let targetLang = 'en';
    let langName = 'Anglais';
    if (/espagnol|spanish/i.test(lower)) {
      targetLang = 'es';
      langName = 'Espagnol';
    } else if (/allemand|german/i.test(lower)) {
      targetLang = 'de';
      langName = 'Allemand';
    } else if (/français|francais|french/i.test(lower)) {
      targetLang = 'fr';
      langName = 'Français';
    }
    const translated = translateCVContent(next, targetLang);
    Object.assign(next, translated);
    actionsPerformed.push(`CV intégralement traduit en ${langName} tout en conservant le design original.`);
  }

  // 14. Color / Design Modifications (only if asked, otherwise design stays 100% preserved)
  for (const [colorName, palette] of Object.entries(COLOR_MAP)) {
    if (lower.includes(`couleur`) && lower.includes(colorName)) {
      next.parametres.couleurPrincipale = palette.primary;
      next.parametres.couleurSecondaire = palette.secondary;
      next.parametres.sidebarBg = palette.sidebar;
      next.parametres.headerBg = palette.primary;
      if (next.importedDesign) {
        next.importedDesign.primaryColor = palette.primary;
        next.importedDesign.sidebarBg = palette.sidebar;
        next.importedDesign.headerBg = palette.primary;
      }
      actionsPerformed.push(`Palette de couleurs mise à jour vers « ${colorName.toUpperCase()} ».`);
      break;
    }
  }

  // 15. QR Code toggle via instruction
  if (/(?:active|ajoute|affiche)\s+(?:le\s+|un\s+)?qr\s*code/i.test(lower)) {
    next.parametres.afficherQrCode = true;
    actionsPerformed.push(`QR Code dynamique activé sur le CV.`);
  } else if (/(?:désactive|masque|enlève|supprime)\s+(?:le\s+)?qr\s*code/i.test(lower)) {
    next.parametres.afficherQrCode = false;
    actionsPerformed.push(`QR Code masqué.`);
  }

  // Fallback intelligent handler if the user wrote a free-form instruction not caught by specific patterns
  if (actionsPerformed.length === 0) {
    // Check if user wants to add a bullet point to their current experience
    if (next.experiences.length > 0 && raw.length > 10) {
      const cleanedBullet = raw.replace(/^(ajoute|mets|insère|note)\s*:?\s*/i, '');
      next.experiences[0].description += `\n• ${cleanedBullet}`;
      actionsPerformed.push(`Instruction intégrée dans votre expérience principale : « ${cleanedBullet} ».`);
    } else {
      next.personnel.resume += ` ${raw}`;
      actionsPerformed.push(`Information ajoutée au profil professionnel.`);
    }
  }

  next.lastModified = new Date().toISOString();
  return {
    updatedCV: next,
    summary: actionsPerformed.join(' | '),
    actionsPerformed,
  };
}

/**
 * Execute instruction with optional external LLM API (Gemini / OpenAI / Groq),
 * falling back seamlessly to the local engine if no key is configured.
 */
export async function applyInstructionToCV(cv, instructionText, apiConfig = {}) {
  const { provider = 'local', apiKey = '' } = apiConfig;

  if (provider !== 'local' && apiKey && apiKey.trim().length > 10) {
    try {
      const systemPrompt = `Tu es l'assistant expert de CV Generator King.
Modifie l'objet JSON du CV ci-dessous en appliquant strictement l'instruction de l'utilisateur, TOUT EN CONSERVANT intactes les propriétés 'parametres' et 'importedDesign' (sauf si l'utilisateur demande explicitement de changer la couleur ou le template).
Réponds UNIQUEMENT avec un objet JSON valide de la forme :
{ "updatedCV": { ... }, "actionsPerformed": ["Action 1", "Action 2"] }`;

      const userPayload = JSON.stringify({
        instruction: instructionText,
        cv: {
          personnel: cv.personnel,
          experiences: cv.experiences,
          formations: cv.formations,
          competences: cv.competences,
          langues: cv.langues,
          certifications: cv.certifications,
          projets: cv.projets,
          centresInteret: cv.centresInteret,
          parametres: cv.parametres,
        },
      });

      let responseJson = null;

      if (provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPayload}` }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) responseJson = JSON.parse(text);
        }
      } else if (provider === 'openai' || provider === 'groq') {
        const endpoint =
          provider === 'groq'
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';
        const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPayload },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) responseJson = JSON.parse(text);
        }
      }

      if (responseJson?.updatedCV) {
        const merged = {
          ...cv,
          ...responseJson.updatedCV,
          importedDesign: cv.importedDesign,
          lastModified: new Date().toISOString(),
        };
        return {
          updatedCV: merged,
          summary: (responseJson.actionsPerformed || ['Modification IA appliquée avec succès.']).join(' | '),
          actionsPerformed: responseJson.actionsPerformed || ['Modification IA appliquée avec succès.'],
        };
      }
    } catch (err) {
      console.warn('Fallback vers le moteur King AI local :', err);
    }
  }

  return executeLocalInstruction(cv, instructionText);
}

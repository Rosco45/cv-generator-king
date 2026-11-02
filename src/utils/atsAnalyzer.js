/**
 * Analyseur ATS Royal & Comparateur d'Offre d'Emploi (Job Matcher)
 */

const STOP_WORDS = new Set([
  'pour', 'dans', 'avec', 'plus', 'vous', 'nous', 'votre', 'notre', 'sont', 'etre', 'être',
  'avoir', 'faire', 'comme', 'tout', 'tous', 'toute', 'toutes', 'cette', 'ces', 'mais',
  'ou', 'et', 'donc', 'or', 'ni', 'car', 'des', 'les', 'une', 'aux', 'sur', 'par', 'pas',
  'the', 'and', 'for', 'with', 'you', 'our', 'are', 'will', 'from', 'that', 'this', 'have',
  'poste', 'profil', 'recherche', 'entreprise', 'équipe', 'equipe', 'missions', 'ans',
  'expérience', 'experience', 'travail', 'projet', 'projets', 'clients', 'client',
]);

export function calculateATSScore(cv, jobDescription = '') {
  const checks = [];
  let score = 0;

  // 1. Coordonnées complètes (15 pts)
  const hasContact = Boolean(cv.personnel?.nomComplet && cv.personnel?.email && cv.personnel?.telephone);
  checks.push({
    id: 'contact',
    label: 'Coordonnées essentielles (Nom, Email, Téléphone)',
    passed: hasContact,
    points: 15,
    tip: 'Assurez-vous que votre email et votre numéro de téléphone sont bien renseignés.',
  });
  if (hasContact) score += 15;

  // 2. Titre de poste clair (10 pts)
  const hasTitle = Boolean(cv.personnel?.titrePoste && cv.personnel.titrePoste.trim().length >= 5);
  checks.push({
    id: 'title',
    label: 'Titre du poste ciblé et explicite',
    passed: hasTitle,
    points: 10,
    tip: 'Un titre précis augmente de 40% la détection par les recruteurs.',
  });
  if (hasTitle) score += 10;

  // 3. Résumé professionnel / Pitch (15 pts)
  const resumeLen = (cv.personnel?.resume || '').trim().length;
  const hasGoodResume = resumeLen >= 80 && resumeLen <= 650;
  checks.push({
    id: 'resume',
    label: 'Résumé professionnel percutant (80 à 600 caractères)',
    passed: hasGoodResume,
    points: 15,
    tip: 'Rédigez un résumé de 3 à 5 lignes résumant votre valeur ajoutée.',
  });
  if (hasGoodResume) score += 15;
  else if (resumeLen > 20) score += 8;

  // 4. Expériences détaillées (20 pts)
  const expCount = cv.experiences?.length || 0;
  const hasRichExp = expCount >= 1 && cv.experiences.some((e) => (e.description || '').length >= 50);
  checks.push({
    id: 'experiences',
    label: 'Expériences professionnelles détaillées avec réalisations',
    passed: hasRichExp,
    points: 20,
    tip: 'Détaillez vos missions sous forme de listes à puces orientées résultats.',
  });
  if (hasRichExp) score += 20;
  else if (expCount > 0) score += 10;

  // 5. Résultats chiffrés / Métriques d'impact (10 pts)
  const allExpText = (cv.experiences || []).map((e) => e.description).join(' ');
  const hasMetrics = /\d+\s*(%|k€|m€|\+|utilisateurs|clients|personnes|jours|mois|ans|x)/i.test(allExpText);
  checks.push({
    id: 'metrics',
    label: 'Indicateurs chiffrés de performance (%, budgets, délais, taille d’équipe)',
    passed: hasMetrics,
    points: 10,
    tip: 'Ajoutez des chiffres concrets (ex: +35% de performance, équipe de 5 personnes).',
  });
  if (hasMetrics) score += 10;

  // 6. Compétences clés (15 pts)
  const compCount = cv.competences?.length || 0;
  const hasSkills = compCount >= 5;
  checks.push({
    id: 'skills',
    label: 'Au moins 5 compétences techniques ou métiers listées',
    passed: hasSkills,
    points: 15,
    tip: 'Ajoutez entre 6 et 12 compétences clés recherchées dans votre secteur.',
  });
  if (hasSkills) score += 15;
  else if (compCount >= 2) score += 8;

  // 7. Formations (10 pts)
  const hasEducation = (cv.formations?.length || 0) >= 1;
  checks.push({
    id: 'education',
    label: 'Parcours académique / Formations renseignées',
    passed: hasEducation,
    points: 10,
    tip: 'Indiquez vos diplômes ou formations principales.',
  });
  if (hasEducation) score += 10;

  // 8. Langues & Liens professionnels (5 pts)
  const hasLangOrLink = (cv.langues?.length || 0) >= 1 || Boolean(cv.personnel?.linkedin);
  checks.push({
    id: 'extras',
    label: 'Langues parlées et profil LinkedIn / Portfolio',
    passed: hasLangOrLink,
    points: 5,
    tip: 'Mentionnez vos langues et votre lien LinkedIn.',
  });
  if (hasLangOrLink) score += 5;

  // Job Description Matching (if provided)
  let jobMatch = null;
  if (jobDescription && jobDescription.trim().length > 20) {
    const cvFullText = JSON.stringify({
      p: cv.personnel,
      e: cv.experiences,
      f: cv.formations,
      c: cv.competences,
      l: cv.langues,
      cert: cv.certifications,
    }).toLowerCase();

    // Extract candidate keywords from job description
    const rawTokens = jobDescription
      .replace(/[,.;:!?()[\]{}"«»/\\]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w));

    const freq = {};
    for (const token of rawTokens) {
      const key = token.toLowerCase();
      // Boost capitalized / technical words
      const weight = /^[A-Z]/.test(token) || /[+#.]/.test(token) ? 2 : 1;
      freq[key] = {
        display: token,
        count: (freq[key]?.count || 0) + weight,
      };
    }

    const sortedKeywords = Object.values(freq)
      .sort((a, b) => b.count - a.count)
      .slice(0, 18)
      .map((item) => item.display);

    const matchedKeywords = [];
    const missingKeywords = [];

    for (const kw of sortedKeywords) {
      if (cvFullText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    const matchPercentage =
      sortedKeywords.length > 0 ? Math.round((matchedKeywords.length / sortedKeywords.length) * 100) : 100;

    jobMatch = {
      matchPercentage,
      matchedKeywords,
      missingKeywords,
      totalAnalyzed: sortedKeywords.length,
    };
  }

  return {
    score: Math.min(100, score),
    checks,
    jobMatch,
  };
}

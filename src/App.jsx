import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Sparkles,
  Upload,
  FilePlus,
  Download,
  Wand2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2,
  Globe,
  Target,
  MailCheck,
  History,
  ZoomIn,
  ZoomOut,
  Edit3,
  Copy,
  Send,
  KeyRound,
  X,
  Sun,
  Moon,
  Printer,
} from 'lucide-react';
import KingLogo from './components/KingLogo';
import CVPreview from './components/CVPreview';
import {
  DEFAULT_CV,
  TEMPLATES,
  ROYAL_PALETTES,
  FONTS,
  PRESET_PROFILES,
  createBlankCV,
} from './data/defaultCV';
import { importExistingCVFile } from './utils/cvImporter';
import { applyInstructionToCV, translateCVContent } from './utils/instructionEngine';
import {
  exportToPDF,
  exportToDOCX,
  exportToImage,
  exportToSVG,
  exportToHTML,
  exportToTextOrMarkdown,
  exportToJSON,
} from './utils/exportEngine';
import { calculateATSScore } from './utils/atsAnalyzer';

const STORAGE_KEY = 'cv_generator_king_state_v1';
const VERSIONS_KEY = 'cv_generator_king_versions_v1';
const THEME_KEY = 'cv_generator_king_theme_v1';

const QUICK_INSTRUCTIONS = [
  "Optimise mon profil professionnel pour le rendre plus percutant et orienté résultats",
  "Ajoute une expérience de Lead Projet chez TechCorp de 2024 à Présent : pilotage d'une équipe de 6 personnes et +40% de productivité",
  "Ajoute les compétences Docker, Kubernetes, AWS, CI/CD et GraphQL",
  "Traduis tout le CV en anglais",
  "Change mon titre en Architecte Cloud & IA Senior",
  "Active le QR code sur le CV",
];

/**
 * Center-crop uploaded profile photo to a clean 500x500 square PNG DataURL right on upload
 * so it never gets squished or stretched in any template or export format.
 */
function cropImageFileToSquareDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        if (!size) {
          resolve(reader.result);
          return;
        }
        const outSize = 500;
        const canvas = document.createElement('canvas');
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext('2d');
        const sx = ((img.naturalWidth || img.width) - size) / 2;
        const sy = ((img.naturalHeight || img.height) - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, outSize, outSize);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  // Load initial CV from localStorage or DEFAULT_CV
  const [cv, setCv] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CV;
    } catch {
      return DEFAULT_CV;
    }
  });

  // Day / Night Theme state ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Undo / Redo stacks
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Saved multi-versions
  const [savedVersions, setSavedVersions] = useState(() => {
    try {
      const saved = localStorage.getItem(VERSIONS_KEY);
      return saved ? JSON.parse(saved) : [DEFAULT_CV];
    } catch {
      return [DEFAULT_CV];
    }
  });

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState('ai_import'); // 'ai_import' | 'edit' | 'design' | 'ats' | 'letter' | 'versions'
  const [editSubTab, setEditSubTab] = useState('profil'); // 'profil' | 'experiences' | 'formations' | 'competences' | 'autres'
  const [previewMode, setPreviewMode] = useState('cv'); // 'cv' | 'cover_letter'
  const [zoom, setZoom] = useState(0.75);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Import & Instruction state
  const [isImporting, setIsImporting] = useState(false);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [instructionInput, setInstructionInput] = useState('');
  const [isApplyingInstruction, setIsApplyingInstruction] = useState(false);
  const [instructionLogs, setInstructionLogs] = useState([
    {
      id: 'welcome-log',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      prompt: 'Système CV Generator King initialisé',
      result:
        'Prêt ! Vous pouvez créer un nouveau CV, ou importer un CV existant (PDF, Word DOCX, JPEG, PNG...) pour l’analyser et le modifier par simples instructions tout en respectant son design original.',
    },
  ]);

  // Hybrid AI API Config (optional)
  const [apiConfig, setApiConfig] = useState({
    provider: 'local', // 'local' | 'gemini' | 'openai' | 'groq'
    apiKey: '',
  });
  const [showApiSettings, setShowApiSettings] = useState(false);

  // ATS & Job Description state
  const [jobOfferText, setJobOfferText] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');
  const [toast, setToast] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Persist theme & apply class to body
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  // Auto-save CV to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
    } catch (e) {
      console.warn('Sauvegarde locale limitée :', e);
    }
  }, [cv]);

  useEffect(() => {
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(savedVersions));
    } catch (e) {
      console.warn('Sauvegarde des versions limitée :', e);
    }
  }, [savedVersions]);

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showNotification(next === 'light' ? '☀️ Mode Jour activé' : '🌙 Mode Nuit activé');
      return next;
    });
  };

  // Wrapper to update CV with Undo History
  const updateCV = (updater, recordHistory = true) => {
    setCv((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (recordHistory) {
        setHistoryStack((h) => [...h.slice(-19), prev]);
        setRedoStack([]);
      }
      return { ...next, lastModified: new Date().toISOString() };
    });
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setRedoStack((r) => [cv, ...r]);
    setHistoryStack((h) => h.slice(0, -1));
    setCv(previous);
    showNotification('Modification annulée (Undo)');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistoryStack((h) => [...h, cv]);
    setRedoStack((r) => r.slice(1));
    setCv(next);
    showNotification('Modification rétablie (Redo)');
  };

  // Handle importing an existing CV file (PDF, DOCX, JPG, PNG, JSON, HTML, TXT)
  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const { cv: importedCV, analysisReport: report } = await importExistingCVFile(file);
      updateCV(importedCV, true);
      setAnalysisReport(report);
      setActiveTab('ai_import');
      setShowWelcomeModal(false);

      setInstructionLogs((logs) => [
        {
          id: 'imp-' + Date.now(),
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          prompt: `Importation & Analyse de « ${file.name} »`,
          result: `Design original détecté (${report.detectedLayout.toUpperCase()}, couleur ${
            report.primaryColor
          }). Contenu extrait : ${report.sectionsFound.join(', ')}. Donnez maintenant vos instructions ci-dessous pour le modifier !`,
        },
        ...logs,
      ]);
      showNotification(`CV « ${file.name} » analysé avec succès ! Son design original a été extrait.`);
    } catch (err) {
      console.error(err);
      showNotification(`Erreur lors de l'analyse du fichier : ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle executing a natural-language instruction
  const handleExecuteInstruction = async (customPrompt) => {
    const text = (typeof customPrompt === 'string' ? customPrompt : instructionInput).trim();
    if (!text) return;

    setIsApplyingInstruction(true);
    try {
      const { updatedCV, summary } = await applyInstructionToCV(cv, text, apiConfig);
      updateCV(updatedCV, true);
      setInstructionLogs((logs) => [
        {
          id: 'inst-' + Date.now(),
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          prompt: text,
          result: summary,
        },
        ...logs,
      ]);
      if (typeof customPrompt !== 'string') {
        setInstructionInput('');
      }
      showNotification(summary);
    } catch (err) {
      showNotification(`Erreur lors de l'application de l'instruction : ${err.message}`, 'error');
    } finally {
      setIsApplyingInstruction(false);
    }
  };

  // Update overlay text block in-place (Pixel-Perfect Original Mode)
  const handleUpdateTextBlock = (blockId, newText) => {
    updateCV((prev) => {
      if (!prev.importedDesign?.textBlocks) return prev;
      return {
        ...prev,
        importedDesign: {
          ...prev.importedDesign,
          textBlocks: prev.importedDesign.textBlocks.map((tb) =>
            tb.id === blockId ? { ...tb, text: newText, modified: true } : tb
          ),
        },
      };
    }, false);
  };

  // Photo Upload Handler (with automatic 1:1 square center-cropping so it never squishes)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const squareDataUrl = await cropImageFileToSquareDataUrl(file);
      updateCV((prev) => ({
        ...prev,
        personnel: { ...prev.personnel, photo: squareDataUrl },
      }));
      showNotification('Photo de profil recadrée au format carré et mise à jour !');
    } catch {
      showNotification('Erreur lors du chargement de la photo', 'error');
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Multi-format Export Handler
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const docType = previewMode === 'cover_letter' ? 'Lettre_Motivation' : 'CV';
      if (format === 'pdf') {
        await exportToPDF(cv, 'cv-print-area', docType, { fitOnePage: false });
      } else if (format === 'pdf_onepage') {
        await exportToPDF(cv, 'cv-print-area', `${docType}_1Page`, { fitOnePage: true });
      } else if (format === 'pdf_print') {
        setShowExportModal(false);
        setTimeout(() => window.print(), 150);
        setIsExporting(false);
        return;
      } else if (format === 'docx') {
        await exportToDOCX(cv);
      } else if (['jpeg', 'png', 'webp'].includes(format)) {
        await exportToImage(cv, format, 'cv-print-area');
      } else if (format === 'svg') {
        await exportToSVG(cv, 'cv-print-area');
      } else if (format === 'html') {
        exportToHTML(cv, 'cv-print-area');
      } else if (format === 'md' || format === 'txt') {
        exportToTextOrMarkdown(cv, format);
      } else if (format === 'json') {
        exportToJSON(cv);
      }
      showNotification(`Export ${format.toUpperCase().replace('_ONEPAGE', ' (1 Page)')} téléchargé avec succès !`);
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      showNotification(`Erreur lors de l'export : ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // ATS Analysis computation
  const atsResult = calculateATSScore(cv, jobOfferText);

  // Inject missing keywords from Job Offer
  const handleInjectMissingKeywords = () => {
    if (!atsResult.jobMatch?.missingKeywords?.length) return;
    const toAdd = atsResult.jobMatch.missingKeywords.slice(0, 6);
    updateCV((prev) => {
      const existingNames = new Set(prev.competences.map((c) => c.nom.toLowerCase()));
      const newComps = [...prev.competences];
      for (const kw of toAdd) {
        if (!existingNames.has(kw.toLowerCase())) {
          newComps.push({
            id: 'comp-ats-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
            nom: kw.charAt(0).toUpperCase() + kw.slice(1),
            niveau: 88,
          });
        }
      }
      return {
        ...prev,
        competences: newComps,
      };
    });
    showNotification(`${toAdd.length} mots-clés de l'offre injectés dans vos compétences !`);
  };

  // Auto-generate Cover Letter matching the CV
  const handleGenerateCoverLetter = () => {
    const topSkills = cv.competences
      .slice(0, 5)
      .map((c) => c.nom)
      .join(', ');
    const latestExp = cv.experiences[0];
    updateCV((prev) => ({
      ...prev,
      lettreMotivation: {
        ...prev.lettreMotivation,
        objet: `Candidature au poste de ${prev.personnel.titrePoste || 'Collaborateur Senior'}`,
        lieuDate: `${(prev.personnel.adresse || 'Paris').split(',')[0]}, le ${new Date().toLocaleDateString('fr-FR')}`,
        corps: `Madame, Monsieur,\n\nActuellement ${
          prev.personnel.titrePoste || 'professionnel expérimenté'
        }, je vous soumets avec enthousiasme ma candidature afin de rejoindre votre équipe au sein de ${
          prev.lettreMotivation?.destinataireEntreprise || 'votre entreprise'
        }.\n\n${
          latestExp
            ? `Au cours de mon expérience en tant que ${latestExp.poste} chez ${latestExp.entreprise}, j'ai développé une solide expertise opérationnelle et contribué activement à la réussite de projets stratégiques.`
            : ''
        } Ma maîtrise de compétences clés telles que ${
          topSkills || 'la gestion de projet et l’analyse'
        } me permet d'être immédiatement opérationnel et d'apporter une valeur ajoutée mesurable.\n\nRigoureux, impliqué et doté d'un fort esprit d'équipe, je serais honoré de pouvoir échanger avec vous lors d'un entretien afin de vous exposer plus en détail mes motivations.\n\nDans cette attente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
      },
    }));
    setPreviewMode('cover_letter');
    showNotification('Lettre de motivation générée sur-mesure et assortie à votre CV !');
  };

  // Save current CV as a new version snapshot
  const handleSaveVersionSnapshot = () => {
    const label = prompt(
      'Nom de cette version du CV :',
      `${cv.personnel.nomComplet || 'CV'} - Version ${savedVersions.length + 1}`
    );
    if (!label) return;
    const snapshot = {
      ...JSON.parse(JSON.stringify(cv)),
      id: 'ver-' + Date.now(),
      versionName: label,
      lastModified: new Date().toISOString(),
    };
    setSavedVersions((v) => [snapshot, ...v]);
    showNotification(`Version « ${label} » sauvegardée !`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        theme === 'light' ? 'theme-light bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Hidden File Input for Universal CV Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.json,.html,.txt,.md"
        onChange={handleFileImport}
        className="hidden"
      />
      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-500 text-red-100 keep-white'
              : 'bg-slate-900/95 border-amber-400/60 text-amber-100 keep-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={19} className="text-red-400 shrink-0" />
          ) : (
            <Crown size={19} className="text-amber-400 shrink-0" />
          )}
          <span className="text-sm font-medium keep-white">{toast.msg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP ROYAL HEADER BAR */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <KingLogo size={46} />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-extrabold text-lg tracking-tight ${
                  theme === 'light'
                    ? 'text-blue-900'
                    : 'bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent'
                }`}
              >
                CV Generator King
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Royal Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Créez ou modifiez tout CV existant par instructions • Tous formats supportés
            </p>
          </div>
        </div>

        {/* Center Quick Actions : Mode Chooser, Undo/Redo, Language Translation, ATS Badge, Day/Night Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowWelcomeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Créer un nouveau CV ou Importer un CV existant"
          >
            <FilePlus size={14} className="text-amber-400" />
            <span>Nouveau / Importer CV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/40 transition"
            title="Importer un CV (PDF, Word DOCX, JPEG, PNG, JSON...)"
          >
            <Upload size={14} />
            <span>Importer un CV à modifier</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="p-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition"
              title="Annuler (Undo)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition"
              title="Rétablir (Redo)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          {/* 1-Click Language Translator */}
          <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl border border-slate-700 px-2 py-1">
            <Globe size={13} className="text-blue-500" />
            {['fr', 'en', 'es', 'de'].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  const translated = translateCVContent(cv, lang);
                  updateCV(translated, true);
                  showNotification(`CV traduit en ${lang.toUpperCase()} en conservant le design !`);
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold uppercase transition ${
                  (cv.langueCV || 'fr') === lang
                    ? 'bg-blue-600 text-white keep-white'
                    : 'text-slate-400 hover:text-blue-500'
                }`}
                title={`Traduire le CV en ${lang.toUpperCase()}`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Live ATS Score Pill */}
          <button
            onClick={() => setActiveTab('ats')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition"
          >
            <Target size={14} className={atsResult.score >= 80 ? 'text-emerald-500' : 'text-amber-500'} />
            <span>ATS :</span>
            <span className={atsResult.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}>
              {atsResult.score}/100
            </span>
          </button>

          {/* DAY / NIGHT THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              theme === 'light'
                ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                : 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
            }`}
            title={theme === 'dark' ? 'Passer en Mode Jour (Clair)' : 'Passer en Mode Nuit (Sombre)'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="text-amber-400" />
                <span>Mode Jour</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-blue-700" />
                <span>Mode Nuit</span>
              </>
            )}
          </button>
        </div>

        {/* Right Export Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white keep-white font-bold text-xs shadow-lg shadow-blue-600/25 transition"
          >
            <Download size={15} className="keep-white" />
            <span className="keep-white">{isExporting ? 'Export...' : 'PDF Rapide'}</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            <Crown size={15} />
            <span>Exporter (Tous Formats)</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN WORKSPACE : LEFT CONTROLS + RIGHT LIVE A4 PREVIEW */}
      {/* ===================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN : NAVIGATION TABS + ACTIVE PANEL */}
        <div className="ui-panel lg:col-span-5 xl:col-span-5 flex flex-col border-r border-slate-800 bg-slate-900/60 h-[calc(100vh-65px)] overflow-hidden">
          {/* Primary Feature Tabs */}
          <div className="ui-tabs-bar grid grid-cols-6 gap-1 p-2 bg-slate-900 border-b border-slate-800 shrink-0">
            {[
              { id: 'ai_import', label: 'Instructions IA', icon: Wand2, badge: 'King' },
              { id: 'edit', label: 'Éditer CV', icon: Edit3 },
              { id: 'design', label: 'Design', icon: Sliders },
              { id: 'ats', label: 'Score ATS', icon: Target },
              { id: 'letter', label: 'Lettre', icon: MailCheck },
              { id: 'versions', label: 'Versions', icon: History },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition ${
                    active
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white keep-white shadow-md shadow-blue-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  }`}
                >
                  {t.badge && (
                    <span className="absolute -top-1 right-1 px-1 rounded bg-amber-400 text-slate-950 text-[8.5px] font-extrabold uppercase">
                      {t.badge}
                    </span>
                  )}
                  <Icon size={16} className={`mb-1 ${active ? 'keep-white' : ''}`} />
                  <span className={`truncate max-w-full ${active ? 'keep-white' : ''}`}>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-5">
            {/* =============================================================== */}
            {/* TAB 1 : IMPORTER UN CV & MODIFIER PAR INSTRUCTIONS ("L'OPTION QUI CHANGE TOUT") */}
            {/* =============================================================== */}
            {activeTab === 'ai_import' && (
              <div className="space-y-5">
                {/* Banner Card : Upload Existing CV or Create New */}
                <div
                  className={`p-4 rounded-2xl border shadow-lg ${
                    theme === 'light'
                      ? 'bg-gradient-to-br from-blue-50 via-white to-amber-50 border-amber-400/60'
                      : 'bg-gradient-to-br from-blue-950/90 via-slate-900 to-amber-950/30 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        <Crown size={20} />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
                          Modifier un CV Existant par Instructions
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Importez un CV (PDF, Word DOCX, JPEG, PNG...) : l&apos;application analyse son design et son
                          contenu, puis le modifie selon vos instructions !
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Drag & Drop / Upload Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 border-2 border-dashed border-amber-500/50 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition group"
                  >
                    <Upload
                      size={24}
                      className="mx-auto text-amber-500 group-hover:scale-110 transition-transform mb-1.5"
                    />
                    <p className="text-xs font-bold text-white">
                      {isImporting
                        ? 'Analyse approfondie du CV et extraction du design en cours...'
                        : 'Cliquez ici pour soumettre un CV existant (PDF, DOCX, JPEG, PNG, JSON, HTML)'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Conservation automatique des couleurs, de la disposition et de la structure originale
                    </p>
                  </div>
                </div>

                {/* Imported CV Design DNA Report */}
                {cv.importedDesign && (
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={17} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                          Design Original Analysé : {cv.importedDesign.sourceFileName}
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-semibold">
                        Disposition : {cv.importedDesign.detectedLayout}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span>Palette extraite :</span>
                        <span
                          className="w-5 h-5 rounded-full border border-slate-400 inline-block"
                          style={{ backgroundColor: cv.importedDesign.primaryColor }}
                          title={`Couleur primaire : ${cv.importedDesign.primaryColor}`}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-slate-400 inline-block"
                          style={{ backgroundColor: cv.importedDesign.sidebarBg }}
                          title={`Couleur structure : ${cv.importedDesign.sidebarBg}`}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-slate-400 inline-block"
                          style={{ backgroundColor: cv.importedDesign.secondaryColor }}
                          title={`Accent : ${cv.importedDesign.secondaryColor}`}
                        />
                      </div>

                      {cv.importedDesign.originalPageDataUrl && (
                        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
                          <button
                            onClick={() =>
                              updateCV((prev) => ({
                                ...prev,
                                parametres: {
                                  ...prev.parametres,
                                  template: 'imported_clone',
                                  modeEditionDirecteSurOriginal: false,
                                },
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                              !cv.parametres.modeEditionDirecteSurOriginal
                                ? 'bg-blue-600 text-white keep-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Design Reconstruit
                          </button>
                          <button
                            onClick={() =>
                              updateCV((prev) => ({
                                ...prev,
                                parametres: {
                                  ...prev.parametres,
                                  modeEditionDirecteSurOriginal: true,
                                },
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                              cv.parametres.modeEditionDirecteSurOriginal
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Calque Original 100%
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Natural Language Instruction Prompt Box */}
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles size={15} />
                      Donnez vos instructions de modification
                    </label>
                    <button
                      onClick={() => setShowApiSettings(!showApiSettings)}
                      className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                    >
                      <KeyRound size={12} />
                      <span>
                        {apiConfig.provider === 'local'
                          ? 'Moteur Hybride Local (Actif)'
                          : `IA : ${apiConfig.provider.toUpperCase()}`}
                      </span>
                    </button>
                  </div>

                  {/* Optional External LLM API Config */}
                  {showApiSettings && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">Moteur d&apos;exécution des instructions :</span>
                        <select
                          value={apiConfig.provider}
                          onChange={(e) => setApiConfig({ ...apiConfig, provider: e.target.value })}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        >
                          <option value="local">Moteur Intelligent Local (Sans clé - Immédiat)</option>
                          <option value="gemini">Google Gemini API</option>
                          <option value="openai">OpenAI GPT-4o API</option>
                          <option value="groq">Groq (Llama 3.3 70B)</option>
                        </select>
                      </div>
                      {apiConfig.provider !== 'local' && (
                        <input
                          type="password"
                          placeholder={`Entrez votre clé API ${apiConfig.provider.toUpperCase()}...`}
                          value={apiConfig.apiKey}
                          onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        />
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={instructionInput}
                      onChange={(e) => setInstructionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleExecuteInstruction();
                        }
                      }}
                      placeholder="Ex: Ajoute une expérience de Lead Dev chez Google de 2024 à 2026, ajoute les compétences Docker et Rust, ou change mon titre en Architecte Cloud..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 p-3 text-xs text-white placeholder-slate-500 outline-none resize-none"
                    />
                    <button
                      onClick={() => handleExecuteInstruction()}
                      disabled={isApplyingInstruction || !instructionInput.trim()}
                      className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <Send size={14} />
                      <span>
                        {isApplyingInstruction
                          ? 'Application des modifications...'
                          : 'Appliquer les instructions au CV (en gardant le design)'}
                      </span>
                    </button>
                  </div>

                  {/* Quick 1-Click Instruction Chips */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                      Suggestions d&apos;instructions rapides (cliquez pour appliquer) :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_INSTRUCTIONS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExecuteInstruction(item)}
                          className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/80 transition"
                        >
                          ✨ {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Instruction History Log */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Journal des analyses & modifications appliquées
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {instructionLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex justify-between text-[10.5px] text-slate-400">
                          <span className="font-bold text-amber-400">Instruction : {log.prompt}</span>
                          <span>{log.time}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{log.result}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 2 : ÉDITER LE CONTENU MANUELLEMENT */}
            {/* =============================================================== */}
            {activeTab === 'edit' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
                  {[
                    { id: 'profil', label: 'Profil & Photo' },
                    { id: 'experiences', label: `Expériences (${cv.experiences.length})` },
                    { id: 'formations', label: `Formations (${cv.formations.length})` },
                    { id: 'competences', label: `Compétences (${cv.competences.length})` },
                    { id: 'autres', label: 'Langues & + ' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setEditSubTab(st.id)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                        editSubTab === st.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* SUBTAB : PROFIL & PHOTO */}
                {editSubTab === 'profil' && (
                  <div className="space-y-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-4 pb-3 border-b border-slate-800">
                      {cv.personnel.photo ? (
                        <img
                          src={cv.personnel.photo}
                          alt="Photo CV"
                          className="w-16 h-16 rounded-full object-cover border-2 border-amber-400"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-xs">
                          Photo
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white keep-white text-xs font-bold"
                        >
                          {cv.personnel.photo ? 'Changer la photo' : 'Ajouter une photo'}
                        </button>
                        {cv.personnel.photo && (
                          <button
                            onClick={() =>
                              updateCV((prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, photo: '' },
                              }))
                            }
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Nom complet</label>
                        <input
                          type="text"
                          value={cv.personnel.nomComplet}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, nomComplet: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Titre / Poste recherché</label>
                        <input
                          type="text"
                          value={cv.personnel.titrePoste}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, titrePoste: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Email</label>
                        <input
                          type="email"
                          value={cv.personnel.email}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, email: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Téléphone</label>
                        <input
                          type="text"
                          value={cv.personnel.telephone}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, telephone: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Ville / Adresse</label>
                        <input
                          type="text"
                          value={cv.personnel.adresse}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, adresse: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Permis / Mobilité</label>
                        <input
                          type="text"
                          value={cv.personnel.permisDeConduire}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, permisDeConduire: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">LinkedIn</label>
                        <input
                          type="text"
                          value={cv.personnel.linkedin}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, linkedin: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">GitHub / Portfolio</label>
                        <input
                          type="text"
                          value={cv.personnel.github}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                personnel: { ...prev.personnel, github: e.target.value },
                              }),
                              false
                            )
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">Résumé professionnel</label>
                      <textarea
                        rows={4}
                        value={cv.personnel.resume}
                        onChange={(e) =>
                          updateCV(
                            (prev) => ({
                              ...prev,
                              personnel: { ...prev.personnel, resume: e.target.value },
                            }),
                            false
                          )
                        }
                        className="w-full mt-1 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {/* SUBTAB : EXPÉRIENCES */}
                {editSubTab === 'experiences' && (
                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        updateCV((prev) => ({
                          ...prev,
                          experiences: [
                            {
                              id: 'exp-' + Date.now(),
                              poste: 'Nouveau Poste',
                              entreprise: 'Nom de l’entreprise',
                              dateDebut: 'Jan 2024',
                              dateFin: 'Présent',
                              description: '• Réalisation clé et impact chiffré.',
                            },
                            ...prev.experiences,
                          ],
                        }))
                      }
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white keep-white font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <Plus size={15} className="keep-white" />{' '}
                      <span className="keep-white">Ajouter une expérience</span>
                    </button>

                    {cv.experiences.map((exp, idx) => (
                      <div
                        key={exp.id}
                        className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400">Expérience #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                onClick={() =>
                                  updateCV((prev) => {
                                    const arr = [...prev.experiences];
                                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                    return { ...prev, experiences: arr };
                                  })
                                }
                                className="p-1 rounded hover:bg-slate-700 text-slate-400"
                              >
                                <ArrowUp size={14} />
                              </button>
                            )}
                            {idx < cv.experiences.length - 1 && (
                              <button
                                onClick={() =>
                                  updateCV((prev) => {
                                    const arr = [...prev.experiences];
                                    [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                                    return { ...prev, experiences: arr };
                                  })
                                }
                                className="p-1 rounded hover:bg-slate-700 text-slate-400"
                              >
                                <ArrowDown size={14} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                updateCV((prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.filter((item) => item.id !== exp.id),
                                }))
                              }
                              className="p-1 rounded hover:bg-red-500/20 text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Poste"
                            value={exp.poste}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item) =>
                                    item.id === exp.id ? { ...item, poste: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Entreprise & Ville"
                            value={exp.entreprise}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item) =>
                                    item.id === exp.id ? { ...item, entreprise: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Date début"
                            value={exp.dateDebut}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item) =>
                                    item.id === exp.id ? { ...item, dateDebut: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Date fin"
                            value={exp.dateFin}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item) =>
                                    item.id === exp.id ? { ...item, dateFin: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Missions et réalisations..."
                          value={exp.description}
                          onChange={(e) =>
                            updateCV(
                              (prev) => ({
                                ...prev,
                                experiences: prev.experiences.map((item) =>
                                  item.id === exp.id ? { ...item, description: e.target.value } : item
                                ),
                              }),
                              false
                            )
                          }
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* SUBTAB : FORMATIONS */}
                {editSubTab === 'formations' && (
                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        updateCV((prev) => ({
                          ...prev,
                          formations: [
                            {
                              id: 'form-' + Date.now(),
                              diplome: 'Master / Diplôme',
                              ecole: 'Université / École',
                              dateDebut: '2022',
                              dateFin: '2024',
                              description: '',
                            },
                            ...prev.formations,
                          ],
                        }))
                      }
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white keep-white font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <Plus size={15} className="keep-white" />{' '}
                      <span className="keep-white">Ajouter une formation</span>
                    </button>

                    {cv.formations.map((form) => (
                      <div
                        key={form.id}
                        className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-amber-400">{form.diplome || 'Formation'}</span>
                          <button
                            onClick={() =>
                              updateCV((prev) => ({
                                ...prev,
                                formations: prev.formations.filter((item) => item.id !== form.id),
                              }))
                            }
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Diplôme"
                            value={form.diplome}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  formations: prev.formations.map((item) =>
                                    item.id === form.id ? { ...item, diplome: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="École / Université"
                            value={form.ecole}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  formations: prev.formations.map((item) =>
                                    item.id === form.id ? { ...item, ecole: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Année début"
                            value={form.dateDebut}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  formations: prev.formations.map((item) =>
                                    item.id === form.id ? { ...item, dateDebut: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Année fin"
                            value={form.dateFin}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  formations: prev.formations.map((item) =>
                                    item.id === form.id ? { ...item, dateFin: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SUBTAB : COMPÉTENCES */}
                {editSubTab === 'competences' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: React.js, Python, Gestion de projet..."
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSkillInput.trim()) {
                            updateCV((prev) => ({
                              ...prev,
                              competences: [
                                ...prev.competences,
                                { id: 'comp-' + Date.now(), nom: newSkillInput.trim(), niveau: 90 },
                              ],
                            }));
                            setNewSkillInput('');
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        onClick={() => {
                          if (!newSkillInput.trim()) return;
                          updateCV((prev) => ({
                            ...prev,
                            competences: [
                              ...prev.competences,
                              { id: 'comp-' + Date.now(), nom: newSkillInput.trim(), niveau: 90 },
                            ],
                          }));
                          setNewSkillInput('');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white keep-white text-xs font-bold"
                      >
                        Ajouter
                      </button>
                    </div>

                    <div className="space-y-2">
                      {cv.competences.map((comp) => (
                        <div
                          key={comp.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700"
                        >
                          <input
                            type="text"
                            value={comp.nom}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  competences: prev.competences.map((c) =>
                                    c.id === comp.id ? { ...c, nom: e.target.value } : c
                                  ),
                                }),
                                false
                              )
                            }
                            className="flex-1 bg-transparent text-xs font-semibold text-white outline-none"
                          />
                          <input
                            type="range"
                            min="30"
                            max="100"
                            value={comp.niveau || 85}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  competences: prev.competences.map((c) =>
                                    c.id === comp.id ? { ...c, niveau: Number(e.target.value) } : c
                                  ),
                                }),
                                false
                              )
                            }
                            className="w-24 accent-amber-400"
                          />
                          <button
                            onClick={() =>
                              updateCV((prev) => ({
                                ...prev,
                                competences: prev.competences.filter((c) => c.id !== comp.id),
                              }))
                            }
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBTAB : LANGUES, CERTIFICATIONS, INTÉRÊTS */}
                {editSubTab === 'autres' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-amber-400 uppercase">Langues</h4>
                        <button
                          onClick={() =>
                            updateCV((prev) => ({
                              ...prev,
                              langues: [
                                ...prev.langues,
                                { id: 'lang-' + Date.now(), nom: 'Nouvelle langue', niveau: 'Courant' },
                              ],
                            }))
                          }
                          className="text-xs text-blue-500 font-bold flex items-center gap-1"
                        >
                          <Plus size={13} /> Ajouter
                        </button>
                      </div>
                      {cv.langues.map((l) => (
                        <div key={l.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={l.nom}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  langues: prev.langues.map((item) =>
                                    item.id === l.id ? { ...item, nom: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                          />
                          <input
                            type="text"
                            value={l.niveau}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  langues: prev.langues.map((item) =>
                                    item.id === l.id ? { ...item, niveau: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                          />
                          <button
                            onClick={() =>
                              updateCV((prev) => ({
                                ...prev,
                                langues: prev.langues.filter((item) => item.id !== l.id),
                              }))
                            }
                            className="text-red-400 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-amber-400 uppercase">Certifications</h4>
                        <button
                          onClick={() =>
                            updateCV((prev) => ({
                              ...prev,
                              certifications: [
                                ...prev.certifications,
                                {
                                  id: 'cert-' + Date.now(),
                                  nom: 'Nom Certification',
                                  organisme: 'Organisme',
                                  date: '2025',
                                },
                              ],
                            }))
                          }
                          className="text-xs text-blue-500 font-bold flex items-center gap-1"
                        >
                          <Plus size={13} /> Ajouter
                        </button>
                      </div>
                      {cv.certifications.map((c) => (
                        <div key={c.id} className="grid grid-cols-12 gap-1.5 items-center">
                          <input
                            type="text"
                            value={c.nom}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  certifications: prev.certifications.map((item) =>
                                    item.id === c.id ? { ...item, nom: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="col-span-6 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                          />
                          <input
                            type="text"
                            value={c.organisme}
                            onChange={(e) =>
                              updateCV(
                                (prev) => ({
                                  ...prev,
                                  certifications: prev.certifications.map((item) =>
                                    item.id === c.id ? { ...item, organisme: e.target.value } : item
                                  ),
                                }),
                                false
                              )
                            }
                            className="col-span-5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                          />
                          <button
                            onClick={() =>
                              updateCV((prev) => ({
                                ...prev,
                                certifications: prev.certifications.filter((item) => item.id !== c.id),
                              }))
                            }
                            className="col-span-1 text-red-400 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-amber-400 uppercase">Centres d&apos;intérêt</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ajouter un centre d'intérêt..."
                          value={newInterestInput}
                          onChange={(e) => setNewInterestInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                        />
                        <button
                          onClick={() => {
                            if (!newInterestInput.trim()) return;
                            updateCV((prev) => ({
                              ...prev,
                              centresInteret: [
                                ...prev.centresInteret,
                                { id: 'int-' + Date.now(), nom: newInterestInput.trim() },
                              ],
                            }));
                            setNewInterestInput('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white keep-white text-xs font-bold"
                        >
                          Ajouter
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cv.centresInteret.map((i) => (
                          <span
                            key={i.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs"
                          >
                            {i.nom}
                            <button
                              onClick={() =>
                                updateCV((prev) => ({
                                  ...prev,
                                  centresInteret: prev.centresInteret.filter((item) => item.id !== i.id),
                                }))
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 3 : DESIGN, TEMPLATES & APPARENCE */}
            {/* =============================================================== */}
            {activeTab === 'design' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                    Modèles de Mise en Page (Templates)
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TEMPLATES.map((tpl) => {
                      const isSelected = cv.parametres.template === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          onClick={() =>
                            updateCV((prev) => ({
                              ...prev,
                              parametres: {
                                ...prev.parametres,
                                template: tpl.id,
                                modeEditionDirecteSurOriginal: false,
                              },
                            }))
                          }
                          className={`p-3 rounded-xl border text-left transition ${
                            isSelected
                              ? 'bg-blue-600/20 border-amber-400 text-white shadow-md'
                              : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{tpl.name}</span>
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                              {tpl.badge}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Palettes */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Couleurs & Palettes Royales
                    </h3>
                    {cv.importedDesign && (
                      <button
                        onClick={() =>
                          updateCV((prev) => ({
                            ...prev,
                            parametres: {
                              ...prev.parametres,
                              couleurPrincipale: prev.importedDesign.primaryColor,
                              couleurSecondaire: prev.importedDesign.secondaryColor,
                              sidebarBg: prev.importedDesign.sidebarBg,
                              headerBg: prev.importedDesign.headerBg,
                            },
                          }))
                        }
                        className="text-[11px] text-emerald-500 hover:underline font-semibold"
                      >
                        Restaurer les couleurs du CV importé
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ROYAL_PALETTES.map((pal) => (
                      <button
                        key={pal.name}
                        onClick={() =>
                          updateCV((prev) => ({
                            ...prev,
                            parametres: {
                              ...prev.parametres,
                              couleurPrincipale: pal.primary,
                              couleurSecondaire: pal.secondary,
                              sidebarBg: pal.sidebarBg,
                              sidebarText: pal.sidebarText,
                              headerBg: pal.primary,
                            },
                          }))
                        }
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 flex items-center gap-2 text-left transition"
                      >
                        <div className="flex -space-x-1 shrink-0">
                          <span
                            className="w-4 h-4 rounded-full border border-white/30"
                            style={{ backgroundColor: pal.primary }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white/30"
                            style={{ backgroundColor: pal.secondary }}
                          />
                        </div>
                        <span className="text-[10.5px] font-semibold truncate">{pal.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Pickers */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <label className="text-[10.5px] text-slate-400 block mb-1">Couleur Principale</label>
                      <input
                        type="color"
                        value={cv.parametres.couleurPrincipale}
                        onChange={(e) =>
                          updateCV(
                            (prev) => ({
                              ...prev,
                              parametres: {
                                ...prev.parametres,
                                couleurPrincipale: e.target.value,
                                sidebarBg: e.target.value,
                                headerBg: e.target.value,
                              },
                            }),
                            false
                          )
                        }
                        className="w-full h-8 rounded cursor-pointer bg-slate-900 border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-slate-400 block mb-1">Couleur d&apos;Accent</label>
                      <input
                        type="color"
                        value={cv.parametres.couleurSecondaire}
                        onChange={(e) =>
                          updateCV(
                            (prev) => ({
                              ...prev,
                              parametres: { ...prev.parametres, couleurSecondaire: e.target.value },
                            }),
                            false
                          )
                        }
                        className="w-full h-8 rounded cursor-pointer bg-slate-900 border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-slate-400 block mb-1">Fond Sidebar</label>
                      <input
                        type="color"
                        value={cv.parametres.sidebarBg}
                        onChange={(e) =>
                          updateCV(
                            (prev) => ({
                              ...prev,
                              parametres: { ...prev.parametres, sidebarBg: e.target.value },
                            }),
                            false
                          )
                        }
                        className="w-full h-8 rounded cursor-pointer bg-slate-900 border border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography, Photo Shape & QR Code */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Typographie & Options Visuelles
                  </h3>

                  <div>
                    <label className="text-[11px] text-slate-400">Police de caractères</label>
                    <select
                      value={cv.parametres.police}
                      onChange={(e) =>
                        updateCV((prev) => ({
                          ...prev,
                          parametres: { ...prev.parametres, police: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      {FONTS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400">Taille du texte</label>
                      <select
                        value={cv.parametres.taillePolice}
                        onChange={(e) =>
                          updateCV((prev) => ({
                            ...prev,
                            parametres: { ...prev.parametres, taillePolice: e.target.value },
                          }))
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="compact">Compacte (Maximum d&apos;infos)</option>
                        <option value="normal">Normale (Équilibrée)</option>
                        <option value="large">Grande (Lecture confortable)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Style de la photo</label>
                      <select
                        value={cv.parametres.formePhoto}
                        onChange={(e) =>
                          updateCV((prev) => ({
                            ...prev,
                            parametres: { ...prev.parametres, formePhoto: e.target.value },
                          }))
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="circle">Ronde</option>
                        <option value="rounded">Carrée arrondie</option>
                        <option value="square">Carrée stricte</option>
                        <option value="none">Masquer la photo</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span>Afficher les jauges de compétences</span>
                      <input
                        type="checkbox"
                        checked={cv.parametres.afficherBarresCompetences}
                        onChange={(e) =>
                          updateCV((prev) => ({
                            ...prev,
                            parametres: { ...prev.parametres, afficherBarresCompetences: e.target.checked },
                          }))
                        }
                        className="accent-amber-400 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span>Intégrer un QR Code dynamique sur le CV</span>
                      <input
                        type="checkbox"
                        checked={cv.parametres.afficherQrCode}
                        onChange={(e) =>
                          updateCV((prev) => ({
                            ...prev,
                            parametres: { ...prev.parametres, afficherQrCode: e.target.checked },
                          }))
                        }
                        className="accent-amber-400 w-4 h-4"
                      />
                    </label>

                    {cv.parametres.afficherQrCode && (
                      <input
                        type="text"
                        placeholder="Lien du QR Code (LinkedIn, Portfolio, site...)"
                        value={cv.parametres.qrCodeUrl || ''}
                        onChange={(e) =>
                          updateCV(
                            (prev) => ({
                              ...prev,
                              parametres: { ...prev.parametres, qrCodeUrl: e.target.value },
                            }),
                            false
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 4 : SCORE ATS & ADAPTATION À UNE OFFRE D'EMPLOI */}
            {/* =============================================================== */}
            {activeTab === 'ats' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                      Diagnostic ATS (Logiciels Recruteurs)
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">{atsResult.score} / 100</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {atsResult.score >= 85
                        ? 'Excellent ! Votre CV est hautement optimisé pour franchir les filtres ATS.'
                        : 'Quelques améliorations rapides augmenteront vos chances de sélection.'}
                    </p>
                  </div>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl border-2 shrink-0 ${
                      atsResult.score >= 80
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-500'
                        : 'bg-amber-500/20 border-amber-400 text-amber-500'
                    }`}
                  >
                    {atsResult.score}%
                  </div>
                </div>

                {/* Job Offer Matcher */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    🎯 Comparer & Adapter à une Offre d&apos;Emploi
                  </h4>
                  <textarea
                    rows={4}
                    value={jobOfferText}
                    onChange={(e) => setJobOfferText(e.target.value)}
                    placeholder="Collez ici le texte d'une offre d'emploi pour calculer le taux de correspondance et détecter les mots-clés manquants..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />

                  {atsResult.jobMatch && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Compatibilité avec l&apos;annonce :</span>
                        <span className="text-amber-400">{atsResult.jobMatch.matchPercentage}%</span>
                      </div>

                      {atsResult.jobMatch.missingKeywords.length > 0 && (
                        <div>
                          <p className="text-[11px] text-slate-400 mb-1.5">
                            Mots-clés de l&apos;offre absents de votre CV :
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {atsResult.jobMatch.missingKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-semibold"
                              >
                                + {kw}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={handleInjectMissingKeywords}
                            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition"
                          >
                            Injecter les mots-clés manquants dans mes compétences en 1 clic
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Detailed Checklist */}
                <div className="space-y-2">
                  {atsResult.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        chk.passed
                          ? 'bg-emerald-950/10 border-emerald-500/30 text-slate-200'
                          : 'bg-amber-950/10 border-amber-500/30 text-slate-200'
                      }`}
                    >
                      {chk.passed ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">{chk.label}</div>
                        {!chk.passed && <p className="text-[11px] text-slate-400 mt-0.5">{chk.tip}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 5 : LETTRE DE MOTIVATION ASSORTIE AU CV */}
            {/* =============================================================== */}
            {activeTab === 'letter' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                      Lettre de Motivation Assortie
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Reprend automatiquement le design, l&apos;en-tête et les couleurs de votre CV.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCoverLetter}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Wand2 size={14} /> Générer depuis le CV
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode('cover_letter')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      previewMode === 'cover_letter'
                        ? 'bg-blue-600 border-blue-500 text-white keep-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Aperçu Lettre de Motivation
                  </button>
                  <button
                    onClick={() => setPreviewMode('cv')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      previewMode === 'cv'
                        ? 'bg-blue-600 border-blue-500 text-white keep-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Aperçu CV
                  </button>
                </div>

                <div className="space-y-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400">Entreprise destinataire</label>
                      <input
                        type="text"
                        value={cv.lettreMotivation?.destinataireEntreprise || ''}
                        onChange={(e) =>
                          updateCV(
                            (prev) => ({
                              ...prev,
                              lettreMotivation: {
                                ...prev.lettreMotivation,
                                destinataireEntreprise: e.target.value,
                              },
                            }),
                            false
                          )
                        }
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Destinataire / Service</label>
                      <input
                        type="text"
                        value={cv.lettreMotivation?.destinataireNom || ''}
                        onChange={(e) =>
                          updateCV(
                            (prev) => ({
                              ...prev,
                              lettreMotivation: {
                                ...prev.lettreMotivation,
                                destinataireNom: e.target.value,
                              },
                            }),
                            false
                          )
                        }
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400">Objet de la candidature</label>
                    <input
                      type="text"
                      value={cv.lettreMotivation?.objet || ''}
                      onChange={(e) =>
                        updateCV(
                          (prev) => ({
                            ...prev,
                            lettreMotivation: {
                              ...prev.lettreMotivation,
                              objet: e.target.value,
                            },
                          }),
                          false
                        )
                      }
                      className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400">Corps de la lettre</label>
                    <textarea
                      rows={10}
                      value={cv.lettreMotivation?.corps || ''}
                      onChange={(e) =>
                        updateCV(
                          (prev) => ({
                            ...prev,
                            lettreMotivation: {
                              ...prev.lettreMotivation,
                              corps: e.target.value,
                            },
                          }),
                          false
                        )
                      }
                      className="w-full mt-1 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 6 : VERSIONS & PROFILS PRÉ-REMPLIS */}
            {/* =============================================================== */}
            {activeTab === 'versions' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Mes Versions Sauvegardées ({savedVersions.length})
                  </h3>
                  <button
                    onClick={handleSaveVersionSnapshot}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Copy size={13} /> Sauvegarder la version actuelle
                  </button>
                </div>

                <div className="space-y-2">
                  {savedVersions.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{ver.versionName || 'Version CV'}</div>
                        <div className="text-[11px] text-slate-400">
                          {ver.personnel?.nomComplet} • {ver.personnel?.titrePoste}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            updateCV(ver, true);
                            showNotification(`Version « ${ver.versionName} » chargée !`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white keep-white text-xs font-bold"
                        >
                          Charger
                        </button>
                        {savedVersions.length > 1 && (
                          <button
                            onClick={() => setSavedVersions((v) => v.filter((item) => item.id !== ver.id))}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preset Royal Profiles */}
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Exemples de Profils Royaux (Démarrage rapide)
                  </h4>
                  <div className="space-y-2">
                    {PRESET_PROFILES.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          updateCV(preset.cv, true);
                          showNotification(`Profil « ${preset.label} » chargé !`);
                        }}
                        className="w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-left flex items-center justify-between transition"
                      >
                        <div>
                          <div className="text-xs font-bold text-amber-400">{preset.label}</div>
                          <div className="text-[11px] text-slate-400">{preset.cv.personnel.nomComplet}</div>
                        </div>
                        <span className="text-xs text-blue-500 font-semibold">Utiliser →</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN : LIVE INTERACTIVE A4 PREVIEW */}
        {/* =================================================================== */}
        <div className="ui-preview-viewport lg:col-span-7 xl:col-span-7 bg-slate-950 flex flex-col h-[calc(100vh-65px)] overflow-hidden">
          {/* Preview Toolbar */}
          <div className="ui-preview-toolbar px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('cv')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  previewMode === 'cv'
                    ? 'bg-blue-600 text-white keep-white'
                    : 'text-slate-400 hover:text-blue-500'
                }`}
              >
                📄 Aperçu du CV
              </button>
              <button
                onClick={() => setPreviewMode('cover_letter')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  previewMode === 'cover_letter'
                    ? 'bg-blue-600 text-white keep-white'
                    : 'text-slate-400 hover:text-blue-500'
                }`}
              >
                ✉️ Lettre de Motivation
              </button>

              {cv.importedDesign?.originalPageDataUrl && previewMode === 'cv' && (
                <button
                  onClick={() =>
                    updateCV((prev) => ({
                      ...prev,
                      parametres: {
                        ...prev.parametres,
                        modeEditionDirecteSurOriginal: !prev.parametres.modeEditionDirecteSurOriginal,
                      },
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                    cv.parametres.modeEditionDirecteSurOriginal
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {cv.parametres.modeEditionDirecteSurOriginal
                    ? '👑 Calque Original Actif (Cliquez sur un texte pour éditer)'
                    : 'Basculer sur Calque Original Pixel-Perfect'}
                </button>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <button
                onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                title="Dézoomer"
              >
                <ZoomOut size={14} />
              </button>
              <span className="font-mono text-[11px] w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(1.15, Number((z + 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                title="Zoomer"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* Centered A4 Canvas Viewport */}
          <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                marginBottom: `${(zoom - 1) * 1123}px`,
              }}
              className="transition-transform duration-150"
            >
              <CVPreview cv={cv} previewMode={previewMode} onUpdateTextBlock={handleUpdateTextBlock} />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1 : WELCOME / MODE CHOOSER (NOUVEAU CV OU MODIFIER CV EXISTANT) */}
      {/* ===================================================================== */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <KingLogo size={68} />
              <div>
                <h2 className="text-2xl font-black text-white">Bienvenue sur CV Generator King 👑</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Que souhaitez-vous faire aujourd&apos;hui ? Créez un CV de zéro ou modifiez un CV déjà existant par
                  simples instructions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 flex flex-col justify-between space-y-4 transition">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center mb-3">
                    <FilePlus size={22} />
                  </div>
                  <h3 className="font-extrabold text-base text-white">1. Créer un Nouveau CV</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Démarrez avec un CV vierge ou un modèle royal pré-rempli, personnalisez le design et exportez dans
                    tous les formats.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      updateCV(createBlankCV(), true);
                      setActiveTab('edit');
                      setShowWelcomeModal(false);
                      showNotification('Nouveau CV vierge initialisé !');
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white keep-white font-bold text-xs"
                  >
                    Partir d&apos;un CV Vierge
                  </button>
                  <button
                    onClick={() => {
                      updateCV(DEFAULT_CV, true);
                      setActiveTab('edit');
                      setShowWelcomeModal(false);
                      showNotification('Modèle Royal Complet chargé !');
                    }}
                    className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs"
                  >
                    Partir d&apos;un Exemple Pré-rempli
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800 to-slate-800 border-2 border-amber-400/70 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Wand2 size={22} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      Option Exclusive
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-white">2. Modifier un CV Déjà Disponible</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Soumettez votre CV (PDF, Word DOCX, JPEG, PNG...). L&apos;application l&apos;analyse, conserve son
                    design original et applique vos instructions !
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <Upload size={16} />
                  <span>Importer mon CV (PDF, DOCX, Image...)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2 : UNIVERSAL MULTI-FORMAT EXPORT ("TOUS FORMATS SUPPORTÉS") */}
      {/* ===================================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Download size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Exporter votre CV — Tous Formats Supportés</h2>
                <p className="text-xs text-slate-400">
                  Choisissez le format d&apos;exportation souhaité (
                  {previewMode === 'cover_letter' ? 'Lettre de Motivation' : 'CV actuel'})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'pdf',
                  title: 'PDF Haute Qualité Multi-Pages (.pdf)',
                  desc: 'Saut de page intelligent (ne coupe aucun bloc ni texte) + photo HD sans déformation',
                  badge: 'Recommandé',
                },
                {
                  id: 'pdf_onepage',
                  title: 'PDF Ajusté sur 1 Seule Page (.pdf)',
                  desc: 'Ajuste automatiquement votre CV pour qu’il tienne sur une unique page A4',
                  badge: '1 Page A4',
                },
                {
                  id: 'pdf_print',
                  title: 'PDF Vectoriel Natif (Impression A4)',
                  desc: 'Génère un PDF 100% vectoriel ultra-net via le moteur natif du navigateur',
                  badge: 'Vectoriel',
                },
                {
                  id: 'docx',
                  title: 'Microsoft Word (.docx)',
                  desc: 'Document Word natif éditable avec couleurs et sections structurées',
                  badge: 'Word',
                },
                {
                  id: 'jpeg',
                  title: 'Image JPEG (.jpg)',
                  desc: 'Haute résolution 300 DPI idéale pour partage rapide et réseaux',
                  badge: '300 DPI',
                },
                {
                  id: 'png',
                  title: 'Image PNG (.png)',
                  desc: 'Qualité sans perte ultra-nette',
                  badge: 'Lossless',
                },
                {
                  id: 'webp',
                  title: 'Image WebP (.webp)',
                  desc: 'Format web moderne haute définition',
                  badge: 'Web',
                },
                {
                  id: 'svg',
                  title: 'Vecteur SVG (.svg)',
                  desc: 'Format vectoriel redimensionnable à l’infini',
                  badge: 'SVG',
                },
                {
                  id: 'html',
                  title: 'Page Web HTML5 (.html)',
                  desc: 'Portfolio CV autonome prêt à héberger',
                  badge: 'Code',
                },
                {
                  id: 'md',
                  title: 'Markdown (.md)',
                  desc: 'Idéal pour GitHub, Notion et développeurs',
                  badge: 'Dev',
                },
                {
                  id: 'txt',
                  title: 'Texte Brut ATS (.txt)',
                  desc: 'Texte pur structuré pour copier-coller rapide',
                  badge: 'Texte',
                },
                {
                  id: 'json',
                  title: 'Sauvegarde Projet (.json)',
                  desc: 'Fichier de sauvegarde ré-importable dans CV Generator King',
                  badge: 'Backup',
                },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  disabled={isExporting}
                  onClick={() => handleExport(fmt.id)}
                  className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-left flex flex-col justify-between transition group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-extrabold text-white group-hover:text-amber-400">
                      {fmt.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold shrink-0 ml-2">
                      {fmt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

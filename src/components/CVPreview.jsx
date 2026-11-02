import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Car,
  Award,
  Briefcase,
  GraduationCap,
  Code2,
  Languages as LangIcon,
  FolderGit2,
  Heart,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { SECTION_LABELS, FONTS } from '../data/defaultCV';

export default function CVPreview({
  cv,
  previewMode = 'cv', // 'cv' | 'cover_letter'
  onUpdateTextBlock,
  onAddOverlayBlock,
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [editingBlockId, setEditingBlockId] = useState(null);

  const labels = SECTION_LABELS[cv.langueCV || 'fr'] || SECTION_LABELS.fr;
  const params = cv.parametres || {};
  const primary = params.couleurPrincipale || '#1e40af';
  const secondary = params.couleurSecondaire || '#d4af37';
  const sidebarBg = params.sidebarBg || primary;
  const sidebarText = params.sidebarText || '#ffffff';
  const headerBg = params.headerBg || primary;
  const headerText = params.headerText || '#ffffff';

  const fontObj = FONTS.find((f) => f.id === params.police) || FONTS[0];
  const fontSizeClass =
    params.taillePolice === 'compact'
      ? 'text-[12px] leading-snug'
      : params.taillePolice === 'large'
      ? 'text-[14.5px] leading-relaxed'
      : 'text-[13.2px] leading-normal';

  const spacingClass =
    params.espacement === 'compact' ? 'space-y-3' : params.espacement === 'aere' ? 'space-y-6' : 'space-y-4';

  const qrTarget =
    params.qrCodeUrl ||
    cv.personnel?.linkedin ||
    cv.personnel?.siteWeb ||
    (cv.personnel?.email ? `mailto:${cv.personnel.email}` : 'https://cv-generator-king.vercel.app');

  useEffect(() => {
    if (params.afficherQrCode && qrTarget) {
      QRCode.toDataURL(qrTarget, {
        width: 120,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [params.afficherQrCode, qrTarget]);

  // Resolve effective layout when 'imported_clone' is selected
  const effectiveTemplate =
    params.template === 'imported_clone'
      ? cv.importedDesign?.detectedLayout || 'sidebar_left'
      : params.template || 'sidebar_left';

  const photoShapeClass =
    params.formePhoto === 'rounded'
      ? 'rounded-2xl'
      : params.formePhoto === 'square'
      ? 'rounded-none'
      : 'rounded-full';

  const renderPhoto = (sizeClass = 'w-24 h-24', borderStyle = 'border-4 border-white/80') => {
    if (params.formePhoto === 'none' || !cv.personnel?.photo) return null;
    return (
      <img
        src={cv.personnel.photo}
        alt={cv.personnel.nomComplet}
        className={`${sizeClass} ${photoShapeClass} object-cover shadow-md ${borderStyle} shrink-0`}
      />
    );
  };

  const renderQRCode = (darkBg = false) => {
    if (!params.afficherQrCode || !qrDataUrl) return null;
    return (
      <div
        className={`inline-flex flex-col items-center p-1.5 rounded-lg border ${
          darkBg ? 'bg-white text-slate-900 border-white/30' : 'bg-white text-slate-800 border-slate-200'
        } shadow-sm shrink-0`}
      >
        <img src={qrDataUrl} alt="QR Code CV" className="w-14 h-14 object-contain" />
        <span className="text-[8.5px] font-semibold tracking-tight uppercase mt-0.5 text-slate-600">Scanner</span>
      </div>
    );
  };

  // ============================================================================
  // 1. MODE LETTRE DE MOTIVATION ASSORTIE
  // ============================================================================
  if (previewMode === 'cover_letter') {
    const lm = cv.lettreMotivation || {};
    return (
      <div
        id="cv-print-area"
        className={`a4-sheet shadow-2xl mx-auto flex flex-col justify-between ${fontSizeClass}`}
        style={{ fontFamily: fontObj.family }}
      >
        {/* Top Royal Header matching CV */}
        <div>
          <div
            className="px-10 py-8 flex items-center justify-between"
            style={{ backgroundColor: primary, color: '#ffffff' }}
          >
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{cv.personnel.nomComplet || 'Votre Nom'}</h1>
              <p className="text-base font-medium opacity-90 mt-1">{cv.personnel.titrePoste}</p>
              <div className="flex flex-wrap gap-4 text-xs mt-3 opacity-85">
                {cv.personnel.email && <span>✉ {cv.personnel.email}</span>}
                {cv.personnel.telephone && <span>☎ {cv.personnel.telephone}</span>}
                {cv.personnel.adresse && <span>📍 {cv.personnel.adresse}</span>}
              </div>
            </div>
            {renderQRCode(true)}
          </div>

          <div className="px-12 py-10 text-slate-800">
            {/* Recipient & Date */}
            <div className="flex justify-between items-start mb-8 text-sm">
              <div className="text-slate-500">{lm.lieuDate || `Le ${new Date().toLocaleDateString('fr-FR')}`}</div>
              <div className="text-right bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[220px]">
                <p className="font-bold text-slate-900">À l'attention de : {lm.destinataireNom || 'Service Recrutement'}</p>
                <p className="font-semibold" style={{ color: primary }}>
                  {lm.destinataireEntreprise || 'Entreprise'}
                </p>
                <p className="text-slate-600 text-xs mt-0.5">{lm.destinataireAdresse}</p>
              </div>
            </div>

            {/* Subject line */}
            <div
              className="mb-7 pb-3 border-b-2 font-bold text-base text-slate-900"
              style={{ borderColor: primary }}
            >
              Objet : {lm.objet || `Candidature au poste de ${cv.personnel.titrePoste}`}
            </div>

            {/* Body Paragraphs */}
            <div className="space-y-4 text-[14px] leading-relaxed text-slate-700 whitespace-pre-line text-justify">
              {lm.corps}
            </div>

            {/* Signature */}
            <div className="mt-12 flex flex-col items-end">
              <p className="font-bold text-base text-slate-900">{cv.personnel.nomComplet}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: primary }}>
                {cv.personnel.titrePoste}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Accent Bar */}
        <div className="h-3 w-full" style={{ backgroundColor: primary }} />
      </div>
    );
  }

  // ============================================================================
  // 2. MODE ÉDITION DIRECTE SUR LE CALQUE ORIGINAL PIXEL-PERFECT (PDF / IMAGE)
  // ============================================================================
  if (params.modeEditionDirecteSurOriginal && cv.importedDesign?.originalPageDataUrl) {
    const blocks = cv.importedDesign.textBlocks || [];
    return (
      <div
        id="cv-print-area"
        className="a4-sheet shadow-2xl mx-auto relative overflow-hidden select-none"
        style={{ fontFamily: fontObj.family }}
      >
        {/* Exact High-DPI Render of the Original Imported CV */}
        <img
          src={cv.importedDesign.originalPageDataUrl}
          alt="CV Original Importé"
          className="w-full h-full object-contain pointer-events-none block"
        />

        {/* Interactive Overlay Text Blocks */}
        {blocks.map((tb) => {
          const isEditing = editingBlockId === tb.id;
          return (
            <div
              key={tb.id}
              onClick={() => setEditingBlockId(tb.id)}
              title="Cliquez pour modifier ce texte directement en conservant le design original"
              style={{
                position: 'absolute',
                left: `${tb.xPct}%`,
                top: `${tb.yPct}%`,
                minWidth: `${tb.widthPct}%`,
                minHeight: `${tb.heightPct}%`,
                fontSize: `${tb.fontSizePt}pt`,
                fontWeight: tb.fontWeight || '400',
                backgroundColor: tb.modified || isEditing ? tb.bgColor || '#ffffff' : 'transparent',
                color: tb.modified || isEditing ? tb.textColor || '#0f172a' : 'transparent',
                padding: tb.modified || isEditing ? '1px 4px' : '0',
                borderRadius: '2px',
                cursor: 'pointer',
                zIndex: isEditing ? 30 : tb.modified ? 20 : 10,
              }}
              className={`transition-all group ${
                isEditing
                  ? 'ring-2 ring-amber-500 shadow-lg'
                  : tb.modified
                  ? 'hover:ring-1 hover:ring-blue-500'
                  : 'hover:bg-amber-400/20 hover:ring-1 hover:ring-amber-400/70'
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={tb.text}
                  onChange={(e) => onUpdateTextBlock && onUpdateTextBlock(tb.id, e.target.value)}
                  onBlur={() => setEditingBlockId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') setEditingBlockId(null);
                  }}
                  style={{
                    fontSize: `${tb.fontSizePt}pt`,
                    fontWeight: tb.fontWeight || '400',
                    color: tb.textColor || '#0f172a',
                    backgroundColor: tb.bgColor || '#ffffff',
                  }}
                  className="w-full outline-none border-none px-1"
                />
              ) : (
                <span className="whitespace-pre-wrap leading-none">{tb.text}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================================
  // 3. REUSABLE SECTION RENDERERS FOR ALL TEMPLATES
  // ============================================================================
  const ContactList = ({ dark = false, inline = false }) => {
    const items = [
      { icon: Mail, val: cv.personnel?.email },
      { icon: Phone, val: cv.personnel?.telephone },
      { icon: MapPin, val: cv.personnel?.adresse },
      { icon: Linkedin, val: cv.personnel?.linkedin },
      { icon: Github, val: cv.personnel?.github },
      { icon: Globe, val: cv.personnel?.siteWeb },
      { icon: Car, val: cv.personnel?.permisDeConduire },
    ].filter((i) => i.val);

    if (items.length === 0) return null;

    return (
      <div className={inline ? 'flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs' : 'space-y-2 text-xs'}>
        {items.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div key={idx} className="flex items-center gap-2 break-all">
              <IconComponent
                size={13}
                className="shrink-0"
                style={{ color: dark ? secondary : primary }}
              />
              <span className={dark ? 'opacity-90' : 'text-slate-700'}>{item.val}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const SectionHeading = ({ title, icon: Icon, dark = false, styleVariant = 'underline' }) => (
    <div
      className={`flex items-center gap-2 font-bold uppercase tracking-wider mb-2.5 ${
        styleVariant === 'underline' ? 'pb-1 border-b-2' : ''
      } ${styleVariant === 'pill' ? 'px-3 py-1 rounded-lg' : ''}`}
      style={{
        color: dark ? '#ffffff' : primary,
        borderColor: dark ? 'rgba(255,255,255,0.25)' : primary,
        backgroundColor: styleVariant === 'pill' ? `${primary}14` : 'transparent',
      }}
    >
      {Icon && <Icon size={15} style={{ color: dark ? secondary : primary }} />}
      <span className="text-[12.5px]">{title}</span>
    </div>
  );

  const ExperiencesBlock = () =>
    cv.experiences?.length > 0 && (
      <div>
        <SectionHeading title={labels.experiences} icon={Briefcase} />
        <div className="space-y-3.5">
          {cv.experiences.map((exp) => (
            <div key={exp.id} className="relative pl-3 border-l-2" style={{ borderColor: `${primary}45` }}>
              <div className="flex flex-wrap justify-between items-baseline gap-1">
                <h4 className="font-bold text-slate-900 text-[13.5px]">{exp.poste}</h4>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${primary}12`, color: primary }}
                >
                  {exp.dateDebut} — {exp.dateFin || labels.present}
                </span>
              </div>
              <div className="text-xs font-semibold mb-1" style={{ color: primary }}>
                {exp.entreprise}
              </div>
              {exp.description && (
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );

  const FormationsBlock = ({ dark = false }) =>
    cv.formations?.length > 0 && (
      <div>
        <SectionHeading title={labels.formations} icon={GraduationCap} dark={dark} />
        <div className="space-y-2.5">
          {cv.formations.map((f) => (
            <div key={f.id}>
              <div className="flex justify-between items-baseline gap-2">
                <h4 className={`font-bold text-xs ${dark ? 'text-white' : 'text-slate-900'}`}>{f.diplome}</h4>
                <span className={`text-[11px] shrink-0 ${dark ? 'opacity-75' : 'text-slate-500 font-medium'}`}>
                  {f.dateDebut} {f.dateFin && f.dateFin !== f.dateDebut ? `- ${f.dateFin}` : ''}
                </span>
              </div>
              <div className={`text-xs font-medium ${dark ? 'opacity-90' : 'text-slate-600'}`}>{f.ecole}</div>
              {f.description && (
                <p className={`text-[11px] mt-0.5 ${dark ? 'opacity-75' : 'text-slate-500'}`}>{f.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );

  const CompetencesBlock = ({ dark = false, badgeMode = false }) =>
    cv.competences?.length > 0 && (
      <div>
        <SectionHeading title={labels.competences} icon={Code2} dark={dark} />
        {badgeMode || !params.afficherBarresCompetences ? (
          <div className="flex flex-wrap gap-1.5">
            {cv.competences.map((c) => (
              <span
                key={c.id}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                style={{
                  backgroundColor: dark ? 'rgba(255,255,255,0.14)' : `${primary}14`,
                  color: dark ? '#ffffff' : primary,
                }}
              >
                {c.nom}
              </span>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {cv.competences.map((c) => (
              <div key={c.id}>
                <div className="flex justify-between text-[11.5px] font-medium mb-0.5">
                  <span className={dark ? 'text-white' : 'text-slate-800'}>{c.nom}</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/20' : 'bg-slate-200'}`}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.niveau || 85}%`,
                      backgroundColor: dark ? secondary : primary,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

  const LanguesBlock = ({ dark = false }) =>
    cv.langues?.length > 0 && (
      <div>
        <SectionHeading title={labels.langues} icon={LangIcon} dark={dark} />
        <div className="space-y-1.5 text-xs">
          {cv.langues.map((l) => (
            <div key={l.id} className="flex justify-between items-center gap-2">
              <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>{l.nom}</span>
              <span className={`text-[11px] ${dark ? 'opacity-80' : 'text-slate-500'}`}>{l.niveau}</span>
            </div>
          ))}
        </div>
      </div>
    );

  const CertificationsBlock = ({ dark = false }) =>
    cv.certifications?.length > 0 && (
      <div>
        <SectionHeading title={labels.certifications} icon={Award} dark={dark} />
        <div className="space-y-1.5 text-xs">
          {cv.certifications.map((cert) => (
            <div key={cert.id}>
              <div className={`font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>{cert.nom}</div>
              <div className={`text-[11px] ${dark ? 'opacity-75' : 'text-slate-500'}`}>
                {cert.organisme} {cert.date ? `• ${cert.date}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  const ProjetsBlock = () =>
    cv.projets?.length > 0 && (
      <div>
        <SectionHeading title={labels.projets} icon={FolderGit2} />
        <div className="grid grid-cols-1 gap-2.5">
          {cv.projets.map((p) => (
            <div key={p.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex flex-wrap justify-between items-baseline gap-2">
                <span className="font-bold text-xs text-slate-900">{p.nom}</span>
                {p.technologies && (
                  <span className="text-[10.5px] font-semibold" style={{ color: primary }}>
                    {p.technologies}
                  </span>
                )}
              </div>
              {p.description && <p className="text-[11.5px] text-slate-600 mt-0.5">{p.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );

  const InteretsBlock = ({ dark = false }) =>
    cv.centresInteret?.length > 0 && (
      <div>
        <SectionHeading title={labels.centresInteret} icon={Heart} dark={dark} />
        <div className="flex flex-wrap gap-1.5">
          {cv.centresInteret.map((i) => (
            <span
              key={i.id}
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                dark ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {i.nom}
            </span>
          ))}
        </div>
      </div>
    );

  // ============================================================================
  // TEMPLATE A : SIDEBAR GAUCHE OR DROITE ('sidebar_left' / 'sidebar_right')
  // ============================================================================
  if (effectiveTemplate === 'sidebar_left' || effectiveTemplate === 'sidebar_right') {
    const isRight = effectiveTemplate === 'sidebar_right';
    const sidebarWidth = cv.importedDesign?.sidebarRatio ? `${cv.importedDesign.sidebarRatio}%` : '34%';

    const SidebarContent = (
      <div
        className={`p-7 flex flex-col justify-between ${spacingClass}`}
        style={{
          width: sidebarWidth,
          backgroundColor: sidebarBg,
          color: sidebarText,
        }}
      >
        <div className={spacingClass}>
          <div className="flex flex-col items-center text-center mb-2">
            {renderPhoto('w-28 h-28 mb-3', 'border-4 border-white/30')}
            <h1 className="text-xl font-extrabold tracking-tight leading-tight">{cv.personnel.nomComplet}</h1>
            <p className="text-xs font-semibold mt-1 opacity-90" style={{ color: secondary }}>
              {cv.personnel.titrePoste}
            </p>
          </div>

          <div>
            <SectionHeading title={labels.contact} dark />
            <ContactList dark />
          </div>

          <CompetencesBlock dark />
          <LanguesBlock dark />
          <CertificationsBlock dark />
          <InteretsBlock dark />
        </div>

        <div className="pt-4 flex justify-center">{renderQRCode(true)}</div>
      </div>
    );

    const MainContent = (
      <div className={`flex-1 p-8 bg-white text-slate-800 ${spacingClass}`}>
        {cv.personnel.resume && (
          <div>
            <SectionHeading title={labels.profil} icon={Sparkles} />
            <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.personnel.resume}</p>
          </div>
        )}
        <ExperiencesBlock />
        <FormationsBlock />
        <ProjetsBlock />
      </div>
    );

    return (
      <div
        id="cv-print-area"
        className={`a4-sheet shadow-2xl mx-auto flex ${fontSizeClass}`}
        style={{ fontFamily: fontObj.family }}
      >
        {isRight ? (
          <>
            {MainContent}
            {SidebarContent}
          </>
        ) : (
          <>
            {SidebarContent}
            {MainContent}
          </>
        )}
      </div>
    );
  }

  // ============================================================================
  // TEMPLATE B : FANCY HEADER / ÉLÉGANT BANDEAU ('fancy_header')
  // ============================================================================
  if (effectiveTemplate === 'fancy_header') {
    return (
      <div
        id="cv-print-area"
        className={`a4-sheet shadow-2xl mx-auto flex flex-col ${fontSizeClass}`}
        style={{ fontFamily: fontObj.family }}
      >
        {/* Top Colored Banner */}
        <div
          className="px-9 py-7 flex items-center justify-between gap-6"
          style={{ backgroundColor: headerBg, color: headerText }}
        >
          <div className="flex items-center gap-6">
            {renderPhoto('w-24 h-24', 'border-4 border-white/40')}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{cv.personnel.nomComplet}</h1>
              <p className="text-sm font-semibold mt-0.5" style={{ color: secondary }}>
                {cv.personnel.titrePoste}
              </p>
              <div className="mt-3">
                <ContactList dark inline />
              </div>
            </div>
          </div>
          {renderQRCode(true)}
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 p-8 grid grid-cols-12 gap-7">
          <div className={`col-span-8 ${spacingClass}`}>
            {cv.personnel.resume && (
              <div>
                <SectionHeading title={labels.profil} icon={Sparkles} />
                <p className="text-xs text-slate-700 leading-relaxed">{cv.personnel.resume}</p>
              </div>
            )}
            <ExperiencesBlock />
            <ProjetsBlock />
          </div>
          <div className={`col-span-4 ${spacingClass}`}>
            <CompetencesBlock badgeMode />
            <FormationsBlock />
            <LanguesBlock />
            <CertificationsBlock />
            <InteretsBlock />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // TEMPLATE C : EXÉCUTIF ROYAL ('executive')
  // ============================================================================
  if (effectiveTemplate === 'executive') {
    return (
      <div
        id="cv-print-area"
        className={`a4-sheet shadow-2xl mx-auto p-10 ${fontSizeClass}`}
        style={{ fontFamily: fontObj.family }}
      >
        {/* Double Gold/Primary Border Header */}
        <div className="border-b-4 pb-5 mb-6 flex justify-between items-center gap-6" style={{ borderColor: primary }}>
          <div className="flex items-center gap-5">
            {renderPhoto('w-20 h-20', 'border-2 border-amber-500')}
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-wide" style={{ color: primary }}>
                {cv.personnel.nomComplet}
              </h1>
              <p className="text-sm font-bold tracking-widest uppercase mt-1" style={{ color: secondary }}>
                {cv.personnel.titrePoste}
              </p>
              <div className="mt-2.5">
                <ContactList inline />
              </div>
            </div>
          </div>
          {renderQRCode(false)}
        </div>

        <div className={spacingClass}>
          {cv.personnel.resume && (
            <div className="p-4 rounded-lg bg-slate-50 border-l-4" style={{ borderColor: secondary }}>
              <p className="text-xs text-slate-700 italic leading-relaxed">{cv.personnel.resume}</p>
            </div>
          )}
          <ExperiencesBlock />
          <div className="grid grid-cols-2 gap-6">
            <FormationsBlock />
            <CompetencesBlock badgeMode />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <LanguesBlock />
            <CertificationsBlock />
            <InteretsBlock />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // TEMPLATE D : CLASSIQUE ATS MONO-COLONNE ('classic' / 'minimal')
  // ============================================================================
  if (effectiveTemplate === 'classic' || effectiveTemplate === 'minimal') {
    const isMinimal = effectiveTemplate === 'minimal';
    return (
      <div
        id="cv-print-area"
        className={`a4-sheet shadow-2xl mx-auto p-10 ${fontSizeClass}`}
        style={{ fontFamily: fontObj.family }}
      >
        <div className={`flex justify-between items-start pb-4 mb-5 ${isMinimal ? '' : 'border-b-2'}`} style={{ borderColor: primary }}>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{cv.personnel.nomComplet}</h1>
            <p className="text-sm font-semibold mt-0.5" style={{ color: primary }}>
              {cv.personnel.titrePoste}
            </p>
            <div className="mt-2">
              <ContactList inline />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderPhoto('w-16 h-16', 'border border-slate-200')}
            {renderQRCode(false)}
          </div>
        </div>

        <div className={spacingClass}>
          {cv.personnel.resume && (
            <div>
              <SectionHeading title={labels.profil} />
              <p className="text-xs text-slate-700 leading-relaxed">{cv.personnel.resume}</p>
            </div>
          )}
          <ExperiencesBlock />
          <FormationsBlock />
          <CompetencesBlock badgeMode />
          <ProjetsBlock />
          <div className="grid grid-cols-3 gap-6">
            <LanguesBlock />
            <CertificationsBlock />
            <InteretsBlock />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // TEMPLATE E : MODERNE & CRÉATIF ('modern' / 'creative' / default)
  // ============================================================================
  return (
    <div
      id="cv-print-area"
      className={`a4-sheet shadow-2xl mx-auto p-8 flex flex-col justify-between ${fontSizeClass}`}
      style={{ fontFamily: fontObj.family }}
    >
      <div>
        {/* Modern Header Card */}
        <div
          className="rounded-2xl p-6 mb-6 flex items-center justify-between gap-6 shadow-sm"
          style={{ backgroundColor: `${primary}10`, borderLeft: `6px solid ${primary}` }}
        >
          <div className="flex items-center gap-5">
            {renderPhoto('w-20 h-20', 'border-2 border-white')}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{cv.personnel.nomComplet}</h1>
              <p className="text-sm font-bold mt-0.5" style={{ color: primary }}>
                {cv.personnel.titrePoste}
              </p>
              <div className="mt-2.5">
                <ContactList inline />
              </div>
            </div>
          </div>
          {renderQRCode(false)}
        </div>

        {/* 2-Column Modern Grid */}
        <div className="grid grid-cols-12 gap-7">
          <div className={`col-span-7 ${spacingClass}`}>
            {cv.personnel.resume && (
              <div>
                <SectionHeading title={labels.profil} icon={Sparkles} />
                <p className="text-xs text-slate-700 leading-relaxed">{cv.personnel.resume}</p>
              </div>
            )}
            <ExperiencesBlock />
            <ProjetsBlock />
          </div>

          <div className={`col-span-5 ${spacingClass}`}>
            <CompetencesBlock />
            <FormationsBlock />
            <LanguesBlock />
            <CertificationsBlock />
            <InteretsBlock />
          </div>
        </div>
      </div>
    </div>
  );
}

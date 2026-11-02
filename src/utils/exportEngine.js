import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { SECTION_LABELS } from '../data/defaultCV';

/**
 * Helper to create a clean filename slug
 */
function getFileSlug(cv, suffix = 'CV') {
  const rawName = cv?.personnel?.nomComplet || 'Candidat';
  const slug = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${slug || 'CV_King'}_${suffix}`;
}

/**
 * Render the DOM element `#cv-print-area` into a high-resolution Canvas
 */
async function captureCVCanvas(elementId = 'cv-print-area', scale = 2.5) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Zone de rendu du CV introuvable.');

  // Temporarily remove any CSS scale transform during capture for 100% crispness
  const prevTransform = el.style.transform;
  el.style.transform = 'none';

  try {
    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return canvas;
  } finally {
    el.style.transform = prevTransform;
  }
}

/**
 * 1. Export PDF (.pdf)
 */
export async function exportToPDF(cv, elementId = 'cv-print-area', suffix = 'CV') {
  const canvas = await captureCVCanvas(elementId, 2.5);
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const ratio = canvas.height / canvas.width;
  const renderedHeight = pdfWidth * ratio;

  if (renderedHeight <= pdfHeight + 4) {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(renderedHeight, pdfHeight));
  } else {
    // Multi-page support if CV exceeds 1 A4 page
    let heightLeft = renderedHeight;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedHeight);
    heightLeft -= pdfHeight;
    while (heightLeft > 5) {
      position = heightLeft - renderedHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedHeight);
      heightLeft -= pdfHeight;
    }
  }

  pdf.save(`${getFileSlug(cv, suffix)}.pdf`);
}

/**
 * 2. Export Word (.docx)
 */
export async function exportToDOCX(cv) {
  const labels = SECTION_LABELS[cv.langueCV || 'fr'] || SECTION_LABELS.fr;
  const primaryHex = (cv.parametres?.couleurPrincipale || '#1e40af').replace('#', '');
  const children = [];

  // Candidate Name & Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: cv.personnel.nomComplet || 'Nom Complet',
          bold: true,
          size: 44,
          color: primaryHex,
          font: 'Calibri',
        }),
      ],
    })
  );

  if (cv.personnel.titrePoste) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: cv.personnel.titrePoste,
            bold: true,
            size: 26,
            color: '475569',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Contact Line
  const contactItems = [
    cv.personnel.email,
    cv.personnel.telephone,
    cv.personnel.adresse,
    cv.personnel.linkedin,
    cv.personnel.github,
    cv.personnel.permisDeConduire,
  ].filter(Boolean);

  if (contactItems.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        border: {
          bottom: { color: primaryHex, space: 6, style: BorderStyle.SINGLE, size: 12 },
        },
        children: [
          new TextRun({
            text: contactItems.join('  •  '),
            size: 20,
            color: '334155',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  const makeSectionHeader = (title) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 120 },
      border: {
        bottom: { color: primaryHex, space: 4, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 24,
          color: primaryHex,
          font: 'Calibri',
        }),
      ],
    });

  // Profile Summary
  if (cv.personnel.resume) {
    children.push(makeSectionHeader(labels.profil));
    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: cv.personnel.resume,
            size: 21,
            color: '1e293b',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Experiences
  if (cv.experiences?.length > 0) {
    children.push(makeSectionHeader(labels.experiences));
    for (const exp of cv.experiences) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: `${exp.poste}`,
              bold: true,
              size: 23,
              color: '0f172a',
              font: 'Calibri',
            }),
            new TextRun({
              text: `  —  ${exp.entreprise}`,
              bold: true,
              size: 21,
              color: primaryHex,
              font: 'Calibri',
            }),
            new TextRun({
              text: `   (${exp.dateDebut} - ${exp.dateFin})`,
              italics: true,
              size: 20,
              color: '64748b',
              font: 'Calibri',
            }),
          ],
        })
      );

      if (exp.description) {
        const lines = exp.description.split('\n').filter(Boolean);
        for (const line of lines) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: line.startsWith('•') ? line : `• ${line}`,
                  size: 20,
                  color: '334155',
                  font: 'Calibri',
                }),
              ],
            })
          );
        }
      }
    }
  }

  // Formations
  if (cv.formations?.length > 0) {
    children.push(makeSectionHeader(labels.formations));
    for (const form of cv.formations) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: form.diplome,
              bold: true,
              size: 22,
              color: '0f172a',
              font: 'Calibri',
            }),
            new TextRun({
              text: `  —  ${form.ecole} (${form.dateDebut} - ${form.dateFin})`,
              size: 20,
              color: '475569',
              font: 'Calibri',
            }),
          ],
        })
      );
      if (form.description) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: form.description,
                size: 19,
                color: '475569',
                font: 'Calibri',
              }),
            ],
          })
        );
      }
    }
  }

  // Competences
  if (cv.competences?.length > 0) {
    children.push(makeSectionHeader(labels.competences));
    children.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: cv.competences.map((c) => c.nom).join('  •  '),
            bold: true,
            size: 21,
            color: '1e293b',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Langues
  if (cv.langues?.length > 0) {
    children.push(makeSectionHeader(labels.langues));
    children.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: cv.langues.map((l) => `${l.nom} (${l.niveau})`).join('   |   '),
            size: 20,
            color: '1e293b',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Certifications
  if (cv.certifications?.length > 0) {
    children.push(makeSectionHeader(labels.certifications));
    for (const cert of cv.certifications) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `• ${cert.nom} — ${cert.organisme} (${cert.date})`,
              size: 20,
              color: '1e293b',
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  // Projets
  if (cv.projets?.length > 0) {
    children.push(makeSectionHeader(labels.projets));
    for (const proj of cv.projets) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${proj.nom}${proj.technologies ? ` [${proj.technologies}]` : ''} : `,
              bold: true,
              size: 20,
              color: '0f172a',
              font: 'Calibri',
            }),
            new TextRun({
              text: proj.description || '',
              size: 20,
              color: '334155',
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  // Centres d'intérêt
  if (cv.centresInteret?.length > 0) {
    children.push(makeSectionHeader(labels.centresInteret));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cv.centresInteret.map((i) => i.nom).join('  •  '),
            size: 20,
            color: '334155',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${getFileSlug(cv)}.docx`);
}

/**
 * 3. Export Image Formats : JPEG (.jpg), PNG (.png), WebP (.webp)
 */
export async function exportToImage(cv, format = 'jpeg', elementId = 'cv-print-area') {
  const canvas = await captureCVCanvas(elementId, 3.0); // 300 DPI ultra-sharp
  const mimeMap = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const extMap = {
    jpeg: 'jpg',
    jpg: 'jpg',
    png: 'png',
    webp: 'webp',
  };

  const mime = mimeMap[format] || 'image/jpeg';
  const ext = extMap[format] || 'jpg';

  canvas.toBlob(
    (blob) => {
      if (blob) saveAs(blob, `${getFileSlug(cv)}.${ext}`);
    },
    mime,
    0.98
  );
}

/**
 * 4. Export SVG Vector (.svg)
 */
export async function exportToSVG(cv, elementId = 'cv-print-area') {
  const canvas = await captureCVCanvas(elementId, 2.5);
  const dataUrl = canvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="794" height="1123" viewBox="0 0 794 1123">
  <title>CV - ${cv.personnel.nomComplet || 'CV Generator King'}</title>
  <image width="794" height="1123" xlink:href="${dataUrl}" />
</svg>`;
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, `${getFileSlug(cv)}.svg`);
}

/**
 * 5. Export Standalone HTML (.html)
 */
export function exportToHTML(cv, elementId = 'cv-print-area') {
  const el = document.getElementById(elementId);
  const innerHTML = el ? el.outerHTML : '';
  const htmlDoc = `<!DOCTYPE html>
<html lang="${cv.langueCV || 'fr'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV - ${cv.personnel.nomComplet}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@600;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body { background: #f1f5f9; display: flex; justify-content: center; padding: 24px; font-family: '${cv.parametres?.police || 'Inter'}', sans-serif; }
    .a4-sheet { width: 210mm; min-height: 297mm; background: white; box-shadow: 0 15px 35px rgba(0,0,0,0.12); }
    @media print { body { background: white; padding: 0; } .a4-sheet { box-shadow: none; } }
  </style>
</head>
<body>
  ${innerHTML}
</body>
</html>`;
  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${getFileSlug(cv)}.html`);
}

/**
 * 6. Export Markdown (.md) & Plain Text ATS (.txt)
 */
export function exportToTextOrMarkdown(cv, format = 'md') {
  const labels = SECTION_LABELS[cv.langueCV || 'fr'] || SECTION_LABELS.fr;
  const isMd = format === 'md';
  const h1 = isMd ? '# ' : '';
  const h2 = isMd ? '## ' : '\n=== ';
  const h2End = isMd ? '' : ' ===';

  const lines = [
    `${h1}${cv.personnel.nomComplet}`,
    `${cv.personnel.titrePoste}`,
    [cv.personnel.email, cv.personnel.telephone, cv.personnel.adresse, cv.personnel.linkedin, cv.personnel.github]
      .filter(Boolean)
      .join(' | '),
    '',
  ];

  if (cv.personnel.resume) {
    lines.push(`${h2}${labels.profil}${h2End}`, cv.personnel.resume, '');
  }

  if (cv.experiences?.length > 0) {
    lines.push(`${h2}${labels.experiences}${h2End}`);
    for (const exp of cv.experiences) {
      lines.push(
        `${isMd ? '### ' : ''}${exp.poste} — ${exp.entreprise} (${exp.dateDebut} - ${exp.dateFin})`,
        exp.description,
        ''
      );
    }
  }

  if (cv.formations?.length > 0) {
    lines.push(`${h2}${labels.formations}${h2End}`);
    for (const f of cv.formations) {
      lines.push(`- ${f.diplome} | ${f.ecole} (${f.dateDebut} - ${f.dateFin})`);
    }
    lines.push('');
  }

  if (cv.competences?.length > 0) {
    lines.push(`${h2}${labels.competences}${h2End}`, cv.competences.map((c) => c.nom).join(', '), '');
  }

  if (cv.langues?.length > 0) {
    lines.push(`${h2}${labels.langues}${h2End}`, cv.langues.map((l) => `${l.nom} (${l.niveau})`).join(', '), '');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${getFileSlug(cv)}.${isMd ? 'md' : 'txt'}`);
}

/**
 * 7. Export JSON Project Backup (.json)
 */
export function exportToJSON(cv) {
  const jsonStr = JSON.stringify(cv, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `${getFileSlug(cv, 'Projet_King')}.json`);
}

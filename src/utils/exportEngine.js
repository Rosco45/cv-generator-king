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

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123; // 794 * (297 / 210)

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
 * Ensure any non-square image in the cloned DOM is center-cropped to match its rendered box
 * so html2canvas never stretches or compresses photos.
 */
async function normalizeImagesInClone(cloneRoot) {
  const imgs = Array.from(cloneRoot.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );

  for (const img of imgs) {
    const rect = img.getBoundingClientRect();
    const boxW = Math.round(rect.width) || img.width || 100;
    const boxH = Math.round(rect.height) || img.height || 100;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    if (!natW || !natH || !boxW || !boxH) continue;

    // If aspect ratios differ, center-crop onto an offscreen canvas matching boxW:boxH
    const boxRatio = boxW / boxH;
    const natRatio = natW / natH;
    if (Math.abs(boxRatio - natRatio) > 0.04) {
      const canvas = document.createElement('canvas');
      const scale = 3;
      canvas.width = boxW * scale;
      canvas.height = boxH * scale;
      const ctx = canvas.getContext('2d');

      let sx = 0;
      let sy = 0;
      let sWidth = natW;
      let sHeight = natH;

      if (natRatio > boxRatio) {
        sWidth = natH * boxRatio;
        sx = (natW - sWidth) / 2;
      } else {
        sHeight = natW / boxRatio;
        sy = (natH - sHeight) / 2;
      }

      try {
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        img.src = canvas.toDataURL('image/png');
      } catch {
        // Ignore CORS tainted external URLs
      }
    }
  }
}

/**
 * Smart Paginator: Prevents blocks from being sliced across A4 page boundaries (multiples of 1123px)
 */
function applySmartPageBreaksToClone(cloneEl, fitOnePage = false) {
  const totalRawHeight = cloneEl.scrollHeight;

  // If CV fits on 1 page (or is within 45px of 1 page, or user asked for 1-page fit)
  if (fitOnePage || totalRawHeight <= A4_HEIGHT_PX + 45) {
    if (totalRawHeight > A4_HEIGHT_PX) {
      // Gently compact vertical spacing to fit cleanly on 1 A4 page without squishing aspect ratio
      const ratio = A4_HEIGHT_PX / totalRawHeight;
      if (ratio >= 0.82) {
        cloneEl.style.zoom = `${ratio}`;
      }
    }
    cloneEl.style.height = `${A4_HEIGHT_PX}px`;
    cloneEl.style.minHeight = `${A4_HEIGHT_PX}px`;
    cloneEl.style.overflow = 'hidden';
    return 1;
  }

  // Multi-page layout: inspect all [data-pdf-block="true"] elements in document order
  const PAGE_PADDING_TOP = 36;
  const PAGE_PADDING_BOTTOM = 28;
  const blocks = Array.from(cloneEl.querySelectorAll('[data-pdf-block="true"]'));

  for (const block of blocks) {
    const rootRect = cloneEl.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    const topRel = blockRect.top - rootRect.top;
    const bottomRel = blockRect.bottom - rootRect.top;
    const blockHeight = blockRect.height;

    // Skip huge blocks taller than half a page
    if (blockHeight > A4_HEIGHT_PX * 0.65) continue;

    const startPage = Math.floor(topRel / A4_HEIGHT_PX);
    const endPage = Math.floor((bottomRel - 2) / A4_HEIGHT_PX);
    const pageBottomLimit = (startPage + 1) * A4_HEIGHT_PX - PAGE_PADDING_BOTTOM;

    if (endPage > startPage || bottomRel > pageBottomLimit) {
      const nextPageStart = (startPage + 1) * A4_HEIGHT_PX + PAGE_PADDING_TOP;
      const pushDownPx = Math.ceil(nextPageStart - topRel);
      if (pushDownPx > 0 && pushDownPx < A4_HEIGHT_PX * 0.5) {
        const currentMarginTop = parseFloat(window.getComputedStyle(block).marginTop) || 0;
        block.style.marginTop = `${currentMarginTop + pushDownPx}px`;
      }
    }
  }

  // Recalculate total pages after smart page breaks
  const finalHeight = cloneEl.scrollHeight;
  const numPages = Math.max(1, Math.ceil((finalHeight - 10) / A4_HEIGHT_PX));
  const exactTotalHeight = numPages * A4_HEIGHT_PX;

  cloneEl.style.minHeight = `${exactTotalHeight}px`;
  cloneEl.style.height = `${exactTotalHeight}px`;

  // Ensure any sidebar stretches across all pages
  const sidebar = cloneEl.querySelector('[data-cv-sidebar="true"]');
  if (sidebar) {
    sidebar.style.minHeight = `${exactTotalHeight}px`;
  }

  return numPages;
}

/**
 * Render `#cv-print-area` in an isolated, unscaled offscreen 794px container
 * so parent CSS `transform: scale(zoom)` never distorts text spacing or photos.
 */
async function captureCVCanvas(elementId = 'cv-print-area', scale = 2.5, options = {}) {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) throw new Error('Zone de rendu du CV introuvable.');

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Create off-screen unscaled host attached directly to document.body
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = `${A4_WIDTH_PX}px`;
  host.style.zIndex = '-9999';
  host.style.background = '#ffffff';
  host.style.transform = 'none';
  host.style.letterSpacing = 'normal';
  host.style.wordSpacing = 'normal';
  host.style.fontKerning = 'normal';

  const clone = sourceEl.cloneNode(true);
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minHeight = `${A4_HEIGHT_PX}px`;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.letterSpacing = 'normal';
  clone.style.wordSpacing = 'normal';

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // 1. Ensure all images are loaded and center-cropped to exact aspect ratio
    await normalizeImagesInClone(clone);

    // 2. Apply smart pagination so no block is cut across page breaks
    const numPages = applySmartPageBreaksToClone(clone, Boolean(options.fitOnePage));

    // Wait 1 frame for layout reflow
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(clone, {
      scale,
      width: A4_WIDTH_PX,
      height: clone.scrollHeight,
      windowWidth: A4_WIDTH_PX,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    return { canvas, numPages, scale };
  } finally {
    document.body.removeChild(host);
  }
}

/**
 * 1. Export PDF (.pdf) with Smart Page-Break Slicing & Zero Photo Distortion
 */
export async function exportToPDF(cv, elementId = 'cv-print-area', suffix = 'CV', options = {}) {
  const { canvas, numPages, scale } = await captureCVCanvas(elementId, 2.5, options);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidthMm = pdf.internal.pageSize.getWidth(); // 210
  const pdfHeightMm = pdf.internal.pageSize.getHeight(); // 297

  const pageWidthPx = A4_WIDTH_PX * scale;
  const pageHeightPx = A4_HEIGHT_PX * scale;

  for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = pageWidthPx;
    pageCanvas.height = pageHeightPx;
    const ctx = pageCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

    const sy = pageIndex * pageHeightPx;
    const availableHeight = Math.min(pageHeightPx, canvas.height - sy);

    if (availableHeight > 0) {
      ctx.drawImage(
        canvas,
        0,
        sy,
        pageWidthPx,
        availableHeight,
        0,
        0,
        pageWidthPx,
        availableHeight
      );
    }

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm);
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
  const { canvas } = await captureCVCanvas(elementId, 3.0);
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
  const { canvas, numPages } = await captureCVCanvas(elementId, 2.5);
  const dataUrl = canvas.toDataURL('image/png');
  const totalHeight = A4_HEIGHT_PX * numPages;
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${A4_WIDTH_PX}" height="${totalHeight}" viewBox="0 0 ${A4_WIDTH_PX} ${totalHeight}">
  <title>CV - ${cv.personnel.nomComplet || 'CV Generator King'}</title>
  <image width="${A4_WIDTH_PX}" height="${totalHeight}" xlink:href="${dataUrl}" />
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

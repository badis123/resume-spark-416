// Client-side PDF and DOCX generation for the optimized CV + cover letter.
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export type OptimizedDocs = {
  candidateName?: string;
  jobTitle?: string;
  company?: string;
  optimizedSummary: string;
  improvedExperience: string[];
  recommendedSkills: string[];
  coverLetter: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------- PDF ---------------- */
function pdfWriteWrapped(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 6) {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export function downloadCvPdf(data: OptimizedDocs) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const width = 210 - margin * 2;
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Optimized CV", margin, y);
  y += 8;
  if (data.jobTitle || data.company) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Tailored for ${[data.jobTitle, data.company].filter(Boolean).join(" — ")}`, margin, y);
    doc.setTextColor(20);
    y += 8;
  } else {
    y += 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Professional Summary", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = pdfWriteWrapped(doc, data.optimizedSummary, margin, y, width);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Key Skills", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = pdfWriteWrapped(doc, data.recommendedSkills.join("  •  "), margin, y, width);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Experience Highlights", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const bullet of data.improvedExperience) {
    y = pdfWriteWrapped(doc, `• ${bullet}`, margin, y, width);
    y += 1;
  }

  downloadBlob(doc.output("blob"), "optimized-cv.pdf");
}

export function downloadCoverLetterPdf(data: OptimizedDocs) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 22;
  const width = 210 - margin * 2;
  let y = 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Cover Letter", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = pdfWriteWrapped(doc, data.coverLetter, margin, y, width, 6.5);

  downloadBlob(doc.output("blob"), "cover-letter.pdf");
}

/* ---------------- DOCX ---------------- */
function p(text: string, opts: { bold?: boolean; size?: number; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] } = {}) {
  return new Paragraph({
    heading: opts.heading,
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, bold: opts.bold, size: opts.size })],
    spacing: { after: 120 },
  });
}

export async function downloadCvDocx(data: OptimizedDocs) {
  const children: Paragraph[] = [
    p("Optimized CV", { heading: HeadingLevel.HEADING_1 }),
  ];
  if (data.jobTitle || data.company) {
    children.push(p(`Tailored for ${[data.jobTitle, data.company].filter(Boolean).join(" — ")}`, { size: 20 }));
  }
  children.push(p("Professional Summary", { heading: HeadingLevel.HEADING_2 }));
  children.push(p(data.optimizedSummary));
  children.push(p("Key Skills", { heading: HeadingLevel.HEADING_2 }));
  children.push(p(data.recommendedSkills.join("  •  ")));
  children.push(p("Experience Highlights", { heading: HeadingLevel.HEADING_2 }));
  for (const bullet of data.improvedExperience) {
    children.push(new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun(bullet)],
      spacing: { after: 80 },
    }));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    sections: [{ properties: {}, children }],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, "optimized-cv.docx");
}

export async function downloadCoverLetterDocx(data: OptimizedDocs) {
  const children: Paragraph[] = [
    p("Cover Letter", { heading: HeadingLevel.HEADING_1 }),
  ];
  for (const para of data.coverLetter.split(/\n\s*\n/)) {
    children.push(p(para.trim()));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: {}, children }],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, "cover-letter.docx");
}

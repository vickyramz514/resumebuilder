import { BorderStyle, Document, Packer, Paragraph, TextRun } from 'docx';
import type { Resume, SectionType } from '../types';

const sectionTitles: Record<SectionType, string> = {
  summary: 'Profile',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications'
};

const font = 'Calibri';

function line(text: string, options: { bold?: boolean; italics?: boolean; size?: number; color?: string; after?: number; before?: number } = {}) {
  return new Paragraph({
    spacing: { before: options.before ?? 0, after: options.after ?? 60 },
    children: [new TextRun({ text, bold: options.bold, italics: options.italics, size: options.size ?? 22, color: options.color, font })]
  });
}

function heading(title: string) {
  return new Paragraph({
    border: { bottom: { color: '202124', space: 1, style: BorderStyle.SINGLE, size: 8 } },
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, font, characterSpacing: 40 })]
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 21, font })]
  });
}

function dates(start: string, end: string, current = false) {
  const finish = current ? 'Present' : end;
  return [start, finish].filter(Boolean).join(' – ');
}

export async function buildResumeDocx(resume: Resume) {
  const hidden = new Set(resume.hiddenSections ?? []);
  const contact = resume.personal.contact;
  const contactLine = [contact.email, contact.phone, contact.location, contact.website, contact.linkedin, contact.github].filter(Boolean).join('  ·  ');
  const children: Paragraph[] = [
    line(resume.personal.name || 'Resume', { bold: true, size: 36, after: 40 }),
  ];
  if (resume.personal.headline) children.push(line(resume.personal.headline, { italics: true, size: 22, color: '444444', after: 40 }));
  if (contactLine) children.push(line(contactLine, { size: 18, color: '555555', after: 80 }));

  for (const section of resume.sections) {
    if (hidden.has(section)) continue;
    if (section === 'summary' && resume.summary.trim()) {
      children.push(heading(sectionTitles.summary), line(resume.summary, { size: 21, after: 80 }));
    }
    if (section === 'experience' && resume.experience.length) {
      children.push(heading(sectionTitles.experience));
      for (const item of resume.experience) {
        children.push(line([item.role, item.company].filter(Boolean).join('  ·  '), { bold: true, size: 22, before: 80, after: 0 }));
        const meta = [dates(item.startDate, item.endDate, item.current), item.location].filter(Boolean).join('  ·  ');
        if (meta) children.push(line(meta, { italics: true, size: 18, color: '666666', after: 40 }));
        for (const point of item.bullets.filter(Boolean)) children.push(bullet(point));
      }
    }
    if (section === 'education' && resume.education.length) {
      children.push(heading(sectionTitles.education));
      for (const item of resume.education) {
        children.push(line([item.degree, item.school].filter(Boolean).join('  ·  '), { bold: true, size: 22, before: 80, after: 0 }));
        const meta = [dates(item.startDate, item.endDate), item.location].filter(Boolean).join('  ·  ');
        if (meta) children.push(line(meta, { italics: true, size: 18, color: '666666', after: 40 }));
      }
    }
    if (section === 'skills' && resume.skills.filter(Boolean).length) {
      children.push(heading(sectionTitles.skills), line(resume.skills.filter(Boolean).join('  ·  '), { size: 21, after: 80 }));
    }
    if (section === 'projects' && resume.projects.length) {
      children.push(heading(sectionTitles.projects));
      for (const item of resume.projects) {
        children.push(line(item.name, { bold: true, size: 22, before: 80, after: 0 }));
        if (item.technologies) children.push(line(item.technologies, { italics: true, size: 18, color: '666666', after: 20 }));
        if (item.description) children.push(line(item.description, { size: 21, after: 20 }));
        if (item.url) children.push(line(item.url, { size: 18, color: '1a56db', after: 40 }));
      }
    }
    if (section === 'certifications' && resume.certifications.length) {
      children.push(heading(sectionTitles.certifications));
      for (const item of resume.certifications) {
        const label = [item.name, item.issuer].filter(Boolean).join('  ·  ');
        children.push(line(item.date ? `${label}  (${item.date})` : label, { size: 21, before: 40, after: 20 }));
      }
    }
  }

  const document = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children
    }]
  });
  return Packer.toBlob(document);
}

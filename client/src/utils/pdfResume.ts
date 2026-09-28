import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

const IMPORTED_TEMPLATE = 'modern';
const IMPORTED_ACCENT = '#0f766e';

const HEADINGS: Record<string, string> = {
  summary: 'summary',
  'professional summary': 'summary',
  profile: 'summary',
  about: 'summary',
  'about me': 'summary',
  objective: 'summary',
  experience: 'experience',
  'work experience': 'experience',
  'professional experience': 'experience',
  employment: 'experience',
  'work history': 'experience',
  education: 'education',
  'academic background': 'education',
  skills: 'skills',
  'technical skills': 'skills',
  'core skills': 'skills',
  technologies: 'skills',
  projects: 'projects',
  'selected projects': 'projects',
  certifications: 'certifications',
  certificates: 'certifications',
  languages: 'languages',
  awards: 'awards',
  honors: 'awards',
  volunteer: 'volunteer',
  volunteering: 'volunteer'
};

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]\d{3,5}(?:[\s.-]\d{2,5})?/;
const LINKEDIN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Z0-9_-]+/i;
const GITHUB = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Z0-9_-]+/i;
const WEBSITE = /https?:\/\/[^\s]+/i;
const DATE_RANGE = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(?:-|–|—|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current|now)/i;

const freshId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

export async function extractPdfLines(data: ArrayBuffer) {
  const pdf = await getDocument({ data: new Uint8Array(data), useSystemFonts: true }).promise;
  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows: { y: number; parts: { x: number; text: string }[] }[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;
      const textItem = item as { str: string; transform: number[] };
      const text = textItem.str.replace(/\s+/g, ' ');
      if (!text.trim()) continue;
      const x = textItem.transform[4];
      const y = textItem.transform[5];
      const row = rows.find((entry) => Math.abs(entry.y - y) < 3);
      if (row) row.parts.push({ x, text });
      else rows.push({ y, parts: [{ x, text }] });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const row of rows) {
      row.parts.sort((a, b) => a.x - b.x);
      const text = row.parts.map((part) => part.text).join(' ').replace(/\s+/g, ' ').trim();
      if (text) lines.push(text);
    }
  }
  return lines;
}

function headingOf(line: string) {
  const key = line.replace(/[:|–—-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!key || key.length > 40) return null;
  return HEADINGS[key] ?? null;
}

function dateOf(line: string) {
  const match = line.match(DATE_RANGE);
  if (!match) return null;
  const current = /present|current|now/i.test(match[2]);
  return { start: match[1], end: current ? '' : match[2], current, raw: match[0] };
}

function stripBullet(line: string) {
  return line.replace(/^(?:[•\-*·▪►]\s+|\d+[.)]\s+)/, '').trim();
}

function isBullet(line: string) {
  return /^(?:[•\-*·▪►]\s+|\d+[.)]\s+)/.test(line);
}

function blankRole() {
  return { role: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [] as string[] };
}

function parseExperience(lines: string[]) {
  const roles: ReturnType<typeof blankRole>[] = [];
  let current: ReturnType<typeof blankRole> | null = null;
  const push = () => {
    if (current && (current.role || current.company || current.bullets.length)) roles.push(current);
    current = null;
  };
  const fillRole = (role: ReturnType<typeof blankRole>, line: string) => {
    const parts = line.split(/\s+\|\s+|\s+·\s+|\s+ at \s+/i).map((part) => part.trim()).filter(Boolean);
    role.role = parts[0] ?? line;
    if (parts[1]) role.company = parts[1];
    if (parts[2]) role.location = parts[2];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (isBullet(line)) {
      current ??= blankRole();
      current.bullets.push(stripBullet(line));
      continue;
    }
    const date = dateOf(line);
    if (date && line.length < 90) {
      current ??= blankRole();
      current.startDate = date.start;
      current.endDate = date.end;
      current.current = date.current;
      const rest = line.replace(date.raw, '').replace(/[|·,–—-]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (rest && !current.location) current.location = rest;
      continue;
    }
    if (current?.role || current?.bullets.length) push();
    current ??= blankRole();
    if (!current.role) fillRole(current, line);
    else if (!current.company) current.company = line;
    else if (!current.location) current.location = line;
    else {
      push();
      current = blankRole();
      fillRole(current, line);
    }
  }
  push();
  return roles.map((role, index) => ({ id: freshId('experience', index), ...role, bullets: role.bullets.length ? role.bullets : [''] }));
}

function parseSkills(lines: string[]) {
  const skills: string[] = [];
  for (const raw of lines) {
    const line = stripBullet(raw);
    const parts = line.split(/[,|•·]/).map((part) => part.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.length < 2 || part.length > 40) continue;
      if (!skills.some((skill) => skill.toLowerCase() === part.toLowerCase())) skills.push(part);
    }
  }
  return skills;
}

function parseEducation(lines: string[]) {
  const items: { school: string; degree: string; location: string; startDate: string; endDate: string }[] = [];
  let current: (typeof items)[number] | null = null;
  const push = () => {
    if (current && (current.school || current.degree)) items.push(current);
    current = null;
  };
  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;
    const date = dateOf(line);
    if (date && line.length < 90) {
      current ??= { school: '', degree: '', location: '', startDate: '', endDate: '' };
      current.startDate = date.start;
      current.endDate = date.end;
      continue;
    }
    if (current?.school && current.degree) push();
    current ??= { school: '', degree: '', location: '', startDate: '', endDate: '' };
    if (!current.school) current.school = line;
    else if (!current.degree) current.degree = line;
    else if (!current.location) current.location = line;
  }
  push();
  return items.map((item, index) => ({ id: freshId('education', index), ...item }));
}

function parseSimple(lines: string[], kind: 'projects' | 'certifications' | 'languages' | 'awards' | 'volunteer') {
  return lines.map(stripBullet).filter(Boolean).map((line, index) => {
    if (kind === 'projects') return { id: freshId('project', index), name: line, description: '', url: '', technologies: '' };
    if (kind === 'certifications') return { id: freshId('certification', index), name: line, issuer: '', date: '' };
    if (kind === 'languages') return { id: freshId('language', index), name: line, level: '' };
    if (kind === 'awards') return { id: freshId('award', index), name: line, issuer: '', date: '' };
    return { id: freshId('volunteer', index), role: line, organization: '', startDate: '', endDate: '', summary: '' };
  });
}

export function draftFromPdfLines(lines: string[]) {
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  if (!cleaned.length) {
    throw new Error('This PDF has no selectable text. Use a text resume, not a scanned image.');
  }

  const buckets: Record<string, string[]> = {};
  const preamble: string[] = [];
  let section: string | null = null;
  for (const line of cleaned) {
    const heading = headingOf(line);
    if (heading) {
      section = heading;
      buckets[section] ??= [];
      continue;
    }
    if (!section) preamble.push(line);
    else (buckets[section] ??= []).push(line);
  }

  const contactBlob = cleaned.join('\n');
  const email = contactBlob.match(EMAIL)?.[0] ?? '';
  const linkedin = contactBlob.match(LINKEDIN)?.[0] ?? '';
  const github = contactBlob.match(GITHUB)?.[0] ?? '';
  const websiteMatch = contactBlob.match(WEBSITE)?.[0] ?? '';
  const website = websiteMatch && !/linkedin\.com|github\.com/i.test(websiteMatch) ? websiteMatch : '';
  const phone = contactBlob.match(PHONE)?.[0]?.trim() ?? '';

  const identity = preamble.filter((line) => {
    if (EMAIL.test(line) && line.length < 80) return false;
    if (PHONE.test(line) && line.length < 40) return false;
    if (/linkedin\.com|github\.com|https?:\/\//i.test(line) && line.length < 80) return false;
    return true;
  });
  const name = identity[0]?.slice(0, 80) || 'Your Name';
  const headline = identity[1] && identity[1].length < 120 ? identity[1] : '';
  const summaryBits = [...(identity.slice(headline ? 2 : 1)), ...(buckets.summary ?? [])];

  const experience = parseExperience(buckets.experience ?? []);
  const skills = parseSkills(buckets.skills ?? []);
  const education = parseEducation(buckets.education ?? []);
  if (!name && !experience.length && !skills.length && !summaryBits.length) {
    throw new Error('We could not find resume sections in that PDF.');
  }

  return {
    title: `${name} Resume`,
    template: IMPORTED_TEMPLATE,
    accentColor: IMPORTED_ACCENT,
    design: { fontFamily: 'source-sans', fontSize: 11, lineHeight: 1.5, spacing: 16, density: 'comfortable' },
    personal: {
      name,
      headline,
      contact: { email, phone, location: '', website, linkedin, github }
    },
    summary: summaryBits.join(' '),
    skills,
    experience,
    education,
    projects: parseSimple(buckets.projects ?? [], 'projects'),
    certifications: parseSimple(buckets.certifications ?? [], 'certifications'),
    languages: parseSimple(buckets.languages ?? [], 'languages'),
    awards: parseSimple(buckets.awards ?? [], 'awards'),
    volunteer: parseSimple(buckets.volunteer ?? [], 'volunteer')
  };
}

export async function resumeDraftFromPdf(file: File) {
  const lines = await extractPdfLines(await file.arrayBuffer());
  return draftFromPdfLines(lines);
}

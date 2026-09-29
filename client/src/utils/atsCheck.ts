import type { Resume } from '../types';
import { withResumeDefaults } from './resumeDefaults';

const STOP = new Set([
  'about', 'above', 'after', 'again', 'against', 'also', 'among', 'and', 'another', 'any', 'are', 'around',
  'because', 'been', 'before', 'being', 'between', 'both', 'but', 'can', 'could', 'did', 'does', 'doing',
  'during', 'each', 'else', 'etc', 'for', 'from', 'had', 'has', 'have', 'having', 'here', 'how', 'into',
  'its', 'just', 'like', 'more', 'most', 'must', 'not', 'now', 'our', 'out', 'over', 'own', 'per', 'role',
  'same', 'shall', 'should', 'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'under', 'until', 'very', 'was', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'will', 'with', 'within', 'would', 'you', 'your', 'years', 'year',
  'work', 'working', 'team', 'teams', 'ability', 'able', 'including', 'include', 'using', 'use', 'used',
  'strong', 'good', 'great', 'well', 'etc', 'job', 'position', 'candidate', 'looking', 'required',
  'requirements', 'preferred', 'experience', 'skills', 'skill', 'responsibilities', 'responsibility',
  'high', 'need', 'needs', 'plus', 'only', 'best', 'help', 'make', 'made', 'join', 'apply', 'real',
  'fast', 'large', 'small', 'other', 'based', 'build', 'built', 'across', 'please'
]);

export type AtsHeading = { label: string; present: boolean; detail: string };

export type AtsReport = {
  score: number;
  matched: string[];
  missing: string[];
  headings: AtsHeading[];
};

const SHORT_TECH = new Set([
  'ai', 'ml', 'ui', 'ux', 'qa', 'go', 'sql', 'aws', 'gcp', 'api', 'ios', 'nlp', 'sdk', 'css', 'html',
  'xml', 'jwt', 'cdn', 'erp', 'crm', 'etl', 'oop', 'tdd', 'rest', 'grpc', 'orm', 'ssh', 'dns', 'sap', 'bi'
]);

const SPECIAL = /\b(?:[A-Z]{2,}(?:\/[A-Z0-9]+)+|C\+\+|C#|[A-Za-z][\w]*\.[\w.]+|[A-Za-z]{3,}(?:-[A-Za-z]{2,})+)\b/g;

type Keyword = { label: string; weight: number; count: number };

function displayWord(word: string): string {
  if (/^[A-Z0-9][A-Z0-9./+#-]{1,}$/.test(word) || /^[A-Z]{2,}[a-z]*$/.test(word)) return word;
  const lower = word.toLowerCase();
  if (SHORT_TECH.has(lower) && !lower.includes('.') && !lower.includes('-')) return lower.toUpperCase();
  if (word.includes('-')) return word.split('-').map(displayWord).join('-');
  if (word.includes('.')) return word.charAt(0).toUpperCase() + word.slice(1);
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function displayLabel(raw: string) {
  const trimmed = raw.trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
  return trimmed ? trimmed.split(' ').map(displayWord).join(' ') : '';
}

function extractKeywords(jobDescription: string) {
  const found = new Map<string, Keyword>();
  const add = (raw: string, weight: number) => {
    const label = displayLabel(raw);
    const key = label.toLowerCase();
    if (!label || STOP.has(key)) return;
    const existing = found.get(key);
    if (existing) {
      existing.count += 1;
      existing.weight = Math.max(existing.weight, weight);
      return;
    }
    found.set(key, { label, weight, count: 1 });
  };

  const specials = jobDescription.match(new RegExp(SPECIAL.source, 'g')) ?? [];
  for (const match of specials) add(match, 3);

  const stripped = jobDescription.replace(new RegExp(SPECIAL.source, 'g'), ' ');
  const tokens = stripped.match(/[A-Za-z][A-Za-z0-9+#]*/g) ?? [];
  const roleWord = new Set(['engineer', 'developer', 'manager', 'designer', 'analyst', 'architect', 'consultant', 'specialist', 'intern', 'lead', 'senior', 'junior', 'officer', 'associate']);
  let previous: { raw: string; lower: string } | null = null;
  for (const token of tokens) {
    const lower = token.toLowerCase();
    const acronym = token === token.toUpperCase() && /[A-Z]/.test(token) && token.length >= 2 && token.length <= 6;
    const keep = !STOP.has(lower) && (lower.length >= 5 || acronym || SHORT_TECH.has(lower) || lower === 'java' || lower === 'ruby' || lower === 'rust' || lower === 'php');
    if (!keep) {
      previous = null;
      continue;
    }
    add(acronym ? token : lower, acronym || SHORT_TECH.has(lower) ? 3 : lower.length >= 8 ? 2 : 1);
    if (
      previous
      && !roleWord.has(lower)
      && !roleWord.has(previous.lower)
      && !acronym
      && !SHORT_TECH.has(previous.lower)
      && new RegExp(`\\b${escapeRegExp(previous.raw)}\\s+${escapeRegExp(token)}\\b`, 'i').test(jobDescription)
    ) {
      add(`${previous.raw} ${token}`, 3);
    }
    previous = { raw: token, lower };
  }

  for (const [key, item] of found) {
    if (key.includes(' ')) continue;
    const covered = [...found.values()].some((other) => {
      if (!other.label.includes(' ')) return false;
      return other.label.toLowerCase().split(/[\s/-]+/).includes(key) && other.count >= item.count;
    });
    if (covered) found.delete(key);
  }

  return [...found.values()]
    .sort((a, b) => b.weight - a.weight || b.count - a.count || b.label.length - a.label.length)
    .filter((item) => item.weight >= 2 || /[\s./-]/.test(item.label))
    .slice(0, 40);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resumeHas(resumeText: string, keyword: string) {
  const hay = resumeText.toLowerCase();
  const needle = keyword.toLowerCase().trim();
  const forms = new Set([
    needle,
    needle.replace(/[-/]/g, ' '),
    needle.replace(/[-/\s.]/g, ''),
    needle.replace(/\b([a-z]{4,})s\b/g, '$1')
  ]);
  for (const form of forms) {
    if (!form) continue;
    if (form.includes(' ')) {
      const loose = hay.replace(/[-/]/g, ' ');
      if (loose.includes(form) || loose.replace(/\s+/g, '').includes(form.replace(/\s+/g, ''))) return true;
      continue;
    }
    if (new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(form)}(?:[^a-z0-9]|$)`, 'i').test(hay)) return true;
  }
  return false;
}

export function resumePlainText(input: Resume) {
  const resume = withResumeDefaults(input);
  const parts = [
    resume.personal.name,
    resume.personal.headline,
    resume.summary,
    resume.skills.join(' '),
    ...resume.experience.flatMap((item) => [item.role, item.company, ...item.bullets]),
    ...resume.education.flatMap((item) => [item.degree, item.school]),
    ...resume.projects.flatMap((item) => [item.name, item.description, item.technologies]),
    ...resume.certifications.flatMap((item) => [item.name, item.issuer]),
    ...resume.languages.flatMap((item) => [item.name, item.level]),
    ...resume.awards.flatMap((item) => [item.name, item.issuer]),
    ...resume.volunteer.flatMap((item) => [item.role, item.organization, item.summary])
  ];
  return parts.filter(Boolean).join('\n');
}

export function checkAts(input: Resume, jobDescription: string): AtsReport {
  const resume = withResumeDefaults(input);
  const keywords = extractKeywords(jobDescription).map((item) => item.label);
  const plain = resumePlainText(resume);
  const matched = keywords.filter((word) => resumeHas(plain, word));
  const missing = keywords.filter((word) => !resumeHas(plain, word));
  const hidden = new Set(resume.hiddenSections ?? []);
  const headings: AtsHeading[] = [
    {
      label: 'Profile',
      present: !hidden.has('summary') && resume.summary.trim().length >= 40,
      detail: 'A short profile under a real heading.'
    },
    {
      label: 'Experience',
      present: !hidden.has('experience') && resume.experience.some((item) => item.role.trim() && item.bullets.some((bullet) => bullet.trim())),
      detail: 'At least one role with a bullet.'
    },
    {
      label: 'Education',
      present: !hidden.has('education') && resume.education.some((item) => item.school.trim() || item.degree.trim()),
      detail: 'School or degree, not hidden.'
    },
    {
      label: 'Skills',
      present: !hidden.has('skills') && resume.skills.filter(Boolean).length >= 3,
      detail: 'A skills list a parser can read as text.'
    }
  ];
  const headingScore = headings.filter((item) => item.present).length / headings.length;
  const keywordScore = keywords.length ? matched.length / keywords.length : 0;
  const score = Math.round(((keywordScore * 0.7) + (headingScore * 0.3)) * 100);
  return { score, matched, missing, headings };
}

export function skillLabel(word: string) {
  return displayLabel(word);
}

const ROLE_WORD = new Set(['engineer', 'developer', 'manager', 'designer', 'analyst', 'architect', 'consultant', 'specialist', 'intern', 'lead', 'senior', 'junior', 'officer', 'associate']);

function keywordHits(text: string, labels: string[]) {
  return labels.reduce((count, label) => count + (resumeHas(text, label) ? 1 : 0), 0);
}

function overlapsTerm(left: string, right: string) {
  if (left.length < 4 || right.length < 4) return resumeHas(left, right) || resumeHas(right, left);
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  return a.includes(b) || b.includes(a);
}

function orderByJob(parts: string[], labels: string[], minimum: number, minChars = 0) {
  const ranked = parts
    .map((text, index) => ({ text: text.trim(), index, score: keywordHits(text, labels) }))
    .filter((item) => item.text);
  if (ranked.length < 2) return ranked.map((item) => item.text);
  const sorted = [...ranked].sort((a, b) => b.score - a.score || a.index - b.index);
  const useful = sorted.filter((item) => item.score > 0);
  const usefulText = useful.map((item) => item.text).join(' ');
  if (useful.length >= minimum && usefulText.length >= minChars) return useful.map((item) => item.text);
  return sorted.map((item) => item.text);
}

export function alignResumeToJob(input: Resume, jobDescription: string) {
  const resume = withResumeDefaults(input);
  const ranked = extractKeywords(jobDescription);
  const labels = ranked.map((item) => item.label);
  const worthAdding = ranked.filter((item) => {
    const key = item.label.toLowerCase();
    if (ROLE_WORD.has(key)) return false;
    return item.weight >= 2 || /[\s./-]/.test(item.label);
  });
  const keptSkills = resume.skills.filter((skill) => skill.trim() && labels.some((label) => overlapsTerm(skill, label) || overlapsTerm(skill, jobDescription)));
  const taken = new Set(keptSkills.map((skill) => skill.toLowerCase()));
  const added = worthAdding.map((item) => item.label).filter((label) => {
    const key = label.toLowerCase();
    if (taken.has(key) || keptSkills.some((skill) => overlapsTerm(skill, label)) || resumeHas(resumePlainText(resume), label)) return false;
    taken.add(key);
    return true;
  });
  const skills = [...keptSkills, ...added];
  const removed = resume.skills.filter((skill) => skill.trim() && !skills.some((kept) => kept.toLowerCase() === skill.trim().toLowerCase()));
  const summaryBody = orderByJob(resume.summary.split(/(?<=[.!?])\s+/), labels, 1, 40).join(' ');
  const focus = added.slice(0, 6);
  const summary = focus.length && !resumeHas(summaryBody, focus[0])
    ? `${summaryBody}${summaryBody.endsWith('.') || !summaryBody ? '' : '.'} Aligned to this posting: ${focus.join(', ')}.`.trim()
    : summaryBody;
  const experience = resume.experience.map((item) => ({
    ...item,
    bullets: orderByJob(item.bullets, labels, Math.min(2, item.bullets.filter(Boolean).length))
  }));
  const projects = [...resume.projects]
    .sort((a, b) => keywordHits(`${b.name} ${b.description} ${b.technologies}`, labels) - keywordHits(`${a.name} ${a.description} ${a.technologies}`, labels))
    .map((item) => {
      const parts = item.technologies.split(/[,|•·]/).map((part) => part.trim()).filter(Boolean);
      if (parts.length < 2) return item;
      const relevant = parts.filter((part) => labels.some((label) => overlapsTerm(part, label)));
      return relevant.length ? { ...item, technologies: relevant.join(', ') } : item;
    });
  const hiddenSections = (resume.hiddenSections ?? []).filter((section) => section !== 'skills' && section !== 'summary' && section !== 'experience');
  return { ...resume, summary, skills, experience, projects, hiddenSections, removed, added };
}

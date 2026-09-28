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
  'requirements', 'preferred', 'experience', 'skills', 'skill', 'responsibilities', 'responsibility'
]);

export type AtsHeading = { label: string; present: boolean; detail: string };

export type AtsReport = {
  score: number;
  matched: string[];
  missing: string[];
  headings: AtsHeading[];
};

function words(text: string) {
  return (text.toLowerCase().match(/[a-z][a-z0-9+#.]{3,}/g) ?? [])
    .map((word) => word.replace(/\.+$/, ''))
    .filter((word) => word.length >= 4);
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
  const counts = new Map<string, number>();
  for (const word of words(jobDescription)) {
    if (STOP.has(word) || word.length < 4) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const keywords = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([word]) => word);
  const haystack = new Set(words(resumePlainText(resume)));
  const matched = keywords.filter((word) => haystack.has(word));
  const missing = keywords.filter((word) => !haystack.has(word));
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

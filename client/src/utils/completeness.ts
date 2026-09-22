import type { Resume, SectionType } from '../types';

export type CompletenessItem = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  section: SectionType | 'personal';
};

const isPlaceholder = (value: string, placeholders: string[]) => {
  const trimmed = value.trim();
  return !trimmed || placeholders.some((item) => item.toLowerCase() === trimmed.toLowerCase());
};

export function getResumeCompleteness(resume: Resume) {
  const items: CompletenessItem[] = [
    {
      id: 'name',
      label: 'Add your name',
      hint: 'Recruiters need a name at the top of the page.',
      done: !isPlaceholder(resume.personal.name, ['Your Name']),
      section: 'personal'
    },
    {
      id: 'headline',
      label: 'Add a headline',
      hint: 'A short role line helps the skim test.',
      done: !isPlaceholder(resume.personal.headline, ['Your Professional Headline']),
      section: 'personal'
    },
    {
      id: 'email',
      label: 'Add an email',
      hint: 'Include a way to reach you.',
      done: Boolean(resume.personal.contact.email.trim()),
      section: 'personal'
    },
    {
      id: 'summary',
      label: 'Write a profile summary',
      hint: 'A few sentences on impact and direction.',
      done: resume.summary.trim().length >= 40,
      section: 'summary'
    },
    {
      id: 'experience',
      label: 'Add work experience',
      hint: 'Include a role, company, and at least one achievement.',
      done: resume.experience.some((item) => item.role.trim() && item.company.trim() && item.bullets.some((bullet) => bullet.trim())),
      section: 'experience'
    },
    {
      id: 'skills',
      label: 'Add at least 3 skills',
      hint: 'Skills help both humans and ATS scans.',
      done: resume.skills.length >= 3,
      section: 'skills'
    },
    {
      id: 'education',
      label: 'Add education',
      hint: 'School and degree are enough to start.',
      done: resume.education.some((item) => item.school.trim()),
      section: 'education'
    }
  ];
  const done = items.filter((item) => item.done).length;
  return { items, done, total: items.length, score: Math.round((done / items.length) * 100) };
}

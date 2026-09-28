import type { Resume, SectionType } from '../types';

export const RESUME_SECTIONS: SectionType[] = [
  'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards', 'volunteer'
];

export function withResumeDefaults(resume: Resume): Resume {
  const sections = Array.isArray(resume.sections) ? [...resume.sections] : [...RESUME_SECTIONS];
  for (const section of RESUME_SECTIONS) {
    if (!sections.includes(section)) sections.push(section);
  }
  return {
    ...resume,
    languages: Array.isArray(resume.languages) ? resume.languages : [],
    awards: Array.isArray(resume.awards) ? resume.awards : [],
    volunteer: Array.isArray(resume.volunteer) ? resume.volunteer : [],
    coverLetter: typeof resume.coverLetter === 'string' ? resume.coverLetter : '',
    sections,
    hiddenSections: Array.isArray(resume.hiddenSections) ? resume.hiddenSections : []
  };
}

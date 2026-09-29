import type { Resume } from '../types';
import { emptyResume } from '../templates/data';
import { checkAts } from './atsCheck';

export const AUTOMATE_HINT_KEY = 'resumeforge_automate_resume';

function roleFromJob(jobDescription: string) {
  const line = jobDescription
    .split(/\n/)
    .map((item) => item.replace(/^[#*\-\d.)\s]+/, '').trim())
    .find((item) => item.length > 2 && item.length < 90);
  const cleaned = (line ?? jobDescription).replace(/^(job title|role|position)\s*:\s*/i, '').trim();
  return cleaned.slice(0, 80);
}

export function draftFromJob(jobDescription: string): Resume {
  const base = emptyResume();
  const skills = checkAts(base, jobDescription).missing.slice(0, 12);
  const role = roleFromJob(jobDescription);
  const focus = skills.slice(0, 5);
  return {
    ...base,
    id: '',
    title: role ? `${role} resume` : 'Automated resume',
    template: 'classic',
    personal: {
      name: '',
      headline: role,
      contact: { email: '', phone: '', location: '', website: '', linkedin: '', github: '' }
    },
    summary: focus.length
      ? `Draft profile for ${role || 'this role'}. The posting emphasizes ${focus.join(', ')}. Rewrite this in your own words before you send it.`
      : 'Rewrite this profile in your own words before you send it.',
    skills,
    experience: [{
      id: `exp-${Date.now()}`,
      role: role || 'Role from the posting',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: (skills.slice(0, 4).length ? skills.slice(0, 4) : ['this posting']).map((term) => `Replace this line with a result from your own work that used ${term}.`)
    }],
    education: [],
    projects: [{ id: `project-${Date.now()}`, name: '', description: '', url: '', technologies: '' }],
    certifications: [],
    languages: [],
    awards: [],
    volunteer: []
  };
}

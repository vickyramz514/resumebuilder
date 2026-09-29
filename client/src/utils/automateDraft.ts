import type { Resume, TemplateId } from '../types';
import { TEMPLATE_META } from '../templates/catalog';
import { emptyResume } from '../templates/data';
import { checkAts } from './atsCheck';

export const AUTOMATE_HINT_KEY = 'resumeforge_automate_resume';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'French', 'German', 'Spanish', 'Arabic'];

function roleFromJob(jobDescription: string) {
  const labeled = jobDescription.match(/(?:job title|role|position|hiring)\s*[:\-]\s*([^\n]{3,80})/i);
  if (labeled?.[1]) return labeled[1].trim();
  const hiring = jobDescription.match(/\b(?:looking for|seeking|hiring)\s+(?:an?\s+)?([A-Za-z][^.\n]{3,70})/i);
  if (hiring?.[1]) return hiring[1].replace(/\b(who|with|to)\b[\s\S]*$/i, '').trim();
  const line = jobDescription
    .split(/\n/)
    .map((item) => item.replace(/^[#*\-\d.)\s]+/, '').trim())
    .find((item) => item.length > 2 && item.length < 90);
  return (line ?? 'Role from this posting').slice(0, 80);
}

function tidyBullet(line: string) {
  let text = line.replace(/^[\s•·\-*]+/, '').replace(/\s+/g, ' ').trim();
  text = text.replace(/^(you will|you'll|we need|we're looking for|looking for|responsible for|responsibilities include|experience with|experience in|required:?|requirements:?|must have|should have|nice to have)\s+/i, '');
  if (text.length < 12) return '';
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) text += '.';
  return text.length > 220 ? `${text.slice(0, 217)}.` : text;
}

function requirementLines(jobDescription: string) {
  const parts = jobDescription.split(/\n|(?<=[.!?])\s+|•|·/).map(tidyBullet).filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (unique.some((item) => item.toLowerCase() === part.toLowerCase())) continue;
    unique.push(part);
    if (unique.length >= 6) break;
  }
  return unique;
}

export function draftFromJob(jobDescription: string, template: TemplateId = 'professional'): Resume {
  const base = emptyResume();
  const meta = TEMPLATE_META[template] ?? TEMPLATE_META.professional;
  const skills = checkAts(base, jobDescription).missing.slice(0, 16);
  const role = roleFromJob(jobDescription);
  const focus = skills.slice(0, 6);
  const lines = requirementLines(jobDescription);
  const bullets = lines.length
    ? lines
    : focus.slice(0, 4).map((term) => `Delivered work that used ${term} for this kind of role.`);
  const degree = jobDescription.match(/\b((?:bachelor|master|doctor)(?:'s)?(?:\s+of\s+[A-Za-z ]{2,24})?|b\.?\s?tech|m\.?\s?tech|b\.?\s?e|m\.?\s?e|b\.?\s?sc|m\.?\s?sc|mba|ph\.?\s?d|diploma)\b/i)?.[1];
  const certLines = jobDescription
    .split(/\n|•|·/)
    .map((item) => item.trim())
    .filter((item) => /certif/i.test(item) && item.length < 120)
    .slice(0, 3);
  const languages = LANGUAGES.filter((name) => new RegExp(`\\b${name}\\b`, 'i').test(jobDescription));
  const stamp = Date.now();
  return {
    ...base,
    id: '',
    title: `${role} resume`,
    template,
    accentColor: meta.accent,
    personal: {
      name: '',
      headline: role,
      contact: { email: '', phone: '', location: '', website: '', linkedin: '', github: '' }
    },
    summary: [
      `${role} with day-to-day work across ${focus.slice(0, 4).join(', ') || 'the skills in this posting'}.`,
      focus.length > 4 ? `The description also calls for ${focus.slice(4).join(', ')}.` : '',
      'Rewrite any line that does not match work you have actually done.'
    ].filter(Boolean).join(' '),
    skills,
    experience: [{
      id: `exp-${stamp}`,
      role,
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: true,
      bullets: bullets.length ? bullets : ['Add a result from your own work for this role.']
    }],
    education: degree ? [{ id: `edu-${stamp}`, school: '', degree, location: '', startDate: '', endDate: '' }] : [],
    projects: [{
      id: `project-${stamp}`,
      name: '',
      description: bullets[0] ?? '',
      url: '',
      technologies: focus.join(', ')
    }],
    certifications: certLines.map((name, index) => ({ id: `cert-${stamp}-${index}`, name, issuer: '', date: '' })),
    languages: languages.map((name, index) => ({ id: `lang-${stamp}-${index}`, name, level: '' })),
    awards: [],
    volunteer: []
  };
}

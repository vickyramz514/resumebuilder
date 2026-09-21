import type { Experience, Project, Resume } from '../types';
import { apiRequest } from './api';

type ResumeContext = Pick<Resume, 'personal' | 'summary' | 'skills' | 'experience' | 'projects'>;
const context = (resume: Resume): ResumeContext => ({
  personal: resume.personal,
  summary: resume.summary,
  skills: resume.skills,
  experience: resume.experience,
  projects: resume.projects
});

export const improveSummary = (summary: string, resume: Resume, targetRole?: string) =>
  apiRequest<{ summary: string }>('/api/ai/improve-summary', { method: 'POST', body: JSON.stringify({ summary, targetRole, resume: context(resume) }) });
export const rewriteExperience = (experience: Experience, targetRole?: string) =>
  apiRequest<{ bullets: string[] }>('/api/ai/rewrite-experience', { method: 'POST', body: JSON.stringify({ role: experience.role || 'Professional role', company: experience.company, bullets: experience.bullets.filter(Boolean), targetRole }) });
export const generateProjectBullets = (project: Project, targetRole?: string) =>
  apiRequest<{ bullets: string[] }>('/api/ai/generate-project-bullets', { method: 'POST', body: JSON.stringify({ project, targetRole }) });
export const tailorResume = (resume: Resume, jobDescription: string) =>
  apiRequest<{ summary?: string; experienceBullets?: Array<{ experienceId?: string; bullets: string[] }>; skills?: string[] }>('/api/ai/tailor', { method: 'POST', body: JSON.stringify({ resume: context(resume), jobDescription }) });
export const suggestSkills = (resume: Resume, jobDescription?: string) =>
  apiRequest<{ skills: string[] }>('/api/ai/suggest-skills', { method: 'POST', body: JSON.stringify({ resume: context(resume), jobDescription }) });

export type SectionType = 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications';

export interface Contact {
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Resume {
  id: string;
  title: string;
  template: TemplateId;
  accentColor: string;
  updatedAt: string;
  personal: { name: string; headline: string; contact: Contact };
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  sections: SectionType[];
}

export type TemplateId = 'minimal' | 'professional' | 'modern';

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

export type FontFamily = 'inter' | 'source-sans' | 'georgia' | 'ibm-plex' | 'space-grotesk';
export type ResumeDensity = 'comfortable' | 'compact' | 'airy';

/** Optional so resumes created before the design controls were introduced remain valid. */
export interface ResumeDesign {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  spacing: number;
  density: ResumeDensity;
}

export interface Resume {
  id: string;
  title: string;
  template: TemplateId;
  accentColor: string;
  design?: ResumeDesign;
  updatedAt: string;
  personal: { name: string; headline: string; contact: Contact };
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  sections: SectionType[];
  /** Sections omitted from the preview without deleting their content. */
  hiddenSections?: SectionType[];
}

export type TemplateId = 'minimal' | 'professional' | 'modern' | 'editorial' | 'creative' | 'compact';

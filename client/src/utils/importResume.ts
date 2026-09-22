import type { Contact, FontFamily, Resume, ResumeDesign, ResumeDensity, SectionType, TemplateId } from '../types';

const sectionTypes: SectionType[] = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
const templateIds: TemplateId[] = ['minimal', 'professional', 'modern', 'editorial', 'creative', 'compact'];
const fontFamilies: FontFamily[] = ['inter', 'source-sans', 'georgia', 'ibm-plex', 'space-grotesk'];
const densities: ResumeDensity[] = ['comfortable', 'compact', 'airy'];

const isRecord = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const asString = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const asStringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export function normalizeImportedResume(input: unknown): Resume {
  const source = isRecord(input) && isRecord(input.resume) ? input.resume : input;
  if (!isRecord(source) || !isRecord(source.personal)) {
    throw new Error('That file does not look like a ResumeForge JSON export.');
  }

  const personal = source.personal;
  const sourceContact = isRecord(personal.contact) ? personal.contact : {};
  const contact: Contact = {
    email: asString(sourceContact.email),
    phone: asString(sourceContact.phone),
    location: asString(sourceContact.location),
    website: asString(sourceContact.website),
    linkedin: asString(sourceContact.linkedin),
    github: asString(sourceContact.github)
  };

  const sections = Array.isArray(source.sections)
    ? source.sections.filter((section): section is SectionType => typeof section === 'string' && sectionTypes.includes(section as SectionType))
    : sectionTypes.filter((section) => section === 'summary' ? Boolean(source.summary) : Array.isArray(source[section]) ? source[section].length > 0 : false);
  const sourceDesign = isRecord(source.design) ? source.design : {};
  const design: ResumeDesign = {
    fontFamily: fontFamilies.includes(sourceDesign.fontFamily) ? sourceDesign.fontFamily : 'inter',
    fontSize: typeof sourceDesign.fontSize === 'number' ? Math.min(14, Math.max(9, sourceDesign.fontSize)) : 11,
    lineHeight: typeof sourceDesign.lineHeight === 'number' ? Math.min(1.8, Math.max(1.2, sourceDesign.lineHeight)) : 1.45,
    spacing: typeof sourceDesign.spacing === 'number' ? Math.min(30, Math.max(8, sourceDesign.spacing)) : 18,
    density: densities.includes(sourceDesign.density) ? sourceDesign.density : 'comfortable'
  };

  return {
    id: `resume-${Date.now()}`,
    title: asString(source.title, `${asString(personal.name, 'Imported')} Resume`),
    template: templateIds.includes(source.template) ? source.template : 'professional',
    accentColor: asString(source.accentColor, '#202124'),
    design,
    updatedAt: new Date().toISOString(),
    personal: {
      name: asString(personal.name, 'Your Name'),
      headline: asString(personal.headline),
      contact
    },
    summary: asString(source.summary),
    skills: asStringArray(source.skills),
    experience: Array.isArray(source.experience) ? source.experience.filter(isRecord).map((item, index) => ({
      id: asString(item.id, `experience-${index + 1}`),
      role: asString(item.role), company: asString(item.company), location: asString(item.location),
      startDate: asString(item.startDate), endDate: asString(item.endDate), current: Boolean(item.current),
      bullets: asStringArray(item.bullets)
    })) : [],
    education: Array.isArray(source.education) ? source.education.filter(isRecord).map((item, index) => ({
      id: asString(item.id, `education-${index + 1}`),
      school: asString(item.school), degree: asString(item.degree), location: asString(item.location),
      startDate: asString(item.startDate), endDate: asString(item.endDate)
    })) : [],
    projects: Array.isArray(source.projects) ? source.projects.filter(isRecord).map((item, index) => ({
      id: asString(item.id, `project-${index + 1}`),
      name: asString(item.name), description: asString(item.description), url: asString(item.url), technologies: asString(item.technologies)
    })) : [],
    certifications: Array.isArray(source.certifications) ? source.certifications.filter(isRecord).map((item, index) => ({
      id: asString(item.id, `certification-${index + 1}`),
      name: asString(item.name), issuer: asString(item.issuer), date: asString(item.date)
    })) : [],
    sections: sections.length ? sections : sectionTypes
  };
}

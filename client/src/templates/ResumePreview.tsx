import type { Resume, SectionType } from '../types';
import { Mail, MapPin, Phone, Globe, Linkedin, Github, type LucideIcon } from 'lucide-react';
import './resume.css';

/** Templates that use a two-column layout (colored/boxed sidebar + main column). */
const SIDEBAR_TEMPLATES = new Set<Resume['template']>(['professional', 'modern', 'creative']);
/** Sections routed into the sidebar for two-column templates; everything else stays in the main column. */
const SIDEBAR_SECTIONS = new Set<SectionType>(['skills', 'education', 'certifications']);

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '✦';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const ContactList = ({ resume }: { resume: Resume }) => {
  const c = resume.personal.contact;
  const rows: { key: string; icon: LucideIcon; value: string; href?: string }[] = [];
  if (c.email) rows.push({ key: 'email', icon: Mail, value: c.email, href: `mailto:${c.email}` });
  if (c.phone) rows.push({ key: 'phone', icon: Phone, value: c.phone });
  if (c.location) rows.push({ key: 'location', icon: MapPin, value: c.location });
  if (c.website) rows.push({ key: 'website', icon: Globe, value: 'Website', href: c.website });
  if (c.linkedin) rows.push({ key: 'linkedin', icon: Linkedin, value: 'LinkedIn', href: c.linkedin });
  if (c.github) rows.push({ key: 'github', icon: Github, value: 'GitHub', href: c.github });
  return <div className="resume-contact">
    {rows.map(({ key, icon: Icon, value, href }) => <span key={key}><Icon size={11} />{href ? <a href={href} target="_blank" rel="noreferrer">{value}</a> : value}</span>)}
  </div>;
};

const Section = ({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) => <section className="resume-section"><h2 style={{ color: accent }}>{title}</h2>{children}</section>;

function renderSection(section: SectionType, resume: Resume, accent: string) {
  if (section === 'summary' && resume.summary) return <Section key={section} title="Profile" accent={accent}><p className="resume-summary">{resume.summary}</p></Section>;
  if (section === 'experience' && resume.experience.length) return <Section key={section} title="Experience" accent={accent}>{resume.experience.map((item) => <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.role}</strong><span>{item.startDate} - {item.current ? 'Present' : item.endDate}</span></div><div className="entry-subheading">{item.company}{item.location ? ` · ${item.location}` : ''}</div><ul>{item.bullets.filter(Boolean).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul></article>)}</Section>;
  if (section === 'education' && resume.education.length) return <Section key={section} title="Education" accent={accent}>{resume.education.map((item) => <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.degree}</strong><span>{item.startDate} - {item.endDate}</span></div><div className="entry-subheading">{item.school}{item.location ? ` · ${item.location}` : ''}</div></article>)}</Section>;
  if (section === 'skills' && resume.skills.length) return <Section key={section} title="Skills" accent={accent}><div className="skill-list">{resume.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></Section>;
  if (section === 'projects' && resume.projects.length) return <Section key={section} title="Projects" accent={accent}>{resume.projects.map((item) => { const bullets = item.description.split('\n').filter((line) => line.trim().startsWith('• ')); return <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.name}</strong>{item.url && <span><a href={item.url} target="_blank" rel="noreferrer">View project</a></span>}</div>{bullets.length === item.description.split('\n').filter(Boolean).length && bullets.length > 0 ? <ul>{bullets.map((bullet, index) => <li key={`${bullet}-${index}`}>{bullet.replace(/^•\s*/, '')}</li>)}</ul> : <p>{item.description}</p>}{item.technologies && <small>{item.technologies}</small>}</article>; })}</Section>;
  if (section === 'certifications' && resume.certifications.length) return <Section key={section} title="Certifications" accent={accent}>{resume.certifications.map((item) => <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.name}</strong><span>{item.date}</span></div><div className="entry-subheading">{item.issuer}</div></article>)}</Section>;
  return null;
}

export function ResumePreview({ resume, exportMode = false }: { resume: Resume; exportMode?: boolean }) {
  const accent = resume.accentColor;
  const design = resume.design ?? { fontFamily: 'inter', fontSize: 11, lineHeight: 1.45, spacing: 18, density: 'comfortable' };
  const fontMap = { inter: 'Inter, Arial, sans-serif', 'source-sans': '"Source Sans 3", Arial, sans-serif', georgia: 'Georgia, serif', 'ibm-plex': '"IBM Plex Sans", Arial, sans-serif', 'space-grotesk': '"Space Grotesk", Arial, sans-serif' };
  const isSidebar = SIDEBAR_TEMPLATES.has(resume.template);
  const sidebarSections = isSidebar ? resume.sections.filter((s) => SIDEBAR_SECTIONS.has(s)) : [];
  const mainSections = isSidebar ? resume.sections.filter((s) => !SIDEBAR_SECTIONS.has(s)) : resume.sections;
  const name = resume.personal.name || 'Your Name';

  return <div
    className={`resume-sheet template-${resume.template} density-${design.density}${exportMode ? ' export-mode' : ''}${isSidebar ? ' has-sidebar' : ''}`}
    style={{
      '--accent': accent,
      '--resume-font-family': fontMap[design.fontFamily] ?? fontMap.inter,
      '--resume-font-size': `${design.fontSize}px`,
      '--resume-line-height': design.lineHeight,
      '--resume-spacing': `${design.spacing}px`
    } as React.CSSProperties}
  >
    <header className="resume-header">
      {isSidebar && <div className="resume-monogram" style={{ background: accent }}>{initials(name)}</div>}
      <div className="resume-header-copy"><h1>{name}</h1><p>{resume.personal.headline}</p></div>
      {!isSidebar && <ContactList resume={resume} />}
    </header>
    {isSidebar ? <div className="resume-columns">
      <aside className="resume-aside">
        <ContactList resume={resume} />
        {sidebarSections.map((section) => renderSection(section, resume, accent))}
      </aside>
      <div className="resume-main">{mainSections.map((section) => renderSection(section, resume, accent))}</div>
    </div> : mainSections.map((section) => renderSection(section, resume, accent))}
  </div>;
}

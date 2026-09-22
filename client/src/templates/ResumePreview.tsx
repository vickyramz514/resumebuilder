import type { Resume } from '../types';
import { Mail, MapPin, Phone, Globe, Linkedin, Github } from 'lucide-react';
import './resume.css';

const ContactLine = ({ resume }: { resume: Resume }) => {
  const c = resume.personal.contact;
  const contact = (label: string, value: string) => <span key={label}>{value.startsWith('http') ? <a href={value} target="_blank" rel="noreferrer">{label}</a> : value}</span>;
  return <div className="resume-contact">
    {c.email && <span><Mail size={11} />{c.email}</span>}{c.phone && <span><Phone size={11} />{c.phone}</span>}{c.location && <span><MapPin size={11} />{c.location}</span>}
    {c.website && <span><Globe size={11} />{contact('Website', c.website)}</span>}{c.linkedin && <span><Linkedin size={11} />{contact('LinkedIn', c.linkedin)}</span>}{c.github && <span><Github size={11} />{contact('GitHub', c.github)}</span>}
  </div>;
};

const Section = ({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) => <section className="resume-section"><h2 style={{ color: accent }}>{title}</h2>{children}</section>;

export function ResumePreview({ resume, exportMode = false }: { resume: Resume; exportMode?: boolean }) {
  const accent = resume.accentColor;
  const design = resume.design ?? { fontFamily: 'inter', fontSize: 11, lineHeight: 1.45, spacing: 18, density: 'comfortable' };
  const fontMap = { inter: 'Inter, Arial, sans-serif', 'source-sans': '"Source Sans 3", Arial, sans-serif', georgia: 'Georgia, serif', 'ibm-plex': '"IBM Plex Sans", Arial, sans-serif', 'space-grotesk': '"Space Grotesk", Arial, sans-serif' };
  const content = <div
    className={`resume-sheet template-${resume.template} density-${design.density}${exportMode ? ' export-mode' : ''}`}
    style={{
      '--accent': accent,
      '--resume-font-family': fontMap[design.fontFamily] ?? fontMap.inter,
      '--resume-font-size': `${design.fontSize}px`,
      '--resume-line-height': design.lineHeight,
      '--resume-spacing': `${design.spacing}px`
    } as React.CSSProperties}
  >
    <header className="resume-header">
      <div><h1>{resume.personal.name || 'Your Name'}</h1><p>{resume.personal.headline}</p></div>
      <ContactLine resume={resume} />
    </header>
    {resume.sections.map((section) => {
      if (section === 'summary' && resume.summary) return <Section key={section} title="Profile" accent={accent}><p className="resume-summary">{resume.summary}</p></Section>;
      if (section === 'experience' && resume.experience.length) return <Section key={section} title="Experience" accent={accent}>{resume.experience.map((item) => <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.role}</strong><span>{item.startDate} - {item.current ? 'Present' : item.endDate}</span></div><div className="entry-subheading">{item.company}{item.location ? ` · ${item.location}` : ''}</div><ul>{item.bullets.filter(Boolean).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul></article>)}</Section>;
      if (section === 'education' && resume.education.length) return <Section key={section} title="Education" accent={accent}>{resume.education.map((item) => <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.degree}</strong><span>{item.startDate} - {item.endDate}</span></div><div className="entry-subheading">{item.school}{item.location ? ` · ${item.location}` : ''}</div></article>)}</Section>;
      if (section === 'skills' && resume.skills.length) return <Section key={section} title="Skills" accent={accent}><div className="skill-list">{resume.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></Section>;
      if (section === 'projects' && resume.projects.length) return <Section key={section} title="Projects" accent={accent}>{resume.projects.map((item) => { const bullets = item.description.split('\n').filter((line) => line.trim().startsWith('• ')); return <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.name}</strong>{item.url && <span><a href={item.url} target="_blank" rel="noreferrer">View project</a></span>}</div>{bullets.length === item.description.split('\n').filter(Boolean).length && bullets.length > 0 ? <ul>{bullets.map((bullet, index) => <li key={`${bullet}-${index}`}>{bullet.replace(/^•\s*/, '')}</li>)}</ul> : <p>{item.description}</p>}{item.technologies && <small>{item.technologies}</small>}</article>; })}</Section>;
      if (section === 'certifications' && resume.certifications.length) return <Section key={section} title="Certifications" accent={accent}>{resume.certifications.map((item) => <article className="resume-entry" key={item.id}><div className="entry-heading"><strong>{item.name}</strong><span>{item.date}</span></div><div className="entry-subheading">{item.issuer}</div></article>)}</Section>;
      return null;
    })}
  </div>;
  return content;
}

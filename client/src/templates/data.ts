import type { Resume } from '../types';

export const sampleResume: Resume = {
  id: 'sample-resume',
  title: 'Vigneshwar R Resume',
  template: 'professional',
  accentColor: '#202124',
  design: { fontFamily: 'inter', fontSize: 11, lineHeight: 1.45, spacing: 18, density: 'comfortable' },
  updatedAt: new Date().toISOString(),
  personal: {
    name: 'Vigneshwar R',
    headline: 'Senior React Native / React Engineer | Full Stack Developer',
    contact: {
      email: 'vickyram20@gmail.com',
      phone: '+91 73738 34595',
      location: 'Chennai, India',
      website: 'https://datacaptain.in',
      linkedin: 'https://www.linkedin.com/in/vigneshwar-r-10086a126/',
      github: 'https://github.com/vickyramz514?tab=repositories'
    }
  },
  summary: 'Full-stack engineer with experience building mobile and web products across React Native, React, Node.js, and Express. I enjoy turning complex product requirements into reliable, accessible experiences and pragmatic APIs.',
  skills: ['React Native', 'React.js', 'Expo', 'Node.js', 'Express.js', 'REST APIs', 'PostgreSQL', 'Redis', 'JWT', 'Redux Toolkit', 'Firebase', 'GraphQL', 'AWS', 'Vercel', 'Railway'],
  experience: [
    { id: 'exp-1', role: 'Software Engineer', company: 'Colan InfoTech Pvt. Ltd.', location: 'Chennai, India', startDate: 'February 2018', endDate: '', current: true, bullets: ['Built and maintained React Native and React applications for business, identity, and destination platforms.', 'Delivered integrations with REST APIs, payment services, maps, notifications, and authentication flows.', 'Collaborated across product and engineering teams to ship reliable features from requirements through release.'] }
  ],
  education: [],
  projects: [
    { id: 'project-1', name: 'DataCaptain', description: 'Product and engineering work for DataCaptain.', url: 'https://datacaptain.in', technologies: 'React, Node.js, Express.js' },
    { id: 'project-2', name: 'Amazon Pay for Business', description: 'Business payments product work.', url: '', technologies: 'React Native, REST APIs' },
    { id: 'project-3', name: 'EarthID', description: 'Identity platform work.', url: '', technologies: 'React Native, Node.js' },
    { id: 'project-4', name: 'Discover KAEC', description: 'Destination discovery experience.', url: '', technologies: 'React Native, maps' },
    { id: 'project-5', name: 'Ackumen', description: 'Industrial software product work.', url: '', technologies: 'React, APIs' }
  ],
  certifications: [],
  sections: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications']
};

export const emptyResume = (): Resume => ({
  ...sampleResume,
  id: `resume-${Date.now()}`,
  title: 'Untitled Resume',
  personal: { name: 'Your Name', headline: 'Your Professional Headline', contact: { email: '', phone: '', location: '', website: '', linkedin: '', github: '' } },
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  updatedAt: new Date().toISOString()
});

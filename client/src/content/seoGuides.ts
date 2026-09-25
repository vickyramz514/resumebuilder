export const SEO_GUIDES = [
  { slug: 'react-developer', label: 'React developer' },
  { slug: 'react-native-developer', label: 'React Native developer' },
  { slug: 'frontend-developer', label: 'Frontend developer' },
  { slug: 'backend-developer', label: 'Backend developer' },
  { slug: 'full-stack-developer', label: 'Full-stack developer' },
  { slug: 'nodejs-developer', label: 'Node.js developer' },
  { slug: 'javascript-developer', label: 'JavaScript developer' },
  { slug: 'software-engineer', label: 'Software engineer' },
  { slug: 'senior-software-engineer', label: 'Senior software engineer' },
  { slug: 'ats-resume', label: 'ATS-friendly resume' },
  { slug: 'fresher-resume', label: 'Fresher resume' }
] as const;

export function seoGuideLabel(slug: string) {
  return SEO_GUIDES.find((guide) => guide.slug === slug)?.label ?? slug.replace(/-/g, ' ');
}

export const TECH_STACKS: { id: string; label: string; skills: string[] }[] = [
  {
    id: 'languages',
    label: 'Languages',
    skills: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'C#', 'C++', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'SQL', 'HTML', 'CSS']
  },
  {
    id: 'frontend',
    label: 'Frontend',
    skills: ['React', 'React.js', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Redux', 'Redux Toolkit', 'Zustand', 'Tailwind CSS', 'Material UI', 'Sass', 'Webpack', 'Vite', 'GraphQL']
  },
  {
    id: 'mobile',
    label: 'Mobile',
    skills: ['React Native', 'Expo', 'Flutter', 'Swift', 'Kotlin', 'SwiftUI', 'Android', 'iOS']
  },
  {
    id: 'backend',
    label: 'Backend',
    skills: ['Node.js', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Ruby on Rails', 'Laravel', 'ASP.NET', 'REST APIs', 'GraphQL', 'JWT', 'OAuth']
  },
  {
    id: 'data',
    label: 'Data',
    skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Elasticsearch', 'Prisma', 'Firebase', 'Supabase', 'DynamoDB']
  },
  {
    id: 'cloud',
    label: 'Cloud',
    skills: ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'CI/CD', 'Vercel', 'Railway', 'Nginx', 'Linux']
  },
  {
    id: 'testing',
    label: 'Testing',
    skills: ['Jest', 'Vitest', 'Cypress', 'Playwright', 'Testing Library', 'Selenium', 'JUnit']
  },
  {
    id: 'tools',
    label: 'Tools',
    skills: ['Git', 'GitHub', 'GitLab', 'Figma', 'Jira', 'Postman', 'Linux', 'Webpack', 'Vite']
  }
];

export function matchTechSkills(query: string, taken: Set<string>) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const seen = new Set<string>();
  const matches: string[] = [];
  for (const stack of TECH_STACKS) {
    for (const skill of stack.skills) {
      const key = skill.toLowerCase();
      if (seen.has(key) || taken.has(key)) continue;
      if (!key.includes(needle)) continue;
      seen.add(key);
      matches.push(skill);
    }
  }
  return matches.slice(0, 16);
}

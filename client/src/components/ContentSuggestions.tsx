import { useResumeStore, useActiveResume } from '../store';
import type { SectionType } from '../types';

const placeholder = (value: string, samples: string[]) => {
  const trimmed = value.trim();
  return !trimmed || samples.some((sample) => sample.toLowerCase() === trimmed.toLowerCase());
};

const freshId = () => `sample-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

export function ContentSuggestions({ section, onApplied }: { section: SectionType | 'personal'; onApplied: (message: string) => void }) {
  const resume = useActiveResume();
  const updateResume = useResumeStore((state) => state.updateResume);
  const updatePersonal = useResumeStore((state) => state.updatePersonal);

  const items: { label: string; apply: () => void }[] = [];

  if (section === 'personal') {
    const headlines = [
      ['Product', 'Product manager · shipped work people use every week'],
      ['Engineering', 'Software engineer · APIs, data, and systems other people can run'],
      ['Design', 'Designer · interfaces that stay clear when the work gets messy']
    ] as const;
    for (const [label, headline] of headlines) {
      items.push({
        label,
        apply: () => {
          if (!placeholder(resume.personal.headline, ['Your Professional Headline'])) {
            onApplied('You already have a headline. Clear it if you want this sample.');
            return;
          }
          updatePersonal({ headline });
          onApplied('Sample headline added. Rewrite it for your role.');
        }
      });
    }
  }

  if (section === 'summary') {
    const summaries = [
      ['Impact first', 'I take a vague problem and turn it into something a team can ship. Recent work mixed the research, the writing, and the decisions that kept a release honest.'],
      ['Builder', 'I like the path from a messy brief to a system other people can run. I do the work, write down what changed, and leave the next person a clear handoff.']
    ] as const;
    for (const [label, summary] of summaries) {
      items.push({
        label,
        apply: () => {
          if (resume.summary.trim().length >= 40) {
            onApplied('Your profile already has a draft. Clear it if you want this sample.');
            return;
          }
          updateResume({ summary });
          onApplied('Sample profile added. Replace the lines with your own work.');
        }
      });
    }
  }

  if (section === 'skills') {
    const packs = [
      ['Product set', ['Research', 'Roadmaps', 'Writing', 'Stakeholder updates', 'SQL']],
      ['Engineering set', ['TypeScript', 'APIs', 'PostgreSQL', 'Testing', 'Code review']],
      ['Design set', ['Figma', 'Prototypes', 'Design systems', 'User interviews']]
    ] as const;
    for (const [label, skills] of packs) {
      items.push({
        label,
        apply: () => {
          const have = new Set(resume.skills.map((skill) => skill.toLowerCase()));
          const next = skills.filter((skill) => !have.has(skill.toLowerCase()));
          if (!next.length) {
            onApplied('Those skills are already on the page.');
            return;
          }
          updateResume({ skills: [...resume.skills, ...next] });
          onApplied('Sample skills added. Delete any that are not yours.');
        }
      });
    }
  }

  if (section === 'experience') {
    items.push({
      label: 'Sample role',
      apply: () => {
        updateResume({
          experience: [...resume.experience, {
            id: freshId(),
            role: 'Product manager',
            company: 'Replace with your company',
            location: 'City',
            startDate: '2022',
            endDate: '',
            current: true,
            bullets: ['Shipped a feature people used every week, and wrote the result in one sentence a hiring manager can check.']
          }]
        });
        onApplied('Sample role added. Rewrite every line with your own work.');
      }
    });
    items.push({
      label: 'Sample bullet',
      apply: () => {
        if (!resume.experience.length) {
          onApplied('Add a role first, then drop in a sample bullet.');
          return;
        }
        const [first, ...rest] = resume.experience;
        updateResume({
          experience: [{ ...first, bullets: [...first.bullets, 'Cut the time a weekly task took, and named the number in the bullet.'] }, ...rest]
        });
        onApplied('Sample bullet added on the first role. Replace it with a result you can stand behind.');
      }
    });
  }

  if (section === 'education') {
    items.push({
      label: 'Sample school',
      apply: () => {
        updateResume({
          education: [...resume.education, {
            id: freshId(),
            school: 'Replace with your school',
            degree: 'Degree and field',
            location: 'City',
            startDate: '2018',
            endDate: '2022'
          }]
        });
        onApplied('Sample education added. Put in your real school and dates.');
      }
    });
  }

  if (section === 'projects') {
    items.push({
      label: 'Sample project',
      apply: () => {
        updateResume({
          projects: [...resume.projects, {
            id: freshId(),
            name: 'Side project',
            description: 'Built a small tool for a repeated task, then wrote who used it and what got faster.',
            url: '',
            technologies: 'Replace with the tools you used'
          }]
        });
        onApplied('Sample project added. Swap in a project you actually built.');
      }
    });
  }

  if (section === 'certifications') {
    items.push({
      label: 'Sample certificate',
      apply: () => {
        updateResume({
          certifications: [...resume.certifications, {
            id: freshId(),
            name: 'Certificate name',
            issuer: 'Issuer',
            date: '2024'
          }]
        });
        onApplied('Sample certificate added. Replace it with one you earned.');
      }
    });
  }

  if (!items.length) return null;

  return (
    <div className="suggest-box">
      <span>Suggestions</span>
      <div className="suggest-row">
        {items.map((item) => (
          <button key={item.label} type="button" className="suggest-chip" onClick={item.apply}>{item.label}</button>
        ))}
      </div>
    </div>
  );
}

import type { Resume } from '../types';
import type { AssistantResult } from '../components/AIAssistant';

const unique = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function applyAiSuggestion(resume: Resume, result: AssistantResult): Partial<Resume> {
  if (result.kind === 'summary' && result.text) return { summary: result.text };

  if (result.kind === 'experience' && result.targetId && result.bullets) {
    return {
      experience: resume.experience.map((item) => item.id === result.targetId ? { ...item, bullets: result.bullets ?? item.bullets } : item)
    };
  }

  if (result.kind === 'project' && result.targetId && result.bullets) {
    return {
      projects: resume.projects.map((item) => item.id === result.targetId
        ? { ...item, description: (result.bullets ?? []).map((bullet) => `• ${bullet}`).join('\n') }
        : item)
    };
  }

  if (result.kind === 'skills' && result.skills) {
    return { skills: unique([...resume.skills, ...result.skills]) };
  }

  if (result.kind === 'tailor') {
    const patch: Partial<Resume> = {};
    if (result.text) patch.summary = result.text;
    if (result.skills?.length) patch.skills = unique([...resume.skills, ...result.skills]);
    if (result.experienceBullets?.length) {
      patch.experience = resume.experience.map((item) => {
        const match = result.experienceBullets?.find((entry) => entry.experienceId === item.id);
        return match ? { ...item, bullets: match.bullets } : item;
      });
    }
    return patch;
  }

  return {};
}

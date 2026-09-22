import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resume, SectionType, TemplateId } from './types';
import { emptyResume, sampleResume } from './templates/data';

interface ResumeStore {
  resumes: Resume[];
  activeId: string;
  selectedSection: SectionType | 'personal';
  canUndo: boolean;
  setActive: (id: string) => void;
  setSelectedSection: (section: SectionType | 'personal') => void;
  addResume: () => void;
  duplicateResume: (id: string) => void;
  deleteResume: (id: string) => void;
  updateResume: (patch: Partial<Resume>) => void;
  updatePersonal: (patch: Partial<Resume['personal']>) => void;
  updateContact: (patch: Partial<Resume['personal']['contact']>) => void;
  setTemplate: (template: TemplateId) => void;
  setSections: (sections: SectionType[]) => void;
  reorderSections: (from: number, to: number) => void;
  toggleSectionHidden: (section: SectionType) => void;
  replaceResume: (resume: Resume) => void;
  undo: () => void;
}

const timestamp = () => new Date().toISOString();
let previous: Resume | null = null;
let groupingEdits = false;
let groupTimer: ReturnType<typeof setTimeout> | undefined;

const withActive = (state: { resumes: Resume[]; activeId: string }, updater: (resume: Resume) => Resume) => {
  const active = state.resumes.find((resume) => resume.id === state.activeId);
  if (!active) return {};
  if (!groupingEdits) previous = structuredClone(active);
  groupingEdits = true;
  if (groupTimer) clearTimeout(groupTimer);
  groupTimer = setTimeout(() => { groupingEdits = false; }, 1200);
  return {
    resumes: state.resumes.map((resume) => resume.id === active.id ? { ...updater(active), updatedAt: timestamp() } : resume),
    canUndo: true
  };
};

export const useResumeStore = create<ResumeStore>()(persist((set, get) => ({
  resumes: [sampleResume],
  activeId: sampleResume.id,
  selectedSection: 'personal',
  canUndo: false,
  setActive: (id) => set({ activeId: id, selectedSection: 'personal' }),
  setSelectedSection: (selectedSection) => set({ selectedSection }),
  addResume: () => {
    const resume = emptyResume();
    set((state) => ({ resumes: [...state.resumes, resume], activeId: resume.id, selectedSection: 'personal' }));
  },
  duplicateResume: (id) => {
    const original = get().resumes.find((item) => item.id === id);
    if (!original) return;
    const copy = { ...structuredClone(original), id: `resume-${Date.now()}`, title: `${original.title} Copy`, updatedAt: timestamp() };
    set((state) => ({ resumes: [...state.resumes, copy], activeId: copy.id }));
  },
  deleteResume: (id) => set((state) => {
    const remaining = state.resumes.filter((resume) => resume.id !== id);
    const fallback = remaining[0] ?? emptyResume();
    return { resumes: remaining.length ? remaining : [fallback], activeId: state.activeId === id ? fallback.id : state.activeId };
  }),
  updateResume: (patch) => set((state) => withActive(state, (resume) => ({ ...resume, ...patch }))),
  updatePersonal: (patch) => set((state) => withActive(state, (resume) => ({ ...resume, personal: { ...resume.personal, ...patch } }))),
  updateContact: (patch) => set((state) => withActive(state, (resume) => ({
    ...resume,
    personal: { ...resume.personal, contact: { ...resume.personal.contact, ...patch } }
  }))),
  setTemplate: (template) => set((state) => withActive(state, (resume) => ({ ...resume, template }))),
  setSections: (sections) => set((state) => withActive(state, (resume) => ({ ...resume, sections }))),
  reorderSections: (from, to) => set((state) => withActive(state, (resume) => {
    const sections = [...resume.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    return { ...resume, sections };
  })),
  toggleSectionHidden: (section) => set((state) => withActive(state, (resume) => {
    const hidden = new Set(resume.hiddenSections ?? []);
    if (hidden.has(section)) hidden.delete(section);
    else hidden.add(section);
    return { ...resume, hiddenSections: [...hidden] };
  })),
  replaceResume: (resume) => {
    previous = null;
    groupingEdits = false;
    return set((state) => {
      const exists = state.resumes.some((item) => item.id === resume.id);
      return {
        resumes: exists ? state.resumes.map((item) => item.id === resume.id ? resume : item) : [...state.resumes, resume],
        activeId: resume.id,
        selectedSection: 'personal',
        canUndo: false
      };
    });
  },
  undo: () => set((state) => {
    if (!previous) return state;
    const restored = previous;
    previous = null;
    groupingEdits = false;
    return {
      resumes: state.resumes.map((resume) => resume.id === restored.id ? restored : resume),
      canUndo: false
    };
  })
}), { name: 'resumeforge_resume', partialize: (state) => ({ resumes: state.resumes, activeId: state.activeId, selectedSection: state.selectedSection }) }));

export const useActiveResume = () => useResumeStore((state) => state.resumes.find((resume) => resume.id === state.activeId) ?? state.resumes[0]);

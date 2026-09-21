import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resume, SectionType, TemplateId } from './types';
import { emptyResume, sampleResume } from './templates/data';

interface ResumeStore {
  resumes: Resume[];
  activeId: string;
  selectedSection: SectionType | 'personal';
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
  replaceResume: (resume: Resume) => void;
}

const timestamp = () => new Date().toISOString();

export const useResumeStore = create<ResumeStore>()(persist((set, get) => ({
  resumes: [sampleResume],
  activeId: sampleResume.id,
  selectedSection: 'personal',
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
  updateResume: (patch) => set((state) => ({ resumes: state.resumes.map((resume) => resume.id === state.activeId ? { ...resume, ...patch, updatedAt: timestamp() } : resume) })),
  updatePersonal: (patch) => set((state) => ({ resumes: state.resumes.map((resume) => resume.id === state.activeId ? { ...resume, personal: { ...resume.personal, ...patch }, updatedAt: timestamp() } : resume) })),
  updateContact: (patch) => set((state) => ({ resumes: state.resumes.map((resume) => resume.id === state.activeId ? { ...resume, personal: { ...resume.personal, contact: { ...resume.personal.contact, ...patch } }, updatedAt: timestamp() } : resume) })),
  setTemplate: (template) => set((state) => ({ resumes: state.resumes.map((resume) => resume.id === state.activeId ? { ...resume, template, updatedAt: timestamp() } : resume) })),
  setSections: (sections) => set((state) => ({ resumes: state.resumes.map((resume) => resume.id === state.activeId ? { ...resume, sections, updatedAt: timestamp() } : resume) })),
  reorderSections: (from, to) => set((state) => {
    const active = state.resumes.find((resume) => resume.id === state.activeId);
    if (!active) return state;
    const sections = [...active.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    return { resumes: state.resumes.map((resume) => resume.id === active.id ? { ...resume, sections, updatedAt: timestamp() } : resume) };
  }),
  replaceResume: (resume) => set((state) => {
    const exists = state.resumes.some((item) => item.id === resume.id);
    return { resumes: exists ? state.resumes.map((item) => item.id === resume.id ? resume : item) : [...state.resumes, resume], activeId: resume.id, selectedSection: 'personal' };
  })
}), { name: 'resumeforge_resume' }));

export const useActiveResume = () => useResumeStore((state) => state.resumes.find((resume) => resume.id === state.activeId) ?? state.resumes[0]);

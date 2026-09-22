import { useState } from 'react';
import { Box, Button, Checkbox, Chip, FormControlLabel, IconButton, Stack, TextField, Typography } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import { useActiveResume, useResumeStore } from '../store';
import type { Certification, Education, Experience, Project } from '../types';

const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const Field = ({ label, value, onChange, multiline = false, disabled = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; disabled?: boolean; placeholder?: string }) => (
  <TextField label={label} value={value} onChange={(e) => onChange(e.target.value)} size="small" fullWidth multiline={multiline} minRows={multiline ? 3 : undefined} disabled={disabled} placeholder={placeholder} />
);
const Header = ({ title, onAdd }: { title: string; onAdd: () => void }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
    <Typography variant="overline" color="text.secondary">{title}</Typography>
    <Button size="small" startIcon={<Plus size={15} />} onClick={onAdd}>Add</Button>
  </Stack>
);

export function SummaryForm() {
  const resume = useActiveResume();
  const update = useResumeStore((s) => s.updateResume);
  const length = resume.summary.trim().length;
  return (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary">Profile summary</Typography>
      <Field label="Tell your story" value={resume.summary} onChange={(summary) => update({ summary })} multiline />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">Keep it focused on your strengths, impact, and the kind of work you want next.</Typography>
        <Typography variant="caption" color={length > 700 ? 'error.main' : 'text.secondary'}>{length}/700</Typography>
      </Stack>
    </Stack>
  );
}

export function SkillsForm() {
  const resume = useActiveResume();
  const update = useResumeStore((s) => s.updateResume);
  const [value, setValue] = useState('');
  const add = () => {
    const skill = value.trim();
    if (skill && !resume.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) update({ skills: [...resume.skills, skill] });
    setValue('');
  };
  return (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary">Skills</Typography>
      <Stack direction="row" spacing={1}>
        <TextField label="Add a skill" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} size="small" fullWidth />
        <Button onClick={add} variant="contained">Add</Button>
      </Stack>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {resume.skills.map((skill) => <Chip key={skill} label={skill} onDelete={() => update({ skills: resume.skills.filter((item) => item !== skill) })} />)}
      </Stack>
    </Stack>
  );
}

export function ExperienceForm() {
  const resume = useActiveResume();
  const update = useResumeStore((s) => s.updateResume);
  const change = (index: number, patch: Partial<Experience>) => update({ experience: resume.experience.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const add = () => update({ experience: [...resume.experience, { id: id(), role: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] });
  const remove = (index: number) => update({ experience: resume.experience.filter((_, i) => i !== index) });
  return (
    <Stack spacing={2}>
      <Header title="Experience" onAdd={add} />
      {resume.experience.map((item, i) => (
        <Box key={item.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600} fontSize={14}>{item.role || 'New role'}</Typography>
              <IconButton size="small" color="error" aria-label="Remove experience" onClick={() => remove(i)}><Trash2 size={16} /></IconButton>
            </Stack>
            <Field label="Job title" value={item.role} onChange={(role) => change(i, { role })} placeholder="Senior Product Designer" />
            <Field label="Company" value={item.company} onChange={(company) => change(i, { company })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Field label="Location" value={item.location} onChange={(location) => change(i, { location })} />
              <Field label="Start" value={item.startDate} onChange={(startDate) => change(i, { startDate })} placeholder="Jan 2022" />
              <Field label="End" value={item.current ? 'Present' : item.endDate} onChange={(endDate) => change(i, { endDate })} disabled={item.current} placeholder="Mar 2024" />
            </Stack>
            <FormControlLabel
              control={<Checkbox size="small" checked={item.current} onChange={() => change(i, { current: !item.current, endDate: item.current ? item.endDate : '' })} />}
              label="I currently work here"
            />
            <Typography variant="caption" color="text.secondary">Achievements</Typography>
            {item.bullets.map((bullet, bulletIndex) => (
              <Stack direction="row" key={`${item.id}-bullet-${bulletIndex}`} spacing={1} alignItems="flex-start">
                <TextField size="small" fullWidth value={bullet} placeholder="Describe an accomplishment with a metric if you can..." multiline minRows={2} onChange={(e) => {
                  const bullets = [...item.bullets];
                  bullets[bulletIndex] = e.target.value;
                  change(i, { bullets });
                }} />
                <IconButton size="small" aria-label="Remove achievement" onClick={() => change(i, { bullets: item.bullets.filter((_, j) => j !== bulletIndex) })}><Trash2 size={14} /></IconButton>
              </Stack>
            ))}
            <Button size="small" startIcon={<Plus size={14} />} onClick={() => change(i, { bullets: [...item.bullets, ''] })}>Add achievement</Button>
          </Stack>
        </Box>
      ))}
      {!resume.experience.length && <Typography color="text.secondary" variant="body2">Add your most recent roles and focus on measurable impact.</Typography>}
    </Stack>
  );
}

export function EducationForm() {
  const resume = useActiveResume();
  const update = useResumeStore((s) => s.updateResume);
  const change = (index: number, patch: Partial<Education>) => update({ education: resume.education.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const add = () => update({ education: [...resume.education, { id: id(), school: '', degree: '', location: '', startDate: '', endDate: '' }] });
  return (
    <Stack spacing={2}>
      <Header title="Education" onAdd={add} />
      {resume.education.map((item, i) => (
        <Box key={item.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600} fontSize={14}>{item.school || 'New education'}</Typography>
              <IconButton size="small" color="error" aria-label="Remove education" onClick={() => update({ education: resume.education.filter((_, j) => j !== i) })}><Trash2 size={16} /></IconButton>
            </Stack>
            <Field label="School" value={item.school} onChange={(school) => change(i, { school })} />
            <Field label="Degree / field of study" value={item.degree} onChange={(degree) => change(i, { degree })} />
            <Field label="Location" value={item.location} onChange={(location) => change(i, { location })} />
            <Stack direction="row" spacing={1}>
              <Field label="Start" value={item.startDate} onChange={(startDate) => change(i, { startDate })} />
              <Field label="End" value={item.endDate} onChange={(endDate) => change(i, { endDate })} />
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export function ProjectsForm() {
  const resume = useActiveResume();
  const update = useResumeStore((s) => s.updateResume);
  const change = (index: number, patch: Partial<Project>) => update({ projects: resume.projects.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const add = () => update({ projects: [...resume.projects, { id: id(), name: '', description: '', url: '', technologies: '' }] });
  return (
    <Stack spacing={2}>
      <Header title="Projects" onAdd={add} />
      {resume.projects.map((item, i) => (
        <Box key={item.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600} fontSize={14}>{item.name || 'New project'}</Typography>
              <IconButton size="small" color="error" aria-label="Remove project" onClick={() => update({ projects: resume.projects.filter((_, j) => j !== i) })}><Trash2 size={16} /></IconButton>
            </Stack>
            <Field label="Project name" value={item.name} onChange={(name) => change(i, { name })} />
            <Field label="Description" value={item.description} onChange={(description) => change(i, { description })} multiline />
            <Field label="Link" value={item.url} onChange={(url) => change(i, { url })} placeholder="https://" />
            <Field label="Technologies" value={item.technologies} onChange={(technologies) => change(i, { technologies })} placeholder="React, Node.js, PostgreSQL" />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export function CertificationsForm() {
  const resume = useActiveResume();
  const update = useResumeStore((s) => s.updateResume);
  const add = () => update({ certifications: [...resume.certifications, { id: id(), name: '', issuer: '', date: '' }] });
  const change = (index: number, patch: Partial<Certification>) => update({ certifications: resume.certifications.map((item, i) => i === index ? { ...item, ...patch } : item) });
  return (
    <Stack spacing={2}>
      <Header title="Certifications" onAdd={add} />
      {resume.certifications.map((item, i) => (
        <Box key={item.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600} fontSize={14}>{item.name || 'New certification'}</Typography>
              <IconButton size="small" color="error" aria-label="Remove certification" onClick={() => update({ certifications: resume.certifications.filter((_, j) => j !== i) })}><Trash2 size={16} /></IconButton>
            </Stack>
            <Field label="Certification" value={item.name} onChange={(name) => change(i, { name })} />
            <Field label="Issuer" value={item.issuer} onChange={(issuer) => change(i, { issuer })} />
            <Field label="Date" value={item.date} onChange={(date) => change(i, { date })} />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

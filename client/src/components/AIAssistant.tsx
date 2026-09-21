import { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, CircularProgress, Divider, Drawer, FormControlLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { Check, Sparkles } from 'lucide-react';
import type { Resume } from '../types';
import { generateProjectBullets, improveSummary, rewriteExperience, suggestSkills, tailorResume } from '../services/aiApi';

type Action = 'summary' | 'experience' | 'project' | 'tailor' | 'skills';
export type AssistantResult = { kind: Action; targetId?: string; text?: string; bullets?: string[]; skills?: string[]; experienceBullets?: Array<{ experienceId?: string; bullets: string[] }> };

interface Props {
  open: boolean;
  onClose: () => void;
  resume: Resume;
  onApply: (result: AssistantResult) => void;
}

export function AIAssistant({ open, onClose, resume, onApply }: Props) {
  const [action, setAction] = useState<Action>('summary');
  const [targetRole, setTargetRole] = useState('');
  const [experienceId, setExperienceId] = useState(resume.experience[0]?.id ?? '');
  const [projectId, setProjectId] = useState(resume.projects[0]?.id ?? '');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [selected, setSelected] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentExperience = useMemo(() => resume.experience.find((item) => item.id === experienceId), [experienceId, resume.experience]);
  const currentProject = useMemo(() => resume.projects.find((item) => item.id === projectId), [projectId, resume.projects]);

  const run = async () => {
    setError(''); setResult(null); setLoading(true);
    try {
      if (action === 'summary') {
        const response = await improveSummary(resume.summary, resume, targetRole);
        setResult({ kind: action, text: response.summary });
      } else if (action === 'experience' && currentExperience) {
        const response = await rewriteExperience(currentExperience, targetRole);
        setResult({ kind: action, targetId: currentExperience.id, bullets: response.bullets });
      } else if (action === 'project' && currentProject) {
        const response = await generateProjectBullets(currentProject, targetRole);
        setResult({ kind: action, targetId: currentProject.id, bullets: response.bullets });
      } else if (action === 'tailor') {
        if (!jobDescription.trim()) throw new Error('Paste a job description first.');
        const response = await tailorResume(resume, jobDescription);
        setResult({ kind: action, text: response.summary, experienceBullets: response.experienceBullets, skills: response.skills });
      } else {
        const response = await suggestSkills(resume, jobDescription);
        setResult({ kind: action, skills: response.skills });
      }
      setSelected(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI writing failed. Please try again.');
    } finally { setLoading(false); }
  };

  const apply = () => { if (!result || !selected) return; onApply(result); setSelected(false); };
  const hasTarget = action === 'experience' ? Boolean(currentExperience) : action === 'project' ? Boolean(currentProject) : true;

  return <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 430 }, p: 0 } }}>
    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" spacing={1}><Sparkles size={20} color="#2563eb" /><Typography variant="h6" fontWeight={750}>AI Assistant</Typography></Stack>
      <Typography variant="body2" color="text.secondary" mt={.5}>Generate a suggestion, review it, then choose what to apply.</Typography>
    </Box>
    <Box sx={{ p: 2.5, overflow: 'auto', flex: 1 }}>
      <Stack spacing={2}>
        <Select size="small" value={action} onChange={(event) => { setAction(event.target.value as Action); setResult(null); setError(''); }} fullWidth>
          <MenuItem value="summary">Improve profile summary</MenuItem><MenuItem value="experience">Rewrite experience bullets</MenuItem><MenuItem value="project">Generate project bullets</MenuItem><MenuItem value="tailor">Tailor to a job description</MenuItem><MenuItem value="skills">Suggest skills</MenuItem>
        </Select>
        {(action === 'summary' || action === 'experience' || action === 'project') && <TextField size="small" label="Target role (optional)" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} />}
        {action === 'experience' && <Select size="small" value={experienceId} onChange={(event) => setExperienceId(event.target.value)} fullWidth displayEmpty>{resume.experience.length ? resume.experience.map((item) => <MenuItem key={item.id} value={item.id}>{item.role || 'Untitled role'} — {item.company || 'No company'}</MenuItem>) : <MenuItem value="">Add an experience first</MenuItem>}</Select>}
        {action === 'project' && <Select size="small" value={projectId} onChange={(event) => setProjectId(event.target.value)} fullWidth displayEmpty>{resume.projects.length ? resume.projects.map((item) => <MenuItem key={item.id} value={item.id}>{item.name || 'Untitled project'}</MenuItem>) : <MenuItem value="">Add a project first</MenuItem>}</Select>}
        {(action === 'tailor' || action === 'skills') && <TextField label="Paste job description (optional for skills)" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} multiline minRows={6} inputProps={{ maxLength: 12000 }} helperText={`${jobDescription.length}/12000`} />}
        <Button variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />} onClick={run} disabled={loading || !hasTarget}>{loading ? 'Writing…' : 'Generate suggestion'}</Button>
        {error && <Alert severity="error">{error}</Alert>}
        {result && <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.5 }}>
          <Typography variant="overline" color="text.secondary">Preview — nothing has been changed</Typography>
          {result.text && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{result.text}</Typography>}
          {result.bullets && <Stack component="ul" spacing={.75} sx={{ pl: 2.5, mb: 0 }}>{result.bullets.map((bullet, index) => <Typography component="li" variant="body2" key={`${bullet}-${index}`}>{bullet}</Typography>)}</Stack>}
          {result.skills && <Stack direction="row" gap={.75} flexWrap="wrap" mt={1}>{result.skills.map((skill) => <Box key={skill} sx={{ px: 1, py: .5, borderRadius: 1, bgcolor: 'action.hover', fontSize: 13 }}>{skill}</Box>)}</Stack>}
          {result.experienceBullets && <Stack spacing={1} mt={1}>{result.experienceBullets.map((item) => <Box key={item.experienceId ?? 'suggestion'}><Typography variant="caption" fontWeight={700}>{resume.experience.find((entry) => entry.id === item.experienceId)?.role || 'Experience'}</Typography><Stack component="ul" spacing={.5} sx={{ pl: 2.5, mb: 0 }}>{item.bullets.map((bullet, index) => <Typography component="li" variant="body2" key={`${bullet}-${index}`}>{bullet}</Typography>)}</Stack></Box>)}</Stack>}
          <Divider sx={{ my: 1.5 }} />
          <FormControlLabel control={<Checkbox checked={selected} onChange={(event) => setSelected(event.target.checked)} />} label="Apply this suggestion to my editor" />
          <Button fullWidth variant="outlined" startIcon={<Check size={16} />} onClick={apply} disabled={!selected}>Apply selected suggestion</Button>
        </Box>}
        <Typography variant="caption" color="text.secondary">AI suggestions can be imperfect. Verify facts, metrics, and skills before applying.</Typography>
      </Stack>
    </Box>
  </Drawer>;
}

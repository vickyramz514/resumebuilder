import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from '@mui/material';
import { WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createResume } from '../services/resumeApi';
import { TEMPLATE_CATALOG } from '../templates/catalog';
import type { TemplateId } from '../types';
import { AUTOMATE_HINT_KEY, draftFromJob } from '../utils/automateDraft';

const tierLabel = { free: 'Free', plus: '₹100', paid: 'Pro' } as const;

export function AutomateDialog({ open, onClose, onError, template }: { open: boolean; onClose: () => void; onError: (message: string) => void; template: TemplateId }) {
  const navigate = useNavigate();
  const [job, setJob] = useState('');
  const [chosen, setChosen] = useState<TemplateId>(template);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setChosen(template);
  }, [open, template]);

  const submit = async () => {
    const description = job.trim();
    if (description.length < 40 || busy) return;
    setBusy(true);
    try {
      const draft = draftFromJob(description, chosen);
      const result = await createResume({ title: draft.title, data: draft, templateId: chosen });
      sessionStorage.setItem(AUTOMATE_HINT_KEY, result.resume.id);
      setJob('');
      onClose();
      navigate(`/resume/${result.resume.id}/edit`);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to create the resume');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Automate</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Pick the layout, then paste a job description. The profile, skills, experience, and any degree, certification, or language named in the posting are filled on that template. Your name, contact details, and project name stay blank.
        </Typography>
        <TextField select label="Template" value={chosen} onChange={(event) => setChosen(event.target.value as TemplateId)} fullWidth size="small" sx={{ mb: 2 }}>
          {TEMPLATE_CATALOG.map((item) => <MenuItem key={item.id} value={item.id}>{item.label} · {tierLabel[item.tier]}</MenuItem>)}
        </TextField>
        <TextField
          autoFocus
          label="Job description"
          value={job}
          onChange={(event) => setJob(event.target.value)}
          multiline
          minRows={8}
          fullWidth
          inputProps={{ maxLength: 12000 }}
          helperText={`${job.length}/12000`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" startIcon={<WandSparkles size={16} />} onClick={() => { void submit(); }} disabled={busy || job.trim().length < 40}>
          {busy ? 'Creating resume…' : 'Create resume'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

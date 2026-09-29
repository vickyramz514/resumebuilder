import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createResume } from '../services/resumeApi';
import { AUTOMATE_HINT_KEY, draftFromJob } from '../utils/automateDraft';

export function AutomateDialog({ open, onClose, onError }: { open: boolean; onClose: () => void; onError: (message: string) => void }) {
  const navigate = useNavigate();
  const [job, setJob] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const description = job.trim();
    if (description.length < 40 || busy) return;
    setBusy(true);
    try {
      const draft = draftFromJob(description);
      const result = await createResume({ title: draft.title, data: draft, templateId: draft.template });
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
          Paste a job description. The profile, skills, and a first role are filled from it. Your name, contact details, and projects stay empty so you can enter them yourself.
        </Typography>
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

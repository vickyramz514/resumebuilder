import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import type { Resume } from '../types';
import { useResumeStore } from '../store';
import { alignResumeToJob, checkAts } from '../utils/atsCheck';

export function AtsCheck({ resume }: { resume: Resume }) {
  const updateResume = useResumeStore((state) => state.updateResume);
  const [job, setJob] = useState('');
  const [report, setReport] = useState<ReturnType<typeof checkAts> | null>(null);
  const [note, setNote] = useState('');

  const run = () => {
    if (job.trim().length < 40) {
      setReport(null);
      setNote('');
      return;
    }
    setNote('');
    setReport(checkAts(resume, job));
  };

  const matchJd = () => {
    if (!report) return;
    const next = alignResumeToJob(resume, job);
    const { removed, added, ...updated } = next;
    updateResume({
      summary: updated.summary,
      skills: updated.skills,
      experience: updated.experience,
      projects: updated.projects,
      hiddenSections: updated.hiddenSections
    });
    setReport(checkAts(updated, job));
    setNote(`Removed ${removed.length} ${removed.length === 1 ? 'skill' : 'skills'} that are not in the posting, added ${added.length}, and rewrote the profile and bullets around this job. The preview is updated.`);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Paste a job description. This compares its tools, phrases, and other terms with the text already on your resume. It does not send the description anywhere.
      </Typography>
      <TextField
        label="Job description"
        value={job}
        onChange={(event) => setJob(event.target.value)}
        multiline
        minRows={8}
        fullWidth
        inputProps={{ maxLength: 12000 }}
        helperText={`${job.length}/12000`}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="contained" onClick={run} disabled={job.trim().length < 40}>Check this resume</Button>
        <Button variant="contained" onClick={matchJd} disabled={!report}>Match JD</Button>
      </Stack>
      {job.trim().length > 0 && job.trim().length < 40 ? <Typography variant="caption" color="text.secondary">Paste a little more of the posting. Forty characters is the minimum.</Typography> : null}
      {note ? <Typography variant="body2">{note}</Typography> : null}
      {report ? (
        <Stack spacing={1.5}>
          <Typography variant="h6">{report.score}% overlap</Typography>
          <Typography variant="body2" color="text.secondary">
            {report.missing.length
              ? 'Missing terms are tools and phrases from the posting that do not appear in your resume text. Add one only if you actually used it.'
              : 'Every extracted term from the posting already appears in the resume.'}
          </Typography>
          <Box>
            <Typography variant="overline" color="text.secondary">Headings</Typography>
            {report.headings.map((item) => (
              <Typography key={item.label} variant="body2">{item.present ? 'Present' : 'Missing'} · {item.label}. {item.detail}</Typography>
            ))}
          </Box>
          {report.missing.length ? (
            <Box>
              <Typography variant="overline" color="text.secondary">Not on the resume</Typography>
              <Box className="ats-chips">{report.missing.map((word) => <span key={word}>{word}</span>)}</Box>
            </Box>
          ) : null}
          {report.matched.length ? (
            <Box>
              <Typography variant="overline" color="text.secondary">Already on the resume</Typography>
              <Box className="ats-chips is-match">{report.matched.map((word) => <span key={word}>{word}</span>)}</Box>
            </Box>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

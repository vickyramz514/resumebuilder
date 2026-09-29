import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import type { Resume } from '../types';
import { useResumeStore } from '../store';
import { checkAts, skillLabel } from '../utils/atsCheck';

export function AtsCheck({ resume }: { resume: Resume }) {
  const updateResume = useResumeStore((state) => state.updateResume);
  const [job, setJob] = useState('');
  const [report, setReport] = useState<ReturnType<typeof checkAts> | null>(null);
  const [applied, setApplied] = useState(0);

  const run = () => {
    if (job.trim().length < 40) {
      setReport(null);
      setApplied(0);
      return;
    }
    setApplied(0);
    setReport(checkAts(resume, job));
  };

  const matchJd = () => {
    if (!report?.missing.length) return;
    const taken = new Set(resume.skills.map((skill) => skill.trim().toLowerCase()));
    const added = report.missing.map(skillLabel).filter((skill) => {
      const key = skill.toLowerCase();
      if (!skill || taken.has(key)) return false;
      taken.add(key);
      return true;
    });
    if (!added.length) return;
    const skills = [...resume.skills, ...added];
    const hiddenSections = (resume.hiddenSections ?? []).filter((section) => section !== 'skills');
    updateResume({ skills, hiddenSections });
    setReport(checkAts({ ...resume, skills, hiddenSections }, job));
    setApplied(added.length);
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
        <Button variant="contained" onClick={matchJd} disabled={!report?.missing.length}>Match JD</Button>
      </Stack>
      {job.trim().length > 0 && job.trim().length < 40 ? <Typography variant="caption" color="text.secondary">Paste a little more of the posting. Forty characters is the minimum.</Typography> : null}
      {applied > 0 ? <Typography variant="body2">Added {applied} {applied === 1 ? 'term' : 'terms'} to Skills. The preview is updated. Download again for a new PDF.</Typography> : null}
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

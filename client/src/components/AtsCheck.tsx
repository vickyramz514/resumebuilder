import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import type { Resume } from '../types';
import { checkAts } from '../utils/atsCheck';

export function AtsCheck({ resume }: { resume: Resume }) {
  const [job, setJob] = useState('');
  const [report, setReport] = useState<ReturnType<typeof checkAts> | null>(null);

  const run = () => {
    if (job.trim().length < 40) {
      setReport(null);
      return;
    }
    setReport(checkAts(resume, job));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Paste a job description. This compares its words with the text already on your resume. It does not send the description anywhere.
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
      <Button variant="contained" onClick={run} disabled={job.trim().length < 40}>Check this resume</Button>
      {job.trim().length > 0 && job.trim().length < 40 ? <Typography variant="caption" color="text.secondary">Paste a little more of the posting. Forty characters is the minimum.</Typography> : null}
      {report ? (
        <Stack spacing={1.5}>
          <Typography variant="h6">{report.score}% overlap</Typography>
          <Typography variant="body2" color="text.secondary">
            {report.missing.length
              ? 'Missing words are terms from the posting that do not appear in your resume text. Add one only if you actually used it.'
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

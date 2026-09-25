import { Box, Stack, TextField, Typography } from '@mui/material';
import { useActiveResume, useResumeStore } from '../store';

export function PersonalForm() {
  const resume = useActiveResume();
  const updatePersonal = useResumeStore((s) => s.updatePersonal);
  const updateContact = useResumeStore((s) => s.updateContact);
  const updateResume = useResumeStore((s) => s.updateResume);
  const contact = resume.personal.contact;
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">Resume setup</Typography>
      <Stack spacing={1.25} mt={0.5}>
        <TextField label="Resume title" size="small" value={resume.title} onChange={(event) => updateResume({ title: event.target.value })} />
        <TextField label="Full name" size="small" value={resume.personal.name} onChange={(event) => updatePersonal({ name: event.target.value })} autoComplete="name" />
        <TextField label="Professional headline" size="small" value={resume.personal.headline} onChange={(event) => updatePersonal({ headline: event.target.value })} placeholder="Product designer · 8 years building B2B tools" />
        <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>Contact details</Typography>
        <TextField label="Email" size="small" type="email" value={contact.email} onChange={(event) => updateContact({ email: event.target.value })} autoComplete="email" />
        <TextField label="Phone" size="small" value={contact.phone} onChange={(event) => updateContact({ phone: event.target.value })} autoComplete="tel" />
        <TextField label="Location" size="small" value={contact.location} onChange={(event) => updateContact({ location: event.target.value })} placeholder="City, Country" />
        <TextField label="Website" size="small" value={contact.website} onChange={(event) => updateContact({ website: event.target.value })} placeholder="yourwebsite.com" />
        <TextField label="LinkedIn" size="small" value={contact.linkedin} onChange={(event) => updateContact({ linkedin: event.target.value })} placeholder="linkedin.com/in/..." />
        <TextField label="GitHub" size="small" value={contact.github} onChange={(event) => updateContact({ github: event.target.value })} placeholder="github.com/..." />
      </Stack>
    </Box>
  );
}

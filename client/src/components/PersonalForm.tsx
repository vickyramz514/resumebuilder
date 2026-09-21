import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useResumeStore, useActiveResume } from '../store';

type Fields = { name: string; headline: string; email: string; phone: string; location: string; website: string; linkedin: string; github: string };

export function PersonalForm() {
  const resume = useActiveResume();
  const updatePersonal = useResumeStore((s) => s.updatePersonal);
  const updateContact = useResumeStore((s) => s.updateContact);
  const updateResume = useResumeStore((s) => s.updateResume);
  const { register, reset, handleSubmit } = useForm<Fields>();
  useEffect(() => reset({ name: resume.personal.name, headline: resume.personal.headline, ...resume.personal.contact }), [resume.id, resume.personal, reset]);
  const save = (values: Fields) => {
    updatePersonal({ name: values.name, headline: values.headline });
    updateContact({ email: values.email, phone: values.phone, location: values.location, website: values.website, linkedin: values.linkedin, github: values.github });
  };
  return <Box component="form" onSubmit={handleSubmit(save)}>
    <Typography variant="overline" color="text.secondary">Resume setup</Typography>
    <Stack spacing={2} mt={1}>
      <TextField label="Resume title" size="small" value={resume.title} onChange={(event) => updateResume({ title: event.target.value })} />
      <TextField label="Full name" size="small" {...register('name')} onBlur={handleSubmit(save)} />
      <TextField label="Professional headline" size="small" {...register('headline')} onBlur={handleSubmit(save)} />
      <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>Contact details</Typography>
      <TextField label="Email" size="small" {...register('email')} onBlur={handleSubmit(save)} />
      <TextField label="Phone" size="small" {...register('phone')} onBlur={handleSubmit(save)} />
      <TextField label="Location" size="small" {...register('location')} onBlur={handleSubmit(save)} />
      <TextField label="Website" size="small" placeholder="yourwebsite.com" {...register('website')} onBlur={handleSubmit(save)} />
      <TextField label="LinkedIn" size="small" placeholder="linkedin.com/in/..." {...register('linkedin')} onBlur={handleSubmit(save)} />
      <TextField label="GitHub" size="small" placeholder="github.com/..." {...register('github')} onBlur={handleSubmit(save)} />
      <Button type="submit" variant="contained" size="small">Save details</Button>
    </Stack>
  </Box>;
}

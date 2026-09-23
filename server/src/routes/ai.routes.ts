import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePaidPlan } from '../middleware/paid.middleware.js';
import { generateJson } from '../services/gemini.service.js';

const router = Router();
router.use(requireAuth);
router.use(requirePaidPlan);

const stringField = (max: number) => z.string().trim().min(1).max(max);
const contextString = (max: number) => z.string().trim().max(max);
const experienceSchema = z.object({
  id: contextString(100).optional(),
  role: contextString(200).optional(),
  company: contextString(200).optional(),
  bullets: z.array(contextString(1000)).max(12)
});
const projectSchema = z.object({
  id: contextString(100).optional(),
  name: contextString(200),
  description: contextString(4000).default(''),
  technologies: contextString(1000).default('')
});
const resumeContextSchema = z.object({
  personal: z.object({ name: z.string().max(200).optional(), headline: z.string().max(300).optional() }).optional(),
  summary: z.string().max(5000).optional(),
  skills: z.array(contextString(120)).max(100).optional(),
  experience: z.array(experienceSchema).max(30).optional(),
  projects: z.array(projectSchema).max(30).optional()
}).default({});

const targetRole = z.string().trim().max(200).optional();
const summaryRequest = z.object({ summary: z.string().trim().max(5000).default(''), targetRole, resume: resumeContextSchema.optional() });
const experienceRequest = z.object({ role: stringField(200), company: stringField(200).optional(), bullets: z.array(stringField(1000)).min(1).max(12), targetRole });
const projectRequest = z.object({ project: projectSchema, targetRole });
const tailorRequest = z.object({ resume: resumeContextSchema, jobDescription: stringField(12000) });
const skillsRequest = z.object({ resume: resumeContextSchema, jobDescription: z.string().trim().max(12000).optional() });

const jsonRules = 'Return only valid JSON matching the requested shape. Do not use markdown, add fields, invent employers, dates, metrics, technologies, or achievements. Preserve the user’s facts and use placeholders only when absolutely necessary.';

router.post('/improve-summary', async (req, res, next) => {
  try {
    const input = summaryRequest.parse(req.body ?? {});
    const result = await generateJson<{ summary: string }>(`${jsonRules}
Improve this resume summary for clarity, specificity, and ATS readability. Keep it truthful and under 700 characters.
Target role: ${input.targetRole || 'not specified'}
Current summary: ${JSON.stringify(input.summary)}
Relevant resume context: ${JSON.stringify(input.resume ?? {})}
JSON shape: {"summary":"..."}`);
    const summary = stringField(1500).parse(result.summary);
    return res.json({ summary });
  } catch (error) { return next(error); }
});

router.post('/rewrite-experience', async (req, res, next) => {
  try {
    const input = experienceRequest.parse(req.body ?? {});
    const result = await generateJson<{ bullets: string[] }>(`${jsonRules}
Rewrite each experience bullet as a concise, impact-focused resume bullet. Keep the same number of bullets, do not combine them, and do not add unsupported facts. Start each bullet with a strong verb and keep each under 240 characters.
Role: ${input.role}
Company: ${input.company || 'not specified'}
Target role: ${input.targetRole || 'not specified'}
Bullets: ${JSON.stringify(input.bullets)}
JSON shape: {"bullets":["..."]}`);
    const bullets = z.array(stringField(500)).min(1).max(12).parse(result.bullets);
    return res.json({ bullets });
  } catch (error) { return next(error); }
});

router.post('/generate-project-bullets', async (req, res, next) => {
  try {
    const input = projectRequest.parse(req.body ?? {});
    const result = await generateJson<{ bullets: string[] }>(`${jsonRules}
Turn the project description into 3-5 strong resume bullets. Use only facts present in the project data, keep bullets concise, and do not invent metrics. Mention technologies only when supplied.
Project: ${JSON.stringify(input.project)}
Target role: ${input.targetRole || 'not specified'}
JSON shape: {"bullets":["..."]}`);
    const bullets = z.array(stringField(500)).min(1).max(6).parse(result.bullets);
    return res.json({ bullets });
  } catch (error) { return next(error); }
});

router.post('/tailor', async (req, res, next) => {
  try {
    const input = tailorRequest.parse(req.body ?? {});
    const result = await generateJson<{ summary?: string; experienceBullets?: Array<{ experienceId?: string; bullets: string[] }>; skills?: string[] }>(`${jsonRules}
Tailor the supplied resume to the pasted job description without changing facts. Suggest an improved summary, rewritten bullets only for supplied experience records, and skills already evidenced by the resume. Omit a section when there is no safe suggestion. Keep experienceId exactly as supplied.
Resume: ${JSON.stringify(input.resume)}
Job description: ${JSON.stringify(input.jobDescription)}
JSON shape: {"summary":"optional","experienceBullets":[{"experienceId":"optional","bullets":["..."]}],"skills":["..."]}`);
    const tailored = z.object({
      summary: z.string().trim().max(1500).optional(),
      experienceBullets: z.array(z.object({ experienceId: z.string().max(100).optional(), bullets: z.array(stringField(500)).min(1).max(12) })).max(30).optional(),
      skills: z.array(stringField(120)).max(30).optional()
    }).parse(result);
    return res.json(tailored);
  } catch (error) { return next(error); }
});

router.post('/suggest-skills', async (req, res, next) => {
  try {
    const input = skillsRequest.parse(req.body ?? {});
    const result = await generateJson<{ skills: string[] }>(`${jsonRules}
Suggest up to 12 concise skills that are explicitly evidenced by the resume and relevant to the job description. Do not infer skills solely from a job requirement and do not repeat existing skills.
Resume: ${JSON.stringify(input.resume)}
Job description: ${JSON.stringify(input.jobDescription || 'not supplied')}
JSON shape: {"skills":["..."]}`);
    const skills = z.array(stringField(120)).max(12).parse(result.skills);
    return res.json({ skills });
  } catch (error) { return next(error); }
});

export default router;

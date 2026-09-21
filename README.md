# ResumeForge

ResumeForge is a focused Phase 1 resume builder for creating, rearranging, and exporting polished resumes. It stores edits in the browser so work is available offline between visits.

## Stack

- Client: React, Vite, TypeScript, Material UI, React Hook Form, Zustand, dnd-kit, lucide-react
- Server: Express, TypeScript, Playwright PDF rendering

## Run locally

```bash
npm install
npx playwright install chromium # first run only, for PDF export
npm run dev
```

Open http://localhost:5173. The client proxies `/api` requests to the Express server on port 3001.

## Included in Phase 1

- Sample resume with professional, minimal, and modern templates
- Personal, profile, experience, education, skills, project, and certification editors
- Drag-and-drop section ordering
- Multiple resumes with duplicate/delete/new actions
- Zustand localStorage persistence and responsive editor/preview layout
- Browser print fallback and Playwright-backed PDF export endpoint

For a production deployment, build both workspaces with `npm run build` and start the server with `npm start`.

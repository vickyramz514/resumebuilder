# ResumeForge

ResumeForge is a resume builder for creating, rearranging, sharing, and exporting polished resumes. Phase 2 adds optional cloud persistence, accounts, and public resume links while retaining the Phase 1 local/offline editor fallback.

## Stack

- Client: React, Vite, TypeScript, Material UI, React Hook Form, Zustand, dnd-kit, lucide-react
- Server: Express, TypeScript, Prisma, PostgreSQL, JWT, Playwright PDF rendering

## Phase 2 architecture

The React client uses the existing Zustand resume model and templates. Authenticated resume changes are persisted locally immediately and debounced to the Express API (PostgreSQL through Prisma). JWTs are stored in local storage for this MVP; passwords are bcrypt-hashed and never returned. Public links use random slugs and only expose explicitly shared resume data.

## Phase 2 setup

Prerequisites: Node.js 20+, PostgreSQL, and (for PDF export) Chromium.

```bash
npm install
npx playwright install chromium
cp server/.env.example server/.env
# Set DATABASE_URL, a strong JWT_SECRET, and GOOGLE_CLIENT_ID in server/.env
cp client/.env.example client/.env
# Set GOOGLE_CLIENT_ID in client/.env (this is public; never add a Google client secret)
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run dev
```

Google sign-in uses a Google OAuth web client. Add `http://localhost:5173` to its authorized JavaScript origins, then set the same public client ID as `GOOGLE_CLIENT_ID` in `client/.env` and `GOOGLE_CLIENT_ID` in `server/.env`. The client ID is safe to expose in the frontend; do not add a Google client secret to either example.

The API runs on `http://localhost:3001` and Vite on `http://localhost:5173`. `CLIENT_URL`, `ALLOWED_ORIGINS`, `PORT`, `DATABASE_URL`, and `JWT_SECRET` are read from `server/.env`. Set `ALLOWED_ORIGINS` to a comma-separated list of deployed frontend origins. The production build remains `npm run build`, followed by `npm start`; the server start command applies pending Prisma migrations before booting.

## Phase 3: Gemini AI Assistant

Phase 3 adds an authenticated, server-only Gemini integration to the editor. The browser sends resume content to the Express API; `GEMINI_API_KEY` is never included in client code, `client/.env`, or API responses. Copy `server/.env.example` and set:

```bash
GEMINI_API_KEY="your-server-only-key"
GEMINI_MODEL="gemini-2.0-flash" # optional
```

Restart the server after changing environment variables. The **AI Assistant** button in the resume editor opens a review panel. Suggestions are previewed first and are only written to the Zustand resume model after the user clicks **Apply selected suggestion**; generated content never destructively overwrites the editor by itself.

Protected endpoints (all require the existing `Authorization: Bearer <JWT>` middleware):

- `POST /api/ai/improve-summary` — `{ summary, targetRole?, resume? }` → `{ summary }`
- `POST /api/ai/rewrite-experience` — `{ role, company?, bullets, targetRole? }` → `{ bullets }`
- `POST /api/ai/generate-project-bullets` — `{ project, targetRole? }` → `{ bullets }`
- `POST /api/ai/tailor` — `{ resume, jobDescription }` → optional `summary`, `experienceBullets`, and `skills`
- `POST /api/ai/suggest-skills` — `{ resume, jobDescription? }` → `{ skills }`

Requests and model output are validated with Zod and bounded by size/count limits. Missing configuration returns `AI_NOT_CONFIGURED`, provider failures/timeouts return a safe error, and malformed model output is rejected without changing the resume. Do not commit `.env` files or paste API keys into the frontend.

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
- Registration, login, protected multi-resume dashboard, autosave, duplicate/rename/delete, and public sharing

For a production deployment, build both workspaces with `npm run build` and start the server with `npm start`.

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
# Set VITE_GOOGLE_CLIENT_ID in client/.env (this is public; never add a Google client secret)
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run dev
```

Google sign-in uses a Google OAuth web client. Add `http://localhost:5173` to its authorized JavaScript origins, then set the same public client ID as `VITE_GOOGLE_CLIENT_ID` in `client/.env` and `GOOGLE_CLIENT_ID` in `server/.env`. The client ID is safe to expose in the frontend; do not add a Google client secret to either example.

The API runs on `http://localhost:3001` and Vite on `http://localhost:5173`. `CLIENT_URL`, `PORT`, `DATABASE_URL`, and `JWT_SECRET` are read from `server/.env`. The production build remains `npm run build`, followed by `npm start`; the server start command applies pending Prisma migrations before booting.

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

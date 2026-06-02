# ABHAY — Build Prompt


Build **ABHAY — AI-Based Helpdesk for Assistance & Your Complaints**, an AI-driven complaints management platform. Generate `product.md` + `architecture.md` first, then the code. Keep everything minimal, clean, and functional.


## What it does
- Email/password auth (JWT). Homepage uploads one complaint image → AI parses it into a boiled-down FIR form → human reviewer corrects → saved to DB + vector embedding.
- AI also generates a short action-phrase title (≤12 chars) and suggests IPC section numbers (shown as `IPC <n>` editable multiselect tags).
- Search FIRs two ways: default keyword match (title/description), and a semantic AI search behind a toggle (default OFF). Same for users and admin.
- Per-user lifetime limits: **5 image uploads, 10 AI searches** (base). Admin raises them to absolute values, searching users by email or name.
- Admin sees all complaints + a limits-management panel. Admin = a normal signup whose role is flipped in DB.


**FIR format (7 fields)**: Complainant Name; Complainant Contact/Address; Date & Time of Incident; Place of Incident (District/PS); Accused/Suspect Details; Complaint Description; IPC Sections.


## Stack
- Frontend: React 19 + TypeScript, **Vite**, shadcn (grey, light default), **Tailwind v4** (pure Tailwind; minimal `global.css`).
- Backend: Express 5 + TypeScript, **ESM**, build with **tsc** (`app.ts → dist/app.js`; `npm run start` = `node dist/app.js`).
- DB: Drizzle → Supabase Postgres. Vector: pgvector `vector(1536)`. Storage: Supabase Storage (keep original image).
- AI: **OpenAI** — `gpt-5.4-mini` via Responses API (`input_text` + base64 data-URL `input_image`, read `output_text`) for parse/IPC/title; `text-embedding-3-small` for embeddings.
- Email: **Resend** (OTP). Package manager: npm. Node 20+.
- Deploy: Frontend → Vercel, Backend → Render/Railway, DB → Supabase.


## Auth
- Signup → unverified user + emailed **6-digit OTP, 5-min TTL** → verify flips `verified`; login blocked until verified. Forgot-password via OTP (same flow, purpose `reset`).
- Passwords + OTPs hashed with **bcrypt** (cost 12).
- Login → JWT (1-day, claims userId+role) set as cookie **`authorization=<jwt>`** (`httpOnly:true, secure:true, sameSite:'none'`); middleware reads it from that cookie. No refresh token.
- Frontend boots via `GET /auth/me`.
- CORS allows `localhost:6001`, `127.0.0.1:6001`, `<DOMAIN_PLACEHOLDER>` (hardcoded in config, **not** env), `credentials:true`.


## API
Prefix `/api`, cookie `authorization`. Envelope on every response: `{ status: 'success'|'fail', message, data?, error? }`.
- `auth`: POST signup, verify-otp, resend-otp, login, logout, forgot-password, reset-password; GET me.
- `complaints`: POST /parse (multipart image → store + parse → draft; counts 1 upload on success), POST / (save + embed), GET / (own; admin all; no pagination), GET /:id, PATCH /:id (owner/admin, re-embed), DELETE /:id (owner/admin, remove record+embedding), GET /search?q=&ai=true|false (keyword `ILIKE '%q%'` on title+description default; `ai=true` semantic, counts 1 AI search on success incl. 0 results).
- `admin`: GET /users?query= (by email/name), PATCH /users/:id/limits (absolute uploadLimit/searchLimit).
- Limits counted **on success only**; at cap → `403` with `status:'fail'` + clear message.


## Data model
Serial int PKs, timestamps everywhere.
- `users`: name, email(unique), password_hash, role(`USER`|`ADMIN`), verified, upload_limit(5), search_limit(10), uploads_used(0), searches_used(0).
- `otps`: user_id, otp_hash, purpose(`signup`|`reset`), expires_at.
- `complaints`: user_id, title, + the 7 FIR fields, ipc_sections(text[]), image_url.
- `complaint_embeddings`: complaint_id, embedding `vector(1536)` over (description + IPC).


## Backend conventions
- MVC: `route → controller → service → DAL → Drizzle`. DTOs validated with **zod**. Drizzle schema + migrations.
- Layout: `src/apps/<domain>/{controllers,dtos,services}/ + route.ts` for `auth`, `complaints`, `admin`; all domain routes in its `route.ts`. Plus `src/config/` (loads `.env` + config once, exported typed; no scattered `process.env`), `src/constants/` (roles, limits, enums), `src/utils/`, `src/db/{schema,migrations,dal}`.
- **File naming: plain names inside typed folders** (`controllers/login.ts`). **No `index.ts` barrel files anywhere.**


## Frontend conventions
- Layout: `src/{APIs/, constants/ (endpoints+roles+enums), context/ (auth+theme), utils/, lib/axios.ts, pages/ (route per page), components/ui/ (searchbox, sidebar...), components/form/ (input, button...)}`.
- Single axios instance (`withCredentials:true`, baseURL from `VITE_API_BASE_URL`). All endpoints in constants, all API calls in `APIs/`. Roles/enums centralized.
- Global state via React Context only (auth, theme). **No state-management or forms library** — plain HTML forms. Toast via shadcn/lib. framer-motion only where genuinely needed. Avoid `useMemo`/`useCallback` unless measured. localStorage autosave for in-progress reviews.
- Routes: `/login`, `/signup`, `/verify`, `/forgot-password`, `/` (home/upload), `/complaints`, `/complaints/:id`, `/profile`, `/settings`, `/admin`. Complaints list = **table**.
- Sidebar: org logo (ABHAY), items Home / Complaints / Profile / Settings / Logout, user/admin chip. Near-identical UI for both roles.
- UI: minimal grey, no blue, **no "AI look"**, standard buttons/forms.


## Project rules
- Single repo, separate `/frontend` and `/backend` folders. Ports: **frontend 6001, backend 7001**.
- Exactly **one `.env` + one `.env.example` per app** (no `.local/.prod/.stage`). **No `dev/test/stage/prod` flag anywhere.**
- Backend env: `PORT, DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_STORAGE_BUCKET, JWT_SECRET, OPENAI_API_KEY, RESEND_API_KEY, EMAIL_FROM`. Frontend env: `VITE_API_BASE_URL`.
- TypeScript both ends.


## OpenAI models
- **`gpt-5.4-mini`** — image parsing → FIR fields, IPC section numbers, and short action-phrase title. Called via the **Responses API**: `client.responses.create({ model, input: [{ role:'user', content:[{ type:'input_text', text:prompt }, { type:'input_image', image_url:'data:<mime>;base64,<b64>' }] }] })`; read `response.output_text`.
- **`text-embedding-3-small`** — 1536-dim embeddings of (description + IPC) for semantic search; stored in pgvector `vector(1536)`.


## References
- UP / Integrated FIR Form (Form IF1, CrPC §154) — boiled down to the 7 fields above: https://police.py.gov.in/Police%20manual/Forms%20pdf/FORM%20IF%201.pdf

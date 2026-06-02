# Technical Architecture: ABHAY

This document outlines the system architecture, file structure, database schema, and API endpoints for the **ABHAY** platform.

---

## 1. System Overview & Deployment Architecture

ABHAY is structured as a monorepo containing two decoupled directories: `/frontend` and `/backend`.

```
                    ┌────────────────────────┐
                    │     Client Browser     │
                    └───────────┬────────────┘
                                │ HTTP + Cookies
                                ▼
  ┌────────────────────────────────────────────────────────────┐
  │                        BACKEND API                         │
  │    (Express 5 + TypeScript + ESM on Port 7001)             │
  └──────┬───────────────────┬──────────────┬─────────────┬────┘
         │                   │              │             │
         ▼ (SQL / pgvector)  ▼              ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────┐
│     Database     │ │   Storage    │ │ OpenAI API│ │Resend API │
│(Supabase Postgres│ │(Supabase S3) │ │(gpt-5.4)  │ │ (OTP Mail)│
└──────────────────┘ └──────────────┘ └───────────┘ └───────────┘
```

### Stack Components
- **Frontend App**: React 19 (TypeScript) + Vite (Port: `6001`).
- **Backend API**: Express 5 (TypeScript) + Node 20+ (Port: `7001`).
- **Database & Storage**: Supabase (PostgreSQL with `pgvector` enabled) + Supabase Storage Bucket.
- **External Integrations**:
  - **OpenAI**: `gpt-5.4-mini` for parsing images via Responses API; `text-embedding-3-small` for generating 1536-dimensional embeddings.
  - **Resend**: Transactional email delivery of OTP verification codes.

---

## 2. Directory Structure Conventions

Both apps strictly follow plain-name organization with type-based directories. No `index.ts` files are allowed to act as barrel exports.

### 2.1 Backend Project Directory (`/backend`)
```
/backend
├── dist/                          # Transpiled JS outputs (compiled via tsc)
├── src/
│   ├── apps/                      # Domain-driven modules
│   │   ├── auth/
│   │   │   ├── controllers/       # Route controllers (e.g., login.ts, signup.ts)
│   │   │   ├── dtos/              # Zod input validation schemas
│   │   │   ├── services/          # Business logic handlers
│   │   │   └── route.ts           # Domain-specific Express routes
│   │   ├── complaints/
│   │   │   ├── controllers/
│   │   │   ├── dtos/
│   │   │   ├── services/
│   │   │   └── route.ts
│   │   └── admin/
│   │       ├── controllers/
│   │       ├── services/
│   │       └── route.ts
│   ├── config/                    # Configuration loaders (single entry-point for process.env)
│   ├── constants/                 # Roles, enums, limits
│   ├── db/
│   │   ├── schema/                # Drizzle schemas
│   │   ├── migrations/            # Auto-generated SQL migrations
│   │   └── dal/                   # Data Access Layer helper functions
│   ├── utils/                     # Shared utilities (hash, date, jwt helper)
│   └── app.ts                     # Main entry-point
├── .env.example
├── .env
├── package.json
└── tsconfig.json
```

### 2.2 Frontend Project Directory (`/frontend`)
```
/frontend
├── src/
│   ├── APIs/                      # API request functions mapped to endpoints
│   ├── components/
│   │   ├── ui/                    # Reusable low-level UI elements (buttons, inputs)
│   │   └── form/                  # High-level form layouts
│   ├── constants/                 # Frontend configuration, roles, endpoints
│   ├── context/                   # Global state (AuthContext, ThemeContext)
│   ├── lib/
│   │   └── axios.ts               # Custom Axios instance with withCredentials: true
│   ├── pages/                     # Routed page components
│   ├── utils/                     # Utility helpers
│   ├── App.tsx                    # Root routing setup
│   ├── index.css                  # Tailwinds v4 global styles & CSS custom properties
│   └── main.tsx                   # Mounting script
├── .env.example
├── .env
├── package.json
└── vite.config.ts
```

---

## 3. Database Schema (Drizzle ORM)

Below is the conceptual representation of the relational schema.

### `users` Table
- `id`: `serial` primary key
- `name`: `varchar(255)`
- `email`: `varchar(255)` unique
- `password_hash`: `varchar(255)`
- `role`: `varchar(50)` (Values: `'USER'`, `'ADMIN'`)
- `verified`: `boolean` (Default: `false`)
- `upload_limit`: `integer` (Default: `5`)
- `search_limit`: `integer` (Default: `10`)
- `uploads_used`: `integer` (Default: `0`)
- `searches_used`: `integer` (Default: `0`)
- `created_at`: `timestamp` (Default: `now()`)
- `updated_at`: `timestamp` (Default: `now()`)

### `otps` Table
- `id`: `serial` primary key
- `user_id`: `integer` (Foreign key referencing `users.id` cascade delete)
- `otp_hash`: `varchar(255)`
- `purpose`: `varchar(50)` (Values: `'signup'`, `'reset'`)
- `expires_at`: `timestamp`
- `created_at`: `timestamp` (Default: `now()`)

### `complaints` Table
- `id`: `serial` primary key
- `user_id`: `integer` (Foreign key referencing `users.id` cascade delete)
- `title`: `varchar(12)` (Short action-phrase title)
- `complainant_name`: `varchar(255)`
- `complainant_contact`: `text`
- `incident_datetime`: `timestamp`
- `incident_place`: `varchar(255)`
- `accused_details`: `text`
- `description`: `text`
- `ipc_sections`: `text[]` (Array of selected IPC codes)
- `image_url`: `text`
- `created_at`: `timestamp` (Default: `now()`)
- `updated_at`: `timestamp` (Default: `now()`)

### `complaint_embeddings` Table
- `id`: `serial` primary key
- `complaint_id`: `integer` (Foreign key referencing `complaints.id` cascade delete)
- `embedding`: `vector(1536)` (Cosine distance index configured for semantic search)
- `created_at`: `timestamp` (Default: `now()`)

---

## 4. API Endpoints

All responses must adhere to the standardized payload structure:
```json
{
  "status": "success" | "fail",
  "message": "Human readable summary",
  "data": {},
  "error": {}
}
```

### 4.1 Auth Endpoints (`/api/auth`)
- **`POST /signup`**: Registers a user, generates a 6-digit OTP, sends it via Resend, creates an unverified account.
- **`POST /verify-otp`**: Verifies input OTP against hashed value in `otps` table. If valid and not expired, flips `verified` state to true.
- **`POST /resend-otp`**: Invalidates existing active OTPs for the user, generates a fresh OTP, and emails it.
- **`POST /login`**: Validates credentials. Sets HttpOnly, Secure, SameSite=None cookie named `authorization` containing JWT (1-day life, payload: `{ userId, role }`).
- **`POST /forgot-password`**: Generates a verification OTP with purpose `reset` and emails it.
- **`POST /reset-password`**: Takes OTP and new password, verifies the reset OTP, and updates user password.
- **`POST /logout`**: Clears the `authorization` cookie.
- **`GET /me`**: Returns details of the logged-in user derived from active JWT.

### 4.2 Complaints Endpoints (`/api/complaints`)
- **`POST /parse`**: Multipart upload of complaint image. Uploads file to Supabase Storage, passes base64 image data to `gpt-5.4-mini` via the OpenAI Responses API, returns parsed structured fields. *Increments `uploads_used` by 1 upon successful parsing.*
- **`POST /`**: Saves the finalized, human-corrected complaint to DB. Calls `text-embedding-3-small` to generate an embedding vector on `(description + IPC)`, saving the vector to `complaint_embeddings`.
- **`GET /`**: Retrieves complaints list. If requester is `USER`, returns only their own complaints. If `ADMIN`, returns all.
- **`GET /:id`**: Retrieves details of a specific complaint by ID (restricted to owner or admin).
- **`PATCH /:id`**: Allows editing complaint fields. Generates a fresh vector embedding and updates it in `complaint_embeddings`. (restricted to owner or admin).
- **`DELETE /:id`**: Deletes the complaint, its embedding, and references (restricted to owner or admin).
- **`GET /search?q=&ai=true|false`**:
  - `ai=false` (Default): Returns complaints where title or description ILIKE `%q%`.
  - `ai=true`: Generates an embedding of query `q`, queries DB using cosine similarity threshold, returns matches. *Increments `searches_used` by 1 upon successful semantic search.*

### 4.3 Admin Endpoints (`/api/admin`)
- **`GET /users?query=`**: Search for users by name or email.
- **`PATCH /users/:id/limits`**: Allows administrative override of limit counts. Body: `{ uploadLimit: number, searchLimit: number }`.

---

## 5. System Integrations & Integrations Code Spec

### 5.1 OpenAI Image Parsing Prompt Template
The image extraction relies on sending a base64 encoded URL payload alongside this prompt structure:
```ts
const systemPrompt = `You are an expert legal assistant. Analyze the provided image of a complaint letter.
Extract the details into the following JSON structure. If any field is missing or cannot be inferred, return null.

Fields:
1. complainantName: Full name of the complainant.
2. complainantContact: Phone, email, or address.
3. incidentDateTime: ISO timestamp or text description of incident time.
4. incidentPlace: Specific location or jurisdiction of the incident.
5. accusedDetails: Name or description of accused persons.
6. complaintDescription: A detailed summary of the events described.
7. ipcSections: Suggest list of Indian Penal Code section codes applicable, structured like ["IPC 379", "IPC 420"].
8. title: Generate an action-phrase summary of the crime strictly under 12 characters.

Response must be pure JSON only.`;
```

### 5.2 Embedding Vector Generation
For semantic search, the text embedding is generated on a combined string formatting:
`"Title: ${title} | Description: ${description} | IPC Sections: ${ipcSections.join(', ')}"`
Which is processed through the `text-embedding-3-small` OpenAI API.

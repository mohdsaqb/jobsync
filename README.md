# JobSync

Upload a resume and get back the jobs (from a preloaded set of job descriptions) that best match it, ranked by semantic similarity.

**How it works:**

1. You upload a resume (PDF, PNG, or JPG).
2. The backend extracts its text (PDF text layer, or OCR for images via Tesseract.js).
3. The text is embedded into a vector using a local embedding model (`@xenova/transformers`, runs on your machine — no API key needed).
4. That vector is compared against preloaded job description vectors in Milvus using cosine similarity, and the top matches are returned.
5. On the results screen, you can tell it what role you're targeting and Gemini will analyze your resume against that role and suggest specific improvements.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS — dark, glassmorphic UI with a draggable/collapsible sidebar
- **Backend:** Node.js + Express + TypeScript
- **Text extraction:** `pdf-parse` (PDFs) + `tesseract.js` (OCR for images)
- **Embeddings:** `@xenova/transformers` (local, `Xenova/all-MiniLM-L6-v2`, 384 dimensions)
- **Vector search:** Milvus (standalone, via Docker Compose), cosine similarity
- **AI resume suggestions:** Google Gemini (`@google/genai`, `gemini-flash-latest`) — the only part of this project that calls an external API, and it has a free tier

## Prerequisites

- Node.js 18+
- Docker Desktop (for running Milvus locally)

## 1. Start Milvus

If Docker Desktop isn't installed yet:

```bash
brew install --cask docker
```

Then **open Docker Desktop once manually** from Applications — it needs to walk through its first-run setup and you need to accept its license agreement. This can't be automated. Wait until the whale icon in the menu bar shows Docker is running (`docker info` succeeds).

From the project root, start Milvus and its dependencies (etcd, MinIO):

```bash
docker compose up -d
```

Give it 30–60 seconds to become healthy the first time. Check with:

```bash
docker ps
```

## 2. Set up and seed the backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed   # embeds and inserts the sample job descriptions into Milvus (one-time)
```

The repo ships with `backend/src/data/jobs.json` already populated with 1000 generated job descriptions across 50 roles — software/tech (frontend, backend, data science, DevOps, design, QA, security, product...), **core engineering** (mechanical, civil, electrical, chemical, industrial, aerospace, environmental, manufacturing), and **non-tech** (HR, sales, operations, logistics, nursing, teaching, paralegal, hospitality, accounting, retail, food service) — so `npm run seed` has a large, varied pool to match resumes against out of the box, regardless of the candidate's field.

**To enable AI resume suggestions**, add a Gemini API key to `backend/.env`:

```
GEMINI_API_KEY=...
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — Gemini's free tier is generous enough for this project. This is optional — everything else (matching, OCR, embeddings) works without it. Without a key, the "Improve your resume" section on the results screen will show a message telling you it isn't configured yet, instead of erroring.

To regenerate the job pool or start over:

```bash
npm run generate:jobs   # regenerates data/jobs.json with a fresh set of ~1000 jobs
npm run seed:reset      # drops the existing Milvus collection and re-seeds it
```

## 3. Run the backend

```bash
npm run dev
```

The API listens on `http://localhost:4000`. Health check: `GET /health`.

## 4. Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`, upload a resume, and see your matched jobs. The frontend proxies `/api/*` requests to the backend on port 4000 (configured in `frontend/next.config.mjs`), so both servers need to be running.

**UI tour:**

- The **sidebar** on the left is a real resizable panel — grab its right edge and drag to resize, or drag it past a threshold and let go to snap it into an icon-only rail. There's also a chevron button at the bottom to toggle collapse/expand instantly.
- Upload a resume (drag-and-drop or click to browse) and the view smoothly transitions into a **results screen** showing your top 10 matches, ranked by similarity score.
- Click **"Show 10 more"** to reveal the next batch (up to `TOP_K` total matches from the backend, default 50). Jobs scoring **10% or below** are filtered out server-side, so you'll never see irrelevant postings — if your resume doesn't have many strong matches, you may see fewer than 50.
- Click any **job card** to open its full posting in a modal — title, company, match tier, and the complete description, with the same Save/Apply actions.
- Each job card has a working **bookmark/save toggle** (persisted in `localStorage`). The **Apply** button is a demo affordance — the job postings are synthetic, so it shows a note rather than linking anywhere real.
- At the bottom of the results screen, the **"Improve your resume"** section asks what role you're targeting, then sends your resume text and that role to Gemini, which returns specific, actionable suggestions (missing keywords, weak bullet points, structural issues) tailored to that role — not generic resume advice.

## Notes / known limitations

- **Scanned PDFs** (image-only, no text layer) aren't OCR'd automatically — to keep the project simple, only PDFs with a real text layer are supported. If your resume is a scanned PDF, export/screenshot it as a PNG or JPG and upload that instead; it'll go through OCR.
- The sample job descriptions live in `backend/src/data/jobs.json` (generated by `npm run generate:jobs`, combining 50 role templates × seniority levels × companies). Edit `backend/src/scripts/generateJobs.ts` to add your own roles, or hand-edit `jobs.json` directly, then run `npm run seed:reset` to replace what's in Milvus.
- The AI suggestions endpoint (`POST /api/resume/suggest`) sends your resume text and target role to Gemini on each request — nothing is stored server-side. If `GEMINI_API_KEY` isn't set, it returns a clear error instead of crashing the server.
- The first request after starting the backend will be slower than usual — the local embedding model is downloaded and loaded lazily on first use.

## Project structure

```
backend/
  src/
    server.ts                    # Express app entry
    routes/resume.routes.ts      # POST /api/resume/analyze, /api/resume/suggest
    controllers/
      resume.controller.ts
      suggestions.controller.ts  # AI suggestions request handling
    services/
      textExtraction.service.ts  # PDF text / OCR extraction
      embedding.service.ts       # local embedding model
      milvus.service.ts          # Milvus collection + search
      aiSuggestions.service.ts   # Gemini API call
    scripts/
      generateJobs.ts            # generates data/jobs.json (50 role templates)
      seedJobs.ts                 # embeds + inserts jobs into Milvus
    data/jobs.json                # sample job descriptions
frontend/
  app/
    layout.tsx / page.tsx / globals.css
  components/
    Sidebar.tsx                  # draggable/collapsible nav
    UploadPanel.tsx               # drag-and-drop resume upload
    ResultsPanel.tsx              # paginated job match grid
    JobCard.tsx
    JobDetailModal.tsx             # full posting, opened by clicking a card
    ResumeSuggestions.tsx         # target-role input + AI suggestions
    BackgroundGlow.tsx            # decorative glass backdrop
  lib/
    api.ts                        # calls the backend
    types.ts
    scoreTier.ts                  # shared match-score styling
  next.config.mjs                 # proxies /api/* to the backend
docker-compose.yml               # Milvus standalone stack
```

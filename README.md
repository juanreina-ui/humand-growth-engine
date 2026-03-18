## Humand Growth Engine (Hackathon Prototype)

Internal admin dashboard that analyzes account behavior and surfaces growth / upsell opportunities for customer success teams.

### Setup

- **1) Configure Supabase (read-only)**

Copy `.env.example` to `.env.local` and fill:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Run

```bash
npm run dev
```

Open `http://localhost:3000` → you’ll land on `/accounts`.

### Notes

- Uses **read-only Supabase queries** against HubSpot-style CRM tables: `companies`, `contacts`, `deals`, `meetings`, `call_transcripts`, `owners`.
- The “AI” layer is intentionally lightweight for demo: it generates **score explanations**, **feature gaps**, **next-best-actions**, and **outreach copy** from computed signals + transcript summaries.

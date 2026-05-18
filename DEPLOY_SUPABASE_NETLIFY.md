# Deploy: Supabase-only + Netlify

## 1) Prerequisiti
- Repo connesso a GitHub (gia fatto).
- Supabase project attivo (`poqpxcgfslqlinxdnejq`).
- Netlify collegato al repo.
- Supabase CLI installata (`npm i -g supabase` oppure `npx supabase`).

## 2) Deploy schema e seed su Supabase
Esegui dalla root progetto:

```bash
supabase login
supabase link --project-ref poqpxcgfslqlinxdnejq
supabase db push
```

Questo applica:
- `supabase/migrations/20260518184500_init_torneo_schema.sql`
- `supabase/migrations/20260518185000_seed_default_tournament.sql`

## 3) Deploy Edge Function API

```bash
supabase functions deploy api --project-ref poqpxcgfslqlinxdnejq --no-verify-jwt
```

La function viene pubblicata su:
- `https://poqpxcgfslqlinxdnejq.supabase.co/functions/v1/api`

## 4) Configurazione chiavi su Supabase (function runtime)
Nella dashboard Supabase -> Settings -> Edge Functions / Secrets:

- `SUPABASE_URL=https://poqpxcgfslqlinxdnejq.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service_role_key>`

Oppure via CLI:

```bash
supabase secrets set SUPABASE_URL=https://poqpxcgfslqlinxdnejq.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## 5) Deploy frontend su Netlify
- Build command: vuoto (o usa quello definito in `netlify.toml`).
- Publish directory: `.`.
- Nessuna env var obbligatoria lato Netlify per questo setup.

Il frontend usa:
- locale: `http://localhost:3100/api`
- produzione: `https://poqpxcgfslqlinxdnejq.supabase.co/functions/v1/api`

## 6) Smoke test post deploy

1. Health/seed:
   - `GET /functions/v1/api/bootstrap`
2. Tornei:
   - `POST /functions/v1/api/tournaments`
   - `GET /functions/v1/api/tournaments`
3. Giocatori:
   - `POST /functions/v1/api/tournaments/:id/players`
   - `PATCH /functions/v1/api/tournament-players/:id/stats`
4. Tabellone:
   - `GET /functions/v1/api/tournaments/:id/bracket`
   - `PATCH /functions/v1/api/matches/:id`
5. Snapshot:
   - `POST /functions/v1/api/tournaments/:id/archive`
   - `GET /functions/v1/api/tournaments/:id/snapshots`

## 7) Note operative
- `SUPABASE_SERVICE_ROLE_KEY` resta solo nel runtime server (Edge Function), mai nel frontend.
- Le tabelle hanno RLS abilitata: accesso applicativo principale via service role nella function.

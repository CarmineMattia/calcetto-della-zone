# Calcetto della Zone

App web per gestire tornei di calcetto: giocatori, bilanciamento squadre, tabellone, statistiche e cronologia snapshot.

## Stack

- Frontend statico: `index.html` + `app.js` + `styles.css`
- API backend: Supabase Edge Function (`/functions/v1/api`)
- Database: Supabase Postgres
- Deploy frontend: Netlify

## Avvio locale (frontend + server legacy)

1. Avvia API locale (opzionale, per sviluppo legacy):

```bash
cd server
npm install
npm start
```

2. Avvia frontend statico (es. con Live Server / static server).

In locale l'app usa automaticamente:

- `http://localhost:3100/api`

In produzione usa automaticamente:

- `https://poqpxcgfslqlinxdnejq.supabase.co/functions/v1/api`

## Setup Supabase

Le migration e la function sono in:

- `supabase/migrations/`
- `supabase/functions/api/index.ts`

Comandi principali:

```bash
npx supabase link --project-ref poqpxcgfslqlinxdnejq
npx supabase db push
npx supabase functions deploy api --project-ref poqpxcgfslqlinxdnejq --no-verify-jwt
```

Secrets richiesti per la function:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy Netlify

- Build command: vuoto (oppure `echo "no build"`)
- Publish directory: `.`
- Config base già presente in `netlify.toml`

## Note importanti

- `SUPABASE_SERVICE_ROLE_KEY` deve restare solo lato server/function.
- Se vuoi separare test e produzione, usa due progetti Supabase diversi.

const express = require('express');
const cors = require('cors');
const {
  initDb,
  ensureSeedTournament,
  db,
  createBracketIfMissing,
} = require('./db');
const tournamentRoutes = require('./routes/tournaments');
const playerRoutes = require('./routes/players');
const statsRoutes = require('./routes/stats');
const bracketRoutes = require('./routes/bracket');

initDb();
ensureSeedTournament();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/tournaments', tournamentRoutes);
app.use('/api', playerRoutes);
app.use('/api', statsRoutes);
app.use('/api', bracketRoutes);

app.get('/api/bootstrap', (_req, res) => {
  const tournaments = db.prepare(`
    SELECT id, name, created_at AS createdAt, team_count AS teamCount
    FROM tournaments
    ORDER BY datetime(created_at) DESC
  `).all();
  const current = tournaments[0] || null;
  if (current) createBracketIfMissing(current.id, current.teamCount);
  res.json({ tournaments, currentId: current?.id || null });
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Torneo API listening on http://localhost:${PORT}`);
});

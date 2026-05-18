const express = require('express');
const { db, nowIso } = require('../db');

const router = express.Router();

function clampMinZero(n) {
  return Math.max(0, n);
}

router.patch('/tournament-players/:id/stats', (req, res) => {
  const playerId = req.params.id;
  const exists = db.prepare('SELECT id FROM tournament_players WHERE id = ?').get(playerId);
  if (!exists) return res.status(404).json({ error: 'Player not found' });

  const goalsDelta = Number(req.body?.goalsDelta) || 0;
  const assistsDelta = Number(req.body?.assistsDelta) || 0;
  const current = db.prepare(`
    SELECT goals, assists FROM player_stats WHERE tournament_player_id = ?
  `).get(playerId) || { goals: 0, assists: 0 };
  const nextGoals = clampMinZero(current.goals + goalsDelta);
  const nextAssists = clampMinZero(current.assists + assistsDelta);

  db.prepare(`
    INSERT INTO player_stats (tournament_player_id, goals, assists, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tournament_player_id)
    DO UPDATE SET goals = excluded.goals, assists = excluded.assists, updated_at = excluded.updated_at
  `).run(playerId, nextGoals, nextAssists, nowIso());

  res.json({ stats: { goals: nextGoals, assists: nextAssists } });
});

module.exports = router;

const express = require('express');
const {
  db,
  uid,
  nowIso,
  defaultTournamentName,
  createBracketIfMissing,
  listTournamentPlayers,
  safeJsonParse,
} = require('../db');

const router = express.Router();
const PLAYERS_PER_TEAM = 5;
const STAGE_ORDER_SQL = `
  CASE stage
    WHEN 'semi' THEN 1
    WHEN 'third_place' THEN 2
    WHEN 'final' THEN 3
    ELSE 9
  END
`;

function getTournamentById(id) {
  return db.prepare(`
    SELECT id, name, created_at AS createdAt, team_count AS teamCount
    FROM tournaments
    WHERE id = ?
  `).get(id);
}

function sanitizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function reconcileLineup(lineup, playersById, side) {
  const defaults = side === 'b'
    ? [{ x: 90, y: 50 }, { x: 74, y: 28 }, { x: 74, y: 72 }, { x: 58, y: 38 }, { x: 58, y: 62 }]
    : [{ x: 10, y: 50 }, { x: 26, y: 28 }, { x: 26, y: 72 }, { x: 42, y: 38 }, { x: 42, y: 62 }];
  const source = Array.isArray(lineup) ? lineup.slice(0, PLAYERS_PER_TEAM) : [];
  const out = source.map((entry, idx) => {
    const fallback = defaults[idx];
    const id = entry?.id ? String(entry.id) : `missing-${side}-${idx + 1}`;
    const xRaw = Number(entry?.x);
    const yRaw = Number(entry?.y);
    const x = Number.isFinite(xRaw) ? Math.min(96, Math.max(4, xRaw)) : fallback.x;
    const y = Number.isFinite(yRaw) ? Math.min(92, Math.max(8, yRaw)) : fallback.y;
    const player = playersById.get(id) || null;
    if (!player) {
      return {
        id: `missing-${side}-${idx + 1}`,
        name: 'Mancante',
        role: '—',
        tec: 0,
        fis: 0,
        placeholder: true,
        x,
        y,
      };
    }
    return {
      id,
      name: sanitizeName(player.name) || 'Senza nome',
      role: player.role ? String(player.role) : '—',
      tec: Number(player.tec) || 0,
      fis: Number(player.fis) || 0,
      placeholder: false,
      x,
      y,
    };
  });
  while (out.length < PLAYERS_PER_TEAM) {
    const idx = out.length;
    const fallback = defaults[idx];
    out.push({ id: `missing-${side}-${idx + 1}`, name: 'Mancante', role: '—', tec: 0, fis: 0, placeholder: true, x: fallback.x, y: fallback.y });
  }
  return out;
}

function listOrderedMatches(tournamentId, playersById) {
  return db.prepare(`
    SELECT
      id,
      stage,
      slot,
      team_a AS teamA,
      team_b AS teamB,
      score_a AS scoreA,
      score_b AS scoreB,
      winner,
      status,
      lineup_a_json AS lineupAJson,
      lineup_b_json AS lineupBJson
    FROM matches
    WHERE tournament_id = ?
    ORDER BY
      ${STAGE_ORDER_SQL},
      slot ASC
  `).all(tournamentId).map((match) => {
    const lineupA = safeJsonParse(match.lineupAJson, []);
    const lineupB = safeJsonParse(match.lineupBJson, []);
    return {
      ...match,
      status: match.status || 'scheduled',
      lineupA: reconcileLineup(lineupA, playersById, 'a'),
      lineupB: reconcileLineup(lineupB, playersById, 'b'),
    };
  });
}

function buildTournamentPayload(tournamentId) {
  const tournament = getTournamentById(tournamentId);
  if (!tournament) return null;
  createBracketIfMissing(tournament.id, tournament.teamCount);
  const players = listTournamentPlayers(tournament.id);
  const playersById = new Map(players.map((player) => [String(player.id), player]));
  const matches = listOrderedMatches(tournament.id, playersById);
  return { ...tournament, players, matches };
}

function buildPodium(matches = []) {
  const finalMatch = matches.find((match) => match.stage === 'final') || null;
  const thirdPlaceMatch = matches.find((match) => match.stage === 'third_place') || null;
  const first = finalMatch?.winner || null;
  const second = finalMatch
    ? [finalMatch.teamA, finalMatch.teamB].find((team) => team && team !== first) || null
    : null;
  const third = thirdPlaceMatch?.winner || null;
  const fourth = thirdPlaceMatch
    ? [thirdPlaceMatch.teamA, thirdPlaceMatch.teamB].find((team) => team && team !== third) || null
    : null;
  return {
    first,
    second,
    third,
    fourth,
    finalMatchId: finalMatch?.id || null,
  };
}

router.get('/', (_req, res) => {
  const tournaments = db.prepare(`
    SELECT id, name, created_at AS createdAt, team_count AS teamCount
    FROM tournaments
    ORDER BY datetime(created_at) DESC
  `).all();
  res.json({ tournaments });
});

router.get('/:id', (req, res) => {
  const tournament = buildTournamentPayload(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ tournament });
});

router.post('/:id/archive', (req, res) => {
  const tournament = buildTournamentPayload(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const finalMatch = tournament.matches.find((match) => match.stage === 'final');
  if (!finalMatch || finalMatch.status !== 'completed' || !finalMatch.winner) {
    return res.status(400).json({
      error: 'Completa la finale 1°/2° posto prima di archiviare il torneo',
    });
  }

  const podium = buildPodium(tournament.matches);
  const latestVersion = db.prepare(`
    SELECT MAX(version) AS latestVersion
    FROM tournament_snapshots
    WHERE tournament_id = ?
  `).get(tournament.id);
  const version = Number(latestVersion?.latestVersion || 0) + 1;
  const createdAt = nowIso();
  const snapshotId = uid();
  const payload = {
    snapshot: {
      id: snapshotId,
      tournamentId: tournament.id,
      version,
      createdAt,
      podium,
    },
    tournament,
  };

  db.prepare(`
    INSERT INTO tournament_snapshots (
      id,
      tournament_id,
      version,
      created_at,
      payload_json,
      final_match_id,
      winner_team,
      runner_up_team
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    snapshotId,
    tournament.id,
    version,
    createdAt,
    JSON.stringify(payload),
    podium.finalMatchId,
    podium.first,
    podium.second,
  );

  return res.status(201).json({
    snapshot: {
      id: snapshotId,
      tournamentId: tournament.id,
      version,
      createdAt,
      winnerTeam: podium.first,
      runnerUpTeam: podium.second,
    },
  });
});

router.get('/:id/snapshots', (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  const snapshots = db.prepare(`
    SELECT
      id,
      tournament_id AS tournamentId,
      version,
      created_at AS createdAt,
      winner_team AS winnerTeam,
      runner_up_team AS runnerUpTeam
    FROM tournament_snapshots
    WHERE tournament_id = ?
    ORDER BY version DESC
  `).all(tournament.id);
  return res.json({ snapshots });
});

router.get('/:id/snapshots/:version', (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  const version = Number.parseInt(req.params.version, 10);
  if (!Number.isInteger(version) || version <= 0) {
    return res.status(400).json({ error: 'Invalid snapshot version' });
  }
  const row = db.prepare(`
    SELECT
      id,
      tournament_id AS tournamentId,
      version,
      created_at AS createdAt,
      winner_team AS winnerTeam,
      runner_up_team AS runnerUpTeam,
      payload_json AS payloadJson
    FROM tournament_snapshots
    WHERE tournament_id = ? AND version = ?
  `).get(tournament.id, version);
  if (!row) return res.status(404).json({ error: 'Snapshot not found' });
  const payload = safeJsonParse(row.payloadJson, null);
  if (!payload) return res.status(500).json({ error: 'Snapshot payload is corrupted' });
  return res.json({
    snapshot: {
      id: row.id,
      tournamentId: row.tournamentId,
      version: row.version,
      createdAt: row.createdAt,
      winnerTeam: row.winnerTeam,
      runnerUpTeam: row.runnerUpTeam,
    },
    payload,
  });
});

router.post('/', (req, res) => {
  const id = uid();
  const teamCount = Number(req.body?.teamCount) === 2 ? 2 : 4;
  const name = String(req.body?.name || '').trim() || defaultTournamentName(new Date());
  const createdAt = nowIso();
  db.prepare(`
    INSERT INTO tournaments (id, name, created_at, team_count)
    VALUES (?, ?, ?, ?)
  `).run(id, name, createdAt, teamCount);
  createBracketIfMissing(id, teamCount);
  res.status(201).json({
    tournament: { id, name, createdAt, teamCount, players: [], matches: [] },
  });
});

router.patch('/:id', (req, res) => {
  const current = getTournamentById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Tournament not found' });
  const nextName = typeof req.body?.name === 'string' ? req.body.name.trim() : current.name;
  const requestedTeamCount = Number(req.body?.teamCount);
  const nextTeamCount = requestedTeamCount === 2 || requestedTeamCount === 4
    ? requestedTeamCount
    : Number(current.teamCount) || 4;
  db.prepare('UPDATE tournaments SET name = ?, team_count = ? WHERE id = ?')
    .run(nextName || current.name, nextTeamCount, current.id);
  createBracketIfMissing(current.id, nextTeamCount);
  res.json({ tournament: getTournamentById(current.id) });
});

router.delete('/:id', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM tournaments').get().count;
  if (count <= 1) return res.status(400).json({ error: 'Cannot delete last tournament' });
  const result = db.prepare('DELETE FROM tournaments WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ ok: true });
});

module.exports = router;

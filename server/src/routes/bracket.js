const express = require('express');
const {
  db,
  uid,
  nowIso,
  createBracketIfMissing,
  listTournamentPlayers,
  safeJsonParse,
} = require('../db');

const router = express.Router();
const PLAYERS_PER_TEAM = 5;
const ROLES = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
const LEFT_POSITIONS = [
  { x: 10, y: 50 },
  { x: 26, y: 28 },
  { x: 26, y: 72 },
  { x: 42, y: 38 },
  { x: 42, y: 62 },
];
const RIGHT_POSITIONS = [
  { x: 90, y: 50 },
  { x: 74, y: 28 },
  { x: 74, y: 72 },
  { x: 58, y: 38 },
  { x: 58, y: 62 },
];

function orderedMatches(tournamentId) {
  const playersById = new Map(
    listTournamentPlayers(tournamentId).map((player) => [String(player.id), player]),
  );
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
      CASE stage
        WHEN 'semi' THEN 1
        WHEN 'third_place' THEN 2
        WHEN 'final' THEN 3
        ELSE 9
      END,
      slot ASC
  `).all(tournamentId).map((match) => ({
    ...match,
    status: match.status || 'scheduled',
    lineupA: parseLineupJson(match.lineupAJson, playersById, 'a'),
    lineupB: parseLineupJson(match.lineupBJson, playersById, 'b'),
  }));
}

function parseLineupJson(value, playersById = new Map(), side = 'a') {
  const parsed = safeJsonParse(value, null);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((entry, idx) => normalizeLineupEntry(entry, idx, playersById, side));
}

function normalizeLineupEntry(entry, idx, playersById = new Map(), side = 'a') {
  const defaults = side === 'b' ? RIGHT_POSITIONS : LEFT_POSITIONS;
  const fallback = defaults[idx] || defaults[0];
  const id = entry?.id ? String(entry.id) : `lineup-${idx + 1}`;
  const sourcePlayer = playersById.get(id) || null;
  const name = sanitizeName(entry?.name);
  const xRaw = Number(entry?.x);
  const yRaw = Number(entry?.y);
  const x = Number.isFinite(xRaw) ? Math.min(96, Math.max(4, xRaw)) : null;
  const y = Number.isFinite(yRaw) ? Math.min(92, Math.max(8, yRaw)) : null;
  if (!sourcePlayer && !!entry?.id) {
    return {
      id: `missing-sync-${idx + 1}`,
      name: 'Mancante',
      role: '—',
      tec: 0,
      fis: 0,
      placeholder: true,
      x: fallback.x,
      y: fallback.y,
    };
  }
  if (sourcePlayer) {
    return {
      id,
      name: sanitizeName(sourcePlayer.name) || 'Senza nome',
      role: sourcePlayer.role ? String(sourcePlayer.role) : '—',
      tec: Number(sourcePlayer.tec) || 0,
      fis: Number(sourcePlayer.fis) || 0,
      placeholder: false,
      x,
      y,
    };
  }
  return {
    id,
    name: name || 'Senza nome',
    role: entry?.role ? String(entry.role) : '—',
    tec: Number(entry?.tec) || 0,
    fis: Number(entry?.fis) || 0,
    placeholder: Boolean(entry?.placeholder),
    x,
    y,
  };
}

function normalizeLineupInput(entries) {
  if (!Array.isArray(entries)) return null;
  return entries.slice(0, PLAYERS_PER_TEAM).map((entry, idx) => {
    const xRaw = Number(entry?.x);
    const yRaw = Number(entry?.y);
    const x = Number.isFinite(xRaw) ? Math.min(96, Math.max(4, xRaw)) : null;
    const y = Number.isFinite(yRaw) ? Math.min(92, Math.max(8, yRaw)) : null;
    return {
      id: entry?.id ? String(entry.id) : `lineup-${idx + 1}`,
      name: sanitizeName(entry?.name) || 'Senza nome',
      role: entry?.role ? String(entry.role) : '—',
      tec: Number(entry?.tec) || 0,
      fis: Number(entry?.fis) || 0,
      placeholder: Boolean(entry?.placeholder),
      x,
      y,
    };
  });
}

function placeholderLineup(teamLabel = '') {
  const label = teamLabel && String(teamLabel).trim() ? String(teamLabel).trim() : 'Mancante';
  return Array.from({ length: PLAYERS_PER_TEAM }, (_, idx) => ({
    id: `missing-${label}-${idx + 1}`.toLowerCase().replace(/\s+/g, '-'),
    name: 'Mancante',
    role: '—',
    tec: 0,
    fis: 0,
    placeholder: true,
  }));
}

function sanitizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function getPrimaryRole(player) {
  if (Array.isArray(player?.roles) && player.roles.length) return player.roles[0];
  if (player?.role) return player.role;
  return null;
}

function averagePower(players) {
  if (!players.length) return 0;
  return players.reduce((sum, p) => sum + (Number(p.tec) || 0) + (Number(p.fis) || 0), 0) / players.length;
}

function buildBalancedTeams(players, labels) {
  const teams = labels.map((label, index) => ({ label, index, players: [] }));
  const normalizedPlayers = players.map((player, idx) => ({
    id: String(player.id || `p-${idx + 1}`),
    name: sanitizeName(player.name) || 'Senza nome',
    role: getPrimaryRole(player),
    tec: Number(player.tec) || 0,
    fis: Number(player.fis) || 0,
    placeholder: false,
  }));
  const assigned = new Set();
  const roleGroups = ROLES
    .map((role) => ({
      role,
      count: normalizedPlayers.filter((player) => player.role === role).length,
    }))
    .sort((a, b) => a.count - b.count);
  const pickTargetTeam = () => teams
    .filter((team) => team.players.length < PLAYERS_PER_TEAM)
    .sort((a, b) => (averagePower(a.players) - averagePower(b.players)) || (a.players.length - b.players.length))[0];

  roleGroups.forEach(({ role }) => {
    normalizedPlayers
      .filter((player) => player.role === role && !assigned.has(player.id))
      .sort((a, b) => ((b.tec + b.fis) - (a.tec + a.fis)))
      .forEach((player) => {
        const target = pickTargetTeam();
        if (!target) return;
        target.players.push(player);
        assigned.add(player.id);
      });
  });

  normalizedPlayers
    .filter((player) => !assigned.has(player.id))
    .sort((a, b) => ((b.tec + b.fis) - (a.tec + a.fis)))
    .forEach((player) => {
      const target = pickTargetTeam();
      if (!target) return;
      target.players.push(player);
      assigned.add(player.id);
    });

  teams.forEach((team) => {
    while (team.players.length < PLAYERS_PER_TEAM) {
      team.players.push({
        id: `missing-${team.label}-${team.players.length + 1}`.toLowerCase(),
        name: 'Mancante',
        role: '—',
        tec: 0,
        fis: 0,
        placeholder: true,
      });
    }
  });
  return teams;
}

router.get('/tournaments/:id/bracket', (req, res) => {
  const tournament = db.prepare('SELECT id, team_count AS teamCount FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  createBracketIfMissing(tournament.id, tournament.teamCount);
  res.json({ matches: orderedMatches(tournament.id) });
});

router.patch('/matches/:id', (req, res) => {
  const existing = db.prepare(`
    SELECT
      id,
      tournament_id AS tournamentId,
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
    WHERE id = ?
  `).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Match not found' });

  const hasTeamA = Object.prototype.hasOwnProperty.call(req.body || {}, 'teamA');
  const hasTeamB = Object.prototype.hasOwnProperty.call(req.body || {}, 'teamB');
  const hasScoreA = Object.prototype.hasOwnProperty.call(req.body || {}, 'scoreA');
  const hasScoreB = Object.prototype.hasOwnProperty.call(req.body || {}, 'scoreB');
  const hasWinner = Object.prototype.hasOwnProperty.call(req.body || {}, 'winner');
  const hasStatus = Object.prototype.hasOwnProperty.call(req.body || {}, 'status');
  const hasLineupA = Object.prototype.hasOwnProperty.call(req.body || {}, 'lineupA');
  const hasLineupB = Object.prototype.hasOwnProperty.call(req.body || {}, 'lineupB');

  const teamA = hasTeamA ? (sanitizeName(req.body.teamA) || existing.teamA || 'Squadra A') : (existing.teamA || 'Squadra A');
  const teamB = hasTeamB ? (sanitizeName(req.body.teamB) || existing.teamB || 'Squadra B') : (existing.teamB || 'Squadra B');
  const scoreA = hasScoreA ? Math.max(0, Number(req.body.scoreA) || 0) : (Number(existing.scoreA) || 0);
  const scoreB = hasScoreB ? Math.max(0, Number(req.body.scoreB) || 0) : (Number(existing.scoreB) || 0);
  let winner = hasWinner
    ? (req.body.winner == null ? null : sanitizeName(req.body.winner))
    : (existing.winner || null);
  let status = hasStatus
    ? (String(req.body.status) === 'completed' ? 'completed' : 'scheduled')
    : (existing.status || 'scheduled');

  let lineupAJson = existing.lineupAJson;
  let lineupBJson = existing.lineupBJson;
  if (hasLineupA) {
    const lineup = normalizeLineupInput(req.body.lineupA);
    lineupAJson = lineup ? JSON.stringify(lineup) : null;
  } else if (hasTeamA) {
    lineupAJson = null;
  }
  if (hasLineupB) {
    const lineup = normalizeLineupInput(req.body.lineupB);
    lineupBJson = lineup ? JSON.stringify(lineup) : null;
  } else if (hasTeamB) {
    lineupBJson = null;
  }

  if (winner && winner !== teamA && winner !== teamB) winner = null;
  const scoreChanged = hasScoreA || hasScoreB;
  if (!hasWinner && scoreChanged) {
    winner = scoreA === scoreB ? null : (scoreA > scoreB ? teamA : teamB);
  }
  if (status === 'completed' && !winner && scoreA !== scoreB) {
    winner = scoreA > scoreB ? teamA : teamB;
  }
  if (!hasStatus) {
    if (scoreChanged || winner) status = 'completed';
    else if (hasWinner && !winner) status = 'scheduled';
  }

  db.prepare(`
    UPDATE matches
    SET
      team_a = ?,
      team_b = ?,
      score_a = ?,
      score_b = ?,
      winner = ?,
      status = ?,
      lineup_a_json = ?,
      lineup_b_json = ?,
      updated_at = ?
    WHERE id = ?
  `).run(teamA, teamB, scoreA, scoreB, winner, status, lineupAJson, lineupBJson, nowIso(), existing.id);

  const setMatchSlot = (matchId, side, slotTeam, slotLineupJson) => {
    if (side === 'A') {
      db.prepare(`
        UPDATE matches
        SET team_a = ?, lineup_a_json = ?, winner = NULL, status = 'scheduled', score_a = 0, score_b = 0, updated_at = ?
        WHERE id = ?
      `).run(slotTeam, slotLineupJson, nowIso(), matchId);
      return;
    }
    db.prepare(`
      UPDATE matches
      SET team_b = ?, lineup_b_json = ?, winner = NULL, status = 'scheduled', score_a = 0, score_b = 0, updated_at = ?
      WHERE id = ?
    `).run(slotTeam, slotLineupJson, nowIso(), matchId);
  };

  // Propagate semifinals to finals slots when winner is chosen.
  if (existing.stage === 'semi') {
    const final = db.prepare(`
      SELECT id FROM matches
      WHERE tournament_id = ? AND stage = 'final' LIMIT 1
    `).get(existing.tournamentId);
    const third = db.prepare(`
      SELECT id FROM matches
      WHERE tournament_id = ? AND stage = 'third_place' LIMIT 1
    `).get(existing.tournamentId);
    const thisMatch = db.prepare(`
      SELECT team_a AS teamA, team_b AS teamB, winner, lineup_a_json AS lineupAJson, lineup_b_json AS lineupBJson
      FROM matches
      WHERE id = ?
    `).get(existing.id);
    const winnerTeam = thisMatch.winner;
    const winnerLineup = thisMatch.teamA === winnerTeam ? thisMatch.lineupAJson : thisMatch.lineupBJson;
    const loserTeam = thisMatch.teamA === winnerTeam ? thisMatch.teamB : thisMatch.teamA;
    const loserLineup = thisMatch.teamA === winnerTeam ? thisMatch.lineupBJson : thisMatch.lineupAJson;

    if (winnerTeam) {
      if (final) setMatchSlot(final.id, existing.slot === 1 ? 'A' : 'B', winnerTeam, winnerLineup);
      if (third) setMatchSlot(third.id, existing.slot === 1 ? 'A' : 'B', loserTeam, loserLineup);
    } else {
      if (final) setMatchSlot(final.id, existing.slot === 1 ? 'A' : 'B', existing.slot === 1 ? 'Vincente SF1' : 'Vincente SF2', null);
      if (third) setMatchSlot(third.id, existing.slot === 1 ? 'A' : 'B', existing.slot === 1 ? 'Perdente SF1' : 'Perdente SF2', null);
    }
  }

  res.json({ matches: orderedMatches(existing.tournamentId) });
});

router.post('/tournaments/:id/bracket/reset', (req, res) => {
  const tournament = db.prepare('SELECT id, team_count AS teamCount FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  db.prepare('DELETE FROM matches WHERE tournament_id = ?').run(tournament.id);
  createBracketIfMissing(tournament.id, tournament.teamCount);
  res.json({ matches: orderedMatches(tournament.id) });
});

router.post('/tournaments/:id/bracket/from-teams', (req, res) => {
  const tournament = db.prepare('SELECT id, team_count AS teamCount FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  const letters = Array.isArray(req.body?.letters) ? req.body.letters.map(String) : [];
  db.prepare('DELETE FROM matches WHERE tournament_id = ?').run(tournament.id);
  const now = nowIso();
  const insert = db.prepare(`
    INSERT INTO matches (id, tournament_id, stage, slot, team_a, team_b, score_a, score_b, winner, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?)
  `);
  if (tournament.teamCount === 2) {
    insert.run(uid(), tournament.id, 'final', 1, letters[0] || 'Squadra A', letters[1] || 'Squadra B', now, now);
  } else {
    insert.run(uid(), tournament.id, 'semi', 1, letters[0] || 'Squadra A', letters[1] || 'Squadra B', now, now);
    insert.run(uid(), tournament.id, 'semi', 2, letters[2] || 'Squadra C', letters[3] || 'Squadra D', now, now);
    insert.run(uid(), tournament.id, 'third_place', 1, 'Perdente SF1', 'Perdente SF2', now, now);
    insert.run(uid(), tournament.id, 'final', 1, 'Vincente SF1', 'Vincente SF2', now, now);
  }
  res.json({ matches: orderedMatches(tournament.id) });
});

router.post('/tournaments/:id/bracket/auto-lineups', (req, res) => {
  const tournament = db.prepare('SELECT id, team_count AS teamCount FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  createBracketIfMissing(tournament.id, tournament.teamCount);

  const matches = orderedMatches(tournament.id);
  const players = listTournamentPlayers(tournament.id);
  const labels = [];
  if (tournament.teamCount === 2) {
    const final = matches.find((match) => match.stage === 'final');
    labels.push(final?.teamA || 'Squadra A', final?.teamB || 'Squadra B');
  } else {
    const semi1 = matches.find((match) => match.stage === 'semi' && match.slot === 1);
    const semi2 = matches.find((match) => match.stage === 'semi' && match.slot === 2);
    labels.push(
      semi1?.teamA || 'Squadra A',
      semi1?.teamB || 'Squadra B',
      semi2?.teamA || 'Squadra C',
      semi2?.teamB || 'Squadra D',
    );
  }
  const requiredPlayers = labels.length * PLAYERS_PER_TEAM;
  const currentPlayers = players.length;
  if (currentPlayers < requiredPlayers) {
    const missingPlayers = requiredPlayers - currentPlayers;
    return res.status(400).json({
      error: `Mancano ${missingPlayers} giocatori per calcolare le formazioni automatiche`,
      code: 'INSUFFICIENT_PLAYERS',
      missingPlayers,
      requiredPlayers,
      currentPlayers,
    });
  }
  const teams = buildBalancedTeams(players, labels);
  const map = new Map(teams.map((team) => [team.label, JSON.stringify(team.players)]));

  const update = db.prepare(`
    UPDATE matches
    SET
      lineup_a_json = ?,
      lineup_b_json = ?,
      updated_at = ?
    WHERE id = ?
  `);
  matches.forEach((match) => {
    const lineupAJson = map.get(match.teamA) || JSON.stringify(placeholderLineup(match.teamA));
    const lineupBJson = map.get(match.teamB) || JSON.stringify(placeholderLineup(match.teamB));
    update.run(lineupAJson, lineupBJson, nowIso(), match.id);
  });

  res.json({ matches: orderedMatches(tournament.id) });
});

module.exports = router;

const express = require('express');
const {
  db,
  uid,
  nowIso,
  safeJsonParse,
  normalizeScore,
  normalizeTechDetails,
} = require('../db');

const router = express.Router();

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeName(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

router.get('/players/duplicates', (req, res) => {
  const name = String(req.query.name || '').trim();
  if (!name) return res.json({ duplicates: [] });
  const target = normalizeName(name);
  if (!target) return res.json({ duplicates: [] });
  const excludeTournamentId = String(req.query.excludeTournamentId || '').trim();
  const rows = db.prepare(`
    SELECT
      pp.id AS profileId,
      pp.display_name AS profileName,
      t.id AS tournamentId,
      t.name AS tournamentName,
      t.created_at AS tournamentCreatedAt
    FROM player_profiles pp
    JOIN tournament_players tp ON tp.profile_id = pp.id
    JOIN tournaments t ON t.id = tp.tournament_id
    WHERE (? = '' OR t.id != ?)
    ORDER BY datetime(t.created_at) DESC
  `).all(excludeTournamentId, excludeTournamentId);
  const matches = rows.filter((row) => normalizeName(row.profileName) === target);
  const unique = new Map();
  matches.forEach((row) => {
    const key = `${row.profileId}:${row.tournamentId}`;
    if (!unique.has(key)) unique.set(key, row);
  });
  res.json({ duplicates: Array.from(unique.values()) });
});

router.post('/tournaments/:id/players', (req, res) => {
  const tournamentId = req.params.id;
  const tournament = db.prepare('SELECT id FROM tournaments WHERE id = ?').get(tournamentId);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const rawName = String(req.body?.name || '').trim();
  if (!rawName) return res.status(400).json({ error: 'Name is required' });

  const duplicateStrategy = req.body?.duplicateStrategy === 'reuse' ? 'reuse' : 'new';
  const profileIdFromBody = String(req.body?.profileId || '').trim();
  const age = req.body?.age == null || req.body?.age === '' ? null : clamp(Number(req.body.age) || 0, 5, 99);
  const tec = normalizeScore(req.body?.tec);
  const fis = normalizeScore(req.body?.fis);
  const roles = Array.isArray(req.body?.roles) ? req.body.roles.filter(Boolean) : [];
  const rolePrimary = roles[0] || null;
  const nationality = req.body?.flag ? String(req.body.flag).slice(0, 8) : null;
  const techDetails = req.body?.techDetails && typeof req.body.techDetails === 'object'
    ? normalizeTechDetails(req.body.techDetails)
    : null;

  let profileId = null;
  if (duplicateStrategy === 'reuse' && profileIdFromBody) {
    const profile = db.prepare('SELECT id FROM player_profiles WHERE id = ?').get(profileIdFromBody);
    if (profile) profileId = profile.id;
  }
  if (!profileId) {
    const target = normalizeName(rawName);
    const maybeExisting = db.prepare(`
      SELECT id, display_name AS displayName
      FROM player_profiles
      ORDER BY datetime(created_at) DESC
    `).all().find((row) => normalizeName(row.displayName) === target);
    if (duplicateStrategy === 'reuse' && maybeExisting) {
      profileId = maybeExisting.id;
    }
  }
  if (!profileId) {
    profileId = uid();
    db.prepare(`
      INSERT INTO player_profiles (
        id, display_name, nationality, age, tec, fis, tech_details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      profileId,
      rawName,
      nationality,
      age,
      tec,
      fis,
      techDetails ? JSON.stringify(techDetails) : null,
      nowIso()
    );
  }

  const tournamentPlayerId = uid();
  db.prepare(`
    INSERT INTO tournament_players (
      id, tournament_id, profile_id, display_name_snapshot, role_primary, roles_json, tec, fis, age, nationality, tech_details_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tournamentPlayerId,
    tournamentId,
    profileId,
    rawName,
    rolePrimary,
    JSON.stringify(roles),
    tec,
    fis,
    age,
    nationality,
    techDetails ? JSON.stringify(techDetails) : null,
    nowIso()
  );
  db.prepare(`
    INSERT INTO player_stats (tournament_player_id, goals, assists, updated_at)
    VALUES (?, 0, 0, ?)
  `).run(tournamentPlayerId, nowIso());

  const created = db.prepare(`
    SELECT
      tp.id,
      tp.profile_id AS profileId,
      tp.display_name_snapshot AS name,
      tp.nationality AS flag,
      tp.role_primary AS role,
      tp.roles_json AS roles,
      tp.tec,
      tp.fis,
      tp.age,
      tp.tech_details_json AS techDetails,
      ps.goals,
      ps.assists
    FROM tournament_players tp
    JOIN player_stats ps ON ps.tournament_player_id = tp.id
    WHERE tp.id = ?
  `).get(tournamentPlayerId);

  res.status(201).json({
    player: {
      ...created,
      tec: normalizeScore(created.tec),
      fis: normalizeScore(created.fis),
      roles: safeJsonParse(created.roles, []),
      techDetails: normalizeTechDetails(safeJsonParse(created.techDetails, null)),
    },
  });
});

router.patch('/tournament-players/:id', (req, res) => {
  const current = db.prepare(`
    SELECT id FROM tournament_players WHERE id = ?
  `).get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Player not found' });

  const name = req.body?.name ? String(req.body.name).trim() : null;
  const roles = Array.isArray(req.body?.roles) ? req.body.roles.filter(Boolean) : null;
  const rolePrimary = roles ? roles[0] || null : null;
  const age = req.body?.age == null || req.body?.age === '' ? null : clamp(Number(req.body.age) || 0, 5, 99);
  const tec = req.body?.tec == null ? null : normalizeScore(req.body.tec);
  const fis = req.body?.fis == null ? null : normalizeScore(req.body.fis);
  const nationality = req.body?.flag == null ? null : String(req.body.flag).slice(0, 8);
  const techDetails = req.body?.techDetails === null
    ? null
    : req.body?.techDetails && typeof req.body.techDetails === 'object'
      ? normalizeTechDetails(req.body.techDetails)
      : undefined;

  db.prepare(`
    UPDATE tournament_players
    SET
      display_name_snapshot = COALESCE(?, display_name_snapshot),
      role_primary = COALESCE(?, role_primary),
      roles_json = COALESCE(?, roles_json),
      age = COALESCE(?, age),
      tec = COALESCE(?, tec),
      fis = COALESCE(?, fis),
      nationality = CASE WHEN ? IS NULL THEN nationality ELSE ? END,
      tech_details_json = CASE
        WHEN ? = 1 THEN NULL
        WHEN ? IS NULL THEN tech_details_json
        ELSE ?
      END
    WHERE id = ?
  `).run(
    name,
    roles ? rolePrimary : null,
    roles ? JSON.stringify(roles) : null,
    age,
    tec,
    fis,
    nationality,
    nationality,
    techDetails === null ? 1 : 0,
    techDetails === undefined ? null : JSON.stringify(techDetails),
    techDetails === undefined ? null : JSON.stringify(techDetails),
    req.params.id
  );

  const updated = db.prepare(`
    SELECT
      tp.id,
      tp.profile_id AS profileId,
      tp.display_name_snapshot AS name,
      tp.nationality AS flag,
      tp.role_primary AS role,
      tp.roles_json AS roles,
      tp.tec,
      tp.fis,
      tp.age,
      tp.tech_details_json AS techDetails,
      COALESCE(ps.goals, 0) AS goals,
      COALESCE(ps.assists, 0) AS assists
    FROM tournament_players tp
    LEFT JOIN player_stats ps ON ps.tournament_player_id = tp.id
    WHERE tp.id = ?
  `).get(req.params.id);

  res.json({
    player: {
      ...updated,
      tec: normalizeScore(updated.tec),
      fis: normalizeScore(updated.fis),
      roles: safeJsonParse(updated.roles, []),
      techDetails: normalizeTechDetails(safeJsonParse(updated.techDetails, null)),
    },
  });
});

router.delete('/tournament-players/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tournament_players WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Player not found' });
  res.json({ ok: true });
});

router.get('/tournaments/:id/standings', (req, res) => {
  const rows = db.prepare(`
    SELECT
      tp.id,
      tp.display_name_snapshot AS name,
      COALESCE(ps.goals, 0) AS goals,
      COALESCE(ps.assists, 0) AS assists
    FROM tournament_players tp
    LEFT JOIN player_stats ps ON ps.tournament_player_id = tp.id
    WHERE tp.tournament_id = ?
    ORDER BY goals DESC, assists DESC, name ASC
  `).all(req.params.id);
  res.json({ standings: rows });
});

module.exports = router;

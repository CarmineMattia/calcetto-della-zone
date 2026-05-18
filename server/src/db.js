const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function nowIso() {
  return new Date().toISOString();
}

function normalizeScore(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const legacyAdjusted = parsed > 0 && parsed <= 5 ? parsed * 20 : parsed;
  return Math.max(0, Math.min(100, Math.round(legacyAdjusted)));
}

function normalizeTechDetails(details) {
  if (!details || typeof details !== 'object') return null;
  return {
    speed: normalizeScore(details.speed),
    passing: normalizeScore(details.passing),
    physical: normalizeScore(details.physical),
    defense: normalizeScore(details.defense),
  };
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      team_count INTEGER NOT NULL DEFAULT 4
    );

    CREATE TABLE IF NOT EXISTS player_profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      nationality TEXT,
      age INTEGER,
      tec INTEGER NOT NULL DEFAULT 50,
      fis INTEGER NOT NULL DEFAULT 50,
      tech_details_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_players (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      display_name_snapshot TEXT NOT NULL,
      role_primary TEXT,
      roles_json TEXT NOT NULL DEFAULT '[]',
      tec INTEGER NOT NULL DEFAULT 50,
      fis INTEGER NOT NULL DEFAULT 50,
      age INTEGER,
      nationality TEXT,
      tech_details_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      tournament_player_id TEXT PRIMARY KEY,
      goals INTEGER NOT NULL DEFAULT 0,
      assists INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tournament_player_id) REFERENCES tournament_players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      slot INTEGER NOT NULL,
      team_a TEXT,
      team_b TEXT,
      score_a INTEGER NOT NULL DEFAULT 0,
      score_b INTEGER NOT NULL DEFAULT 0,
      winner TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      lineup_a_json TEXT,
      lineup_b_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tournament_snapshots (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      final_match_id TEXT,
      winner_team TEXT,
      runner_up_team TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (final_match_id) REFERENCES matches(id) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_snapshots_tournament_version
      ON tournament_snapshots (tournament_id, version);
    CREATE INDEX IF NOT EXISTS idx_tournament_snapshots_tournament_created
      ON tournament_snapshots (tournament_id, created_at DESC);
  `);
  ensureMatchesColumns();
}

function ensureMatchesColumns() {
  const columns = db.prepare('PRAGMA table_info(matches)').all().map((row) => row.name);
  if (!columns.includes('status')) {
    db.exec("ALTER TABLE matches ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled'");
  }
  if (!columns.includes('lineup_a_json')) {
    db.exec('ALTER TABLE matches ADD COLUMN lineup_a_json TEXT');
  }
  if (!columns.includes('lineup_b_json')) {
    db.exec('ALTER TABLE matches ADD COLUMN lineup_b_json TEXT');
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function defaultTournamentName(date = new Date()) {
  const monthNames = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
  ];
  return `Torneo ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

function ensureSeedTournament() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM tournaments').get().count;
  if (count > 0) return;
  const id = uid();
  db.prepare('INSERT INTO tournaments (id, name, created_at, team_count) VALUES (?, ?, ?, 4)')
    .run(id, defaultTournamentName(new Date()), nowIso());
}

function createBracketIfMissing(tournamentId, teamCount = 4) {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM matches WHERE tournament_id = ?').get(tournamentId).count;
  if (existing > 0) return;
  const now = nowIso();
  const stm = db.prepare(`
    INSERT INTO matches (
      id, tournament_id, stage, slot, team_a, team_b, score_a, score_b, winner, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?)
  `);
  if (teamCount === 2) {
    stm.run(uid(), tournamentId, 'final', 1, 'Squadra A', 'Squadra B', now, now);
    return;
  }
  stm.run(uid(), tournamentId, 'semi', 1, 'Squadra A', 'Squadra B', now, now);
  stm.run(uid(), tournamentId, 'semi', 2, 'Squadra C', 'Squadra D', now, now);
  stm.run(uid(), tournamentId, 'third_place', 1, 'Perdente SF1', 'Perdente SF2', now, now);
  stm.run(uid(), tournamentId, 'final', 1, 'Vincente SF1', 'Vincente SF2', now, now);
}

function listTournamentPlayers(tournamentId) {
  return db.prepare(`
    SELECT
      tp.id,
      tp.profile_id,
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
    WHERE tp.tournament_id = ?
    ORDER BY tp.created_at ASC
  `).all(tournamentId).map((p) => {
    const techDetails = normalizeTechDetails(safeJsonParse(p.techDetails, null));
    return {
      ...p,
      tec: normalizeScore(p.tec),
      fis: normalizeScore(p.fis),
      roles: safeJsonParse(p.roles, []),
      techDetails,
    };
  });
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = {
  db,
  initDb,
  uid,
  nowIso,
  defaultTournamentName,
  ensureSeedTournament,
  createBracketIfMissing,
  listTournamentPlayers,
  safeJsonParse,
  normalizeScore,
  normalizeTechDetails,
};

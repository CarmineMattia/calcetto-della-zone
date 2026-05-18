import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for api edge function');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

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

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function ok(payload: unknown): Response {
  return jsonResponse(200, payload);
}

function created(payload: unknown): Response {
  return jsonResponse(201, payload);
}

function badRequest(error: string, extras: Record<string, unknown> = {}): Response {
  return jsonResponse(400, { error, ...extras });
}

function notFound(error: string): Response {
  return jsonResponse(404, { error });
}

function internalError(error: unknown): Response {
  const message = error instanceof Error ? error.message : String(error || 'Errore sconosciuto');
  return jsonResponse(500, { error: message });
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function nowIso() {
  return new Date().toISOString();
}

function uid() {
  return crypto.randomUUID().replace(/-/g, '');
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeScore(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const legacyAdjusted = parsed > 0 && parsed <= 5 ? parsed * 20 : parsed;
  return Math.max(0, Math.min(100, Math.round(legacyAdjusted)));
}

function normalizeTechDetails(details: unknown) {
  if (!details || typeof details !== 'object') return null;
  const obj = details as Record<string, unknown>;
  return {
    speed: normalizeScore(obj.speed),
    passing: normalizeScore(obj.passing),
    physical: normalizeScore(obj.physical),
    defense: normalizeScore(obj.defense),
  };
}

function sanitizeName(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeName(name: unknown) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stageOrder(stage: string) {
  if (stage === 'semi') return 1;
  if (stage === 'third_place') return 2;
  if (stage === 'final') return 3;
  return 9;
}

function defaultTournamentName(date = new Date()) {
  const monthNames = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
  ];
  return `Torneo ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

function asTournament(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    createdAt: String(row.created_at || ''),
    teamCount: Number(row.team_count) || 4,
  };
}

async function ensureSeedTournament() {
  const { count, error } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
  if (error) throw error;
  if ((count || 0) > 0) return;
  const id = uid();
  const createdAt = nowIso();
  const { error: insertError } = await supabase.from('tournaments').insert({
    id,
    name: defaultTournamentName(new Date()),
    created_at: createdAt,
    team_count: 4,
  });
  if (insertError) throw insertError;
}

async function getTournamentById(id: string) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id,name,created_at,team_count')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? asTournament(data as Record<string, unknown>) : null;
}

async function createBracketIfMissing(tournamentId: string, teamCount = 4) {
  const { count, error: countError } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);
  if (countError) throw countError;
  if ((count || 0) > 0) return;

  const now = nowIso();
  const rows: Record<string, unknown>[] = [];
  if (teamCount === 2) {
    rows.push({
      id: uid(), tournament_id: tournamentId, stage: 'final', slot: 1, team_a: 'Squadra A', team_b: 'Squadra B',
      score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
    });
  } else {
    rows.push(
      {
        id: uid(), tournament_id: tournamentId, stage: 'semi', slot: 1, team_a: 'Squadra A', team_b: 'Squadra B',
        score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
      },
      {
        id: uid(), tournament_id: tournamentId, stage: 'semi', slot: 2, team_a: 'Squadra C', team_b: 'Squadra D',
        score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
      },
      {
        id: uid(), tournament_id: tournamentId, stage: 'third_place', slot: 1, team_a: 'Perdente SF1', team_b: 'Perdente SF2',
        score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
      },
      {
        id: uid(), tournament_id: tournamentId, stage: 'final', slot: 1, team_a: 'Vincente SF1', team_b: 'Vincente SF2',
        score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
      },
    );
  }
  const { error: insertError } = await supabase.from('matches').insert(rows);
  if (insertError) throw insertError;
}

async function listTournamentPlayers(tournamentId: string) {
  const { data: players, error: playersError } = await supabase
    .from('tournament_players')
    .select('id,profile_id,display_name_snapshot,role_primary,roles_json,tec,fis,age,nationality,tech_details_json,created_at')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });
  if (playersError) throw playersError;

  const ids = (players || []).map((row) => row.id);
  const statsMap = new Map<string, { goals: number; assists: number }>();
  if (ids.length) {
    const { data: statsRows, error: statsError } = await supabase
      .from('player_stats')
      .select('tournament_player_id,goals,assists')
      .in('tournament_player_id', ids);
    if (statsError) throw statsError;
    (statsRows || []).forEach((s) => {
      statsMap.set(String(s.tournament_player_id), {
        goals: Number(s.goals) || 0,
        assists: Number(s.assists) || 0,
      });
    });
  }

  return (players || []).map((p) => {
    const st = statsMap.get(String(p.id)) || { goals: 0, assists: 0 };
    return {
      id: String(p.id),
      profileId: String(p.profile_id),
      name: String(p.display_name_snapshot || ''),
      flag: p.nationality ? String(p.nationality) : null,
      role: p.role_primary ? String(p.role_primary) : null,
      roles: safeJsonParse<string[]>(p.roles_json, []),
      tec: normalizeScore(p.tec),
      fis: normalizeScore(p.fis),
      age: p.age == null ? null : Number(p.age),
      techDetails: normalizeTechDetails(p.tech_details_json),
      goals: st.goals,
      assists: st.assists,
    };
  });
}

function normalizeLineupEntry(entry: Record<string, unknown> | null | undefined, idx: number, playersById = new Map<string, Record<string, unknown>>(), side = 'a') {
  const defaults = side === 'b' ? RIGHT_POSITIONS : LEFT_POSITIONS;
  const fallback = defaults[idx] || defaults[0];
  const id = entry?.id ? String(entry.id) : `lineup-${idx + 1}`;
  const sourcePlayer = playersById.get(id) || null;
  const xRaw = Number(entry?.x);
  const yRaw = Number(entry?.y);
  const x = Number.isFinite(xRaw) ? Math.min(96, Math.max(4, xRaw)) : fallback.x;
  const y = Number.isFinite(yRaw) ? Math.min(92, Math.max(8, yRaw)) : fallback.y;
  if (!sourcePlayer && !!entry?.id) {
    return { id: `missing-sync-${idx + 1}`, name: 'Mancante', role: '—', tec: 0, fis: 0, placeholder: true, x: fallback.x, y: fallback.y };
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
    name: sanitizeName(entry?.name) || 'Senza nome',
    role: entry?.role ? String(entry.role) : '—',
    tec: Number(entry?.tec) || 0,
    fis: Number(entry?.fis) || 0,
    placeholder: Boolean(entry?.placeholder),
    x,
    y,
  };
}

function parseLineupJson(value: unknown, playersById = new Map<string, Record<string, unknown>>(), side = 'a') {
  const parsed = safeJsonParse<Record<string, unknown>[]>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((entry, idx) => normalizeLineupEntry(entry, idx, playersById, side));
}

function normalizeLineupInput(entries: unknown) {
  if (!Array.isArray(entries)) return null;
  return entries.slice(0, PLAYERS_PER_TEAM).map((entryRaw, idx) => {
    const entry = (entryRaw || {}) as Record<string, unknown>;
    const xRaw = Number(entry.x);
    const yRaw = Number(entry.y);
    return {
      id: entry.id ? String(entry.id) : `lineup-${idx + 1}`,
      name: sanitizeName(entry.name) || 'Senza nome',
      role: entry.role ? String(entry.role) : '—',
      tec: Number(entry.tec) || 0,
      fis: Number(entry.fis) || 0,
      placeholder: Boolean(entry.placeholder),
      x: Number.isFinite(xRaw) ? Math.min(96, Math.max(4, xRaw)) : null,
      y: Number.isFinite(yRaw) ? Math.min(92, Math.max(8, yRaw)) : null,
    };
  });
}

function placeholderLineup(teamLabel = '') {
  const label = sanitizeName(teamLabel) || 'Mancante';
  return Array.from({ length: PLAYERS_PER_TEAM }, (_, idx) => ({
    id: `missing-${label}-${idx + 1}`.toLowerCase().replace(/\s+/g, '-'),
    name: 'Mancante',
    role: '—',
    tec: 0,
    fis: 0,
    placeholder: true,
  }));
}

function getPrimaryRole(player: Record<string, unknown>) {
  if (Array.isArray(player.roles) && player.roles.length) return String(player.roles[0]);
  if (player.role) return String(player.role);
  return null;
}

function averagePower(players: Record<string, unknown>[]) {
  if (!players.length) return 0;
  return players.reduce((sum, p) => sum + (Number(p.tec) || 0) + (Number(p.fis) || 0), 0) / players.length;
}

function buildBalancedTeams(players: Record<string, unknown>[], labels: string[]) {
  const teams = labels.map((label, index) => ({ label, index, players: [] as Record<string, unknown>[] }));
  const normalizedPlayers = players.map((player, idx) => ({
    id: String(player.id || `p-${idx + 1}`),
    name: sanitizeName(player.name) || 'Senza nome',
    role: getPrimaryRole(player),
    tec: Number(player.tec) || 0,
    fis: Number(player.fis) || 0,
    placeholder: false,
  }));
  const assigned = new Set<string>();
  const roleGroups = ROLES
    .map((role) => ({ role, count: normalizedPlayers.filter((player) => player.role === role).length }))
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

async function orderedMatches(tournamentId: string) {
  const players = await listTournamentPlayers(tournamentId);
  const playersById = new Map(players.map((p) => [String(p.id), p as unknown as Record<string, unknown>]));
  const { data, error } = await supabase
    .from('matches')
    .select('id,stage,slot,team_a,team_b,score_a,score_b,winner,status,lineup_a_json,lineup_b_json')
    .eq('tournament_id', tournamentId);
  if (error) throw error;
  return (data || [])
    .sort((a, b) => {
      const stageDiff = stageOrder(String(a.stage)) - stageOrder(String(b.stage));
      if (stageDiff !== 0) return stageDiff;
      return (Number(a.slot) || 0) - (Number(b.slot) || 0);
    })
    .map((match) => ({
      id: String(match.id),
      stage: String(match.stage),
      slot: Number(match.slot) || 0,
      teamA: match.team_a ? String(match.team_a) : null,
      teamB: match.team_b ? String(match.team_b) : null,
      scoreA: Number(match.score_a) || 0,
      scoreB: Number(match.score_b) || 0,
      winner: match.winner ? String(match.winner) : null,
      status: match.status ? String(match.status) : 'scheduled',
      lineupA: parseLineupJson(match.lineup_a_json, playersById, 'a'),
      lineupB: parseLineupJson(match.lineup_b_json, playersById, 'b'),
      lineupAJson: match.lineup_a_json,
      lineupBJson: match.lineup_b_json,
    }));
}

async function buildTournamentPayload(tournamentId: string) {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) return null;
  await createBracketIfMissing(tournament.id, tournament.teamCount);
  const players = await listTournamentPlayers(tournament.id);
  const matches = await orderedMatches(tournament.id);
  return { ...tournament, players, matches };
}

function buildPodium(matches: Record<string, unknown>[] = []) {
  const finalMatch = matches.find((match) => match.stage === 'final') || null;
  const thirdPlaceMatch = matches.find((match) => match.stage === 'third_place') || null;
  const first = finalMatch?.winner ? String(finalMatch.winner) : null;
  const second = finalMatch
    ? [finalMatch.teamA, finalMatch.teamB].find((team) => team && team !== first) || null
    : null;
  const third = thirdPlaceMatch?.winner ? String(thirdPlaceMatch.winner) : null;
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

async function setMatchSlot(matchId: string, side: 'A' | 'B', slotTeam: string, slotLineup: unknown) {
  const payload = side === 'A'
    ? {
      team_a: slotTeam,
      lineup_a_json: slotLineup,
      winner: null,
      status: 'scheduled',
      score_a: 0,
      score_b: 0,
      updated_at: nowIso(),
    }
    : {
      team_b: slotTeam,
      lineup_b_json: slotLineup,
      winner: null,
      status: 'scheduled',
      score_a: 0,
      score_b: 0,
      updated_at: nowIso(),
    };
  const { error } = await supabase.from('matches').update(payload).eq('id', matchId);
  if (error) throw error;
}

function extractApiSegments(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const apiIdx = parts.lastIndexOf('api');
  return apiIdx >= 0 ? parts.slice(apiIdx + 1) : parts;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  try {
    await ensureSeedTournament();

    const url = new URL(req.url);
    const segments = extractApiSegments(url.pathname);
    const method = req.method.toUpperCase();

    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'health')) {
      return ok({ ok: true });
    }

    if (method === 'GET' && segments[0] === 'bootstrap') {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id,name,created_at,team_count');
      if (error) throw error;
      const tournaments = (data || [])
        .map((row) => asTournament(row as Record<string, unknown>))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      const current = tournaments[0] || null;
      if (current) await createBracketIfMissing(current.id, current.teamCount);
      return ok({ tournaments, currentId: current?.id || null });
    }

    if (method === 'GET' && segments.length === 1 && segments[0] === 'tournaments') {
      const { data, error } = await supabase.from('tournaments').select('id,name,created_at,team_count');
      if (error) throw error;
      const tournaments = (data || [])
        .map((row) => asTournament(row as Record<string, unknown>))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return ok({ tournaments });
    }

    if (method === 'POST' && segments.length === 1 && segments[0] === 'tournaments') {
      const body = await readBody(req);
      const id = uid();
      const teamCount = Number(body.teamCount) === 2 ? 2 : 4;
      const name = sanitizeName(body.name) || defaultTournamentName(new Date());
      const createdAt = nowIso();
      const { error } = await supabase.from('tournaments').insert({
        id, name, team_count: teamCount, created_at: createdAt,
      });
      if (error) throw error;
      await createBracketIfMissing(id, teamCount);
      return created({ tournament: { id, name, createdAt, teamCount, players: [], matches: [] } });
    }

    if (segments[0] === 'tournaments' && segments[1]) {
      const tournamentId = segments[1];

      if (method === 'GET' && segments.length === 2) {
        const tournament = await buildTournamentPayload(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        return ok({ tournament });
      }

      if (method === 'PATCH' && segments.length === 2) {
        const current = await getTournamentById(tournamentId);
        if (!current) return notFound('Tournament not found');
        const body = await readBody(req);
        const nextName = typeof body.name === 'string' ? sanitizeName(body.name) : current.name;
        const requestedTeamCount = Number(body.teamCount);
        const nextTeamCount = requestedTeamCount === 2 || requestedTeamCount === 4
          ? requestedTeamCount
          : Number(current.teamCount) || 4;
        const { error } = await supabase
          .from('tournaments')
          .update({ name: nextName || current.name, team_count: nextTeamCount })
          .eq('id', current.id);
        if (error) throw error;
        await createBracketIfMissing(current.id, nextTeamCount);
        const updated = await getTournamentById(current.id);
        return ok({ tournament: updated });
      }

      if (method === 'DELETE' && segments.length === 2) {
        const { count, error: countError } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true });
        if (countError) throw countError;
        if ((count || 0) <= 1) return badRequest('Cannot delete last tournament');
        const { data: existing, error: getError } = await supabase
          .from('tournaments')
          .select('id')
          .eq('id', tournamentId)
          .maybeSingle();
        if (getError) throw getError;
        if (!existing) return notFound('Tournament not found');
        const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
        if (error) throw error;
        return ok({ ok: true });
      }

      if (method === 'POST' && segments.length === 3 && segments[2] === 'archive') {
        const tournament = await buildTournamentPayload(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        const finalMatch = tournament.matches.find((match: Record<string, unknown>) => match.stage === 'final');
        if (!finalMatch || finalMatch.status !== 'completed' || !finalMatch.winner) {
          return badRequest('Completa la finale 1°/2° posto prima di archiviare il torneo');
        }
        const { data: maxRow, error: maxErr } = await supabase
          .from('tournament_snapshots')
          .select('version')
          .eq('tournament_id', tournament.id)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (maxErr) throw maxErr;
        const version = (Number(maxRow?.version) || 0) + 1;
        const createdAt = nowIso();
        const snapshotId = uid();
        const podium = buildPodium(tournament.matches as Record<string, unknown>[]);
        const payload = {
          snapshot: { id: snapshotId, tournamentId: tournament.id, version, createdAt, podium },
          tournament,
        };
        const { error: insErr } = await supabase.from('tournament_snapshots').insert({
          id: snapshotId,
          tournament_id: tournament.id,
          version,
          created_at: createdAt,
          payload_json: payload,
          final_match_id: podium.finalMatchId,
          winner_team: podium.first,
          runner_up_team: podium.second,
        });
        if (insErr) throw insErr;
        return created({
          snapshot: {
            id: snapshotId,
            tournamentId: tournament.id,
            version,
            createdAt,
            winnerTeam: podium.first,
            runnerUpTeam: podium.second,
          },
        });
      }

      if (method === 'GET' && segments.length === 3 && segments[2] === 'snapshots') {
        const tournament = await getTournamentById(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        const { data, error } = await supabase
          .from('tournament_snapshots')
          .select('id,tournament_id,version,created_at,winner_team,runner_up_team')
          .eq('tournament_id', tournament.id)
          .order('version', { ascending: false });
        if (error) throw error;
        const snapshots = (data || []).map((row) => ({
          id: row.id,
          tournamentId: row.tournament_id,
          version: row.version,
          createdAt: row.created_at,
          winnerTeam: row.winner_team,
          runnerUpTeam: row.runner_up_team,
        }));
        return ok({ snapshots });
      }

      if (method === 'GET' && segments.length === 4 && segments[2] === 'snapshots') {
        const version = Number.parseInt(segments[3], 10);
        if (!Number.isInteger(version) || version <= 0) return badRequest('Invalid snapshot version');
        const tournament = await getTournamentById(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        const { data, error } = await supabase
          .from('tournament_snapshots')
          .select('id,tournament_id,version,created_at,winner_team,runner_up_team,payload_json')
          .eq('tournament_id', tournament.id)
          .eq('version', version)
          .maybeSingle();
        if (error) throw error;
        if (!data) return notFound('Snapshot not found');
        const payload = data.payload_json || null;
        if (!payload) return internalError('Snapshot payload is corrupted');
        return ok({
          snapshot: {
            id: data.id,
            tournamentId: data.tournament_id,
            version: data.version,
            createdAt: data.created_at,
            winnerTeam: data.winner_team,
            runnerUpTeam: data.runner_up_team,
          },
          payload,
        });
      }

      if (method === 'GET' && segments.length === 3 && segments[2] === 'standings') {
        const players = await listTournamentPlayers(tournamentId);
        const standings = players
          .map((p) => ({ id: p.id, name: p.name, goals: p.goals, assists: p.assists }))
          .sort((a, b) => (b.goals - a.goals) || (b.assists - a.assists) || a.name.localeCompare(b.name));
        return ok({ standings });
      }

      if (method === 'POST' && segments.length === 3 && segments[2] === 'players') {
        const tournament = await getTournamentById(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        const body = await readBody(req);
        const rawName = sanitizeName(body.name);
        if (!rawName) return badRequest('Name is required');

        const duplicateStrategy = body.duplicateStrategy === 'reuse' ? 'reuse' : 'new';
        const profileIdFromBody = sanitizeName(body.profileId);
        const age = body.age == null || body.age === '' ? null : clamp(Number(body.age) || 0, 5, 99);
        const tec = normalizeScore(body.tec);
        const fis = normalizeScore(body.fis);
        const roles = Array.isArray(body.roles) ? body.roles.filter(Boolean).map(String) : [];
        const rolePrimary = roles[0] || null;
        const nationality = body.flag ? String(body.flag).slice(0, 8) : null;
        const techDetails = body.techDetails && typeof body.techDetails === 'object'
          ? normalizeTechDetails(body.techDetails)
          : null;

        let profileId = '';
        if (duplicateStrategy === 'reuse' && profileIdFromBody) {
          const { data, error } = await supabase
            .from('player_profiles')
            .select('id')
            .eq('id', profileIdFromBody)
            .maybeSingle();
          if (error) throw error;
          if (data?.id) profileId = String(data.id);
        }

        if (!profileId) {
          const target = normalizeName(rawName);
          const { data: profiles, error: profileErr } = await supabase
            .from('player_profiles')
            .select('id,display_name,created_at')
            .order('created_at', { ascending: false });
          if (profileErr) throw profileErr;
          const maybeExisting = (profiles || []).find((row) => normalizeName(row.display_name) === target);
          if (duplicateStrategy === 'reuse' && maybeExisting) profileId = String(maybeExisting.id);
        }

        if (!profileId) {
          profileId = uid();
          const { error } = await supabase.from('player_profiles').insert({
            id: profileId,
            display_name: rawName,
            nationality,
            age,
            tec,
            fis,
            tech_details_json: techDetails,
            created_at: nowIso(),
          });
          if (error) throw error;
        }

        const tournamentPlayerId = uid();
        const { error: tpErr } = await supabase.from('tournament_players').insert({
          id: tournamentPlayerId,
          tournament_id: tournamentId,
          profile_id: profileId,
          display_name_snapshot: rawName,
          role_primary: rolePrimary,
          roles_json: roles,
          tec,
          fis,
          age,
          nationality,
          tech_details_json: techDetails,
          created_at: nowIso(),
        });
        if (tpErr) throw tpErr;

        const { error: statsErr } = await supabase.from('player_stats').upsert({
          tournament_player_id: tournamentPlayerId,
          goals: 0,
          assists: 0,
          updated_at: nowIso(),
        }, { onConflict: 'tournament_player_id' });
        if (statsErr) throw statsErr;

        const players = await listTournamentPlayers(tournamentId);
        const createdPlayer = players.find((p) => p.id === tournamentPlayerId);
        return created({ player: createdPlayer || null });
      }

      if (method === 'GET' && segments.length === 3 && segments[2] === 'bracket') {
        const tournament = await getTournamentById(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        await createBracketIfMissing(tournament.id, tournament.teamCount);
        return ok({ matches: await orderedMatches(tournament.id) });
      }

      if (method === 'POST' && segments.length === 4 && segments[2] === 'bracket' && segments[3] === 'reset') {
        const tournament = await getTournamentById(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        const { error: delErr } = await supabase.from('matches').delete().eq('tournament_id', tournament.id);
        if (delErr) throw delErr;
        await createBracketIfMissing(tournament.id, tournament.teamCount);
        return ok({ matches: await orderedMatches(tournament.id) });
      }

      if (method === 'POST' && segments.length === 4 && segments[2] === 'bracket' && segments[3] === 'from-teams') {
        const tournament = await getTournamentById(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        const body = await readBody(req);
        const letters = Array.isArray(body.letters) ? body.letters.map(String) : [];
        const { error: delErr } = await supabase.from('matches').delete().eq('tournament_id', tournament.id);
        if (delErr) throw delErr;
        const now = nowIso();
        const rows: Record<string, unknown>[] = [];
        if (tournament.teamCount === 2) {
          rows.push({
            id: uid(), tournament_id: tournament.id, stage: 'final', slot: 1,
            team_a: letters[0] || 'Squadra A', team_b: letters[1] || 'Squadra B',
            score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
          });
        } else {
          rows.push(
            {
              id: uid(), tournament_id: tournament.id, stage: 'semi', slot: 1,
              team_a: letters[0] || 'Squadra A', team_b: letters[1] || 'Squadra B',
              score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
            },
            {
              id: uid(), tournament_id: tournament.id, stage: 'semi', slot: 2,
              team_a: letters[2] || 'Squadra C', team_b: letters[3] || 'Squadra D',
              score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
            },
            {
              id: uid(), tournament_id: tournament.id, stage: 'third_place', slot: 1,
              team_a: 'Perdente SF1', team_b: 'Perdente SF2',
              score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
            },
            {
              id: uid(), tournament_id: tournament.id, stage: 'final', slot: 1,
              team_a: 'Vincente SF1', team_b: 'Vincente SF2',
              score_a: 0, score_b: 0, winner: null, status: 'scheduled', created_at: now, updated_at: now,
            },
          );
        }
        const { error: insertError } = await supabase.from('matches').insert(rows);
        if (insertError) throw insertError;
        return ok({ matches: await orderedMatches(tournament.id) });
      }

      if (method === 'POST' && segments.length === 4 && segments[2] === 'bracket' && segments[3] === 'auto-lineups') {
        const tournament = await getTournamentById(tournamentId);
        if (!tournament) return notFound('Tournament not found');
        await createBracketIfMissing(tournament.id, tournament.teamCount);

        const matches = await orderedMatches(tournament.id);
        const players = await listTournamentPlayers(tournament.id);
        const labels: string[] = [];
        if (tournament.teamCount === 2) {
          const final = matches.find((match) => match.stage === 'final');
          labels.push(String(final?.teamA || 'Squadra A'), String(final?.teamB || 'Squadra B'));
        } else {
          const semi1 = matches.find((match) => match.stage === 'semi' && match.slot === 1);
          const semi2 = matches.find((match) => match.stage === 'semi' && match.slot === 2);
          labels.push(
            String(semi1?.teamA || 'Squadra A'),
            String(semi1?.teamB || 'Squadra B'),
            String(semi2?.teamA || 'Squadra C'),
            String(semi2?.teamB || 'Squadra D'),
          );
        }
        const requiredPlayers = labels.length * PLAYERS_PER_TEAM;
        const currentPlayers = players.length;
        if (currentPlayers < requiredPlayers) {
          const missingPlayers = requiredPlayers - currentPlayers;
          return badRequest(`Mancano ${missingPlayers} giocatori per calcolare le formazioni automatiche`, {
            code: 'INSUFFICIENT_PLAYERS',
            missingPlayers,
            requiredPlayers,
            currentPlayers,
          });
        }
        const teams = buildBalancedTeams(players as unknown as Record<string, unknown>[], labels);
        const map = new Map(teams.map((team) => [team.label, team.players]));
        for (const match of matches) {
          const lineupA = map.get(String(match.teamA)) || placeholderLineup(String(match.teamA || 'Mancante'));
          const lineupB = map.get(String(match.teamB)) || placeholderLineup(String(match.teamB || 'Mancante'));
          const { error } = await supabase.from('matches').update({
            lineup_a_json: lineupA,
            lineup_b_json: lineupB,
            updated_at: nowIso(),
          }).eq('id', String(match.id));
          if (error) throw error;
        }
        return ok({ matches: await orderedMatches(tournament.id) });
      }
    }

    if (method === 'GET' && segments.length === 2 && segments[0] === 'players' && segments[1] === 'duplicates') {
      const name = sanitizeName(url.searchParams.get('name'));
      if (!name) return ok({ duplicates: [] });
      const target = normalizeName(name);
      if (!target) return ok({ duplicates: [] });
      const excludeTournamentId = sanitizeName(url.searchParams.get('excludeTournamentId'));

      const { data: profiles, error: profilesError } = await supabase
        .from('player_profiles')
        .select('id,display_name');
      if (profilesError) throw profilesError;
      const matchingProfiles = (profiles || []).filter((p) => normalizeName(p.display_name) === target);
      if (!matchingProfiles.length) return ok({ duplicates: [] });
      const profileIds = matchingProfiles.map((p) => p.id);

      const { data: tpRows, error: tpError } = await supabase
        .from('tournament_players')
        .select('profile_id,tournament_id')
        .in('profile_id', profileIds);
      if (tpError) throw tpError;

      const tournamentIds = [...new Set((tpRows || []).map((row) => String(row.tournament_id)))];
      if (!tournamentIds.length) return ok({ duplicates: [] });
      const { data: tournaments, error: tError } = await supabase
        .from('tournaments')
        .select('id,name,created_at')
        .in('id', tournamentIds);
      if (tError) throw tError;
      const tournamentMap = new Map((tournaments || []).map((t) => [String(t.id), t]));
      const profileMap = new Map(matchingProfiles.map((p) => [String(p.id), p]));

      const unique = new Map<string, Record<string, unknown>>();
      for (const row of tpRows || []) {
        const tournamentId = String(row.tournament_id);
        if (excludeTournamentId && tournamentId === excludeTournamentId) continue;
        const profileId = String(row.profile_id);
        const t = tournamentMap.get(tournamentId);
        const p = profileMap.get(profileId);
        if (!t || !p) continue;
        const key = `${profileId}:${tournamentId}`;
        if (!unique.has(key)) {
          unique.set(key, {
            profileId,
            profileName: p.display_name,
            tournamentId,
            tournamentName: t.name,
            tournamentCreatedAt: t.created_at,
          });
        }
      }
      const duplicates = [...unique.values()].sort((a, b) => +new Date(String(b.tournamentCreatedAt)) - +new Date(String(a.tournamentCreatedAt)));
      return ok({ duplicates });
    }

    if (segments[0] === 'tournament-players' && segments[1]) {
      const playerId = segments[1];

      if (method === 'PATCH' && segments.length === 2) {
        const body = await readBody(req);
        const { data: current, error: currErr } = await supabase
          .from('tournament_players')
          .select('id,tournament_id')
          .eq('id', playerId)
          .maybeSingle();
        if (currErr) throw currErr;
        if (!current) return notFound('Player not found');

        const updatePayload: Record<string, unknown> = {};
        if (Object.prototype.hasOwnProperty.call(body, 'name')) {
          const name = sanitizeName(body.name);
          if (name) updatePayload.display_name_snapshot = name;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'roles')) {
          const roles = Array.isArray(body.roles) ? body.roles.filter(Boolean).map(String) : [];
          updatePayload.roles_json = roles;
          updatePayload.role_primary = roles[0] || null;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'age')) {
          updatePayload.age = body.age == null || body.age === '' ? null : clamp(Number(body.age) || 0, 5, 99);
        }
        if (Object.prototype.hasOwnProperty.call(body, 'tec')) updatePayload.tec = normalizeScore(body.tec);
        if (Object.prototype.hasOwnProperty.call(body, 'fis')) updatePayload.fis = normalizeScore(body.fis);
        if (Object.prototype.hasOwnProperty.call(body, 'flag')) {
          updatePayload.nationality = body.flag == null ? null : String(body.flag).slice(0, 8);
        }
        if (Object.prototype.hasOwnProperty.call(body, 'techDetails')) {
          updatePayload.tech_details_json = body.techDetails === null
            ? null
            : normalizeTechDetails(body.techDetails);
        }

        if (Object.keys(updatePayload).length) {
          const { error: upErr } = await supabase.from('tournament_players').update(updatePayload).eq('id', playerId);
          if (upErr) throw upErr;
        }

        const players = await listTournamentPlayers(String(current.tournament_id));
        const updated = players.find((p) => p.id === playerId);
        return ok({ player: updated || null });
      }

      if (method === 'DELETE' && segments.length === 2) {
        const { data: current, error: getErr } = await supabase
          .from('tournament_players')
          .select('id')
          .eq('id', playerId)
          .maybeSingle();
        if (getErr) throw getErr;
        if (!current) return notFound('Player not found');
        const { error } = await supabase.from('tournament_players').delete().eq('id', playerId);
        if (error) throw error;
        return ok({ ok: true });
      }

      if (method === 'PATCH' && segments.length === 3 && segments[2] === 'stats') {
        const body = await readBody(req);
        const { data: player, error: playerErr } = await supabase
          .from('tournament_players')
          .select('id')
          .eq('id', playerId)
          .maybeSingle();
        if (playerErr) throw playerErr;
        if (!player) return notFound('Player not found');
        const goalsDelta = Number(body.goalsDelta) || 0;
        const assistsDelta = Number(body.assistsDelta) || 0;
        const { data: stats, error: statsErr } = await supabase
          .from('player_stats')
          .select('goals,assists')
          .eq('tournament_player_id', playerId)
          .maybeSingle();
        if (statsErr) throw statsErr;
        const nextGoals = Math.max(0, (Number(stats?.goals) || 0) + goalsDelta);
        const nextAssists = Math.max(0, (Number(stats?.assists) || 0) + assistsDelta);
        const { error: upsertErr } = await supabase.from('player_stats').upsert({
          tournament_player_id: playerId,
          goals: nextGoals,
          assists: nextAssists,
          updated_at: nowIso(),
        }, { onConflict: 'tournament_player_id' });
        if (upsertErr) throw upsertErr;
        return ok({ stats: { goals: nextGoals, assists: nextAssists } });
      }
    }

    if (segments[0] === 'matches' && segments[1] && method === 'PATCH') {
      const matchId = segments[1];
      const body = await readBody(req);
      const { data: existing, error: existingErr } = await supabase
        .from('matches')
        .select('id,tournament_id,stage,slot,team_a,team_b,score_a,score_b,winner,status,lineup_a_json,lineup_b_json')
        .eq('id', matchId)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (!existing) return notFound('Match not found');

      const hasTeamA = Object.prototype.hasOwnProperty.call(body, 'teamA');
      const hasTeamB = Object.prototype.hasOwnProperty.call(body, 'teamB');
      const hasScoreA = Object.prototype.hasOwnProperty.call(body, 'scoreA');
      const hasScoreB = Object.prototype.hasOwnProperty.call(body, 'scoreB');
      const hasWinner = Object.prototype.hasOwnProperty.call(body, 'winner');
      const hasStatus = Object.prototype.hasOwnProperty.call(body, 'status');
      const hasLineupA = Object.prototype.hasOwnProperty.call(body, 'lineupA');
      const hasLineupB = Object.prototype.hasOwnProperty.call(body, 'lineupB');

      const teamA = hasTeamA ? (sanitizeName(body.teamA) || String(existing.team_a || 'Squadra A')) : String(existing.team_a || 'Squadra A');
      const teamB = hasTeamB ? (sanitizeName(body.teamB) || String(existing.team_b || 'Squadra B')) : String(existing.team_b || 'Squadra B');
      const scoreA = hasScoreA ? Math.max(0, Number(body.scoreA) || 0) : (Number(existing.score_a) || 0);
      const scoreB = hasScoreB ? Math.max(0, Number(body.scoreB) || 0) : (Number(existing.score_b) || 0);
      let winner = hasWinner
        ? (body.winner == null ? null : sanitizeName(body.winner))
        : (existing.winner ? String(existing.winner) : null);
      let status = hasStatus
        ? (String(body.status) === 'completed' ? 'completed' : 'scheduled')
        : (existing.status ? String(existing.status) : 'scheduled');

      let lineupAJson: unknown = existing.lineup_a_json;
      let lineupBJson: unknown = existing.lineup_b_json;
      if (hasLineupA) {
        const lineup = normalizeLineupInput(body.lineupA);
        lineupAJson = lineup || null;
      } else if (hasTeamA) {
        lineupAJson = null;
      }
      if (hasLineupB) {
        const lineup = normalizeLineupInput(body.lineupB);
        lineupBJson = lineup || null;
      } else if (hasTeamB) {
        lineupBJson = null;
      }

      if (winner && winner !== teamA && winner !== teamB) winner = null;
      const scoreChanged = hasScoreA || hasScoreB;
      if (!hasWinner && scoreChanged) winner = scoreA === scoreB ? null : (scoreA > scoreB ? teamA : teamB);
      if (status === 'completed' && !winner && scoreA !== scoreB) winner = scoreA > scoreB ? teamA : teamB;
      if (!hasStatus) {
        if (scoreChanged || winner) status = 'completed';
        else if (hasWinner && !winner) status = 'scheduled';
      }

      const { error: upErr } = await supabase.from('matches').update({
        team_a: teamA,
        team_b: teamB,
        score_a: scoreA,
        score_b: scoreB,
        winner,
        status,
        lineup_a_json: lineupAJson,
        lineup_b_json: lineupBJson,
        updated_at: nowIso(),
      }).eq('id', String(existing.id));
      if (upErr) throw upErr;

      if (existing.stage === 'semi') {
        const { data: stageMatches, error: stageErr } = await supabase
          .from('matches')
          .select('id,stage,slot,team_a,team_b,winner,lineup_a_json,lineup_b_json')
          .eq('tournament_id', String(existing.tournament_id));
        if (stageErr) throw stageErr;
        const final = (stageMatches || []).find((m) => m.stage === 'final') || null;
        const third = (stageMatches || []).find((m) => m.stage === 'third_place') || null;
        const thisMatch = (stageMatches || []).find((m) => String(m.id) === String(existing.id));
        if (thisMatch) {
          const winnerTeam = thisMatch.winner ? String(thisMatch.winner) : null;
          const winnerLineup = thisMatch.team_a === winnerTeam ? thisMatch.lineup_a_json : thisMatch.lineup_b_json;
          const loserTeam = thisMatch.team_a === winnerTeam ? thisMatch.team_b : thisMatch.team_a;
          const loserLineup = thisMatch.team_a === winnerTeam ? thisMatch.lineup_b_json : thisMatch.lineup_a_json;
          if (winnerTeam) {
            if (final) await setMatchSlot(String(final.id), Number(existing.slot) === 1 ? 'A' : 'B', winnerTeam, winnerLineup);
            if (third) await setMatchSlot(String(third.id), Number(existing.slot) === 1 ? 'A' : 'B', String(loserTeam || 'Mancante'), loserLineup);
          } else {
            if (final) await setMatchSlot(String(final.id), Number(existing.slot) === 1 ? 'A' : 'B', Number(existing.slot) === 1 ? 'Vincente SF1' : 'Vincente SF2', null);
            if (third) await setMatchSlot(String(third.id), Number(existing.slot) === 1 ? 'A' : 'B', Number(existing.slot) === 1 ? 'Perdente SF1' : 'Perdente SF2', null);
          }
        }
      }
      return ok({ matches: await orderedMatches(String(existing.tournament_id)) });
    }

    return notFound('Endpoint not found');
  } catch (error) {
    console.error(error);
    return internalError(error);
  }
});

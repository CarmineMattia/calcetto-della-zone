import React, { useEffect, useMemo, useRef, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);
const API_BASE = window.__TORNEO_API_BASE__ || 'http://localhost:3100/api';
const PLAYERS_PER_TEAM = 5;
const DEFAULT_OVERALL = 85;
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
const MATCH_THEMES = [
  {
    pitchTop: '#3f7156',
    pitchBottom: '#3a684f',
    slideBg: '#ffffff',
    dotA: '#111111',
    dotAFg: '#f7f6f3',
    dotB: '#f7f6f3',
    dotBFg: '#111111',
    dotBBorder: '#111111',
  },
  {
    pitchTop: '#2f6473',
    pitchBottom: '#295864',
    slideBg: '#f8fbfc',
    dotA: '#0f2430',
    dotAFg: '#f2fbff',
    dotB: '#d7f1fb',
    dotBFg: '#0f2430',
    dotBBorder: '#0f2430',
  },
  {
    pitchTop: '#4a6a3f',
    pitchBottom: '#3f5e36',
    slideBg: '#fbfcf8',
    dotA: '#1c2e15',
    dotAFg: '#f4fbef',
    dotB: '#e7f5d9',
    dotBFg: '#1c2e15',
    dotBBorder: '#1c2e15',
  },
  {
    pitchTop: '#6b4a3d',
    pitchBottom: '#5a3d33',
    slideBg: '#fdf9f8',
    dotA: '#2f1710',
    dotAFg: '#fff2ee',
    dotB: '#f9dfd7',
    dotBFg: '#2f1710',
    dotBBorder: '#2f1710',
  },
];

function sanitizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

function normalizeScoreValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_OVERALL;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function getPlayerOverall(player) {
  if (Number.isFinite(Number(player?.overall))) {
    return normalizeScoreValue(player.overall);
  }
  const tec = normalizeScoreValue(player?.tec);
  const fis = normalizeScoreValue(player?.fis);
  return Math.round((tec + fis) / 2);
}

function normalizePlayer(player, idx) {
  const name = sanitizeName(player?.name);
  return {
    id: player?.id ? String(player.id) : `p-${idx + 1}`,
    name: name || 'Senza nome',
    role: player?.role ? String(player.role) : '—',
    placeholder: Boolean(player?.placeholder),
    tec: normalizeScoreValue(player?.tec),
    fis: normalizeScoreValue(player?.fis),
    overall: Number.isFinite(Number(player?.overall)) ? normalizeScoreValue(player?.overall) : null,
    x: Number.isFinite(Number(player?.x)) ? Number(player.x) : null,
    y: Number.isFinite(Number(player?.y)) ? Number(player.y) : null,
  };
}

function filledLineup(lineup) {
  const list = Array.isArray(lineup) ? lineup.map((player, idx) => normalizePlayer(player, idx)) : [];
  while (list.length < PLAYERS_PER_TEAM) {
    list.push({
      id: `missing-${list.length + 1}`,
      name: 'Mancante',
      role: '—',
      placeholder: true,
      tec: DEFAULT_OVERALL,
      fis: DEFAULT_OVERALL,
      overall: DEFAULT_OVERALL,
    });
  }
  return list.slice(0, PLAYERS_PER_TEAM);
}

function prettyStage(stage) {
  if (stage === 'semi') return 'Semifinale';
  if (stage === 'third_place') return '3°/4° posto';
  if (stage === 'final') return 'Finale';
  return 'Partita';
}

function matchTitle(match, index) {
  if (match.stage === 'semi') return `Semifinale ${match.slot || index + 1}`;
  if (match.stage === 'third_place') return 'Finale 3°/4° posto';
  if (match.stage === 'final') return 'Finale 1°/2° posto';
  return `Partita ${index + 1}`;
}

function normalizeMatch(match, index) {
  const teamA = sanitizeName(match?.teamA) || 'Mancante';
  const teamB = sanitizeName(match?.teamB) || 'Mancante';
  const scoreA = Number(match?.scoreA) || 0;
  const scoreB = Number(match?.scoreB) || 0;
  const winner = match?.winner ? String(match.winner) : null;
  const status = String(match?.status || (winner ? 'completed' : 'scheduled')) === 'completed' ? 'completed' : 'scheduled';
  const themeIndex = match?.stage === 'semi'
    ? ((Number(match?.slot) || 1) - 1)
    : (match?.stage === 'third_place' ? 2 : (match?.stage === 'final' ? 3 : index));
  return {
    id: String(match?.id || `m-${index + 1}`),
    stage: match?.stage || '',
    slot: Number(match?.slot) || 1,
    teamA,
    teamB,
    scoreA,
    scoreB,
    winner,
    status,
    lineupA: filledLineup(match?.lineupA),
    lineupB: filledLineup(match?.lineupB),
    label: matchTitle(match, index),
    themeIndex: Math.max(0, themeIndex),
  };
}

function formatClock(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const mm = String(Math.floor(value / 60)).padStart(2, '0');
  const ss = String(value % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function parseClock(value) {
  const clean = String(value || '').trim();
  if (!clean) return 0;
  if (clean.includes(':')) {
    const [left, right] = clean.split(':');
    const mm = Math.max(0, Number(left.replace(/[^\d]/g, '')) || 0);
    const ss = Math.max(0, Math.min(59, Number((right || '').replace(/[^\d]/g, '')) || 0));
    return Math.min(5999, (mm * 60) + ss);
  }
  return Math.min(5999, Math.max(0, Number(clean.replace(/[^\d]/g, '')) || 0));
}

function api(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  }).then(async (response) => {
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      let parsed = null;
      try {
        parsed = await response.json();
        if (parsed?.error) message = parsed.error;
      } catch {}
      const error = new Error(message);
      error.status = response.status;
      if (parsed && typeof parsed === 'object') {
        Object.assign(error, parsed);
      }
      throw error;
    }
    return response.json();
  });
}

function PlayerBadge({ player, position, side, slotIndex, onTap }) {
  const overall = getPlayerOverall(player);
  const label = player.placeholder
    ? 'Aggiungi giocatore da slot mancante'
    : `Modifica scheda di ${player.name}`;
  const className = `fb-player fb-player-${side}${player.placeholder ? ' is-placeholder' : ''}`;
  return html`
    <button
      type="button"
      className=${className}
      style=${{ left: `${position.x}%`, top: `${position.y}%` }}
      title=${`${player.name} (${player.role}) · OVR ${overall}`}
      aria-label=${label}
      onClick=${() => onTap(player, position, side, slotIndex)}
    >
      <div className="fb-player-dot">${overall}</div>
      <div className="fb-player-name-wrap">
        <span className="fb-player-name">${player.name}</span>
        <span className=${`fb-player-edit-icon${player.placeholder ? ' is-add' : ''}`} aria-hidden="true">
          ${player.placeholder
            ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="8" r="3.2"></circle>
                <path d="M3 20a6 6 0 0 1 12 0"></path>
                <path d="M17 8v8"></path>
                <path d="M13 12h8"></path>
              </svg>`
            : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 20l4.2-1 9.9-9.9a1.9 1.9 0 0 0-2.7-2.7L5.5 16.3 4 20z"></path>
              </svg>`}
        </span>
      </div>
    </button>
  `;
}

function TeamLineupList({ title, players, matchId, side, defaults }) {
  const editPlayer = (playerId, slotIndex) => {
    if (!playerId || String(playerId).startsWith('missing-')) return;
    window.dispatchEvent(new CustomEvent('torneo:edit-player', {
      detail: { playerId, matchId, side, slotIndex },
    }));
  };
  const addPlayer = (slotIndex, player) => {
    const fallback = defaults?.[slotIndex] || null;
    window.dispatchEvent(new CustomEvent('torneo:add-player', {
      detail: {
        suggestedName: '',
        matchId,
        side,
        slotIndex,
        x: Number.isFinite(Number(player?.x)) ? Number(player.x) : (fallback?.x ?? null),
        y: Number.isFinite(Number(player?.y)) ? Number(player.y) : (fallback?.y ?? null),
      },
    }));
  };

  return html`
    <div className="fb-lineup-col">
      <div className="fb-lineup-title">${title}</div>
      <div className="fb-lineup-list">
        ${players.map((player, idx) => html`
          <div key=${`${player.id}-${idx}`} className="fb-lineup-row">
            <div className="fb-lineup-name-wrap">
              <span className=${`fb-lineup-name${player.placeholder ? ' is-placeholder' : ''}`}>${player.name}</span>
              <span className="fb-lineup-role">${player.role}</span>
            </div>
            <button
              type="button"
              className="fb-edit-btn"
              title=${player.placeholder ? 'Aggiungi giocatore in questo slot' : 'Modifica scheda giocatore'}
              onClick=${() => (player.placeholder || String(player.id).startsWith('missing-')) ? addPlayer(idx, player) : editPlayer(player.id, idx)}
            >
              <span className="fb-edit-btn-icon" aria-hidden="true">${player.placeholder ? '+' : '✎'}</span>
              <span>${player.placeholder ? 'Aggiungi' : 'Modifica'}</span>
            </button>
          </div>
        `)}
      </div>
    </div>
  `;
}

function PitchBoard({ match }) {
  const theme = MATCH_THEMES[match.themeIndex % MATCH_THEMES.length] || MATCH_THEMES[0];
  const themeStyle = {
    '--fb-pitch-top': theme.pitchTop,
    '--fb-pitch-bottom': theme.pitchBottom,
    '--fb-dot-a-bg': theme.dotA,
    '--fb-dot-a-fg': theme.dotAFg,
    '--fb-dot-b-bg': theme.dotB,
    '--fb-dot-b-fg': theme.dotBFg,
    '--fb-dot-b-border': theme.dotBBorder,
  };
  const dragStartedRef = useRef(false);
  const [localLineupA, setLocalLineupA] = useState(match.lineupA);
  const [localLineupB, setLocalLineupB] = useState(match.lineupB);

  useEffect(() => {
    setLocalLineupA(match.lineupA);
    setLocalLineupB(match.lineupB);
    dragStartedRef.current = false;
  }, [match.id, match.lineupA, match.lineupB]);

  const getPositionFor = (player, idx, side) => {
    // Keep a stable tactical layout by slot index.
    // This avoids broken/stale saved coordinates pushing players out of the pitch.
    return side === 'a' ? LEFT_POSITIONS[idx] : RIGHT_POSITIONS[idx];
  };

  const onTapPlayer = (player, position, side, slotIndex) => {
    if (player.placeholder || String(player.id).startsWith('missing-')) {
      window.dispatchEvent(new CustomEvent('torneo:add-player', {
        detail: {
          suggestedName: '',
          matchId: match.id,
          side,
          slotIndex,
          x: position?.x ?? null,
          y: position?.y ?? null,
        },
      }));
      return;
    }
    if (dragStartedRef.current) return;
    window.dispatchEvent(new CustomEvent('torneo:edit-player', {
      detail: { playerId: player.id, matchId: match.id, side, slotIndex },
    }));
  };

  return html`
    <div className="fb-pitch-wrap" style=${themeStyle}>
      <div className="fb-pitch">
        <div className="fb-half-line"></div>
        <div className="fb-center-circle"></div>
        <div className="fb-area fb-area-left"></div>
        <div className="fb-area fb-area-right"></div>
        <div className="fb-goal fb-goal-left"></div>
        <div className="fb-goal fb-goal-right"></div>
        ${localLineupA.map((player, idx) => html`
          <${PlayerBadge}
            key=${`a-${player.id}-${idx}`}
            player=${player}
            position=${getPositionFor(player, idx, 'a')}
            side="a"
            slotIndex=${idx}
            onTap=${onTapPlayer}
          />
        `)}
        ${localLineupB.map((player, idx) => html`
          <${PlayerBadge}
            key=${`b-${player.id}-${idx}`}
            player=${player}
            position=${getPositionFor(player, idx, 'b')}
            side="b"
            slotIndex=${idx}
            onTap=${onTapPlayer}
          />
        `)}
      </div>
      <div className="fb-pitch-teams">
        <div className="fb-team-name">${match.teamA}</div>
        <div className="fb-team-name fb-team-name-right">${match.teamB}</div>
      </div>
      <div className="fb-lineups">
        <${TeamLineupList} title=${match.teamA} players=${localLineupA} matchId=${match.id} side="a" defaults=${LEFT_POSITIONS} />
        <${TeamLineupList} title=${match.teamB} players=${localLineupB} matchId=${match.id} side="b" defaults=${RIGHT_POSITIONS} />
      </div>
    </div>
  `;
}

function ScoreEditor({ match, onSaved, onError, onRenameTeam, top = false }) {
  const [scoreA, setScoreA] = useState(String(match.scoreA));
  const [scoreB, setScoreB] = useState(String(match.scoreB));
  const [saveState, setSaveState] = useState('idle');
  const lastSavedRef = useRef({ matchId: match.id, scoreA: Number(match.scoreA) || 0, scoreB: Number(match.scoreB) || 0 });
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(null);

  const parseScore = (value) => Math.max(0, Number(String(value || '').replace(/[^\d-]/g, '')) || 0);

  const saveScores = async (nextScoreA, nextScoreB) => {
    const a = Math.max(0, Number(nextScoreA) || 0);
    const b = Math.max(0, Number(nextScoreB) || 0);
    const last = lastSavedRef.current;
    if (last.matchId === match.id && last.scoreA === a && last.scoreB === b) {
      setSaveState('saved');
      return;
    }
    if (savingRef.current) {
      pendingSaveRef.current = { scoreA: a, scoreB: b };
      return;
    }

    savingRef.current = true;
    setSaveState('saving');
    try {
      const payload = await api(`/matches/${match.id}`, {
        method: 'PATCH',
        body: { scoreA: a, scoreB: b },
      });
      lastSavedRef.current = { matchId: match.id, scoreA: a, scoreB: b };
      onSaved(payload.matches || []);
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      onError(err?.message || 'Errore salvataggio risultato');
    } finally {
      savingRef.current = false;
      const pending = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (pending) saveScores(pending.scoreA, pending.scoreB);
    }
  };

  useEffect(() => {
    setScoreA(String(match.scoreA));
    setScoreB(String(match.scoreB));
    setSaveState('saved');
    lastSavedRef.current = { matchId: match.id, scoreA: Number(match.scoreA) || 0, scoreB: Number(match.scoreB) || 0 };
    pendingSaveRef.current = null;
  }, [match.id, match.scoreA, match.scoreB]);

  useEffect(() => {
    const saveAfterDelay = window.setTimeout(() => {
      saveScores(parseScore(scoreA), parseScore(scoreB));
    }, 360);
    return () => window.clearTimeout(saveAfterDelay);
  }, [scoreA, scoreB, match.id]);

  const updateTeamScore = (side, diff) => {
    if (side === 'a') {
      const next = Math.max(0, parseScore(scoreA) + diff);
      setScoreA(String(next));
      return;
    }
    const next = Math.max(0, parseScore(scoreB) + diff);
    setScoreB(String(next));
  };

  const renameTeam = (side) => {
    if (typeof onRenameTeam !== 'function') return;
    const currentName = side === 'a' ? match.teamA : match.teamB;
    onRenameTeam(match.id, side, currentName);
  };

  return html`
    <div className=${`fb-score-editor${top ? ' fb-score-editor-top' : ''}`}>
      <div className="fb-score-fields">
        <label className="fb-score-row">
          <button type="button" className="fb-score-team fb-score-team-btn" onClick=${() => renameTeam('a')}>
            ${match.teamA}
          </button>
          <div className="fb-counter-input-wrap">
            <button type="button" className="fb-counter-btn" onClick=${() => updateTeamScore('a', -1)}>-</button>
            <input
              type="number"
              min="0"
              value=${scoreA}
              onInput=${(e) => setScoreA(String(e.currentTarget.value || '').replace(/[^\d]/g, ''))}
              onBlur=${() => setScoreA(String(parseScore(scoreA)))}
            />
            <button type="button" className="fb-counter-btn" onClick=${() => updateTeamScore('a', 1)}>+</button>
          </div>
        </label>
        <span className="fb-score-sep" aria-hidden="true">:</span>
        <label className="fb-score-row fb-score-row-right">
          <button type="button" className="fb-score-team fb-score-team-right fb-score-team-btn" onClick=${() => renameTeam('b')}>
            ${match.teamB}
          </button>
          <div className="fb-counter-input-wrap">
            <button type="button" className="fb-counter-btn" onClick=${() => updateTeamScore('b', -1)}>-</button>
            <input
              type="number"
              min="0"
              value=${scoreB}
              onInput=${(e) => setScoreB(String(e.currentTarget.value || '').replace(/[^\d]/g, ''))}
              onBlur=${() => setScoreB(String(parseScore(scoreB)))}
            />
            <button type="button" className="fb-counter-btn" onClick=${() => updateTeamScore('b', 1)}>+</button>
          </div>
        </label>
      </div>
      <div className="fb-score-autosave">
        ${saveState === 'saving' ? 'Salvataggio automatico...' : (saveState === 'error' ? 'Errore salvataggio' : 'Auto-save attivo')}
      </div>
    </div>
  `;
}

function MatchTimerApp() {
  const initial = window.__TORNEO_LAST_SYNC__ || null;
  const [context, setContext] = useState(initial);
  const [matches, setMatches] = useState(Array.isArray(initial?.matches) ? initial.matches.map(normalizeMatch) : []);
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [timerSeconds, setTimerSeconds] = useState(2700);
  const [timerInput, setTimerInput] = useState('45:00');
  const [running, setRunning] = useState(false);
  const [alarmOn, setAlarmOn] = useState(false);
  const alarmIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const tournamentId = context?.tournamentId || null;
  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0] || null;
  const timerStorageKey = `torneo:match-timer:${selectedMatch?.id || 'global'}`;

  const stopAlarm = () => {
    setAlarmOn(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const beep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new window.AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 980;
      gain.gain.value = 0.24;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {}
  };

  const startAlarm = () => {
    if (alarmIntervalRef.current) return;
    setAlarmOn(true);
    beep();
    alarmIntervalRef.current = window.setInterval(beep, 700);
  };

  const loadForMatch = (matchId) => {
    const key = `torneo:match-timer:${matchId || 'global'}`;
    const stored = window.localStorage.getItem(key);
    const value = stored == null ? 2700 : Math.max(0, Number(stored) || 0);
    setTimerSeconds(value);
    setTimerInput(formatClock(value));
  };

  useEffect(() => {
    const onSync = (event) => {
      const detail = event?.detail || null;
      if (!detail?.tournamentId) return;
      setContext(detail);
      const normalized = Array.isArray(detail.matches) ? detail.matches.map(normalizeMatch) : [];
      setMatches(normalized);
      setSelectedMatchId((curr) => (normalized.some((m) => m.id === curr) ? curr : (normalized[0]?.id || '')));
    };
    window.addEventListener('torneo:field-board-sync', onSync);
    return () => window.removeEventListener('torneo:field-board-sync', onSync);
  }, []);

  useEffect(() => {
    const id = selectedMatch?.id || 'global';
    loadForMatch(id);
    setRunning(false);
    stopAlarm();
  }, [selectedMatch?.id]);

  useEffect(() => {
    window.localStorage.setItem(timerStorageKey, String(Math.max(0, Number(timerSeconds) || 0)));
  }, [timerSeconds, timerStorageKey]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setTimerSeconds((value) => {
        if (value <= 0) return 0;
        const next = value - 1;
        if (next <= 0) {
          setRunning(false);
          startAlarm();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => () => {
    stopAlarm();
  }, []);

  const applyTimerInput = () => {
    const next = parseClock(timerInput);
    stopAlarm();
    setRunning(false);
    setTimerSeconds(next);
    setTimerInput(formatClock(next));
  };

  const setTimer = (nextValue) => {
    const safe = Math.max(0, Math.min(5999, Number(nextValue) || 0));
    setTimerSeconds(safe);
    setTimerInput(formatClock(safe));
  };

  const adjustTimer = (deltaSeconds) => {
    stopAlarm();
    setRunning(false);
    setTimer(timerSeconds + deltaSeconds);
  };

  if (!tournamentId) {
    return html`<p className="fb-empty">Seleziona un torneo per usare il timer partita.</p>`;
  }

  return html`
    <div className="mtimer-wrap">
      <div className="mtimer-head">
        <div className="mtimer-kicker">Timer partita</div>
        <h3 className="mtimer-title">Countdown gara</h3>
      </div>
      <div className="mtimer-meta">
        <label className="fb-select-wrap">
          Partita collegata
          <select
            value=${selectedMatch?.id || ''}
            onChange=${(e) => setSelectedMatchId(String(e.currentTarget.value || ''))}
          >
            ${matches.map((item) => html`
              <option key=${item.id} value=${item.id}>
                ${item.label} · ${item.teamA} vs ${item.teamB}
              </option>
            `)}
          </select>
        </label>
      </div>
      <div className=${`mtimer-display${alarmOn ? ' is-alarm' : ''}`}>
        <input
          type="text"
          className="mtimer-display-input"
          value=${timerInput}
          onInput=${(e) => setTimerInput(String(e.currentTarget.value || '').replace(/[^\d:]/g, '').slice(0, 5))}
          onBlur=${applyTimerInput}
          onKeyDown=${(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyTimerInput();
            }
          }}
        />
      </div>
      <div className="mtimer-controls">
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(-30)}>-30s</button>
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(-60)}>-1m</button>
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(-300)}>-5m</button>
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(-600)}>-10m</button>
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(30)}>+30s</button>
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(60)}>+1m</button>
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(300)}>+5m</button>
        <button type="button" className="fb-counter-btn mtimer-btn" onClick=${() => adjustTimer(600)}>+10m</button>
      </div>
      <div className="mtimer-primary">
        <button
          type="button"
          className=${`fb-btn mtimer-btn-main ${running ? 'is-running' : 'is-ready'}`}
          onClick=${() => { stopAlarm(); setRunning((v) => !v); }}
        >
          <span className="mtimer-btn-icon" aria-hidden="true">
            ${running
              ? html`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.8" height="14" rx="1.1"></rect><rect x="13.2" y="5" width="4.8" height="14" rx="1.1"></rect></svg>`
              : html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2c0-.9 1-.5 1.6-.1l8 5.4c.6.4.6 1.3 0 1.7l-8 5.4c-.7.4-1.6.8-1.6-.1V5.2z"></path></svg>`}
          </span>
          <span>${running ? 'Stop' : 'Start'}</span>
        </button>
        <button type="button" className="fb-btn mtimer-btn-reset" onClick=${() => { stopAlarm(); setRunning(false); setTimer(0); }}>
          <span className="mtimer-btn-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20 12a8 8 0 1 1-2.4-5.6"></path>
              <path d="M20 4v5h-5"></path>
            </svg>
          </span>
          <span>Azzera</span>
        </button>
      </div>
      <div className="mtimer-actions">
        ${alarmOn ? html`<button type="button" className="fb-btn mtimer-btn-secondary" onClick=${stopAlarm}>Stop suono</button>` : null}
      </div>
    </div>
  `;
}

function FieldBoardApp() {
  const initial = window.__TORNEO_LAST_SYNC__ || null;
  const [context, setContext] = useState(initial);
  const [matches, setMatches] = useState(Array.isArray(initial?.matches) ? initial.matches.map(normalizeMatch) : []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [missingPlayersModal, setMissingPlayersModal] = useState(null);

  const tournamentId = context?.tournamentId || null;

  const loadBracket = async (nextTournamentId) => {
    if (!nextTournamentId) return;
    setLoading(true);
    setError('');
    try {
      const payload = await api(`/tournaments/${nextTournamentId}/bracket`);
      const normalized = Array.isArray(payload.matches) ? payload.matches.map(normalizeMatch) : [];
      setMatches(normalized);
      setSelectedIndex((idx) => Math.max(0, Math.min(idx, Math.max(0, normalized.length - 1))));
    } catch (err) {
      setError(err?.message || 'Errore caricamento partite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onSync = (event) => {
      const detail = event?.detail || null;
      if (!detail?.tournamentId) return;
      setContext(detail);
      if (Array.isArray(detail.matches) && detail.matches.length) {
        const normalized = detail.matches.map(normalizeMatch);
        setMatches(normalized);
        setSelectedIndex((idx) => Math.max(0, Math.min(idx, Math.max(0, normalized.length - 1))));
      } else {
        loadBracket(detail.tournamentId);
      }
    };
    window.addEventListener('torneo:field-board-sync', onSync);
    return () => window.removeEventListener('torneo:field-board-sync', onSync);
  }, []);

  useEffect(() => {
    if (!tournamentId) return;
    if (!matches.length) loadBracket(tournamentId);
  }, [tournamentId]);

  const match = matches[selectedIndex] || null;
  const translate = useMemo(() => `${-selectedIndex * 100}%`, [selectedIndex]);

  const broadcast = (updatedMatches) => {
    const normalized = Array.isArray(updatedMatches) ? updatedMatches.map(normalizeMatch) : [];
    setMatches(normalized);
    const nextIndex = Math.max(0, Math.min(selectedIndex, Math.max(0, normalized.length - 1)));
    setSelectedIndex(nextIndex);
    if (tournamentId) {
      window.dispatchEvent(new CustomEvent('torneo:matches-updated', {
        detail: { tournamentId, matches: normalized },
      }));
    }
  };

  const renameTeamForMatch = async (matchId, side, currentName = '') => {
    const askTextInput = window.__TORNEO_OPEN_TEXT_INPUT__;
    if (typeof askTextInput !== 'function') {
      setError('Modale input non disponibile');
      return;
    }
    const next = await askTextInput({
      title: 'Rinomina squadra',
      message: 'Inserisci il nuovo nome squadra.',
      initialValue: String(currentName || ''),
      confirmLabel: 'Salva',
      placeholder: 'Nome squadra',
    });
    if (!next?.confirmed) return;
    const clean = sanitizeName(next.value) || currentName;
    if (!clean || clean === currentName) return;
    try {
      const payload = await api(`/matches/${matchId}`, {
        method: 'PATCH',
        body: side === 'a' ? { teamA: clean } : { teamB: clean },
      });
      broadcast(payload.matches || []);
    } catch (err) {
      setError(err?.message || 'Errore rinomina squadra');
    }
  };

  const runAutoLineups = async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError('');
    setMissingPlayersModal(null);
    try {
      const payload = await api(`/tournaments/${tournamentId}/bracket/auto-lineups`, { method: 'POST' });
      broadcast(payload.matches || []);
    } catch (err) {
      const missingPlayers = Number(err?.missingPlayers);
      if (err?.code === 'INSUFFICIENT_PLAYERS' && Number.isFinite(missingPlayers) && missingPlayers > 0) {
        setMissingPlayersModal({ missingPlayers });
      } else {
        setError(err?.message || 'Errore sorteggio formazioni');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tournamentId) {
    return html`<p className="fb-empty">Seleziona un torneo per vedere il campo interattivo.</p>`;
  }

  return html`
    <div>
      ${error ? html`<div className="fb-alert">${error}</div>` : null}
      ${missingPlayersModal ? html`
        <div className="fixed inset-0 z-[75]">
          <div className="modal-scrim" onClick=${() => setMissingPlayersModal(null)}></div>
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="bezel-shell w-full max-w-xl">
              <div className="bezel-core p-5 sm:p-6">
                <h3 className="font-serif text-2xl">Giocatori insufficienti</h3>
                <p className="mt-2 text-sm text-muted">
                  Mancano ${missingPlayersModal.missingPlayers} giocatori per calcolare le formazioni automatiche.
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="cta-primary cta-sm"
                    onClick=${() => setMissingPlayersModal(null)}
                  >
                    <span>Ho capito</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : null}
      <div className="fb-toolbar">
        <label className="fb-select-wrap">
          Partita
          <select
            value=${String(selectedIndex)}
            onChange=${(e) => setSelectedIndex(Number(e.currentTarget.value) || 0)}
          >
            ${matches.map((item, idx) => html`
              <option key=${item.id} value=${String(idx)}>
                ${item.label} · ${item.teamA} vs ${item.teamB}
              </option>
            `)}
          </select>
        </label>
        <div className="fb-nav">
          <button type="button" className="fb-btn" onClick=${() => setSelectedIndex((idx) => Math.max(0, idx - 1))} disabled=${selectedIndex === 0}>←</button>
          <button type="button" className="fb-btn" onClick=${() => setSelectedIndex((idx) => Math.min(matches.length - 1, idx + 1))} disabled=${selectedIndex >= matches.length - 1}>→</button>
        </div>
      </div>
      ${loading && !matches.length ? html`<p className="fb-empty">Caricamento partite...</p>` : null}
      ${!loading && !matches.length ? html`<p className="fb-empty">Nessuna partita disponibile.</p>` : null}

      ${matches.length ? html`
        <div className="fb-carousel">
          <div className="fb-track" style=${{ transform: `translateX(${translate})` }}>
            ${matches.map((item) => {
              const theme = MATCH_THEMES[item.themeIndex % MATCH_THEMES.length] || MATCH_THEMES[0];
              return html`
              <article key=${item.id} className="fb-slide" style=${{ '--fb-slide-bg': theme.slideBg }}>
                <div className="fb-match-meta">
                  <div className="fb-match-title">${item.label}</div>
                  <div className="fb-match-sub">
                    ${prettyStage(item.stage)} · ${item.status === 'completed' ? 'Conclusa' : 'Da giocare'}
                    ${item.winner ? html`<span className="fb-winner">Vincitore: ${item.winner}</span>` : null}
                  </div>
                </div>
                <${ScoreEditor}
                  match=${item}
                  onSaved=${broadcast}
                  onError=${(message) => setError(message)}
                  onRenameTeam=${renameTeamForMatch}
                  top=${true}
                />
                <${PitchBoard} match=${item} />
                <div className="fb-slide-actions">
                  <button type="button" className="fb-btn fb-btn-mini" onClick=${runAutoLineups} disabled=${loading}>
                    Calcola formazioni automatiche
                  </button>
                </div>
              </article>
            `;
            })}
          </div>
        </div>
      ` : null}
    </div>
  `;
}

const mount = document.getElementById('fieldBoardRoot');
if (mount) {
  createRoot(mount).render(html`<${FieldBoardApp} />`);
}

const timerMount = document.getElementById('matchTimerRoot');
if (timerMount) {
  createRoot(timerMount).render(html`<${MatchTimerApp} />`);
}

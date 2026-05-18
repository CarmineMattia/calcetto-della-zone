(() => {
  'use strict';

  const API_BASE = 'http://localhost:3100/api';
  window.__TORNEO_API_BASE__ = API_BASE;
  const DEFAULT_TEAM_COUNT = 4;
  const ALLOWED_TEAM_COUNTS = [4];
  const PLAYERS_PER_TEAM = 5;
  const SCORE_MAX = 100;
  const SCORE_DEFAULT = 85;
  const DEFAULT_FLAG_CODE = 'IT';
  const PITCH_LEFT_POSITIONS = [
    { x: 10, y: 50 },
    { x: 26, y: 28 },
    { x: 26, y: 72 },
    { x: 42, y: 38 },
    { x: 42, y: 62 },
  ];
  const PITCH_RIGHT_POSITIONS = [
    { x: 90, y: 50 },
    { x: 74, y: 28 },
    { x: 74, y: 72 },
    { x: 58, y: 38 },
    { x: 58, y: 62 },
  ];
  const ROLES = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
  const ROLE_ABBR = {
    Portiere: 'gk',
    Difensore: 'df',
    Centrocampista: 'mf',
    Attaccante: 'fw',
  };

  const FLAGS = [
    // Europe
    { code: 'AL', name: 'Albania' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaigian' },
    { code: 'BE', name: 'Belgio' },
    { code: 'BA', name: 'Bosnia ed Erzegovina' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BY', name: 'Bielorussia' },
    { code: 'CY', name: 'Cipro' },
    { code: 'HR', name: 'Croazia' },
    { code: 'DK', name: 'Danimarca' },
    { code: 'EE', name: 'Estonia' },
    { code: 'FI', name: 'Finlandia' },
    { code: 'FR', name: 'Francia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germania' },
    { code: 'GR', name: 'Grecia' },
    { code: 'IE', name: 'Irlanda' },
    { code: 'IS', name: 'Islanda' },
    { code: 'IT', name: 'Italia' },
    { code: 'LV', name: 'Lettonia' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lituania' },
    { code: 'LU', name: 'Lussemburgo' },
    { code: 'MT', name: 'Malta' },
    { code: 'MD', name: 'Moldavia' },
    { code: 'MC', name: 'Monaco' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MK', name: 'Macedonia del Nord' },
    { code: 'NO', name: 'Norvegia' },
    { code: 'NL', name: 'Paesi Bassi' },
    { code: 'PL', name: 'Polonia' },
    { code: 'PT', name: 'Portogallo' },
    { code: 'CZ', name: 'Repubblica Ceca' },
    { code: 'RO', name: 'Romania' },
    { code: 'GB', name: 'Regno Unito' },
    { code: 'RU', name: 'Russia' },
    { code: 'SM', name: 'San Marino' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SK', name: 'Slovacchia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'ES', name: 'Spagna' },
    { code: 'SE', name: 'Svezia' },
    { code: 'CH', name: 'Svizzera' },
    { code: 'TR', name: 'Turchia' },
    { code: 'UA', name: 'Ucraina' },
    { code: 'HU', name: 'Ungheria' },
    { code: 'VA', name: 'Vaticano' },

    // Africa
    { code: 'DZ', name: 'Algeria' },
    { code: 'AO', name: 'Angola' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CM', name: 'Camerun' },
    { code: 'CV', name: 'Capo Verde' },
    { code: 'TD', name: 'Ciad' },
    { code: 'KM', name: 'Comore' },
    { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'RD Congo' },
    { code: 'CI', name: "Costa d'Avorio" },
    { code: 'DJ', name: 'Gibuti' },
    { code: 'EG', name: 'Egitto' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Etiopia' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GQ', name: 'Guinea Equatoriale' },
    { code: 'KE', name: 'Kenya' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libia' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'ML', name: 'Mali' },
    { code: 'MA', name: 'Marocco' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MZ', name: 'Mozambico' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'CF', name: 'Rep. Centrafricana' },
    { code: 'RW', name: 'Ruanda' },
    { code: 'ST', name: 'Sao Tome e Principe' },
    { code: 'SN', name: 'Senegal' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'Sudafrica' },
    { code: 'SS', name: 'Sud Sudan' },
    { code: 'SD', name: 'Sudan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TG', name: 'Togo' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'UG', name: 'Uganda' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },

    // Others
    { code: 'AR', name: 'Argentina' },
    { code: 'BR', name: 'Brasile' },
    { code: 'US', name: 'Stati Uniti' },
  ];
  const FLAGS_BY_CODE = Object.fromEntries(FLAGS.map((f) => [f.code, f]));
  const PITCH_SELECT_NEW_ID = '__pitch-new-player__';

  const state = {
    currentId: null,
    tournaments: [],
    current: null,
    snapshots: [],
    snapshotVersion: null,
    snapshotDetail: null,
    duplicateResolver: null,
    duplicateSelectedProfileId: null,
    pitchSelectResolver: null,
    pitchSelectAvailable: [],
    pitchSelectFiltered: [],
    pitchSelectSelectedId: null,
    pitchSelectQuery: '',
    confirmResolver: null,
    textInputResolver: null,
    pendingPitchInsert: null,
    pendingPitchRemoval: null,
    selectedPlayerIds: [],
    flagFiltered: [],
    flagActiveIndex: -1,
  };

  const editing = {
    id: null,
    roles: [],
    flagCode: null,
    techDetails: null,
    goals: 0,
    assists: 0,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const refs = {
    heroEdition: $('#heroEdition'),
    rosterGrid: $('#rosterGrid'),
    rosterEmpty: $('#rosterEmpty'),
    rosterCount: $('#rosterCount'),
    rosterMax: $('#rosterMax'),
    completeCount: $('#completeCount'),
    heroPlayersChip: $('#heroPlayersChip'),
    heroPlayersValue: $('#heroPlayersValue'),
    heroPlayersLabel: $('#heroPlayersLabel'),
    standingsList: $('#standingsList'),
    navSchede: $('#navSchede'),
    navClassifiche: $('#navClassifiche'),
    navTabellone: $('#navTabellone'),
    navTimer: $('#navTimer'),
    btnHamburger: $('#btnHamburger'),
    sideMenu: $('#sideMenu'),
    sideMenuBackdrop: $('#sideMenuBackdrop'),
    sideMenuClose: $('#sideMenuClose'),
    btnMenuRename: $('#btnMenuRename'),
    btnMenuArchive: $('#btnMenuArchive'),
    btnMenuHistory: $('#btnMenuHistory'),
    btnMenuNewTournament: $('#btnMenuNewTournament'),

    quickMyName: $('#quickMyName'),
    btnAddMyName: $('#btnAddMyName'),
    bulkInput: $('#bulkInput'),
    bulkPreview: $('#bulkPreview'),
    btnBulkAdd: $('#btnBulkAdd'),
    btnAddOne: $('#btnAddOne'),
    btnGenerate: $('#btnGenerate'),
    btnDeleteSelected: $('#btnDeleteSelected'),
    btnDeleteAllPlayers: $('#btnDeleteAllPlayers'),
    generatorStatusText: $('#generatorStatusText'),
    teamsOutput: $('#teamsOutput'),
    teamsGrid: $('#teamsGrid'),
    balanceBars: $('#balanceBars'),
    stdTec: $('#stdTec'),
    stdFis: $('#stdFis'),
    btnResetBracket: $('#btnResetBracket'),

    tournamentDropdownBtn: $('#tournamentDropdownBtn'),
    tournamentDropdown: $('#tournamentDropdown'),
    tournamentList: $('#tournamentList'),
    currentTournamentName: $('#currentTournamentName'),
    currentTournamentDate: $('#currentTournamentDate'),
    btnArchive: $('#btnArchive'),
    btnHistory: $('#btnHistory'),
    btnNewTournament: $('#btnNewTournament'),
    btnNewTournamentTopbar: $('#btnNewTournamentTopbar'),
    btnRename: $('#btnRename'),
    btnExport: $('#btnExport'),
    fileImport: $('#fileImport'),
    btnClearAll: $('#btnClearAll'),
    snapshotList: $('#snapshotList'),
    snapshotEmpty: $('#snapshotEmpty'),
    snapshotDetail: $('#snapshotDetail'),

    modal: $('#playerModal'),
    modalSubtitle: $('#modalSubtitle'),
    modalTitle: $('#modalTitle'),
    fieldName: $('#fieldName'),
    fieldAge: $('#fieldAge'),
    fieldNationality: $('#fieldNationality'),
    flagPreview: $('#flagPreview'),
    flagName: $('#flagName'),
    flagPicker: $('#flagPicker'),
    flagSearch: $('#flagSearch'),
    flagList: $('#flagList'),
    fieldTec: $('#fieldTec'),
    fieldFis: $('#fieldFis'),
    tecValue: $('#tecValue'),
    fisValue: $('#fisValue'),
    tecTier: $('#tecTier'),
    fisTier: $('#fisTier'),
    overallValue: $('#overallValue'),
    overallTier: $('#overallTier'),
    roleGroup: $('#roleGroup'),
    formError: $('#formError'),
    btnSavePlayer: $('#btnSavePlayer'),
    btnDeletePlayer: $('#btnDeletePlayer'),
    btnDeletePlayerLabel: $('#btnDeletePlayerLabel'),
    btnToggleDetails: $('#btnToggleDetails'),
    techDetailsPanel: $('#techDetailsPanel'),
    fieldDetailSpeed: $('#fieldDetailSpeed'),
    fieldDetailPassing: $('#fieldDetailPassing'),
    fieldDetailPhysical: $('#fieldDetailPhysical'),
    fieldDetailDefense: $('#fieldDetailDefense'),
    detailSpeedValue: $('#detailSpeedValue'),
    detailPassingValue: $('#detailPassingValue'),
    detailPhysicalValue: $('#detailPhysicalValue'),
    detailDefenseValue: $('#detailDefenseValue'),
    btnGoalsMinus: $('#btnGoalsMinus'),
    btnGoalsPlus: $('#btnGoalsPlus'),
    btnAssistsMinus: $('#btnAssistsMinus'),
    btnAssistsPlus: $('#btnAssistsPlus'),
    fieldGoals: $('#fieldGoals'),
    fieldAssists: $('#fieldAssists'),
    goalsBox: $('#goalsBox'),
    assistsBox: $('#assistsBox'),

    duplicateModal: $('#duplicateModal'),
    duplicateList: $('#duplicateList'),
    btnDuplicateCancel: $('#btnDuplicateCancel'),
    btnDuplicateNew: $('#btnDuplicateNew'),
    btnDuplicateReuse: $('#btnDuplicateReuse'),
    pitchSelectModal: $('#pitchSelectModal'),
    pitchSelectTitle: $('#pitchSelectTitle'),
    pitchSelectSearch: $('#pitchSelectSearch'),
    pitchSelectList: $('#pitchSelectList'),
    pitchSelectEmpty: $('#pitchSelectEmpty'),
    btnPitchSelectCancel: $('#btnPitchSelectCancel'),
    btnPitchSelectNew: $('#btnPitchSelectNew'),
    btnPitchSelectUse: $('#btnPitchSelectUse'),
    confirmModal: $('#confirmModal'),
    confirmTitle: $('#confirmTitle'),
    confirmMessage: $('#confirmMessage'),
    btnConfirmCancel: $('#btnConfirmCancel'),
    btnConfirmOk: $('#btnConfirmOk'),
    textInputModal: $('#textInputModal'),
    textInputTitle: $('#textInputTitle'),
    textInputMessage: $('#textInputMessage'),
    textInputField: $('#textInputField'),
    btnTextInputCancel: $('#btnTextInputCancel'),
    btnTextInputOk: $('#btnTextInputOk'),
    toast: $('#toast'),
  };

  async function api(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {}
      throw new Error(message);
    }
    return res.json();
  }

  function getCurrent() {
    return state.current;
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  function isMultilineTarget(target) {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return tag === 'textarea' || target.isContentEditable;
  }

  function isVisible(el) {
    return !!el && !el.classList.contains('hidden');
  }

  function getNextIndex(length, currentIndex, delta) {
    if (!length) return -1;
    const base = Number.isInteger(currentIndex) ? currentIndex : 0;
    const normalized = ((base + delta) % length + length) % length;
    return normalized;
  }

  function focusListActiveItem(selector, root) {
    const active = root?.querySelector(selector);
    active?.scrollIntoView({ block: 'nearest' });
  }

  function getTeamCount() {
    const n = Number(getCurrent()?.teamCount);
    return ALLOWED_TEAM_COUNTS.includes(n) ? n : DEFAULT_TEAM_COUNT;
  }

  function getTournamentSize() {
    return getTeamCount() * PLAYERS_PER_TEAM;
  }

  function getPlayers() {
    return Array.isArray(getCurrent()?.players) ? getCurrent().players : [];
  }

  function sameId(a, b) {
    return String(a ?? '') === String(b ?? '');
  }

  function isPlayerComplete(p) {
    return !!(p && p.name && Array.isArray(p.roles) && p.roles.length && p.tec >= 1 && p.fis >= 1);
  }

  function renderFlagSvg(code, className = '') {
    const safe = String(code || '').toUpperCase();
    if (!safe || !FLAGS_BY_CODE[safe]) return `<span class="${className} flag-fallback"></span>`;
    return `<img class="${className}" src="https://flagcdn.com/${safe.toLowerCase()}.svg" alt="" loading="lazy" decoding="async" />`;
  }

  function sanitizePlayerName(raw) {
    return String(raw || '')
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/[@#*_+=~^`|\\/<>{}\[\]$%&!?"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 32);
  }

  function normalizeNameForDuplicate(raw) {
    return String(raw || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function expandNameWithCount(rawEntry) {
    const cleaned = String(rawEntry || '').trim();
    if (!cleaned) return [];
    const plusMatch = cleaned.match(/^(.*?)(?:\s*\+\s*(\d{1,2}))$/);
    const base = sanitizePlayerName(plusMatch ? plusMatch[1] : cleaned);
    if (!base) return [];
    const extra = plusMatch ? clamp(parseInt(plusMatch[2], 10), 0, 20) : 0;
    const out = [base];
    for (let i = 1; i <= extra; i++) out.push(`${base} (${i})`);
    return out;
  }

  function parsePastedNames(raw) {
    return String(raw || '')
      .split(/[\n,;\t]/g)
      .flatMap(expandNameWithCount)
      .filter(Boolean);
  }

  function getCandidateNamesFromInputs() {
    const fromBulk = parsePastedNames(refs.bulkInput?.value || '');
    if (fromBulk.length) return fromBulk;
    return expandNameWithCount(refs.quickMyName?.value || '');
  }

  function toast(msg) {
    refs.toast.textContent = msg;
    refs.toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => refs.toast.classList.add('hidden'), 2400);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function normalizeScore(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const legacyAdjusted = parsed > 0 && parsed <= 5 ? parsed * 20 : parsed;
    return Math.round(clamp(legacyAdjusted, 0, SCORE_MAX));
  }

  function normalizePlayerBaseScore(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return SCORE_DEFAULT;
    return normalizeScore(parsed, SCORE_DEFAULT);
  }

  function avg(arr) {
    return arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0;
  }

  function stddev(arr) {
    if (arr.length < 2) return 0;
    const m = avg(arr);
    return Math.sqrt(avg(arr.map((x) => (x - m) ** 2)));
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function scoreToSliderColor(score) {
    const s = normalizeScore(score, SCORE_DEFAULT);
    if (s < 60) return '#a8a29e'; // scarso
    if (s < 70) return '#b57f50'; // bronzo
    if (s < 80) return '#9ca3af'; // silver
    return '#d4af37'; // oro
  }

  function getTierMeta(score) {
    const s = normalizeScore(score, SCORE_DEFAULT);
    if (s < 60) return { key: 'scarso', label: 'Scarsino' };
    if (s < 70) return { key: 'sufficiente', label: 'Sufficiente' };
    if (s < 80) return { key: 'ok', label: 'Ok' };
    if (s < 90) return { key: 'ottimo', label: 'Ottimo' };
    return { key: 'top-player', label: 'Top player' };
  }

  function setTierBadge(el, score) {
    if (!el) return;
    const tier = getTierMeta(score);
    el.textContent = tier.label;
    el.dataset.tier = tier.key;
  }

  function computeOverallFromModal() {
    const tec = normalizeScore(refs.fieldTec?.value, SCORE_DEFAULT);
    const fis = normalizeScore(refs.fieldFis?.value, SCORE_DEFAULT);
    const base = avg([tec, fis]);
    const detailsExpanded = !refs.techDetailsPanel.classList.contains('hidden');
    const detailAvg = detailsExpanded
      ? avg([
        normalizeScore(refs.fieldDetailSpeed?.value, SCORE_DEFAULT),
        normalizeScore(refs.fieldDetailPassing?.value, SCORE_DEFAULT),
        normalizeScore(refs.fieldDetailPhysical?.value, SCORE_DEFAULT),
        normalizeScore(refs.fieldDetailDefense?.value, SCORE_DEFAULT),
      ])
      : base;
    const productionBonus = clamp((editing.goals * 1.2) + (editing.assists * 0.8), 0, 8);
    return Math.round(clamp((base * 0.62) + (detailAvg * 0.30) + productionBonus, 0, SCORE_MAX));
  }

  function computePlayerOverall(player) {
    const tec = normalizePlayerBaseScore(player?.tec);
    const fis = normalizePlayerBaseScore(player?.fis);
    const base = avg([tec, fis]);
    const details = player?.techDetails || null;
    const detailAvg = details
      ? avg([
        normalizePlayerBaseScore(details.speed),
        normalizePlayerBaseScore(details.passing),
        normalizePlayerBaseScore(details.physical),
        normalizePlayerBaseScore(details.defense),
      ])
      : base;
    const goals = Math.max(0, Number(player?.goals) || 0);
    const assists = Math.max(0, Number(player?.assists) || 0);
    const productionBonus = clamp((goals * 1.2) + (assists * 0.8), 0, 8);
    return Math.round(clamp((base * 0.62) + (detailAvg * 0.30) + productionBonus, 0, SCORE_MAX));
  }

  function syncModalRatings() {
    const tec = normalizeScore(refs.fieldTec?.value, SCORE_DEFAULT);
    const fis = normalizeScore(refs.fieldFis?.value, SCORE_DEFAULT);
    refs.tecValue.textContent = String(tec);
    refs.fisValue.textContent = String(fis);
    setTierBadge(refs.tecTier, tec);
    setTierBadge(refs.fisTier, fis);
    syncRatingSlider(refs.fieldTec);
    syncRatingSlider(refs.fieldFis);
    const overall = computeOverallFromModal();
    if (refs.overallValue) refs.overallValue.textContent = String(overall);
    setTierBadge(refs.overallTier, overall);
    syncGoalAssistBoxes();
  }

  function syncGoalAssistBoxes() {
    const goals = Math.max(0, Number(editing.goals) || 0);
    const assists = Math.max(0, Number(editing.assists) || 0);
    refs.goalsBox?.classList.toggle('is-active', goals > 0);
    refs.assistsBox?.classList.toggle('is-active', assists > 0);
  }

  function syncRatingSlider(slider) {
    if (!slider) return;
    const score = normalizeScore(slider.value, SCORE_DEFAULT);
    slider.style.setProperty('--val', `${score}%`);
    slider.style.setProperty('--accent', scoreToSliderColor(score));
  }

  function syncAllRatingSliders() {
    $$('.rating-slider').forEach(syncRatingSlider);
  }

  async function bootstrap() {
    const payload = await api('/bootstrap');
    state.tournaments = payload.tournaments || [];
    state.currentId = payload.currentId;
    if (state.currentId) await loadTournament(state.currentId);
  }

  async function loadTournament(id) {
    const payload = await api(`/tournaments/${id}`);
    state.current = payload.tournament;
    state.currentId = payload.tournament.id;
    await loadSnapshots();
    renderAll();
  }

  function formatDateTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Data non valida';
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function loadSnapshots() {
    if (!state.currentId) {
      state.snapshots = [];
      state.snapshotVersion = null;
      state.snapshotDetail = null;
      return;
    }
    const payload = await api(`/tournaments/${state.currentId}/snapshots`);
    state.snapshots = Array.isArray(payload.snapshots) ? payload.snapshots : [];
    if (!state.snapshots.length) {
      state.snapshotVersion = null;
      state.snapshotDetail = null;
      return;
    }
    const hasSelected = state.snapshots.some((snap) => Number(snap.version) === Number(state.snapshotVersion));
    if (!hasSelected) {
      state.snapshotVersion = Number(state.snapshots[0].version);
      state.snapshotDetail = null;
    }
  }

  function renderSnapshotList() {
    if (!refs.snapshotList || !refs.snapshotEmpty) return;
    refs.snapshotList.innerHTML = '';
    const snapshots = Array.isArray(state.snapshots) ? state.snapshots : [];
    refs.snapshotEmpty.classList.toggle('hidden', snapshots.length > 0);
    snapshots.forEach((snapshot) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = Number(snapshot.version) === Number(state.snapshotVersion);
      btn.className = `snapshot-item${isActive ? ' active' : ''}`;
      btn.innerHTML = `
        <div class="snapshot-item-head">
          <span>v${snapshot.version}</span>
          <span>${escapeHtml(snapshot.winnerTeam || '—')}</span>
        </div>
        <div class="snapshot-item-meta">${formatDateTime(snapshot.createdAt)}</div>
      `;
      btn.addEventListener('click', async () => {
        state.snapshotVersion = Number(snapshot.version);
        await loadSnapshotDetail(snapshot.version);
        renderSnapshotList();
      });
      refs.snapshotList.appendChild(btn);
    });
  }

  function renderSnapshotDetail() {
    if (!refs.snapshotDetail) return;
    const detail = state.snapshotDetail;
    if (!detail) {
      refs.snapshotDetail.innerHTML = '<p class="text-sm text-muted">Seleziona una versione per vedere il dettaglio completo dello snapshot.</p>';
      return;
    }
    const podium = detail?.payload?.snapshot?.podium || {};
    const tournament = detail?.payload?.tournament || {};
    const players = Array.isArray(tournament.players) ? tournament.players.slice() : [];
    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
    const topPlayers = players
      .sort((a, b) => (Number(b.goals) - Number(a.goals)) || (Number(b.assists) - Number(a.assists)) || String(a.name).localeCompare(String(b.name), 'it'))
      .slice(0, 5);
    const latestMatches = matches.slice(-4);
    refs.snapshotDetail.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div class="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">snapshot v${detail.snapshot.version}</div>
          <div class="text-lg font-medium">${escapeHtml(tournament.name || 'Torneo')}</div>
        </div>
        <div class="font-mono text-[11px] text-muted">${formatDateTime(detail.snapshot.createdAt)}</div>
      </div>
      <div class="snapshot-podium">
        <div class="snapshot-podium-item"><div class="snapshot-podium-label">1 posto</div><div class="snapshot-podium-value">${escapeHtml(podium.first || '—')}</div></div>
        <div class="snapshot-podium-item"><div class="snapshot-podium-label">2 posto</div><div class="snapshot-podium-value">${escapeHtml(podium.second || '—')}</div></div>
        <div class="snapshot-podium-item"><div class="snapshot-podium-label">3 posto</div><div class="snapshot-podium-value">${escapeHtml(podium.third || '—')}</div></div>
        <div class="snapshot-podium-item"><div class="snapshot-podium-label">4 posto</div><div class="snapshot-podium-value">${escapeHtml(podium.fourth || '—')}</div></div>
      </div>
      <div>
        <div class="text-sm font-medium mb-2">Top giocatori (gol/assist)</div>
        <div class="snapshot-mini-list">
          ${topPlayers.map((p) => `
            <div class="snapshot-mini-row">
              <span>${escapeHtml(p.name || 'Senza nome')}</span>
              <span class="snapshot-mini-right">G ${Number(p.goals) || 0} · A ${Number(p.assists) || 0}</span>
            </div>
          `).join('') || '<div class="snapshot-mini-row"><span>Nessun giocatore</span><span class="snapshot-mini-right">—</span></div>'}
        </div>
      </div>
      <div>
        <div class="text-sm font-medium mb-2">Ultimi risultati salvati</div>
        <div class="snapshot-mini-list">
          ${latestMatches.map((m) => `
            <div class="snapshot-mini-row">
              <span>${escapeHtml(m.stage || 'match')} · ${escapeHtml(m.teamA || 'A')} vs ${escapeHtml(m.teamB || 'B')}</span>
              <span class="snapshot-mini-right">${Number(m.scoreA) || 0}-${Number(m.scoreB) || 0}</span>
            </div>
          `).join('') || '<div class="snapshot-mini-row"><span>Nessuna partita</span><span class="snapshot-mini-right">—</span></div>'}
        </div>
      </div>
    `;
  }

  async function loadSnapshotDetail(version = null) {
    if (!state.currentId) return;
    const targetVersion = Number(version || state.snapshotVersion);
    if (!targetVersion) {
      state.snapshotDetail = null;
      renderSnapshotDetail();
      return;
    }
    const payload = await api(`/tournaments/${state.currentId}/snapshots/${targetVersion}`);
    state.snapshotDetail = payload;
    renderSnapshotDetail();
  }

  async function archiveCurrentTournament() {
    const current = getCurrent();
    if (!current?.id) {
      toast('Nessun torneo selezionato');
      return;
    }
    const payload = await api(`/tournaments/${current.id}/archive`, { method: 'POST' });
    await loadSnapshots();
    state.snapshotVersion = Number(payload.snapshot.version);
    await loadSnapshotDetail(payload.snapshot.version);
    renderSnapshotList();
    toast(`Snapshot v${payload.snapshot.version} archiviato`);
    document.querySelector('#cronologia-tornei')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderTournamentSwitcher() {
    const current = getCurrent();
    if (!current) return;
    refs.currentTournamentName.textContent = current.name;
    const d = new Date(current.createdAt);
    refs.currentTournamentDate.textContent = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
    refs.tournamentList.innerHTML = '';
    const list = state.tournaments.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    list.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tournament-item${t.id === state.currentId ? ' active' : ''}`;
      const dt = new Date(t.createdAt);
      btn.innerHTML = `
        <span class="truncate">${escapeHtml(t.name)}</span>
        <span class="ti-meta">${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getFullYear()).slice(2)}</span>
        <span class="ti-del" data-del="${t.id}" title="Elimina torneo" aria-label="Elimina torneo">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </span>`;
      btn.addEventListener('click', async (e) => {
        if (e.target.closest('[data-del]')) {
          e.stopPropagation();
          await deleteTournament(t.id);
          return;
        }
        await loadTournament(t.id);
        closeTournamentDropdown();
      });
      refs.tournamentList.appendChild(btn);
    });
  }

  function openTournamentDropdown() {
    refs.tournamentDropdown.classList.remove('hidden');
    setTimeout(() => document.addEventListener('click', onDocClickCloseTournament), 0);
  }

  function closeTournamentDropdown() {
    refs.tournamentDropdown.classList.add('hidden');
    document.removeEventListener('click', onDocClickCloseTournament);
  }

  function onDocClickCloseTournament(e) {
    if (!refs.tournamentDropdown.contains(e.target) && e.target !== refs.tournamentDropdownBtn) closeTournamentDropdown();
  }

  async function createNewTournament() {
    const r = await api('/tournaments', { method: 'POST', body: {} });
    const list = await api('/tournaments');
    state.tournaments = list.tournaments;
    await loadTournament(r.tournament.id);
    closeTournamentDropdown();
    toast('Nuovo torneo creato');
  }

  async function renameCurrentTournament() {
    const curr = getCurrent();
    if (!curr?.id) {
      toast('Nessun torneo selezionato');
      return;
    }
    const next = await askForTextInput({
      title: 'Rinomina torneo',
      message: 'Inserisci il nuovo nome torneo.',
      initialValue: curr.name,
      confirmLabel: 'Rinomina',
      placeholder: 'Nome torneo',
    });
    if (!next?.confirmed) return;
    const nextName = sanitizePlayerName(next.value) || curr.name;
    if (nextName === curr.name) return;
    try {
      await api(`/tournaments/${curr.id}`, { method: 'PATCH', body: { name: nextName } });
      const list = await api('/tournaments');
      state.tournaments = list.tournaments;
      await loadTournament(curr.id);
      toast('Rinominato');
    } catch (err) {
      console.error(err);
      toast(`Errore rinomina: ${err.message}`);
    }
  }

  function openSideMenu() {
    if (!refs.sideMenu || !refs.sideMenuBackdrop) return;
    refs.sideMenu.classList.add('is-open');
    refs.sideMenuBackdrop.classList.remove('hidden');
    refs.btnHamburger?.setAttribute('aria-expanded', 'true');
    refs.sideMenu.setAttribute('aria-hidden', 'false');
  }

  function closeSideMenu() {
    if (!refs.sideMenu || !refs.sideMenuBackdrop) return;
    refs.sideMenu.classList.remove('is-open');
    refs.sideMenuBackdrop.classList.add('hidden');
    refs.btnHamburger?.setAttribute('aria-expanded', 'false');
    refs.sideMenu.setAttribute('aria-hidden', 'true');
  }

  function runSideNavigation(target) {
    if (target === 'schede') {
      activateNav('schede', '#registra');
      closeSideMenu();
      return;
    }
    if (target === 'classifiche') {
      activateNav('classifiche', '#classifiche');
      closeSideMenu();
      return;
    }
    if (target === 'tabellone') {
      activateNav('tabellone', '#regole');
      closeSideMenu();
      return;
    }
    if (target === 'cronologia') {
      activateNav('cronologia', '#cronologia-tornei');
      closeSideMenu();
      return;
    }
    if (target === 'timer') {
      activateNav('timer', '#timer-partita');
      closeSideMenu();
    }
  }

  function renderRoster() {
    const players = getPlayers();
    const size = getTournamentSize();
    const allIds = new Set(players.map((player) => String(player.id)));
    state.selectedPlayerIds = (state.selectedPlayerIds || []).filter((id) => allIds.has(String(id)));
    const selectedCount = state.selectedPlayerIds.length;
    refs.rosterCount.textContent = String(players.length);
    refs.rosterMax.textContent = String(size);
    refs.completeCount.textContent = String(players.filter(isPlayerComplete).length);
    if (refs.btnDeleteSelected) {
      refs.btnDeleteSelected.disabled = selectedCount === 0;
      refs.btnDeleteSelected.textContent = selectedCount > 0
        ? `Elimina selezionati (${selectedCount})`
        : 'Elimina selezionati';
    }
    if (refs.btnDeleteAllPlayers) {
      refs.btnDeleteAllPlayers.disabled = players.length === 0;
    }
    if (!players.length) {
      refs.rosterGrid.classList.add('hidden');
      refs.rosterEmpty.classList.remove('hidden');
      refs.rosterGrid.innerHTML = '';
      return;
    }
    refs.rosterGrid.classList.remove('hidden');
    refs.rosterEmpty.classList.add('hidden');
    refs.rosterGrid.innerHTML = '';
    players.forEach((p, i) => {
      const selected = state.selectedPlayerIds.includes(String(p.id));
      const tecScore = normalizePlayerBaseScore(p.tec);
      const fisScore = normalizePlayerBaseScore(p.fis);
      const overallScore = computePlayerOverall(p);
      const roles = p.roles || [];
      const rolePill = roles.length
        ? roles.map((role) => `<span class="role-pill ${ROLE_ABBR[role] || ''}">${escapeHtml(role)}</span>`).join('')
        : '<span class="badge-warn">da completare</span>';
      const card = document.createElement('article');
      const hasProduction = (Number(p.goals) || 0) > 0 || (Number(p.assists) || 0) > 0;
      card.className = `player-card card-enter${isPlayerComplete(p) ? '' : ' is-incomplete'}${hasProduction ? ' has-production' : ''}`;
      card.style.setProperty('--i', i);
      card.dataset.id = p.id;
      card.innerHTML = `
        <div class="pc-top">
          <div class="min-w-0">
            <label class="pc-name-select" title="Seleziona giocatore">
              <input type="checkbox" class="pc-name-check pc-select-check" data-select-id="${p.id}" ${selected ? 'checked' : ''} />
              <span class="pc-name truncate">${escapeHtml(p.name)}</span>
            </label>
            <div class="pc-meta">${rolePill}</div>
          </div>
          <div class="pc-head-right">
            <span class="pc-overall">OVR ${overallScore}</span>
            <span class="pc-flag" aria-hidden="true">${renderFlagSvg(p.flag, 'flag-svg')}</span>
          </div>
        </div>
        <div class="pc-stats">
          <div class="pc-stat"><span class="pc-stat-label">Tecnica</span><div class="pc-stat-bar"><span style="width:${tecScore}%"></span></div><span class="pc-stat-value">${tecScore}</span></div>
          <div class="pc-stat"><span class="pc-stat-label">Fisico</span><div class="pc-stat-bar"><span style="width:${fisScore}%"></span></div><span class="pc-stat-value">${fisScore}</span></div>
        </div>
        <div class="flex items-center justify-between gap-2 text-xs">
          <div class="font-mono">G ${p.goals || 0} · A ${p.assists || 0}</div>
          <div class="flex items-center gap-1">
            <button class="counter-btn stat-minus" data-stat="goals" data-id="${p.id}" type="button">−</button>
            <button class="counter-btn stat-plus" data-stat="goals" data-id="${p.id}" type="button">+</button>
            <button class="counter-btn stat-minus" data-stat="assists" data-id="${p.id}" type="button">−</button>
            <button class="counter-btn stat-plus" data-stat="assists" data-id="${p.id}" type="button">+</button>
          </div>
        </div>
      `;
      card.addEventListener('click', (event) => {
        if (event.target?.closest('button, input, label')) return;
        openModalForEdit(p.id);
      });
      refs.rosterGrid.appendChild(card);
    });
  }

  function renderGeneratorStatus() {
    const players = getPlayers();
    const size = getTournamentSize();
    const missingPlayers = Math.max(0, size - players.length);
    const enough = missingPlayers === 0;
    refs.btnGenerate.disabled = !enough;
    refs.btnGenerate.setAttribute('aria-disabled', enough ? 'false' : 'true');
    refs.btnGenerate.title = enough
      ? 'Genera squadre bilanciate'
      : 'Completa prima giocatori e schede per abilitare la generazione';
    if (enough) {
      refs.generatorStatusText.innerHTML = `<span class="badge-ok">pronto</span> <span class="text-muted ml-2">${players.length} iscritti</span>`;
    } else {
      refs.generatorStatusText.innerHTML = `Servono ancora <span class="font-mono">${missingPlayers}</span> giocatori.`;
    }
    if (missingPlayers === 0) {
      refs.heroPlayersValue.textContent = String(size);
      refs.heroPlayersLabel.textContent = 'giocatori';
      refs.heroPlayersChip.classList.remove('is-missing');
      refs.heroPlayersChip.classList.add('is-ready');
      return;
    }
    refs.heroPlayersValue.textContent = String(missingPlayers);
    refs.heroPlayersLabel.textContent = 'mancanti';
    refs.heroPlayersChip.classList.remove('is-ready');
    refs.heroPlayersChip.classList.add('is-missing');
  }

  function renderStandings() {
    const sorted = getPlayers()
      .slice()
      .sort((a, b) => (b.goals - a.goals) || (b.assists - a.assists) || a.name.localeCompare(b.name, 'it'));
    refs.standingsList.innerHTML = '';
    if (!sorted.length) {
      refs.standingsList.innerHTML = '<p class="text-sm text-muted">Nessun giocatore disponibile.</p>';
      return;
    }
    sorted.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'standing-row';
      row.innerHTML = `
        <div class="standing-rank">#${i + 1}</div>
        <div class="standing-name">${escapeHtml(p.name)}</div>
        <div class="standing-stat">Gol ${p.goals || 0}</div>
        <div class="standing-stat">Ast ${p.assists || 0}</div>
      `;
      refs.standingsList.appendChild(row);
    });
  }

  function roleOrder(role) {
    const m = { Portiere: 0, Difensore: 1, Centrocampista: 2, Attaccante: 3 };
    return m[role] ?? 99;
  }

  function getPrimaryRole(player) {
    return Array.isArray(player.roles) ? player.roles[0] || null : null;
  }

  function getTeamLetters(teamCount) {
    return Array.from({ length: teamCount }, (_, i) => String.fromCharCode(65 + i));
  }

  function balanceTeams(pool, teamCount) {
    const players = pool.slice();
    const teams = getTeamLetters(teamCount).map((letter, index) => ({ letter, index, players: [] }));
    const counts = ROLES.map((r) => ({
      role: r,
      n: players.filter((p) => getPrimaryRole(p) === r).length,
    })).sort((a, b) => a.n - b.n);
    const assigned = new Set();
    counts.forEach(({ role }) => {
      players
        .filter((p) => getPrimaryRole(p) === role && !assigned.has(p.id))
        .sort((a, b) => (b.tec + b.fis) - (a.tec + a.fis))
        .forEach((p) => {
          teams.sort((a, b) => avg(a.players.map((x) => x.tec + x.fis)) - avg(b.players.map((x) => x.tec + x.fis)));
          const target = teams.find((t) => t.players.length < PLAYERS_PER_TEAM);
          target.players.push(p);
          assigned.add(p.id);
        });
    });
    teams.sort((a, b) => a.index - b.index);
    teams.forEach((t) => t.players.sort((a, b) => roleOrder(getPrimaryRole(a)) - roleOrder(getPrimaryRole(b))));
    return teams;
  }

  function renderTeams(teams) {
    refs.teamsOutput.classList.remove('hidden');
    refs.teamsGrid.innerHTML = '';
    teams.forEach((team) => {
      const avgTec = avg(team.players.map((p) => p.tec));
      const avgFis = avg(team.players.map((p) => p.fis));
      const card = document.createElement('article');
      card.className = 'team-card';
      card.innerHTML = `
        <header class="team-card-head">
          <div><div class="tc-letter">${team.letter}</div><div class="font-mono text-[10px] text-muted mt-1">Squadra ${team.letter}</div></div>
          <div class="tc-stats"><b>${avgTec.toFixed(2)} · ${avgFis.toFixed(2)}</b>tec · fis</div>
        </header>
        <div class="team-roster">${team.players.map((p) => `
          <div class="team-roster-row">
            <span class="flag">${renderFlagSvg(p.flag, 'flag-svg')}</span>
            <div class="min-w-0">
              <div class="name truncate">${escapeHtml(p.name)}</div>
              <div class="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">${escapeHtml(getPrimaryRole(p) || '—')}</div>
            </div>
            <div class="right">${p.tec}<span class="text-muted">·</span>${p.fis}</div>
          </div>
        `).join('')}</div>`;
      refs.teamsGrid.appendChild(card);
    });
    const tec = teams.map((t) => avg(t.players.map((p) => p.tec)));
    const fis = teams.map((t) => avg(t.players.map((p) => p.fis)));
    refs.stdTec.textContent = stddev(tec).toFixed(3);
    refs.stdFis.textContent = stddev(fis).toFixed(3);
  }

  function mapBracketNodes() {
    return {
      semi1A: $$('.bracket-editable')[0],
      semi1B: $$('.bracket-editable')[1],
      semi2A: $$('.bracket-editable')[2],
      semi2B: $$('.bracket-editable')[3],
      thirdA: $$('.bracket-editable')[4],
      thirdB: $$('.bracket-editable')[5],
      finalA: $$('.bracket-editable')[6],
      finalB: $$('.bracket-editable')[7],
    };
  }

  function renderBracketFromMatches(matches) {
    const nodes = mapBracketNodes();
    const semi1 = matches.find((m) => m.stage === 'semi' && m.slot === 1);
    const semi2 = matches.find((m) => m.stage === 'semi' && m.slot === 2);
    const third = matches.find((m) => m.stage === 'third_place');
    const final = matches.find((m) => m.stage === 'final');
    if (semi1 && nodes.semi1A) {
      nodes.semi1A.textContent = semi1.teamA || 'Squadra A';
      nodes.semi1B.textContent = semi1.teamB || 'Squadra B';
      nodes.semi1A.dataset.matchId = String(semi1.id); nodes.semi1A.dataset.side = 'A';
      nodes.semi1B.dataset.matchId = String(semi1.id); nodes.semi1B.dataset.side = 'B';
    }
    if (semi2 && nodes.semi2A) {
      nodes.semi2A.textContent = semi2.teamA || 'Squadra C';
      nodes.semi2B.textContent = semi2.teamB || 'Squadra D';
      nodes.semi2A.dataset.matchId = String(semi2.id); nodes.semi2A.dataset.side = 'A';
      nodes.semi2B.dataset.matchId = String(semi2.id); nodes.semi2B.dataset.side = 'B';
    }
    if (third && nodes.thirdA) {
      nodes.thirdA.textContent = third.teamA || 'Perdente SF1';
      nodes.thirdB.textContent = third.teamB || 'Perdente SF2';
      nodes.thirdA.dataset.matchId = String(third.id); nodes.thirdA.dataset.side = 'A';
      nodes.thirdB.dataset.matchId = String(third.id); nodes.thirdB.dataset.side = 'B';
    }
    if (final && nodes.finalA) {
      nodes.finalA.textContent = final.teamA || 'Vincente SF1';
      nodes.finalB.textContent = final.teamB || 'Vincente SF2';
      nodes.finalA.dataset.matchId = String(final.id); nodes.finalA.dataset.side = 'A';
      nodes.finalB.dataset.matchId = String(final.id); nodes.finalB.dataset.side = 'B';
    }
    renderBracketWinnerControls(matches);
    emitFieldBoardSync(matches);
  }

  function emitFieldBoardSync(matches = null) {
    const current = getCurrent();
    if (!current || !state.currentId) return;
    const detail = {
      tournamentId: String(state.currentId),
      teamCount: getTeamCount(),
      players: getPlayers(),
      matches: Array.isArray(matches) ? matches : (current.matches || []),
    };
    window.__TORNEO_LAST_SYNC__ = detail;
    window.dispatchEvent(new CustomEvent('torneo:field-board-sync', { detail }));
  }

  function renderBracketWinnerControls(matches) {
    $$('.bracket-match').forEach((card) => {
      const firstEditable = card.querySelector('.bracket-editable');
      const matchId = firstEditable?.dataset.matchId;
      const controlsOld = card.querySelector('.bm-controls');
      if (controlsOld) controlsOld.remove();
      card.classList.remove('has-winner', 'winner-a', 'winner-b', 'winner-flash', 'loser-a', 'loser-b');
      if (!matchId) return;
      const match = matches.find((m) => sameId(m.id, matchId));
      if (!match) return;
      const teamA = match.teamA || 'Squadra A';
      const teamB = match.teamB || 'Squadra B';
      const rows = Array.from(card.querySelectorAll('.bm-row')).slice(0, 2);
      rows.forEach((row) => row.classList.remove('winner-row', 'loser-row'));
      const winnerLabel = match.winner ? `Vincitore: ${match.winner}` : 'Nessun vincitore selezionato';
      const winnerKind = match.winner === teamA ? 'a' : (match.winner === teamB ? 'b' : 'none');
      const prevWinner = card.dataset.lastWinner || '';
      if (match.winner) {
        card.classList.add('has-winner');
        if (winnerKind === 'a') {
          card.classList.add('winner-a', 'loser-b');
          if (rows[0]) rows[0].classList.add('winner-row');
          if (rows[1]) rows[1].classList.add('loser-row');
        }
        if (winnerKind === 'b') {
          card.classList.add('winner-b', 'loser-a');
          if (rows[1]) rows[1].classList.add('winner-row');
          if (rows[0]) rows[0].classList.add('loser-row');
        }
      }
      card.dataset.lastWinner = match.winner || '';
      if ((match.winner || '') !== prevWinner && match.winner) {
        card.classList.add('winner-flash');
      }
      const controls = document.createElement('div');
      controls.className = 'bm-controls';
      controls.innerHTML = `
        <div class="winner-status ${match.winner ? 'is-set' : ''}">
          ${escapeHtml(winnerLabel)}
        </div>
      `;
      card.appendChild(controls);
    });
  }

  function setRolesUI(roles) {
    editing.roles = roles.slice();
    $$('.role-chip', refs.roleGroup).forEach((chip) => {
      chip.setAttribute('aria-pressed', editing.roles.includes(chip.dataset.role) ? 'true' : 'false');
    });
  }

  function setFlagUI(code) {
    const normalized = code && FLAGS_BY_CODE[String(code).toUpperCase()] ? String(code).toUpperCase() : null;
    editing.flagCode = normalized;
    refs.flagPreview.innerHTML = renderFlagSvg(normalized, 'flag-svg');
    refs.flagName.textContent = normalized && FLAGS_BY_CODE[normalized] ? FLAGS_BY_CODE[normalized].name : 'Seleziona…';
    refs.flagName.classList.toggle('text-muted', !normalized);
  }

  function setTechDetailsExpanded(expanded) {
    refs.techDetailsPanel.classList.toggle('hidden', !expanded);
    refs.btnToggleDetails.querySelector('span').textContent = expanded ? '−' : '+';
  }

  function setTechDetailsUI(details) {
    const d = details || { speed: SCORE_DEFAULT, passing: SCORE_DEFAULT, physical: SCORE_DEFAULT, defense: SCORE_DEFAULT };
    const speed = normalizeScore(d.speed, SCORE_DEFAULT);
    const passing = normalizeScore(d.passing, SCORE_DEFAULT);
    const physical = normalizeScore(d.physical, SCORE_DEFAULT);
    const defense = normalizeScore(d.defense, SCORE_DEFAULT);
    refs.fieldDetailSpeed.value = speed;
    refs.fieldDetailPassing.value = passing;
    refs.fieldDetailPhysical.value = physical;
    refs.fieldDetailDefense.value = defense;
    refs.detailSpeedValue.textContent = speed;
    refs.detailPassingValue.textContent = passing;
    refs.detailPhysicalValue.textContent = physical;
    refs.detailDefenseValue.textContent = defense;
    syncRatingSlider(refs.fieldDetailSpeed);
    syncRatingSlider(refs.fieldDetailPassing);
    syncRatingSlider(refs.fieldDetailPhysical);
    syncRatingSlider(refs.fieldDetailDefense);
  }

  function getTechDetailsFromUI() {
    if (refs.techDetailsPanel.classList.contains('hidden')) return null;
    return {
      speed: +refs.fieldDetailSpeed.value,
      passing: +refs.fieldDetailPassing.value,
      physical: +refs.fieldDetailPhysical.value,
      defense: +refs.fieldDetailDefense.value,
    };
  }

  function openModal() {
    refs.modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    refs.modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    closeFlagPicker();
    state.pendingPitchInsert = null;
    state.pendingPitchRemoval = null;
  }

  function openModalForNew(initialName = '', options = {}) {
    state.pendingPitchInsert = options?.pitchInsert || null;
    state.pendingPitchRemoval = null;
    editing.id = null;
    editing.roles = [];
    editing.flagCode = DEFAULT_FLAG_CODE;
    editing.techDetails = null;
    editing.goals = 0;
    editing.assists = 0;
    refs.modalSubtitle.textContent = 'nuova scheda';
    refs.modalTitle.textContent = 'Scheda giocatore';
    refs.fieldName.value = sanitizePlayerName(initialName || '');
    refs.fieldAge.value = '';
    refs.fieldTec.value = SCORE_DEFAULT;
    refs.fieldFis.value = SCORE_DEFAULT;
    refs.fieldGoals.textContent = '0';
    refs.fieldAssists.textContent = '0';
    refs.formError.classList.add('hidden');
    refs.btnDeletePlayer.classList.add('hidden');
    if (refs.btnDeletePlayerLabel) refs.btnDeletePlayerLabel.textContent = 'Elimina';
    setRolesUI([]);
    setFlagUI(DEFAULT_FLAG_CODE);
    setTechDetailsExpanded(false);
    setTechDetailsUI(null);
    syncModalRatings();
    openModal();
    setTimeout(() => refs.fieldName.focus(), 0);
  }

  function openModalForEdit(playerId, options = {}) {
    const p = getPlayers().find((x) => x.id === playerId);
    if (!p) return;
    const pitchSlot = options?.pitchSlot || null;
    editing.id = p.id;
    editing.roles = (p.roles || []).slice();
    editing.flagCode = p.flag || null;
    editing.techDetails = p.techDetails || null;
    editing.goals = p.goals || 0;
    editing.assists = p.assists || 0;
    refs.modalSubtitle.textContent = pitchSlot ? 'gestione slot pitch' : 'modifica scheda';
    refs.modalTitle.textContent = p.name;
    refs.fieldName.value = p.name || '';
    refs.fieldAge.value = p.age || '';
    const tecScore = normalizePlayerBaseScore(p.tec);
    const fisScore = normalizePlayerBaseScore(p.fis);
    refs.fieldTec.value = tecScore;
    refs.fieldFis.value = fisScore;
    refs.fieldGoals.textContent = String(p.goals || 0);
    refs.fieldAssists.textContent = String(p.assists || 0);
    refs.formError.classList.add('hidden');
    refs.btnDeletePlayer.classList.remove('hidden');
    state.pendingPitchRemoval = pitchSlot;
    if (refs.btnDeletePlayerLabel) {
      refs.btnDeletePlayerLabel.textContent = pitchSlot ? 'Rimuovi dal pitch' : 'Elimina';
    }
    setRolesUI(p.roles || []);
    setFlagUI(p.flag || null);
    setTechDetailsExpanded(!!p.techDetails);
    setTechDetailsUI(p.techDetails);
    syncModalRatings();
    openModal();
  }

  function showFormError(msg) {
    refs.formError.textContent = msg;
    refs.formError.classList.remove('hidden');
  }

  async function updatePlayerStats(playerId, goalsDelta, assistsDelta) {
    await api(`/tournament-players/${playerId}/stats`, {
      method: 'PATCH',
      body: { goalsDelta, assistsDelta },
    });
    await loadTournament(state.currentId);
  }

  function renderFlagList(filter = '', preferredCode = null) {
    const q = filter.trim().toLowerCase();
    refs.flagList.innerHTML = '';
    const filtered = FLAGS
      .filter((f) => !q || f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q))
      .sort((a, b) => {
        const aPinned = a.code === DEFAULT_FLAG_CODE ? 0 : 1;
        const bPinned = b.code === DEFAULT_FLAG_CODE ? 0 : 1;
        if (aPinned !== bPinned) return aPinned - bPinned;
        return a.name.localeCompare(b.name, 'it');
      });
    state.flagFiltered = filtered;
    if (!filtered.length) {
      state.flagActiveIndex = -1;
      return;
    }
    if (preferredCode) {
      const preferredIndex = filtered.findIndex((item) => sameId(item.code, preferredCode));
      state.flagActiveIndex = preferredIndex >= 0 ? preferredIndex : 0;
    } else if (state.flagActiveIndex < 0 || state.flagActiveIndex >= filtered.length) {
      state.flagActiveIndex = 0;
    }
    filtered.forEach((f, idx) => {
      const isActive = idx === state.flagActiveIndex;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `flag-item${f.code === DEFAULT_FLAG_CODE ? ' is-pinned' : ''}${isActive ? ' is-kbd-active' : ''}`;
      btn.dataset.flagCode = f.code;
      btn.innerHTML = `
        <span class="flag-chip">${renderFlagSvg(f.code, 'flag-svg')}</span>
        <span class="name">${f.name}</span>
        ${f.code === DEFAULT_FLAG_CODE ? '<span class="flag-default-tag">default</span>' : ''}
        <span class="code">${f.code}</span>`;
      btn.addEventListener('click', () => {
        setFlagUI(f.code);
        closeFlagPicker();
      });
      refs.flagList.appendChild(btn);
    });
  }

  function moveFlagActive(delta) {
    if (!state.flagFiltered.length) return;
    state.flagActiveIndex = getNextIndex(state.flagFiltered.length, state.flagActiveIndex, delta);
    renderFlagList(refs.flagSearch.value);
    focusListActiveItem('.flag-item.is-kbd-active', refs.flagList);
  }

  function applyActiveFlag() {
    if (state.flagActiveIndex < 0) return false;
    const current = state.flagFiltered[state.flagActiveIndex];
    if (!current) return false;
    setFlagUI(current.code);
    closeFlagPicker();
    return true;
  }

  function openFlagPicker() {
    refs.flagPicker.classList.remove('hidden');
    refs.flagSearch.value = '';
    const preferredCode = editing.flagCode || DEFAULT_FLAG_CODE;
    renderFlagList('', preferredCode);
    setTimeout(() => refs.flagSearch?.focus(), 0);
    setTimeout(() => document.addEventListener('click', onDocClickCloseFlag), 0);
  }

  function closeFlagPicker() {
    refs.flagPicker.classList.add('hidden');
    document.removeEventListener('click', onDocClickCloseFlag);
  }

  function onDocClickCloseFlag(e) {
    if (!refs.flagPicker.contains(e.target) && !refs.fieldNationality.contains(e.target)) closeFlagPicker();
  }

  async function resolveDuplicateChoice(name) {
    const normalizedName = normalizeNameForDuplicate(name);
    if (!normalizedName) return { strategy: 'new' };
    const dupPayload = await api(`/players/duplicates?name=${encodeURIComponent(normalizedName)}`);
    const duplicates = dupPayload.duplicates || [];
    if (!duplicates.length) return { strategy: 'new' };
    return new Promise((resolve) => {
      state.duplicateResolver = resolve;
      state.duplicateSelectedProfileId = duplicates[0].profileId;
      refs.duplicateList.innerHTML = duplicates.map((d, i) => `
        <button type="button" class="w-full text-left p-2 rounded-md border border-hair hover:bg-bone duplicate-row ${i === 0 ? 'bg-bone' : ''}" data-profile="${d.profileId}">
          <div class="text-sm font-medium">${escapeHtml(d.profileName)}</div>
          <div class="text-xs text-muted">${escapeHtml(d.tournamentName)} · ${new Date(d.tournamentCreatedAt).toLocaleDateString('it-IT')}</div>
        </button>`).join('');
      refs.duplicateModal.classList.remove('hidden');
      refs.duplicateList.querySelectorAll('.duplicate-row').forEach((row) => {
        row.addEventListener('click', () => {
          refs.duplicateList.querySelectorAll('.duplicate-row').forEach((x) => x.classList.remove('bg-bone'));
          row.classList.add('bg-bone');
          state.duplicateSelectedProfileId = row.dataset.profile;
        });
      });
    });
  }

  function closeDuplicateModal(result) {
    refs.duplicateModal.classList.add('hidden');
    if (state.duplicateResolver) {
      state.duplicateResolver(result);
      state.duplicateResolver = null;
    }
  }

  function filterPitchSelectPlayers() {
    const query = String(state.pitchSelectQuery || '').trim().toLowerCase();
    if (!query) {
      state.pitchSelectFiltered = state.pitchSelectAvailable.slice();
      return;
    }
    state.pitchSelectFiltered = state.pitchSelectAvailable.filter((player) => {
      const role = Array.isArray(player.roles) && player.roles.length ? player.roles[0] : (player.role || '');
      const hay = `${player.name || ''} ${role}`.toLowerCase();
      return hay.includes(query);
    });
  }

  function getPitchSelectOptions() {
    return [
      { id: PITCH_SELECT_NEW_ID, isNewOption: true },
      ...state.pitchSelectFiltered.map((player) => ({ ...player, isNewOption: false })),
    ];
  }

  function renderPitchSelectList() {
    if (!refs.pitchSelectList) return;
    refs.pitchSelectList.innerHTML = '';
    filterPitchSelectPlayers();
    const options = getPitchSelectOptions();
    options.forEach((player) => {
      const row = document.createElement('button');
      row.type = 'button';
      const selected = sameId(player.id, state.pitchSelectSelectedId);
      row.className = `pitch-select-row w-full text-left p-2 rounded-md border border-hair hover:bg-bone ${selected ? 'bg-bone is-kbd-active' : ''}`;
      row.dataset.playerId = String(player.id);
      if (player.isNewOption) {
        row.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <div class="text-sm font-medium">+ Nuovo giocatore</div>
            <span class="text-[11px] text-muted">apri scheda</span>
          </div>
          <div class="text-xs text-muted">Crea una nuova scheda e inseriscila in questo slot.</div>
        `;
      } else {
        const role = Array.isArray(player.roles) && player.roles.length ? player.roles[0] : (player.role || '—');
        const overall = computePlayerOverall(player);
        row.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0 flex items-center gap-2">
              <span class="pc-flag shrink-0" aria-hidden="true">${renderFlagSvg(player.flag, 'flag-svg')}</span>
              <div class="text-sm font-medium truncate">${escapeHtml(player.name || 'Senza nome')}</div>
            </div>
            <span class="font-mono text-[11px] shrink-0">OVR ${overall}</span>
          </div>
          <div class="text-xs text-muted">${escapeHtml(role)} · G ${Number(player.goals) || 0} · A ${Number(player.assists) || 0}</div>
        `;
      }
      row.addEventListener('click', () => {
        state.pitchSelectSelectedId = String(player.id);
        renderPitchSelectList();
      });
      refs.pitchSelectList.appendChild(row);
    });
    refs.pitchSelectEmpty?.classList.toggle('hidden', state.pitchSelectFiltered.length > 0);
    refs.btnPitchSelectUse?.toggleAttribute('disabled', options.length === 0);
    if (!state.pitchSelectSelectedId || !options.some((item) => sameId(item.id, state.pitchSelectSelectedId))) {
      state.pitchSelectSelectedId = PITCH_SELECT_NEW_ID;
    }
  }

  function movePitchSelected(delta) {
    const options = getPitchSelectOptions();
    if (!options.length) return;
    const selectedIndex = options.findIndex((player) => sameId(player.id, state.pitchSelectSelectedId));
    const nextIndex = getNextIndex(options.length, selectedIndex, delta);
    const next = options[nextIndex];
    if (!next) return;
    state.pitchSelectSelectedId = String(next.id);
    renderPitchSelectList();
    focusListActiveItem('.pitch-select-row.is-kbd-active', refs.pitchSelectList);
  }

  function applyPitchSelected() {
    if (!state.pitchSelectSelectedId) return false;
    if (sameId(state.pitchSelectSelectedId, PITCH_SELECT_NEW_ID)) {
      closePitchSelectModal({ action: 'new' });
      return true;
    }
    closePitchSelectModal({ action: 'existing', playerId: state.pitchSelectSelectedId });
    return true;
  }

  function triggerContextualEnter(e) {
    if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing) return false;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
    if (isMultilineTarget(e.target)) return false;
    if (isVisible(refs.flagPicker) && refs.flagPicker.contains(e.target)) {
      if (applyActiveFlag()) {
        e.preventDefault();
        return true;
      }
      return false;
    }
    if (isVisible(refs.pitchSelectModal)) {
      if (refs.pitchSelectModal.contains(e.target) && e.target?.closest('button, [role="button"], a[href]')) return false;
      if (applyPitchSelected()) {
        e.preventDefault();
        return true;
      }
      return true;
    }
    if (isVisible(refs.duplicateModal)) {
      if (refs.duplicateModal.contains(e.target) && e.target?.closest('button, [role="button"], a[href]')) return false;
      if (state.duplicateSelectedProfileId) {
        e.preventDefault();
        closeDuplicateModal({ strategy: 'reuse', profileId: state.duplicateSelectedProfileId });
        return true;
      }
      return true;
    }
    if (e.target?.closest('button, [role="button"], a[href]')) return false;
    if (isVisible(refs.modal) && refs.modal.contains(e.target)) {
      e.preventDefault();
      refs.btnSavePlayer?.click();
      return true;
    }
    if (e.target === refs.quickMyName) {
      e.preventDefault();
      refs.btnBulkAdd?.click();
      return true;
    }
    return false;
  }

  function closePitchSelectModal(result) {
    refs.pitchSelectModal?.classList.add('hidden');
    if (state.pitchSelectResolver) {
      state.pitchSelectResolver(result);
      state.pitchSelectResolver = null;
    }
    state.pitchSelectAvailable = [];
    state.pitchSelectFiltered = [];
    state.pitchSelectSelectedId = null;
    state.pitchSelectQuery = '';
    if (refs.pitchSelectSearch) refs.pitchSelectSearch.value = '';
  }

  function openPitchSelectModal(availablePlayers, suggestedName = '') {
    return new Promise((resolve) => {
      state.pitchSelectResolver = resolve;
      state.pitchSelectAvailable = availablePlayers.slice();
      state.pitchSelectFiltered = availablePlayers.slice();
      state.pitchSelectSelectedId = PITCH_SELECT_NEW_ID;
      state.pitchSelectQuery = '';
      if (refs.pitchSelectSearch) refs.pitchSelectSearch.value = '';
      if (refs.pitchSelectTitle) {
        refs.pitchSelectTitle.textContent = suggestedName
          ? `Seleziona giocatore per "${suggestedName}"`
          : 'Seleziona giocatore';
      }
      renderPitchSelectList();
      refs.pitchSelectModal?.classList.remove('hidden');
      setTimeout(() => refs.pitchSelectSearch?.focus(), 0);
    });
  }

  function closeConfirmModal(confirmed) {
    refs.confirmModal?.classList.add('hidden');
    if (state.confirmResolver) {
      state.confirmResolver(Boolean(confirmed));
      state.confirmResolver = null;
    }
  }

  function askForConfirmation({
    title = 'Conferma azione',
    message = 'Sei sicuro di voler continuare?',
    confirmLabel = 'Conferma',
  } = {}) {
    return new Promise((resolve) => {
      state.confirmResolver = resolve;
      if (refs.confirmTitle) refs.confirmTitle.textContent = title;
      if (refs.confirmMessage) refs.confirmMessage.textContent = message;
      const span = refs.btnConfirmOk?.querySelector('span');
      if (span) span.textContent = confirmLabel;
      refs.confirmModal?.classList.remove('hidden');
      setTimeout(() => refs.btnConfirmCancel?.focus(), 0);
    });
  }

  function closeTextInputModal(result) {
    refs.textInputModal?.classList.add('hidden');
    if (state.textInputResolver) {
      state.textInputResolver(result);
      state.textInputResolver = null;
    }
  }

  function askForTextInput({
    title = 'Inserisci testo',
    message = '',
    initialValue = '',
    confirmLabel = 'Salva',
    placeholder = '',
  } = {}) {
    return new Promise((resolve) => {
      state.textInputResolver = resolve;
      if (refs.textInputTitle) refs.textInputTitle.textContent = title;
      if (refs.textInputMessage) refs.textInputMessage.textContent = message;
      if (refs.textInputField) {
        refs.textInputField.value = String(initialValue || '');
        refs.textInputField.placeholder = String(placeholder || '');
      }
      const span = refs.btnTextInputOk?.querySelector('span');
      if (span) span.textContent = confirmLabel;
      refs.textInputModal?.classList.remove('hidden');
      setTimeout(() => refs.textInputField?.focus(), 0);
    });
  }

  // Expose a shared custom text-input modal for other modules.
  window.__TORNEO_OPEN_TEXT_INPUT__ = askForTextInput;

  async function addPlayerWithDuplicateFlow(payload) {
    const choice = await resolveDuplicateChoice(payload.name);
    if (!choice) return null;
    const body = { ...payload };
    if (!body.flag) body.flag = DEFAULT_FLAG_CODE;
    if (choice.strategy === 'reuse') {
      body.duplicateStrategy = 'reuse';
      body.profileId = choice.profileId;
    } else {
      body.duplicateStrategy = 'new';
    }
    const response = await api(`/tournaments/${state.currentId}/players`, { method: 'POST', body });
    return response?.player || null;
  }

  function buildMissingPlaceholder(idx) {
    return {
      id: `missing-slot-${idx + 1}`,
      name: 'Mancante',
      role: '—',
      tec: SCORE_DEFAULT,
      fis: SCORE_DEFAULT,
      placeholder: true,
      x: null,
      y: null,
    };
  }

  function ensurePitchLineup(lineup, side) {
    const defaults = side === 'b' ? PITCH_RIGHT_POSITIONS : PITCH_LEFT_POSITIONS;
    const source = Array.isArray(lineup) ? lineup : [];
    const out = source.slice(0, PLAYERS_PER_TEAM).map((entry, idx) => {
      const fallback = defaults[idx] || defaults[0];
      const x = Number.isFinite(Number(entry?.x)) ? Number(entry.x) : fallback.x;
      const y = Number.isFinite(Number(entry?.y)) ? Number(entry.y) : fallback.y;
      return {
        id: String(entry?.id || `${side}-slot-${idx + 1}`),
        name: entry?.name ? String(entry.name) : 'Mancante',
        role: entry?.role ? String(entry.role) : '—',
        tec: normalizePlayerBaseScore(entry?.tec),
        fis: normalizePlayerBaseScore(entry?.fis),
        placeholder: Boolean(entry?.placeholder ?? !entry?.id),
        x,
        y,
      };
    });
    while (out.length < PLAYERS_PER_TEAM) {
      const idx = out.length;
      const fallback = defaults[idx] || defaults[0];
      out.push({
        ...buildMissingPlaceholder(idx),
        id: `missing-${side}-${idx + 1}`,
        x: fallback.x,
        y: fallback.y,
      });
    }
    return out;
  }

  function isMissingPitchPlayerId(id) {
    const value = String(id || '');
    return !value || value.startsWith('missing-') || value.startsWith('lineup-');
  }

  function getAvailablePlayersForPitchInsert(ctx) {
    const players = getPlayers();
    if (!ctx?.matchId) return players;
    const match = (state.current?.matches || []).find((item) => sameId(item.id, ctx.matchId));
    if (!match) return players;
    const takenIds = new Set();
    const addTaken = (lineup = []) => {
      lineup.forEach((entry) => {
        const id = String(entry?.id || '');
        if (!isMissingPitchPlayerId(id)) takenIds.add(id);
      });
    };
    addTaken(match.lineupA);
    addTaken(match.lineupB);
    return players.filter((player) => !takenIds.has(String(player.id)));
  }

  async function chooseExistingPlayerForPitchSlot(ctx, suggestedName = '') {
    const available = getAvailablePlayersForPitchInsert(ctx);
    if (!available.length) return { action: 'new', player: null };
    const result = await openPitchSelectModal(available, suggestedName);
    if (!result || result.action === 'cancel') return { action: 'cancel', player: null };
    if (result.action === 'new') return { action: 'new', player: null };
    const player = available.find((item) => sameId(item.id, result.playerId));
    if (!player) return { action: 'cancel', player: null };
    return { action: 'existing', player };
  }

  async function insertPlayerIntoPitchSlot(player, pitchInsert = state.pendingPitchInsert) {
    const ctx = pitchInsert;
    if (!ctx || !player) return;
    const latest = await api(`/tournaments/${state.currentId}/bracket`);
    const matches = Array.isArray(latest?.matches) ? latest.matches : [];
    const match = matches.find((m) => sameId(m.id, ctx.matchId));
    if (!match) return;

    const side = String(ctx.side || '').toLowerCase() === 'b' ? 'b' : 'a';
    const slotIndex = clamp(Number(ctx.slotIndex) || 0, 0, PLAYERS_PER_TEAM - 1);
    const lineupA = ensurePitchLineup(match.lineupA, 'a');
    const lineupB = ensurePitchLineup(match.lineupB, 'b');
    const lineup = side === 'b' ? lineupB : lineupA;
    const fallback = (side === 'b' ? PITCH_RIGHT_POSITIONS : PITCH_LEFT_POSITIONS)[slotIndex];

    lineup[slotIndex] = {
      id: String(player.id),
      name: player.name || 'Senza nome',
      role: player.role || (Array.isArray(player.roles) && player.roles[0]) || '—',
      tec: normalizePlayerBaseScore(player.tec),
      fis: normalizePlayerBaseScore(player.fis),
      placeholder: false,
      x: Number.isFinite(Number(ctx.x)) ? Number(ctx.x) : fallback.x,
      y: Number.isFinite(Number(ctx.y)) ? Number(ctx.y) : fallback.y,
    };

    const payload = await api(`/matches/${match.id}`, {
      method: 'PATCH',
      body: { lineupA, lineupB },
    });
    state.current.matches = payload.matches;
    renderBracketFromMatches(payload.matches);
  }

  async function removePlayerFromPitchSlot(pitchRemoval = state.pendingPitchRemoval) {
    const ctx = pitchRemoval;
    if (!ctx?.matchId) return false;
    const latest = await api(`/tournaments/${state.currentId}/bracket`);
    const matches = Array.isArray(latest?.matches) ? latest.matches : [];
    const match = matches.find((m) => sameId(m.id, ctx.matchId));
    if (!match) return false;

    const side = String(ctx.side || '').toLowerCase() === 'b' ? 'b' : 'a';
    const slotIndex = clamp(Number(ctx.slotIndex) || 0, 0, PLAYERS_PER_TEAM - 1);
    const lineupA = ensurePitchLineup(match.lineupA, 'a');
    const lineupB = ensurePitchLineup(match.lineupB, 'b');
    const lineup = side === 'b' ? lineupB : lineupA;
    const fallback = (side === 'b' ? PITCH_RIGHT_POSITIONS : PITCH_LEFT_POSITIONS)[slotIndex];

    lineup[slotIndex] = {
      ...buildMissingPlaceholder(slotIndex),
      id: `missing-${side}-${slotIndex + 1}`,
      x: fallback.x,
      y: fallback.y,
    };

    const payload = await api(`/matches/${match.id}`, {
      method: 'PATCH',
      body: { lineupA, lineupB },
    });
    state.current.matches = payload.matches;
    renderBracketFromMatches(payload.matches);
    return true;
  }

  async function insertCreatedPlayerIntoPendingPitchSlot(player) {
    await insertPlayerIntoPitchSlot(player, state.pendingPitchInsert);
  }

  async function deleteTournament(id) {
    const ok = await askForConfirmation({
      title: 'Elimina torneo',
      message: 'Eliminare questo torneo?',
      confirmLabel: 'Elimina',
    });
    if (!ok) return;
    await api(`/tournaments/${id}`, { method: 'DELETE' });
    const list = await api('/tournaments');
    state.tournaments = list.tournaments;
    const next = state.tournaments[0];
    if (next) await loadTournament(next.id);
    toast('Torneo eliminato');
  }

  async function renderAll() {
    refs.heroEdition.textContent = String(new Date().getFullYear());
    renderTournamentSwitcher();
    renderRoster();
    updateBulkPreview();
    renderGeneratorStatus();
    renderStandings();
    renderBracketFromMatches(getCurrent().matches || []);
    renderSnapshotList();
    await loadSnapshotDetail();
    refs.teamsOutput.classList.add('hidden');
  }

  function updateBulkPreview() {
    const names = getCandidateNamesFromInputs();
    const remaining = getTournamentSize() - getPlayers().length;
    refs.bulkPreview.textContent = `${names.length} ${names.length === 1 ? 'nome rilevato' : 'nomi rilevati'}`;
    refs.btnAddOne?.classList.toggle('hidden', names.length !== 1);
    if (refs.btnBulkAdd) {
      refs.btnBulkAdd.disabled = remaining <= 0;
      refs.btnBulkAdd.title = remaining <= 0
        ? 'Hai raggiunto il numero massimo di giocatori per questo torneo'
        : 'Aggiungi i nomi rilevati alla lista giocatori';
    }
  }

  function bindEvents() {
    refs.tournamentDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (refs.tournamentDropdown.classList.contains('hidden')) openTournamentDropdown();
      else closeTournamentDropdown();
    });

    refs.btnNewTournament.addEventListener('click', createNewTournament);
    refs.btnNewTournamentTopbar?.addEventListener('click', createNewTournament);
    refs.btnHistory?.addEventListener('click', () => runSideNavigation('cronologia'));
    refs.btnArchive?.addEventListener('click', async () => {
      try {
        await archiveCurrentTournament();
      } catch (err) {
        console.error(err);
        toast(`Errore archiviazione: ${err.message}`);
      }
    });

    refs.btnRename.addEventListener('click', renameCurrentTournament);
    refs.btnMenuRename?.addEventListener('click', async () => {
      await renameCurrentTournament();
      closeSideMenu();
    });
    refs.btnMenuArchive?.addEventListener('click', async () => {
      try {
        await archiveCurrentTournament();
        closeSideMenu();
      } catch (err) {
        console.error(err);
        toast(`Errore archiviazione: ${err.message}`);
      }
    });
    refs.btnMenuHistory?.addEventListener('click', () => {
      runSideNavigation('cronologia');
      closeSideMenu();
    });
    refs.btnMenuNewTournament?.addEventListener('click', async () => {
      await createNewTournament();
      closeSideMenu();
    });

    refs.quickMyName?.addEventListener('input', updateBulkPreview);
    refs.bulkInput.addEventListener('input', updateBulkPreview);
    refs.btnBulkAdd.addEventListener('click', async () => {
      const names = getCandidateNamesFromInputs();
      if (!names.length) return toast('Nessun nome valido');
      const remaining = getTournamentSize() - getPlayers().length;
      if (remaining <= 0) return toast('Lista giocatori piena');
      const slice = names.slice(0, remaining);
      let added = 0;
      for (const name of slice) {
        const createdPlayer = await addPlayerWithDuplicateFlow({
          name,
          roles: [],
          tec: SCORE_DEFAULT,
          fis: SCORE_DEFAULT,
          age: null,
          flag: null,
          techDetails: null,
        });
        if (createdPlayer) {
          added++;
          // Live update without waiting the final tournament reload.
          if (state.current && Array.isArray(state.current.players)) {
            state.current.players.push(createdPlayer);
            renderRoster();
            renderGeneratorStatus();
            renderStandings();
            emitFieldBoardSync(state.current.matches || []);
          }
        }
      }
      refs.quickMyName.value = '';
      refs.bulkInput.value = '';
      updateBulkPreview();
      await loadTournament(state.currentId);
      toast(`Aggiunti ${added} giocatori`);
    });

    refs.btnAddOne.addEventListener('click', () => {
      const names = getCandidateNamesFromInputs();
      if (names.length !== 1) return;
      openModalForNew(names[0]);
    });

    refs.modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-modal]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (triggerContextualEnter(e)) return;
      if (e.key === 'Escape' && !refs.modal.classList.contains('hidden')) {
        closeModal();
        return;
      }
      if (e.key === 'Escape' && refs.confirmModal && !refs.confirmModal.classList.contains('hidden')) {
        closeConfirmModal(false);
        return;
      }
      if (e.key === 'Escape' && refs.textInputModal && !refs.textInputModal.classList.contains('hidden')) {
        closeTextInputModal({ confirmed: false, value: '' });
        return;
      }
      if (e.key === 'Escape' && refs.pitchSelectModal && !refs.pitchSelectModal.classList.contains('hidden')) {
        closePitchSelectModal({ action: 'cancel' });
        return;
      }
      if (e.key === 'Escape' && refs.sideMenu?.classList.contains('is-open')) {
        closeSideMenu();
        return;
      }
      if (isTypingTarget(e.target) || !e.altKey) return;
      const lower = e.key.toLowerCase();
      if (lower === '1') {
        e.preventDefault();
        runSideNavigation('schede');
      } else if (lower === '2') {
        e.preventDefault();
        runSideNavigation('classifiche');
      } else if (lower === '3') {
        e.preventDefault();
        runSideNavigation('tabellone');
      } else if (lower === '4') {
        e.preventDefault();
        runSideNavigation('cronologia');
      } else if (lower === '5') {
        e.preventDefault();
        runSideNavigation('timer');
      }
    });

    refs.btnHamburger?.addEventListener('click', () => {
      if (refs.sideMenu?.classList.contains('is-open')) closeSideMenu();
      else openSideMenu();
    });
    refs.sideMenuClose?.addEventListener('click', closeSideMenu);
    refs.sideMenuBackdrop?.addEventListener('click', closeSideMenu);
    refs.sideMenu?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-side-nav]');
      if (!btn) return;
      runSideNavigation(btn.dataset.sideNav);
    });

    refs.fieldTec.addEventListener('input', () => {
      syncModalRatings();
    });
    refs.fieldFis.addEventListener('input', () => {
      syncModalRatings();
    });
    refs.fieldDetailSpeed.addEventListener('input', () => {
      refs.detailSpeedValue.textContent = refs.fieldDetailSpeed.value;
      syncRatingSlider(refs.fieldDetailSpeed);
      syncModalRatings();
    });
    refs.fieldDetailPassing.addEventListener('input', () => {
      refs.detailPassingValue.textContent = refs.fieldDetailPassing.value;
      syncRatingSlider(refs.fieldDetailPassing);
      syncModalRatings();
    });
    refs.fieldDetailPhysical.addEventListener('input', () => {
      refs.detailPhysicalValue.textContent = refs.fieldDetailPhysical.value;
      syncRatingSlider(refs.fieldDetailPhysical);
      syncModalRatings();
    });
    refs.fieldDetailDefense.addEventListener('input', () => {
      refs.detailDefenseValue.textContent = refs.fieldDetailDefense.value;
      syncRatingSlider(refs.fieldDetailDefense);
      syncModalRatings();
    });

    refs.btnToggleDetails.addEventListener('click', () => {
      setTechDetailsExpanded(refs.techDetailsPanel.classList.contains('hidden'));
      syncModalRatings();
    });

    refs.roleGroup.addEventListener('click', (e) => {
      const chip = e.target.closest('.role-chip');
      if (!chip) return;
      const role = chip.dataset.role;
      editing.roles = editing.roles.includes(role) ? editing.roles.filter((r) => r !== role) : editing.roles.concat(role);
      setRolesUI(editing.roles);
    });

    refs.fieldNationality.addEventListener('click', (e) => {
      e.stopPropagation();
      if (refs.flagPicker.classList.contains('hidden')) openFlagPicker();
      else closeFlagPicker();
    });
    refs.flagSearch.addEventListener('input', () => {
      const activeCode = state.flagFiltered[state.flagActiveIndex]?.code || null;
      renderFlagList(refs.flagSearch.value, activeCode);
    });
    refs.flagSearch.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveFlagActive(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFlagActive(-1);
      } else if (e.key === 'Enter') {
        if (applyActiveFlag()) e.preventDefault();
      }
    });

    refs.btnGoalsMinus.addEventListener('click', () => {
      editing.goals = Math.max(0, editing.goals - 1);
      refs.fieldGoals.textContent = String(editing.goals);
      syncModalRatings();
    });
    refs.btnGoalsPlus.addEventListener('click', () => {
      editing.goals += 1;
      refs.fieldGoals.textContent = String(editing.goals);
      syncModalRatings();
    });
    refs.btnAssistsMinus.addEventListener('click', () => {
      editing.assists = Math.max(0, editing.assists - 1);
      refs.fieldAssists.textContent = String(editing.assists);
      syncModalRatings();
    });
    refs.btnAssistsPlus.addEventListener('click', () => {
      editing.assists += 1;
      refs.fieldAssists.textContent = String(editing.assists);
      syncModalRatings();
    });

    refs.btnSavePlayer.addEventListener('click', async () => {
      const name = sanitizePlayerName(refs.fieldName.value);
      if (!name) {
        showFormError('Inserisci almeno il nome.');
        return;
      }
      const body = {
        name,
        roles: editing.roles,
        tec: +refs.fieldTec.value,
        fis: +refs.fieldFis.value,
        age: refs.fieldAge.value.trim() ? +refs.fieldAge.value : null,
        flag: editing.flagCode,
        techDetails: getTechDetailsFromUI(),
      };
      if (editing.id) {
        await api(`/tournament-players/${editing.id}`, { method: 'PATCH', body });
        const player = getPlayers().find((p) => p.id === editing.id);
        const goalsDelta = editing.goals - (player?.goals || 0);
        const assistsDelta = editing.assists - (player?.assists || 0);
        if (goalsDelta || assistsDelta) {
          await updatePlayerStats(editing.id, goalsDelta, assistsDelta);
        }
      } else {
        const createdPlayer = await addPlayerWithDuplicateFlow(body);
        if (!createdPlayer) return;
        await insertCreatedPlayerIntoPendingPitchSlot(createdPlayer);
      }
      await loadTournament(state.currentId);
      closeModal();
      toast('Scheda salvata');
    });

    refs.btnDeletePlayer.addEventListener('click', async () => {
      if (!editing.id) return;
      if (state.pendingPitchRemoval) {
        const ok = await askForConfirmation({
          title: 'Rimuovi dal pitch',
          message: 'Rimuovere questo giocatore solo dal campo?',
          confirmLabel: 'Rimuovi',
        });
        if (!ok) return;
        await removePlayerFromPitchSlot(state.pendingPitchRemoval);
        closeModal();
        toast('Giocatore rimosso dal pitch');
        return;
      }
      const ok = await askForConfirmation({
        title: 'Elimina giocatore',
        message: 'Eliminare questo giocatore?',
        confirmLabel: 'Elimina',
      });
      if (!ok) return;
      await api(`/tournament-players/${editing.id}`, { method: 'DELETE' });
      await loadTournament(state.currentId);
      closeModal();
      toast('Giocatore eliminato');
    });

    refs.rosterGrid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.stat-plus, .stat-minus');
      if (!btn) return;
      e.stopPropagation();
      const playerId = btn.dataset.id;
      const stat = btn.dataset.stat;
      const delta = btn.classList.contains('stat-plus') ? 1 : -1;
      await updatePlayerStats(playerId, stat === 'goals' ? delta : 0, stat === 'assists' ? delta : 0);
      toast('Statistiche aggiornate');
    });
    refs.rosterGrid.addEventListener('change', (e) => {
      const checkbox = e.target.closest('.pc-select-check');
      if (!checkbox) return;
      const playerId = String(checkbox.dataset.selectId || '');
      if (!playerId) return;
      const current = new Set((state.selectedPlayerIds || []).map(String));
      if (checkbox.checked) current.add(playerId);
      else current.delete(playerId);
      state.selectedPlayerIds = Array.from(current);
      renderRoster();
    });

    refs.btnDeleteSelected?.addEventListener('click', async () => {
      const selectedIds = (state.selectedPlayerIds || []).map(String);
      if (!selectedIds.length) return toast('Seleziona almeno un giocatore');
      const ok = await askForConfirmation({
        title: 'Elimina selezionati',
        message: `Eliminare ${selectedIds.length} giocatori selezionati?`,
        confirmLabel: 'Elimina',
      });
      if (!ok) return;
      for (const playerId of selectedIds) {
        await api(`/tournament-players/${playerId}`, { method: 'DELETE' });
      }
      state.selectedPlayerIds = [];
      await loadTournament(state.currentId);
      toast(`${selectedIds.length} giocatori eliminati`);
    });
    refs.btnDeleteAllPlayers?.addEventListener('click', async () => {
      const allPlayers = getPlayers();
      if (!allPlayers.length) return toast('Nessun giocatore da eliminare');
      const ok = await askForConfirmation({
        title: 'Elimina tutti i giocatori',
        message: 'Vuoi eliminare tutti i giocatori del torneo corrente?',
        confirmLabel: 'Elimina tutti',
      });
      if (!ok) return;
      for (const player of allPlayers) {
        await api(`/tournament-players/${player.id}`, { method: 'DELETE' });
      }
      state.selectedPlayerIds = [];
      await loadTournament(state.currentId);
      toast('Tutti i giocatori sono stati eliminati');
    });

    refs.btnGenerate.addEventListener('click', async () => {
      const size = getTournamentSize();
      const players = getPlayers();
      if (players.length < size) {
        const missing = size - players.length;
        toast(`Servono ancora ${missing} giocatori per generare le squadre`);
        return;
      }
      const teams = balanceTeams(players.slice(0, size), getTeamCount());
      renderTeams(teams);
      await api(`/tournaments/${state.currentId}/bracket/from-teams`, {
        method: 'POST',
        body: { letters: teams.map((t) => `Squadra ${t.letter}`) },
      });
      await api(`/tournaments/${state.currentId}/bracket/auto-lineups`, { method: 'POST' });
      const bracket = await api(`/tournaments/${state.currentId}/bracket`);
      state.current.matches = bracket.matches;
      renderBracketFromMatches(bracket.matches);
    });

    refs.btnResetBracket.addEventListener('click', async () => {
      const payload = await api(`/tournaments/${state.currentId}/bracket/reset`, { method: 'POST' });
      state.current.matches = payload.matches;
      renderBracketFromMatches(payload.matches);
      toast('Tabellone resettato');
    });

    document.addEventListener('click', async (e) => {
      const editable = e.target.closest('.bracket-editable');
      if (editable) {
        const current = editable.textContent.trim();
        const next = await askForTextInput({
          title: 'Rinomina squadra/slot',
          message: 'Inserisci il nuovo nome.',
          initialValue: current,
          confirmLabel: 'Salva',
          placeholder: 'Nome squadra',
        });
        if (!next?.confirmed) return;
        const matchId = editable.dataset.matchId;
        const side = editable.dataset.side;
        if (!matchId || !side) return;
        const body = side === 'A'
          ? { teamA: sanitizePlayerName(next.value) || current }
          : { teamB: sanitizePlayerName(next.value) || current };
        const payload = await api(`/matches/${matchId}`, { method: 'PATCH', body });
        state.current.matches = payload.matches;
        renderBracketFromMatches(payload.matches);
      }
    });

    window.addEventListener('torneo:matches-updated', (e) => {
      const tournamentId = e?.detail?.tournamentId;
      const matches = e?.detail?.matches;
      if (!tournamentId || !sameId(tournamentId, state.currentId) || !Array.isArray(matches)) return;
      state.current.matches = matches;
      renderBracketFromMatches(matches);
    });

    window.addEventListener('torneo:edit-player', (e) => {
      const playerId = e?.detail?.playerId;
      if (!playerId) return;
      const player = getPlayers().find((p) => sameId(p.id, playerId));
      if (!player) return;
      const matchId = e?.detail?.matchId;
      const slotIndex = Number(e?.detail?.slotIndex);
      const sideRaw = String(e?.detail?.side || '').toLowerCase();
      const side = sideRaw === 'b' ? 'b' : (sideRaw === 'a' ? 'a' : null);
      const pitchSlot = matchId && side && Number.isInteger(slotIndex)
        ? { matchId: String(matchId), side, slotIndex }
        : null;
      openModalForEdit(player.id, { pitchSlot });
    });

    window.addEventListener('torneo:add-player', async (e) => {
      const suggestedName = sanitizePlayerName(e?.detail?.suggestedName || '');
      const matchId = e?.detail?.matchId;
      const slotIndex = Number(e?.detail?.slotIndex);
      const sideRaw = String(e?.detail?.side || '').toLowerCase();
      const side = sideRaw === 'b' ? 'b' : (sideRaw === 'a' ? 'a' : null);
      const x = Number(e?.detail?.x);
      const y = Number(e?.detail?.y);
      const pitchInsert = matchId && side && Number.isInteger(slotIndex)
        ? {
            matchId: String(matchId),
            side,
            slotIndex,
            x: Number.isFinite(x) ? x : null,
            y: Number.isFinite(y) ? y : null,
          }
        : null;
      if (!pitchInsert) {
        openModalForNew(suggestedName, { pitchInsert: null });
        return;
      }
      try {
        const selection = await chooseExistingPlayerForPitchSlot(pitchInsert, suggestedName);
        if (selection.action === 'cancel') return;
        if (selection.action === 'existing' && selection.player) {
          await insertPlayerIntoPitchSlot(selection.player, pitchInsert);
          toast('Giocatore inserito nello slot');
          return;
        }
        openModalForNew(suggestedName, { pitchInsert });
      } catch (err) {
        console.error(err);
        toast(`Errore selezione giocatore: ${err.message}`);
      }
    });

    if (refs.btnExport) {
      refs.btnExport.addEventListener('click', async () => {
        const payload = await api(`/tournaments/${state.currentId}`);
        const blob = new Blob([JSON.stringify(payload.tournament, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'torneo-export.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      });
    }

    if (refs.fileImport) {
      refs.fileImport.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const parsed = JSON.parse(await file.text());
          const created = await api('/tournaments', { method: 'POST', body: { name: `${parsed.name || 'Torneo importato'} (importato)` } });
          const tId = created.tournament.id;
          await loadTournament(tId);
          const players = Array.isArray(parsed.players) ? parsed.players : [];
          for (const p of players) {
            await addPlayerWithDuplicateFlow({
              name: p.name,
              roles: Array.isArray(p.roles) ? p.roles : [],
              tec: normalizePlayerBaseScore(p.tec),
              fis: normalizePlayerBaseScore(p.fis),
              age: p.age || null,
              flag: p.flag || null,
              techDetails: p.techDetails || null,
            });
          }
          const list = await api('/tournaments');
          state.tournaments = list.tournaments;
          await loadTournament(tId);
          toast('Import completato');
        } catch (err) {
          toast(`Import non valido: ${err.message}`);
        } finally {
          refs.fileImport.value = '';
        }
      });
    }

    refs.btnClearAll.addEventListener('click', async () => {
      const ok = await askForConfirmation({
        title: 'Reset tornei',
        message: 'Cancellare tutti i tornei?',
        confirmLabel: 'Cancella',
      });
      if (!ok) return;
      for (const t of state.tournaments.slice(1)) {
        await api(`/tournaments/${t.id}`, { method: 'DELETE' });
      }
      await loadTournament(state.tournaments[0].id);
      toast('Reset completato');
    });

    refs.btnDuplicateCancel.addEventListener('click', () => closeDuplicateModal(null));
    refs.btnDuplicateNew.addEventListener('click', () => closeDuplicateModal({ strategy: 'new' }));
    refs.btnDuplicateReuse.addEventListener('click', () => closeDuplicateModal({ strategy: 'reuse', profileId: state.duplicateSelectedProfileId }));
    refs.confirmModal?.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-confirm]')) {
        closeConfirmModal(false);
      }
    });
    refs.btnConfirmCancel?.addEventListener('click', () => closeConfirmModal(false));
    refs.btnConfirmOk?.addEventListener('click', () => closeConfirmModal(true));
    refs.textInputModal?.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-text-input]')) {
        closeTextInputModal({ confirmed: false, value: '' });
      }
    });
    refs.btnTextInputCancel?.addEventListener('click', () => closeTextInputModal({ confirmed: false, value: '' }));
    refs.btnTextInputOk?.addEventListener('click', () => {
      closeTextInputModal({ confirmed: true, value: refs.textInputField?.value || '' });
    });
    refs.textInputField?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        closeTextInputModal({ confirmed: true, value: refs.textInputField?.value || '' });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeTextInputModal({ confirmed: false, value: '' });
      }
    });
    refs.pitchSelectModal?.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-pitch-select]')) {
        closePitchSelectModal({ action: 'cancel' });
      }
    });
    refs.btnPitchSelectCancel?.addEventListener('click', () => closePitchSelectModal({ action: 'cancel' }));
    refs.btnPitchSelectNew?.addEventListener('click', () => closePitchSelectModal({ action: 'new' }));
    refs.pitchSelectSearch?.addEventListener('input', () => {
      state.pitchSelectQuery = refs.pitchSelectSearch.value || '';
      const prevSelected = state.pitchSelectSelectedId;
      renderPitchSelectList();
      const options = getPitchSelectOptions();
      const stillVisible = options.some((player) => sameId(player.id, prevSelected));
      if (!stillVisible && options[0]) {
        state.pitchSelectSelectedId = String(options[0].id);
        renderPitchSelectList();
      }
    });
    refs.pitchSelectSearch?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        movePitchSelected(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        movePitchSelected(-1);
      } else if (e.key === 'Enter') {
        if (applyPitchSelected()) e.preventDefault();
      }
    });
    refs.btnPitchSelectUse?.addEventListener('click', () => {
      if (!state.pitchSelectSelectedId) {
        toast('Seleziona una voce dalla lista');
        return;
      }
      applyPitchSelected();
    });

    refs.navSchede.addEventListener('click', () => runSideNavigation('schede'));
    refs.navClassifiche.addEventListener('click', () => runSideNavigation('classifiche'));
    refs.navTabellone.addEventListener('click', () => runSideNavigation('tabellone'));
    refs.navTimer.addEventListener('click', () => runSideNavigation('timer'));
  }

  function activateNav(active, selector) {
    refs.navSchede.classList.toggle('active', active === 'schede');
    refs.navClassifiche.classList.toggle('active', active === 'classifiche');
    refs.navTabellone.classList.toggle('active', active === 'tabellone');
    refs.navTimer.classList.toggle('active', active === 'timer');
    $(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initReveal() {
    const nodes = $$('.reveal');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    nodes.forEach((el) => io.observe(el));
  }

  async function start() {
    refs.heroEdition.textContent = String(new Date().getFullYear());
    bindEvents();
    try {
      await bootstrap();
      renderFlagList();
      updateBulkPreview();
      renderAll();
      syncAllRatingSliders();
      initReveal();
    } catch (err) {
      console.error(err);
      toast('Backend non raggiungibile. Avvia il server con: cd server && npm run dev');
    }
  }

  start();
})();

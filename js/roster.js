// @ts-check
/* Teilnehmer-Auswahl fuer die teamlosen Spiele (Der Duemmste fliegt, Der Preis
   ist heiss).

   Beide stellen ihre Teilnehmerliste auf dieselbe Weise zusammen: gewaehlte
   Spieler-Accounts plus Gaeste, die der Host von Hand eintraegt. Der Code stand
   zweimal fast wortgleich in ddf.js und pih.js - bis auf die Praefixe Zeile fuer
   Zeile identisch. Hier steht er einmal; welches Spiel gemeint ist, kommt als
   Kennung ('ddf' / 'pih') herein.

   Ein drittes teamloses Spiel braucht kuenftig nur einen Eintrag in ROSTERS. */

const ROSTERS = {
  ddf: { lobby: 'ddf-setup-lobby', inputs: 'ddf-player-inputs', screen: 'ddf-setup-screen' },
  pih: { lobby: 'pih-setup-lobby', inputs: 'pih-player-inputs', screen: 'pih-setup-screen' },
};

// Zustand pro Spiel, beim ersten Zugriff angelegt.
const rosterStates = {};
function roster(game) {
  return rosterStates[game] || (rosterStates[game] = { selected: new Set(), guests: [], seeded: false });
}

// Beim ersten Oeffnen sind die gerade verbundenen Accounts vorausgewaehlt,
// alles Weitere entscheidet der Host.
function rosterSeed(game) {
  const r = roster(game);
  if (r.seeded) return;
  const online = Object.keys(onlinePlayerKeys || {}).filter(k => onlinePlayerKeys[k]);
  if (!online.length && !(allPlayers || []).length) return;   // noch nichts geladen
  online.forEach(k => r.selected.add(k));
  r.seeded = true;
}

/* Wie die Teams heissen. Bei "Der Preis ist heiss" stehen die Namen im
   Setup, sonst kommen sie aus einem laufenden Turnier. Die ZUORDNUNG steht
   nicht hier, sondern am Account - dieselbe Quelle wie beim Turnier.
   @param {string} game @returns {string[]} */
function rosterTeamNames(game) {
  if (game === 'pih' && typeof pihTeamNames === 'function') return pihTeamNames();
  const t = (typeof tournament !== 'undefined' && tournament && tournament.teams) || [];
  return [t[0] || 'Team 1', t[1] || 'Team 2'];
}

/** Team-Index eines Accounts, oder null. @param {any} p @returns {number|null} */
function rosterTeamOf(p) {
  const t = p ? p.team : null;
  return (t === undefined || t === null || t < 0 || t > 1) ? null : t;
}

function renderRosterLobby(game) {
  const cfg = ROSTERS[game];
  const box = cfg && document.getElementById(cfg.lobby);
  if (!box) return;
  rosterSeed(game);
  const r = roster(game);

  const accounts = [...(allPlayers || [])].sort((a, b) => {
    const aOn = !!onlinePlayerKeys[a.key], bOn = !!onlinePlayerKeys[b.key];
    if (aOn !== bOn) return aOn ? -1 : 1;
    return a.name.localeCompare(b.name, 'de');
  });

  /* Team-Knoepfe je Zeile. Die gab es hier nie - in dieser Lobby liess sich
     nur auswaehlen, WER mitspielt, nicht in welchem Team. Bei "Der Preis ist
     heiss" braucht es die Teams inzwischen fuer den Teamstand und fuers
     Finale, und ohne Knopf stand der Host davor und konnte nichts zuteilen.
     assignPlayerTeam schreibt an dieselbe Stelle wie alle anderen Lobbys. */
  const namen = rosterTeamNames(game);
  const teamBtns = p => `<span class="roster-teams">${namen.map((n, i) =>
      `<button class="pr-team-btn ${rosterTeamOf(p) === i ? 'active' : ''}"
               onclick="assignPlayerTeam(${escJsArg(p.key)},${i})">${escapeHtml(n)}</button>`).join('')
    }${rosterTeamOf(p) === null ? '' :
      `<button class="pr-team-btn" title="Team wegnehmen" onclick="assignPlayerTeam(${escJsArg(p.key)},null)">✕</button>`}</span>`;

  const rows = accounts.length
    ? accounts.map(p => {
        const on = r.selected.has(p.key);
        const online = !!onlinePlayerKeys[p.key];
        return `<div class="pr-row" style="${on ? '' : 'opacity:.45;'}">
          <span class="online-dot${online ? '' : ' offline'}" title="${online ? 'Online' : 'Offline'}"></span>
          ${playerAvatarHtml(p)}
          <span style="flex:1;">${escAttr(p.name)}</span>
          <button class="btn ${on ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px;font-size:.7rem;"
                  onclick="rosterToggle('${game}', ${escJsArg(p.key)})">${on ? '✓ spielt mit' : 'dazu'}</button>
          ${on ? teamBtns(p) : ''}
        </div>`;
      }).join('')
    : `<div class="pr-empty">Noch keine Spieler-Accounts angelegt — QR-Code scannen oder Gäste eintragen</div>`;

  /* Die Aufstellung als eine Zeile. Untereinander stand bisher nur, WER
     mitspielt - wer in welchem Team ist, musste man sich aus den Knoepfen
     zusammensuchen. */
  const mit = accounts.filter(p => r.selected.has(p.key));
  const proTeam = namen.map((n, i) => {
    const drin = mit.filter(p => rosterTeamOf(p) === i).map(p => escAttr(p.name));
    return `<span class="roster-team-sum t${i}"><b>${escAttr(n)}</b> ${drin.length ? drin.join(', ') : '—'}</span>`;
  }).join('');
  const ohne = mit.filter(p => rosterTeamOf(p) === null).map(p => escAttr(p.name))
    .concat(r.guests.map(g => (g || '').trim()).filter(Boolean).map(g => escAttr(g) + ' (Gast)'));
  const aufstellung = `<div class="roster-lineup">${proTeam}${
    ohne.length ? `<span class="roster-team-sum ohne"><b>ohne Team</b> ${ohne.join(', ')}</span>` : ''}</div>`;

  box.innerHTML = `
    <div class="panel-head"><span>👥 Teilnehmer</span><span class="badge">${rosterContestants(game).length}</span></div>
    <div class="pr-list">${rows}</div>
    ${aufstellung}
    <div class="panel-row">
      <button class="btn btn-secondary" onclick="rosterSelectAll('${game}', true)">Alle</button>
      <button class="btn btn-secondary" onclick="rosterSelectAll('${game}', false)">Keinen</button>
      <button class="btn btn-secondary" onclick="toggleJeopardyQR()">${document.getElementById('qr-overlay') ? '✕ QR schließen' : '📱 QR-Code'}</button>
      <button class="btn btn-secondary" onclick="openPlayersScreen('${cfg.screen}')">👥 Accounts verwalten</button>
    </div>`;
}

function rosterToggle(game, key) {
  const r = roster(game);
  if (r.selected.has(key)) r.selected.delete(key); else r.selected.add(key);
  r.seeded = true;
  renderRosterLobby(game);
}

function rosterSelectAll(game, on) {
  const r = roster(game);
  r.selected = on ? new Set((allPlayers || []).map(p => p.key)) : new Set();
  r.seeded = true;
  renderRosterLobby(game);
}

// Gebuzzert wird in diesen Spielen nicht, gebraucht wird nur die Account-Liste.
// Die QR-Verbindung bleibt trotzdem offen, damit sich spontan noch jemand einen
// Account anlegen kann.
function ensureRosterConnected(game) {
  activeBuzzerContext = game;
  ensurePlayersConnected();
  const isFresh = !feudBuzzer.fbRef;
  feudBuzzConnect();
  if (isFresh && feudBuzzer.fbRef) feudBuzzer.fbRef.update({ joinLocked: false, lockedNames: null }).catch(() => {});
  renderRosterLobby(game);
}

// Gewaehlte Accounts plus Gaeste ohne Account.
function rosterContestants(game) {
  const r = roster(game);
  const byKey = new Map((allPlayers || []).map(p => [p.key, p]));
  const chosen = [...r.selected]
    .map(k => byKey.get(k))
    .filter(Boolean)
    .map(p => ({ name: p.name, avatar: p.avatar, color: p.color, key: p.key }));
  const guests = r.guests
    .map(n => (n || '').trim()).filter(Boolean)
    .map(n => ({ name: n, avatar: null, color: null, key: null }));
  return chosen.concat(guests);
}

function renderRosterInputs(game) {
  const cfg = ROSTERS[game];
  const box = cfg && document.getElementById(cfg.inputs);
  if (!box) return;
  box.innerHTML = roster(game).guests.map((n, i) => `
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <input type="text" value="${escAttr(n)}" placeholder="Name..." style="flex:1;"
             oninput="rosterSetGuest('${game}', ${i}, this.value)">
      <button class="btn btn-danger" style="padding:6px 12px;" onclick="rosterRemoveGuest('${game}', ${i})">✕</button>
    </div>`).join('');
}

// Beim Tippen nur den Wert merken und die Zaehlung auffrischen - das Feld selbst
// darf nicht neu gebaut werden, sonst springt der Cursor ans Ende.
function rosterSetGuest(game, i, value) {
  roster(game).guests[i] = value;
  renderRosterLobby(game);
}
function rosterAddGuest(game) {
  roster(game).guests.push('');
  renderRosterInputs(game);
  renderRosterLobby(game);
}
function rosterRemoveGuest(game, i) {
  roster(game).guests.splice(i, 1);
  renderRosterInputs(game);
  renderRosterLobby(game);
}

// Nach einer Aenderung an den Accounts die gerade offene Auswahl auffrischen.
function refreshOpenRosterLobby() {
  Object.keys(ROSTERS).forEach(game => {
    if (screenActive(ROSTERS[game].screen)) renderRosterLobby(game);
  });
}

// Anzeigename. Kommt ein Name doppelt vor, wird durchnummeriert - sonst stehen
// auf den Handys zwei gleich beschriftete Knoepfe und in der Auswertung zwei
// identische Zeilen.
function rosterLabelFor(people, i) {
  const name = people[i].name;
  if (people.filter(p => p.name === name).length < 2) return name;
  const nth = people.slice(0, i + 1).filter(p => p.name === name).length;
  return `${name} (${nth})`;
}

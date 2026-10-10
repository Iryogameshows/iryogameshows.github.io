// PreToolUse-Hook fuer Bash: erinnert bei "git commit" an die Design-Pruefung
// (tools/shots), wenn gestagte Dateien das Aussehen betreffen und die
// Kontaktboegen aelter sind als diese Dateien. Sperrt NICHT - ein voller Lauf
// dauert rund fuenf Minuten, und nicht jede CSS-Zeile braucht ihn. Die
// Erinnerung geht als additionalContext an Claude und als systemMessage an
// David.
//
// Anlass: Richtung E ohne Spielbrett, GM-Fenster und Handys ohne Gestaltung
// fielen erst David auf (HANDOFF 431a43e).
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DESIGN = /^(styles\.css|js\/theme\.js|js\/core\.js|buzzer\/index\.html|gamepad\/index\.html|mainscreen\/index\.html)$/;

let raw = '';
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = String(JSON.parse(raw).tool_input.command || ''); }
  catch { process.exit(0); }
  if (!/\bgit(?:\s+-\S+(?:\s+[^-\s]\S*)?)*\s+commit\b/.test(cmd)) process.exit(0);

  const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const r = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: dir, encoding: 'utf8' });
  // "git commit -a" o. ae.: dann zaehlen auch die geaenderten, ungestagten.
  const r2 = /\s-[a-zA-Z]*a\b|--all\b/.test(cmd) ? spawnSync('git', ['diff', '--name-only'], { cwd: dir, encoding: 'utf8' }) : { stdout: '' };
  const files = [...new Set(((r.stdout || '') + (r2.stdout || '')).split('\n').map(s => s.trim()).filter(Boolean))]
    .filter(f => DESIGN.test(f));
  if (!files.length) process.exit(0);

  const neueste = Math.max(...files.map(f => { try { return fs.statSync(path.join(dir, f)).mtimeMs; } catch { return 0; } }));
  const out = path.join(dir, 'tools', 'shots', 'out');
  let boegen = 0;
  try {
    boegen = Math.max(0, ...fs.readdirSync(out).filter(n => /^bogen-.*\.png$/.test(n)).map(n => fs.statSync(path.join(out, n)).mtimeMs));
  } catch {}
  if (boegen >= neueste) process.exit(0);

  const text = `Design-Dateien im Commit (${files.join(', ')}), aber die Kontaktboegen in tools/shots/out sind aelter als diese Dateien. ` +
    'Vor dem Commit /design-pruefung bzw. node tools/shots/shots.js laufen lassen und die Boegen ansehen - ' +
    'oder im Commit/HANDOFF begruenden, warum es hier nicht noetig ist.';
  process.stdout.write(JSON.stringify({
    systemMessage: 'Erinnerung: Design-Pruefung (tools/shots) seit der letzten Aenderung nicht gelaufen.',
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: text },
  }));
  process.exit(0);
});

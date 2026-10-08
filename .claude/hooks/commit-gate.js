// PreToolUse-Hook fuer Bash: sperrt "git commit", solange "node check.js"
// Fehler meldet. Exit 2 blockiert den Aufruf, stderr geht an Claude.
// Alles andere (kein Commit, kaputte Eingabe, check.js laeuft) laesst durch.
const { spawnSync } = require('child_process');

let raw = '';
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = String(JSON.parse(raw).tool_input.command || ''); }
  catch { process.exit(0); }

  // "git commit", auch mit Optionen davor ("git -C pfad commit"), aber nicht
  // "git log --grep=commit".
  if (!/\bgit(?:\s+-\S+(?:\s+[^-\s]\S*)?)*\s+commit\b/.test(cmd)) process.exit(0);

  const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const r = spawnSync(process.execPath, ['check.js'], { cwd: dir, encoding: 'utf8' });
  if (r.status === 0) process.exit(0);

  const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-25).join('\n');
  process.stderr.write('Commit gesperrt: node check.js meldet Fehler (Exit ' + r.status + ').\n' + out + '\n');
  process.exit(2);
});

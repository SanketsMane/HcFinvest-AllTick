const { Client } = require('ssh2');
const c = new Client();

const CMDS = [
  'cd ~/hcfinvest && git pull origin Prod_Final',
  'cd ~/hcfinvest/frontend && npm run build 2>&1 | tail -5',
  'ls -la ~/hcfinvest/frontend/dist/assets/index-*.js',
];

c.on('error', e => { console.log('SSH Error:', e.message); process.exit(1); });
c.on('ready', () => {
  let i = 0;
  function run() {
    if (i >= CMDS.length) { c.end(); return; }
    const cmd = CMDS[i++];
    console.log('\n>>> ' + cmd);
    c.exec(cmd, (e, s) => {
      if (e) { console.log('ERR:', e.message); run(); return; }
      let o = '';
      s.on('data', d => o += d);
      s.stderr.on('data', d => o += d);
      s.on('close', () => { console.log(o.trim()); console.log('---'); run(); });
    });
  }
  run();
});

c.connect({
  host: '206.189.142.175',
  port: 22,
  username: 'hcfinvest',
  password: 'pune@N!lesh$2025'
});

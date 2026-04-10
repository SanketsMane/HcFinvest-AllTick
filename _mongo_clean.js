const { Client } = require('ssh2');
const c = new Client();

const CMD = "mongosh mongodb://localhost:27017/hcf --quiet --eval \"db.chartlayouts.deleteMany({})\"";

c.on('error', e => { console.log('SSH Error:', e.message); process.exit(1); });
c.on('ready', () => {
  console.log('Connected. Running:', CMD);
  c.exec(CMD, (e, s) => {
    if (e) { console.log('ERR:', e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d);
    s.stderr.on('data', d => o += d);
    s.on('close', () => { console.log('Result:', o.trim()); c.end(); });
  });
});

c.connect({
  host: '206.189.142.175',
  port: 22,
  username: 'hcfinvest',
  password: 'pune@N!lesh$2025'
});

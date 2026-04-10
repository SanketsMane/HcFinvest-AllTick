const { Client } = require('ssh2');
const c = new Client();

const CMDS = [
  // 1. Check if the backend is currently emitting ticks — grab last 5 lines of out log
  'tail -5 /home/hcfinvest/.pm2/logs/hcfinvest-backend-out.log',
  // 2. Check recent errors
  'tail -10 /home/hcfinvest/.pm2/logs/hcfinvest-backend-error.log',
  // 3. Check how many Socket.IO rooms/clients are connected right now
  'cd ~/hcfinvest && node -e "import http from \'http\'; const req=http.get(\'http://localhost:5001/api/prices/time\',res=>{let d=\'\';res.on(\'data\',c=>d+=c);res.on(\'end\',()=>{console.log(d);process.exit(0)})}); req.on(\'error\',e=>{console.log(e.message);process.exit(1)})" 2>&1',
  // 4. Check server.js around line 190 to see how tickUpdate is emitted
  'cd ~/hcfinvest && sed -n "170,196p" backend/server.js',
  // 5. Check if priceSubscribers is populated — search for relevant logs
  'grep "subscribed to price\\|priceSubscribers" /home/hcfinvest/.pm2/logs/hcfinvest-backend-out.log | tail -5',
  // 6. Check the deployed frontend priceStream.js to see if our fix is actually in the build
  'cd ~/hcfinvest && grep -c "_visibilityHandler\\|_tabHiddenSince\\|handleTabVisibility" frontend/dist/assets/index-*.js',
  // 7. Check for any uncaught errors in PM2
  'pm2 show 0 2>&1 | grep -i "restart\\|unstable\\|error\\|status"',
  // 8. Check server.js — how are candle rooms subscribed?
  'cd ~/hcfinvest && grep -n "subscribeCand\\|candles:" backend/server.js | head -10',
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

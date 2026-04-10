const { Client } = require('ssh2');
const c = new Client();

const CMDS = [
  // 1. Add no-cache for index.html on trade.hcfinvest.com (requires sudo)
  `sudo sed -i '/server_name trade.hcfinvest.com;/,/listen 443 ssl;/{
    /location \\/ {/a\\        # Sanket v2.0 - Never cache index.html so new builds are served immediately\\n        add_header Cache-Control "no-cache, no-store, must-revalidate" always;\\n        add_header Pragma "no-cache" always;
  }' /etc/nginx/sites-available/hcfinvest 2>&1 || echo "Need root access for nginx"`,
  // 2. Test nginx config
  'sudo nginx -t 2>&1 || echo "nginx test failed or no sudo"',
  // 3. Reload nginx
  'sudo systemctl reload nginx 2>&1 || echo "nginx reload failed or no sudo"',
  // 4. Verify chart layouts actually deleted
  'cd ~/hcfinvest/backend && node -e "import mongoose from \'mongoose\'; import ChartLayout from \'./models/ChartLayout.js\'; mongoose.connect(process.env.MONGODB_URI || \'mongodb://127.0.0.1:27017/hcf\').then(async()=>{const count=await ChartLayout.countDocuments(); console.log(\'Remaining chart layouts:\',count); process.exit(0)}).catch(e=>{console.log(e.message); process.exit(1)})" 2>&1',
  // 5. Check ETag for current trade.hcfinvest.com
  'curl -sI "https://trade.hcfinvest.com" 2>/dev/null | grep -iE "cache|etag|content-type" || echo "cant-reach-trade-domain"',
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

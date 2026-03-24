const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`echo 'pune@N!lesh$2025' | sudo -S rm -rf /home/hcfinvest/hcfinvest/frontend/dist && cd /home/hcfinvest/hcfinvest/frontend && npm run build`, (err, stream) => { 
    if (err) throw err; 
    stream.on('close', () => { 
      conn.end(); 
      process.exit(0); 
    }).on('data', (data) => { 
      console.log(data.toString()); 
    }).stderr.on('data', (data) => { 
      console.error(data.toString()); 
    }); 
  }); 
}).connect({ 
  host: '206.189.142.175', 
  port: 22, 
  username: 'hcfinvest', 
  password: 'pune@N!lesh$2025' 
});

const { Client } = require('ssh2');

const config = {
    host: '143.198.106.204',
    port: 22,
    username: 'ubuntu',
    password: 'hcFinvest.com2026march',
    readyTimeout: 20000
};

console.log('Connecting to:', config.host, 'as', config.username);

const c = new Client();
c.on('error', e => { 
    console.error('Connection Error:', e.message); 
    process.exit(1); 
});
c.on('ready', () => {
    console.log('--- Connected Successfully ---');
    c.exec('pm2 status && pm2 logs --lines 100 --nostream', (e, s) => {
        if (e) { 
            console.error('Exec Error:', e.message); 
            c.end(); 
            return; 
        }
        s.on('data', d => process.stdout.write(d));
        s.stderr.on('data', d => process.stderr.write(d));
        s.on('close', () => {
            console.log('\n--- Finished ---');
            c.end();
        });
    });
});

c.connect(config);

import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
});

async function inspect() {
    try {
        console.log('Connecting to Redis...');
        const prices = await redis.hgetall('live_prices');
        console.log('--- live_prices Hash Content ---');
        for (const [key, val] of Object.entries(prices)) {
            const data = JSON.parse(val);
            const ts = data.timestamp || data.time;
            const age = (Date.now() - new Date(ts).getTime()) / 1000;
            console.log(`Key: ${key} | Symbol: ${data.symbol} | Price: ${data.bid || data.price} | Age: ${age.toFixed(1)}s | Last Updated: ${ts}`);
        }
        console.log('-------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspect();

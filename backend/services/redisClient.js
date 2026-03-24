import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Redis connection options with retry logic
const redisOptions = {
    // Read URL from .env, or use standard localhost default
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,

    // How long to wait before trying to reconnect
    retryStrategy(times) {
        // Reconnect after
        // Delay starts at 50ms and caps at 2 seconds
        const delay = Math.min(times * 50, 2000);
        
        console.log(`[Redis] Retrying connection in ${delay}ms... (Attempt ${times})`);
        return delay;
    },
    
    // Stop retrying if there's no connection after 20 attempts
    maxRetriesPerRequest: 20,
    
    // Reconnect on specific errors
    reconnectOnError(err) {
        console.warn(`[Redis] Reconnecting due to error:`, err.message);
        return true; 
    }
};

// Initialize ioredis client
const redisClient = new Redis(redisOptions);

// Connection Events
redisClient.on('connect', () => {
    console.log('[Redis] Connected to Redis server.');
});

redisClient.on('ready', () => {
    console.log('[Redis] Client is ready to receive commands.');
});

redisClient.on('error', (err) => {
    console.error('[Redis] Connection Error:', err.message);
});

redisClient.on('close', () => {
    console.log('[Redis] Connection closed.');
});

export default redisClient;

import redisClient from './services/redisClient.js';

async function inspectPrices() {
  try {
    const prices = await redisClient.hgetall('live_prices');
    console.log('Live Prices Keys:', Object.keys(prices));
    for (const [symbol, data] of Object.entries(prices)) {
      if (symbol.includes('XAUUSD')) {
        console.log(`Data for ${symbol}:`, data);
        const parsed = JSON.parse(data);
        console.log(`Parsed ${symbol}:`, parsed);
        console.log(`Timestamp field: ${parsed.timestamp}, Time field: ${parsed.time}`);
        console.log(`new Date(timestamp):`, new Date(parsed.timestamp));
        console.log(`new Date(time):`, new Date(parsed.time));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

inspectPrices();

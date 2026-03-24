import { Worker } from 'bullmq';
import redisClient from '../services/redisClient.js';
import tradeEngine from '../services/tradeEngine.js';
import propTradingEngine from '../services/propTradingEngine.js';

// The Worker listens to the queue and processes jobs ONE BY ONE.
// This prevents race conditions and database locks.
const tradeWorker = new Worker('trade-execution-queue', async (job) => {
  console.log(`[Worker] Started processing job ${job.id}`);
  const data = job.data;

  try {
    // 1. Fetch exact CURRENT price from Redis (Preventing stale prices)
    const livePriceString = await redisClient.hget('live_prices', data.symbol);
    if (!livePriceString) {
        throw new Error(`No live price feed available for ${data.symbol}`);
    }
    const livePrice = JSON.parse(livePriceString);
    const executionBid = livePrice.bid;
    const executionAsk = livePrice.ask;

    // 2. Execute the trade via the engine
    // (This handles checking margin, creating DB record, etc.)
    let trade;
    if (data.isChallengeAccount) {
        // Prop firm accounts
        trade = await propTradingEngine.openChallengeTrade(
            data.userId,
            data.tradingAccountId,
            { ...data, bid: executionBid, ask: executionAsk }
        );
    } else {
        // Regular accounts
        trade = await tradeEngine.openTrade(
            data.userId,
            data.tradingAccountId,
            data.symbol,
            data.segment,
            data.side,
            data.orderType,
            data.quantity,
            executionBid, // Using fresh Redis price!
            executionAsk, // Using fresh Redis price!
            data.sl,
            data.tp,
            data.leverage,
            data.pendingPrice
        );
    }

    console.log(`[Worker] Successfully executed job ${job.id} - Trade ID: ${trade._id}`);
    
    // Note: Emitting to WebSocket would happen here or inside tradeEngine
    // e.g. io.to('account:123').emit('tradeUpdated', trade)
    
    return trade;

  } catch (error) {
    console.error(`[Worker] Job ${job.id} failed:`, error.message);
    throw error;
  }

}, { 
  connection: redisClient,
  concurrency: 1 // Only process 1 trade at a time to prevent Race Conditions!
});

tradeWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

tradeWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} encountered an error: ${err.message}`);
});

export default tradeWorker;

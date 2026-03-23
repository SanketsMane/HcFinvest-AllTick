import { Queue } from 'bullmq';
import redisClient from '../services/redisClient.js'; // Reusing your existing Redis connection

// Create the Trade Queue
// This acts as the "inbox" where incoming trades wait to be processed
export const tradeQueue = new Queue('trade-execution-queue', {
  connection: redisClient,
  defaultJobOptions: {
    removeOnComplete: true, // Keep Redis clean by removing finished jobs
    removeOnFail: 1000,     // Keep the last 1000 failed jobs for debugging
    attempts: 1             // Trades shouldn't retry automatically if price changes
  }
});

// Helper function to easily add a trade job
export const queueTradeList = async (tradeData) => {
  try {
    const job = await tradeQueue.add('execute-trade', tradeData);
    console.log(`[Queue] Trade job ${job.id} added for ${tradeData.symbol}`);
    return job;
  } catch (err) {
    console.error(`[Queue] Failed to queue trade:`, err);
    throw err;
  }
};

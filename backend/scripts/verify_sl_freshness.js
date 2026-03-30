import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from one level up
dotenv.config({ path: path.join(__dirname, '../.env') });

import Trade from '../models/Trade.js';
import tradeEngine from '../services/tradeEngine.js';

async function runVerification() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    // 1. Create/Find a test trade
    let trade = await Trade.findOne({ status: 'OPEN', symbol: 'XAUUSD.i' });
    if (!trade) {
       console.log('Creating fresh test trade...');
       trade = await Trade.create({
        userId: new mongoose.Types.ObjectId(),
        tradingAccountId: new mongoose.Types.ObjectId(),
        symbol: 'XAUUSD.i',
        side: 'BUY',
        quantity: 0.1,
        openPrice: 2000,
        status: 'OPEN',
        openedAt: new Date(),
        stopLoss: 1990
      });
    } else {
      trade.stopLoss = 1990;
      trade.status = 'OPEN';
      await trade.save();
    }
    
    console.log(`Test trade ${trade._id} configured with SL: ${trade.stopLoss}`);

    // 2. Mock Stale Price Data (Age: 70 seconds)
    const staleTimestamp = Date.now() - 70000;
    const mockPrices = {
      'XAUUSD.i': {
        symbol: 'XAUUSD.i',
        bid: 1980, // This would trigger SL 1990 for a BUY
        ask: 1981,
        timestamp: staleTimestamp
      }
    };

    console.log('Running SL/TP check with STALE price (70s old)...');
    const triggeredStale = await tradeEngine.checkSlTpForAllTrades(mockPrices);
    
    if (triggeredStale.length === 0) {
      console.log('✅ SUCCESS: Freshness guard correctly ignored stale price.');
    } else {
      console.error('❌ FAILURE: Freshness guard FAILED to ignore stale price.');
      console.log('Triggered trades:', triggeredStale);
    }

    // 3. Mock Fresh Price Data (Age: 5 seconds)
    const freshTimestamp = Date.now() - 5000;
    mockPrices['XAUUSD.i'].timestamp = freshTimestamp;

    console.log('Running SL/TP check with FRESH price (5s old)...');
    const triggeredFresh = await tradeEngine.checkSlTpForAllTrades(mockPrices);

    if (triggeredFresh.length > 0 && triggeredFresh[0].trigger === 'SL') {
      console.log('✅ SUCCESS: Freshness guard correctly allowed fresh price trigger.');
    } else {
      console.error('❌ FAILURE: Freshness guard incorrectly blocked fresh price or failed to trigger.');
    }

  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

runVerification().catch(err => {
    console.error(err);
    process.exit(1);
});

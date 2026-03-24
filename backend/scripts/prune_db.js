import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Candle from '../models/Candle.js';

dotenv.config();

const prune = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Flushing entire Candle collection to free up space...');
    
    // Using deleteMany({}) to clear everything
    const result = await Candle.deleteMany({});
    
    console.log(`Pruning completed. Total deleted: ${result.deletedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Prune failed:', error);
    process.exit(1);
  }
};

prune();

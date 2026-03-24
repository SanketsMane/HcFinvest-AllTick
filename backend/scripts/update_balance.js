import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TradingAccount from '../models/TradingAccount.js';
import User from '../models/User.js';
import Candle from '../models/Candle.js';

dotenv.config();

const update = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // 1. RECLAIM SPACE
    console.log('Attempting to drop Candle collection to free space...');
    try {
      await mongoose.connection.db.dropCollection('candles');
      console.log('Successfully dropped candles collection.');
    } catch (e) {
      console.log('Drop collection failed (maybe already empty/dropped):', e.message);
      console.log('Trying deleteMany as fallback...');
      await Candle.deleteMany({});
    }

    // 2. FIND AND UPDATE ACCOUNT
    const targetAccountId = '91120439';
    console.log(`Searching for TradingAccount with ID: ${targetAccountId}`);
    
    const account = await TradingAccount.findOne({ accountId: targetAccountId });
    if (!account) {
      console.error(`TradingAccount ${targetAccountId} not found.`);
      
      // Try searching user by name
      console.log('Searching for user by name "sanket mane"...');
      const user = await User.findOne({ firstName: /sanket/i });
      if (user) {
         console.log(`Found user: ${user.firstName} (${user.email})`);
         const userAccount = await TradingAccount.findOne({ userId: user._id });
         if (userAccount) {
            console.log(`Found associated account: ${userAccount.accountId}`);
            await performUpdate(user, userAccount);
         } else {
            console.log('User found but no trading account associated.');
            // Update wallet balance at least
            user.walletBalance = 10000;
            await user.save();
            console.log('Updated user walletBalance to 10000.');
         }
      } else {
        console.error('User "sanket mane" not found.');
      }
    } else {
      console.log(`Found account. Current balance: ${account.balance}`);
      const user = await User.findById(account.userId);
      await performUpdate(user, account);
    }

    async function performUpdate(user, account) {
      account.balance = 100000; // Updated to 100k as requested
      await account.save();
      console.log(`Updated account ${account.accountId} balance to ${account.balance}`);
      
      if (user) {
        user.walletBalance = 100000;
        await user.save();
        console.log(`Updated user ${user.firstName} walletBalance to ${user.walletBalance}`);
      }
    }

    console.log('Update process completed.');
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
};

update();

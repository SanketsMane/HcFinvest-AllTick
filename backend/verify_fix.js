import alltickApiService from './services/alltickApiService.js';
import redisClient from './services/redisClient.js';

async function test() {
    console.log('--- Verification Script Started ---');
    
    // 1. Test setLivePrice normalization
    const testData = { bid: 2500.5, ask: 2501.5, time: new Date().toISOString() };
    console.log('Setting price for XAUUSD.i...');
    await alltickApiService.setLivePrice('XAUUSD.i', testData);
    
    // 2. Test getLivePrice with permutations
    const queries = ['XAUUSD.i', 'XAUUSD.I', 'XAUUSD', 'xauusd.i'];
    console.log('\nTesting Symbol Permutations:');
    for (const q of queries) {
        const result = await alltickApiService.getLivePrice(q);
        if (result && result.bid === 2500.5) {
            console.log(`✅ ${q} -> Success! Found price ${result.bid}`);
        } else {
            console.log(`❌ ${q} -> Failed!`);
        }
    }
    
    // 3. Test Memory Fallback
    console.log('\nTesting Memory Fallback (Simulating Redis Miss)...');
    // We can't easily kill Redis connection here without affecting everything, 
    // but check if memory exists index
    if (alltickApiService.prices['XAUUSD.i'] && alltickApiService.prices['XAUUSD']) {
        console.log('✅ Memory cache contains both suffix and base keys.');
    } else {
        console.log('❌ Memory cache index missing.');
    }
    
    console.log('\n--- Verification Finished ---');
    process.exit(0);
}

test();

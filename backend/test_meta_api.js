
const axios = require('axios');
require('dotenv').config();

const token = process.env.METAAPI_TOKEN;
const accountId = process.env.METAAPI_ACCOUNT_ID;
const region = process.env.METAAPI_REGION || 'new-york';

const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;

async function testMetaApi() {
    console.log('--- MetaAPI Diagnostic ---');
    console.log('Token starts with:', token ? token.substring(0, 10) : 'MISSING');
    console.log('Account ID:', accountId);
    console.log('Region:', region);

    if (!token || !accountId) {
        console.error('ERROR: Missing credentials in .env');
        return;
    }

    try {
        console.log('1. Testing Account Info...');
        const res = await axios.get(`${baseUrl}/users/current/accounts/${accountId}`, {
            headers: { 'auth-token': token }
        });
        console.log('Account Status:', res.data.status);
        console.log('Connection Status:', res.data.connectionStatus);
        console.log('Deployment State:', res.data.deploymentState);
        
        console.log('\n2. Testing Symbols...');
        const symbolRes = await axios.get(`${baseUrl}/users/current/accounts/${accountId}/symbols`, {
            headers: { 'auth-token': token }
        });
        console.log('Total Symbols found:', symbolRes.data.length);
        console.log('First 5 symbols:', symbolRes.data.slice(0, 5));

    } catch (err) {
        console.error('ERROR:', err.response ? err.response.status : 'Network Error', err.response ? JSON.stringify(err.response.data) : err.message);
    }
}

testMetaApi();

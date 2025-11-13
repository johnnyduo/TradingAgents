const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

async function testAlphaVantage() {
  console.log('\n🔍 Testing Alpha Vantage API...\n');
  
  if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'demo') {
    console.warn('⚠️  Using demo API key (limited functionality)');
  }
  
  console.log('API Key:', ALPHA_VANTAGE_API_KEY.substring(0, 8) + '...\n');
  
  try {
    // Test 1: GLOBAL_QUOTE (Current Price)
    console.log('📊 Test 1: GLOBAL_QUOTE (Current Price for IBM)');
    const quoteResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'IBM',
        apikey: ALPHA_VANTAGE_API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('Response:', JSON.stringify(quoteResponse.data, null, 2));
    
    const quote = quoteResponse.data['Global Quote'];
    if (quote && Object.keys(quote).length > 0) {
      console.log('\n✅ SUCCESS: Got current price data');
      console.log('   Symbol:', quote['01. symbol']);
      console.log('   Price: $' + quote['05. price']);
      console.log('   Change:', quote['10. change percent']);
      console.log('   Volume:', quote['06. volume']);
      console.log('   Latest Trading Day:', quote['07. latest trading day']);
    } else {
      console.log('\n❌ FAILED: No quote data returned');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: TIME_SERIES_DAILY (Historical Data)
    console.log('📈 Test 2: TIME_SERIES_DAILY (Historical Prices for IBM)');
    const histResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: 'IBM',
        outputsize: 'compact',
        apikey: ALPHA_VANTAGE_API_KEY,
      },
      timeout: 10000,
    });
    
    const timeSeries = histResponse.data['Time Series (Daily)'];
    if (timeSeries) {
      const dates = Object.keys(timeSeries).slice(0, 5);
      console.log('\n✅ SUCCESS: Got historical data');
      console.log('   Latest 5 days:');
      dates.forEach(date => {
        const data = timeSeries[date];
        console.log(`   ${date}: Close=$${data['4. close']}, Volume=${data['5. volume']}`);
      });
    } else {
      console.log('\n❌ FAILED: No historical data returned');
      console.log('Response:', JSON.stringify(histResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testAlphaVantage();

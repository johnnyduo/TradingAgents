const axios = require('axios');

const TWELVE_DATA_API_KEY = '87f2fa4ff46945ff84fef04b9edaee07';

async function testTwelveData() {
  console.log('\n🔍 Testing Twelve Data API...\n');
  console.log('API Key:', TWELVE_DATA_API_KEY.substring(0, 12) + '...\n');
  
  try {
    // Test 1: Quote (Current Price)
    console.log('📊 Test 1: Quote (Current Price for AAPL)');
    const quoteResponse = await axios.get('https://api.twelvedata.com/quote', {
      params: {
        symbol: 'AAPL',
        apikey: TWELVE_DATA_API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('Response:', JSON.stringify(quoteResponse.data, null, 2));
    
    if (quoteResponse.data.status !== 'error') {
      console.log('\n✅ SUCCESS: Got current price data');
      console.log('   Symbol:', quoteResponse.data.symbol);
      console.log('   Name:', quoteResponse.data.name);
      console.log('   Price: $' + quoteResponse.data.close);
      console.log('   Change:', quoteResponse.data.change);
      console.log('   Percent Change:', quoteResponse.data.percent_change + '%');
      console.log('   Volume:', quoteResponse.data.volume);
      console.log('   DateTime:', quoteResponse.data.datetime);
    } else {
      console.log('\n❌ FAILED:', quoteResponse.data.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Time Series (Historical Data)
    console.log('📈 Test 2: Time Series (Historical Prices for AAPL)');
    const timeSeriesResponse = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol: 'AAPL',
        interval: '1day',
        outputsize: 5,
        apikey: TWELVE_DATA_API_KEY,
      },
      timeout: 10000,
    });
    
    if (timeSeriesResponse.data.status !== 'error' && timeSeriesResponse.data.values) {
      console.log('\n✅ SUCCESS: Got historical data');
      console.log('   Symbol:', timeSeriesResponse.data.meta.symbol);
      console.log('   Interval:', timeSeriesResponse.data.meta.interval);
      console.log('   Currency:', timeSeriesResponse.data.meta.currency);
      console.log('\n   Latest 5 days:');
      timeSeriesResponse.data.values.forEach((v, i) => {
        console.log(`   ${i+1}. ${v.datetime}: Close=$${v.close}, Volume=${v.volume}`);
      });
    } else {
      console.log('\n❌ FAILED:', timeSeriesResponse.data.message || 'No data');
      console.log('Response:', JSON.stringify(timeSeriesResponse.data, null, 2));
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 3: Technical Indicator (RSI)
    console.log('📉 Test 3: Technical Indicator (RSI for AAPL)');
    const rsiResponse = await axios.get('https://api.twelvedata.com/rsi', {
      params: {
        symbol: 'AAPL',
        interval: '1day',
        time_period: 14,
        apikey: TWELVE_DATA_API_KEY,
      },
      timeout: 10000,
    });
    
    if (rsiResponse.data.status !== 'error' && rsiResponse.data.values) {
      console.log('\n✅ SUCCESS: Got RSI data');
      console.log('   Symbol:', rsiResponse.data.meta.symbol);
      console.log('   Indicator: RSI(14)');
      console.log('\n   Latest 5 values:');
      rsiResponse.data.values.slice(0, 5).forEach((v, i) => {
        console.log(`   ${i+1}. ${v.datetime}: RSI=${v.rsi}`);
      });
    } else {
      console.log('\n❌ FAILED:', rsiResponse.data.message || 'No data');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testTwelveData();

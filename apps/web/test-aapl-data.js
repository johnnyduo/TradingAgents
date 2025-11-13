// Test script to see what AAPL data we're getting from APIs
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;

async function testAPIs() {
  console.log('\n========================================');
  console.log('TESTING AAPL DATA FROM APIs');
  console.log('========================================\n');

  // Test 1: Alpha Vantage GLOBAL_QUOTE
  console.log('1️⃣  ALPHA VANTAGE - GLOBAL_QUOTE (Current Price)');
  console.log('----------------------------------------');
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'AAPL',
        apikey: ALPHA_VANTAGE_KEY,
      },
    });
    
    const quote = response.data['Global Quote'];
    console.log('Raw Response:', JSON.stringify(quote, null, 2));
    
    if (quote && Object.keys(quote).length > 0) {
      console.log('\n✅ Extracted Data:');
      console.log(`   Symbol: ${quote['01. symbol']}`);
      console.log(`   Price: $${quote['05. price']}`);
      console.log(`   Change: ${quote['09. change']} (${quote['10. change percent']})`);
      console.log(`   Volume: ${quote['06. volume']}`);
      console.log(`   Latest Trading Day: ${quote['07. latest trading day']}`);
      console.log(`   Open: $${quote['02. open']}`);
      console.log(`   High: $${quote['03. high']}`);
      console.log(`   Low: $${quote['04. low']}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Twelve Data Quote
  if (TWELVE_DATA_KEY) {
    console.log('\n\n2️⃣  TWELVE DATA - Quote (Current Price)');
    console.log('----------------------------------------');
    try {
      const response = await axios.get('https://api.twelvedata.com/quote', {
        params: {
          symbol: 'AAPL',
          apikey: TWELVE_DATA_KEY,
        },
      });
      
      console.log('Raw Response:', JSON.stringify(response.data, null, 2));
      
      const data = response.data;
      if (data.status !== 'error') {
        console.log('\n✅ Extracted Data:');
        console.log(`   Symbol: ${data.symbol}`);
        console.log(`   Name: ${data.name}`);
        console.log(`   Price: $${data.close}`);
        console.log(`   Change: ${data.change} (${data.percent_change}%)`);
        console.log(`   Volume: ${data.volume}`);
        console.log(`   Open: $${data.open}`);
        console.log(`   High: $${data.high}`);
        console.log(`   Low: $${data.low}`);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('\n\n2️⃣  TWELVE DATA - SKIPPED (No API key)');
  }

  // Test 3: Alpha Vantage Historical
  console.log('\n\n3️⃣  ALPHA VANTAGE - TIME_SERIES_DAILY (Historical)');
  console.log('----------------------------------------');
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: 'AAPL',
        outputsize: 'compact',
        apikey: ALPHA_VANTAGE_KEY,
      },
    });
    
    const timeSeries = response.data['Time Series (Daily)'];
    if (timeSeries) {
      const dates = Object.keys(timeSeries).slice(0, 3); // Last 3 days
      console.log(`✅ Last 3 Trading Days:\n`);
      dates.forEach(date => {
        const data = timeSeries[date];
        console.log(`   ${date}:`);
        console.log(`     Open: $${data['1. open']}, High: $${data['2. high']}, Low: $${data['3. low']}, Close: $${data['4. close']}`);
        console.log(`     Volume: ${data['5. volume']}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log('Data Sources:');
  console.log('1. Alpha Vantage (Primary) - alphavantage.co');
  console.log('2. Twelve Data (Fallback) - twelvedata.com');
  console.log('\nThe Market Analyst uses these APIs to get:');
  console.log('- Current Price (GLOBAL_QUOTE or quote endpoint)');
  console.log('- Historical Prices (TIME_SERIES_DAILY or time_series)');
  console.log('- Technical Indicators (SMA, RSI, MACD)');
  console.log('\nIf you see wrong price ($12 instead of ~$230):');
  console.log('- The regex is extracting the WRONG number from the report');
  console.log('- Check the Market Analyst report text for the actual sentence');
  console.log('- The API data above shows the CORRECT price from source\n');
}

testAPIs();

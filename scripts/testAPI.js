const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

const testEndpoints = [
  { name: 'API Root', url: 'http://localhost:3000/' },
  { name: 'Health Check', url: `${BASE_URL}/health` },
  { name: 'Cases Overview', url: `${BASE_URL}/cases` },
  { name: 'Latest Cases', url: `${BASE_URL}/cases/latest` },
  { name: 'Cases Summary', url: `${BASE_URL}/cases/summary` },
  { name: 'Cases by Region', url: `${BASE_URL}/cases/by-region` },
  { name: 'Hospitals', url: `${BASE_URL}/hospitals` },
  { name: 'Hospital Capacity', url: `${BASE_URL}/hospitals/capacity` },
  { name: 'Vaccinations', url: `${BASE_URL}/vaccinations` },
  { name: 'Vaccination Summary', url: `${BASE_URL}/vaccinations/summary` },
  { name: 'Vaccination Coverage', url: `${BASE_URL}/vaccinations/coverage` },
  { name: 'Statistics Overview', url: `${BASE_URL}/statistics/overview` },
  { name: 'Statistics Trends', url: `${BASE_URL}/statistics/trends` },
  { name: 'Regional Statistics', url: `${BASE_URL}/statistics/regional` },
  { name: 'Testing Centers', url: `${BASE_URL}/testing/centers` },
  { name: 'Testing Summary', url: `${BASE_URL}/testing/summary` },
  { name: 'Regions', url: `${BASE_URL}/regions` },
  { name: 'Municipalities', url: `${BASE_URL}/regions/municipalities` }
];

const testAPI = async () => {
  console.log('🧪 Testing Kosovo COVID-19 API Endpoints...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await axios.get(endpoint.url, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: OK (${response.data?.data?.length || response.data?.total || 'N/A'} records)`);
        passedTests++;
      } else {
        console.log(`⚠️  ${endpoint.name}: Status ${response.status}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / testEndpoints.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All endpoints are working correctly!');
    console.log('📚 View API Documentation: http://localhost:3000/api-docs');
  } else {
    console.log('\n⚠️  Some endpoints need attention. Check the server logs for details.');
  }
};

// Run the test
testAPI().catch(console.error);

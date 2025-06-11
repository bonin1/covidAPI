const { executeQuery, testConnection } = require('../database');
const moment = require('moment');

const seedData = async () => {
  console.log('🌱 Starting data seeding process...');

  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Seed municipalities
    await seedMunicipalities();
    
    // Seed hospitals
    await seedHospitals();
    
    // Seed testing centers
    await seedTestingCenters();
    
    // Seed COVID cases data (last 90 days)
    await seedCovidCases();
    
    // Seed vaccination data
    await seedVaccinations();
    
    // Seed testing data
    await seedTestingData();
    
    // Seed age group data
    await seedAgeGroups();

    console.log('🎉 Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    process.exit(1);
  }
};

const seedMunicipalities = async () => {
  console.log('📍 Seeding municipalities...');
  
  const municipalities = [
    // Pristina Region
    [1, 'Pristina', 'PR-01', 230000, 572.00],
    [1, 'Podujeva', 'PR-02', 89000, 632.00],
    [1, 'Drenas', 'PR-03', 60000, 447.00],
    [1, 'Lipjan', 'PR-04', 58000, 422.00],
    [1, 'Fushe Kosova', 'PR-05', 35000, 74.00],
    [1, 'Gracanica', 'PR-06', 10000, 122.00],
    [1, 'Obiliق', 'PR-07', 21000, 105.00],
    
    // Mitrovica Region
    [2, 'South Mitrovica', 'MI-01', 72000, 262.00],
    [2, 'North Mitrovica', 'MI-02', 40000, 138.00],
    [2, 'Vushtrri', 'MI-03', 70000, 344.00],
    [2, 'Skenderaj', 'MI-04', 51000, 369.00],
    [2, 'Leposaviq', 'MI-05', 14000, 539.00],
    [2, 'Zubin Potok', 'MI-06', 6800, 335.00],
    [2, 'Zvecan', 'MI-07', 8500, 122.00],
    
    // Peja Region
    [3, 'Peja', 'PE-01', 96000, 602.00],
    [3, 'Istog', 'PE-02', 40000, 351.00],
    [3, 'Klina', 'PE-03', 39000, 307.00],
    [3, 'Decan', 'PE-04', 41000, 298.00],
    
    // Prizren Region
    [4, 'Prizren', 'PZ-01', 178000, 640.00],
    [4, 'Dragash', 'PZ-02', 34000, 434.00],
    [4, 'Suhareka', 'PZ-03', 60000, 361.00],
    [4, 'Rahovec', 'PZ-04', 57000, 290.00],
    [4, 'Malisheva', 'PZ-05', 55000, 317.00],
    
    // Ferizaj Region
    [5, 'Ferizaj', 'FE-01', 109000, 345.00],
    [5, 'Shtime', 'FE-02', 28000, 134.00],
    [5, 'Stimje', 'FE-03', 26000, 217.00],
    [5, 'Kacanik', 'FE-04', 35000, 220.00],
    [5, 'Hani i Elezit', 'FE-05', 10000, 84.00],
    
    // Gjilan Region
    [6, 'Gjilan', 'GJ-01', 91000, 513.00],
    [6, 'Vitia', 'GJ-02', 47000, 250.00],
    [6, 'Kamenica', 'GJ-03', 36000, 317.00],
    [6, 'Kllokot', 'GJ-04', 2500, 27.00],
    [6, 'Ranillug', 'GJ-05', 3600, 60.00],
    [6, 'Partes', 'GJ-06', 2000, 35.00],
    [6, 'Novo Brdo', 'GJ-07', 7000, 204.00],
    
    // Gjakova Region
    [7, 'Gjakova', 'GK-01', 95000, 586.00],
    [7, 'Rahovec', 'GK-02', 58000, 276.00],
    [7, 'Malisheva', 'GK-03', 55000, 317.00],
    [7, 'Junik', 'GK-04', 6500, 54.00]
  ];

  for (const municipality of municipalities) {
    await executeQuery(
      'INSERT IGNORE INTO municipalities (region_id, name, code, population, area_km2) VALUES (?, ?, ?, ?, ?)',
      municipality
    );
  }
  
  console.log(`✅ ${municipalities.length} municipalities seeded`);
};

const seedHospitals = async () => {
  console.log('🏥 Seeding hospitals...');
  
  const hospitals = [
    // Major hospitals
    ['University Clinical Center of Kosovo', 1, 1, 'Rr. Spitalit, Pristina', '+383 38 500 300', 'info@qkuk.org', 800, 120, 40, 30, true, 42.6629, 21.1655],
    ['Regional Hospital Mitrovica', 2, 9, 'Rr. Mbretit Petar, Mitrovica', '+383 28 423 100', 'hospital@mitrovica.org', 400, 60, 20, 15, true, 42.8914, 20.8664],
    ['Regional Hospital Peja', 3, 15, 'Rr. Adem Jashari, Peja', '+383 39 432 200', 'info@hospital-peja.org', 350, 50, 18, 12, true, 42.6589, 20.2886],
    ['Regional Hospital Prizren', 4, 19, 'Rr. Sami Frashëri, Prizren', '+383 29 243 400', 'contact@hospital-prizren.org', 450, 70, 25, 18, true, 42.2139, 20.7397],
    ['Regional Hospital Ferizaj', 5, 25, 'Rr. UCK, Ferizaj', '+383 290 321 100', 'info@hospital-ferizaj.org', 300, 45, 15, 10, true, 42.3700, 21.1483],
    ['Regional Hospital Gjilan', 6, 30, 'Rr. Ahmet Krasniqi, Gjilan', '+383 280 372 200', 'hospital@gjilan.org', 280, 40, 12, 8, true, 42.4611, 21.4694],
    ['Regional Hospital Gjakova', 7, 37, 'Rr. Ismail Qemali, Gjakova', '+383 390 323 300', 'info@hospital-gjakova.org', 320, 48, 16, 12, true, 42.3806, 20.4314],
    
    // Smaller hospitals and clinics
    ['Private Hospital Acibadem', 1, 1, 'Rr. Nëna Terezë, Pristina', '+383 38 200 300', 'info@acibadem-pristina.com', 150, 25, 8, 6, true, 42.6540, 21.1788],
    ['Clinic Denta', 1, 1, 'Rr. Bill Clinton, Pristina', '+383 38 248 484', 'info@denta.org', 80, 15, 5, 3, false, 42.6691, 21.1617],
    ['Health Center Podujeva', 1, 2, 'Rr. Adem Jashari, Podujeva', '+383 38 271 023', 'health@podujeva.org', 60, 10, 3, 2, false, 42.9106, 21.1939],
    ['Health Center Vushtrri', 2, 11, 'Rr. Skënderbeu, Vushtrri', '+383 28 372 156', 'contact@vushtrri-health.org', 70, 12, 4, 2, false, 42.8231, 20.9681],
    ['Health Center Istog', 3, 16, 'Rr. Bajram Curri, Istog', '+383 39 451 234', 'health@istog.org', 45, 8, 2, 1, false, 42.7831, 20.4889],
    ['Health Center Dragash', 4, 20, 'Rr. Nëna Terezë, Dragash', '+383 29 278 123', 'info@dragash-health.org', 40, 6, 2, 1, false, 42.0417, 20.6531],
    ['Health Center Shtime', 5, 26, 'Rr. Lidhja e Prizrenit, Shtime', '+383 290 360 234', 'health@shtime.org', 35, 5, 1, 1, false, 42.4306, 21.0414],
    ['Health Center Vitia', 6, 31, 'Rr. Fehmi Agani, Vitia', '+383 280 380 345', 'contact@vitia-health.org', 50, 8, 3, 2, false, 42.3206, 21.3581]
  ];

  for (const hospital of hospitals) {
    await executeQuery(
      'INSERT IGNORE INTO hospitals (name, region_id, municipality_id, address, phone, email, total_beds, covid_beds, icu_beds, ventilators, is_covid_hospital, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      hospital
    );
  }
  
  console.log(`✅ ${hospitals.length} hospitals seeded`);
};

const seedTestingCenters = async () => {
  console.log('🧪 Seeding testing centers...');
  
  const testingCenters = [
    ['National Institute of Public Health - Pristina', 1, 1, 'Rr. Mother Teresa, Pristina', '+383 38 664 477', 'niph@rks-gov.net', 'PCR, Antigen, Antibody', '08:00-16:00', true, 42.6691, 21.1617],
    ['University Clinical Center Lab', 1, 1, 'Rr. Spitalit, Pristina', '+383 38 500 300', 'lab@qkuk.org', 'PCR, Antigen', '24/7', true, 42.6629, 21.1655],
    ['Testing Center Mitrovica', 2, 9, 'Rr. Mbretit Petar, Mitrovica', '+383 28 423 150', 'testing@mitrovica.org', 'PCR, Antigen', '08:00-18:00', true, 42.8914, 20.8664],
    ['Regional Testing Center Peja', 3, 15, 'Rr. Adem Jashari, Peja', '+383 39 432 250', 'testing@peja.org', 'PCR, Antigen', '08:00-16:00', true, 42.6589, 20.2886],
    ['Prizren Testing Facility', 4, 19, 'Rr. Sami Frashëri, Prizren', '+383 29 243 450', 'testing@prizren.org', 'PCR, Antigen', '08:00-18:00', true, 42.2139, 20.7397],
    ['Ferizaj Health Testing', 5, 25, 'Rr. UCK, Ferizaj', '+383 290 321 150', 'testing@ferizaj.org', 'PCR, Antigen', '08:00-16:00', true, 42.3700, 21.1483],
    ['Gjilan Testing Center', 6, 30, 'Rr. Ahmet Krasniqi, Gjilan', '+383 280 372 250', 'testing@gjilan.org', 'PCR, Antigen', '08:00-16:00', true, 42.4611, 21.4694],
    ['Gjakova Regional Testing', 7, 37, 'Rr. Ismail Qemali, Gjakova', '+383 390 323 350', 'testing@gjakova.org', 'PCR, Antigen', '08:00-16:00', true, 42.3806, 20.4314],
    ['Private Lab Eurolabs', 1, 1, 'Rr. Bill Clinton, Pristina', '+383 38 249 500', 'info@eurolabs.net', 'PCR, Antigen, Antibody', '07:00-19:00', true, 42.6691, 21.1617],
    ['Synlab Kosovo', 1, 1, 'Rr. Nëna Terezë, Pristina', '+383 38 200 400', 'kosovo@synlab.com', 'PCR, Antigen', '08:00-17:00', true, 42.6540, 21.1788]
  ];

  for (const center of testingCenters) {
    await executeQuery(
      'INSERT IGNORE INTO testing_centers (name, region_id, municipality_id, address, phone, email, test_types, operating_hours, is_active, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      center
    );
  }
  
  console.log(`✅ ${testingCenters.length} testing centers seeded`);
};

const seedCovidCases = async () => {
  console.log('📊 Seeding COVID cases data...');
  
  const startDate = moment().subtract(90, 'days');
  const endDate = moment();
  
  // Get regions
  const regionsResult = await executeQuery('SELECT id FROM regions');
  const regions = regionsResult.data;
  
  let totalRecords = 0;
  
  for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'day')) {
    const currentDate = date.format('YYYY-MM-DD');
    
    for (const region of regions) {
      // Generate realistic COVID data with trends
      const daysSinceStart = date.diff(startDate, 'days');
      const trend = Math.sin(daysSinceStart * 0.1) * 0.5 + 0.5; // Wave pattern
      
      const baseCases = Math.floor(Math.random() * 50 + 10);
      const newCases = Math.floor(baseCases * trend * (0.5 + Math.random() * 0.5));
      const totalCases = Math.floor(newCases * (daysSinceStart + 10) * (0.8 + Math.random() * 0.4));
      
      const deaths = Math.floor(totalCases * 0.015 * (0.5 + Math.random() * 0.5));
      const newDeaths = Math.floor(deaths * 0.1 * Math.random());
      
      const recovered = Math.floor(totalCases * 0.92 * (0.8 + Math.random() * 0.2));
      const newRecovered = Math.floor(recovered * 0.05 * (0.5 + Math.random() * 0.5));
      
      const activeCases = Math.max(0, totalCases - deaths - recovered);
      const hospitalized = Math.floor(activeCases * 0.15 * (0.5 + Math.random() * 0.5));
      const icuPatients = Math.floor(hospitalized * 0.2 * (0.5 + Math.random() * 0.5));
      const ventilatorPatients = Math.floor(icuPatients * 0.6 * (0.5 + Math.random() * 0.5));

      await executeQuery(`
        INSERT IGNORE INTO covid_cases 
        (date, region_id, total_cases, new_cases, active_cases, deaths, new_deaths, 
         recovered, new_recovered, hospitalized, icu_patients, ventilator_patients)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [currentDate, region.id, totalCases, newCases, activeCases, deaths, newDeaths, 
          recovered, newRecovered, hospitalized, icuPatients, ventilatorPatients]);
      
      totalRecords++;
    }
  }
  
  console.log(`✅ ${totalRecords} COVID case records seeded`);
};

const seedVaccinations = async () => {
  console.log('💉 Seeding vaccination data...');
  
  const startDate = moment().subtract(60, 'days');
  const endDate = moment();
  
  const regionsResult = await executeQuery('SELECT id FROM regions');
  const regions = regionsResult.data;
  
  const vaccineTypes = ['Pfizer-BioNTech', 'AstraZeneca', 'Johnson & Johnson', 'Moderna'];
  
  let totalRecords = 0;
  
  for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'day')) {
    const currentDate = date.format('YYYY-MM-DD');
    
    for (const region of regions) {
      for (const vaccineType of vaccineTypes) {
        const firstDose = Math.floor(Math.random() * 200 + 50);
        const secondDose = Math.floor(Math.random() * 150 + 30);
        const boosterDose = Math.floor(Math.random() * 100 + 20);
        const totalDoses = firstDose + secondDose + boosterDose;
        
        // Cumulative people vaccinated (simplified)
        const peopleVaccinated = Math.floor(firstDose * 1.2);
        const peopleFullyVaccinated = Math.floor(secondDose * 1.1);

        await executeQuery(`
          INSERT IGNORE INTO vaccinations 
          (date, region_id, vaccine_type, first_dose, second_dose, booster_dose, 
           total_doses, people_vaccinated, people_fully_vaccinated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [currentDate, region.id, vaccineType, firstDose, secondDose, boosterDose,
            totalDoses, peopleVaccinated, peopleFullyVaccinated]);
        
        totalRecords++;
      }
    }
  }
  
  console.log(`✅ ${totalRecords} vaccination records seeded`);
};

const seedTestingData = async () => {
  console.log('🔬 Seeding testing data...');
  
  const startDate = moment().subtract(45, 'days');
  const endDate = moment();
  
  const centersResult = await executeQuery('SELECT id, region_id FROM testing_centers');
  const centers = centersResult.data;
  
  let totalRecords = 0;
  
  for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'day')) {
    const currentDate = date.format('YYYY-MM-DD');
    
    for (const center of centers) {
      const pcrTests = Math.floor(Math.random() * 150 + 50);
      const antigenTests = Math.floor(Math.random() * 200 + 100);
      const totalTests = pcrTests + antigenTests;
      
      const positiveTests = Math.floor(totalTests * (0.05 + Math.random() * 0.15));
      const negativeTests = totalTests - positiveTests;
      const pendingTests = Math.floor(Math.random() * 10);
      
      const positivityRate = totalTests > 0 ? (positiveTests / totalTests) * 100 : 0;

      await executeQuery(`
        INSERT IGNORE INTO testing_data 
        (date, region_id, testing_center_id, total_tests, pcr_tests, antigen_tests,
         positive_tests, negative_tests, pending_tests, positivity_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [currentDate, center.region_id, center.id, totalTests, pcrTests, antigenTests,
          positiveTests, negativeTests, pendingTests, positivityRate]);
      
      totalRecords++;
    }
  }
  
  console.log(`✅ ${totalRecords} testing records seeded`);
};

const seedAgeGroups = async () => {
  console.log('👥 Seeding age group data...');
  
  const startDate = moment().subtract(30, 'days');
  const endDate = moment();
  
  const regionsResult = await executeQuery('SELECT id FROM regions');
  const regions = regionsResult.data;
  
  const ageGroups = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  
  let totalRecords = 0;
  
  for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'day')) {
    const currentDate = date.format('YYYY-MM-DD');
    
    for (const region of regions) {
      for (const ageGroup of ageGroups) {
        // Different age groups have different risk profiles
        let multiplier = 1;
        if (['60-69', '70-79', '80+'].includes(ageGroup)) {
          multiplier = 2; // Higher cases and deaths for older groups
        } else if (['20-29', '30-39'].includes(ageGroup)) {
          multiplier = 1.5; // Higher cases for active age groups
        }
        
        const cases = Math.floor((Math.random() * 20 + 5) * multiplier);
        const deaths = ageGroup === '80+' ? Math.floor(cases * 0.1) : 
                     ['70-79', '60-69'].includes(ageGroup) ? Math.floor(cases * 0.05) : 
                     Math.floor(cases * 0.01);
        const vaccinated = Math.floor(cases * 2 * (0.8 + Math.random() * 0.4));

        await executeQuery(`
          INSERT IGNORE INTO age_groups 
          (date, region_id, age_group, cases, deaths, vaccinated)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [currentDate, region.id, ageGroup, cases, deaths, vaccinated]);
        
        totalRecords++;
      }
    }
  }
  
  console.log(`✅ ${totalRecords} age group records seeded`);
};

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

module.exports = {
  seedData,
  seedMunicipalities,
  seedHospitals,
  seedTestingCenters,
  seedCovidCases,
  seedVaccinations,
  seedTestingData,
  seedAgeGroups
};

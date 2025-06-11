const { executeQuery, testConnection } = require('../database');

const createTables = async () => {
  console.log('🗄️  Creating database tables...');

  const tables = [
    // Regions table
    `CREATE TABLE IF NOT EXISTS regions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(10) NOT NULL UNIQUE,
      population INT DEFAULT 0,
      area_km2 DECIMAL(10,2) DEFAULT 0,
      capital VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Municipalities table
    `CREATE TABLE IF NOT EXISTS municipalities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      region_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(10) NOT NULL UNIQUE,
      population INT DEFAULT 0,
      area_km2 DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // COVID cases table
    `CREATE TABLE IF NOT EXISTS covid_cases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      region_id INT,
      municipality_id INT,
      total_cases INT DEFAULT 0,
      new_cases INT DEFAULT 0,
      active_cases INT DEFAULT 0,
      deaths INT DEFAULT 0,
      new_deaths INT DEFAULT 0,
      recovered INT DEFAULT 0,
      new_recovered INT DEFAULT 0,
      hospitalized INT DEFAULT 0,
      icu_patients INT DEFAULT 0,
      ventilator_patients INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL,
      UNIQUE KEY unique_daily_region (date, region_id),
      INDEX idx_date (date),
      INDEX idx_region_date (region_id, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Hospitals table
    `CREATE TABLE IF NOT EXISTS hospitals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      region_id INT,
      municipality_id INT,
      address TEXT,
      phone VARCHAR(20),
      email VARCHAR(100),
      total_beds INT DEFAULT 0,
      covid_beds INT DEFAULT 0,
      icu_beds INT DEFAULT 0,
      ventilators INT DEFAULT 0,
      occupied_beds INT DEFAULT 0,
      occupied_covid_beds INT DEFAULT 0,
      occupied_icu_beds INT DEFAULT 0,
      occupied_ventilators INT DEFAULT 0,
      is_covid_hospital BOOLEAN DEFAULT FALSE,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Vaccinations table
    `CREATE TABLE IF NOT EXISTS vaccinations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      region_id INT,
      municipality_id INT,
      vaccine_type VARCHAR(50),
      first_dose INT DEFAULT 0,
      second_dose INT DEFAULT 0,
      booster_dose INT DEFAULT 0,
      total_doses INT DEFAULT 0,
      people_vaccinated INT DEFAULT 0,
      people_fully_vaccinated INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL,
      INDEX idx_date (date),
      INDEX idx_region_date (region_id, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Testing centers table
    `CREATE TABLE IF NOT EXISTS testing_centers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      region_id INT,
      municipality_id INT,
      address TEXT,
      phone VARCHAR(20),
      email VARCHAR(100),
      test_types TEXT,
      operating_hours VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Testing data table
    `CREATE TABLE IF NOT EXISTS testing_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      region_id INT,
      municipality_id INT,
      testing_center_id INT,
      total_tests INT DEFAULT 0,
      pcr_tests INT DEFAULT 0,
      antigen_tests INT DEFAULT 0,
      positive_tests INT DEFAULT 0,
      negative_tests INT DEFAULT 0,
      pending_tests INT DEFAULT 0,
      positivity_rate DECIMAL(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL,
      FOREIGN KEY (testing_center_id) REFERENCES testing_centers(id) ON DELETE SET NULL,
      INDEX idx_date (date),
      INDEX idx_region_date (region_id, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Age groups table
    `CREATE TABLE IF NOT EXISTS age_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      region_id INT,
      age_group VARCHAR(20) NOT NULL,
      cases INT DEFAULT 0,
      deaths INT DEFAULT 0,
      vaccinated INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
      INDEX idx_date (date),
      INDEX idx_age_group (age_group)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Data sources table for tracking automation
    `CREATE TABLE IF NOT EXISTS data_sources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      source_name VARCHAR(100) NOT NULL UNIQUE,
      source_url TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      update_frequency VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE,
      error_count INT DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ];

  try {
    for (const table of tables) {
      const result = await executeQuery(table);
      if (!result.success) {
        throw new Error(`Failed to create table: ${result.error}`);
      }
    }
    console.log('✅ All tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const insertInitialData = async () => {
  console.log('📊 Inserting initial data...');

  try {
    // Insert Kosovo regions
    const regions = [
      ['Pristina', 'PR', 477312, 2470.00, 'Pristina'],
      ['Mitrovica', 'MI', 197647, 2077.00, 'Mitrovica'],
      ['Peja', 'PE', 179136, 1365.00, 'Peja'],
      ['Prizren', 'PZ', 331670, 1397.00, 'Prizren'],
      ['Ferizaj', 'FE', 185506, 1030.00, 'Ferizaj'],
      ['Gjilan', 'GJ', 194190, 1212.00, 'Gjilan'],
      ['Gjakova', 'GK', 194672, 1129.00, 'Gjakova']
    ];

    for (const region of regions) {
      await executeQuery(
        'INSERT IGNORE INTO regions (name, code, population, area_km2, capital) VALUES (?, ?, ?, ?, ?)',
        region
      );
    }

    // Insert data sources
    const dataSources = [
      ['WHO Global Data', 'https://covid19.who.int/WHO-COVID-19-global-data.csv', 'daily', true],
      ['Disease.sh API', 'https://disease.sh/v3/covid-19/countries/kosovo', 'hourly', true],
      ['Kosovo Ministry of Health', 'https://msh.rks-gov.net/', 'daily', true]
    ];

    for (const source of dataSources) {
      await executeQuery(
        'INSERT IGNORE INTO data_sources (source_name, source_url, update_frequency, is_active) VALUES (?, ?, ?, ?)',
        source
      );
    }

    console.log('✅ Initial data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting initial data:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing Kosovo COVID-19 Database...');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Create tables
    await createTables();
    
    // Insert initial data
    await insertInitialData();
    
    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  createTables,
  insertInitialData,
  initializeDatabase
};

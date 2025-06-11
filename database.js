const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kosovo_covid_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return { success: true, data: results };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    const queries = [
      'SELECT COUNT(*) as total_cases FROM covid_cases',
      'SELECT COUNT(*) as total_deaths FROM covid_cases WHERE deaths > 0',
      'SELECT COUNT(*) as total_recovered FROM covid_cases WHERE recovered > 0',
      'SELECT COUNT(*) as total_vaccinations FROM vaccinations',
      'SELECT COUNT(*) as total_hospitals FROM hospitals',
      'SELECT COUNT(*) as total_regions FROM regions'
    ];

    const results = {};
    for (const query of queries) {
      const result = await executeQuery(query);
      if (result.success) {
        const key = Object.keys(result.data[0])[0];
        results[key] = result.data[0][key];
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery,
  getDatabaseStats
};
const mysql = require('mysql2/promise');
require('dotenv').config();

const createDatabase = async () => {
  console.log('🗄️  Creating Kosovo COVID-19 database...');
  
  try {
    // Connect without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'kosovo_covid_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`✅ Database '${dbName}' created successfully`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    return false;
  }
};

// Run if called directly
if (require.main === module) {
  createDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { createDatabase };

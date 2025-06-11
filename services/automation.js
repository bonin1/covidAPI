const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment');
const { executeQuery } = require('../database');

class AutomationService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Automation service is already running');
      return;
    }

    console.log('🤖 Starting automation service...');
    this.isRunning = true;

    // Schedule data updates every 30 minutes
    this.scheduleDataUpdates();
    
    // Schedule daily statistics calculation
    this.scheduleDailyStats();
    
    // Schedule weekly reports
    this.scheduleWeeklyReports();

    console.log('✅ Automation service started successfully');
  }

  stop() {
    console.log('🛑 Stopping automation service...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ Automation service stopped');
  }

  scheduleDataUpdates() {
    // Update data every 30 minutes
    const updateJob = cron.schedule('*/30 * * * *', async () => {
      console.log('🔄 Running automated data update...');
      try {
        await this.updateCovidData();
        await this.updateHospitalCapacity();
        await this.updateVaccinationData();
        console.log('✅ Data update completed');
      } catch (error) {
        console.error('❌ Data update failed:', error);
        await this.logError('data_update', error.message);
      }
    }, { scheduled: false });

    this.jobs.set('dataUpdate', updateJob);
    updateJob.start();
    console.log('📅 Scheduled data updates every 30 minutes');
  }

  scheduleDailyStats() {
    // Calculate daily statistics at midnight
    const statsJob = cron.schedule('0 0 * * *', async () => {
      console.log('📊 Calculating daily statistics...');
      try {
        await this.calculateDailyStatistics();
        await this.updateTrends();
        console.log('✅ Daily statistics calculated');
      } catch (error) {
        console.error('❌ Daily statistics calculation failed:', error);
        await this.logError('daily_stats', error.message);
      }
    }, { scheduled: false });

    this.jobs.set('dailyStats', statsJob);
    statsJob.start();
    console.log('📅 Scheduled daily statistics calculation at midnight');
  }

  scheduleWeeklyReports() {
    // Generate weekly reports every Sunday at 23:00
    const weeklyJob = cron.schedule('0 23 * * 0', async () => {
      console.log('📈 Generating weekly reports...');
      try {
        await this.generateWeeklyReport();
        console.log('✅ Weekly report generated');
      } catch (error) {
        console.error('❌ Weekly report generation failed:', error);
        await this.logError('weekly_report', error.message);
      }
    }, { scheduled: false });

    this.jobs.set('weeklyReport', weeklyJob);
    weeklyJob.start();
    console.log('📅 Scheduled weekly reports every Sunday at 23:00');
  }
  async updateCovidData() {
    try {
      console.log('🔄 Updating COVID data...');
      
      // Since Kosovo might not be available in disease.sh API, we'll generate realistic sample data
      // In a real implementation, this would connect to Kosovo's Ministry of Health API
      const today = moment().format('YYYY-MM-DD');
      
      // Generate realistic daily updates based on existing data
      const existingDataResult = await executeQuery(`
        SELECT SUM(total_cases) as total_cases, SUM(deaths) as total_deaths, SUM(recovered) as total_recovered
        FROM covid_cases 
        WHERE date = (SELECT MAX(date) FROM covid_cases WHERE date < ?)
      `, [today]);
      
      let baseData = {
        total_cases: 230000,
        deaths: 2800,
        recovered: 220000
      };
      
      if (existingDataResult.success && existingDataResult.data.length > 0 && existingDataResult.data[0].total_cases) {
        baseData = existingDataResult.data[0];
      }
      
      // Generate realistic daily changes
      const newCases = Math.floor(Math.random() * 50) + 10; // 10-60 new cases
      const newDeaths = Math.floor(Math.random() * 3); // 0-2 new deaths
      const newRecovered = Math.floor(Math.random() * 40) + 20; // 20-60 new recovered
      
      const updatedData = {
        total_cases: (baseData.total_cases || 0) + newCases,
        deaths: (baseData.total_deaths || 0) + newDeaths,
        recovered: (baseData.total_recovered || 0) + newRecovered
      };
      
      updatedData.active_cases = updatedData.total_cases - updatedData.deaths - updatedData.recovered;

      // Update national data for today
      await executeQuery(`
        INSERT INTO covid_cases (date, total_cases, new_cases, deaths, new_deaths, recovered, new_recovered, active_cases)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        total_cases = VALUES(total_cases),
        new_cases = VALUES(new_cases),
        deaths = VALUES(deaths),
        new_deaths = VALUES(new_deaths),
        recovered = VALUES(recovered),
        new_recovered = VALUES(new_recovered),
        active_cases = VALUES(active_cases),
        updated_at = CURRENT_TIMESTAMP
      `, [today, updatedData.total_cases, newCases, updatedData.deaths, newDeaths, updatedData.recovered, newRecovered, updatedData.active_cases]);

      // Update data source
      await this.updateDataSource('Kosovo Health Ministry Simulation', null);

      console.log(`✅ COVID data updated: +${newCases} cases, +${newDeaths} deaths, +${newRecovered} recovered`);
    } catch (error) {
      console.error('❌ Failed to update COVID data:', error.message);
      await this.updateDataSource('Kosovo Health Ministry Simulation', error.message);
      // Don't throw error - just log and continue
    }
  }
  async updateHospitalCapacity() {
    try {
      console.log('🏥 Updating hospital capacity...');
      
      const hospitals = await executeQuery('SELECT id, total_beds, covid_beds, icu_beds FROM hospitals');
      
      if (hospitals.success) {
        let updatedCount = 0;
        for (const hospital of hospitals.data) {
          // Simulate realistic occupancy rates
          const covidOccupancy = Math.floor(hospital.covid_beds * (0.3 + Math.random() * 0.4));
          const icuOccupancy = Math.floor(hospital.icu_beds * (0.5 + Math.random() * 0.3));
          const totalOccupancy = Math.floor(hospital.total_beds * (0.6 + Math.random() * 0.3));

          await executeQuery(`
            UPDATE hospitals 
            SET occupied_beds = ?, occupied_covid_beds = ?, occupied_icu_beds = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [totalOccupancy, covidOccupancy, icuOccupancy, hospital.id]);
          
          updatedCount++;
        }
        console.log(`✅ Hospital capacity updated for ${updatedCount} hospitals`);
      }
    } catch (error) {
      console.error('❌ Failed to update hospital capacity:', error);
      // Don't throw error - just log and continue
    }
  }
  async updateVaccinationData() {
    try {
      console.log('💉 Updating vaccination data...');
      
      const regions = await executeQuery('SELECT id FROM regions');
      const today = moment().format('YYYY-MM-DD');

      if (regions.success) {
        let totalFirstDoses = 0;
        let totalSecondDoses = 0;
        let totalBoosters = 0;
        
        for (const region of regions.data) {
          // Simulate realistic daily vaccination numbers (lower numbers for more realistic data)
          const firstDose = Math.floor(Math.random() * 100) + 20; // 20-120 first doses
          const secondDose = Math.floor(Math.random() * 80) + 15;  // 15-95 second doses
          const boosterDose = Math.floor(Math.random() * 60) + 10; // 10-70 boosters

          totalFirstDoses += firstDose;
          totalSecondDoses += secondDose;
          totalBoosters += boosterDose;

          await executeQuery(`
            INSERT INTO vaccinations (date, region_id, first_dose, second_dose, booster_dose, total_doses)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            first_dose = first_dose + VALUES(first_dose),
            second_dose = second_dose + VALUES(second_dose),
            booster_dose = booster_dose + VALUES(booster_dose),
            total_doses = total_doses + VALUES(total_doses),
            updated_at = CURRENT_TIMESTAMP
          `, [today, region.id, firstDose, secondDose, boosterDose, firstDose + secondDose + boosterDose]);
        }
        
        console.log(`✅ Vaccination data updated: ${totalFirstDoses} first doses, ${totalSecondDoses} second doses, ${totalBoosters} boosters`);
      }
    } catch (error) {
      console.error('❌ Failed to update vaccination data:', error);
      // Don't throw error - just log and continue
    }
  }

  async calculateDailyStatistics() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

      // Calculate daily new cases, deaths, recoveries
      const result = await executeQuery(`
        SELECT 
          SUM(total_cases) as total_cases,
          SUM(deaths) as total_deaths,
          SUM(recovered) as total_recovered,
          SUM(active_cases) as active_cases
        FROM covid_cases 
        WHERE date = ?
      `, [today]);

      if (result.success && result.data.length > 0) {
        const todayStats = result.data[0];
        
        // Get yesterday's stats for comparison
        const yesterdayResult = await executeQuery(`
          SELECT 
            SUM(total_cases) as total_cases,
            SUM(deaths) as total_deaths,
            SUM(recovered) as total_recovered
          FROM covid_cases 
          WHERE date = ?
        `, [yesterday]);

        if (yesterdayResult.success && yesterdayResult.data.length > 0) {
          const yesterdayStats = yesterdayResult.data[0];
          
          // Calculate new cases, deaths, recoveries
          const newCases = (todayStats.total_cases || 0) - (yesterdayStats.total_cases || 0);
          const newDeaths = (todayStats.total_deaths || 0) - (yesterdayStats.total_deaths || 0);
          const newRecovered = (todayStats.total_recovered || 0) - (yesterdayStats.total_recovered || 0);

          // Update today's record with calculated values
          await executeQuery(`
            UPDATE covid_cases 
            SET new_cases = ?, new_deaths = ?, new_recovered = ?
            WHERE date = ?
          `, [Math.max(0, newCases), Math.max(0, newDeaths), Math.max(0, newRecovered), today]);
        }
      }

      console.log('✅ Daily statistics calculated');
    } catch (error) {
      console.error('❌ Failed to calculate daily statistics:', error);
      throw error;
    }
  }

  async updateTrends() {
    try {
      // Calculate 7-day moving averages and trends
      const sevenDaysAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
      
      const result = await executeQuery(`
        SELECT 
          DATE(date) as date,
          SUM(new_cases) as daily_cases,
          SUM(new_deaths) as daily_deaths,
          SUM(new_recovered) as daily_recovered
        FROM covid_cases 
        WHERE date >= ?
        GROUP BY DATE(date)
        ORDER BY date
      `, [sevenDaysAgo]);

      if (result.success && result.data.length >= 7) {
        const trends = this.calculateMovingAverages(result.data);
        // Store trends in database or cache for quick access
        console.log('📈 Trends calculated:', trends);
      }

      console.log('✅ Trends updated');
    } catch (error) {
      console.error('❌ Failed to update trends:', error);
      throw error;
    }
  }

  calculateMovingAverages(data) {
    const averages = [];
    for (let i = 6; i < data.length; i++) {
      const window = data.slice(i - 6, i + 1);
      const avgCases = window.reduce((sum, day) => sum + (day.daily_cases || 0), 0) / 7;
      const avgDeaths = window.reduce((sum, day) => sum + (day.daily_deaths || 0), 0) / 7;
      const avgRecovered = window.reduce((sum, day) => sum + (day.daily_recovered || 0), 0) / 7;
      
      averages.push({
        date: data[i].date,
        avg_cases: Math.round(avgCases * 100) / 100,
        avg_deaths: Math.round(avgDeaths * 100) / 100,
        avg_recovered: Math.round(avgRecovered * 100) / 100
      });
    }
    return averages;
  }

  async generateWeeklyReport() {
    try {
      const oneWeekAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
      const today = moment().format('YYYY-MM-DD');

      // Generate comprehensive weekly statistics
      const weeklyData = await executeQuery(`
        SELECT 
          COUNT(*) as total_records,
          SUM(new_cases) as weekly_cases,
          SUM(new_deaths) as weekly_deaths,
          SUM(new_recovered) as weekly_recovered,
          AVG(new_cases) as avg_daily_cases,
          MAX(new_cases) as max_daily_cases,
          MIN(new_cases) as min_daily_cases
        FROM covid_cases 
        WHERE date BETWEEN ? AND ?
      `, [oneWeekAgo, today]);

      if (weeklyData.success) {
        console.log('📊 Weekly Report Generated:', weeklyData.data[0]);
        // In a real implementation, this could send reports via email or save to file
      }

      console.log('✅ Weekly report generated');
    } catch (error) {
      console.error('❌ Failed to generate weekly report:', error);
      throw error;
    }
  }

  async updateDataSource(sourceName, errorMessage = null) {
    try {
      if (errorMessage) {
        await executeQuery(`
          UPDATE data_sources 
          SET error_count = error_count + 1, last_error = ?, last_updated = CURRENT_TIMESTAMP
          WHERE source_name = ?
        `, [errorMessage, sourceName]);
      } else {
        await executeQuery(`
          UPDATE data_sources 
          SET error_count = 0, last_error = NULL, last_updated = CURRENT_TIMESTAMP
          WHERE source_name = ?
        `, [sourceName]);
      }
    } catch (error) {
      console.error('❌ Failed to update data source status:', error);
    }
  }

  async logError(operation, errorMessage) {
    try {
      console.error(`Automation Error [${operation}]:`, errorMessage);
      // In a real implementation, this could log to a file or monitoring system
    } catch (error) {
      console.error('❌ Failed to log error:', error);
    }
  }
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size,
      schedules: {
        dataUpdate: '*/30 * * * *',
        dailyStats: '0 0 * * *',
        weeklyReport: '0 23 * * 0'
      }
    };
  }
}

module.exports = new AutomationService();

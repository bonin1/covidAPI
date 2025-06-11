const express = require('express');
const { executeQuery, getDatabaseStats, testConnection } = require('../database');
const automationService = require('../services/automation');
const router = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Get API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                     automation:
 *                       type: object
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const dbHealthy = await testConnection();
    const dbStats = await getDatabaseStats();
    
    // Check automation service status
    const automationStatus = automationService.getStatus();
    
    // Calculate system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const healthCheck = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      response_time_ms: Date.now() - startTime,
      services: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          connected: dbHealthy,
          stats: dbStats.success ? dbStats.data : null
        },
        automation: {
          status: automationStatus.isRunning ? 'healthy' : 'stopped',
          running: automationStatus.isRunning,
          active_jobs: automationStatus.activeJobs,
          next_executions: automationStatus.nextExecutions
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
          heap_used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heap_total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      }
    };

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/health/database:
 *   get:
 *     summary: Get detailed database health information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database health information
 */
router.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        connected: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }

    // Get database statistics
    const stats = await getDatabaseStats();
    
    // Get table information
    const tablesQuery = `
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count,
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY size_mb DESC
    `;
    
    const tablesResult = await executeQuery(tablesQuery);
    
    // Check for recent data updates
    const recentDataQuery = `
      SELECT 
        'covid_cases' as table_name,
        MAX(updated_at) as last_update
      FROM covid_cases
      UNION ALL
      SELECT 
        'vaccinations' as table_name,
        MAX(updated_at) as last_update
      FROM vaccinations
      UNION ALL
      SELECT 
        'hospitals' as table_name,
        MAX(updated_at) as last_update
      FROM hospitals
    `;
    
    const recentDataResult = await executeQuery(recentDataQuery);
    
    const dbHealth = {
      status: 'healthy',
      connected: true,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      statistics: stats.success ? stats.data : null,
      tables: tablesResult.success ? tablesResult.data : [],
      recent_updates: recentDataResult.success ? recentDataResult.data : [],
      version: await getDatabaseVersion()
    };

    res.json(dbHealth);
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      connected: false,
      error: 'Database health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/v1/health/automation:
 *   get:
 *     summary: Get automation service health information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Automation service health information
 */
router.get('/automation', async (req, res) => {
  try {
    const status = automationService.getStatus();
    
    // Get data sources status
    const dataSourcesQuery = `
      SELECT 
        source_name,
        source_url,
        last_updated,
        update_frequency,
        is_active,
        error_count,
        last_error,
        TIMESTAMPDIFF(MINUTE, last_updated, NOW()) as minutes_since_update
      FROM data_sources
      ORDER BY last_updated DESC
    `;
    
    const dataSourcesResult = await executeQuery(dataSourcesQuery);
    
    const automationHealth = {
      status: status.isRunning ? 'healthy' : 'stopped',
      running: status.isRunning,
      active_jobs: status.activeJobs,
      next_executions: status.nextExecutions,
      data_sources: dataSourcesResult.success ? dataSourcesResult.data : [],
      auto_updates_enabled: process.env.ENABLE_AUTO_UPDATES === 'true',
      timestamp: new Date().toISOString()
    };

    const statusCode = status.isRunning ? 200 : 503;
    res.status(statusCode).json(automationHealth);
  } catch (error) {
    console.error('Automation health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      running: false,
      error: 'Automation health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/v1/health/metrics:
 *   get:
 *     summary: Get detailed system metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get API usage statistics (if you have logging/monitoring)
    const metricsQuery = `
      SELECT 
        COUNT(*) as total_api_calls,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM covid_cases
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    const metricsResult = await executeQuery(metricsQuery);
    
    const metrics = {
      system: {
        uptime_seconds: Math.floor(process.uptime()),
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      },
      memory: {
        rss_bytes: memoryUsage.rss,
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        heap_used_bytes: memoryUsage.heapUsed,
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_bytes: memoryUsage.heapTotal,
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external_bytes: memoryUsage.external,
        external_mb: Math.round(memoryUsage.external / 1024 / 1024),
        array_buffers_bytes: memoryUsage.arrayBuffers,
        array_buffers_mb: Math.round(memoryUsage.arrayBuffers / 1024 / 1024)
      },
      cpu: {
        user_microseconds: cpuUsage.user,
        system_microseconds: cpuUsage.system,
        user_seconds: Math.round(cpuUsage.user / 1000000 * 100) / 100,
        system_seconds: Math.round(cpuUsage.system / 1000000 * 100) / 100
      },
      api: {
        data_points: metricsResult.success ? metricsResult.data[0] : null,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        rate_limit_enabled: true,
        rate_limit_window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        rate_limit_max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/v1/health/data-freshness:
 *   get:
 *     summary: Check data freshness across all tables
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Data freshness information
 */
router.get('/data-freshness', async (req, res) => {
  try {
    const freshnessChecks = [
      {
        name: 'COVID Cases',
        query: 'SELECT MAX(date) as latest_date, MAX(updated_at) as last_updated, COUNT(*) as total_records FROM covid_cases',
        table: 'covid_cases'
      },
      {
        name: 'Vaccinations',
        query: 'SELECT MAX(date) as latest_date, MAX(updated_at) as last_updated, COUNT(*) as total_records FROM vaccinations',
        table: 'vaccinations'
      },
      {
        name: 'Hospital Data',
        query: 'SELECT MAX(updated_at) as last_updated, COUNT(*) as total_records FROM hospitals',
        table: 'hospitals'
      },
      {
        name: 'Testing Data',
        query: 'SELECT MAX(date) as latest_date, MAX(updated_at) as last_updated, COUNT(*) as total_records FROM testing_data',
        table: 'testing_data'
      }
    ];

    const results = [];
    for (const check of freshnessChecks) {
      const result = await executeQuery(check.query);
      if (result.success && result.data.length > 0) {
        const data = result.data[0];
        const hoursOld = data.last_updated ? 
          Math.floor((new Date() - new Date(data.last_updated)) / (1000 * 60 * 60)) : null;
        
        results.push({
          name: check.name,
          table: check.table,
          latest_date: data.latest_date,
          last_updated: data.last_updated,
          hours_since_update: hoursOld,
          total_records: data.total_records,
          status: hoursOld === null ? 'no_data' : 
                 hoursOld < 24 ? 'fresh' : 
                 hoursOld < 72 ? 'stale' : 'very_stale'
        });
      }
    }

    // Overall freshness status
    const overallStatus = results.every(r => r.status === 'fresh') ? 'fresh' :
                         results.some(r => r.status === 'very_stale') ? 'very_stale' : 'stale';

    res.json({
      success: true,
      overall_status: overallStatus,
      data: results,
      timestamp: new Date().toISOString(),
      legend: {
        fresh: 'Updated within 24 hours',
        stale: 'Updated within 72 hours',
        very_stale: 'Not updated in over 72 hours',
        no_data: 'No update timestamp available'
      }
    });
  } catch (error) {
    console.error('Data freshness check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check data freshness',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to get database version
const getDatabaseVersion = async () => {
  try {
    const result = await executeQuery('SELECT VERSION() as version');
    return result.success ? result.data[0].version : 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
};

module.exports = router;

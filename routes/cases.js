const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { executeQuery } = require('../database');
const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     CovidCase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         date:
 *           type: string
 *           format: date
 *         region_id:
 *           type: integer
 *         municipality_id:
 *           type: integer
 *         total_cases:
 *           type: integer
 *         new_cases:
 *           type: integer
 *         active_cases:
 *           type: integer
 *         deaths:
 *           type: integer
 *         new_deaths:
 *           type: integer
 *         recovered:
 *           type: integer
 *         new_recovered:
 *           type: integer
 *         hospitalized:
 *           type: integer
 *         icu_patients:
 *           type: integer
 *         ventilator_patients:
 *           type: integer
 */

/**
 * @swagger
 * /api/v1/cases:
 *   get:
 *     summary: Get COVID-19 cases data
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *       - in: query
 *         name: municipality_id
 *         schema:
 *           type: integer
 *         description: Filter by municipality ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: COVID-19 cases data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CovidCase'
 *                 total:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 */
router.get('/', [
  query('date').optional().isISO8601().toDate(),
  query('region_id').optional().isInt({ min: 1 }),
  query('municipality_id').optional().isInt({ min: 1 }),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
], handleValidationErrors, async (req, res) => {
  try {
    const { date, region_id, municipality_id, start_date, end_date, limit = 100, offset = 0 } = req.query;

    let whereConditions = [];
    let params = [];

    if (date) {
      whereConditions.push('DATE(c.date) = ?');
      params.push(date);
    }

    if (start_date && end_date) {
      whereConditions.push('c.date BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }

    if (region_id) {
      whereConditions.push('c.region_id = ?');
      params.push(region_id);
    }

    if (municipality_id) {
      whereConditions.push('c.municipality_id = ?');
      params.push(municipality_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM covid_cases c 
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, params);

    // Get paginated data
    const dataQuery = `
      SELECT 
        c.*,
        r.name as region_name,
        m.name as municipality_name
      FROM covid_cases c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN municipalities m ON c.municipality_id = m.id
      ${whereClause}
      ORDER BY c.date DESC, c.region_id
      LIMIT ? OFFSET ?
    `;
    const dataResult = await executeQuery(dataQuery, [...params, limit, offset]);

    if (!dataResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch cases data',
        message: dataResult.error
      });
    }

    const total = countResult.success ? countResult.data[0].total : 0;

    res.json({
      success: true,
      data: dataResult.data,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cases/latest:
 *   get:
 *     summary: Get latest COVID-19 cases data
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *     responses:
 *       200:
 *         description: Latest COVID-19 cases data
 */
router.get('/latest', [
  query('region_id').optional().isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const { region_id } = req.query;

    let whereClause = '';
    let params = [];

    if (region_id) {
      whereClause = 'WHERE c.region_id = ?';
      params.push(region_id);
    }

    const query = `
      SELECT 
        c.*,
        r.name as region_name,
        m.name as municipality_name
      FROM covid_cases c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN municipalities m ON c.municipality_id = m.id
      ${whereClause}
      ORDER BY c.date DESC
      LIMIT 1
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch latest cases data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data[0] || null
    });
  } catch (error) {
    console.error('Error fetching latest cases:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cases/summary:
 *   get:
 *     summary: Get COVID-19 cases summary statistics
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all]
 *           default: all
 *         description: Time period for summary
 *     responses:
 *       200:
 *         description: COVID-19 cases summary statistics
 */
router.get('/summary', [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'all'])
], handleValidationErrors, async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    let dateFilter = '';
    const params = [];

    switch (period) {
      case 'daily':
        dateFilter = 'WHERE DATE(c.date) = CURDATE()';
        break;
      case 'weekly':
        dateFilter = 'WHERE c.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'monthly':
        dateFilter = 'WHERE c.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        break;
      default:
        dateFilter = '';
    }

    const query = `
      SELECT 
        SUM(c.total_cases) as total_cases,
        SUM(c.new_cases) as total_new_cases,
        SUM(c.active_cases) as total_active_cases,
        SUM(c.deaths) as total_deaths,
        SUM(c.new_deaths) as total_new_deaths,
        SUM(c.recovered) as total_recovered,
        SUM(c.new_recovered) as total_new_recovered,
        SUM(c.hospitalized) as total_hospitalized,
        SUM(c.icu_patients) as total_icu_patients,
        SUM(c.ventilator_patients) as total_ventilator_patients,
        COUNT(DISTINCT c.region_id) as affected_regions,
        COUNT(DISTINCT c.municipality_id) as affected_municipalities,
        AVG(c.new_cases) as avg_daily_cases,
        MAX(c.new_cases) as max_daily_cases,
        MIN(c.date) as first_case_date,
        MAX(c.date) as last_updated
      FROM covid_cases c
      ${dateFilter}
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch summary statistics',
        message: result.error
      });
    }

    // Calculate mortality rate and recovery rate
    const summary = result.data[0];
    if (summary.total_cases > 0) {
      summary.mortality_rate = ((summary.total_deaths / summary.total_cases) * 100).toFixed(2);
      summary.recovery_rate = ((summary.total_recovered / summary.total_cases) * 100).toFixed(2);
    } else {
      summary.mortality_rate = '0.00';
      summary.recovery_rate = '0.00';
    }

    res.json({
      success: true,
      data: summary,
      period
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cases/trends:
 *   get:
 *     summary: Get COVID-19 cases trends and moving averages
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 7
 *           maximum: 365
 *           default: 30
 *         description: Number of days for trend analysis
 *     responses:
 *       200:
 *         description: COVID-19 cases trends data
 */
router.get('/trends', [
  query('days').optional().isInt({ min: 7, max: 365 }).toInt()
], handleValidationErrors, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        DATE(c.date) as date,
        SUM(c.new_cases) as daily_cases,
        SUM(c.new_deaths) as daily_deaths,
        SUM(c.new_recovered) as daily_recovered,
        SUM(c.active_cases) as active_cases
      FROM covid_cases c
      WHERE c.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(c.date)
      ORDER BY date
    `;

    const result = await executeQuery(query, [days]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch trends data',
        message: result.error
      });
    }

    // Calculate 7-day moving averages
    const data = result.data;
    const trendsWithMA = data.map((item, index) => {
      if (index >= 6) {
        const window = data.slice(index - 6, index + 1);
        const avgCases = window.reduce((sum, day) => sum + (day.daily_cases || 0), 0) / 7;
        const avgDeaths = window.reduce((sum, day) => sum + (day.daily_deaths || 0), 0) / 7;
        const avgRecovered = window.reduce((sum, day) => sum + (day.daily_recovered || 0), 0) / 7;

        return {
          ...item,
          ma_7_cases: Math.round(avgCases * 100) / 100,
          ma_7_deaths: Math.round(avgDeaths * 100) / 100,
          ma_7_recovered: Math.round(avgRecovered * 100) / 100
        };
      }
      return item;
    });

    res.json({
      success: true,
      data: trendsWithMA,
      period: `${days} days`,
      analysis: {
        total_days: data.length,
        moving_average_available: data.length >= 7
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cases:
 *   post:
 *     summary: Add new COVID-19 case data
 *     tags: [Cases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               region_id:
 *                 type: integer
 *               municipality_id:
 *                 type: integer
 *               total_cases:
 *                 type: integer
 *                 minimum: 0
 *               new_cases:
 *                 type: integer
 *                 minimum: 0
 *               deaths:
 *                 type: integer
 *                 minimum: 0
 *               recovered:
 *                 type: integer
 *                 minimum: 0
 *               hospitalized:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: COVID-19 case data added successfully
 *       400:
 *         description: Validation error
 */
router.post('/', [
  body('date').isISO8601().toDate(),
  body('region_id').optional().isInt({ min: 1 }),
  body('municipality_id').optional().isInt({ min: 1 }),
  body('total_cases').optional().isInt({ min: 0 }),
  body('new_cases').optional().isInt({ min: 0 }),
  body('deaths').optional().isInt({ min: 0 }),
  body('recovered').optional().isInt({ min: 0 }),
  body('hospitalized').optional().isInt({ min: 0 }),
  body('icu_patients').optional().isInt({ min: 0 }),
  body('ventilator_patients').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      date,
      region_id,
      municipality_id,
      total_cases = 0,
      new_cases = 0,
      deaths = 0,
      recovered = 0,
      hospitalized = 0,
      icu_patients = 0,
      ventilator_patients = 0
    } = req.body;

    // Calculate active cases
    const active_cases = total_cases - deaths - recovered;

    const query = `
      INSERT INTO covid_cases 
      (date, region_id, municipality_id, total_cases, new_cases, active_cases, 
       deaths, recovered, hospitalized, icu_patients, ventilator_patients)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      date, region_id, municipality_id, total_cases, new_cases, active_cases,
      deaths, recovered, hospitalized, icu_patients, ventilator_patients
    ];

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add case data',
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Case data added successfully',
      data: {
        id: result.data.insertId,
        ...req.body,
        active_cases
      }
    });
  } catch (error) {
    console.error('Error adding case data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cases/by-region:
 *   get:
 *     summary: Get COVID-19 cases grouped by region
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *     responses:
 *       200:
 *         description: COVID-19 cases data grouped by region
 */
router.get('/by-region', [
  query('date').optional().isISO8601().toDate()
], handleValidationErrors, async (req, res) => {
  try {
    const { date } = req.query;

    let whereClause = '';
    let params = [];

    if (date) {
      whereClause = 'WHERE DATE(c.date) = ?';
      params.push(date);
    }

    const query = `
      SELECT 
        r.id as region_id,
        r.name as region_name,
        r.code as region_code,
        r.population,
        SUM(c.total_cases) as total_cases,
        SUM(c.new_cases) as new_cases,
        SUM(c.active_cases) as active_cases,
        SUM(c.deaths) as deaths,
        SUM(c.recovered) as recovered,
        SUM(c.hospitalized) as hospitalized,
        ROUND((SUM(c.total_cases) / r.population) * 100000, 2) as cases_per_100k,
        MAX(c.date) as last_updated
      FROM regions r
      LEFT JOIN covid_cases c ON r.id = c.region_id
      ${whereClause}
      GROUP BY r.id, r.name, r.code, r.population
      ORDER BY total_cases DESC
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch regional data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      date: date || 'all_time'
    });
  } catch (error) {
    console.error('Error fetching regional data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

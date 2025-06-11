const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { executeQuery } = require('../database');
const router = express.Router();

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
 *     TestingCenter:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         region_id:
 *           type: integer
 *         municipality_id:
 *           type: integer
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         test_types:
 *           type: string
 *         operating_hours:
 *           type: string
 *         is_active:
 *           type: boolean
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *     TestingData:
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
 *         testing_center_id:
 *           type: integer
 *         total_tests:
 *           type: integer
 *         pcr_tests:
 *           type: integer
 *         antigen_tests:
 *           type: integer
 *         positive_tests:
 *           type: integer
 *         negative_tests:
 *           type: integer
 *         pending_tests:
 *           type: integer
 *         positivity_rate:
 *           type: number
 */

/**
 * @swagger
 * /api/v1/testing/centers:
 *   get:
 *     summary: Get testing centers
 *     tags: [Testing]
 *     parameters:
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: test_type
 *         schema:
 *           type: string
 *         description: Filter by test type offered
 *     responses:
 *       200:
 *         description: Testing centers retrieved successfully
 */
router.get('/centers', [
  query('region_id').optional().isInt({ min: 1 }),
  query('is_active').optional().isBoolean(),
  query('test_type').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { region_id, is_active, test_type } = req.query;

    let whereConditions = [];
    let params = [];

    if (region_id) {
      whereConditions.push('tc.region_id = ?');
      params.push(region_id);
    }

    if (is_active !== undefined) {
      whereConditions.push('tc.is_active = ?');
      params.push(is_active === 'true');
    }

    if (test_type) {
      whereConditions.push('tc.test_types LIKE ?');
      params.push(`%${test_type}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        tc.*,
        r.name as region_name,
        m.name as municipality_name,
        COALESCE(SUM(td.total_tests), 0) as total_tests_conducted,
        COALESCE(AVG(td.positivity_rate), 0) as avg_positivity_rate,
        MAX(td.date) as last_data_update
      FROM testing_centers tc
      LEFT JOIN regions r ON tc.region_id = r.id
      LEFT JOIN municipalities m ON tc.municipality_id = m.id
      LEFT JOIN testing_data td ON tc.id = td.testing_center_id
      ${whereClause}
      GROUP BY tc.id
      ORDER BY tc.name
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch testing centers',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      total: result.data.length
    });
  } catch (error) {
    console.error('Error fetching testing centers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/testing/data:
 *   get:
 *     summary: Get testing data
 *     tags: [Testing]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *       - in: query
 *         name: testing_center_id
 *         schema:
 *           type: integer
 *         description: Filter by testing center ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range
 *     responses:
 *       200:
 *         description: Testing data retrieved successfully
 */
router.get('/data', [
  query('date').optional().isISO8601().toDate(),
  query('region_id').optional().isInt({ min: 1 }),
  query('testing_center_id').optional().isInt({ min: 1 }),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
], handleValidationErrors, async (req, res) => {
  try {
    const { date, region_id, testing_center_id, start_date, end_date } = req.query;

    let whereConditions = [];
    let params = [];

    if (date) {
      whereConditions.push('DATE(td.date) = ?');
      params.push(date);
    }

    if (start_date && end_date) {
      whereConditions.push('td.date BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }

    if (region_id) {
      whereConditions.push('td.region_id = ?');
      params.push(region_id);
    }

    if (testing_center_id) {
      whereConditions.push('td.testing_center_id = ?');
      params.push(testing_center_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        td.*,
        r.name as region_name,
        m.name as municipality_name,
        tc.name as testing_center_name,
        tc.address as testing_center_address
      FROM testing_data td
      LEFT JOIN regions r ON td.region_id = r.id
      LEFT JOIN municipalities m ON td.municipality_id = m.id
      LEFT JOIN testing_centers tc ON td.testing_center_id = tc.id
      ${whereClause}
      ORDER BY td.date DESC, r.name
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch testing data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      total: result.data.length
    });
  } catch (error) {
    console.error('Error fetching testing data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/testing/summary:
 *   get:
 *     summary: Get testing summary statistics
 *     tags: [Testing]
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
 *         description: Testing summary statistics
 */
router.get('/summary', [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'all'])
], handleValidationErrors, async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'daily':
        dateFilter = 'WHERE DATE(td.date) = CURDATE()';
        break;
      case 'weekly':
        dateFilter = 'WHERE td.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'monthly':
        dateFilter = 'WHERE td.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        break;
      default:
        dateFilter = '';
    }

    const query = `
      SELECT 
        SUM(td.total_tests) as total_tests,
        SUM(td.pcr_tests) as total_pcr_tests,
        SUM(td.antigen_tests) as total_antigen_tests,
        SUM(td.positive_tests) as total_positive_tests,
        SUM(td.negative_tests) as total_negative_tests,
        SUM(td.pending_tests) as total_pending_tests,
        ROUND(AVG(td.positivity_rate), 2) as avg_positivity_rate,
        ROUND((SUM(td.positive_tests) / NULLIF(SUM(td.total_tests), 0)) * 100, 2) as overall_positivity_rate,
        COUNT(DISTINCT td.testing_center_id) as active_testing_centers,
        COUNT(DISTINCT td.region_id) as regions_with_testing,
        MAX(td.date) as last_updated,
        MIN(td.date) as first_test_date
      FROM testing_data td
      ${dateFilter}
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch testing summary',
        message: result.error
      });
    }

    // Get testing center breakdown
    const centersQuery = `
      SELECT 
        tc.name,
        SUM(td.total_tests) as tests_conducted,
        ROUND(AVG(td.positivity_rate), 2) as avg_positivity_rate
      FROM testing_centers tc
      LEFT JOIN testing_data td ON tc.id = td.testing_center_id
      ${dateFilter.replace('td.date', 'td.date')}
      GROUP BY tc.id, tc.name
      HAVING tests_conducted > 0
      ORDER BY tests_conducted DESC
      LIMIT 10
    `;

    const centersResult = await executeQuery(centersQuery);

    res.json({
      success: true,
      data: {
        summary: result.data[0],
        top_testing_centers: centersResult.success ? centersResult.data : []
      },
      period
    });
  } catch (error) {
    console.error('Error fetching testing summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/testing/positivity-trends:
 *   get:
 *     summary: Get COVID-19 test positivity trends
 *     tags: [Testing]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 7
 *           maximum: 90
 *           default: 30
 *         description: Number of days for trend analysis
 *     responses:
 *       200:
 *         description: Test positivity trends
 */
router.get('/positivity-trends', [
  query('days').optional().isInt({ min: 7, max: 90 }).toInt()
], handleValidationErrors, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        DATE(td.date) as date,
        SUM(td.total_tests) as daily_tests,
        SUM(td.pcr_tests) as daily_pcr_tests,
        SUM(td.antigen_tests) as daily_antigen_tests,
        SUM(td.positive_tests) as daily_positive_tests,
        SUM(td.negative_tests) as daily_negative_tests,
        ROUND((SUM(td.positive_tests) / NULLIF(SUM(td.total_tests), 0)) * 100, 2) as daily_positivity_rate
      FROM testing_data td
      WHERE td.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(td.date)
      ORDER BY date
    `;

    const result = await executeQuery(query, [days]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch positivity trends',
        message: result.error
      });
    }

    const data = result.data;

    // Calculate 7-day moving averages
    const trendsData = data.map((item, index) => {
      if (index >= 6) {
        const window = data.slice(index - 6, index + 1);
        const avgTests = window.reduce((sum, day) => sum + (day.daily_tests || 0), 0) / 7;
        const avgPositiveTests = window.reduce((sum, day) => sum + (day.daily_positive_tests || 0), 0) / 7;
        const avgPositivityRate = avgTests > 0 ? (avgPositiveTests / avgTests) * 100 : 0;

        return {
          ...item,
          ma_7_tests: Math.round(avgTests),
          ma_7_positive_tests: Math.round(avgPositiveTests),
          ma_7_positivity_rate: Math.round(avgPositivityRate * 100) / 100
        };
      }
      return item;
    });

    res.json({
      success: true,
      data: trendsData,
      period: `${days} days`,
      analysis: {
        total_days: data.length,
        avg_daily_tests: data.length > 0 ? Math.round(data.reduce((sum, day) => sum + (day.daily_tests || 0), 0) / data.length) : 0,
        avg_positivity_rate: data.length > 0 ? (data.reduce((sum, day) => sum + (day.daily_positivity_rate || 0), 0) / data.length).toFixed(2) : '0.00'
      }
    });
  } catch (error) {
    console.error('Error fetching positivity trends:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/testing/centers:
 *   post:
 *     summary: Add new testing center
 *     tags: [Testing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               region_id:
 *                 type: integer
 *               municipality_id:
 *                 type: integer
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               test_types:
 *                 type: string
 *               operating_hours:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Testing center added successfully
 */
router.post('/centers', [
  body('name').notEmpty().trim().isLength({ min: 2, max: 200 }),
  body('region_id').optional().isInt({ min: 1 }),
  body('municipality_id').optional().isInt({ min: 1 }),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail(),
  body('test_types').optional().trim(),
  body('operating_hours').optional().trim(),
  body('is_active').optional().isBoolean(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      name,
      region_id,
      municipality_id,
      address,
      phone,
      email,
      test_types,
      operating_hours,
      is_active = true,
      latitude,
      longitude
    } = req.body;

    const query = `
      INSERT INTO testing_centers 
      (name, region_id, municipality_id, address, phone, email, 
       test_types, operating_hours, is_active, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      name, region_id, municipality_id, address, phone, email,
      test_types, operating_hours, is_active, latitude, longitude
    ];

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add testing center',
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Testing center added successfully',
      data: {
        id: result.data.insertId,
        ...req.body
      }
    });
  } catch (error) {
    console.error('Error adding testing center:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/testing/data:
 *   post:
 *     summary: Add testing data
 *     tags: [Testing]
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
 *               testing_center_id:
 *                 type: integer
 *               total_tests:
 *                 type: integer
 *               pcr_tests:
 *                 type: integer
 *               antigen_tests:
 *                 type: integer
 *               positive_tests:
 *                 type: integer
 *               negative_tests:
 *                 type: integer
 *               pending_tests:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Testing data added successfully
 */
router.post('/data', [
  body('date').isISO8601().toDate(),
  body('region_id').optional().isInt({ min: 1 }),
  body('municipality_id').optional().isInt({ min: 1 }),
  body('testing_center_id').optional().isInt({ min: 1 }),
  body('total_tests').optional().isInt({ min: 0 }),
  body('pcr_tests').optional().isInt({ min: 0 }),
  body('antigen_tests').optional().isInt({ min: 0 }),
  body('positive_tests').optional().isInt({ min: 0 }),
  body('negative_tests').optional().isInt({ min: 0 }),
  body('pending_tests').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      date,
      region_id,
      municipality_id,
      testing_center_id,
      total_tests = 0,
      pcr_tests = 0,
      antigen_tests = 0,
      positive_tests = 0,
      negative_tests = 0,
      pending_tests = 0
    } = req.body;

    // Calculate positivity rate
    const positivity_rate = total_tests > 0 ? (positive_tests / total_tests) * 100 : 0;

    const query = `
      INSERT INTO testing_data 
      (date, region_id, municipality_id, testing_center_id, total_tests, 
       pcr_tests, antigen_tests, positive_tests, negative_tests, pending_tests, positivity_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      total_tests = total_tests + VALUES(total_tests),
      pcr_tests = pcr_tests + VALUES(pcr_tests),
      antigen_tests = antigen_tests + VALUES(antigen_tests),
      positive_tests = positive_tests + VALUES(positive_tests),
      negative_tests = negative_tests + VALUES(negative_tests),
      pending_tests = VALUES(pending_tests),
      positivity_rate = (positive_tests / NULLIF(total_tests, 0)) * 100,
      updated_at = CURRENT_TIMESTAMP
    `;

    const params = [
      date, region_id, municipality_id, testing_center_id, total_tests,
      pcr_tests, antigen_tests, positive_tests, negative_tests, pending_tests, positivity_rate
    ];

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add testing data',
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Testing data added successfully',
      data: {
        id: result.data.insertId,
        ...req.body,
        positivity_rate: Math.round(positivity_rate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error adding testing data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

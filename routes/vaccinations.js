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
 * /api/v1/vaccinations:
 *   get:
 *     summary: Get vaccination data
 *     tags: [Vaccinations]
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
 *         name: vaccine_type
 *         schema:
 *           type: string
 *         description: Filter by vaccine type
 *     responses:
 *       200:
 *         description: Vaccination data retrieved successfully
 */
router.get('/', [
  query('date').optional().isISO8601().toDate(),
  query('region_id').optional().isInt({ min: 1 }),
  query('vaccine_type').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { date, region_id, vaccine_type } = req.query;

    let whereConditions = [];
    let params = [];

    if (date) {
      whereConditions.push('DATE(v.date) = ?');
      params.push(date);
    }

    if (region_id) {
      whereConditions.push('v.region_id = ?');
      params.push(region_id);
    }

    if (vaccine_type) {
      whereConditions.push('v.vaccine_type = ?');
      params.push(vaccine_type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        v.*,
        r.name as region_name,
        r.population,
        m.name as municipality_name,
        ROUND((v.people_vaccinated / r.population) * 100, 2) as vaccination_rate,
        ROUND((v.people_fully_vaccinated / r.population) * 100, 2) as full_vaccination_rate
      FROM vaccinations v
      LEFT JOIN regions r ON v.region_id = r.id
      LEFT JOIN municipalities m ON v.municipality_id = m.id
      ${whereClause}
      ORDER BY v.date DESC, r.name
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vaccination data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      total: result.data.length
    });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vaccinations/summary:
 *   get:
 *     summary: Get vaccination summary statistics
 *     tags: [Vaccinations]
 *     responses:
 *       200:
 *         description: Vaccination summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        SUM(v.first_dose) as total_first_doses,
        SUM(v.second_dose) as total_second_doses,
        SUM(v.booster_dose) as total_booster_doses,
        SUM(v.total_doses) as total_doses_administered,
        SUM(v.people_vaccinated) as total_people_vaccinated,
        SUM(v.people_fully_vaccinated) as total_people_fully_vaccinated,
        COUNT(DISTINCT v.vaccine_type) as vaccine_types_used,
        COUNT(DISTINCT v.region_id) as regions_covered,
        MAX(v.date) as last_updated,
        MIN(v.date) as vaccination_start_date,
        SUM(r.population) as total_population,
        ROUND((SUM(v.people_vaccinated) / SUM(r.population)) * 100, 2) as overall_vaccination_rate,
        ROUND((SUM(v.people_fully_vaccinated) / SUM(r.population)) * 100, 2) as overall_full_vaccination_rate
      FROM vaccinations v
      LEFT JOIN regions r ON v.region_id = r.id
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vaccination summary',
        message: result.error
      });
    }

    // Get vaccine type breakdown
    const vaccineTypesQuery = `
      SELECT 
        vaccine_type,
        SUM(first_dose) as first_doses,
        SUM(second_dose) as second_doses,
        SUM(booster_dose) as booster_doses,
        SUM(total_doses) as total_doses
      FROM vaccinations
      WHERE vaccine_type IS NOT NULL
      GROUP BY vaccine_type
      ORDER BY total_doses DESC
    `;

    const vaccineTypesResult = await executeQuery(vaccineTypesQuery);

    res.json({
      success: true,
      data: {
        summary: result.data[0],
        vaccine_types: vaccineTypesResult.success ? vaccineTypesResult.data : []
      }
    });
  } catch (error) {
    console.error('Error fetching vaccination summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vaccinations/progress:
 *   get:
 *     summary: Get vaccination progress over time
 *     tags: [Vaccinations]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 7
 *           maximum: 365
 *           default: 30
 *         description: Number of days for progress analysis
 *     responses:
 *       200:
 *         description: Vaccination progress data
 */
router.get('/progress', [
  query('days').optional().isInt({ min: 7, max: 365 }).toInt()
], handleValidationErrors, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        DATE(v.date) as date,
        SUM(v.first_dose) as daily_first_doses,
        SUM(v.second_dose) as daily_second_doses,
        SUM(v.booster_dose) as daily_booster_doses,
        SUM(v.total_doses) as daily_total_doses,
        SUM(v.people_vaccinated) as cumulative_people_vaccinated,
        SUM(v.people_fully_vaccinated) as cumulative_people_fully_vaccinated
      FROM vaccinations v
      WHERE v.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(v.date)
      ORDER BY date
    `;

    const result = await executeQuery(query, [days]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vaccination progress',
        message: result.error
      });
    }

    // Calculate daily vaccination rate
    const data = result.data.map(item => ({
      ...item,
      daily_vaccination_rate: item.daily_first_doses + item.daily_second_doses + item.daily_booster_doses
    }));

    // Calculate 7-day moving average
    const dataWithMA = data.map((item, index) => {
      if (index >= 6) {
        const window = data.slice(index - 6, index + 1);
        const avgDoses = window.reduce((sum, day) => sum + (day.daily_total_doses || 0), 0) / 7;
        return {
          ...item,
          ma_7_doses: Math.round(avgDoses)
        };
      }
      return item;
    });

    res.json({
      success: true,
      data: dataWithMA,
      period: `${days} days`,
      analysis: {
        total_days: data.length,
        moving_average_available: data.length >= 7
      }
    });
  } catch (error) {
    console.error('Error fetching vaccination progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vaccinations/by-region:
 *   get:
 *     summary: Get vaccination data grouped by region
 *     tags: [Vaccinations]
 *     responses:
 *       200:
 *         description: Vaccination data grouped by region
 */
router.get('/by-region', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id as region_id,
        r.name as region_name,
        r.population,
        SUM(v.first_dose) as total_first_doses,
        SUM(v.second_dose) as total_second_doses,
        SUM(v.booster_dose) as total_booster_doses,
        SUM(v.total_doses) as total_doses,
        SUM(v.people_vaccinated) as people_vaccinated,
        SUM(v.people_fully_vaccinated) as people_fully_vaccinated,
        ROUND((SUM(v.people_vaccinated) / r.population) * 100, 2) as vaccination_rate,
        ROUND((SUM(v.people_fully_vaccinated) / r.population) * 100, 2) as full_vaccination_rate,
        MAX(v.date) as last_updated
      FROM regions r
      LEFT JOIN vaccinations v ON r.id = v.region_id
      GROUP BY r.id, r.name, r.population
      ORDER BY vaccination_rate DESC
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch regional vaccination data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching regional vaccination data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vaccinations:
 *   post:
 *     summary: Add vaccination data
 *     tags: [Vaccinations]
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
 *               vaccine_type:
 *                 type: string
 *               first_dose:
 *                 type: integer
 *               second_dose:
 *                 type: integer
 *               booster_dose:
 *                 type: integer
 *               people_vaccinated:
 *                 type: integer
 *               people_fully_vaccinated:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Vaccination data added successfully
 */
router.post('/', [
  body('date').isISO8601().toDate(),
  body('region_id').optional().isInt({ min: 1 }),
  body('municipality_id').optional().isInt({ min: 1 }),
  body('vaccine_type').optional().trim(),
  body('first_dose').optional().isInt({ min: 0 }),
  body('second_dose').optional().isInt({ min: 0 }),
  body('booster_dose').optional().isInt({ min: 0 }),
  body('people_vaccinated').optional().isInt({ min: 0 }),
  body('people_fully_vaccinated').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      date,
      region_id,
      municipality_id,
      vaccine_type,
      first_dose = 0,
      second_dose = 0,
      booster_dose = 0,
      people_vaccinated = 0,
      people_fully_vaccinated = 0
    } = req.body;

    const total_doses = first_dose + second_dose + booster_dose;

    const query = `
      INSERT INTO vaccinations 
      (date, region_id, municipality_id, vaccine_type, first_dose, second_dose, 
       booster_dose, total_doses, people_vaccinated, people_fully_vaccinated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      first_dose = first_dose + VALUES(first_dose),
      second_dose = second_dose + VALUES(second_dose),
      booster_dose = booster_dose + VALUES(booster_dose),
      total_doses = total_doses + VALUES(total_doses),
      people_vaccinated = GREATEST(people_vaccinated, VALUES(people_vaccinated)),
      people_fully_vaccinated = GREATEST(people_fully_vaccinated, VALUES(people_fully_vaccinated)),
      updated_at = CURRENT_TIMESTAMP
    `;

    const params = [
      date, region_id, municipality_id, vaccine_type, first_dose, second_dose,
      booster_dose, total_doses, people_vaccinated, people_fully_vaccinated
    ];

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add vaccination data',
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vaccination data added successfully',
      data: {
        id: result.data.insertId,
        ...req.body,
        total_doses
      }
    });
  } catch (error) {
    console.error('Error adding vaccination data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vaccinations/types:
 *   get:
 *     summary: Get available vaccine types
 *     tags: [Vaccinations]
 *     responses:
 *       200:
 *         description: Available vaccine types
 */
router.get('/types', async (req, res) => {
  try {
    const query = `
      SELECT 
        vaccine_type,
        SUM(first_dose) as total_first_doses,
        SUM(second_dose) as total_second_doses,
        SUM(booster_dose) as total_booster_doses,
        SUM(total_doses) as total_doses,
        COUNT(DISTINCT region_id) as regions_used,
        MIN(date) as first_used,
        MAX(date) as last_used
      FROM vaccinations
      WHERE vaccine_type IS NOT NULL AND vaccine_type != ''
      GROUP BY vaccine_type
      ORDER BY total_doses DESC
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vaccine types',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching vaccine types:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vaccinations/coverage:
 *   get:
 *     summary: Get vaccination coverage analysis
 *     tags: [Vaccinations]
 *     responses:
 *       200:
 *         description: Vaccination coverage analysis
 */
router.get('/coverage', async (req, res) => {
  try {
    const query = `
      SELECT 
        'Kosovo' as location,
        SUM(r.population) as total_population,
        SUM(v.people_vaccinated) as people_vaccinated,
        SUM(v.people_fully_vaccinated) as people_fully_vaccinated,
        ROUND((SUM(v.people_vaccinated) / SUM(r.population)) * 100, 2) as partial_coverage,
        ROUND((SUM(v.people_fully_vaccinated) / SUM(r.population)) * 100, 2) as full_coverage,
        ROUND(((SUM(r.population) - SUM(v.people_vaccinated)) / SUM(r.population)) * 100, 2) as unvaccinated_rate
      FROM regions r
      LEFT JOIN (
        SELECT 
          region_id,
          MAX(people_vaccinated) as people_vaccinated,
          MAX(people_fully_vaccinated) as people_fully_vaccinated
        FROM vaccinations
        GROUP BY region_id
      ) v ON r.id = v.region_id
      
      UNION ALL
      
      SELECT 
        r.name as location,
        r.population as total_population,
        COALESCE(MAX(v.people_vaccinated), 0) as people_vaccinated,
        COALESCE(MAX(v.people_fully_vaccinated), 0) as people_fully_vaccinated,
        ROUND((COALESCE(MAX(v.people_vaccinated), 0) / r.population) * 100, 2) as partial_coverage,
        ROUND((COALESCE(MAX(v.people_fully_vaccinated), 0) / r.population) * 100, 2) as full_coverage,
        ROUND(((r.population - COALESCE(MAX(v.people_vaccinated), 0)) / r.population) * 100, 2) as unvaccinated_rate
      FROM regions r
      LEFT JOIN vaccinations v ON r.id = v.region_id
      GROUP BY r.id, r.name, r.population
      ORDER BY location = 'Kosovo' DESC, full_coverage DESC
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vaccination coverage',
        message: result.error
      });
    }

    const data = result.data;
    const national = data.find(item => item.location === 'Kosovo');
    const regions = data.filter(item => item.location !== 'Kosovo');

    res.json({
      success: true,
      data: {
        national: national,
        regions: regions,
        analysis: {
          highest_coverage: regions.length > 0 ? Math.max(...regions.map(r => r.full_coverage)) : 0,
          lowest_coverage: regions.length > 0 ? Math.min(...regions.map(r => r.full_coverage)) : 0,
          coverage_variance: regions.length > 0 ? 
            Math.max(...regions.map(r => r.full_coverage)) - Math.min(...regions.map(r => r.full_coverage)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vaccination coverage:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

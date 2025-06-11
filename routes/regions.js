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
 *     Region:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         population:
 *           type: integer
 *         area_km2:
 *           type: number
 *         capital:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/regions:
 *   get:
 *     summary: Get all regions in Kosovo
 *     tags: [Regions]
 *     parameters:
 *       - in: query
 *         name: include_stats
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include COVID-19 statistics for each region
 *     responses:
 *       200:
 *         description: List of regions retrieved successfully
 */
router.get('/', [
  query('include_stats').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { include_stats } = req.query;

    let query;
    if (include_stats === 'true') {
      query = `
        SELECT 
          r.*,
          COALESCE(SUM(c.total_cases), 0) as total_cases,
          COALESCE(SUM(c.active_cases), 0) as active_cases,
          COALESCE(SUM(c.deaths), 0) as total_deaths,
          COALESCE(SUM(c.recovered), 0) as total_recovered,
          COALESCE(SUM(c.hospitalized), 0) as hospitalized,
          COALESCE(SUM(v.people_vaccinated), 0) as people_vaccinated,
          COALESCE(SUM(v.people_fully_vaccinated), 0) as people_fully_vaccinated,
          COUNT(DISTINCT h.id) as hospitals,
          COUNT(DISTINCT m.id) as municipalities,
          ROUND((COALESCE(SUM(c.total_cases), 0) / r.population) * 100000, 2) as cases_per_100k,
          ROUND((COALESCE(SUM(v.people_vaccinated), 0) / r.population) * 100, 2) as vaccination_rate
        FROM regions r
        LEFT JOIN covid_cases c ON r.id = c.region_id AND c.date = (SELECT MAX(date) FROM covid_cases WHERE region_id = r.id)
        LEFT JOIN vaccinations v ON r.id = v.region_id
        LEFT JOIN hospitals h ON r.id = h.region_id
        LEFT JOIN municipalities m ON r.id = m.region_id
        GROUP BY r.id, r.name, r.code, r.population, r.area_km2, r.capital
        ORDER BY r.name
      `;
    } else {
      query = `
        SELECT 
          r.*,
          COUNT(DISTINCT m.id) as municipalities
        FROM regions r
        LEFT JOIN municipalities m ON r.id = m.region_id
        GROUP BY r.id, r.name, r.code, r.population, r.area_km2, r.capital
        ORDER BY r.name
      `;
    }

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch regions data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      total: result.data.length,
      includes_stats: include_stats === 'true'
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/regions/{id}:
 *   get:
 *     summary: Get region by ID with detailed information
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Region ID
 *     responses:
 *       200:
 *         description: Region data retrieved successfully
 *       404:
 *         description: Region not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.*,
        COALESCE(SUM(c.total_cases), 0) as total_cases,
        COALESCE(SUM(c.active_cases), 0) as active_cases,
        COALESCE(SUM(c.deaths), 0) as total_deaths,
        COALESCE(SUM(c.recovered), 0) as total_recovered,
        COALESCE(SUM(c.hospitalized), 0) as hospitalized,
        COALESCE(SUM(c.icu_patients), 0) as icu_patients,
        COALESCE(SUM(v.people_vaccinated), 0) as people_vaccinated,
        COALESCE(SUM(v.people_fully_vaccinated), 0) as people_fully_vaccinated,
        COALESCE(SUM(v.total_doses), 0) as total_vaccination_doses,
        COUNT(DISTINCT h.id) as hospitals,
        COUNT(DISTINCT tc.id) as testing_centers,
        COUNT(DISTINCT m.id) as municipalities,
        COALESCE(SUM(h.total_beds), 0) as total_hospital_beds,
        COALESCE(SUM(h.occupied_beds), 0) as occupied_hospital_beds,
        ROUND((COALESCE(SUM(c.total_cases), 0) / r.population) * 100000, 2) as cases_per_100k,
        ROUND((COALESCE(SUM(c.deaths), 0) / r.population) * 100000, 2) as deaths_per_100k,
        ROUND((COALESCE(SUM(v.people_vaccinated), 0) / r.population) * 100, 2) as vaccination_rate,
        ROUND((COALESCE(SUM(v.people_fully_vaccinated), 0) / r.population) * 100, 2) as full_vaccination_rate,
        MAX(c.date) as last_case_update,
        MAX(v.date) as last_vaccination_update
      FROM regions r
      LEFT JOIN covid_cases c ON r.id = c.region_id
      LEFT JOIN vaccinations v ON r.id = v.region_id
      LEFT JOIN hospitals h ON r.id = h.region_id
      LEFT JOIN testing_centers tc ON r.id = tc.region_id
      LEFT JOIN municipalities m ON r.id = m.region_id
      WHERE r.id = ?
      GROUP BY r.id, r.name, r.code, r.population, r.area_km2, r.capital
    `;

    const result = await executeQuery(query, [id]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch region data',
        message: result.error
      });
    }

    if (result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Region not found'
      });
    }

    const regionData = result.data[0];

    // Calculate additional metrics
    regionData.population_density = regionData.area_km2 > 0 ? 
      (regionData.population / regionData.area_km2).toFixed(2) : '0.00';
    regionData.case_fatality_rate = regionData.total_cases > 0 ? 
      ((regionData.total_deaths / regionData.total_cases) * 100).toFixed(2) : '0.00';
    regionData.recovery_rate = regionData.total_cases > 0 ? 
      ((regionData.total_recovered / regionData.total_cases) * 100).toFixed(2) : '0.00';
    regionData.hospital_bed_ratio = regionData.population > 0 ? 
      ((regionData.total_hospital_beds / regionData.population) * 1000).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: regionData
    });
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/regions/{id}/municipalities:
 *   get:
 *     summary: Get municipalities in a specific region
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Region ID
 *     responses:
 *       200:
 *         description: Municipalities in the region
 */
router.get('/:id/municipalities', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        m.*,
        r.name as region_name,
        COALESCE(SUM(c.total_cases), 0) as total_cases,
        COALESCE(SUM(c.active_cases), 0) as active_cases,
        COALESCE(SUM(c.deaths), 0) as total_deaths,
        COALESCE(SUM(c.recovered), 0) as total_recovered,
        COUNT(DISTINCT h.id) as hospitals,
        COUNT(DISTINCT tc.id) as testing_centers,
        ROUND((COALESCE(SUM(c.total_cases), 0) / NULLIF(m.population, 0)) * 100000, 2) as cases_per_100k,
        MAX(c.date) as last_updated
      FROM municipalities m
      LEFT JOIN regions r ON m.region_id = r.id
      LEFT JOIN covid_cases c ON m.id = c.municipality_id
      LEFT JOIN hospitals h ON m.id = h.municipality_id
      LEFT JOIN testing_centers tc ON m.id = tc.municipality_id
      WHERE m.region_id = ?
      GROUP BY m.id, m.name, m.code, m.population, m.area_km2, r.name
      ORDER BY m.name
    `;

    const result = await executeQuery(query, [id]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch municipalities data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      total: result.data.length,
      region_id: parseInt(id)
    });
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/regions/{id}/trends:
 *   get:
 *     summary: Get COVID-19 trends for a specific region
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Region ID
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
 *         description: Regional COVID-19 trends
 */
router.get('/:id/trends', [
  query('days').optional().isInt({ min: 7, max: 90 }).toInt()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        DATE(c.date) as date,
        SUM(c.new_cases) as daily_cases,
        SUM(c.new_deaths) as daily_deaths,
        SUM(c.new_recovered) as daily_recovered,
        SUM(c.active_cases) as active_cases,
        SUM(c.hospitalized) as hospitalized,
        SUM(c.icu_patients) as icu_patients
      FROM covid_cases c
      WHERE c.region_id = ? AND c.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(c.date)
      ORDER BY date
    `;

    const result = await executeQuery(query, [id, days]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch regional trends',
        message: result.error
      });
    }

    const data = result.data;

    // Calculate 7-day moving averages
    const trendsData = data.map((item, index) => {
      const trends = { ...item };

      if (index >= 6) {
        const window = data.slice(index - 6, index + 1);
        trends.ma_7_cases = Math.round(window.reduce((sum, day) => sum + (day.daily_cases || 0), 0) / 7);
        trends.ma_7_deaths = Math.round(window.reduce((sum, day) => sum + (day.daily_deaths || 0), 0) / 7);
      }

      return trends;
    });

    res.json({
      success: true,
      data: trendsData,
      region_id: parseInt(id),
      period: `${days} days`,
      total_days: data.length
    });
  } catch (error) {
    console.error('Error fetching regional trends:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/regions/comparison:
 *   get:
 *     summary: Compare statistics between regions
 *     tags: [Regions]
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [cases, deaths, vaccination, recovery]
 *           default: cases
 *         description: Metric to compare
 *     responses:
 *       200:
 *         description: Regional comparison data
 */
router.get('/comparison', [
  query('metric').optional().isIn(['cases', 'deaths', 'vaccination', 'recovery'])
], handleValidationErrors, async (req, res) => {
  try {
    const { metric = 'cases' } = req.query;

    let selectField;
    let orderField;

    switch (metric) {
      case 'deaths':
        selectField = 'COALESCE(SUM(c.deaths), 0) as value';
        orderField = 'value';
        break;
      case 'vaccination':
        selectField = 'ROUND((COALESCE(SUM(v.people_vaccinated), 0) / r.population) * 100, 2) as value';
        orderField = 'value';
        break;
      case 'recovery':
        selectField = 'ROUND((COALESCE(SUM(c.recovered), 0) / NULLIF(SUM(c.total_cases), 0)) * 100, 2) as value';
        orderField = 'value';
        break;
      default: // cases
        selectField = 'ROUND((COALESCE(SUM(c.total_cases), 0) / r.population) * 100000, 2) as value';
        orderField = 'value';
        break;
    }

    const query = `
      SELECT 
        r.id,
        r.name,
        r.population,
        ${selectField},
        '${metric}' as metric_type
      FROM regions r
      LEFT JOIN covid_cases c ON r.id = c.region_id AND c.date = (SELECT MAX(date) FROM covid_cases WHERE region_id = r.id)
      LEFT JOIN vaccinations v ON r.id = v.region_id
      GROUP BY r.id, r.name, r.population
      ORDER BY ${orderField} DESC
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch comparison data',
        message: result.error
      });
    }

    const data = result.data;
    const values = data.map(item => item.value).filter(v => v !== null);

    const analysis = {
      metric: metric,
      total_regions: data.length,
      highest_value: Math.max(...values),
      lowest_value: Math.min(...values),
      average_value: values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2) : '0.00',
      median_value: values.length > 0 ? values.sort((a, b) => a - b)[Math.floor(values.length / 2)].toFixed(2) : '0.00'
    };

    res.json({
      success: true,
      data,
      analysis
    });
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/regions:
 *   post:
 *     summary: Add new region
 *     tags: [Regions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               population:
 *                 type: integer
 *               area_km2:
 *                 type: number
 *               capital:
 *                 type: string
 *     responses:
 *       201:
 *         description: Region added successfully
 */
router.post('/', [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('code').notEmpty().trim().isLength({ min: 2, max: 10 }),
  body('population').optional().isInt({ min: 0 }),
  body('area_km2').optional().isFloat({ min: 0 }),
  body('capital').optional().trim().isLength({ max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { name, code, population = 0, area_km2 = 0, capital } = req.body;

    const query = `
      INSERT INTO regions (name, code, population, area_km2, capital)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [name, code, population, area_km2, capital]);

    if (!result.success) {
      if (result.error.includes('Duplicate entry')) {
        return res.status(409).json({
          success: false,
          error: 'Region with this name or code already exists'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to add region',
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Region added successfully',
      data: {
        id: result.data.insertId,
        ...req.body
      }
    });
  } catch (error) {
    console.error('Error adding region:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/regions/{id}:
 *   put:
 *     summary: Update region information
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Region ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               population:
 *                 type: integer
 *               area_km2:
 *                 type: number
 *               capital:
 *                 type: string
 *     responses:
 *       200:
 *         description: Region updated successfully
 */
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('code').optional().trim().isLength({ min: 2, max: 10 }),
  body('population').optional().isInt({ min: 0 }),
  body('area_km2').optional().isFloat({ min: 0 }),
  body('capital').optional().trim().isLength({ max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided'
      });
    }

    const updateFields = [];
    const params = [];

    Object.entries(updates).forEach(([key, value]) => {
      updateFields.push(`${key} = ?`);
      params.push(value);
    });

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE regions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update region',
        message: result.error
      });
    }

    if (result.data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Region not found'
      });
    }

    res.json({
      success: true,
      message: 'Region updated successfully'
    });
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

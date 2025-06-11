const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Region, Municipality, CovidCase, Hospital, TestingCenter, Vaccination, DataSource } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const router = express.Router();

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

    let includeOptions = [
      {
        model: Municipality,
        as: 'municipalities',
        attributes: ['id', 'name']
      }
    ];

    if (include_stats === 'true') {
      includeOptions.push(
        {
          model: CovidCase,
          as: 'cases',
          attributes: ['total_cases', 'active_cases', 'deaths', 'recovered', 'hospitalized'],
          order: [['date', 'DESC']],
          limit: 1
        },
        {
          model: Hospital,
          as: 'hospitals',
          attributes: ['id', 'name']
        },
        {
          model: Vaccination,
          as: 'vaccinations',
          attributes: ['people_vaccinated', 'people_fully_vaccinated']
        }
      );
    }

    const regions = await Region.findAll({
      include: includeOptions,
      order: [['name', 'ASC']]
    });

    // Transform data to include calculated stats
    const transformedData = regions.map(region => {
      const regionData = region.toJSON();
      
      if (include_stats === 'true') {
        const latestCase = regionData.cases?.[0] || {};
        const totalVaccinations = regionData.vaccinations?.reduce((sum, v) => ({
          people_vaccinated: sum.people_vaccinated + (v.people_vaccinated || 0),
          people_fully_vaccinated: sum.people_fully_vaccinated + (v.people_fully_vaccinated || 0)
        }), { people_vaccinated: 0, people_fully_vaccinated: 0 }) || { people_vaccinated: 0, people_fully_vaccinated: 0 };

        regionData.total_cases = latestCase.total_cases || 0;
        regionData.active_cases = latestCase.active_cases || 0;
        regionData.total_deaths = latestCase.deaths || 0;
        regionData.total_recovered = latestCase.recovered || 0;
        regionData.hospitalized = latestCase.hospitalized || 0;
        regionData.people_vaccinated = totalVaccinations.people_vaccinated;
        regionData.people_fully_vaccinated = totalVaccinations.people_fully_vaccinated;
        regionData.hospitals = regionData.hospitals?.length || 0;
        regionData.cases_per_100k = regionData.population > 0 ? 
          Math.round((regionData.total_cases / regionData.population) * 100000 * 100) / 100 : 0;
        regionData.vaccination_rate = regionData.population > 0 ? 
          Math.round((regionData.people_vaccinated / regionData.population) * 100 * 100) / 100 : 0;

        // Clean up nested objects for cleaner response
        delete regionData.cases;
        delete regionData.vaccinations;
      }

      regionData.municipalities = regionData.municipalities?.length || 0;

      return regionData;
    });

    res.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      includes_stats: include_stats === 'true'
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch regions'
    });
  }
});

/**
 * @swagger
 * /api/v1/regions/municipalities:
 *   get:
 *     summary: Get all municipalities in Kosovo
 *     tags: [Regions]
 *     parameters:
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *     responses:
 *       200:
 *         description: List of municipalities retrieved successfully
 */
router.get('/municipalities', [
  query('region_id').optional().isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const { region_id } = req.query;

    const whereCondition = region_id ? { region_id: parseInt(region_id) } : {};

    const municipalities = await Municipality.findAll({
      where: whereCondition,
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['id', 'name']
        }
      ],
      order: [
        [{ model: Region, as: 'region' }, 'name', 'ASC'],
        ['name', 'ASC']
      ]
    });

    // Transform data to include region_name at top level
    const transformedData = municipalities.map(municipality => {
      const municipalityData = municipality.toJSON();
      municipalityData.region_name = municipalityData.region?.name || null;
      return municipalityData;
    });

    res.json({
      success: true,
      data: transformedData,
      total: transformedData.length
    });
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch municipalities'    });
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

    const region = await Region.findByPk(id, {
      include: [
        {
          model: CovidCase,
          as: 'cases',
          attributes: ['total_cases', 'active_cases', 'deaths', 'recovered', 'hospitalized', 'icu_patients', 'date']
        },
        {
          model: Vaccination,
          as: 'vaccinations',
          attributes: ['people_vaccinated', 'people_fully_vaccinated', 'total_doses', 'date']
        },
        {
          model: Hospital,
          as: 'hospitals',
          attributes: ['id', 'name', 'total_beds', 'occupied_beds']
        },
        {
          model: TestingCenter,
          as: 'testingCenters',
          attributes: ['id', 'name']
        },
        {
          model: Municipality,
          as: 'municipalities',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!region) {
      return res.status(404).json({
        success: false,
        error: 'Region not found'
      });
    }

    const regionData = region.toJSON();

    // Calculate aggregated statistics
    const totalCases = regionData.cases?.reduce((sum, c) => sum + (c.total_cases || 0), 0) || 0;
    const activeCases = regionData.cases?.reduce((sum, c) => sum + (c.active_cases || 0), 0) || 0;
    const totalDeaths = regionData.cases?.reduce((sum, c) => sum + (c.deaths || 0), 0) || 0;
    const totalRecovered = regionData.cases?.reduce((sum, c) => sum + (c.recovered || 0), 0) || 0;
    const hospitalized = regionData.cases?.reduce((sum, c) => sum + (c.hospitalized || 0), 0) || 0;
    const icuPatients = regionData.cases?.reduce((sum, c) => sum + (c.icu_patients || 0), 0) || 0;

    const peopleVaccinated = regionData.vaccinations?.reduce((sum, v) => sum + (v.people_vaccinated || 0), 0) || 0;
    const peopleFullyVaccinated = regionData.vaccinations?.reduce((sum, v) => sum + (v.people_fully_vaccinated || 0), 0) || 0;
    const totalVaccinationDoses = regionData.vaccinations?.reduce((sum, v) => sum + (v.total_doses || 0), 0) || 0;

    const totalHospitalBeds = regionData.hospitals?.reduce((sum, h) => sum + (h.total_beds || 0), 0) || 0;
    const occupiedHospitalBeds = regionData.hospitals?.reduce((sum, h) => sum + (h.occupied_beds || 0), 0) || 0;

    // Get latest dates
    const lastCaseUpdate = regionData.cases?.length > 0 ? 
      Math.max(...regionData.cases.map(c => new Date(c.date).getTime())) : null;
    const lastVaccinationUpdate = regionData.vaccinations?.length > 0 ? 
      Math.max(...regionData.vaccinations.map(v => new Date(v.date).getTime())) : null;

    // Add calculated fields
    regionData.total_cases = totalCases;
    regionData.active_cases = activeCases;
    regionData.total_deaths = totalDeaths;
    regionData.total_recovered = totalRecovered;
    regionData.hospitalized = hospitalized;
    regionData.icu_patients = icuPatients;
    regionData.people_vaccinated = peopleVaccinated;
    regionData.people_fully_vaccinated = peopleFullyVaccinated;
    regionData.total_vaccination_doses = totalVaccinationDoses;
    regionData.hospitals = regionData.hospitals?.length || 0;
    regionData.testing_centers = regionData.testingCenters?.length || 0;
    regionData.municipalities = regionData.municipalities?.length || 0;
    regionData.total_hospital_beds = totalHospitalBeds;
    regionData.occupied_hospital_beds = occupiedHospitalBeds;
    
    // Calculate rates and metrics
    regionData.cases_per_100k = regionData.population > 0 ? 
      Math.round((totalCases / regionData.population) * 100000 * 100) / 100 : 0;
    regionData.deaths_per_100k = regionData.population > 0 ? 
      Math.round((totalDeaths / regionData.population) * 100000 * 100) / 100 : 0;
    regionData.vaccination_rate = regionData.population > 0 ? 
      Math.round((peopleVaccinated / regionData.population) * 100 * 100) / 100 : 0;
    regionData.full_vaccination_rate = regionData.population > 0 ? 
      Math.round((peopleFullyVaccinated / regionData.population) * 100 * 100) / 100 : 0;
    
    regionData.last_case_update = lastCaseUpdate ? new Date(lastCaseUpdate).toISOString().split('T')[0] : null;
    regionData.last_vaccination_update = lastVaccinationUpdate ? new Date(lastVaccinationUpdate).toISOString().split('T')[0] : null;

    // Calculate additional metrics
    regionData.population_density = regionData.area_km2 > 0 ? 
      (regionData.population / regionData.area_km2).toFixed(2) : '0.00';
    regionData.case_fatality_rate = totalCases > 0 ? 
      ((totalDeaths / totalCases) * 100).toFixed(2) : '0.00';
    regionData.recovery_rate = totalCases > 0 ? 
      ((totalRecovered / totalCases) * 100).toFixed(2) : '0.00';
    regionData.hospital_bed_ratio = regionData.population > 0 ? 
      ((totalHospitalBeds / regionData.population) * 1000).toFixed(2) : '0.00';

    // Clean up nested objects for cleaner response
    delete regionData.cases;
    delete regionData.vaccinations;
    delete regionData.testingCenters;

    res.json({
      success: true,
      data: regionData
    });
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch region'    });
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

    const municipalities = await Municipality.findAll({
      where: { region_id: id },
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['name']
        },
        {
          model: CovidCase,
          as: 'cases',
          attributes: ['total_cases', 'active_cases', 'deaths', 'recovered', 'date']
        },
        {
          model: Hospital,
          as: 'hospitals',
          attributes: ['id', 'name']
        },
        {
          model: TestingCenter,
          as: 'testingCenters',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    const transformedData = municipalities.map(municipality => {
      const municipalityData = municipality.toJSON();
      
      // Calculate aggregated statistics
      const totalCases = municipalityData.cases?.reduce((sum, c) => sum + (c.total_cases || 0), 0) || 0;
      const activeCases = municipalityData.cases?.reduce((sum, c) => sum + (c.active_cases || 0), 0) || 0;
      const totalDeaths = municipalityData.cases?.reduce((sum, c) => sum + (c.deaths || 0), 0) || 0;
      const totalRecovered = municipalityData.cases?.reduce((sum, c) => sum + (c.recovered || 0), 0) || 0;
      
      // Get latest update date
      const lastUpdated = municipalityData.cases?.length > 0 ? 
        Math.max(...municipalityData.cases.map(c => new Date(c.date).getTime())) : null;

      // Add calculated fields
      municipalityData.region_name = municipalityData.region?.name || null;
      municipalityData.total_cases = totalCases;
      municipalityData.active_cases = activeCases;
      municipalityData.total_deaths = totalDeaths;
      municipalityData.total_recovered = totalRecovered;
      municipalityData.hospitals = municipalityData.hospitals?.length || 0;
      municipalityData.testing_centers = municipalityData.testingCenters?.length || 0;
      municipalityData.cases_per_100k = municipalityData.population > 0 ? 
        Math.round((totalCases / municipalityData.population) * 100000 * 100) / 100 : 0;
      municipalityData.last_updated = lastUpdated ? new Date(lastUpdated).toISOString().split('T')[0] : null;

      // Clean up nested objects
      delete municipalityData.cases;
      delete municipalityData.testingCenters;

      return municipalityData;
    });

    res.json({
      success: true,
      data: transformedData,
      total: transformedData.length
    });  } catch (error) {
    console.error('Error fetching region municipalities:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch municipalities'
    });  }
});

module.exports = router;

/*
// The following endpoints are temporarily commented out while converting from raw SQL to ORM
// They will be converted in the next phase

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
    });  }
});

module.exports = router;

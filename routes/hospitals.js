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
 *     Hospital:
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
 *         total_beds:
 *           type: integer
 *         covid_beds:
 *           type: integer
 *         icu_beds:
 *           type: integer
 *         ventilators:
 *           type: integer
 *         occupied_beds:
 *           type: integer
 *         occupied_covid_beds:
 *           type: integer
 *         occupied_icu_beds:
 *           type: integer
 *         occupied_ventilators:
 *           type: integer
 *         is_covid_hospital:
 *           type: boolean
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 */

/**
 * @swagger
 * /api/v1/hospitals:
 *   get:
 *     summary: Get hospitals data
 *     tags: [Hospitals]
 *     parameters:
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *       - in: query
 *         name: is_covid_hospital
 *         schema:
 *           type: boolean
 *         description: Filter COVID-designated hospitals
 *       - in: query
 *         name: has_capacity
 *         schema:
 *           type: boolean
 *         description: Filter hospitals with available capacity
 *     responses:
 *       200:
 *         description: Hospitals data retrieved successfully
 */
router.get('/', [
  query('region_id').optional().isInt({ min: 1 }),
  query('is_covid_hospital').optional().isBoolean(),
  query('has_capacity').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { region_id, is_covid_hospital, has_capacity } = req.query;

    let whereConditions = [];
    let params = [];

    if (region_id) {
      whereConditions.push('h.region_id = ?');
      params.push(region_id);
    }

    if (is_covid_hospital !== undefined) {
      whereConditions.push('h.is_covid_hospital = ?');
      params.push(is_covid_hospital === 'true');
    }

    if (has_capacity === 'true') {
      whereConditions.push('h.total_beds > h.occupied_beds');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        h.*,
        r.name as region_name,
        m.name as municipality_name,
        (h.total_beds - h.occupied_beds) as available_beds,
        (h.covid_beds - h.occupied_covid_beds) as available_covid_beds,
        (h.icu_beds - h.occupied_icu_beds) as available_icu_beds,
        (h.ventilators - h.occupied_ventilators) as available_ventilators,
        ROUND((h.occupied_beds / h.total_beds) * 100, 2) as occupancy_rate,
        ROUND((h.occupied_covid_beds / NULLIF(h.covid_beds, 0)) * 100, 2) as covid_occupancy_rate
      FROM hospitals h
      LEFT JOIN regions r ON h.region_id = r.id
      LEFT JOIN municipalities m ON h.municipality_id = m.id
      ${whereClause}
      ORDER BY h.name
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch hospitals data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      total: result.data.length
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/hospitals/capacity:
 *   get:
 *     summary: Get hospital capacity overview
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: Hospital capacity overview
 */
router.get('/capacity', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_hospitals,
        SUM(total_beds) as total_beds,
        SUM(covid_beds) as total_covid_beds,
        SUM(icu_beds) as total_icu_beds,
        SUM(ventilators) as total_ventilators,
        SUM(occupied_beds) as total_occupied_beds,
        SUM(occupied_covid_beds) as total_occupied_covid_beds,
        SUM(occupied_icu_beds) as total_occupied_icu_beds,
        SUM(occupied_ventilators) as total_occupied_ventilators,
        SUM(total_beds - occupied_beds) as total_available_beds,
        SUM(covid_beds - occupied_covid_beds) as total_available_covid_beds,
        SUM(icu_beds - occupied_icu_beds) as total_available_icu_beds,
        SUM(ventilators - occupied_ventilators) as total_available_ventilators,
        ROUND(AVG((occupied_beds / NULLIF(total_beds, 0)) * 100), 2) as avg_occupancy_rate,
        ROUND(AVG((occupied_covid_beds / NULLIF(covid_beds, 0)) * 100), 2) as avg_covid_occupancy_rate,
        COUNT(CASE WHEN is_covid_hospital = true THEN 1 END) as covid_hospitals
      FROM hospitals
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch capacity data',
        message: result.error
      });
    }

    const data = result.data[0];
    
    // Calculate utilization rates
    data.bed_utilization_rate = data.total_beds > 0 ? 
      ((data.total_occupied_beds / data.total_beds) * 100).toFixed(2) : '0.00';
    data.covid_bed_utilization_rate = data.total_covid_beds > 0 ? 
      ((data.total_occupied_covid_beds / data.total_covid_beds) * 100).toFixed(2) : '0.00';
    data.icu_utilization_rate = data.total_icu_beds > 0 ? 
      ((data.total_occupied_icu_beds / data.total_icu_beds) * 100).toFixed(2) : '0.00';
    data.ventilator_utilization_rate = data.total_ventilators > 0 ? 
      ((data.total_occupied_ventilators / data.total_ventilators) * 100).toFixed(2) : '0.00';

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching capacity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/hospitals/{id}:
 *   get:
 *     summary: Get hospital by ID
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: Hospital data retrieved successfully
 *       404:
 *         description: Hospital not found
 */
router.get('/:id', [
  query('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        h.*,
        r.name as region_name,
        m.name as municipality_name,
        (h.total_beds - h.occupied_beds) as available_beds,
        (h.covid_beds - h.occupied_covid_beds) as available_covid_beds,
        (h.icu_beds - h.occupied_icu_beds) as available_icu_beds,
        (h.ventilators - h.occupied_ventilators) as available_ventilators,
        ROUND((h.occupied_beds / NULLIF(h.total_beds, 0)) * 100, 2) as occupancy_rate,
        ROUND((h.occupied_covid_beds / NULLIF(h.covid_beds, 0)) * 100, 2) as covid_occupancy_rate
      FROM hospitals h
      LEFT JOIN regions r ON h.region_id = r.id
      LEFT JOIN municipalities m ON h.municipality_id = m.id
      WHERE h.id = ?
    `;

    const result = await executeQuery(query, [id]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch hospital data',
        message: result.error
      });
    }

    if (result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      data: result.data[0]
    });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/hospitals:
 *   post:
 *     summary: Add new hospital
 *     tags: [Hospitals]
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
 *               total_beds:
 *                 type: integer
 *               covid_beds:
 *                 type: integer
 *               icu_beds:
 *                 type: integer
 *               ventilators:
 *                 type: integer
 *               is_covid_hospital:
 *                 type: boolean
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Hospital added successfully
 */
router.post('/', [
  body('name').notEmpty().trim().isLength({ min: 2, max: 200 }),
  body('region_id').optional().isInt({ min: 1 }),
  body('municipality_id').optional().isInt({ min: 1 }),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail(),
  body('total_beds').optional().isInt({ min: 0 }),
  body('covid_beds').optional().isInt({ min: 0 }),
  body('icu_beds').optional().isInt({ min: 0 }),
  body('ventilators').optional().isInt({ min: 0 }),
  body('is_covid_hospital').optional().isBoolean(),
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
      total_beds = 0,
      covid_beds = 0,
      icu_beds = 0,
      ventilators = 0,
      is_covid_hospital = false,
      latitude,
      longitude
    } = req.body;

    const query = `
      INSERT INTO hospitals 
      (name, region_id, municipality_id, address, phone, email, 
       total_beds, covid_beds, icu_beds, ventilators, is_covid_hospital, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      name, region_id, municipality_id, address, phone, email,
      total_beds, covid_beds, icu_beds, ventilators, is_covid_hospital, latitude, longitude
    ];

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add hospital',
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Hospital added successfully',
      data: {
        id: result.data.insertId,
        ...req.body
      }
    });
  } catch (error) {
    console.error('Error adding hospital:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/hospitals/by-region:
 *   get:
 *     summary: Get hospitals grouped by region
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: Hospitals data grouped by region
 */
router.get('/by-region', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id as region_id,
        r.name as region_name,
        COUNT(h.id) as hospital_count,
        SUM(h.total_beds) as total_beds,
        SUM(h.covid_beds) as total_covid_beds,
        SUM(h.icu_beds) as total_icu_beds,
        SUM(h.ventilators) as total_ventilators,
        SUM(h.occupied_beds) as total_occupied_beds,
        SUM(h.occupied_covid_beds) as total_occupied_covid_beds,
        SUM(h.occupied_icu_beds) as total_occupied_icu_beds,
        SUM(h.occupied_ventilators) as total_occupied_ventilators,
        ROUND(AVG((h.occupied_beds / NULLIF(h.total_beds, 0)) * 100), 2) as avg_occupancy_rate,
        COUNT(CASE WHEN h.is_covid_hospital = true THEN 1 END) as covid_hospitals
      FROM regions r
      LEFT JOIN hospitals h ON r.id = h.region_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch regional hospital data',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching regional hospital data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/hospitals/{id}/capacity:
 *   put:
 *     summary: Update hospital capacity data
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               occupied_beds:
 *                 type: integer
 *               occupied_covid_beds:
 *                 type: integer
 *               occupied_icu_beds:
 *                 type: integer
 *               occupied_ventilators:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Hospital capacity updated successfully
 */
router.put('/:id/capacity', [
  body('occupied_beds').optional().isInt({ min: 0 }),
  body('occupied_covid_beds').optional().isInt({ min: 0 }),
  body('occupied_icu_beds').optional().isInt({ min: 0 }),
  body('occupied_ventilators').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { occupied_beds, occupied_covid_beds, occupied_icu_beds, occupied_ventilators } = req.body;

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (occupied_beds !== undefined) {
      updateFields.push('occupied_beds = ?');
      params.push(occupied_beds);
    }
    if (occupied_covid_beds !== undefined) {
      updateFields.push('occupied_covid_beds = ?');
      params.push(occupied_covid_beds);
    }
    if (occupied_icu_beds !== undefined) {
      updateFields.push('occupied_icu_beds = ?');
      params.push(occupied_icu_beds);
    }
    if (occupied_ventilators !== undefined) {
      updateFields.push('occupied_ventilators = ?');
      params.push(occupied_ventilators);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No capacity data provided for update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE hospitals 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update hospital capacity',
        message: result.error
      });
    }

    if (result.data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      message: 'Hospital capacity updated successfully'
    });
  } catch (error) {
    console.error('Error updating hospital capacity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const { query, validationResult } = require('express-validator');
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
 * /api/v1/statistics/overview:
 *   get:
 *     summary: Get comprehensive COVID-19 statistics overview
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Comprehensive statistics overview
 */
router.get('/overview', async (req, res) => {
  try {
    // Get latest case statistics
    const casesQuery = `
      SELECT 
        SUM(total_cases) as total_cases,
        SUM(new_cases) as new_cases_today,
        SUM(active_cases) as active_cases,
        SUM(deaths) as total_deaths,
        SUM(new_deaths) as new_deaths_today,
        SUM(recovered) as total_recovered,
        SUM(new_recovered) as new_recovered_today,
        SUM(hospitalized) as total_hospitalized,
        SUM(icu_patients) as total_icu_patients,
        SUM(ventilator_patients) as total_ventilator_patients,
        MAX(date) as last_updated
      FROM covid_cases 
      WHERE date = (SELECT MAX(date) FROM covid_cases)
    `;

    // Get vaccination statistics
    const vaccinationQuery = `
      SELECT 
        SUM(people_vaccinated) as people_vaccinated,
        SUM(people_fully_vaccinated) as people_fully_vaccinated,
        SUM(total_doses) as total_doses_administered,
        SUM(first_dose) as total_first_doses,
        SUM(second_dose) as total_second_doses,
        SUM(booster_dose) as total_booster_doses
      FROM vaccinations
    `;

    // Get hospital capacity
    const hospitalQuery = `
      SELECT 
        COUNT(*) as total_hospitals,
        SUM(total_beds) as total_beds,
        SUM(occupied_beds) as occupied_beds,
        SUM(covid_beds) as covid_beds,
        SUM(occupied_covid_beds) as occupied_covid_beds,
        SUM(icu_beds) as icu_beds,
        SUM(occupied_icu_beds) as occupied_icu_beds,
        SUM(ventilators) as ventilators,
        SUM(occupied_ventilators) as occupied_ventilators
      FROM hospitals
    `;

    // Get testing statistics
    const testingQuery = `
      SELECT 
        SUM(total_tests) as total_tests,
        SUM(positive_tests) as positive_tests,
        SUM(negative_tests) as negative_tests,
        AVG(positivity_rate) as avg_positivity_rate
      FROM testing_data
      WHERE date = (SELECT MAX(date) FROM testing_data)
    `;

    // Get population data
    const populationQuery = `
      SELECT SUM(population) as total_population
      FROM regions
    `;

    const [casesResult, vaccinationResult, hospitalResult, testingResult, populationResult] = await Promise.all([
      executeQuery(casesQuery),
      executeQuery(vaccinationQuery),
      executeQuery(hospitalQuery),
      executeQuery(testingQuery),
      executeQuery(populationQuery)
    ]);

    if (!casesResult.success || !vaccinationResult.success || !hospitalResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch overview statistics'
      });
    }

    const cases = casesResult.data[0] || {};
    const vaccination = vaccinationResult.data[0] || {};
    const hospital = hospitalResult.data[0] || {};
    const testing = testingResult.data[0] || {};
    const population = populationResult.data[0] || {};

    // Calculate rates and percentages
    const totalPopulation = population.total_population || 1;
    const totalCases = cases.total_cases || 0;

    const overview = {
      cases: {
        total: totalCases,
        new_today: cases.new_cases_today || 0,
        active: cases.active_cases || 0,
        deaths: cases.total_deaths || 0,
        new_deaths_today: cases.new_deaths_today || 0,
        recovered: cases.total_recovered || 0,
        new_recovered_today: cases.new_recovered_today || 0,
        hospitalized: cases.total_hospitalized || 0,
        icu_patients: cases.total_icu_patients || 0,
        ventilator_patients: cases.total_ventilator_patients || 0,
        case_fatality_rate: totalCases > 0 ? ((cases.total_deaths / totalCases) * 100).toFixed(2) : '0.00',
        recovery_rate: totalCases > 0 ? ((cases.total_recovered / totalCases) * 100).toFixed(2) : '0.00',
        incidence_rate: ((totalCases / totalPopulation) * 100000).toFixed(2),
        last_updated: cases.last_updated
      },
      vaccination: {
        people_vaccinated: vaccination.people_vaccinated || 0,
        people_fully_vaccinated: vaccination.people_fully_vaccinated || 0,
        total_doses_administered: vaccination.total_doses_administered || 0,
        first_doses: vaccination.total_first_doses || 0,
        second_doses: vaccination.total_second_doses || 0,
        booster_doses: vaccination.total_booster_doses || 0,
        vaccination_rate: ((vaccination.people_vaccinated / totalPopulation) * 100).toFixed(2),
        full_vaccination_rate: ((vaccination.people_fully_vaccinated / totalPopulation) * 100).toFixed(2)
      },
      hospital_capacity: {
        total_hospitals: hospital.total_hospitals || 0,
        total_beds: hospital.total_beds || 0,
        occupied_beds: hospital.occupied_beds || 0,
        available_beds: (hospital.total_beds || 0) - (hospital.occupied_beds || 0),
        occupancy_rate: hospital.total_beds > 0 ? ((hospital.occupied_beds / hospital.total_beds) * 100).toFixed(2) : '0.00',
        covid_beds: hospital.covid_beds || 0,
        occupied_covid_beds: hospital.occupied_covid_beds || 0,
        covid_bed_occupancy: hospital.covid_beds > 0 ? ((hospital.occupied_covid_beds / hospital.covid_beds) * 100).toFixed(2) : '0.00',
        icu_beds: hospital.icu_beds || 0,
        occupied_icu_beds: hospital.occupied_icu_beds || 0,
        icu_occupancy: hospital.icu_beds > 0 ? ((hospital.occupied_icu_beds / hospital.icu_beds) * 100).toFixed(2) : '0.00',
        ventilators: hospital.ventilators || 0,
        occupied_ventilators: hospital.occupied_ventilators || 0,
        ventilator_usage: hospital.ventilators > 0 ? ((hospital.occupied_ventilators / hospital.ventilators) * 100).toFixed(2) : '0.00'
      },
      testing: {
        total_tests: testing.total_tests || 0,
        positive_tests: testing.positive_tests || 0,
        negative_tests: testing.negative_tests || 0,
        positivity_rate: testing.avg_positivity_rate || 0,
        tests_per_capita: ((testing.total_tests / totalPopulation) * 1000).toFixed(2)
      },
      population: {
        total: totalPopulation
      }
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching overview statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/statistics/trends:
 *   get:
 *     summary: Get COVID-19 trends and analytics
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7, 14, 30, 90]
 *           default: 30
 *         description: Number of days for trend analysis
 *     responses:
 *       200:
 *         description: COVID-19 trends data
 */
router.get('/trends', [
  query('period').optional().isIn(['7', '14', '30', '90'])
], handleValidationErrors, async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;

    const query = `
      SELECT 
        DATE(date) as date,
        SUM(new_cases) as daily_cases,
        SUM(new_deaths) as daily_deaths,
        SUM(new_recovered) as daily_recovered,
        SUM(active_cases) as active_cases,
        SUM(hospitalized) as hospitalized,
        SUM(icu_patients) as icu_patients
      FROM covid_cases
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(date)
      ORDER BY date
    `;

    const result = await executeQuery(query, [period]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch trends data',
        message: result.error
      });
    }

    const data = result.data;

    // Calculate moving averages and trends
    const trendsData = data.map((item, index) => {
      const trends = { ...item };

      // Calculate 7-day moving average if we have enough data
      if (index >= 6) {
        const window = data.slice(index - 6, index + 1);
        trends.ma_7_cases = Math.round(window.reduce((sum, day) => sum + (day.daily_cases || 0), 0) / 7);
        trends.ma_7_deaths = Math.round(window.reduce((sum, day) => sum + (day.daily_deaths || 0), 0) / 7);
        trends.ma_7_recovered = Math.round(window.reduce((sum, day) => sum + (day.daily_recovered || 0), 0) / 7);
      }

      // Calculate percentage change from previous day
      if (index > 0) {
        const prev = data[index - 1];
        trends.cases_change_pct = prev.daily_cases > 0 ? 
          (((item.daily_cases - prev.daily_cases) / prev.daily_cases) * 100).toFixed(2) : '0.00';
        trends.deaths_change_pct = prev.daily_deaths > 0 ? 
          (((item.daily_deaths - prev.daily_deaths) / prev.daily_deaths) * 100).toFixed(2) : '0.00';
      }

      return trends;
    });

    // Calculate overall trend analysis
    const analysis = {
      total_days: data.length,
      total_cases_period: data.reduce((sum, day) => sum + (day.daily_cases || 0), 0),
      total_deaths_period: data.reduce((sum, day) => sum + (day.daily_deaths || 0), 0),
      total_recovered_period: data.reduce((sum, day) => sum + (day.daily_recovered || 0), 0),
      avg_daily_cases: data.length > 0 ? Math.round(data.reduce((sum, day) => sum + (day.daily_cases || 0), 0) / data.length) : 0,
      avg_daily_deaths: data.length > 0 ? Math.round(data.reduce((sum, day) => sum + (day.daily_deaths || 0), 0) / data.length) : 0,
      peak_daily_cases: Math.max(...data.map(day => day.daily_cases || 0)),
      peak_daily_deaths: Math.max(...data.map(day => day.daily_deaths || 0))
    };

    // Calculate trend direction (last 7 days vs previous 7 days)
    if (data.length >= 14) {
      const lastWeek = data.slice(-7);
      const prevWeek = data.slice(-14, -7);
      
      const lastWeekAvg = lastWeek.reduce((sum, day) => sum + (day.daily_cases || 0), 0) / 7;
      const prevWeekAvg = prevWeek.reduce((sum, day) => sum + (day.daily_cases || 0), 0) / 7;
      
      analysis.weekly_trend = prevWeekAvg > 0 ? 
        (((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100).toFixed(2) : '0.00';
      analysis.trend_direction = parseFloat(analysis.weekly_trend) > 5 ? 'increasing' : 
                                parseFloat(analysis.weekly_trend) < -5 ? 'decreasing' : 'stable';
    }

    res.json({
      success: true,
      data: trendsData,
      analysis,
      period: `${period} days`
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
 * /api/v1/statistics/regional:
 *   get:
 *     summary: Get regional statistics comparison
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Regional statistics comparison
 */
router.get('/regional', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.name as region_name,
        r.population,
        r.area_km2,
        COALESCE(SUM(c.total_cases), 0) as total_cases,
        COALESCE(SUM(c.active_cases), 0) as active_cases,
        COALESCE(SUM(c.deaths), 0) as total_deaths,
        COALESCE(SUM(c.recovered), 0) as total_recovered,
        COALESCE(SUM(v.people_vaccinated), 0) as people_vaccinated,
        COALESCE(SUM(v.people_fully_vaccinated), 0) as people_fully_vaccinated,
        COUNT(DISTINCT h.id) as hospitals,
        COALESCE(SUM(h.total_beds), 0) as total_beds,
        COALESCE(SUM(h.occupied_beds), 0) as occupied_beds,
        ROUND((COALESCE(SUM(c.total_cases), 0) / r.population) * 100000, 2) as cases_per_100k,
        ROUND((COALESCE(SUM(c.deaths), 0) / r.population) * 100000, 2) as deaths_per_100k,
        ROUND((COALESCE(SUM(v.people_vaccinated), 0) / r.population) * 100, 2) as vaccination_rate,
        ROUND((COALESCE(SUM(v.people_fully_vaccinated), 0) / r.population) * 100, 2) as full_vaccination_rate,
        ROUND((COALESCE(SUM(c.total_cases), 0) / r.area_km2), 2) as case_density,
        MAX(c.date) as last_case_update,
        MAX(v.date) as last_vaccination_update
      FROM regions r
      LEFT JOIN covid_cases c ON r.id = c.region_id AND c.date = (SELECT MAX(date) FROM covid_cases WHERE region_id = r.id)
      LEFT JOIN vaccinations v ON r.id = v.region_id
      LEFT JOIN hospitals h ON r.id = h.region_id
      GROUP BY r.id, r.name, r.population, r.area_km2
      ORDER BY cases_per_100k DESC
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch regional statistics',
        message: result.error
      });
    }

    const data = result.data;

    // Calculate additional metrics
    const enhancedData = data.map(region => ({
      ...region,
      case_fatality_rate: region.total_cases > 0 ? 
        ((region.total_deaths / region.total_cases) * 100).toFixed(2) : '0.00',
      recovery_rate: region.total_cases > 0 ? 
        ((region.total_recovered / region.total_cases) * 100).toFixed(2) : '0.00',
      hospital_bed_ratio: region.population > 0 ? 
        ((region.total_beds / region.population) * 1000).toFixed(2) : '0.00',
      bed_occupancy_rate: region.total_beds > 0 ? 
        ((region.occupied_beds / region.total_beds) * 100).toFixed(2) : '0.00'
    }));

    // Calculate summary statistics
    const summary = {
      total_regions: data.length,
      highest_cases_per_100k: Math.max(...data.map(r => r.cases_per_100k)),
      lowest_cases_per_100k: Math.min(...data.map(r => r.cases_per_100k)),
      highest_vaccination_rate: Math.max(...data.map(r => r.vaccination_rate)),
      lowest_vaccination_rate: Math.min(...data.map(r => r.vaccination_rate)),
      avg_case_fatality_rate: (data.reduce((sum, r) => sum + parseFloat(r.case_fatality_rate || 0), 0) / data.length).toFixed(2)
    };

    res.json({
      success: true,
      data: enhancedData,
      summary
    });
  } catch (error) {
    console.error('Error fetching regional statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/statistics/demographics:
 *   get:
 *     summary: Get demographic breakdown of COVID-19 data
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Demographic breakdown statistics
 */
router.get('/demographics', async (req, res) => {
  try {
    const query = `
      SELECT 
        age_group,
        SUM(cases) as total_cases,
        SUM(deaths) as total_deaths,
        SUM(vaccinated) as total_vaccinated,
        ROUND((SUM(deaths) / NULLIF(SUM(cases), 0)) * 100, 2) as case_fatality_rate,
        COUNT(DISTINCT region_id) as regions_affected
      FROM age_groups
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN '0-9' THEN 1
          WHEN '10-19' THEN 2
          WHEN '20-29' THEN 3
          WHEN '30-39' THEN 4
          WHEN '40-49' THEN 5
          WHEN '50-59' THEN 6
          WHEN '60-69' THEN 7
          WHEN '70-79' THEN 8
          WHEN '80+' THEN 9
          ELSE 10
        END
    `;

    const result = await executeQuery(query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch demographic statistics',
        message: result.error
      });
    }

    const data = result.data;

    // Calculate percentages
    const totalCases = data.reduce((sum, group) => sum + (group.total_cases || 0), 0);
    const totalDeaths = data.reduce((sum, group) => sum + (group.total_deaths || 0), 0);
    const totalVaccinated = data.reduce((sum, group) => sum + (group.total_vaccinated || 0), 0);

    const enhancedData = data.map(group => ({
      ...group,
      case_percentage: totalCases > 0 ? ((group.total_cases / totalCases) * 100).toFixed(2) : '0.00',
      death_percentage: totalDeaths > 0 ? ((group.total_deaths / totalDeaths) * 100).toFixed(2) : '0.00',
      vaccination_percentage: totalVaccinated > 0 ? ((group.total_vaccinated / totalVaccinated) * 100).toFixed(2) : '0.00'
    }));

    res.json({
      success: true,
      data: enhancedData,
      summary: {
        total_cases: totalCases,
        total_deaths: totalDeaths,
        total_vaccinated: totalVaccinated,
        overall_case_fatality_rate: totalCases > 0 ? ((totalDeaths / totalCases) * 100).toFixed(2) : '0.00'
      }
    });
  } catch (error) {
    console.error('Error fetching demographic statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/statistics/comparison:
 *   get:
 *     summary: Get comparative statistics between time periods
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: compare_days
 *         schema:
 *           type: integer
 *           minimum: 7
 *           maximum: 90
 *           default: 7
 *         description: Number of days to compare with previous period
 *     responses:
 *       200:
 *         description: Comparative statistics
 */
router.get('/comparison', [
  query('compare_days').optional().isInt({ min: 7, max: 90 }).toInt()
], handleValidationErrors, async (req, res) => {
  try {
    const days = req.query.compare_days || 7;

    const query = `
      SELECT 
        'current' as period,
        SUM(new_cases) as total_cases,
        SUM(new_deaths) as total_deaths,
        SUM(new_recovered) as total_recovered,
        AVG(active_cases) as avg_active_cases,
        AVG(hospitalized) as avg_hospitalized,
        MAX(date) as end_date,
        MIN(date) as start_date
      FROM covid_cases
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      
      UNION ALL
      
      SELECT 
        'previous' as period,
        SUM(new_cases) as total_cases,
        SUM(new_deaths) as total_deaths,
        SUM(new_recovered) as total_recovered,
        AVG(active_cases) as avg_active_cases,
        AVG(hospitalized) as avg_hospitalized,
        MAX(date) as end_date,
        MIN(date) as start_date
      FROM covid_cases
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;

    const result = await executeQuery(query, [days, days * 2, days]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch comparison statistics',
        message: result.error
      });
    }

    const data = result.data;
    const current = data.find(p => p.period === 'current') || {};
    const previous = data.find(p => p.period === 'previous') || {};

    // Calculate percentage changes
    const comparison = {
      cases: {
        current: current.total_cases || 0,
        previous: previous.total_cases || 0,
        change: previous.total_cases > 0 ? 
          (((current.total_cases - previous.total_cases) / previous.total_cases) * 100).toFixed(2) : '0.00',
        trend: current.total_cases > previous.total_cases ? 'increasing' : 
               current.total_cases < previous.total_cases ? 'decreasing' : 'stable'
      },
      deaths: {
        current: current.total_deaths || 0,
        previous: previous.total_deaths || 0,
        change: previous.total_deaths > 0 ? 
          (((current.total_deaths - previous.total_deaths) / previous.total_deaths) * 100).toFixed(2) : '0.00',
        trend: current.total_deaths > previous.total_deaths ? 'increasing' : 
               current.total_deaths < previous.total_deaths ? 'decreasing' : 'stable'
      },
      recovered: {
        current: current.total_recovered || 0,
        previous: previous.total_recovered || 0,
        change: previous.total_recovered > 0 ? 
          (((current.total_recovered - previous.total_recovered) / previous.total_recovered) * 100).toFixed(2) : '0.00',
        trend: current.total_recovered > previous.total_recovered ? 'increasing' : 
               current.total_recovered < previous.total_recovered ? 'decreasing' : 'stable'
      },
      hospitalized: {
        current: Math.round(current.avg_hospitalized || 0),
        previous: Math.round(previous.avg_hospitalized || 0),
        change: previous.avg_hospitalized > 0 ? 
          (((current.avg_hospitalized - previous.avg_hospitalized) / previous.avg_hospitalized) * 100).toFixed(2) : '0.00',
        trend: current.avg_hospitalized > previous.avg_hospitalized ? 'increasing' : 
               current.avg_hospitalized < previous.avg_hospitalized ? 'decreasing' : 'stable'
      }
    };

    res.json({
      success: true,
      data: comparison,
      period: `${days} days`,
      current_period: {
        start: current.start_date,
        end: current.end_date
      },
      previous_period: {
        start: previous.start_date,
        end: previous.end_date
      }
    });
  } catch (error) {
    console.error('Error fetching comparison statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

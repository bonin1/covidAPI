const { executeQuery } = require('../database');

class CovidCase {
  constructor(data = {}) {
    this.id = data.id;
    this.date = data.date;
    this.region_id = data.region_id;
    this.municipality_id = data.municipality_id;
    this.total_cases = data.total_cases || 0;
    this.new_cases = data.new_cases || 0;
    this.active_cases = data.active_cases || 0;
    this.deaths = data.deaths || 0;
    this.new_deaths = data.new_deaths || 0;
    this.recovered = data.recovered || 0;
    this.new_recovered = data.new_recovered || 0;
    this.hospitalized = data.hospitalized || 0;
    this.icu_patients = data.icu_patients || 0;
    this.ventilator_patients = data.ventilator_patients || 0;
  }

  static async findById(id) {
    const query = `
      SELECT c.*, r.name as region_name, m.name as municipality_name
      FROM covid_cases c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN municipalities m ON c.municipality_id = m.id
      WHERE c.id = ?
    `;
    
    const result = await executeQuery(query, [id]);
    if (result.success && result.data.length > 0) {
      return new CovidCase(result.data[0]);
    }
    return null;
  }

  static async findByDateAndRegion(date, regionId = null) {
    let query = `
      SELECT c.*, r.name as region_name, m.name as municipality_name
      FROM covid_cases c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN municipalities m ON c.municipality_id = m.id
      WHERE DATE(c.date) = ?
    `;
    
    const params = [date];
    
    if (regionId) {
      query += ' AND c.region_id = ?';
      params.push(regionId);
    }
    
    query += ' ORDER BY r.name';
    
    const result = await executeQuery(query, params);
    if (result.success) {
      return result.data.map(row => new CovidCase(row));
    }
    return [];
  }

  static async getLatest(regionId = null) {
    let query = `
      SELECT c.*, r.name as region_name, m.name as municipality_name
      FROM covid_cases c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN municipalities m ON c.municipality_id = m.id
    `;
    
    const params = [];
    
    if (regionId) {
      query += ' WHERE c.region_id = ?';
      params.push(regionId);
    }
    
    query += ' ORDER BY c.date DESC LIMIT 1';
    
    const result = await executeQuery(query, params);
    if (result.success && result.data.length > 0) {
      return new CovidCase(result.data[0]);
    }
    return null;
  }

  static async getTrends(days = 30, regionId = null) {
    let query = `
      SELECT 
        DATE(date) as date,
        SUM(new_cases) as daily_cases,
        SUM(new_deaths) as daily_deaths,
        SUM(new_recovered) as daily_recovered,
        SUM(active_cases) as active_cases
      FROM covid_cases
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    
    const params = [days];
    
    if (regionId) {
      query += ' AND region_id = ?';
      params.push(regionId);
    }
    
    query += ' GROUP BY DATE(date) ORDER BY date';
    
    const result = await executeQuery(query, params);
    return result.success ? result.data : [];
  }

  static async getSummary(period = 'all') {
    let dateFilter = '';
    const params = [];

    switch (period) {
      case 'daily':
        dateFilter = 'WHERE DATE(date) = CURDATE()';
        break;
      case 'weekly':
        dateFilter = 'WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'monthly':
        dateFilter = 'WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        break;
    }

    const query = `
      SELECT 
        SUM(total_cases) as total_cases,
        SUM(new_cases) as total_new_cases,
        SUM(active_cases) as total_active_cases,
        SUM(deaths) as total_deaths,
        SUM(new_deaths) as total_new_deaths,
        SUM(recovered) as total_recovered,
        SUM(new_recovered) as total_new_recovered,
        SUM(hospitalized) as total_hospitalized,
        SUM(icu_patients) as total_icu_patients,
        AVG(new_cases) as avg_daily_cases,
        MAX(new_cases) as max_daily_cases,
        COUNT(DISTINCT region_id) as affected_regions
      FROM covid_cases
      ${dateFilter}
    `;

    const result = await executeQuery(query, params);
    return result.success ? result.data[0] : null;
  }

  async save() {
    if (this.id) {
      return this.update();
    } else {
      return this.create();
    }
  }

  async create() {
    const query = `
      INSERT INTO covid_cases 
      (date, region_id, municipality_id, total_cases, new_cases, active_cases, 
       deaths, new_deaths, recovered, new_recovered, hospitalized, icu_patients, ventilator_patients)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      this.date, this.region_id, this.municipality_id, this.total_cases, this.new_cases,
      this.active_cases, this.deaths, this.new_deaths, this.recovered, this.new_recovered,
      this.hospitalized, this.icu_patients, this.ventilator_patients
    ];

    const result = await executeQuery(query, params);
    if (result.success) {
      this.id = result.data.insertId;
      return true;
    }
    return false;
  }

  async update() {
    const query = `
      UPDATE covid_cases 
      SET date = ?, region_id = ?, municipality_id = ?, total_cases = ?, new_cases = ?,
          active_cases = ?, deaths = ?, new_deaths = ?, recovered = ?, new_recovered = ?,
          hospitalized = ?, icu_patients = ?, ventilator_patients = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      this.date, this.region_id, this.municipality_id, this.total_cases, this.new_cases,
      this.active_cases, this.deaths, this.new_deaths, this.recovered, this.new_recovered,
      this.hospitalized, this.icu_patients, this.ventilator_patients, this.id
    ];

    const result = await executeQuery(query, params);
    return result.success && result.data.affectedRows > 0;
  }

  async delete() {
    if (!this.id) return false;

    const query = 'DELETE FROM covid_cases WHERE id = ?';
    const result = await executeQuery(query, [this.id]);
    return result.success && result.data.affectedRows > 0;
  }

  // Calculate derived metrics
  getCaseFatalityRate() {
    return this.total_cases > 0 ? ((this.deaths / this.total_cases) * 100).toFixed(2) : '0.00';
  }

  getRecoveryRate() {
    return this.total_cases > 0 ? ((this.recovered / this.total_cases) * 100).toFixed(2) : '0.00';
  }

  getActiveCaseRate() {
    return this.total_cases > 0 ? ((this.active_cases / this.total_cases) * 100).toFixed(2) : '0.00';
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.date) {
      errors.push('Date is required');
    }

    if (this.total_cases < 0) {
      errors.push('Total cases cannot be negative');
    }

    if (this.deaths < 0) {
      errors.push('Deaths cannot be negative');
    }

    if (this.recovered < 0) {
      errors.push('Recovered cases cannot be negative');
    }

    if (this.deaths > this.total_cases) {
      errors.push('Deaths cannot exceed total cases');
    }

    if (this.recovered > this.total_cases) {
      errors.push('Recovered cases cannot exceed total cases');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      date: this.date,
      region_id: this.region_id,
      municipality_id: this.municipality_id,
      total_cases: this.total_cases,
      new_cases: this.new_cases,
      active_cases: this.active_cases,
      deaths: this.deaths,
      new_deaths: this.new_deaths,
      recovered: this.recovered,
      new_recovered: this.new_recovered,
      hospitalized: this.hospitalized,
      icu_patients: this.icu_patients,
      ventilator_patients: this.ventilator_patients,
      case_fatality_rate: this.getCaseFatalityRate(),
      recovery_rate: this.getRecoveryRate(),
      active_case_rate: this.getActiveCaseRate()
    };
  }
}

module.exports = CovidCase;

// Types for the COVID-19 API responses
export interface CovidCase {
  id: number;
  date: string;
  region_id?: number;
  municipality_id?: number;
  total_cases: number;
  new_cases: number;
  active_cases: number;
  deaths: number;
  new_deaths: number;
  recovered: number;
  new_recovered: number;
  hospitalized: number;
  icu_patients: number;
  ventilator_patients: number;
  region_name?: string;
  municipality_name?: string;
}

export interface Hospital {
  id: number;
  name: string;
  region_id?: number;
  municipality_id?: number;
  address?: string;
  phone?: string;
  email?: string;
  total_beds: number;
  covid_beds: number;
  icu_beds: number;
  ventilators: number;
  occupied_beds: number;
  occupied_covid_beds: number;
  occupied_icu_beds: number;
  occupied_ventilators: number;
  is_covid_hospital: boolean;
  latitude?: number;
  longitude?: number;
  region_name?: string;
  municipality_name?: string;
  available_beds: number;
  available_covid_beds: number;
  available_icu_beds: number;
  available_ventilators: number;
  occupancy_rate: number;
  covid_occupancy_rate: number;
}

export interface Vaccination {
  id: number;
  date: string;
  region_id?: number;
  municipality_id?: number;
  vaccine_type?: string;
  first_dose: number;
  second_dose: number;
  booster_dose: number;
  total_doses: number;
  people_vaccinated: number;
  people_fully_vaccinated: number;
  region_name?: string;
  municipality_name?: string;
  vaccination_rate?: number;
  full_vaccination_rate?: number;
}

export interface Region {
  id: number;
  name: string;
  code: string;
  population: number;
  area_km2: number;
  capital?: string;
  total_cases?: number;
  active_cases?: number;
  deaths?: number;
  recovered?: number;
  people_vaccinated?: number;
  people_fully_vaccinated?: number;
  hospitals?: number;
  total_beds?: number;
  occupied_beds?: number;
  cases_per_100k?: number;
  deaths_per_100k?: number;
  vaccination_rate?: number;
  full_vaccination_rate?: number;
}

export interface TestingCenter {
  id: number;
  name: string;
  region_id?: number;
  municipality_id?: number;
  address?: string;
  phone?: string;
  email?: string;
  test_types?: string;
  operating_hours?: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  region_name?: string;
  municipality_name?: string;
}

export interface TestingData {
  id: number;
  date: string;
  region_id?: number;
  municipality_id?: number;
  testing_center_id?: number;
  total_tests: number;
  pcr_tests: number;
  antigen_tests: number;
  positive_tests: number;
  negative_tests: number;
  pending_tests: number;
  positivity_rate: number;
  region_name?: string;
  municipality_name?: string;
  testing_center_name?: string;
}

export interface StatisticsOverview {
  cases: {
    total: number;
    new_today: number;
    active: number;
    deaths: number;
    new_deaths_today: number;
    recovered: number;
    new_recovered_today: number;
    hospitalized: number;
    icu_patients: number;
    ventilator_patients: number;
    case_fatality_rate: string;
    recovery_rate: string;
    incidence_rate: string;
    last_updated: string;
  };
  vaccination: {
    people_vaccinated: number;
    people_fully_vaccinated: number;
    total_doses_administered: number;
    first_doses: number;
    second_doses: number;
    booster_doses: number;
    vaccination_rate: string;
    full_vaccination_rate: string;
  };
  hospital_capacity: {
    total_hospitals: number;
    total_beds: number;
    occupied_beds: number;
    available_beds: number;
    occupancy_rate: string;
    covid_beds: number;
    occupied_covid_beds: number;
    covid_bed_occupancy: string;
    icu_beds: number;
    occupied_icu_beds: number;
    icu_occupancy: string;
    ventilators: number;
    occupied_ventilators: number;
    ventilator_usage: string;
  };
  testing: {
    total_tests: number;
    positive_tests: number;
    negative_tests: number;
    positivity_rate: number;
    tests_per_capita: string;
  };
  population: {
    total: number;
  };
}

export interface TrendData {
  date: string;
  daily_cases: number;
  daily_deaths: number;
  daily_recovered: number;
  active_cases: number;
  hospitalized: number;
  icu_patients: number;
  ma_7_cases?: number;
  ma_7_deaths?: number;
  ma_7_recovered?: number;
  cases_change_pct?: string;
  deaths_change_pct?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
  message?: string;
}

export interface HospitalCapacity {
  total_hospitals: number;
  total_beds: number;
  total_covid_beds: number;
  total_icu_beds: number;
  total_ventilators: number;
  total_occupied_beds: number;
  total_occupied_covid_beds: number;
  total_occupied_icu_beds: number;
  total_occupied_ventilators: number;
  total_available_beds: number;
  total_available_covid_beds: number;
  total_available_icu_beds: number;
  total_available_ventilators: number;
  bed_utilization_rate: string;
  covid_bed_utilization_rate: string;
  icu_utilization_rate: string;
  ventilator_utilization_rate: string;
  covid_hospitals: number;
}

export interface VaccinationSummary {
  summary: {
    total_first_doses: number;
    total_second_doses: number;
    total_booster_doses: number;
    total_doses_administered: number;
    total_people_vaccinated: number;
    total_people_fully_vaccinated: number;
    vaccine_types_used: number;
    regions_covered: number;
    last_updated: string;
    vaccination_start_date: string;
    total_population: number;
    overall_vaccination_rate: string;
    overall_full_vaccination_rate: string;
  };
  vaccine_types: {
    vaccine_type: string;
    first_doses: number;
    second_doses: number;
    booster_doses: number;
    total_doses: number;
  }[];
}

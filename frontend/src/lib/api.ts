import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making API request to: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error status
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// API functions
export const covidApi = {
  // Cases
  getCases: () => api.get('/cases'),
  getCasesByRegion: (region: string) => api.get(`/cases/region/${region}`),
  getCasesByDate: (startDate: string, endDate: string) => 
    api.get(`/cases/date-range?startDate=${startDate}&endDate=${endDate}`),
  // Statistics
  getStatistics: () => api.get('/statistics/overview'),
  getDailyStats: () => api.get('/statistics/trends?period=30'),
  getWeeklyStats: () => api.get('/statistics/trends?period=90'),
  getMonthlyStats: () => api.get('/statistics/regional'),

  // Hospitals
  getHospitals: () => api.get('/hospitals'),
  getHospitalById: (id: number) => api.get(`/hospitals/${id}`),
  getHospitalsByRegion: (region: string) => api.get(`/hospitals/by-region?region=${region}`),

  // Vaccinations
  getVaccinations: () => api.get('/vaccinations'),
  getVaccinationsByRegion: (region: string) => api.get(`/vaccinations/region/${region}`),
  getVaccinationStats: () => api.get('/vaccinations/stats'),

  // Testing
  getTestingData: () => api.get('/testing'),
  getTestingCenters: () => api.get('/testing/centers'),
  getTestingByRegion: (region: string) => api.get(`/testing/region/${region}`),

  // Regions
  getRegions: () => api.get('/regions'),
  getMunicipalities: () => api.get('/regions/municipalities'),

  // Health status
  getHealthStatus: () => api.get('/health'),
};

export default api;

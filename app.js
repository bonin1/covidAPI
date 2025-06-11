const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const { testConnection } = require('./database');
const automationService = require('./services/automation');

// Import routes
const casesRoutes = require('./routes/cases');
const vaccinationRoutes = require('./routes/vaccinations');
const hospitalRoutes = require('./routes/hospitals');
const statisticsRoutes = require('./routes/statistics');
const regionsRoutes = require('./routes/regions');
const testingRoutes = require('./routes/testing');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kosovo COVID-19 API',
      version: '1.0.0',
      description: 'Comprehensive COVID-19 tracking API for Kosovo with real-time data, statistics, and health monitoring',
      contact: {
        name: 'COVID Tracking Team',
        email: 'info@kosovo-covid-api.org'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      },
      {
        url: 'https://api.kosovo-covid.org',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Cases',
        description: 'COVID-19 cases data and management'
      },
      {
        name: 'Vaccinations',
        description: 'Vaccination data and statistics'
      },
      {
        name: 'Hospitals',
        description: 'Hospital capacity and COVID-related data'
      },
      {
        name: 'Statistics',
        description: 'Comprehensive COVID-19 statistics and analytics'
      },
      {
        name: 'Regions',
        description: 'Regional data and municipality information'
      },
      {
        name: 'Testing',
        description: 'COVID-19 testing data and centers'
      },
      {
        name: 'Health',
        description: 'API health and system status'
      }
    ]
  },
  apis: ['./routes/*.js', './app.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware setup
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://kosovo-covid-dashboard.org'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Kosovo COVID-19 API Documentation'
}));

// API Routes
app.use('/api/v1/cases', casesRoutes);
app.use('/api/v1/vaccinations', vaccinationRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/statistics', statisticsRoutes);
app.use('/api/v1/regions', regionsRoutes);
app.use('/api/v1/testing', testingRoutes);
app.use('/api/v1/health', healthRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Root - Welcome message and basic information
 *     description: Returns welcome message and API information
 *     responses:
 *       200:
 *         description: Welcome message with API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 documentation:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Kosovo COVID-19 API',
    version: '1.0.0',
    description: 'Comprehensive COVID-19 tracking and monitoring system for Kosovo',
    documentation: '/api-docs',
    endpoints: [
      '/api/v1/cases',
      '/api/v1/vaccinations',
      '/api/v1/hospitals',
      '/api/v1/statistics',
      '/api/v1/regions',
      '/api/v1/testing',
      '/api/v1/health'
    ],
    features: [
      'Real-time COVID-19 data tracking',
      'Vaccination progress monitoring',
      'Hospital capacity management',
      'Regional statistics and analytics',
      'Testing center information',
      'Automated data updates',
      'Comprehensive API documentation'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    documentation: '/api-docs'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    // Start automation service
    if (process.env.ENABLE_AUTO_UPDATES === 'true') {
      automationService.start();
      console.log('🤖 Automation service started');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Kosovo COVID-19 API Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🔄 Auto-updates: ${process.env.ENABLE_AUTO_UPDATES === 'true' ? 'Enabled' : 'Disabled'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
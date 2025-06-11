# Kosovo COVID-19 Tracking System

A comprehensive, full-stack COVID-19 tracking system for Kosovo with real-time data, automated updates, extensive analytics capabilities, and a modern web interface built with Next.js.

## 🏗️ System Architecture

This is a **hybrid database-driven system** that combines:

- **Primary Database Operations**: Full CRUD functionality using `executeQuery` for comprehensive data management
- **Local MySQL Storage**: Persistent data storage with complete transaction support
- **Automated Data Generation**: Realistic COVID data simulation mimicking Kosovo Ministry of Health updates
- **External API Integration**: Ready for integration with WHO, Disease.sh, and official health APIs
- **Real-time Analytics**: Complex statistical calculations and trend analysis

The system operates primarily on **local database operations** rather than just fetching external APIs, providing:
- ✅ Complete data persistence and historical tracking
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Advanced analytics and statistical processing
- ✅ Automated data updates and health monitoring
- ✅ Independent operation without external API dependencies

## 🚀 Features

### Backend API Features
- **Real-time COVID-19 Data Tracking**: Cases, deaths, recoveries, hospitalizations
- **Vaccination Monitoring**: Track vaccination progress by region and vaccine type
- **Hospital Capacity Management**: Monitor bed availability and occupancy rates
- **Testing Data Analytics**: PCR and antigen test results with positivity rates
- **Regional Statistics**: Detailed breakdown by regions and municipalities
- **Demographics Analysis**: Age group breakdowns and risk analysis

### Backend Technical Features
- **Database-Driven Architecture**: Comprehensive data management using `executeQuery` function for all database operations
- **Full CRUD Operations**: Complete Create, Read, Update, Delete functionality across all data models
- **Advanced Analytics**: Complex statistical calculations, trend analysis, and moving averages
- **Real-time Data Processing**: Live updates with automated data generation and validation
- **Hybrid Data Approach**: Combines local database storage with external API integration capabilities

### Frontend Web Interface
- **Modern Dashboard**: Real-time COVID-19 statistics with responsive design
- **Interactive Charts**: Beautiful visualizations using Recharts library
- **Regional Analysis**: Compare data across different regions of Kosovo
- **Hospital Monitoring**: Track hospital capacity and availability
- **Vaccination Progress**: Monitor vaccination campaigns and coverage
- **Mobile-First Design**: Fully responsive interface built with Tailwind CSS

### Advanced Technical Features
- **Automated Data Updates**: Scheduled data generation and updates using automation service
- **Complex Query Processing**: Sophisticated database queries with joins, aggregations, and statistical calculations
- **Trend Analysis**: Moving averages, percentage changes, and predictive analytics
- **API Health Monitoring**: Comprehensive health checks and system metrics
- **Rate Limiting**: Protection against API abuse
- **Data Validation**: Robust input validation and error handling using `executeQuery` wrapper
- **Transaction Support**: Database integrity with proper transaction handling
- **Comprehensive Documentation**: Interactive Swagger/OpenAPI documentation
- **Data Validation**: Robust input validation and error handling

### Technical Features
- **High Performance**: Connection pooling and optimized queries
- **Scalable Architecture**: Modular design with service separation
- **Error Handling**: Comprehensive error tracking and logging
- **Security**: Helmet.js security headers and CORS configuration
- **Compression**: Gzip compression for improved performance

## 📊 API Endpoints

### Cases
- `GET /api/v1/cases` - Get COVID-19 cases data
- `GET /api/v1/cases/latest` - Get latest cases data
- `GET /api/v1/cases/summary` - Get summary statistics
- `GET /api/v1/cases/trends` - Get trends analysis
- `GET /api/v1/cases/by-region` - Get cases grouped by region
- `POST /api/v1/cases` - Add new case data

### Vaccinations
- `GET /api/v1/vaccinations` - Get vaccination data
- `GET /api/v1/vaccinations/summary` - Get vaccination summary
- `GET /api/v1/vaccinations/progress` - Get vaccination progress
- `GET /api/v1/vaccinations/coverage` - Get coverage analysis
- `GET /api/v1/vaccinations/by-region` - Get regional vaccination data
- `POST /api/v1/vaccinations` - Add vaccination data

### Hospitals
- `GET /api/v1/hospitals` - Get hospitals data
- `GET /api/v1/hospitals/capacity` - Get capacity overview
- `GET /api/v1/hospitals/{id}` - Get specific hospital
- `GET /api/v1/hospitals/by-region` - Get regional hospital data
- `PUT /api/v1/hospitals/{id}/capacity` - Update hospital capacity
- `POST /api/v1/hospitals` - Add new hospital

### Statistics
- `GET /api/v1/statistics/overview` - Comprehensive overview
- `GET /api/v1/statistics/trends` - Detailed trends analysis
- `GET /api/v1/statistics/regional` - Regional comparison
- `GET /api/v1/statistics/demographics` - Age group breakdown
- `GET /api/v1/statistics/comparison` - Time period comparison

### Regions
- `GET /api/v1/regions` - Get all regions
- `GET /api/v1/regions/{id}` - Get specific region
- `GET /api/v1/regions/{id}/municipalities` - Get municipalities
- `GET /api/v1/regions/{id}/trends` - Get regional trends
- `GET /api/v1/regions/comparison` - Compare regions
- `POST /api/v1/regions` - Add new region

### Testing
- `GET /api/v1/testing/centers` - Get testing centers
- `GET /api/v1/testing/data` - Get testing data
- `GET /api/v1/testing/summary` - Get testing summary
- `GET /api/v1/testing/positivity-trends` - Get positivity trends
- `POST /api/v1/testing/centers` - Add testing center
- `POST /api/v1/testing/data` - Add testing data

### Health Monitoring
- `GET /api/v1/health` - API health status
- `GET /api/v1/health/database` - Database health
- `GET /api/v1/health/automation` - Automation service status
- `GET /api/v1/health/metrics` - System metrics
- `GET /api/v1/health/data-freshness` - Data freshness check

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
- **Swagger UI**: http://localhost:3000/api-docs
- **API Base URL**: http://localhost:3000/api/v1

## 🖥️ Frontend Interface

The Next.js frontend provides a comprehensive web interface for COVID-19 data visualization:

### Pages Available
- **Dashboard** (`/`): Main overview with key statistics and trends
- **Statistics** (`/statistics`): Detailed analytics with interactive charts
- **Hospitals** (`/hospitals`): Hospital capacity monitoring
- **Vaccinations** (`/vaccinations`): Vaccination progress tracking
- **Regions** (`/regions`): Regional comparison and analysis

### Frontend Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Data**: Automatically fetches latest data from the API
- **Interactive Charts**: Built with Recharts for beautiful visualizations
- **Component Architecture**: Modular, reusable React components
- **TypeScript**: Full type safety and better developer experience
- **Modern Styling**: Tailwind CSS for rapid, consistent styling

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MySQL 8.0+ (XAMPP recommended for development)
- Git

### 1. Clone the Repository
```powershell
git clone https://github.com/bonin1/kosovo-covid-api.git
cd kosovo-covid-api
```

### 2. Backend Setup

#### Install Backend Dependencies
```powershell
npm install
```

#### Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kosovo_covid_db

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Automation
ENABLE_AUTO_UPDATES=true
```

#### Database Setup
1. Start XAMPP and ensure MySQL is running
2. Initialize the database and create tables:
```powershell
npm run init-db
```

#### Seed Sample Data (Optional)
Populate the database with sample data:
```powershell
npm run seed
```

#### Start the Backend Server
```powershell
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 3. Frontend Setup

#### Navigate to Frontend Directory
```powershell
cd frontend
```

#### Install Frontend Dependencies
```powershell
npm install
```

#### Environment Configuration
Create a `.env.local` file in the frontend directory:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

#### Start the Frontend Development Server
```powershell
npm run dev
```

### 4. Access the Application

- **Frontend Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/api-docs

## 🔧 Development

### Backend Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database tables
- `npm run seed` - Seed sample data
- `npm test` - Run tests

### Frontend Scripts (in `/frontend` directory)
- `npm run dev` - Start Next.js development server
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Full Project Structure
```
kosovo-covid-api/
├── app.js                 # Main Express application
├── database.js            # Database configuration
├── package.json           # Backend dependencies
├── .env                   # Backend environment variables
├── model/                 # Data models
│   └── CovidCase.js
├── routes/                # API route handlers
│   ├── cases.js
│   ├── vaccinations.js
│   ├── hospitals.js
│   ├── statistics.js
│   ├── regions.js
│   ├── testing.js
│   └── health.js
├── services/              # Business logic services
│   └── automation.js
├── scripts/               # Database utility scripts
│   ├── createDatabase.js
│   ├── initDatabase.js
│   └── seedData.js
└── frontend/              # Next.js frontend application
    ├── package.json       # Frontend dependencies
    ├── tailwind.config.js # Tailwind CSS configuration
    ├── next.config.ts     # Next.js configuration
    ├── .env.local         # Frontend environment variables
    ├── src/
    │   ├── app/           # Next.js 13+ app directory
    │   │   ├── layout.tsx # Root layout component
    │   │   ├── page.tsx   # Dashboard page
    │   │   ├── statistics/
    │   │   ├── hospitals/
    │   │   ├── vaccinations/
    │   │   └── regions/
    │   ├── components/    # Reusable React components
    │   │   ├── StatCard.tsx
    │   │   ├── ChartCard.tsx
    │   │   ├── TrendChart.tsx
    │   │   ├── Navbar.tsx
    │   │   └── Footer.tsx
    │   ├── lib/           # Utility libraries
    │   │   └── api.ts     # API client configuration
    │   └── types/         # TypeScript type definitions
    │       └── api.ts     # API response types
    └── public/            # Static assets
```

## 🔄 Automation Features

The API includes an automated data update service that:
- **Fetches External Data**: Updates from WHO, Disease.sh, and other sources
- **Scheduled Updates**: Configurable update intervals (default: every 30 minutes)
- **Data Validation**: Ensures data integrity and consistency
- **Error Handling**: Robust error recovery and logging
- **Health Monitoring**: Tracks automation service status

### Automation Configuration
```javascript
// Enable/disable automation
ENABLE_AUTO_UPDATES=true

// Update frequency (cron format)
AUTO_UPDATE_INTERVAL=*/30 * * * *

// External data sources
WHO_API_URL=https://covid19.who.int/WHO-COVID-19-global-data.csv
WORLDOMETER_API_URL=https://disease.sh/v3/covid-19/countries/kosovo
```

### Database Schema

The system uses MySQL with the following structure:

### Core Tables
- **regions**: Administrative regions of Kosovo (7 regions)
- **municipalities**: Municipalities within regions (39 municipalities)
- **covid_cases**: Daily COVID-19 case data with comprehensive metrics
- **hospitals**: Hospital information and capacity (15 hospitals)
- **vaccinations**: Vaccination data by region and type (1,708+ records)
- **testing_centers**: COVID-19 testing facilities (10 centers)
- **testing_data**: Daily testing results (460+ records)
- **age_groups**: Demographic breakdown of cases
- **data_sources**: Track data source information

### Sample Data Included
- **637+ COVID case records** across all regions
- **1,708+ vaccination records** with detailed breakdown
- **460+ testing records** from various centers
- **15 hospitals** with capacity information
- **10 testing centers** across Kosovo
- **39 municipalities** mapped to regions

### Key Database Features
- **Comprehensive indexing** for optimal query performance
- **Foreign key constraints** ensuring data integrity
- **Automated timestamps** for audit trails
- **Flexible schema** supporting multiple data sources

## 🔐 Security Features

- **Rate Limiting**: Prevents API abuse (100 requests per 15 minutes)
- **Helmet.js**: Security headers and protection
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **Error Sanitization**: Prevents information leakage

## 🚀 Performance Optimizations

- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for responses
- **Indexing**: Optimized database indexes
- **Caching**: Strategic caching for frequently accessed data
- **Query Optimization**: Efficient SQL queries

## 📈 Monitoring & Health Checks

The API provides comprehensive monitoring:
- **Health Endpoints**: Real-time system status
- **Database Monitoring**: Connection and performance metrics
- **Automation Status**: Service health and job status
- **Data Freshness**: Alerts for stale data
- **System Metrics**: Memory, CPU, and performance data

## 🌍 Data Sources

- **Primary**: Kosovo Ministry of Health
- **Secondary**: WHO Global COVID-19 Data
- **Tertiary**: Disease.sh API for international data
- **Hospital Data**: Direct integration with healthcare facilities

## 📝 API Usage Examples

### Get Latest COVID-19 Cases
```bash
curl -X GET "http://localhost:3000/api/v1/cases/latest" \\
  -H "accept: application/json"
```

### Get Vaccination Progress
```bash
curl -X GET "http://localhost:3000/api/v1/vaccinations/progress?days=30" \\
  -H "accept: application/json"
```

### Get Regional Statistics
```bash
curl -X GET "http://localhost:3000/api/v1/statistics/regional" \\
  -H "accept: application/json"
```

### Add New Case Data
```bash
curl -X POST "http://localhost:3000/api/v1/cases" \\
  -H "accept: application/json" \\
  -H "Content-Type: application/json" \\
  -d '{
    "date": "2025-06-11",
    "region_id": 1,
    "total_cases": 1000,
    "new_cases": 50,
    "deaths": 20,
    "recovered": 900
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 🔮 Future Enhancements

### Backend Improvements
- **Real-time WebSocket Integration**: Live data updates
- **Advanced Analytics**: Machine learning for trend prediction
- **Data Export APIs**: CSV, Excel, and PDF generation
- **Multi-language API**: Albanian, Serbian, English responses

### Frontend Enhancements
- **PWA Support**: Progressive Web App capabilities
- **Offline Mode**: Cache data for offline viewing
- **Print Reports**: Generate printable reports
- **Advanced Filtering**: Complex data filtering options
- **Animation Improvements**: Smooth transitions and loading states

### System Features
- **Mobile App**: React Native companion application
- **Push Notifications**: Alert system for health authorities
- **Email Reports**: Automated daily/weekly email summaries
- **Advanced Security**: OAuth2 integration and role-based access
- **Multi-tenant Support**: Support for multiple regions/countries

---

**Made with ❤️ for Kosovo's Public Health**

## 🎯 System Status

✅ **Backend API**: Fully functional with comprehensive endpoints  
✅ **Database**: Initialized with sample data (637+ cases, 1,708+ vaccinations)  
✅ **Frontend**: Modern Next.js interface with responsive design  
✅ **Documentation**: Complete Swagger API documentation  
✅ **Automation**: Scheduled data updates and health monitoring  
✅ **Testing**: API endpoints tested and validated  

### Current Data Structure Fixes Applied
- ✅ Fixed Tailwind CSS v3 configuration
- ✅ Aligned frontend data types with actual API responses
- ✅ Fixed statistics page to use correct API endpoints
- ✅ Updated API client to match backend response structure
- ✅ Implemented proper error handling and loading states

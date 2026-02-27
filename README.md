# AI-Powered Retail Failure Simulator & Market Intelligence Platform

A comprehensive pre-emptive decision-making system that simulates retail failure scenarios to enable proactive business risk management.

## 🎯 Features

- **Seasonal Risk Detection**: Analyze seasonal demand patterns and detect potential mismatches
- **Failure Simulation**: Model inventory overstock and stockout scenarios with time-series projections
- **Impact Analysis**: Calculate failure propagation across business functions using network analysis
- **AI-Powered Insights**: Generate executive summaries and mitigation strategies (mocked, AWS Bedrock-ready)
- **Dual Dashboards**: 
  - Analyst Dashboard: Comprehensive risk monitoring and detailed analysis
  - Executive Dashboard: Mobile-responsive decision interface with 30-second flows
- **Data Ingestion**: Support for CSV and JSON data uploads (sales, inventory, market trends)

## 🏗️ Tech Stack

### Backend
- **FastAPI** (Python 3.11) - High-performance async API framework
- **MySQL 8.0** - Relational database
- **SQLAlchemy** - ORM with Alembic migrations
- **Pandas, NumPy, Scikit-learn** - Data analytics and ML
- **NetworkX** - Failure propagation graph analysis

### Frontend
- **React 18** with **TypeScript** - Modern component-based UI
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first styling
- **Recharts** - Data visualization
- **React Router** - Client-side routing
- **Axios** - HTTP client

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

This will:
1. Check Docker installation
2. Create environment files
3. Start all services via Docker Compose
4. Initialize the database

### Option 2: Docker Compose Manual

```bash
# Create backend .env file
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MySQL**: localhost:3306 (user: root, password: password)

## 📋 Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- For local development without Docker:
  - Python 3.11+
  - Node.js 20+
  - MySQL 8.0+

## 🛠️ Local Development Setup (Without Docker)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL connection details
   ```

5. **Initialize database:**
   ```bash
   # Make sure MySQL is running
   alembic upgrade head
   ```

6. **Start backend server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
retail-failure-simulator/
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Configuration management
│   ├── database.py                  # Database connection
│   ├── models/                      # SQLAlchemy models
│   │   ├── risk_assessment.py
│   │   ├── failure_scenario.py
│   │   ├── propagation_score.py
│   │   └── ...
│   ├── schemas/                     # Pydantic schemas
│   ├── services/                    # Business logic
│   │   ├── data_ingestion.py
│   │   ├── seasonal_risk_engine.py
│   │   ├── failure_simulator.py
│   │   ├── impact_analyzer.py
│   │   ├── ai_reasoning_engine.py
│   │   └── mitigation_engine.py
│   ├── api/                         # API routes
│   │   ├── data_ingestion_routes.py
│   │   └── analysis_routes.py
│   ├── alembic/                     # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── pages/
│   │   │   ├── AnalystDashboard.tsx
│   │   │   ├── ExecutiveDashboard.tsx
│   │   │   ├── DataUpload.tsx
│   │   │   └── ScenarioDetails.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── setup.sh                         # Linux/Mac setup script
├── setup.bat                        # Windows setup script
└── README.md
```

## 🎮 Usage Guide

### 1. Upload Data

Navigate to **Data Upload** page:
- Upload CSV files for sales, inventory, or market trends
- Supported formats:
  - **Sales**: date, product_id, quantity, revenue
  - **Inventory**: date, product_id, stock_level
  - **Market Trends**: date, product_category, demand_forecast

### 2. Run Simulations

On the **Data Upload** page:
1. Select scenario type (Overstock, Stockout, Seasonal Mismatch)
2. Configure parameters:
   - Time horizon (days)
   - Affected products
   - Base inventory
   - Demand rate
3. Click "Run Simulation"

### 3. View Results

**Analyst Dashboard:**
- Real-time risk scores by product category
- Detailed simulation results
- Historical trend analysis

**Executive Dashboard:**
- 3-point executive summaries (Revenue Risk, Market Reason, Urgency)
- Impact propagation scores
- Ranked mitigation strategies with trade-offs

**Scenario Details:**
- Time-series visualizations
- Impact analysis across business functions
- Detailed mitigation recommendations

## 🔌 API Endpoints

### Data Ingestion
- `POST /api/data/upload/csv/{data_type}` - Upload CSV file
- `POST /api/data/upload/json/{data_type}` - Upload JSON data

### Analysis
- `POST /api/analysis/risk/analyze` - Analyze seasonal risks
- `POST /api/analysis/simulate` - Run failure simulation
- `GET /api/analysis/scenarios` - List all scenarios
- `GET /api/analysis/scenarios/{id}` - Get scenario details
- `GET /api/analysis/risks` - List all risk assessments

Full API documentation: http://localhost:8000/docs

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov=. --cov-report=html  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## 🐛 Troubleshooting

### Docker Issues

**Services won't start:**
```bash
docker-compose down -v
docker-compose up -d --build
```

**Database connection errors:**
```bash
# Check MySQL is running
docker-compose ps

# View MySQL logs
docker-compose logs mysql
```

### Local Development Issues

**Backend won't start:**
- Verify MySQL is running and accessible
- Check `.env` file has correct DATABASE_URL
- Ensure all dependencies are installed: `pip install -r requirements.txt`

**Frontend won't start:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20+)

## 🔮 Future Enhancements

- [ ] AWS Bedrock integration for real AI reasoning
- [ ] WebSocket support for real-time updates
- [ ] User authentication and authorization
- [ ] Property-based testing implementation
- [ ] Advanced data visualization with D3.js
- [ ] Export reports to PDF
- [ ] Email notifications for critical risks
- [ ] Multi-tenant support

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For issues and questions, please check the API documentation at http://localhost:8000/docs or review the application logs.
"# Market-Planner" 

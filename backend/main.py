"""
Main FastAPI application entry point for Retail Failure Simulator
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from api import data_ingestion_routes, analysis_routes
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Retail Failure Simulator API",
    description="AI-powered Retail Failure Simulator & Market Intelligence Platform",
    version="1.0.0"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(data_ingestion_routes.router)
app.include_router(analysis_routes.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")

@app.get("/")
async def root():
    return {"message": "Retail Failure Simulator API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "retail-failure-simulator"}

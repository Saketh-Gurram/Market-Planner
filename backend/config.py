"""
Application configuration management
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database - SQLite for local development
    DATABASE_URL: str = "sqlite:///./retail_simulator.db"
    
    # Application
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Performance SLA
    RISK_PROCESSING_SLA_SECONDS: int = 300
    SIMULATION_SLA_SECONDS: int = 30
    UI_RESPONSE_SLA_SECONDS: int = 2
    
    # AWS (for future use)
    AWS_REGION: str = "us-east-1"
    AWS_BEDROCK_MODEL: str = "anthropic.claude-v2"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

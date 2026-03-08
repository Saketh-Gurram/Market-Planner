"""
Application configuration management
"""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    # Database - SQLite for local development
    DATABASE_URL: str = "sqlite:///./retail_simulator.db"

    # Application
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001

    # Performance SLA
    RISK_PROCESSING_SLA_SECONDS: int = 300
    SIMULATION_SLA_SECONDS: int = 30
    UI_RESPONSE_SLA_SECONDS: int = 2

    # ------------------------------------------------------------------ #
    # Google Gemini                                                        #
    # Set GEMINI_API_KEY in your .env file — never hard-code it           #
    # Get your key at: https://aistudio.google.com/apikey                 #
    # ------------------------------------------------------------------ #
    GEMINI_API_KEY: str = ""

    # Change this ONE value in .env to switch Gemini models.
    #
    # Recommended:
    #   gemini-2.0-flash   ← default (fast, cost-efficient)
    #   gemini-1.5-pro     ← deep reasoning, higher cost
    #   gemini-1.5-flash   ← fast, lower cost
    #
    GEMINI_MODEL_ID: str = "gemini-2.0-flash"

    model_config = ConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()

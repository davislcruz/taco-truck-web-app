"""
Application configuration
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/taco_truck.db")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production-you-crazy-person")
SESSION_EXPIRE_DAYS = int(os.getenv("SESSION_EXPIRE_DAYS", "7"))

# Stripe (optional)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")

# App settings
APP_NAME = "Taco Truck"
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

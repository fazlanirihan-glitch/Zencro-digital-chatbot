import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("app.services.supabase")

# Initialize real Supabase client if configured
supabase_client: Optional[Client] = None

if settings.is_supabase_configured:
    try:
        supabase_client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
else:
    logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Running in local mock database mode.")

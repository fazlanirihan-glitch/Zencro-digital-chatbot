import os
from typing import List, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    VERSION: str = "0.3.0"
    
    # Gemini configurations
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: float = 12.0
    GEMINI_MAX_RETRIES: int = 3
    
    # Supabase configurations
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # CORS Configurations
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    # Knowledge Directory Path (Will be dynamically resolved at runtime if empty)
    KNOWLEDGE_DIR: str = ""
    
    # Advanced Retrieval Weighting / File Priorities
    # Defines weight multipliers for different categories
    # to affect keyword overlap scoring
    FILE_PRIORITY: Dict[str, float] = {
        "faq/": 1.6,         # FAQs are highly relevant for quick matching
        "company/": 1.3,     # Company basics
        "contact/": 1.2,     # Callback/contact forms info
        "services/": 1.1,    # Specific service listings
        "pricing/": 1.1,     # Pricing models
        "portfolio/": 1.0,   # Case studies
        "technology/": 1.0,  # Tech stacks
        "founder/": 1.0,     # Founder profile details
        "policies/": 0.5     # Terms and privacy (lowest priority)
    }

    @property
    def cors_origins_list(self) -> List[str]:
        return [
            origin.strip() for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL) and bool(self.SUPABASE_SERVICE_ROLE_KEY)

settings = Settings()

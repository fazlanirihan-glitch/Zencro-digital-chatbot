import logging
from typing import List, Dict, Any, Optional
import uuid
from app.core.config import settings
from app.services.supabase import supabase_client

logger = logging.getLogger("app.services.db.company")

# Cached default company ID
cached_company_id: Optional[str] = None
mock_companies: Dict[str, Dict[str, Any]] = {}

class CompanyService:
    @staticmethod
    def get_default_company_id() -> str:
        """Returns the cached default company ID or seeds if missing."""
        global cached_company_id
        if not cached_company_id:
            CompanyService.seed_default_company()
        return cached_company_id or "zencro-default-company-id"

    @staticmethod
    def seed_default_company() -> str:
        """Seeds the default ZenCro Digital company on startup if not present."""
        global cached_company_id
        
        # Default branding specifications
        default_data = {
            "company_name": "ZenCro Digital",
            "tagline": "Build. Automate. Grow.",
            "website": "www.zencrodigital.in",
            "email": "zencrodigital@gmail.com",
            "phone": "+91 92725 83316",
            "address": "Maharashtra, India",
            "timezone": "IST",
            "default_language": "English"
        }

        if not supabase_client:
            # Mock mode seeding
            mock_id = "zencro-default-company-id"
            if mock_id not in mock_companies:
                mock_companies[mock_id] = {**default_data, "id": mock_id}
            cached_company_id = mock_id
            logger.info(f"Mock Company Seeded: ZenCro Digital ID={mock_id}")
            return mock_id

        try:
            # Query if ZenCro Digital already exists in Database
            res = supabase_client.table("companies").select("id").eq("company_name", "ZenCro Digital").execute()
            if res.data:
                cached_company_id = res.data[0]["id"]
                logger.info(f"Loaded existing Company: ZenCro Digital ID={cached_company_id}")
                return cached_company_id

            # Insert if missing
            res = supabase_client.table("companies").insert(default_data).execute()
            if res.data:
                cached_company_id = res.data[0]["id"]
                logger.info(f"Seeded new Company: ZenCro Digital ID={cached_company_id}")
                return cached_company_id
        except Exception as e:
            logger.error(f"Failed to seed default company: {e}")
            # Fallback
            cached_company_id = "zencro-default-company-id"
            
        return cached_company_id

    @staticmethod
    def create_company(data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new tenant company record."""
        if not supabase_client:
            cid = str(uuid.uuid4())
            mock_companies[cid] = {**data, "id": cid}
            return mock_companies[cid]

        try:
            res = supabase_client.table("companies").insert(data).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.error(f"Error creating company: {e}")
            raise RuntimeError(f"Database error during company creation: {e}")

    @staticmethod
    def get_company(company_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a tenant company record by ID."""
        if not supabase_client:
            return mock_companies.get(company_id)

        try:
            res = supabase_client.table("companies").select("*").eq("id", company_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error getting company: {e}")
            return None

    @staticmethod
    def update_company(company_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates a tenant company record by ID."""
        if not supabase_client:
            if company_id in mock_companies:
                mock_companies[company_id].update(data)
                return mock_companies[company_id]
            return None

        try:
            res = supabase_client.table("companies").update(data).eq("id", company_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error updating company: {e}")
            raise RuntimeError(f"Database error during company update: {e}")

    @staticmethod
    def delete_company(company_id: str) -> bool:
        """Deletes a tenant company record by ID."""
        if not supabase_client:
            if company_id in mock_companies:
                del mock_companies[company_id]
                return True
            return False

        try:
            supabase_client.table("companies").delete().eq("id", company_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting company: {e}")
            return False

    @staticmethod
    def list_companies(page: int = 1, page_size: int = 10) -> List[Dict[str, Any]]:
        """Lists tenant companies with pagination support."""
        if not supabase_client:
            all_list = list(mock_companies.values())
            start = (page - 1) * page_size
            return all_list[start:start+page_size]

        try:
            offset = (page - 1) * page_size
            res = supabase_client.table("companies").select("*").range(offset, offset + page_size - 1).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error listing companies: {e}")
            return []

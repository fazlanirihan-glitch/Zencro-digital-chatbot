import logging
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.services.supabase import supabase_client

logger = logging.getLogger("app.services.db.portfolio")

mock_portfolio: Dict[str, Dict[str, Any]] = {}

class PortfolioService:
    @staticmethod
    def create_portfolio_item(company_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new portfolio project entry."""
        payload = {
            **data,
            "company_id": company_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        if not supabase_client:
            pid = str(uuid.uuid4())
            payload["id"] = pid
            mock_portfolio[pid] = payload
            logger.info(f"Mock Portfolio item created: PID={pid}")
            return payload

        try:
            res = supabase_client.table("portfolio_items").insert(payload).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.error(f"Error creating portfolio project: {e}")
            raise RuntimeError(f"Database error during portfolio insertion: {e}")

    @staticmethod
    def get_portfolio_item(company_id: str, project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single portfolio project by ID."""
        if not supabase_client:
            item = mock_portfolio.get(project_id)
            if item and item["company_id"] == company_id:
                return item
            return None

        try:
            res = supabase_client.table("portfolio_items")\
                .select("*")\
                .eq("company_id", company_id)\
                .eq("id", project_id)\
                .execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error fetching portfolio project: {e}")
            return None

    @staticmethod
    def update_portfolio_item(company_id: str, project_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an existing portfolio project by ID."""
        if not supabase_client:
            item = mock_portfolio.get(project_id)
            if item and item["company_id"] == company_id:
                item.update(data)
                return item
            raise ValueError("Portfolio item not found or unauthorized.")

        try:
            res = supabase_client.table("portfolio_items")\
                .update(data)\
                .eq("company_id", company_id)\
                .eq("id", project_id)\
                .execute()
            if not res.data:
                raise ValueError("Portfolio item not found or unauthorized.")
            return res.data[0]
        except Exception as e:
            logger.error(f"Error updating portfolio project: {e}")
            raise RuntimeError(f"Database error during portfolio update: {e}")

    @staticmethod
    def delete_portfolio_item(company_id: str, project_id: str) -> bool:
        """Deletes a portfolio project by ID."""
        if not supabase_client:
            item = mock_portfolio.get(project_id)
            if item and item["company_id"] == company_id:
                del mock_portfolio[project_id]
                return True
            return False

        try:
            res = supabase_client.table("portfolio_items")\
                .delete()\
                .eq("company_id", company_id)\
                .eq("id", project_id)\
                .execute()
            return len(res.data) > 0 if res.data else True
        except Exception as e:
            logger.error(f"Error deleting portfolio project: {e}")
            return False

    @staticmethod
    def list_portfolio_items(company_id: str, page: int = 1, page_size: int = 12, 
                             category: Optional[str] = None, featured: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Lists projects with optional category filter, featured filter, and pagination."""
        if not supabase_client:
            all_list = [p for p in mock_portfolio.values() if p["company_id"] == company_id]
            if category:
                all_list = [p for p in all_list if p.get("category") == category]
            if featured is not None:
                all_list = [p for p in all_list if p.get("featured") == featured]
            start = (page - 1) * page_size
            return all_list[start:start+page_size]

        try:
            offset = (page - 1) * page_size
            query = supabase_client.table("portfolio_items").select("*").eq("company_id", company_id)
            
            if category:
                query = query.eq("category", category)
            if featured is not None:
                query = query.eq("featured", featured)
                
            res = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error listing portfolio: {e}")
            return []

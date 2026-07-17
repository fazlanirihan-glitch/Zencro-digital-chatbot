import logging
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.services.supabase import supabase_client

logger = logging.getLogger("app.services.db.faq")

mock_faqs: Dict[str, Dict[str, Any]] = {}

class FAQService:
    @staticmethod
    def create_faq(company_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new FAQ record."""
        payload = {
            **data,
            "company_id": company_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        if not supabase_client:
            fid = str(uuid.uuid4())
            payload["id"] = fid
            mock_faqs[fid] = payload
            logger.info(f"Mock FAQ created: FID={fid}")
            return payload

        try:
            res = supabase_client.table("faqs").insert(payload).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.error(f"Error creating FAQ record: {e}")
            raise RuntimeError(f"Database error during FAQ insertion: {e}")

    @staticmethod
    def get_faq(company_id: str, faq_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single FAQ record by ID."""
        if not supabase_client:
            item = mock_faqs.get(faq_id)
            if item and item["company_id"] == company_id:
                return item
            return None

        try:
            res = supabase_client.table("faqs")\
                .select("*")\
                .eq("company_id", company_id)\
                .eq("id", faq_id)\
                .execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error fetching FAQ details: {e}")
            return None

    @staticmethod
    def update_faq(company_id: str, faq_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an existing FAQ record."""
        if not supabase_client:
            item = mock_faqs.get(faq_id)
            if item and item["company_id"] == company_id:
                item.update(data)
                return item
            raise ValueError("FAQ not found or unauthorized.")

        try:
            res = supabase_client.table("faqs")\
                .update(data)\
                .eq("company_id", company_id)\
                .eq("id", faq_id)\
                .execute()
            if not res.data:
                raise ValueError("FAQ not found or unauthorized.")
            return res.data[0]
        except Exception as e:
            logger.error(f"Error updating FAQ details: {e}")
            raise RuntimeError(f"Database error during FAQ update: {e}")

    @staticmethod
    def delete_faq(company_id: str, faq_id: str) -> bool:
        """Deletes an FAQ record by ID."""
        if not supabase_client:
            item = mock_faqs.get(faq_id)
            if item and item["company_id"] == company_id:
                del mock_faqs[faq_id]
                return True
            return False

        try:
            res = supabase_client.table("faqs")\
                .delete()\
                .eq("company_id", company_id)\
                .eq("id", faq_id)\
                .execute()
            return len(res.data) > 0 if res.data else True
        except Exception as e:
            logger.error(f"Error deleting FAQ details: {e}")
            return False

    @staticmethod
    def list_faqs(company_id: str, page: int = 1, page_size: int = 20, 
                  category: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists FAQs ordered by order_index, with search and category filters."""
        if not supabase_client:
            all_list = [f for f in mock_faqs.values() if f["company_id"] == company_id]
            if category:
                all_list = [f for f in all_list if f.get("category") == category]
            if search:
                s = search.lower()
                all_list = [
                    f for f in all_list 
                    if s in f["question"].lower() 
                    or s in f["answer"].lower() 
                    or any(s in kw.lower() for kw in f.get("keywords", []))
                ]
            all_list.sort(key=lambda x: x.get("order_index", 0))
            start = (page - 1) * page_size
            return all_list[start:start+page_size]

        try:
            offset = (page - 1) * page_size
            query = supabase_client.table("faqs").select("*").eq("company_id", company_id)
            
            if category:
                query = query.eq("category", category)
            if search:
                query = query.or_(f"question.ilike.%{search}%,answer.ilike.%{search}%")
                
            res = query.order("order_index").range(offset, offset + page_size - 1).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error listing FAQs: {e}")
            return []

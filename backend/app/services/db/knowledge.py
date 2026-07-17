import logging
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.services.supabase import supabase_client

logger = logging.getLogger("app.services.db.knowledge")

mock_kfiles: Dict[str, Dict[str, Any]] = {}

class KnowledgeService:
    @staticmethod
    def create_knowledge_file(company_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates or registers a knowledge document tracking metadata record."""
        payload = {
            **data,
            "company_id": company_id,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "last_indexed": datetime.now(timezone.utc).isoformat()
        }

        if not supabase_client:
            fid = str(uuid.uuid4())
            payload["id"] = fid
            mock_kfiles[fid] = payload
            logger.info(f"Mock Knowledge file tracked: FID={fid}")
            return payload

        try:
            res = supabase_client.table("knowledge_files").insert(payload).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.error(f"Error creating knowledge file tracking: {e}")
            raise RuntimeError(f"Database error during knowledge file registration: {e}")

    @staticmethod
    def get_knowledge_file_by_name(company_id: str, filename: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single knowledge file record by its file path name."""
        if not supabase_client:
            for item in mock_kfiles.values():
                if item["company_id"] == company_id and item["filename"] == filename:
                    return item
            return None

        try:
            res = supabase_client.table("knowledge_files")\
                .select("*")\
                .eq("company_id", company_id)\
                .eq("filename", filename)\
                .execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error fetching knowledge file detail: {e}")
            return None

    @staticmethod
    def update_knowledge_file(company_id: str, file_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Updates metadata parameters for a registered knowledge file."""
        if not supabase_client:
            item = mock_kfiles.get(file_id)
            if item and item["company_id"] == company_id:
                item.update(data)
                return item
            raise ValueError("Knowledge file not found or unauthorized.")

        try:
            res = supabase_client.table("knowledge_files")\
                .update(data)\
                .eq("company_id", company_id)\
                .eq("id", file_id)\
                .execute()
            if not res.data:
                raise ValueError("Knowledge file not found or unauthorized.")
            return res.data[0]
        except Exception as e:
            logger.error(f"Error updating knowledge file: {e}")
            raise RuntimeError(f"Database error during knowledge file update: {e}")

    @staticmethod
    def delete_knowledge_file(company_id: str, file_id: str) -> bool:
        """Deletes a tracked knowledge file entry by ID."""
        if not supabase_client:
            item = mock_kfiles.get(file_id)
            if item and item["company_id"] == company_id:
                del mock_kfiles[file_id]
                return True
            return False

        try:
            res = supabase_client.table("knowledge_files")\
                .delete()\
                .eq("company_id", company_id)\
                .eq("id", file_id)\
                .execute()
            return len(res.data) > 0 if res.data else True
        except Exception as e:
            logger.error(f"Error deleting knowledge file: {e}")
            return False

    @staticmethod
    def list_knowledge_files(company_id: str, page: int = 1, page_size: int = 20) -> List[Dict[str, Any]]:
        """Lists all registered knowledge files for a company, with pagination."""
        if not supabase_client:
            all_list = [k for k in mock_kfiles.values() if k["company_id"] == company_id]
            start = (page - 1) * page_size
            return all_list[start:start+page_size]

        try:
            offset = (page - 1) * page_size
            res = supabase_client.table("knowledge_files")\
                .select("*")\
                .eq("company_id", company_id)\
                .order("uploaded_at", desc=True)\
                .range(offset, offset + page_size - 1)\
                .execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error listing knowledge files: {e}")
            return []

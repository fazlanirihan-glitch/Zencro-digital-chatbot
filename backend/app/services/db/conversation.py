import logging
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.services.supabase import supabase_client

logger = logging.getLogger("app.services.db.conversation")

mock_conversations: List[Dict[str, Any]] = []

class ConversationService:
    @staticmethod
    def create_conversation_turn(company_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves a single message-exchange turn into the conversations database."""
        payload = {
            "company_id": company_id,
            "session_id": data["session_id"],
            "user_message": data["user_message"],
            "assistant_message": data["assistant_message"],
            "retrieved_sources": data.get("retrieved_sources") or [],
            "model_used": data.get("model_used") or "gemini-2.5-flash",
            "response_time": data.get("response_time") or 0,
            "token_usage": data.get("token_usage") or 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        if not supabase_client:
            cid = str(uuid.uuid4())
            payload["id"] = cid
            mock_conversations.append(payload)
            logger.debug(f"Mock Conversation turn saved. Session={data['session_id']}")
            return payload

        try:
            res = supabase_client.table("conversations").insert(payload).execute()
            logger.debug(f"Conversation turn saved to DB. TurnID={res.data[0]['id']}")
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.error(f"Error saving conversation turn: {e}")
            raise RuntimeError(f"Database error during conversation insertion: {e}")

    @staticmethod
    def get_conversation_history(company_id: str, session_id: str) -> List[Dict[str, Any]]:
        """Retrieves all Q&A dialogue turns for an active session, chronologically sorted."""
        if not supabase_client:
            return sorted(
                [c for c in mock_conversations if c["company_id"] == company_id and c["session_id"] == session_id],
                key=lambda x: x["created_at"]
            )

        try:
            res = supabase_client.table("conversations")\
                .select("*")\
                .eq("company_id", company_id)\
                .eq("session_id", session_id)\
                .order("created_at")\
                .execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error fetching conversation history: {e}")
            return []

    @staticmethod
    def list_conversations(company_id: str, page: int = 1, page_size: int = 10) -> List[Dict[str, Any]]:
        """
        Lists distinct session details (latest messages, counts) for administration auditing.
        """
        if not supabase_client:
            # Group by session_id in mock store
            grouped: Dict[str, Dict[str, Any]] = {}
            for c in mock_conversations:
                if c["company_id"] == company_id:
                    sid = c["session_id"]
                    if sid not in grouped:
                        grouped[sid] = {
                            "session_id": sid,
                            "message_count": 0,
                            "latest_message": "",
                            "created_at": c["created_at"]
                        }
                    grouped[sid]["message_count"] += 2  # (user + bot counts as 2 messages)
                    grouped[sid]["latest_message"] = c["assistant_message"]
                    if c["created_at"] > grouped[sid]["created_at"]:
                        grouped[sid]["created_at"] = c["created_at"]
            
            all_list = sorted(list(grouped.values()), key=lambda x: x["created_at"], reverse=True)
            start = (page - 1) * page_size
            return all_list[start:start+page_size]

        try:
            # We fetch all conversations grouped by session_id
            # A standard approach is querying distinct sessions or aggregation.
            # To be safe and compatible, select sessions ordered by date.
            offset = (page - 1) * page_size
            
            # Subquery/RPC is cleaner, but we can do a simple group query or select limit
            res = supabase_client.table("conversations")\
                .select("session_id,created_at,assistant_message")\
                .eq("company_id", company_id)\
                .order("created_at", desc=True)\
                .execute()
            
            # Process grouping in python
            seen_sessions = set()
            grouped_sessions = []
            for item in res.data or []:
                sid = item["session_id"]
                if sid not in seen_sessions:
                    seen_sessions.add(sid)
                    
                    # Fetch counts
                    count_res = supabase_client.table("conversations")\
                        .select("id", count="exact")\
                        .eq("company_id", company_id)\
                        .eq("session_id", sid)\
                        .execute()
                    
                    grouped_sessions.append({
                        "session_id": sid,
                        "latest_message": item["assistant_message"],
                        "created_at": item["created_at"],
                        "message_count": (count_res.count * 2) if count_res.count else 0
                    })
            
            return grouped_sessions[offset:offset+page_size]
        except Exception as e:
            logger.error(f"Error listing session audits: {e}")
            return []

    @staticmethod
    def delete_conversation_history(company_id: str, session_id: str) -> bool:
        """Deletes chat logs for a session, enforcing tenant isolation."""
        if not supabase_client:
            global mock_conversations
            mock_conversations = [c for c in mock_conversations if not (c["company_id"] == company_id and c["session_id"] == session_id)]
            return True

        try:
            supabase_client.table("conversations")\
                .delete()\
                .eq("company_id", company_id)\
                .eq("session_id", session_id)\
                .execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting conversation logs: {e}")
            return False

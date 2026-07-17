import logging
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.services.supabase import supabase_client

logger = logging.getLogger("app.services.db.lead")

mock_leads: Dict[str, Dict[str, Any]] = {}

class LeadService:
    @staticmethod
    def create_or_update_lead(company_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a lead record or updates an existing one intelligently if a matching
        email or phone number already exists for this company.
        """
        email = data.get("email")
        phone = data.get("phone")
        
        existing_lead: Optional[Dict[str, Any]] = None

        if supabase_client:
            try:
                # Query for duplicate lead in database
                query = supabase_client.table("leads").select("*").eq("company_id", company_id)
                if email and phone:
                    query = query.or_(f"email.eq.{email},phone.eq.{phone}")
                elif email:
                    query = query.eq("email", email)
                elif phone:
                    query = query.eq("phone", phone)
                else:
                    query = None
                
                if query:
                    res = query.execute()
                    if res.data:
                        existing_lead = res.data[0]
            except Exception as e:
                logger.error(f"Error checking duplicate lead: {e}")
        else:
            # Mock duplicate check
            for lead in mock_leads.values():
                if lead["company_id"] == company_id:
                    if (email and lead.get("email") == email) or (phone and lead.get("phone") == phone):
                        existing_lead = lead
                        break

        # If lead exists, merge fields
        if existing_lead:
            lead_id = existing_lead["id"]
            update_data = {}
            
            # Intelligently overwrite only if new values are provided
            for key in ["name", "phone", "email", "business_name", "industry", "budget", "timeline", "source"]:
                if data.get(key):
                    update_data[key] = data[key]
            
            # Combine/Append requirements if different
            incoming_req = data.get("requirements")
            existing_req = existing_lead.get("requirements") or ""
            if incoming_req and incoming_req not in existing_req:
                update_data["requirements"] = f"{existing_req} | {incoming_req}".lstrip(" | ")
            
            # Take the max score or update it
            if data.get("lead_score") is not None:
                update_data["lead_score"] = max(existing_lead.get("lead_score", 0), data["lead_score"])
                
            # Elevate pipeline stage if needed
            if data.get("pipeline_stage"):
                update_data["pipeline_stage"] = data["pipeline_stage"]
                
            if data.get("notes"):
                existing_notes = existing_lead.get("notes") or ""
                update_data["notes"] = f"{existing_notes}\n[{datetime.now(timezone.utc).date()}] {data['notes']}".strip()

            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            logger.info(f"Duplicate lead detected. Merging details for LeadID={lead_id}.")
            return LeadService.update_lead(company_id, lead_id, update_data)

        # Create new lead if no duplicate exists
        payload = {
            **data,
            "company_id": company_id,
            "pipeline_stage": data.get("pipeline_stage") or "new",
            "source": data.get("source") or "chatbot",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        if not supabase_client:
            lid = str(uuid.uuid4())
            payload["id"] = lid
            mock_leads[lid] = payload
            logger.info(f"Mock Lead created: LeadID={lid}")
            return payload

        try:
            res = supabase_client.table("leads").insert(payload).execute()
            logger.info(f"Lead saved to DB: LeadID={res.data[0]['id']}")
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.error(f"Failed to insert lead into DB: {e}")
            raise RuntimeError(f"Database error during lead insertion: {e}")

    @staticmethod
    def get_lead(company_id: str, lead_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a lead record by ID, enforcing tenant isolation."""
        if not supabase_client:
            lead = mock_leads.get(lead_id)
            if lead and lead["company_id"] == company_id:
                return lead
            return None

        try:
            res = supabase_client.table("leads").select("*").eq("company_id", company_id).eq("id", lead_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error getting lead details: {e}")
            return None

    @staticmethod
    def update_lead(company_id: str, lead_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an existing lead record, enforcing tenant isolation."""
        if not supabase_client:
            lead = mock_leads.get(lead_id)
            if lead and lead["company_id"] == company_id:
                lead.update(data)
                lead["updated_at"] = datetime.now(timezone.utc).isoformat()
                return lead
            raise ValueError("Lead not found or unauthorized.")

        try:
            # We explicitly check company_id to enforce multi-tenant security boundary
            res = supabase_client.table("leads").update(data).eq("company_id", company_id).eq("id", lead_id).execute()
            if not res.data:
                raise ValueError("Lead not found or unauthorized.")
            return res.data[0]
        except Exception as e:
            logger.error(f"Error updating lead details: {e}")
            raise RuntimeError(f"Database error during lead update: {e}")

    @staticmethod
    def delete_lead(company_id: str, lead_id: str) -> bool:
        """Deletes a lead record by ID, enforcing tenant isolation."""
        if not supabase_client:
            lead = mock_leads.get(lead_id)
            if lead and lead["company_id"] == company_id:
                del mock_leads[lead_id]
                return True
            return False

        try:
            res = supabase_client.table("leads").delete().eq("company_id", company_id).eq("id", lead_id).execute()
            return len(res.data) > 0 if res.data else True
        except Exception as e:
            logger.error(f"Error deleting lead: {e}")
            return False

    @staticmethod
    def list_leads(company_id: str, page: int = 1, page_size: int = 10, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists and searches leads for a specific company, with pagination support."""
        if not supabase_client:
            all_list = [l for l in mock_leads.values() if l["company_id"] == company_id]
            if search:
                s = search.lower()
                all_list = [
                    l for l in all_list 
                    if s in (l.get("name") or "").lower() 
                    or s in (l.get("email") or "").lower() 
                    or s in (l.get("phone") or "").lower()
                ]
            start = (page - 1) * page_size
            return all_list[start:start+page_size]

        try:
            offset = (page - 1) * page_size
            query = supabase_client.table("leads").select("*").eq("company_id", company_id)
            
            if search:
                # Basic search by name, email, or phone
                query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,phone.ilike.%{search}%")
            
            res = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error listing leads: {e}")
            return []

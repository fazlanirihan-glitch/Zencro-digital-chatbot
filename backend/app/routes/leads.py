import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from app.core.security import get_current_user, require_role, CurrentUser
from app.services.db.lead import LeadService
from app.services.db.company import CompanyService

logger = logging.getLogger("app.routes.leads")

router = APIRouter(prefix="/leads", tags=["CRM Leads"])

# Input validation models
class CreateLeadPayload(BaseModel):
    session_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    business_name: Optional[str] = None
    industry: Optional[str] = None
    requirements: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    source: Optional[str] = "api"
    notes: Optional[str] = None

class UpdateLeadPayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    business_name: Optional[str] = None
    industry: Optional[str] = None
    requirements: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    lead_score: Optional[int] = None
    pipeline_stage: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_lead_route(payload: CreateLeadPayload):
    """
    Public or bot endpoint to record a lead.
    Defaults to the seeded ZenCro Digital company if no explicit company_id is provided.
    """
    company_id = CompanyService.get_default_company_id()
    try:
        lead = LeadService.create_or_update_lead(company_id, payload.dict(exclude_unset=True))
        return {"success": True, "lead": lead}
    except Exception as e:
        logger.error(f"Failed to save lead: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
async def list_leads_route(
    page: int = 1, 
    page_size: int = 10, 
    search: Optional[str] = None,
    current_user: CurrentUser = Depends(require_role(["owner", "admin"]))
):
    """
    Admin/Owner endpoint listing leads paginated. Enforces company filtering.
    """
    company_id = current_user.company_id
    leads = LeadService.list_leads(company_id, page=page, page_size=page_size, search=search)
    return {"success": True, "leads": leads, "page": page, "page_size": page_size}

@router.get("/{id}")
async def get_lead_details_route(
    id: str, 
    current_user: CurrentUser = Depends(require_role(["owner", "admin"]))
):
    """Retrieves lead detail parameters. Enforces company filtering."""
    company_id = current_user.company_id
    lead = LeadService.get_lead(company_id, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead record not found.")
    return {"success": True, "lead": lead}

@router.put("/{id}")
async def update_lead_route(
    id: str, 
    payload: UpdateLeadPayload,
    current_user: CurrentUser = Depends(require_role(["owner", "admin"]))
):
    """Updates lead score, pipeline stage, or contact profiles."""
    company_id = current_user.company_id
    try:
        updated = LeadService.update_lead(company_id, id, payload.dict(exclude_unset=True))
        return {"success": True, "lead": updated}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating lead record: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
async def delete_lead_route(
    id: str, 
    current_user: CurrentUser = Depends(require_role(["owner"]))
):
    """Deletes a lead record by ID. Restricted to the Owner role."""
    company_id = current_user.company_id
    success = LeadService.delete_lead(company_id, id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead record not found.")
    return {"success": True, "message": "Lead deleted successfully."}

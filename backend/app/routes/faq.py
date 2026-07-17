import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.core.security import get_current_user, require_role, CurrentUser
from app.services.db.faq import FAQService
from app.services.db.company import CompanyService

logger = logging.getLogger("app.routes.faq")

router = APIRouter(prefix="/faq", tags=["FAQ Manager"])

# Input validation model
class CreateFAQPayload(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None
    keywords: List[str] = []
    order_index: Optional[int] = 0

@router.get("")
async def list_faqs_route(
    page: int = 1,
    page_size: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    company_id: Optional[str] = None
):
    """
    Public endpoint to retrieve FAQs, ordered by index.
    Defaults to ZenCro Digital default company if company_id is not passed.
    """
    cid = company_id or CompanyService.get_default_company_id()
    faqs = FAQService.list_faqs(
        company_id=cid, page=page, page_size=page_size, category=category, search=search
    )
    return {"success": True, "faqs": faqs}

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_faq_route(
    payload: CreateFAQPayload,
    current_user: CurrentUser = Depends(require_role(["owner", "admin", "editor"]))
):
    """Secure endpoint to create an FAQ (restricted to team roles)."""
    company_id = current_user.company_id
    try:
        faq = FAQService.create_faq(company_id, payload.dict(exclude_unset=True))
        return {"success": True, "faq": faq}
    except Exception as e:
        logger.error(f"Failed to create FAQ: {e}")
        raise HTTPException(status_code=400, detail=str(e))

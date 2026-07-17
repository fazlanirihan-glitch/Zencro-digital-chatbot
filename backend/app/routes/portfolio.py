import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.core.security import get_current_user, require_role, CurrentUser
from app.services.db.portfolio import PortfolioService
from app.services.db.company import CompanyService

logger = logging.getLogger("app.routes.portfolio")

router = APIRouter(prefix="/portfolio", tags=["Portfolio Manager"])

# Input validation model
class CreatePortfolioPayload(BaseModel):
    title: str
    category: Optional[str] = None
    description: str
    technologies: List[str] = []
    website: Optional[str] = None
    image: Optional[str] = None
    featured: Optional[bool] = False
    live_url: Optional[str] = None
    github_url: Optional[str] = None

@router.get("")
async def list_portfolio_route(
    page: int = 1,
    page_size: int = 12,
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    company_id: Optional[str] = None
):
    """
    Public endpoint to retrieve portfolio items.
    Queries the default company if company_id parameter is omitted.
    """
    cid = company_id or CompanyService.get_default_company_id()
    projects = PortfolioService.list_portfolio_items(
        company_id=cid, page=page, page_size=page_size, category=category, featured=featured
    )
    return {"success": True, "projects": projects}

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_portfolio_route(
    payload: CreatePortfolioPayload,
    current_user: CurrentUser = Depends(require_role(["owner", "admin", "editor"]))
):
    """Secure endpoint for creating a portfolio item (restricted to team roles)."""
    company_id = current_user.company_id
    try:
        project = PortfolioService.create_portfolio_item(company_id, payload.dict(exclude_unset=True))
        return {"success": True, "project": project}
    except Exception as e:
        logger.error(f"Failed to create portfolio item: {e}")
        raise HTTPException(status_code=400, detail=str(e))

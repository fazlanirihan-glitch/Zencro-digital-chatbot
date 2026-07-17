from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel, Field
from typing import Optional, List
from app.services.supabase import supabase_service
from app.core.config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

# Request validation schemas
class LeadStatusUpdateRequest(BaseModel):
    status: str = Field(..., CHECK="status in ('new', 'contacted', 'qualified', 'closed_won', 'closed_lost', 'archived')")
    notes: Optional[str] = None

class FAQCreateRequest(BaseModel):
    question: str
    answer: str
    category: str = "General"

class PortfolioCreateRequest(BaseModel):
    title: str
    description: str
    client: Optional[str] = None
    results: Optional[str] = None
    stack: List[str] = []

# Dependency to check Supabase JWT auth token
async def get_current_admin(authorization: Optional[str] = Header(None)):
    """
    Dependency verifying the client Authorization header against Supabase Auth.
    If Supabase is mock-configured, accepts 'Bearer mock-admin-token'.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or format invalid (use Bearer <token>)"
        )
    
    token = authorization.split(" ")[1]

    # Handle Mock mode authorization
    if not settings.is_supabase_configured:
        if token == "mock-admin-token":
            return {"id": "mock-admin-id", "email": "admin@zencrodigital.in"}
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Use 'mock-admin-token' for local mock testing."
            )

    # Real Supabase Auth verification
    try:
        # We invoke auth.get_user using the current token.
        # This checks the token's signature, expiry, and retrieves the authenticated user details.
        user_response = supabase_service.client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_418_IM_A_TEAPOT, # Custom fallback code
                detail="Supabase user not found"
            )
        return user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


# --- 1. LEADS CRM PIPELINE ENDPOINTS ---

@router.get("/leads", dependencies=[Depends(get_current_admin)])
async def get_leads():
    """Fetch all leads sorted by date."""
    return supabase_service.get_leads()

@router.patch("/leads/{lead_id}", dependencies=[Depends(get_current_admin)])
async def update_lead_status(lead_id: str, request: LeadStatusUpdateRequest):
    """Update pipeline status or add manual notes to a lead."""
    updated = supabase_service.update_lead_status(
        lead_id=lead_id,
        status=request.status,
        notes=request.notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return {"status": "success", "lead": updated}

@router.delete("/leads/{lead_id}", dependencies=[Depends(get_current_admin)])
async def delete_lead(lead_id: str):
    """Delete a lead from the CRM table."""
    success = supabase_service.delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return {"status": "success"}


# --- 2. CONVERSATIONS AUDIT LOG ENDPOINTS ---

@router.get("/conversations", dependencies=[Depends(get_current_admin)])
async def get_conversations():
    """Fetch list of all active chat sessions, messages counts, and escalations."""
    return supabase_service.get_conversations()

@router.get("/conversations/{session_id}", dependencies=[Depends(get_current_admin)])
async def get_conversation_history(session_id: str):
    """Fetch the full user-bot message timeline for a session."""
    history = supabase_service.get_conversation_messages(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="Session has no message history.")
    return history


# --- 3. DYNAMIC KNOWLEDGE & FAQ MANAGEMENT ---

@router.get("/faqs")
async def get_faqs():
    """Fetch FAQs (Publicly readable, used by chatbot and admin UI)."""
    return supabase_service.get_faqs()

@router.post("/faqs", dependencies=[Depends(get_current_admin)])
async def create_faq(request: FAQCreateRequest):
    """Insert a new FAQ into the database."""
    return supabase_service.create_faq(
        question=request.question,
        answer=request.answer,
        category=request.category
    )

@router.delete("/faqs/{faq_id}", dependencies=[Depends(get_current_admin)])
async def delete_faq(faq_id: str):
    """Delete a FAQ record by ID."""
    success = supabase_service.delete_faq(faq_id)
    if not success:
        raise HTTPException(status_code=404, detail="FAQ not found.")
    return {"status": "success"}


# --- 4. PORTFOLIO MANAGER ---

@router.get("/portfolio")
async def get_portfolio():
    """Fetch ZenCro Digital's portfolio listings (Publicly readable)."""
    return supabase_service.get_portfolio()

@router.post("/portfolio", dependencies=[Depends(get_current_admin)])
async def create_portfolio_item(request: PortfolioCreateRequest):
    """Create a new portfolio entry."""
    return supabase_service.create_portfolio(
        title=request.title,
        description=request.description,
        client=request.client,
        results=request.results,
        stack=request.stack
    )


# --- 5. ANALYTICS ---

@router.get("/analytics", dependencies=[Depends(get_current_admin)])
async def get_analytics():
    """Fetch analytics dashboard KPI metrics."""
    return supabase_service.get_analytics()

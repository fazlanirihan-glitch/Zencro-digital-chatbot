import logging
from typing import List, Dict, Any, Optional
from fastapi import Header, HTTPException, status, Depends
from pydantic import BaseModel
from app.core.config import settings
from app.services.supabase import supabase_client
from app.services.db.company import CompanyService

logger = logging.getLogger("app.core.security")

class CurrentUser(BaseModel):
    user_id: str
    company_id: str
    role: str  # 'owner', 'admin', 'editor'

def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    """Extracts the Bearer token from the Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing."
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Use 'Bearer <token>'."
        )
        
    return parts[1]

async def get_current_user(token: str = Depends(get_token_from_header)) -> CurrentUser:
    """
    Verifies the JWT token against Supabase Auth.
    Fetches the associated company and role from user_roles.
    """
    # 1. Mock Mode Fallback for local testing
    if not supabase_client:
        # Accept mock tokens
        if token == "mock-owner-token":
            return CurrentUser(user_id="mock-owner-id", company_id=CompanyService.get_default_company_id(), role="owner")
        elif token == "mock-admin-token":
            return CurrentUser(user_id="mock-admin-id", company_id=CompanyService.get_default_company_id(), role="admin")
        elif token == "mock-editor-token":
            return CurrentUser(user_id="mock-editor-id", company_id=CompanyService.get_default_company_id(), role="editor")
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mock credentials."
            )

    # 2. Production Mode: Verify with Supabase Auth API
    try:
        user_res = supabase_client.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token."
            )
            
        uid = user_res.user.id
        
        # Look up role & company associated with this user
        res = supabase_client.table("user_roles").select("*").eq("user_id", uid).execute()
        if not res.data:
            # Fallback if user exists in auth but lacks role mapping
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role mapping not configured. Contact your platform administrator."
            )
            
        role_info = res.data[0]
        return CurrentUser(
            user_id=uid,
            company_id=role_info["company_id"],
            role=role_info["role"]
        )
    except Exception as e:
        logger.error(f"Authentication token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

def require_role(allowed_roles: List[str]):
    """Route dependency decorator ensuring the user holds specific RBAC roles."""
    def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}. Current role: {user.role}"
            )
        return user
    return dependency

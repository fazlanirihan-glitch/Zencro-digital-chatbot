import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from app.services.supabase import supabase_client
from app.core.security import get_current_user, CurrentUser

logger = logging.getLogger("app.routes.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Validation models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    new_password: str
    access_token: str

class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"

class UserProfileResponse(BaseModel):
    user_id: str
    company_id: str
    role: str

@router.post("/login", response_model=AuthTokenResponse)
async def login_endpoint(payload: LoginRequest):
    """
    Logs in user with email and password. Returns access/refresh token payloads.
    """
    email = payload.email
    password = payload.password

    # Mock login fallback
    if not supabase_client:
        if email == "owner@test.com" and password == "password123":
            return AuthTokenResponse(access_token="mock-owner-token", refresh_token="mock-owner-refresh", expires_in=3600)
        elif email == "admin@test.com" and password == "password123":
            return AuthTokenResponse(access_token="mock-admin-token", refresh_token="mock-admin-refresh", expires_in=3600)
        elif email == "editor@test.com" and password == "password123":
            return AuthTokenResponse(access_token="mock-editor-token", refresh_token="mock-editor-refresh", expires_in=3600)
        else:
            raise HTTPException(status_code=401, detail="Invalid test credentials.")

    try:
        res = supabase_client.auth.sign_in_with_password({"email": email, "password": password})
        if not res or not res.session:
            raise HTTPException(status_code=401, detail="Authentication failed.")
            
        return AuthTokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
            expires_in=res.session.expires_in
        )
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@router.post("/logout")
async def logout_endpoint(authorization: Optional[str] = Header(None)):
    """Logs out user by terminating token session."""
    if not authorization:
        raise HTTPException(status_code=400, detail="Missing authorization header.")

    if not supabase_client:
        logger.info("Mock user logged out successfully.")
        return {"success": True, "message": "Mock logged out successfully."}

    try:
        token = authorization.split()[1]
        supabase_client.auth.sign_out(token)
        return {"success": True, "message": "Logged out successfully."}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log out.")

@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh_endpoint(payload: RefreshRequest):
    """Generates a new access token using a refresh token."""
    if not supabase_client:
        return AuthTokenResponse(access_token="mock-refreshed-token", refresh_token="mock-refreshed-refresh", expires_in=3600)

    try:
        res = supabase_client.auth.refresh_session(payload.refresh_token)
        if not res or not res.session:
            raise HTTPException(status_code=401, detail="Refresh session failed.")
        return AuthTokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
            expires_in=res.session.expires_in
        )
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

@router.post("/forgot-password")
async def forgot_password_endpoint(payload: ForgotPasswordRequest):
    """Sends recovery instructions email to user."""
    if not supabase_client:
        logger.info(f"Mock password recovery triggered for email: {payload.email}")
        return {"success": True, "message": "Mock recovery email sent."}

    try:
        supabase_client.auth.reset_password_for_email(payload.email)
        return {"success": True, "message": "Recovery instructions sent."}
    except Exception as e:
        logger.error(f"Forgot password trigger failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger recovery email.")

@router.post("/reset-password")
async def reset_password_endpoint(payload: ResetPasswordRequest):
    """Applies new password using reset access token."""
    if not supabase_client:
        logger.info("Mock password update succeeded.")
        return {"success": True, "message": "Mock password updated."}

    try:
        # In Supabase, password updates require active session context.
        # We can update the client credentials using the token, then set the password.
        supabase_client.auth.set_session(payload.access_token)
        supabase_client.auth.update_user({"password": payload.new_password})
        return {"success": True, "message": "Password updated successfully."}
    except Exception as e:
        logger.error(f"Password reset failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to reset password: {str(e)}")

@router.get("/me", response_model=UserProfileResponse)
async def me_endpoint(current_user: CurrentUser = Depends(get_current_user)):
    """Returns profile and RBAC role properties of the active user session."""
    return UserProfileResponse(
        user_id=current_user.user_id,
        company_id=current_user.company_id,
        role=current_user.role
    )

import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.routes.auth import get_current_user
from app.services.supabase import supabase_client
from app.services.db.company import CompanyService

logger = logging.getLogger("app.routes.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics Dashboard"])

@router.get("/dashboard-metrics")
async def get_dashboard_metrics(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns aggregated metrics for the Phase 6 Admin Dashboard Home.
    Calculates Leads, Conversions, AI Response Times, etc.
    """
    company_id = CompanyService.get_default_company_id()
    
    metrics = {
        "total_conversations": 0,
        "active_sessions": 0,
        "total_leads": 0,
        "today_leads": 0,
        "conversion_rate": 0.0,
        "avg_response_time_ms": 0,
        "system_health": "Healthy",
        "database_health": "Healthy",
        "total_companies": 1,
        "storage_usage_mb": 0
    }
    
    if not supabase_client:
        # Return mock metrics if DB is offline
        metrics["total_conversations"] = 142
        metrics["active_sessions"] = 3
        metrics["total_leads"] = 45
        metrics["today_leads"] = 4
        metrics["conversion_rate"] = 31.7
        metrics["avg_response_time_ms"] = 1250
        metrics["database_health"] = "Mock Mode"
        return metrics

    try:
        # 1. Total Conversations & Avg Response Time
        conv_res = supabase_client.table("conversations").select("session_id, response_time").eq("company_id", company_id).execute()
        if conv_res.data:
            unique_sessions = set(c["session_id"] for c in conv_res.data)
            metrics["total_conversations"] = len(unique_sessions)
            metrics["active_sessions"] = min(len(unique_sessions), 5) # Rough estimate for active
            
            times = [c["response_time"] for c in conv_res.data if c["response_time"]]
            if times:
                metrics["avg_response_time_ms"] = int(sum(times) / len(times))

        # 2. Total Leads & Conversion Rate
        leads_res = supabase_client.table("leads").select("id, created_at").eq("company_id", company_id).execute()
        if leads_res.data:
            metrics["total_leads"] = len(leads_res.data)
            
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            today_leads = [
                L for L in leads_res.data 
                if L.get("created_at") and L["created_at"][:10] == now.isoformat()[:10]
            ]
            metrics["today_leads"] = len(today_leads)

            # Conversion Rate = Leads / Unique Sessions
            if metrics["total_conversations"] > 0:
                metrics["conversion_rate"] = round((metrics["total_leads"] / metrics["total_conversations"]) * 100, 1)

        # 3. Knowledge Storage Usage Estimate
        k_res = supabase_client.table("knowledge_files").select("size_bytes").eq("company_id", company_id).execute()
        if k_res.data:
            total_bytes = sum(f.get("size_bytes", 0) for f in k_res.data)
            metrics["storage_usage_mb"] = round(total_bytes / (1024 * 1024), 2)

    except Exception as e:
        logger.error(f"Error fetching analytics metrics: {e}")
        metrics["database_health"] = "Degraded"

    return metrics

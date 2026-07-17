import time
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.core.config import settings
from app.services.retrieval.memory import InMemoryRetrievalService
from app.services.ai.gemini import gemini_service
from app.services.memory import memory_service
from app.services.db.company import CompanyService
from app.services.db.lead import LeadService
from app.services.db.conversation import ConversationService

logger = logging.getLogger("app.routes.chat")

router = APIRouter(tags=["Chat Engine"])

# Initialize RAG engine globally
retrieval_service = InMemoryRetrievalService()

# Global startup reference for uptime calculations
server_startup_time = time.time()

# Request/Response validation schemas
class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's query text.")
    session_id: str = Field(..., description="Unique conversational session identifier.")

class LeadDetailsResponse(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    business_name: Optional[str] = None
    industry: Optional[str] = None
    requirements: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    confidence_score: Optional[float] = None

class ChatResponse(BaseModel):
    success: bool = True
    reply: str
    sources: List[str]
    lead_detected: bool = False
    lead_details: LeadDetailsResponse
    response_time_ms: int
    model: str = settings.GEMINI_MODEL

from fastapi.responses import StreamingResponse
import json

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, req_meta: Request):
    """
    Core chatbot API. Handles session retrieval, RAG search over local folders,
    streaming Gemini response generation, token counting, intent extraction, and response time metrics.
    """
    start_time = time.time()
    
    # Generate unique request id for tracing
    request_id = getattr(req_meta.state, "request_id", "unknown-req")
    session_id = request.session_id.strip()
    message = request.message.strip()

    if not session_id or not message:
        raise HTTPException(status_code=400, detail="session_id and message must not be empty.")

    # 1. Fetch/scaffold session context in memory
    session = memory_service.get_or_create_session(session_id)
    
    # Store user query in history
    session.add_message("user", message)
    
    # 2. Retrieve dynamic context from RAG engine
    context, sources = retrieval_service.retrieve_context(message)
    
    # 3. Reload prompt instructions from files to prevent hardcoding
    base_prompt = gemini_service._load_prompt_file("system_prompt.txt", 
        "You are an assistant. Answer questions using the context.")
    rules_prompt = gemini_service._load_prompt_file("assistant_rules.txt", 
        "Keep answers short and assist the user.")
    
    # Append RAG data
    full_instruction = (
        f"{base_prompt}\n\n"
        f"--- CONVERSATION GUARDRAILS ---\n"
        f"{rules_prompt}\n\n"
        f"--- DYNAMIC COMPANY KNOWLEDGE CONTEXT ---\n"
        f"{context}\n\n"
        f"Answer the user using only the context above. If you don't have it, say: 'I don't have that information yet.'"
    )

    async def event_generator():
        reply_buffer = ""
        try:
            # 4. Generate bot response (Streaming)
            for chunk in gemini_service.generate_response_stream(
                system_instruction=full_instruction,
                history=session.messages[:-1],
                query=message
            ):
                reply_buffer += chunk
                # Yield SSE chunk
                yield f"event: message\ndata: {json.dumps({'chunk': chunk})}\n\n"
                
            # 5. Post-Processing
            session.add_message("bot", reply_buffer)
            transcript = "\n".join([f"{m['sender']}: {m['content']}" for m in session.messages])
            
            # Analyze transcript in parallel if possible, but sequential is fine for now
            analysis = gemini_service.analyze_transcript(transcript)
            lead_detected = analysis.get("lead_detected", False)
            extracted_details = analysis.get("lead_details", {})
            session.update_preferences(extracted_details)

            company_id = CompanyService.get_default_company_id()

            # Save lead dynamically on buying intent detection
            if lead_detected and extracted_details:
                try:
                    lead_payload = {
                        "session_id": session_id,
                        "name": extracted_details.get("name"),
                        "phone": extracted_details.get("phone"),
                        "email": extracted_details.get("email"),
                        "business_name": extracted_details.get("business_name"),
                        "industry": extracted_details.get("industry"),
                        "requirements": extracted_details.get("requirements"),
                        "budget": extracted_details.get("budget"),
                        "timeline": extracted_details.get("timeline"),
                        "lead_score": int((extracted_details.get("confidence_score") or 0.8) * 100),
                        "notes": f"Captured automatically during session: {session_id}."
                    }
                    LeadService.create_or_update_lead(company_id, lead_payload)
                except Exception as e:
                    logger.error(f"Failed to auto-save lead: {e}")
                    
            # 6. Generate Dynamic Suggestions
            suggestions = gemini_service.generate_dynamic_suggestions(session.messages, reply_buffer)

            # Calculate response metrics
            response_time = int((time.time() - start_time) * 1000)
            token_usage = gemini_service.count_tokens(full_instruction) + gemini_service.count_tokens(reply_buffer)

            # Save interaction turn in database
            try:
                ConversationService.create_conversation_turn(company_id, {
                    "session_id": session_id,
                    "user_message": message,
                    "assistant_message": reply_buffer,
                    "retrieved_sources": sources,
                    "model_used": settings.GEMINI_MODEL,
                    "response_time": response_time,
                    "token_usage": token_usage
                })
            except Exception as e:
                logger.error(f"Failed to save conversation turn: {e}")

            logger.info(
                f"RequestID={request_id} CompanyID={company_id} SessionID={session_id} Model={settings.GEMINI_MODEL} "
                f"ResponseTimeMS={response_time} LeadDetected={lead_detected} TokenUsage={token_usage} Sources={sources}"
            )

            # Send final metadata event
            metadata = {
                "lead_detected": lead_detected,
                "lead_details": extracted_details,
                "sources": sources,
                "suggestions": suggestions,
                "response_time_ms": response_time,
                "model": settings.GEMINI_MODEL
            }
            yield f"event: metadata\ndata: {json.dumps(metadata)}\n\n"
            
        except Exception as e:
            logger.error(f"Error in chat stream: {e}")
            yield f"event: error\ndata: {json.dumps({'detail': 'An error occurred during generation'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/health")
async def health_endpoint():
    """Verifies operational status of FastAPI, Gemini, and RAG loader."""
    gemini_status = "configured" if settings.is_gemini_configured else "unconfigured"
    loader_status = "loaded" if len(retrieval_service.chunks) > 0 else "empty"
    
    # Basic ping logic to verify connection
    if settings.is_gemini_configured and gemini_service.client:
        try:
            gemini_service.count_tokens("Ping")
            gemini_conn = "online"
        except Exception:
            gemini_conn = "offline"
    else:
        gemini_conn = "mock-mode"

    return {
        "status": "healthy",
        "components": {
            "server": "online",
            "gemini_connection": gemini_status,
            "gemini_api_status": gemini_conn,
            "knowledge_loader": loader_status,
            "retrieval_engine": "active"
        },
        "version": settings.VERSION
    }

@router.get("/status")
async def status_endpoint():
    """Provides server stats, loaded docs listing, and uptime metrics."""
    uptime = time.time() - server_startup_time
    return {
        "server_uptime_seconds": round(uptime, 1),
        "gemini_model": settings.GEMINI_MODEL,
        "total_knowledge_files": len(retrieval_service.get_loaded_documents()),
        "loaded_categories": retrieval_service.get_loaded_categories(),
        "loaded_documents": retrieval_service.get_loaded_documents()
    }

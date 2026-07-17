import time
import uuid
import logging
from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes.chat import router as chat_router, retrieval_service
from app.routes.auth import router as auth_router
from app.routes.leads import router as leads_router
from app.routes.portfolio import router as portfolio_router
from app.routes.faq import router as faq_router
from app.routes.knowledge import router as knowledge_router
from app.routes.analytics import router as analytics_router
from app.services.db.company import CompanyService

# Initialize structured logging configuration
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)

logger = logging.getLogger("app.main")

app = FastAPI(
    title="Branding-Agnostic SaaS Chatbot Engine Backend",
    description=(
        "Production-ready multi-company SaaS backend for conversational AI "
        "and lead qualification. Supports dynamic in-memory knowledge "
        "retrieval (RAG), JWT session authentication, and RBAC security."
    ),
    version=settings.VERSION,
    docs_url="/docs",       # Enable Swagger UI
    redoc_url="/redoc"      # Enable ReDoc UI
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured Logging and Request-Tracing Middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    start_time = time.time()

    # Process request
    try:
        response = await call_next(request)
        response_time = int((time.time() - start_time) * 1000)
        
        # Log response statistics
        logger.info(
            f"RequestID={request_id} Method={request.method} Path={request.url.path} "
            f"Status={response.status_code} LatencyMS={response_time}"
        )
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        response_time = int((time.time() - start_time) * 1000)
        logger.error(
            f"RequestID={request_id} Method={request.method} Path={request.url.path} "
            f"Error={str(e)} LatencyMS={response_time}"
        )
        raise e


# Create versioned v1 namespace router
api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(chat_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(leads_router)
api_v1_router.include_router(portfolio_router)
api_v1_router.include_router(faq_router)
api_v1_router.include_router(knowledge_router)
api_v1_router.include_router(analytics_router)

# Mount versioned API routes
app.include_router(api_v1_router)

# Also expose basic global endpoints for root paths compatibility
app.include_router(chat_router)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up SaaS Chatbot Engine Backend...")
    # Scan and load document sections
    retrieval_service.reload_knowledge()
    # Seed default tenant (ZenCro Digital) and cache company ID
    CompanyService.seed_default_company()


@app.get("/")
async def root():
    return {
        "engine": "SaaS Chatbot AI Engine",
        "version": settings.VERSION,
        "swagger_docs": "/docs",
        "health_check": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

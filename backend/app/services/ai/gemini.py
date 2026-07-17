import logging
import json
import threading
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings
from app.services.ai.base import BaseAIService

logger = logging.getLogger("app.services.ai.gemini")

# Pydantic schemas for structured extraction
class LeadDetailsModel(BaseModel):
    name: Optional[str] = Field(None, description="The customer's full name if provided.")
    phone: Optional[str] = Field(None, description="The customer's contact phone number.")
    email: Optional[str] = Field(None, description="The customer's email address.")
    business_name: Optional[str] = Field(None, description="The name of the customer's business or company.")
    industry: Optional[str] = Field(None, description="The business niche or industry category (e.g. Gym, Restaurant, School).")
    requirements: Optional[str] = Field(None, description="A summary of what user needs built or automated.")
    budget: Optional[str] = Field(None, description="User budget details if mentioned.")
    timeline: Optional[str] = Field(None, description="Project delivery timeline if specified.")
    confidence_score: Optional[float] = Field(None, description="Confidence score from 0.0 to 1.0 that this matches a real business inquiry.")

class StructuredLeadAnalysis(BaseModel):
    lead_detected: bool = Field(False, description="Set to true if user shows intent to buy, hire, or request a custom quote.")
    lead_details: LeadDetailsModel = Field(default_factory=LeadDetailsModel)

class GeminiService(BaseAIService):
    _instance: Optional['GeminiService'] = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs) -> 'MemoryService':
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(GeminiService, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        
        self.client: Optional[genai.Client] = None
        if settings.is_gemini_configured:
            try:
                # Initialize Gemini GenAI client with HTTP timeout configuration options
                self.client = genai.Client(
                    api_key=settings.GEMINI_API_KEY,
                    http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_SECONDS)
                )
                logger.info(f"Gemini AI Client initialized successfully using model {settings.GEMINI_MODEL}.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
        else:
            logger.warning("GEMINI_API_KEY not configured. Running in MOCK AI mode.")
            
        self._initialized = True

    def _load_prompt_file(self, filename: str, fallback: str) -> str:
        """Loads prompt templates dynamically from the knowledge prompts directory."""
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        knowledge_dir = os.path.join(base_dir, "knowledge")
        if not os.path.exists(knowledge_dir):
            parent_check = os.path.join(os.path.dirname(base_dir), "knowledge")
            if os.path.exists(parent_check):
                knowledge_dir = parent_check
                
        filepath = os.path.join(knowledge_dir, "prompts", filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except Exception as e:
                logger.error(f"Error reading prompt file {filepath}: {e}")
        return fallback

    @retry(
        stop=stop_after_attempt(settings.GEMINI_MAX_RETRIES),
        wait=wait_exponential(multiplier=1.5, min=2, max=6),
        retry=retry_if_exception_type((APIError, Exception)),
        reraise=True
    )
    def _call_gemini_with_retry(self, contents: List[Any], config: types.GenerateContentConfig) -> Any:
        """Invokes Gemini generate_content wrapper wrapped inside tenacity retry backoffs."""
        if not self.client:
            raise RuntimeError("Gemini Client is not configured.")
        return self.client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=config
        )

    def count_tokens(self, text: str) -> int:
        """Counts total tokens for a text query block to prevent prompt overflow."""
        if not self.client:
            return len(text.split())  # Mock token approximation
        try:
            res = self.client.models.count_tokens(
                model=settings.GEMINI_MODEL,
                contents=text
            )
            return res.total_tokens
        except Exception as e:
            logger.warning(f"Failed to count tokens: {e}")
            return len(text.split())

    def generate_response(self, system_instruction: str, history: List[Dict[str, str]], query: str) -> str:
        """Generates conversational chat responses."""
        if not self.client:
            return self._generate_mock_response(query)

        # Build contents structure including conversational history
        contents = []
        for msg in history:
            role = "user" if msg["sender"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

        # Add the current user query
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=query)]
            )
        )

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.6,
                max_output_tokens=1000
            )
            
            response = self._call_gemini_with_retry(contents, config)
            return response.text
        except Exception as e:
            logger.error(f"Error generating response from Gemini API: {e}")
            return "I apologize, I encountered an issue connecting to my brain. Please try again in a few seconds."

    def analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        """Runs structured analysis over the conversation to extract buying intent and details."""
        default_analysis = {
            "lead_detected": False,
            "lead_details": {
                "name": None, "phone": None, "email": None, "business_name": None,
                "industry": None, "requirements": None, "budget": None, "timeline": None,
                "confidence_score": None
            }
        }

        if not self.client:
            return self._mock_analyze_transcript(transcript)

        prompt = (
            f"Analyze the following conversation transcript between a customer and our assistant bot.\n"
            f"Determine if the user shows buying intent (wants to hire, buy, build, or get a custom quote).\n"
            f"Extract any details provided. Return null for fields not mentioned. Do not hallucinate.\n\n"
            f"Transcript:\n{transcript}"
        )

        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StructuredLeadAnalysis,
                temperature=0.0
            )
            
            response = self._call_gemini_with_retry([prompt], config)
            data = json.loads(response.text)
            return data
        except Exception as e:
            logger.error(f"Structured lead analysis failed: {e}")
            return default_analysis

    def _generate_mock_response(self, query: str) -> str:
        """Returns mock chat responses in local offline testing."""
        query_lower = query.lower()
        if "pricing" in query_lower or "cost" in query_lower or "price" in query_lower:
            return "I don't have specific pricing packages loaded in this mock view. Please configure your GEMINI_API_KEY in the backend .env configuration file."
        return "Hello! I am currently running in offline mock mode. Please configure your API credentials in the environment variables to activate full capability."

    def _mock_analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        """Offline parser returning formatted structures for tests."""
        import re
        data = {
            "lead_detected": False,
            "lead_details": {
                "name": None, "phone": None, "email": None, "business_name": None,
                "industry": None, "requirements": None, "budget": None, "timeline": None,
                "confidence_score": None
            }
        }

        # Naive check for testing
        if "Bruce Wayne" in transcript:
            data["lead_detected"] = True
            data["lead_details"]["name"] = "Bruce Wayne"
            data["lead_details"]["email"] = "bruce@wayne.com"
            data["lead_details"]["phone"] = "1234567890"
            data["lead_details"]["requirements"] = "Wayne Enterprises e-commerce website."
            data["lead_details"]["confidence_score"] = 0.95

        return data

    def generate_response_stream(self, system_instruction: str, history: List[Dict[str, str]], query: str):
        """Generates conversational chat responses via streaming generator."""
        if not self.client:
            mock_text = self._generate_mock_response(query)
            # Yield mock tokens to simulate streaming
            words = mock_text.split(" ")
            for w in words:
                import time
                time.sleep(0.05)
                yield w + " "
            return

        contents = []
        for msg in history:
            role = "user" if msg["sender"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=query)]
            )
        )

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.6,
                max_output_tokens=1000
            )
            
            response_stream = self.client.models.generate_content_stream(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=config
            )
            
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Error streaming response from Gemini API: {e}")
            yield "I apologize, I encountered an issue connecting to my brain. Please try again in a few seconds."

    def generate_dynamic_suggestions(self, history: List[Dict[str, str]], latest_reply: str) -> List[str]:
        """Generates 3-4 short, action-oriented contextual suggestions."""
        if not self.client:
            return ["Get a Quote", "View Portfolio", "Contact Us", "Pricing"]

        prompt = (
            f"Based on the following conversation and the assistant's latest reply, suggest 3-4 short, action-oriented follow-up questions or actions the user could take.\n"
            f"Requirements:\n"
            f"- Short (2-4 words maximum per suggestion)\n"
            f"- Action-oriented (e.g., 'Get a Quote', 'View Portfolio')\n"
            f"- Return ONLY a JSON array of strings. No markdown, no explanations.\n\n"
            f"Assistant's Latest Reply: {latest_reply}"
        )

        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
            response = self._call_gemini_with_retry([prompt], config)
            suggestions = json.loads(response.text)
            if isinstance(suggestions, list):
                return suggestions[:4]
            return ["Get a Quote", "View Portfolio", "Contact Us"]
        except Exception as e:
            logger.error(f"Failed to generate dynamic suggestions: {e}")
            return ["Get a Quote", "View Portfolio", "Contact Us"]

# Global singleton handle
gemini_service = GeminiService()

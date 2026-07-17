import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("app.services.memory")

class SessionMemory:
    """Stores the active session information and extracted parameters in memory."""
    def __init__(self, session_id: str):
        self.session_id: str = session_id
        self.messages: List[Dict[str, str]] = []  # List of {"sender": "user" | "bot", "content": "..."}
        
        # User details and preferences
        self.user_name: Optional[str] = None
        self.preferred_language: str = "English"
        self.business_category: Optional[str] = None
        self.interested_services: List[str] = []
        self.budget_discussions: List[str] = []
        
        # Contact details
        self.email: Optional[str] = None
        self.phone: Optional[str] = None
        self.business_name: Optional[str] = None
        
        # Dialogue metadata
        self.previous_questions: List[str] = []
        self.current_conversation_stage: str = "greeting"  # Stages: greeting, qualification, pricing, lead_capture, escalation, finished
        self.metadata: Dict[str, Any] = {}

    def add_message(self, sender: str, content: str) -> None:
        """Appends a user/bot message to history."""
        self.messages.append({"sender": sender, "content": content})

    def update_preferences(self, data: Dict[str, Any]) -> None:
        """
        Updates session attributes using details extracted by the AI service.
        Does not overwrite existing values with None/empty strings.
        """
        if data.get("name"):
            self.user_name = data["name"]
        if data.get("email"):
            self.email = data["email"]
        if data.get("phone"):
            self.phone = data["phone"]
        if data.get("business_name"):
            self.business_name = data["business_name"]
            
        if data.get("industry") and not self.business_category:
            self.business_category = data["industry"]
            
        if data.get("requirements") and data["requirements"] not in self.interested_services:
            self.interested_services.append(data["requirements"])
            
        if data.get("budget") and data["budget"] not in self.budget_discussions:
            self.budget_discussions.append(data["budget"])

        # Record timeline if exists
        if data.get("timeline"):
            self.metadata["timeline"] = data["timeline"]

    def to_dict(self) -> Dict[str, Any]:
        """Dumps session context variables for diagnostic outputs."""
        return {
            "session_id": self.session_id,
            "user_name": self.user_name,
            "preferred_language": self.preferred_language,
            "business_category": self.business_category,
            "interested_services": self.interested_services,
            "budget_discussions": self.budget_discussions,
            "email": self.email,
            "phone": self.phone,
            "business_name": self.business_name,
            "previous_questions": self.previous_questions,
            "current_conversation_stage": self.current_conversation_stage,
            "metadata": self.metadata,
            "history_length": len(self.messages)
        }


class MemoryService:
    """Singleton session container manager."""
    _instance: Optional['MemoryService'] = None

    def __new__(cls) -> 'MemoryService':
        if cls._instance is None:
            cls._instance = super(MemoryService, cls).__new__(cls)
            cls._instance.sessions = {}
            logger.info("Session Memory Service initialized.")
        return cls._instance

    def get_or_create_session(self, session_id: str) -> SessionMemory:
        """Retrieves or scaffolds a SessionMemory instance for the given identifier."""
        if not session_id or not session_id.strip():
            session_id = "default-session"
            
        if session_id not in self.sessions:
            logger.debug(f"Scaffolding new memory context for session: {session_id}")
            self.sessions[session_id] = SessionMemory(session_id)
        return self.sessions[session_id]

    def clear_session(self, session_id: str) -> bool:
        """Removes a session context entirely from memory."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.debug(f"Cleared memory session: {session_id}")
            return True
        return False

    def get_all_sessions(self) -> Dict[str, SessionMemory]:
        """Returns all active sessions."""
        return self.sessions

# Global singleton handle
memory_service = MemoryService()

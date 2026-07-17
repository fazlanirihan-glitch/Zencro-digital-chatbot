import logging
from abc import ABC, abstractmethod
from typing import Dict, Any

logger = logging.getLogger("app.services.channels.whatsapp")

class WhatsAppProvider(ABC):
    """
    Abstract Interface for WhatsApp Business API integration.
    Prepares the architecture for Meta Graph API or Twilio.
    """

    @abstractmethod
    def parse_incoming_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts sender phone, message text, and media from provider-specific payload."""
        pass

    @abstractmethod
    async def send_text_message(self, phone_number: str, message: str) -> bool:
        """Sends a standard text message back to the user."""
        pass

    @abstractmethod
    async def send_template_message(self, phone_number: str, template_name: str, language: str = "en_US") -> bool:
        """Sends a pre-approved Meta template message."""
        pass

class WhatsAppEngine:
    def __init__(self, provider: WhatsAppProvider):
        self.provider = provider

    def map_phone_to_session(self, phone_number: str) -> str:
        """
        Maps a WhatsApp phone number to a consistent Chatbot session ID.
        This allows the AI memory service to recall previous WhatsApp conversations.
        """
        # In a real implementation, look up the active session_id in the DB via phone_number
        return f"wa_sess_{phone_number}"

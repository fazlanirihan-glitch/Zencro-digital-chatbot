import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, AsyncGenerator

logger = logging.getLogger("app.services.channels.voice")

class VoiceProvider(ABC):
    """
    Abstract Interface for Voice AI integration.
    Allows hot-swapping providers (e.g. Google Cloud Speech, Deepgram, ElevenLabs) 
    without changing business logic.
    """
    
    @abstractmethod
    async def transcribe_audio_stream(self, audio_chunk: bytes) -> str:
        """Converts incoming audio bytes to text (STT)."""
        pass

    @abstractmethod
    async def synthesize_speech_stream(self, text_chunk: str) -> AsyncGenerator[bytes, None]:
        """Converts text chunks into streaming audio bytes (TTS)."""
        pass

class VoiceSessionManager:
    """
    Manages active voice WebSocket connections, handling VAD 
    (Voice Activity Detection) and AI interruptions.
    """
    def __init__(self, provider: VoiceProvider):
        self.provider = provider
        self.active_sessions: Dict[str, Any] = {}

    def register_session(self, session_id: str):
        self.active_sessions[session_id] = {"status": "listening", "interrupted": False}
        logger.info(f"Voice Session Registered: {session_id}")

    def interrupt_ai(self, session_id: str):
        """Called when user starts speaking while AI is playing."""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["interrupted"] = True
            logger.info(f"AI Interrupted in session: {session_id}")

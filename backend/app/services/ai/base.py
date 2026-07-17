from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseAIService(ABC):
    @abstractmethod
    def generate_response(self, system_instruction: str, history: List[Dict[str, str]], query: str) -> str:
        """
        Generates conversational response using chat history and prompt instructions.
        """
        pass

    @abstractmethod
    def analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Analyzes conversation transcripts to extract structured lead details and intent flags.
        """
        pass

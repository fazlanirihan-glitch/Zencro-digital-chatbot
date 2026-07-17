from abc import ABC, abstractmethod
from typing import List, Tuple

class BaseKnowledgeRetrieval(ABC):
    @abstractmethod
    def retrieve_context(self, query: str, limit: int = 5) -> Tuple[str, List[str]]:
        """
        Given a user query, search the knowledge folders and return:
        (formatted_context_string, list_of_matching_source_relative_paths)
        """
        pass

    @abstractmethod
    def reload_knowledge(self) -> None:
        """
        Re-scans directories and loads documents into memory.
        """
        pass

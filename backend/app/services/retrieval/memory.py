import os
import re
import logging
from typing import List, Dict, Any, Tuple, Set
from app.core.config import settings
from app.services.retrieval.base import BaseKnowledgeRetrieval

logger = logging.getLogger("app.services.retrieval.memory")

class InMemoryRetrievalService(BaseKnowledgeRetrieval):
    """
    Advanced In-Memory Knowledge Engine.
    Dynamically loads all Markdown/Text files from the knowledge directory and performs
    multi-factor context retrieval based on headings, keywords, phrase containment, and file priority.
    """
    def __init__(self, knowledge_dir: str = None):
        if not knowledge_dir:
            # Resolve relative to the backend root directory
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            knowledge_dir = os.path.join(base_dir, "knowledge")
            
            # Fallback if executing from nested environments
            if not os.path.exists(knowledge_dir):
                parent_check = os.path.join(os.path.dirname(base_dir), "knowledge")
                if os.path.exists(parent_check):
                    knowledge_dir = parent_check

        self.knowledge_dir = knowledge_dir
        self.chunks: List[Dict[str, Any]] = []
        self.loaded_categories: Set[str] = set()
        self.loaded_documents: List[str] = []
        
        self.stopwords = {
            "what", "is", "the", "a", "an", "and", "or", "but", "if", "then", "else",
            "to", "for", "in", "on", "at", "by", "with", "about", "against", "between",
            "into", "through", "during", "before", "after", "above", "below", "from",
            "up", "down", "out", "off", "over", "under", "once", "here", "there", 
            "when", "where", "why", "how", "all", "any", "both", "each", "few", 
            "more", "most", "other", "some", "such", "no", "nor", "not", "only", 
            "own", "same", "so", "than", "too", "very", "can", "will", "just", 
            "should", "now", "i", "me", "my", "we", "our", "you", "your", "he", 
            "him", "his", "she", "her", "it", "its", "they", "them", "their",
            "am", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "doing"
        }
        
        self.reload_knowledge()

    def reload_knowledge(self, company_id: str = "default_company") -> None:
        """Dynamically scans the isolated company folder and indexes markdown files."""
        self.chunks = []
        self.loaded_categories = set()
        self.loaded_documents = []

        company_dir = os.path.join(self.knowledge_dir, company_id)
        if not os.path.exists(company_dir):
            logger.info(f"Knowledge base directory '{company_dir}' does not exist. Creating it.")
            os.makedirs(company_dir, exist_ok=True)
            return

        for root, dirs, files in os.walk(company_dir):
            for file in files:
                if file.endswith(".md") or file.endswith(".txt"):
                    filepath = os.path.join(root, file)
                    rel_path = os.path.relpath(filepath, company_dir)
                    
                    category = "general"
                    parts = rel_path.replace("\\", "/").split("/")
                    if len(parts) > 1:
                        category = parts[0]
                    
                    self.loaded_categories.add(category)
                    self.loaded_documents.append(rel_path.replace("\\", "/"))
                    self._parse_file(filepath, rel_path.replace("\\", "/"), category)

        logger.info(f"Loaded {len(self.chunks)} chunks, {len(self.loaded_documents)} files from {len(self.loaded_categories)} categories.")

    def _parse_file(self, filepath: str, rel_path: str, category: str) -> None:
        """Reads and breaks markdown documents into sections split by header markers."""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Failed to read file {filepath}: {e}")
            return

        content = content.replace("\r\n", "\n")

        # Exclude raw prompt templates from normal search index
        if "prompts/" in rel_path:
            return

        # Split markdown on header lines: #, ##, ###
        # Using a regex keeping the headers
        pattern = r"(?m)^(#{1,3}\s+.*)$"
        parts = re.split(pattern, content)
        
        file_title = rel_path
        current_heading = "Overview"

        if parts and not parts[0].strip().startswith("#"):
            intro_text = parts[0].strip()
            if intro_text:
                self.chunks.append({
                    "source": rel_path,
                    "category": category,
                    "title": file_title,
                    "heading": current_heading,
                    "content": intro_text,
                    "words": self._tokenize(intro_text)
                })
            parts = parts[1:]

        for i in range(0, len(parts), 2):
            if i + 1 < len(parts):
                heading_line = parts[i].strip()
                block_content = parts[i+1].strip()
                
                clean_heading = heading_line.lstrip("#").strip()
                if heading_line.startswith("# "):
                    file_title = clean_heading
                
                if block_content:
                    full_content = f"{heading_line}\n{block_content}"
                    self.chunks.append({
                        "source": rel_path,
                        "category": category,
                        "title": file_title,
                        "heading": clean_heading,
                        "content": full_content,
                        "words": self._tokenize(full_content)
                    })

    def _tokenize(self, text: str) -> Set[str]:
        """Splits, cleans, and filters out stopwords from a text string."""
        words = re.findall(r"\b\w+\b", text.lower())
        return {w for w in words if w not in self.stopwords and len(w) > 1}

    def retrieve_context(self, query: str, limit: int = 4) -> Tuple[str, List[str]]:
        """
        Performs multi-dimensional search over loaded chunks:
        1. Keyword Overlaps (Keyword relevance)
        2. Heading Overlaps (Heading matching)
        3. Phrase Containment (Content similarity)
        4. Category Weight Multipliers (File priority)
        """
        query_lower = query.lower().strip()
        query_words = self._tokenize(query_lower)

        # Fallback if query lacks keywords
        if not query_words:
            profile_chunks = [c for c in self.chunks if "profile" in c["source"]]
            fallback_chunks = profile_chunks[:2] if profile_chunks else self.chunks[:2]
            sources = list(set([c["source"] for c in fallback_chunks]))
            formatted = "\n\n".join([f"--- SOURCE: {c['source']} ---\n{c['content']}" for c in fallback_chunks])
            return formatted, sources

        scored_chunks = []
        for chunk in self.chunks:
            score = 0.0
            
            # 1. Keyword Relevance: content word matches
            overlap = query_words.intersection(chunk["words"])
            score += len(overlap) * 1.5
            
            # 2. Heading Matching: check if query terms occur in headings
            heading_words = self._tokenize(chunk["heading"])
            heading_overlap = query_words.intersection(heading_words)
            score += len(heading_overlap) * 6.0
            
            # Check title matches
            title_words = self._tokenize(chunk["title"])
            title_overlap = query_words.intersection(title_words)
            score += len(title_overlap) * 3.0

            # 3. Content Similarity: check for exact phrase matches (bigram/trigram or full query check)
            if query_lower in chunk["content"].lower():
                score += 5.0
            else:
                # Check smaller query tokens containment
                for word in query_words:
                    if f" {word} " in f" {chunk['content'].lower()} ":
                        score += 0.5

            # 4. File Priority Multiplier
            # Look up setting priorities by subfolder category matching
            priority_mult = 1.0
            for prefix, weight in settings.FILE_PRIORITY.items():
                if chunk["source"].startswith(prefix):
                    priority_mult = weight
                    break
            
            final_score = score * priority_mult
            
            if final_score > 0:
                scored_chunks.append((final_score, chunk))

        # Sort by final score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        if not scored_chunks:
            # Fallback
            profile_chunks = [c for c in self.chunks if "profile" in c["source"]]
            fallback_chunks = profile_chunks[:2] if profile_chunks else self.chunks[:2]
            sources = list(set([c["source"] for c in fallback_chunks]))
            formatted = "\n\n".join([f"--- SOURCE: {c['source']} ---\n{c['content']}" for c in fallback_chunks])
            return formatted, sources

        selected = scored_chunks[:limit]
        sources = list(set([item[1]["source"] for item in selected]))
        
        formatted_list = []
        for score, chunk in selected:
            formatted_list.append(
                f"--- SOURCE: {chunk['source']} (Relevance Score: {score:.2f}) ---\n{chunk['content']}"
            )

        return "\n\n".join(formatted_list), sources

    def get_loaded_documents(self) -> List[str]:
        return self.loaded_documents

    def get_loaded_categories(self) -> List[str]:
        return list(self.loaded_categories)

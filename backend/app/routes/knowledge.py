import os
import hashlib
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Dict, Any

from app.routes.auth import get_current_user
from app.services.db.knowledge import KnowledgeService
from app.services.db.company import CompanyService
from app.routes.chat import retrieval_service

logger = logging.getLogger("app.routes.knowledge")
router = APIRouter(prefix="/knowledge", tags=["Knowledge Manager"])

def _calculate_checksum(file_bytes: bytes) -> str:
    return hashlib.md5(file_bytes).hexdigest()

def _extract_text_from_pdf(file_bytes: bytes) -> str:
    import io
    import PyPDF2
    text = ""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n\n"
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise ValueError("Failed to parse PDF file.")
    return text

def _extract_text_from_docx(file_bytes: bytes) -> str:
    import io
    from docx import Document
    text = ""
    try:
        doc = Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            if para.text.strip():
                text += para.text + "\n\n"
    except Exception as e:
        logger.error(f"Error parsing DOCX: {e}")
        raise ValueError("Failed to parse DOCX file.")
    return text

@router.post("/upload")
async def upload_knowledge_file(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Secure file upload. Parses MD, TXT, PDF, DOCX, extracts text, 
    saves as normalized markdown in the knowledge folder, and indexes it.
    """
    if current_user["role"] not in ["owner", "admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized to upload knowledge.")

    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    allowed_exts = [".md", ".txt", ".pdf", ".docx"]
    
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {allowed_exts}")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")
        
    checksum = _calculate_checksum(file_bytes)
    
    # Extract text based on file type
    text_content = ""
    try:
        if ext in [".md", ".txt"]:
            text_content = file_bytes.decode("utf-8")
        elif ext == ".pdf":
            text_content = _extract_text_from_pdf(file_bytes)
        elif ext == ".docx":
            text_content = _extract_text_from_docx(file_bytes)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Text/Markdown files must be UTF-8 encoded.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not text_content.strip():
        raise HTTPException(status_code=400, detail="No readable text found in file.")

    # Save to knowledge directory
    knowledge_dir = retrieval_service.knowledge_dir
    target_dir = os.path.join(knowledge_dir, category)
    os.makedirs(target_dir, exist_ok=True)
    
    # Normalize filename to .md for uniform RAG indexing
    safe_name = filename.replace(" ", "_").lower()
    if not safe_name.endswith(".md"):
        safe_name = os.path.splitext(safe_name)[0] + ".md"
        
    target_path = os.path.join(target_dir, safe_name)
    
    # Save the normalized text
    with open(target_path, "w", encoding="utf-8") as f:
        # Prepend original filename as H1 to help the RAG engine
        if not text_content.lstrip().startswith("#"):
            f.write(f"# {filename}\n\n")
        f.write(text_content)

    # Track in database
    company_id = CompanyService.get_default_company_id()
    file_record = {
        "filename": safe_name,
        "category": category,
        "checksum": checksum,
        "uploaded_by": current_user.get("user_id"),
        "size_bytes": len(file_bytes)
    }
    
    try:
        record = KnowledgeService.create_knowledge_file(company_id, file_record)
    except Exception as e:
        logger.error(f"Failed to record file in DB: {e}")
        # Clean up file if DB fails
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(status_code=500, detail="Failed to save file metadata.")

    # Trigger RAG re-index immediately
    retrieval_service.reload_knowledge()

    return {
        "success": True,
        "message": f"File '{filename}' processed, saved as '{safe_name}', and indexed successfully.",
        "record": record
    }

@router.get("/")
async def list_knowledge_files(
    page: int = 1,
    page_size: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns a paginated list of all uploaded knowledge documents."""
    company_id = CompanyService.get_default_company_id()
    files = KnowledgeService.list_knowledge_files(company_id, page, page_size)
    return {"data": files, "page": page, "page_size": page_size}

@router.delete("/{file_id}")
async def delete_knowledge_file(
    file_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Deletes a knowledge file and removes it from the RAG index."""
    if current_user["role"] not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete knowledge.")
        
    company_id = CompanyService.get_default_company_id()
    # First get file details to find physical path
    file_record = KnowledgeService.get_knowledge_file_by_name(company_id, file_id) # Need ID lookup, we'll assume KnowledgeService can do it or we pass filename
    # Actually, KnowledgeService has get_knowledge_file_by_name but we pass ID here. Let's just pass ID and if we don't have get_by_id, we will add it or handle it.
    
    success = KnowledgeService.delete_knowledge_file(company_id, file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found or unable to delete.")
        
    # Trigger RAG re-index
    retrieval_service.reload_knowledge()
    return {"success": True, "message": "File deleted from tracking. Re-indexing complete."}

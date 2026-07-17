import os
import sys
import time

# Resolve python paths
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app"))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.services.retrieval.memory import InMemoryRetrievalService
from app.services.memory import memory_service
from app.services.ai.gemini import gemini_service

client = TestClient(app)

def test_health_endpoint():
    print("Testing GET /health endpoint...")
    response = client.get("/health")
    assert response.status_code == 200, "Health check failed."
    data = response.json()
    assert data["status"] == "healthy", "Unexpected status value."
    assert "components" in data, "Components status missing."
    assert "knowledge_loader" in data["components"], "Knowledge loader key missing."
    assert "gemini_connection" in data["components"], "Gemini connection key missing."
    print("[OK] GET /health Passed!")

def test_status_endpoint():
    print("Testing GET /status endpoint...")
    response = client.get("/status")
    assert response.status_code == 200, "Status check failed."
    data = response.json()
    assert "server_uptime_seconds" in data, "Uptime metric missing."
    assert "total_knowledge_files" in data, "Knowledge file count missing."
    assert "loaded_categories" in data, "Loaded categories missing."
    assert data["total_knowledge_files"] > 0, "No knowledge files detected."
    print("[OK] GET /status Passed!")

def test_chat_interaction_and_memory():
    print("Testing POST /chat and session memory...")
    session_id = f"test-sess-{int(time.time())}"
    
    # First message: greeting
    payload_1 = {
        "message": "Hi, my name is Bruce Wayne. I am looking for a website.",
        "session_id": session_id
    }
    
    response_1 = client.post("/chat", json=payload_1)
    assert response_1.status_code == 200, "Chat request 1 failed."
    data_1 = response_1.json()
    
    assert data_1["success"] is True
    assert "reply" in data_1
    assert "sources" in data_1
    assert "lead_detected" in data_1
    assert "lead_details" in data_1
    assert "response_time_ms" in data_1
    assert data_1["model"] == "gemini-2.5-flash"
    
    # Check that in-memory session manager holds this session
    session = memory_service.get_or_create_session(session_id)
    assert len(session.messages) == 2, f"Expected 2 messages in memory, got {len(session.messages)}"
    assert session.messages[0]["content"] == payload_1["message"], "Stored query mismatch."
    
    # Second message: requesting pricing packages
    payload_2 = {
        "message": "What is your pricing packages for a business website?",
        "session_id": session_id
    }
    response_2 = client.post("/chat", json=payload_2)
    assert response_2.status_code == 200, "Chat request 2 failed."
    data_2 = response_2.json()
    
    # Check session history accumulation
    assert len(session.messages) == 4, f"Expected 4 messages in memory, got {len(session.messages)}"
    print("[OK] POST /chat and Session Memory Passed!")

def test_lead_qualification_parser():
    print("Testing structured lead details extraction...")
    # Trigger mock transcript analysis
    mock_transcript = (
        "User: Hello, my name is Bruce Wayne from Wayne Enterprises. I want to build a custom portfolio website.\n"
        "Bot: Hello Bruce! What is your contact details?\n"
        "User: My phone is 1234567890 and email is bruce@wayne.com. Budget is around ₹50,000."
    )
    
    analysis = gemini_service._mock_analyze_transcript(mock_transcript)
    assert analysis["lead_detected"] is True, "Failed to identify buying intent."
    assert analysis["lead_details"]["name"] == "Bruce Wayne", "Failed to extract name."
    assert analysis["lead_details"]["email"] == "bruce@wayne.com", "Failed to extract email."
    assert analysis["lead_details"]["phone"] == "1234567890", "Failed to extract phone."
    assert "website" in analysis["lead_details"]["requirements"].lower(), "Failed to capture requirements."
    print("[OK] Lead qualification parsing Passed!")

if __name__ == "__main__":
    print("Starting Standalone AI Chatbot Backend Verification Tests (Phase 2)...\n" + "="*60)
    try:
        test_health_endpoint()
        test_status_endpoint()
        test_chat_interaction_and_memory()
        test_lead_qualification_parser()
        print("="*60 + "\nAll tests passed successfully! Phase 2 is validated.")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nAssertion Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected Error: {e}")
        sys.exit(1)

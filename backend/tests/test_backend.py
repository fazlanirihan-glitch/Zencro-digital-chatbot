import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app"))
# Wait, let's add the app parent folder instead
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.retrieval.memory import InMemoryRetrievalService
from app.services.ai.gemini import GeminiService
from app.services.supabase import supabase_service

def test_retrieval_service():
    print("Testing In-Memory Retrieval Service...")
    retrieval = InMemoryRetrievalService()
    
    # Reload and check files
    assert len(retrieval.chunks) > 0, "No knowledge chunks loaded!"
    
    # Query matching for business websites
    context = retrieval.retrieve_context("I need a restaurant website")
    assert "restaurant" in context.lower() or "website" in context.lower(), "Retrieval failed to find relevant context."
    print("[OK] Retrieval Service Passed!")

def test_supabase_mock_service():
    print("Testing Supabase Mock / Client Service...")
    # Create conversation
    session_id = "test-session-123"
    conv = supabase_service.create_conversation(session_id)
    assert conv["session_id"] == session_id, "Failed to create/retrieve session."
    
    # Save message
    msg = supabase_service.save_message(session_id, "user", "Hello support bot!")
    assert msg["sender"] == "user", "Message sender mismatch."
    
    # Verify messages retrieval
    history = supabase_service.get_conversation_messages(session_id)
    assert len(history) >= 1, "Failed to fetch saved history."
    assert history[0]["content"] == "Hello support bot!", "Message content mismatch."
    
    # Save lead
    lead = supabase_service.create_lead(
        name="Alex Mercer",
        phone="+91 9999988888",
        email="alex@mercer.com",
        business_name="Mercer Tech",
        requirements="AI WhatsApp pipeline integration",
        score=85,
        session_id=session_id
    )
    assert lead["name"] == "Alex Mercer", "Failed to create lead correctly."
    assert lead["score"] == 85, "Lead score mismatch."
    
    # Verify analytics
    analytics = supabase_service.get_analytics()
    assert analytics["total_leads"] >= 1, "Analytics count failed."
    assert analytics["average_lead_score"] > 0, "Analytics lead scoring average failed."
    print("[OK] Supabase Service Passed!")

def test_gemini_service_analysis():
    print("Testing Transcript Analysis / Lead extraction...")
    retrieval = InMemoryRetrievalService()
    gemini = GeminiService(retrieval)
    
    # Mock transcript
    mock_history = [
        {"sender": "user", "content": "Hello, my name is Bruce Wayne"},
        {"sender": "bot", "content": "Hi Bruce, how can I assist you with ZenCro Digital today?"},
        {"sender": "user", "content": "I want an e-commerce website for Wayne Enterprises. My phone is 1234567890 and email is bruce@wayne.com."}
    ]
    
    analysis = gemini._mock_analyze_transcript("\n".join([f"{m['sender']}: {m['content']}" for m in mock_history]))
    
    assert analysis["email"] == "bruce@wayne.com", f"Expected email extraction, got {analysis['email']}"
    assert "1234567890" in analysis["phone"], f"Expected phone extraction, got {analysis['phone']}"
    assert analysis["intent_score"] >= 80, "Expected high intent score for e-commerce website."
    print("[OK] Transcript Analysis Passed!")

if __name__ == "__main__":
    print("Running ZenCro Digital Backend Verification Tests...\n" + "="*50)
    try:
        test_retrieval_service()
        test_supabase_mock_service()
        test_gemini_service_analysis()
        print("="*50 + "\nAll tests passed successfully!")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nAssertion Error during testing: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error during testing: {e}")
        sys.exit(1)

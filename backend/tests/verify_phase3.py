import os
import sys
import time

# Resolve python paths
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app"))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.services.db.company import CompanyService
from app.services.db.lead import LeadService
from app.services.db.conversation import ConversationService
from app.services.db.portfolio import PortfolioService
from app.services.db.faq import FAQService

client = TestClient(app)

def test_company_seeding():
    print("Testing tenant initialization and seeding...")
    # Seed default company ZenCro Digital
    cid = CompanyService.get_default_company_id()
    assert cid is not None, "Seeding failed. Returned None company_id."
    
    # Check default company properties
    company = CompanyService.get_company(cid)
    assert company is not None, "Seeded company not found."
    assert company["company_name"] == "ZenCro Digital", "Company name mismatch."
    print(f"[OK] Seeding Passed! Active tenant cached ID={cid}")

def test_jwt_auth_and_rbac():
    print("Testing JWT Authentication endpoints and RBAC filters...")
    
    # Test Login
    login_payload = {"email": "owner@test.com", "password": "password123"}
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200, "Login failed."
    tokens = res.json()
    assert tokens["access_token"] == "mock-owner-token", "Token mismatch."
    
    # Check /me with mock owner token
    headers_owner = {"Authorization": "Bearer mock-owner-token"}
    res_me = client.get("/api/v1/auth/me", headers=headers_owner)
    assert res_me.status_code == 200
    assert res_me.json()["role"] == "owner"

    # Check /me with mock admin token
    headers_admin = {"Authorization": "Bearer mock-admin-token"}
    res_me_admin = client.get("/api/v1/auth/me", headers=headers_admin)
    assert res_me_admin.status_code == 200
    assert res_me_admin.json()["role"] == "admin"

    # Check /me with mock editor token
    headers_editor = {"Authorization": "Bearer mock-editor-token"}
    res_me_editor = client.get("/api/v1/auth/me", headers=headers_editor)
    assert res_me_editor.status_code == 200
    assert res_me_editor.json()["role"] == "editor"

    # RBAC lead access protection check
    # 1. Accessing leads without token -> 401
    res_leads_no_token = client.get("/api/v1/leads")
    assert res_leads_no_token.status_code == 401, "Leads readable without credentials."

    # 2. Accessing leads with Editor token -> 403 Forbidden
    res_leads_editor = client.get("/api/v1/leads", headers=headers_editor)
    assert res_leads_editor.status_code == 403, "Editor has unauthorized access to leads."

    # 3. Accessing leads with Admin token -> 200 OK
    res_leads_admin = client.get("/api/v1/leads", headers=headers_admin)
    assert res_leads_admin.status_code == 200, "Admin blocked from accessing leads list."
    print("[OK] JWT and RBAC Roles Passed!")

def test_duplicate_lead_merging():
    print("Testing duplicate lead detection and merging...")
    cid = CompanyService.get_default_company_id()
    
    # First lead registration
    lead_payload_1 = {
        "name": "Tony Stark",
        "email": "tony@stark.com",
        "phone": "9998887776",
        "requirements": "Need automation pipeline.",
        "budget": "₹1,00,000"
    }
    lead1 = LeadService.create_or_update_lead(cid, lead_payload_1)
    lead1_id = lead1["id"]
    
    # Second lead registration with same email
    lead_payload_2 = {
        "name": "Tony Stark",
        "email": "tony@stark.com",
        "requirements": "Also need AI chatbot integration.",
        "budget": "₹1,50,000",
        "lead_score": 90
    }
    lead2 = LeadService.create_or_update_lead(cid, lead_payload_2)
    lead2_id = lead2["id"]
    
    # Check ID is matching (updates instead of copying)
    assert lead1_id == lead2_id, "Duplicate lead created separate record instead of merging."
    
    # Fetch details to assert merge attributes
    merged_lead = LeadService.get_lead(cid, lead1_id)
    assert "automation" in merged_lead["requirements"], "Lost original requirements during merge."
    assert "chatbot" in merged_lead["requirements"], "Failed to append new requirements."
    assert merged_lead["budget"] == "₹1,50,000", "Failed to update budget profile."
    assert merged_lead["lead_score"] == 90, "Failed to update lead score."
    print("[OK] Duplicate lead merging Passed!")

def test_rbac_deletion_limits():
    print("Testing Owner lead deletion restrictions...")
    cid = CompanyService.get_default_company_id()
    lead_payload = {"name": "Peter Parker", "email": "peter@parker.com"}
    lead = LeadService.create_or_update_lead(cid, lead_payload)
    lead_id = lead["id"]

    # 1. Admin tries to delete -> 403 Forbidden
    headers_admin = {"Authorization": "Bearer mock-admin-token"}
    res_del_admin = client.delete(f"/api/v1/leads/{lead_id}", headers=headers_admin)
    assert res_del_admin.status_code == 403, "Admin was allowed to delete lead."

    # 2. Owner tries to delete -> 200 OK
    headers_owner = {"Authorization": "Bearer mock-owner-token"}
    res_del_owner = client.delete(f"/api/v1/leads/{lead_id}", headers=headers_owner)
    assert res_del_owner.status_code == 200, "Owner blocked from deleting lead."
    
    # Verify lead was deleted
    assert LeadService.get_lead(cid, lead_id) is None, "Lead was not deleted."
    print("[OK] RBAC Deletion Limits Passed!")

def test_chat_interaction_db_saving():
    print("Testing automatic chat history and lead database saves...")
    session_id = f"test-sess-db-{int(time.time())}"
    
    # Message showing intent to capture lead details
    payload = {
        "message": "Hi, my name is Bruce Wayne. My email is bruce@wayne.com. I want a website.",
        "session_id": session_id
    }
    
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200, "Chat request failed."
    data = response.json()
    
    # Verify lead was auto-detected and saved
    cid = CompanyService.get_default_company_id()
    lead = LeadService.list_leads(cid, search="Bruce Wayne")
    assert len(lead) > 0, "Lead was not auto-saved to database."
    assert lead[0]["email"] == "bruce@wayne.com", "Captured lead email mismatch."
    
    # Verify conversation turn was logged in DB
    history = ConversationService.get_conversation_history(cid, session_id)
    assert len(history) > 0, "Conversation log turn was not written to database."
    assert history[0]["user_message"] == payload["message"], "Logged message mismatch."
    print("[OK] Chat session database auto-saving Passed!")

if __name__ == "__main__":
    print("Starting Multi-Company SaaS Database & Auth Verification (Phase 3)...\n" + "="*70)
    try:
        # Run seeding first
        CompanyService.seed_default_company()
        
        test_company_seeding()
        test_jwt_auth_and_rbac()
        test_duplicate_lead_merging()
        test_rbac_deletion_limits()
        test_chat_interaction_db_saving()
        print("="*70 + "\nAll tests passed successfully! Phase 3 is validated.")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nAssertion Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected Error: {e}")
        sys.exit(1)

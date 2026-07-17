import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime

def generate_deployment(company_id: str, api_url: str):
    """
    Generates a production-ready white-label Next.js bundle for a specific tenant.
    It injects the specific company's ID into the environment variables before building.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent
    frontend_dir = base_dir / "frontend"
    dist_dir = base_dir / "deployments" / company_id

    if not frontend_dir.exists():
        print(f"❌ Error: Frontend directory not found at {frontend_dir}")
        sys.exit(1)

    print(f"🚀 Starting White-Label Deployment Generation for Tenant: {company_id}")
    
    # 1. Prepare target directory
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir, exist_ok=True)

    # 2. Generate .env.production specifically for this tenant
    env_content = f"""NEXT_PUBLIC_API_URL={api_url}
NEXT_PUBLIC_TENANT_ID={company_id}
NEXT_PUBLIC_ENVIRONMENT=production
"""
    env_path = frontend_dir / ".env.production"
    with open(env_path, "w") as f:
        f.write(env_content)
    
    print("✅ Injected tenant-specific .env.production")

    # 3. Inform Admin to build
    print("\n📦 Deployment Prepared!")
    print(f"To compile the white-label frontend for {company_id}, run:")
    print(f"  cd {frontend_dir}")
    print("  npm install")
    print("  npm run build")
    print(f"\nThe compiled Next.js standalone folder can then be zipped and shipped to the client.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_deployment.py <company_id> <api_url>")
        sys.exit(1)
        
    company_id = sys.argv[1]
    api_url = sys.argv[2]
    generate_deployment(company_id, api_url)

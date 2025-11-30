#!/usr/bin/env python3
"""
Test only the login endpoint with existing user
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import app, db
from fastapi.testclient import TestClient
import json

client = TestClient(app)

async def test_login_only():
    """Test login with existing user"""
    print("Testing Login Only...")
    
    # Find an existing email user
    existing_user = await db.users.find_one({"auth_method": "email"}, {"_id": 0})
    if not existing_user:
        print("No existing email user found. Please run signup test first.")
        return
    
    test_email = existing_user['email']
    test_password = "testpass123"  # Assuming this is the password used in tests
    
    print(f"Testing login with: {test_email}")
    
    try:
        print("\n1. Testing Email Login...")
        login_response = client.post("/api/auth/email/login", json={
            "email": test_email,
            "password": test_password
        })
        
        print(f"Login Status: {login_response.status_code}")
        if login_response.status_code == 200:
            login_data = login_response.json()
            print(f"Login Success: {login_data.get('success')}")
            print(f"Token received: {'token' in login_data}")
            print(f"User ID: {login_data.get('user', {}).get('id')}")
        else:
            print(f"Login Error: {login_response.text}")
        
        print("\n✅ Login test completed!")
        
    except Exception as e:
        print(f"\n❌ Error during login test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_login_only())
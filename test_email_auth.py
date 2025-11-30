#!/usr/bin/env python3
"""
Test script for email authentication endpoints
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import app, db
from fastapi.testclient import TestClient
import json

client = TestClient(app)

async def test_email_auth():
    """Test email authentication flow"""
    print("Testing Email Authentication Endpoints...")
    
    # Test data with timestamp to ensure uniqueness
    import time
    timestamp = str(int(time.time()))
    test_email = f"test{timestamp}@example.com"
    test_password = "testpass123"
    test_name = "Test User"
    
    print("\n1. Testing Email Signup...")
    signup_response = client.post("/api/auth/email/signup", json={
        "email": test_email,
        "password": test_password,
        "name": test_name
    })
    
    print(f"Signup Status: {signup_response.status_code}")
    if signup_response.status_code == 200:
        signup_data = signup_response.json()
        print(f"Signup Success: {signup_data.get('success')}")
        print(f"User ID: {signup_data.get('user', {}).get('id')}")
        print(f"Token received: {'token' in signup_data}")
    else:
        print(f"Signup Error: {signup_response.text}")
        return
    
    print("\n2. Testing Email Login...")
    login_response = client.post("/api/auth/email/login", json={
        "email": test_email,
        "password": test_password
    })
    
    print(f"Login Status: {login_response.status_code}")
    if login_response.status_code == 200:
        login_data = login_response.json()
        print(f"Login Success: {login_data.get('success')}")
        print(f"Token received: {'token' in login_data}")
    else:
        print(f"Login Error: {login_response.text}")
    
    print("\n3. Testing Wrong Password...")
    wrong_login = client.post("/api/auth/email/login", json={
        "email": test_email,
        "password": "wrongpassword"
    })
    print(f"Wrong Password Status: {wrong_login.status_code}")
    print(f"Expected 401: {wrong_login.status_code == 401}")
    
    print("\n4. Testing Forgot Password...")
    forgot_response = client.post("/api/auth/forgot-password", json={
        "email": test_email
    })
    print(f"Forgot Password Status: {forgot_response.status_code}")
    if forgot_response.status_code == 200:
        forgot_data = forgot_response.json()
        print(f"OTP Request Success: {forgot_data.get('success')}")
        print(f"Message: {forgot_data.get('message')}")
    
    print("\n✅ Email Authentication Tests Completed!")

if __name__ == "__main__":
    asyncio.run(test_email_auth())
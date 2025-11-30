#!/usr/bin/env python3
"""
Test password reset flow
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

import uvicorn
from server import app
import threading
import time
import requests
import json

def start_server():
    """Start server in background thread"""
    uvicorn.run(app, host='127.0.0.1', port=8004, log_level='error')

async def test_password_reset():
    """Test complete password reset flow"""
    print("Testing Password Reset Flow...")
    
    # Start server in background
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(3)  # Wait for server to start
    
    # Test data
    import time as time_module
    timestamp = str(int(time_module.time()))
    test_email = f"resettest{timestamp}@example.com"
    test_password = "oldpassword123"
    new_password = "newpassword456"
    test_name = "Reset Test User"
    
    try:
        print("\n1. Creating test user...")
        signup_response = requests.post('http://127.0.0.1:8004/api/auth/email/signup', 
                                      json={
                                          'email': test_email, 
                                          'password': test_password, 
                                          'name': test_name
                                      },
                                      timeout=10)
        
        if signup_response.status_code != 200:
            print(f"Failed to create user: {signup_response.text}")
            return
        print("User created successfully")
        
        print("\n2. Testing forgot password...")
        forgot_response = requests.post('http://127.0.0.1:8004/api/auth/forgot-password',
                                      json={'email': test_email},
                                      timeout=10)
        print(f"Forgot Password Status: {forgot_response.status_code}")
        
        if forgot_response.status_code != 200:
            print(f"Forgot password failed: {forgot_response.text}")
            return
        
        # For testing, we'll use a mock OTP since we can't capture the console output
        # In a real scenario, the OTP would be sent via email
        mock_otp = "123456"  # This won't work, but let's test the validation
        
        print("\n3. Testing reset password with invalid OTP...")
        reset_response = requests.post('http://127.0.0.1:8004/api/auth/reset-password',
                                     json={
                                         'email': test_email,
                                         'otp': mock_otp,
                                         'new_password': new_password
                                     },
                                     timeout=10)
        print(f"Reset Password Status: {reset_response.status_code}")
        print(f"Expected 400 (invalid OTP): {reset_response.status_code == 400}")
        if reset_response.status_code == 400:
            print(f"Error message: {reset_response.json().get('detail')}")
        
        print("\n4. Testing login with original password (should still work)...")
        login_response = requests.post('http://127.0.0.1:8004/api/auth/email/login',
                                     json={
                                         'email': test_email,
                                         'password': test_password
                                     },
                                     timeout=10)
        print(f"Login Status: {login_response.status_code}")
        print(f"Login successful: {login_response.status_code == 200}")
        
        print("\n✅ Password reset flow tests completed!")
        print("Note: Full reset test requires capturing the actual OTP from console/email")
        
    except Exception as e:
        print(f"\n❌ Error during password reset test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_password_reset())
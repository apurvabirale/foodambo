#!/usr/bin/env python3
"""
Test email auth with real HTTP server
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
    uvicorn.run(app, host='127.0.0.1', port=8003, log_level='error')

async def test_with_real_server():
    """Test with real HTTP server"""
    print("Testing with Real HTTP Server...")
    
    # Start server in background
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(3)  # Wait for server to start
    
    # Test data
    import time as time_module
    timestamp = str(int(time_module.time()))
    test_email = f"realserver{timestamp}@example.com"
    test_password = "testpass123"
    test_name = "Real Server Test"
    
    try:
        print("\n1. Testing Email Signup...")
        signup_response = requests.post('http://127.0.0.1:8003/api/auth/email/signup', 
                                      json={
                                          'email': test_email, 
                                          'password': test_password, 
                                          'name': test_name
                                      },
                                      timeout=10)
        
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
        login_response = requests.post('http://127.0.0.1:8003/api/auth/email/login',
                                     json={
                                         'email': test_email,
                                         'password': test_password
                                     },
                                     timeout=10)
        
        print(f"Login Status: {login_response.status_code}")
        if login_response.status_code == 200:
            login_data = login_response.json()
            print(f"Login Success: {login_data.get('success')}")
            print(f"Token received: {'token' in login_data}")
        else:
            print(f"Login Error: {login_response.text}")
        
        print("\n3. Testing Wrong Password...")
        wrong_response = requests.post('http://127.0.0.1:8003/api/auth/email/login',
                                     json={
                                         'email': test_email,
                                         'password': 'wrongpassword'
                                     },
                                     timeout=10)
        print(f"Wrong Password Status: {wrong_response.status_code}")
        print(f"Expected 401: {wrong_response.status_code == 401}")
        
        print("\n4. Testing Forgot Password...")
        forgot_response = requests.post('http://127.0.0.1:8003/api/auth/forgot-password',
                                      json={'email': test_email},
                                      timeout=10)
        print(f"Forgot Password Status: {forgot_response.status_code}")
        if forgot_response.status_code == 200:
            forgot_data = forgot_response.json()
            print(f"OTP Request Success: {forgot_data.get('success')}")
        
        print("\n✅ Real server tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during real server test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_with_real_server())
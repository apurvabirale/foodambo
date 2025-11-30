#!/usr/bin/env python3
"""
Test email auth endpoints by calling them directly
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import email_signup, email_login, EmailSignupRequest, EmailLoginRequest
import json

async def test_direct_calls():
    """Test email auth by calling functions directly"""
    print("Testing Direct Function Calls...")
    
    # Test data
    import time
    timestamp = str(int(time.time()))
    test_email = f"direct{timestamp}@example.com"
    test_password = "testpass123"
    test_name = "Direct Test User"
    
    try:
        print("\n1. Testing email_signup function directly...")
        signup_req = EmailSignupRequest(
            email=test_email,
            password=test_password,
            name=test_name
        )
        
        signup_result = await email_signup(signup_req)
        print(f"   Signup result type: {type(signup_result)}")
        print(f"   Signup success: {signup_result.get('success')}")
        print(f"   User ID: {signup_result.get('user', {}).get('id')}")
        
        # Try to serialize the result
        json_str = json.dumps(signup_result)
        print(f"   JSON serialization: SUCCESS ({len(json_str)} chars)")
        
        print("\n2. Testing email_login function directly...")
        login_req = EmailLoginRequest(
            email=test_email,
            password=test_password
        )
        
        login_result = await email_login(login_req)
        print(f"   Login result type: {type(login_result)}")
        print(f"   Login success: {login_result.get('success')}")
        
        # Try to serialize the result
        json_str = json.dumps(login_result)
        print(f"   JSON serialization: SUCCESS ({len(json_str)} chars)")
        
        print("\n✅ Direct function calls work perfectly!")
        
    except Exception as e:
        print(f"\n❌ Error in direct calls: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_direct_calls())
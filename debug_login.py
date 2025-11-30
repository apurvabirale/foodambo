#!/usr/bin/env python3
"""
Debug login endpoint specifically
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import db, bcrypt, create_access_token, serialize_user_data
from datetime import datetime, timezone
import json

async def debug_login():
    """Debug login endpoint issues"""
    print("Debugging Login Endpoint...")
    
    # Find an existing user
    existing_user = await db.users.find_one({"auth_method": "email"}, {"_id": 0})
    if not existing_user:
        print("No email users found. Creating one first...")
        # Create a test user
        from server import User
        password_hash = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(
            email="debug_login@example.com",
            password_hash=password_hash,
            name="Debug Login User",
            auth_method="email"
        )
        user_dict = user.model_dump()
        user_dict = serialize_user_data(user_dict)
        await db.users.insert_one(user_dict)
        existing_user = await db.users.find_one({"email": "debug_login@example.com"}, {"_id": 0})
    
    print(f"Found user: {existing_user['email']}")
    
    try:
        # Simulate login process
        print("\n1. Retrieved user from database:")
        print(f"   Keys: {list(existing_user.keys())}")
        
        # Check data types
        print("\n2. Checking data types:")
        for key, value in existing_user.items():
            print(f"   {key}: {type(value)} = {value}")
        
        # Try serialization
        print("\n3. Testing serialization:")
        user_doc = serialize_user_data(existing_user.copy())
        print("   Serialization successful")
        
        # Create token
        print("\n4. Creating token:")
        token = create_access_token({"sub": user_doc["id"]})
        print(f"   Token created: {len(token)} chars")
        
        # Remove sensitive data
        print("\n5. Removing sensitive data:")
        user_doc.pop('password_hash', None)
        user_doc.pop('reset_otp', None)
        user_doc.pop('reset_otp_expires', None)
        print("   Sensitive data removed")
        
        # Test response structure
        print("\n6. Testing response structure:")
        response_data = {"success": True, "token": token, "user": user_doc}
        
        # Check for problematic fields
        print("   Checking for ObjectId or other issues:")
        from bson import ObjectId
        for key, value in response_data.items():
            if isinstance(value, ObjectId):
                print(f"   ObjectId found: {key} = {value}")
            elif isinstance(value, dict):
                for subkey, subvalue in value.items():
                    if isinstance(subvalue, ObjectId):
                        print(f"   ObjectId found in {key}.{subkey}: {subvalue}")
                    elif isinstance(subvalue, datetime):
                        print(f"   Datetime found in {key}.{subkey}: {subvalue}")
        
        # Try JSON serialization
        print("\n7. Testing JSON serialization:")
        json_str = json.dumps(response_data)
        print(f"   JSON serialization successful: {len(json_str)} chars")
        
        print("\n✅ Login debug completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during login debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_login())
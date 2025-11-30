#!/usr/bin/env python3
"""
Debug script for email authentication
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import User, db, bcrypt
from datetime import datetime, timezone
import json

async def debug_user_creation():
    """Debug user creation and serialization"""
    print("Debugging User Creation...")
    
    # Create user object
    user = User(
        email="debug@example.com",
        password_hash=bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        name="Debug User",
        auth_method="email"
    )
    
    print("1. User object created successfully")
    
    # Convert to dict
    user_dict = user.model_dump()
    print("2. User model_dump() successful")
    print(f"   Fields: {list(user_dict.keys())}")
    
    # Check for datetime fields
    datetime_fields = []
    for key, value in user_dict.items():
        if isinstance(value, datetime):
            datetime_fields.append(key)
            print(f"   Datetime field: {key} = {value}")
    
    # Serialize datetime fields
    def serialize_user(user_dict):
        """Helper to serialize datetime fields to ISO format"""
        if user_dict.get('created_at') and isinstance(user_dict['created_at'], datetime):
            user_dict['created_at'] = user_dict['created_at'].isoformat()
        if user_dict.get('subscription_started_at') and isinstance(user_dict['subscription_started_at'], datetime):
            user_dict['subscription_started_at'] = user_dict['subscription_started_at'].isoformat()
        if user_dict.get('subscription_expires_at') and isinstance(user_dict['subscription_expires_at'], datetime):
            user_dict['subscription_expires_at'] = user_dict['subscription_expires_at'].isoformat()
        if user_dict.get('reset_otp_expires') and isinstance(user_dict['reset_otp_expires'], datetime):
            user_dict['reset_otp_expires'] = user_dict['reset_otp_expires'].isoformat()
        return user_dict
    
    user_dict = serialize_user(user_dict)
    print("3. User serialization successful")
    
    # Try JSON serialization
    try:
        json_str = json.dumps(user_dict)
        print("4. JSON serialization successful")
    except Exception as e:
        print(f"4. JSON serialization failed: {e}")
        # Find problematic fields
        for key, value in user_dict.items():
            try:
                json.dumps({key: value})
            except Exception as field_error:
                print(f"   Problematic field: {key} = {value} ({type(value)})")
    
    print("\n✅ Debug completed!")

if __name__ == "__main__":
    asyncio.run(debug_user_creation())
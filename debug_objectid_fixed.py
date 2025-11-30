#!/usr/bin/env python3
"""
Debug script to find ObjectId fields
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import User, db, bcrypt, create_access_token
from datetime import datetime, timezone
from bson import ObjectId
import json

async def debug_objectid():
    """Debug ObjectId issues"""
    print("Debugging ObjectId Issues...")
    
    # Test email
    test_email = f"objectid_debug{int(datetime.now().timestamp())}@example.com"
    
    try:
        # Create and insert user
        password_hash = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            email=test_email,
            password_hash=password_hash,
            name="Debug User",
            auth_method="email"
        )
        user_dict = user.model_dump()
        
        # Serialize datetime fields
        def serialize_user(user_dict):
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
        
        # Insert into database
        result = await db.users.insert_one(user_dict)
        print(f"Insert result: {result.inserted_id}")
        
        # Retrieve with different query methods
        print("\n1. Query with _id: 0 exclusion:")
        user_no_id = await db.users.find_one({"email": test_email}, {"_id": 0})
        if user_no_id:
            print(f"   Keys: {list(user_no_id.keys())}")
            # Check for ObjectId fields
            objectid_fields = []
            for key, value in user_no_id.items():
                if isinstance(value, ObjectId):
                    objectid_fields.append(key)
                    print(f"   ObjectId field found: {key} = {value}")
            if not objectid_fields:
                print("   No ObjectId fields found")
        
        print("\n2. Query without _id exclusion:")
        user_with_id = await db.users.find_one({"email": test_email})
        if user_with_id:
            print(f"   Keys: {list(user_with_id.keys())}")
            # Check for ObjectId fields
            objectid_fields = []
            for key, value in user_with_id.items():
                if isinstance(value, ObjectId):
                    objectid_fields.append(key)
                    print(f"   ObjectId field found: {key} = {value}")
        
        # Test the exact same flow as our endpoint
        print("\n3. Testing exact endpoint flow:")
        retrieved_user = await db.users.find_one({"email": test_email}, {"_id": 0})
        if retrieved_user:
            # Serialize again (in case DB returned datetime objects)
            retrieved_user = serialize_user(retrieved_user)
            
            # Create token
            token = create_access_token({"sub": retrieved_user["id"]})
            
            # Remove sensitive data
            retrieved_user.pop('password_hash', None)
            retrieved_user.pop('reset_otp', None)
            retrieved_user.pop('reset_otp_expires', None)
            
            # Test response structure
            response_data = {"success": True, "token": token, "user": retrieved_user}
            
            # Check each part for ObjectId
            print("   Checking response parts for ObjectId:")
            for key, value in response_data.items():
                if isinstance(value, ObjectId):
                    print(f"   ObjectId in response root: {key} = {value}")
                elif isinstance(value, dict):
                    for subkey, subvalue in value.items():
                        if isinstance(subvalue, ObjectId):
                            print(f"   ObjectId in {key}.{subkey}: {subvalue}")
            
            # Try JSON serialization
            try:
                json_str = json.dumps(response_data)
                print("   JSON serialization successful")
            except Exception as e:
                print(f"   JSON serialization failed: {e}")
                # Find the problematic field
                for key, value in response_data.items():
                    try:
                        json.dumps({key: value})
                    except Exception as field_error:
                        print(f"   Problematic field: {key} - {field_error}")
                        if isinstance(value, dict):
                            for subkey, subvalue in value.items():
                                try:
                                    json.dumps({subkey: subvalue})
                                except Exception as subfield_error:
                                    print(f"     Problematic subfield: {subkey} = {subvalue} ({type(subvalue)}) - {subfield_error}")
        
        print("\n✅ ObjectId debug completed!")
        
    except Exception as e:
        print(f"\n❌ Error during debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_objectid())
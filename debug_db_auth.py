#!/usr/bin/env python3
"""
Debug script for database email authentication
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import User, db, bcrypt, create_access_token
from datetime import datetime, timezone
import json

async def debug_db_interaction():
    """Debug database interaction for email auth"""
    print("Debugging Database Interaction...")
    
    # Test email
    test_email = f"debug{int(datetime.now().timestamp())}@example.com"
    
    try:
        # 1. Check if user exists
        print("1. Checking if user exists...")
        existing_user = await db.users.find_one({"email": test_email}, {"_id": 0})
        print(f"   Existing user: {existing_user}")
        
        # 2. Create user
        print("2. Creating user...")
        password_hash = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            email=test_email,
            password_hash=password_hash,
            name="Debug User",
            auth_method="email"
        )
        user_dict = user.model_dump()
        print(f"   User dict keys: {list(user_dict.keys())}")
        
        # 3. Serialize datetime fields
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
        print("3. User serialized successfully")
        
        # 4. Insert into database
        print("4. Inserting into database...")
        await db.users.insert_one(user_dict)
        print("   Database insert successful")
        
        # 5. Retrieve from database
        print("5. Retrieving from database...")
        retrieved_user = await db.users.find_one({"email": test_email}, {"_id": 0})
        print(f"   Retrieved user keys: {list(retrieved_user.keys()) if retrieved_user else 'None'}")
        
        # 6. Check for ObjectId or problematic fields
        if retrieved_user:
            print("6. Checking retrieved user for problematic fields...")
            for key, value in retrieved_user.items():
                try:
                    json.dumps({key: value})
                except Exception as e:
                    print(f"   Problematic field: {key} = {value} ({type(value)}) - Error: {e}")
        
        # 7. Create token
        print("7. Creating JWT token...")
        token = create_access_token({"sub": retrieved_user["id"]})
        print(f"   Token created: {len(token)} characters")
        
        # 8. Remove sensitive data
        print("8. Removing sensitive data...")
        retrieved_user.pop('password_hash', None)
        retrieved_user.pop('reset_otp', None)
        retrieved_user.pop('reset_otp_expires', None)
        
        # 9. Final JSON test
        print("9. Final JSON serialization test...")
        response_data = {"success": True, "token": token, "user": retrieved_user}
        json_str = json.dumps(response_data)
        print("   Final JSON serialization successful")
        
        print("\n✅ Database interaction debug completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_db_interaction())
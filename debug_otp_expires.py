#!/usr/bin/env python3
"""
Debug OTP expires field type
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import db
from datetime import datetime, timezone, timedelta

async def debug_otp_expires():
    """Debug the reset_otp_expires field type"""
    print("Debugging OTP Expires Field...")
    
    # Find a user with reset_otp_expires
    user_with_otp = await db.users.find_one({"reset_otp_expires": {"$ne": None}}, {"_id": 0})
    
    if user_with_otp:
        print(f"Found user: {user_with_otp['email']}")
        reset_otp_expires = user_with_otp['reset_otp_expires']
        print(f"reset_otp_expires type: {type(reset_otp_expires)}")
        print(f"reset_otp_expires value: {reset_otp_expires}")
        
        # Test comparison
        try:
            now = datetime.now(timezone.utc)
            print(f"Current time: {now}")
            print(f"Current time type: {type(now)}")
            
            if isinstance(reset_otp_expires, str):
                print("Converting string to datetime...")
                reset_otp_expires_dt = datetime.fromisoformat(reset_otp_expires.replace('Z', '+00:00'))
                print(f"Converted datetime: {reset_otp_expires_dt}")
                comparison = now > reset_otp_expires_dt
                print(f"Comparison result: {comparison}")
            else:
                print("Direct comparison...")
                comparison = now > reset_otp_expires
                print(f"Comparison result: {comparison}")
                
        except Exception as e:
            print(f"Error during comparison: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("No user with reset_otp_expires found")
        
        # Create a test user with OTP
        print("Creating test user with OTP...")
        test_email = f"otp_debug_{int(datetime.now().timestamp())}@example.com"
        
        # Set OTP expiry
        otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
        print(f"Setting otp_expires: {otp_expires} (type: {type(otp_expires)})")
        
        # Update a user (create if doesn't exist)
        await db.users.update_one(
            {"email": test_email},
            {"$set": {
                "email": test_email,
                "name": "OTP Debug User",
                "auth_method": "email",
                "reset_otp": "123456",
                "reset_otp_expires": otp_expires
            }},
            upsert=True
        )
        
        # Retrieve and check
        user_doc = await db.users.find_one({"email": test_email}, {"_id": 0})
        if user_doc:
            retrieved_expires = user_doc['reset_otp_expires']
            print(f"Retrieved otp_expires: {retrieved_expires} (type: {type(retrieved_expires)})")

if __name__ == "__main__":
    asyncio.run(debug_otp_expires())
#!/usr/bin/env python3
"""
Setup MongoDB indexes for optimal performance
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime

MONGO_URI = "mongodb://192.168.29.200:8989"
DB_NAME = "travel_ai"

async def setup_indexes():
    """Create indexes for all collections"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("Setting up MongoDB indexes...")
    print("="*50)
    
    # Users collection indexes
    print("Creating indexes for 'users' collection...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index([("is_active", 1), ("is_verified", 1)])
    print("✓ Users indexes created")
    
    # Sessions collection indexes
    print("Creating indexes for 'sessions' collection...")
    await db.sessions.create_index("session_id", unique=True)
    await db.sessions.create_index([("user_id", 1), ("updated_at", -1)])
    print("✓ Sessions indexes created")
    
    # Messages collection indexes
    print("Creating indexes for 'messages' collection...")
    await db.messages.create_index([("session_id", 1), ("timestamp", 1)])
    await db.messages.create_index([("user_id", 1), ("timestamp", -1)])
    print("✓ Messages indexes created")
    
    # Subscriptions collection indexes
    print("Creating indexes for 'subscriptions' collection...")
    await db.subscriptions.create_index("user_id", unique=True)
    await db.subscriptions.create_index([("plan", 1), ("status", 1)])
    print("✓ Subscriptions indexes created")
    
    # Activity logs collection indexes
    print("Creating indexes for 'activity_logs' collection...")
    await db.activity_logs.create_index([("timestamp", -1)])
    await db.activity_logs.create_index([("user_id", 1), ("timestamp", -1)])
    await db.activity_logs.create_index("activity_type")
    print("✓ Activity logs indexes created")
    
    # Usage logs collection indexes
    print("Creating indexes for 'usage_logs' collection...")
    await db.usage_logs.create_index([("user_id", 1), ("date", -1)])
    print("✓ Usage logs indexes created")
    
    # Bookings collection indexes
    print("Creating indexes for 'hotel_bookings' collection...")
    await db.hotel_bookings.create_index([("user_id", 1), ("created_at", -1)])
    await db.hotel_bookings.create_index("booking_id", unique=True)
    print("✓ Hotel bookings indexes created")
    
    print("Creating indexes for 'flight_bookings' collection...")
    await db.flight_bookings.create_index([("user_id", 1), ("created_at", -1)])
    await db.flight_bookings.create_index("booking_id", unique=True)
    print("✓ Flight bookings indexes created")
    
    # OTP codes collection with TTL index (auto-delete expired OTPs)
    print("Creating indexes for 'otp_codes' collection...")
    await db.otp_codes.create_index("email", unique=True)
    # TTL index - MongoDB will automatically delete documents after expires_at
    await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)
    print("✓ OTP codes indexes created (with TTL for auto-expiration)")
    
    print("="*50)
    print("✓ All indexes created successfully!")
    print()
    print("MongoDB will now:")
    print("  - Query faster with indexes")
    print("  - Auto-delete expired OTPs")
    print("  - Enforce unique constraints")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_indexes())

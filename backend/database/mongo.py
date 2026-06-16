from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import asyncio

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

mongodb = MongoDB()

async def connect_to_mongo():
    mongodb.client = AsyncIOMotorClient(settings.mongo_uri)
    mongodb.database = mongodb.client[settings.db_name]
    
    # Create indexes
    await create_indexes()

async def close_mongo_connection():
    if mongodb.client:
        mongodb.client.close()

async def create_indexes():
    db = mongodb.database
    
    # Messages collection indexes
    await db.messages.create_index([("session_id", 1)])
    await db.messages.create_index([("user_id", 1)])
    await db.messages.create_index([("timestamp", -1)])
    await db.messages.create_index([("session_id", 1), ("timestamp", -1)])
    
    # Sessions collection indexes
    await db.sessions.create_index([("user_id", 1)])
    await db.sessions.create_index([("session_id", 1)], unique=True)
    
    # Users collection indexes
    await db.users.create_index([("email", 1)], unique=True)
    await db.users.create_index([("user_id", 1)], unique=True)
    
    # Subscriptions collection indexes
    await db.subscriptions.create_index([("user_id", 1)], unique=True)
    
    # Usage logs collection indexes
    await db.usage_logs.create_index([("user_id", 1), ("date", 1)])

def get_database():
    return mongodb.database
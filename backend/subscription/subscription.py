import stripe
from datetime import datetime, date
from database.mongo import get_database
from config import settings
from fastapi import HTTPException

stripe.api_key = settings.stripe_secret_key

PLAN_LIMITS = {
    "free": {
        "daily_messages": 10,
        "daily_bookings": 2
    },
    "premium": {
        "daily_messages": 100,
        "daily_bookings": 20
    },
    "enterprise": {
        "daily_messages": -1,  # unlimited
        "daily_bookings": -1   # unlimited
    }
}

class SubscriptionService:
    @staticmethod
    async def check_usage_limits(user_id: str, subscription_plan: str, action_type: str = "message"):
        db = get_database()
        today = date.today().isoformat()
        
        # Get today's usage
        usage = await db.usage_logs.find_one({
            "user_id": user_id,
            "date": today
        })
        
        if not usage:
            usage = {
                "user_id": user_id,
                "date": today,
                "message_count": 0,
                "booking_count": 0,
                "created_at": datetime.utcnow()
            }
            await db.usage_logs.insert_one(usage)
        
        limits = PLAN_LIMITS.get(subscription_plan, PLAN_LIMITS["free"])
        
        if action_type == "message":
            if limits["daily_messages"] != -1 and usage["message_count"] >= limits["daily_messages"]:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Daily message limit exceeded",
                        "current_plan": subscription_plan,
                        "limit": limits["daily_messages"],
                        "used": usage["message_count"]
                    }
                )
        elif action_type == "booking":
            if limits["daily_bookings"] != -1 and usage["booking_count"] >= limits["daily_bookings"]:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Daily booking limit exceeded",
                        "current_plan": subscription_plan,
                        "limit": limits["daily_bookings"],
                        "used": usage["booking_count"]
                    }
                )
        
        return usage
    
    @staticmethod
    async def increment_usage(user_id: str, action_type: str = "message"):
        db = get_database()
        today = date.today().isoformat()
        
        field = f"{action_type}_count"
        await db.usage_logs.update_one(
            {"user_id": user_id, "date": today},
            {"$inc": {field: 1}},
            upsert=True
        )
    
    @staticmethod
    async def get_usage_stats(user_id: str, subscription_plan: str):
        db = get_database()
        today = date.today().isoformat()
        
        usage = await db.usage_logs.find_one({
            "user_id": user_id,
            "date": today
        })
        
        if not usage:
            usage = {"message_count": 0, "booking_count": 0}
        
        limits = PLAN_LIMITS.get(subscription_plan, PLAN_LIMITS["free"])
        
        return {
            "messages": {
                "used": usage["message_count"],
                "limit": limits["daily_messages"],
                "remaining": limits["daily_messages"] - usage["message_count"] if limits["daily_messages"] != -1 else -1
            },
            "bookings": {
                "used": usage["booking_count"],
                "limit": limits["daily_bookings"],
                "remaining": limits["daily_bookings"] - usage["booking_count"] if limits["daily_bookings"] != -1 else -1
            }
        }
    
    @staticmethod
    async def create_stripe_customer(user_id: str, email: str):
        customer = stripe.Customer.create(
            email=email,
            metadata={"user_id": user_id}
        )
        
        db = get_database()
        await db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": {"stripe_customer_id": customer.id}},
            upsert=True
        )
        
        return customer
    
    @staticmethod
    async def create_subscription(user_id: str, price_id: str):
        db = get_database()
        subscription_doc = await db.subscriptions.find_one({"user_id": user_id})
        
        if not subscription_doc or not subscription_doc.get("stripe_customer_id"):
            user = await db.users.find_one({"user_id": user_id})
            customer = await SubscriptionService.create_stripe_customer(user_id, user["email"])
            customer_id = customer.id
        else:
            customer_id = subscription_doc["stripe_customer_id"]
        
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            metadata={"user_id": user_id}
        )
        
        plan_map = {
            "price_premium": "premium",
            "price_enterprise": "enterprise"
        }
        
        await db.subscriptions.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "stripe_subscription_id": subscription.id,
                    "plan": plan_map.get(price_id, "premium"),
                    "status": subscription.status,
                    "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                    "current_period_end": datetime.fromtimestamp(subscription.current_period_end)
                }
            },
            upsert=True
        )
        
        return subscription
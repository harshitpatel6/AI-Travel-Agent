from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Any
import uvicorn
import uuid
from datetime import datetime, timedelta
import json

# Imports
from database.mongo import connect_to_mongo, close_mongo_connection, get_database
from auth.auth import AuthService, get_current_user, get_user_subscription, require_admin, require_super_admin, require_system_admin
from subscription.subscription import SubscriptionService
from agents.graph import travel_graph, load_conversation_history, save_message, create_or_get_session
from mcp.server import mcp_router
from models.models import *
from langchain_core.messages import HumanMessage

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Travel AI Assistant",
    description="Production-ready AI travel assistant with LangGraph and Grok",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://192.168.29.200:3000",
        "http://192.168.29.200:3001",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Requested-With"
    ],
    expose_headers=["*"],
    max_age=3600,
)

# Include MCP router
app.include_router(mcp_router)

# Add OPTIONS handler for CORS preflight
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {"message": "OK"}

# Add request logging middleware for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"📥 {request.method} {request.url.path}")
    print(f"   Origin: {request.headers.get('origin', 'No origin')}")
    print(f"   Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    print(f"📤 Response status: {response.status_code}")
    return response

@app.post("/auth/register")
async def register(request: RegisterRequest):
    db = get_database()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = User(
        user_id=user_id,
        email=request.email,
        password_hash=AuthService.hash_password(request.password),
        first_name=request.first_name,
        last_name=request.last_name
    )
    
    await db.users.insert_one(user.dict())
    
    # Create free subscription for new user
    subscription = Subscription(
        user_id=user_id,
        plan=SubscriptionPlan.FREE
    )
    await db.subscriptions.insert_one(subscription.dict())
    
    # Send OTP
    await AuthService.send_otp_email(request.email)
    
    # Log activity
    await AuthService.log_activity(
        db,
        ActivityType.USER_REGISTERED,
        f"New user registered: {request.email}",
        user_id
    )
    
    return {"message": "Registration successful. Please verify your email.", "user_id": user_id}

@app.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify):
    if not await AuthService.verify_otp(request.email, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    db = get_database()
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Email verified successfully"}

@app.post("/auth/login")
async def login(request: LoginRequest):
    db = get_database()
    user = await db.users.find_one({"email": request.email})
    
    if not user or not AuthService.verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user["is_verified"]:
        raise HTTPException(status_code=401, detail="Email not verified")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    # Update last login
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Log activity
    await AuthService.log_activity(
        db,
        ActivityType.USER_LOGIN,
        f"User logged in: {request.email}",
        user["user_id"]
    )
    
    token = AuthService.create_access_token({"user_id": user["user_id"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "first_name": user.get("first_name"),
        "last_name": user.get("last_name")
    }

@app.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    await AuthService.send_otp_email(request.email)
    return {"message": "OTP sent successfully"}

@app.post("/auth/forgot-password")
async def forgot_password(request: OTPRequest):
    """Send OTP for password reset"""
    db = get_database()
    
    # Check if user exists
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a password reset code has been sent"}
    
    # Send OTP
    await AuthService.send_otp_email(request.email)
    
    # Log activity
    await AuthService.log_activity(
        db,
        ActivityType.ADMIN_ACTION,
        f"Password reset requested for: {request.email}",
        user.get("user_id")
    )
    
    return {"message": "Password reset code sent to your email"}

@app.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with OTP"""
    db = get_database()
    
    # Verify OTP
    if not await AuthService.verify_otp(request.email, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Get user
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    password_hash = AuthService.hash_password(request.new_password)
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.utcnow()}}
    )
    
    # Log activity
    await AuthService.log_activity(
        db,
        ActivityType.ADMIN_ACTION,
        f"Password reset completed for: {request.email}",
        user["user_id"]
    )
    
    return {"message": "Password reset successfully"}

@app.post("/chat")
async def chat(
    request: ChatRequest,
    user: dict = Depends(get_current_user)
):
    try:
        subscription = await get_user_subscription(user)
        
        # Check usage limits
        await SubscriptionService.check_usage_limits(
            user["user_id"],
            subscription["plan"],
            "message"
        )
        
        # Create or get session
        session_id = await create_or_get_session(user["user_id"], request.session_id)
        
        # Load conversation history
        history = await load_conversation_history(user["user_id"], session_id)
        
        # Save user message
        await save_message(user["user_id"], session_id, "user", request.message)
        
        # Prepare state
        state = {
            "messages": history + [HumanMessage(content=request.message)],
            "user_id": user["user_id"],
            "session_id": session_id,
            "subscription_plan": subscription["plan"]
        }
        
        # Run graph
        result = await travel_graph.run(state)
        
        # Save assistant response
        await save_message(user["user_id"], session_id, "assistant", result["response"])
        
        # Increment usage
        await SubscriptionService.increment_usage(user["user_id"], "message")
        
        # Get usage stats
        usage_stats = await SubscriptionService.get_usage_stats(user["user_id"], subscription["plan"])
        
        return ChatResponse(
            response=result["response"],
            session_id=session_id,
            usage_remaining=usage_stats
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your message. Please try again. Error: {str(e)}"
        )

@app.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(get_current_user)
):
    subscription = await get_user_subscription(user)
    
    # Check usage limits
    await SubscriptionService.check_usage_limits(
        user["user_id"],
        subscription["plan"],
        "message"
    )
    
    session_id = await create_or_get_session(user["user_id"], request.session_id)
    await save_message(user["user_id"], session_id, "user", request.message)
    
    async def generate():
        # Simplified streaming response
        response_text = f"Streaming response to: {request.message}"
        
        for chunk in response_text.split():
            yield f"data: {json.dumps({'content': chunk + ' '})}\n\n"
        
        # Save complete response
        await save_message(user["user_id"], session_id, "assistant", response_text)
        await SubscriptionService.increment_usage(user["user_id"], "message")
        
        yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.get("/sessions")
async def get_sessions(user: dict = Depends(get_current_user)):
    db = get_database()
    sessions = await db.sessions.find(
        {"user_id": user["user_id"]}
    ).sort("updated_at", -1).to_list(length=50)
    
    return {"sessions": sessions}

@app.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    messages = await db.messages.find({
        "session_id": session_id,
        "user_id": user["user_id"]
    }).sort("timestamp", 1).to_list(length=100)
    
    return {"messages": messages}

@app.get("/subscription/status")
async def get_subscription_status(user: dict = Depends(get_current_user)):
    subscription = await get_user_subscription(user)
    usage_stats = await SubscriptionService.get_usage_stats(user["user_id"], subscription["plan"])
    
    return {
        "subscription": subscription,
        "usage": usage_stats
    }

@app.post("/subscription/create")
async def create_subscription(
    price_id: str,
    user: dict = Depends(get_current_user)
):
    subscription = await SubscriptionService.create_subscription(user["user_id"], price_id)
    return {"subscription": subscription}

@app.get("/bookings/hotels")
async def get_hotel_bookings(user: dict = Depends(get_current_user)):
    db = get_database()
    bookings = await db.hotel_bookings.find(
        {"user_id": user["user_id"]}
    ).sort("created_at", -1).to_list(length=50)
    
    return {"bookings": bookings}

@app.get("/bookings/flights")
async def get_flight_bookings(user: dict = Depends(get_current_user)):
    db = get_database()
    bookings = await db.flight_bookings.find(
        {"user_id": user["user_id"]}
    ).sort("created_at", -1).to_list(length=50)
    
    return {"bookings": bookings}

# Admin Routes
@app.get("/admin/dashboard")
async def admin_dashboard(admin: dict = Depends(require_admin)):
    db = get_database()
    
    # Get dashboard statistics
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    total_messages = await db.messages.count_documents({})
    total_bookings = await db.hotel_bookings.count_documents({}) + await db.flight_bookings.count_documents({})
    
    # Subscription counts
    subscriptions = {}
    for plan in ["free", "premium", "enterprise"]:
        count = await db.subscriptions.count_documents({"plan": plan})
        subscriptions[plan] = count
    
    # Revenue calculation (simplified)
    revenue = subscriptions.get("premium", 0) * 29.99 + subscriptions.get("enterprise", 0) * 99.99
    
    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        total_messages=total_messages,
        total_bookings=total_bookings,
        revenue=revenue,
        subscriptions=subscriptions
    )

@app.get("/admin/users")
async def get_users(
    page: int = 1,
    limit: int = 20,
    search: str = None,
    admin: dict = Depends(require_admin)
):
    db = get_database()
    skip = (page - 1) * limit
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}}
        ]
    
    # Get users
    users = await db.users.find(query).skip(skip).limit(limit).to_list(length=limit)
    total = await db.users.count_documents(query)
    
    # Remove password hashes
    for user in users:
        user.pop("password_hash", None)
    
    return UserListResponse(
        users=users,
        total=total,
        page=page,
        total_pages=(total + limit - 1) // limit
    )

@app.get("/admin/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin: dict = Depends(require_admin)
):
    db = get_database()
    user = await db.users.find_one({"user_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's subscription
    subscription = await db.subscriptions.find_one({"user_id": user_id})
    
    # Get user's usage stats
    usage_logs = await db.usage_logs.find({"user_id": user_id}).to_list(length=30)
    
    # Get recent activity
    activities = await db.activity_logs.find({"user_id": user_id}).sort("timestamp", -1).limit(10).to_list(length=10)
    
    user.pop("password_hash", None)
    
    return {
        "user": user,
        "subscription": subscription,
        "usage_logs": usage_logs,
        "recent_activities": activities
    }

@app.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    admin: dict = Depends(require_admin)
):
    db = get_database()
    
    # Check if user exists
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    if request.role is not None:
        update_data["role"] = request.role.value
    if request.is_active is not None:
        update_data["is_active"] = request.is_active
    if request.is_verified is not None:
        update_data["is_verified"] = request.is_verified
    if request.first_name is not None:
        update_data["first_name"] = request.first_name
    if request.last_name is not None:
        update_data["last_name"] = request.last_name
    
    # Update user
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    # Log activity
    await AuthService.log_activity(
        db,
        ActivityType.ADMIN_ACTION,
        f"User {user_id} updated by admin {admin['user_id']}",
        admin["user_id"],
        {"target_user": user_id, "changes": update_data}
    )
    
    return {"message": "User updated successfully"}

@app.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_super_admin)
):
    db = get_database()
    
    # Check if user exists
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user and related data
    await db.users.delete_one({"user_id": user_id})
    await db.sessions.delete_many({"user_id": user_id})
    await db.messages.delete_many({"user_id": user_id})
    await db.subscriptions.delete_many({"user_id": user_id})
    await db.usage_logs.delete_many({"user_id": user_id})
    await db.hotel_bookings.delete_many({"user_id": user_id})
    await db.flight_bookings.delete_many({"user_id": user_id})
    
    # Log activity
    await AuthService.log_activity(
        db,
        ActivityType.ADMIN_ACTION,
        f"User {user_id} deleted by admin {admin['user_id']}",
        admin["user_id"],
        {"target_user": user_id}
    )
    
    return {"message": "User deleted successfully"}

@app.get("/admin/analytics")
async def get_analytics(
    period: str = "7d",
    admin: dict = Depends(require_admin)
):
    db = get_database()
    
    # Calculate date range
    if period == "7d":
        days = 7
    elif period == "30d":
        days = 30
    elif period == "90d":
        days = 90
    else:
        days = 7
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # User registrations over time
    user_registrations = await db.users.aggregate([
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(length=None)
    
    # Messages over time
    message_stats = await db.messages.aggregate([
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(length=None)
    
    # Subscription distribution
    subscription_stats = await db.subscriptions.aggregate([
        {"$group": {
            "_id": "$plan",
            "count": {"$sum": 1}
        }}
    ]).to_list(length=None)
    
    return AnalyticsData(
        period=period,
        metrics={
            "total_users": await db.users.count_documents({}),
            "active_users": await db.users.count_documents({"is_active": True}),
            "total_messages": await db.messages.count_documents({}),
            "total_bookings": await db.hotel_bookings.count_documents({}) + await db.flight_bookings.count_documents({})
        },
        charts={
            "user_registrations": user_registrations,
            "message_stats": message_stats,
            "subscription_stats": subscription_stats
        }
    )

@app.get("/admin/activity-logs")
async def get_activity_logs(
    page: int = 1,
    limit: int = 50,
    activity_type: str = None,
    user_id: str = None,
    admin: dict = Depends(require_admin)
):
    db = get_database()
    skip = (page - 1) * limit
    
    # Build query
    query = {}
    if activity_type:
        query["activity_type"] = activity_type
    if user_id:
        query["user_id"] = user_id
    
    # Get activity logs
    logs = await db.activity_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit).to_list(length=limit)
    total = await db.activity_logs.count_documents(query)
    
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "total_pages": (total + limit - 1) // limit
    }

@app.get("/admin/system-settings")
async def get_system_settings(admin: dict = Depends(require_system_admin)):
    db = get_database()
    settings = await db.system_settings.find({}).to_list(length=None)
    return {"settings": settings}

@app.put("/admin/system-settings/{setting_key}")
async def update_system_setting(
    setting_key: str,
    setting_value: Any,
    description: str = None,
    admin: dict = Depends(require_system_admin)
):
    db = get_database()
    
    setting = SystemSettings(
        setting_key=setting_key,
        setting_value=setting_value,
        description=description,
        updated_by=admin["user_id"]
    )
    
    await db.system_settings.update_one(
        {"setting_key": setting_key},
        {"$set": setting.dict()},
        upsert=True
    )
    
    # Log activity
    await AuthService.log_activity(
        db,
        ActivityType.ADMIN_ACTION,
        f"System setting {setting_key} updated",
        admin["user_id"],
        {"setting_key": setting_key, "setting_value": setting_value}
    )
    
    return {"message": "Setting updated successfully"}

@app.get("/admin/subscriptions")
async def get_subscriptions(
    page: int = 1,
    limit: int = 20,
    plan: str = None,
    admin: dict = Depends(require_admin)
):
    db = get_database()
    skip = (page - 1) * limit
    
    # Build query
    query = {}
    if plan:
        query["plan"] = plan
    
    # Get subscriptions with user info
    pipeline = [
        {"$match": query},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user"
        }},
        {"$unwind": "$user"},
        {"$project": {
            "user_id": 1,
            "plan": 1,
            "status": 1,
            "created_at": 1,
            "current_period_end": 1,
            "user.email": 1,
            "user.first_name": 1,
            "user.last_name": 1
        }},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    subscriptions = await db.subscriptions.aggregate(pipeline).to_list(length=limit)
    total = await db.subscriptions.count_documents(query)
    
    return {
        "subscriptions": subscriptions,
        "total": total,
        "page": page,
        "total_pages": (total + limit - 1) // limit
    }

# User Profile Routes
@app.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    user.pop("password_hash", None)
    return {"user": user}

@app.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    if request.first_name is not None:
        update_data["first_name"] = request.first_name
    if request.last_name is not None:
        update_data["last_name"] = request.last_name
    if request.email is not None:
        # Check if email is already taken
        existing = await db.users.find_one({"email": request.email, "user_id": {"$ne": user["user_id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        update_data["email"] = request.email
        update_data["is_verified"] = False  # Require re-verification
    
    # Update user
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}

@app.post("/profile/change-password")
async def change_password(
    request: ChangePasswordRequest,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Verify current password
    if not AuthService.verify_password(request.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hash = AuthService.hash_password(request.new_password)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Password changed successfully"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class SystemRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    SYSTEM_ADMIN = "system_admin"

class SubscriptionPlan(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

class ActivityType(str, Enum):
    USER_REGISTERED = "user_registered"
    USER_LOGIN = "user_login"
    MESSAGE_SENT = "message_sent"
    BOOKING_CREATED = "booking_created"
    SUBSCRIPTION_UPGRADED = "subscription_upgraded"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"
    ADMIN_ACTION = "admin_action"

# Database Models
class User(BaseModel):
    user_id: str
    email: str
    password_hash: str
    role: SystemRole = SystemRole.USER
    is_verified: bool = False
    is_active: bool = True
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Session(BaseModel):
    session_id: str
    user_id: str
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Message(BaseModel):
    session_id: str
    user_id: str
    role: UserRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Subscription(BaseModel):
    user_id: str
    plan: SubscriptionPlan
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    status: str = "active"
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UsageLog(BaseModel):
    user_id: str
    date: str  # YYYY-MM-DD format
    message_count: int = 0
    booking_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityLog(BaseModel):
    activity_id: str
    user_id: Optional[str] = None
    activity_type: ActivityType
    description: str
    metadata: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SystemSettings(BaseModel):
    setting_key: str
    setting_value: Any
    description: Optional[str] = None
    updated_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class HotelBooking(BaseModel):
    booking_id: str
    user_id: str
    session_id: str
    hotel_name: str
    location: str
    check_in: str
    check_out: str
    guests: int
    price: float
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FlightBooking(BaseModel):
    booking_id: str
    user_id: str
    session_id: str
    origin: str
    destination: str
    departure_date: str
    return_date: Optional[str] = None
    passengers: int
    price: float
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Hotel(BaseModel):
    hotel_id: str
    name: str
    location: str
    rating: float
    price_per_night: float
    amenities: List[str]
    description: str

class Flight(BaseModel):
    flight_id: str
    airline: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    price: float
    duration: str

# Request Models
class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class UpdateUserRequest(BaseModel):
    role: Optional[SystemRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

# Response Models
class UsageStats(BaseModel):
    used: int
    limit: int
    remaining: int

class UsageRemaining(BaseModel):
    messages: UsageStats
    bookings: UsageStats

class ChatResponse(BaseModel):
    response: str
    session_id: str
    usage_remaining: UsageRemaining

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_messages: int
    total_bookings: int
    revenue: float
    subscriptions: Dict[str, int]

class UserListResponse(BaseModel):
    users: List[Dict[str, Any]]
    total: int
    page: int
    total_pages: int

class AnalyticsData(BaseModel):
    period: str
    metrics: Dict[str, Any]
    charts: Dict[str, List[Dict[str, Any]]]

import jwt
import bcrypt
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from database.mongo import get_database
from config import settings
from models.models import SystemRole, ActivityType
import uuid

security = HTTPBearer()

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
    
    @staticmethod
    def verify_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    @staticmethod
    async def send_otp_email(email: str) -> str:
        otp = str(secrets.randbelow(900000) + 100000)
        
        # Store OTP in MongoDB with 5 minute expiry
        db = get_database()
        await db.otp_codes.update_one(
            {"email": email},
            {
                "$set": {
                    "otp": otp,
                    "created_at": datetime.utcnow(),
                    "expires_at": datetime.utcnow() + timedelta(minutes=5)
                }
            },
            upsert=True
        )
        
        msg = MIMEMultipart()
        msg['From'] = settings.smtp_user
        msg['To'] = email
        msg['Subject'] = "Travel AI - Email Verification"
        
        body = f"""
        Your verification code is: {otp}
        
        This code will expire in 5 minutes.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_pass)
            server.send_message(msg)
            server.quit()
            return otp
        except Exception as e:
            # For development, just print the OTP
            print(f"OTP for {email}: {otp}")
            return otp
    
    @staticmethod
    async def verify_otp(email: str, otp: str) -> bool:
        db = get_database()
        stored = await db.otp_codes.find_one({"email": email})
        
        if not stored:
            return False
        
        # Check if OTP matches and hasn't expired
        if stored["otp"] == otp and stored["expires_at"] > datetime.utcnow():
            # Delete used OTP
            await db.otp_codes.delete_one({"email": email})
            return True
        
        # Delete expired OTP
        if stored["expires_at"] <= datetime.utcnow():
            await db.otp_codes.delete_one({"email": email})
        
        return False

    @staticmethod
    async def log_activity(
        db, 
        activity_type: ActivityType, 
        description: str, 
        user_id: str = None, 
        metadata: dict = None,
        request: Request = None
    ):
        """Log user activity"""
        activity = {
            "activity_id": str(uuid.uuid4()),
            "user_id": user_id,
            "activity_type": activity_type.value,
            "description": description,
            "metadata": metadata or {},
            "ip_address": request.client.host if request else None,
            "user_agent": request.headers.get("user-agent") if request else None,
            "timestamp": datetime.utcnow()
        }
        await db.activity_logs.insert_one(activity)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    
    db = get_database()
    user = await db.users.find_one({"user_id": payload["user_id"]})
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user["is_verified"]:
        raise HTTPException(status_code=401, detail="Email not verified")
    
    if not user["is_active"]:
        raise HTTPException(status_code=401, detail="Account deactivated")
    
    return user

async def get_user_subscription(user: dict):
    db = get_database()
    subscription = await db.subscriptions.find_one({"user_id": user["user_id"]})
    
    if not subscription:
        # Create default free subscription
        subscription = {
            "user_id": user["user_id"],
            "plan": "free",
            "status": "active",
            "created_at": datetime.utcnow()
        }
        await db.subscriptions.insert_one(subscription)
    
    return subscription

def require_role(required_roles: List[SystemRole]):
    """Decorator to require specific roles"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get user from kwargs (injected by FastAPI)
            user = None
            for arg in args:
                if isinstance(arg, dict) and 'user_id' in arg:
                    user = arg
                    break
            
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_role = user.get("role", SystemRole.USER)
            if user_role not in [role.value for role in required_roles]:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied. Required roles: {[role.value for role in required_roles]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_admin(user: dict = Depends(get_current_user)):
    """Require admin role or higher"""
    admin_roles = [SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN]
    if user.get("role") not in [role.value for role in admin_roles]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_super_admin(user: dict = Depends(get_current_user)):
    """Require super admin role or higher"""
    super_admin_roles = [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN]
    if user.get("role") not in [role.value for role in super_admin_roles]:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

def require_system_admin(user: dict = Depends(get_current_user)):
    """Require system admin role"""
    if user.get("role") != SystemRole.SYSTEM_ADMIN.value:
        raise HTTPException(status_code=403, detail="System admin access required")
    return user
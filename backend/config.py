import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str = "mongodb://url"
    db_name: str = "travel_ai"
    xai_api_key: str
    jwt_secret: str
    stripe_secret_key: str
    stripe_webhook_secret: str
    smtp_user: str
    smtp_pass: str
    
    class Config:
        env_file = ".env"

settings = Settings()
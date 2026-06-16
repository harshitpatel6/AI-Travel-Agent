from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from auth.auth import get_current_user, get_user_subscription
from subscription.subscription import SubscriptionService
from database.mongo import get_database
from models.models import HotelBooking, FlightBooking
import uuid
from datetime import datetime

mcp_router = APIRouter(prefix="/mcp", tags=["MCP"])

# Mock data for demonstration
MOCK_HOTELS = [
    {
        "hotel_id": "h1",
        "name": "Grand Plaza Hotel",
        "location": "New York, NY",
        "rating": 4.5,
        "price_per_night": 250.0,
        "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
        "description": "Luxury hotel in downtown Manhattan"
    },
    {
        "hotel_id": "h2", 
        "name": "Beach Resort Paradise",
        "location": "Miami, FL",
        "rating": 4.8,
        "price_per_night": 180.0,
        "amenities": ["Beach Access", "Pool", "Spa", "Restaurant"],
        "description": "Beautiful beachfront resort"
    }
]

MOCK_FLIGHTS = [
    {
        "flight_id": "f1",
        "airline": "American Airlines",
        "origin": "JFK",
        "destination": "LAX", 
        "departure_time": "08:00",
        "arrival_time": "11:30",
        "price": 350.0,
        "duration": "5h 30m"
    },
    {
        "flight_id": "f2",
        "airline": "Delta",
        "origin": "LAX",
        "destination": "JFK",
        "departure_time": "14:00", 
        "arrival_time": "22:15",
        "price": 380.0,
        "duration": "5h 15m"
    }
]

@mcp_router.post("/chat")
async def mcp_chat(
    request: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """MCP chat endpoint"""
    message = request.get("message", "")
    session_id = request.get("session_id")
    
    subscription = await get_user_subscription(user)
    
    # Check usage limits
    await SubscriptionService.check_usage_limits(
        user["user_id"], 
        subscription["plan"], 
        "message"
    )
    
    # Process message (simplified)
    response = f"MCP processed: {message}"
    
    # Increment usage
    await SubscriptionService.increment_usage(user["user_id"], "message")
    
    return {
        "response": response,
        "session_id": session_id,
        "user_id": user["user_id"]
    }

@mcp_router.post("/tools")
async def mcp_tools():
    """Return available MCP tools"""
    return {
        "tools": [
            {
                "name": "create_hotel_booking",
                "description": "Create a hotel booking",
                "parameters": {
                    "hotel_name": "string",
                    "location": "string", 
                    "check_in": "string",
                    "check_out": "string",
                    "guests": "integer"
                }
            },
            {
                "name": "create_flight_booking",
                "description": "Create a flight booking",
                "parameters": {
                    "origin": "string",
                    "destination": "string",
                    "departure_date": "string",
                    "return_date": "string",
                    "passengers": "integer"
                }
            },
            {
                "name": "get_hotel_info",
                "description": "Get hotel information",
                "parameters": {
                    "location": "string",
                    "check_in": "string",
                    "check_out": "string"
                }
            },
            {
                "name": "get_flight_info", 
                "description": "Get flight information",
                "parameters": {
                    "origin": "string",
                    "destination": "string",
                    "departure_date": "string"
                }
            }
        ]
    }

@mcp_router.post("/tools/create_hotel_booking")
async def create_hotel_booking(
    request: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """Create hotel booking tool"""
    subscription = await get_user_subscription(user)
    
    # Check booking limits
    await SubscriptionService.check_usage_limits(
        user["user_id"],
        subscription["plan"], 
        "booking"
    )
    
    booking_id = str(uuid.uuid4())
    booking = HotelBooking(
        booking_id=booking_id,
        user_id=user["user_id"],
        session_id=request.get("session_id", ""),
        hotel_name=request["hotel_name"],
        location=request["location"],
        check_in=request["check_in"],
        check_out=request["check_out"],
        guests=request["guests"],
        price=250.0,  # Mock price
        status="confirmed"
    )
    
    db = get_database()
    await db.hotel_bookings.insert_one(booking.dict())
    
    # Increment booking usage
    await SubscriptionService.increment_usage(user["user_id"], "booking")
    
    return {
        "success": True,
        "booking_id": booking_id,
        "message": f"Hotel booking created for {booking.hotel_name}"
    }

@mcp_router.post("/tools/create_flight_booking")
async def create_flight_booking(
    request: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """Create flight booking tool"""
    subscription = await get_user_subscription(user)
    
    # Check booking limits
    await SubscriptionService.check_usage_limits(
        user["user_id"],
        subscription["plan"],
        "booking"
    )
    
    booking_id = str(uuid.uuid4())
    booking = FlightBooking(
        booking_id=booking_id,
        user_id=user["user_id"],
        session_id=request.get("session_id", ""),
        origin=request["origin"],
        destination=request["destination"],
        departure_date=request["departure_date"],
        return_date=request.get("return_date"),
        passengers=request["passengers"],
        price=350.0,  # Mock price
        status="confirmed"
    )
    
    db = get_database()
    await db.flight_bookings.insert_one(booking.dict())
    
    # Increment booking usage
    await SubscriptionService.increment_usage(user["user_id"], "booking")
    
    return {
        "success": True,
        "booking_id": booking_id,
        "message": f"Flight booking created from {booking.origin} to {booking.destination}"
    }

@mcp_router.post("/tools/get_hotel_info")
async def get_hotel_info(
    request: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """Get hotel information tool"""
    location = request.get("location", "").lower()
    
    # Filter hotels by location
    matching_hotels = [
        hotel for hotel in MOCK_HOTELS 
        if location in hotel["location"].lower()
    ]
    
    return {
        "success": True,
        "hotels": matching_hotels,
        "count": len(matching_hotels)
    }

@mcp_router.post("/tools/get_flight_info")
async def get_flight_info(
    request: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """Get flight information tool"""
    origin = request.get("origin", "").upper()
    destination = request.get("destination", "").upper()
    
    # Filter flights by origin/destination
    matching_flights = [
        flight for flight in MOCK_FLIGHTS
        if flight["origin"] == origin and flight["destination"] == destination
    ]
    
    return {
        "success": True,
        "flights": matching_flights,
        "count": len(matching_flights)
    }
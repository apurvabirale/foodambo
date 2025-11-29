from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header, Cookie
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from twilio.rest import Client
from jose import JWTError, jwt
import os
import logging
from pathlib import Path
import uuid
import httpx
import math
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'foodambo_db')]

SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback_secret_key')
ALGORITHM = os.environ.get('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 10080))

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_VERIFY_SERVICE = os.environ.get('TWILIO_VERIFY_SERVICE', '')

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and not TWILIO_ACCOUNT_SID.startswith('your_'):
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except:
        logger.warning("Twilio client initialization failed")
else:
    logger.info("Using mocked Twilio (OTP: 123456)")

app = FastAPI(title="Foodambo API")
api_router = APIRouter(prefix="/api")

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: Optional[str] = None
    email: Optional[str] = None
    name: str
    profile_picture: Optional[str] = None
    auth_method: str
    is_seller: bool = False
    seller_active: bool = False
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    location: Optional[Dict[str, Any]] = None
    delivery_available: bool = False
    pickup_available: bool = True

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Store(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    store_name: str
    store_photo: Optional[str] = None
    address: str
    location: Dict[str, float]
    categories: List[str] = []
    fssai_license: Optional[str] = None
    fssai_verified: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    acceptance_rate: float = 100.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    store_id: str
    category: str
    title: str
    description: str
    price: float
    photos: List[str] = []
    product_type: str
    is_veg: bool = True
    spice_level: Optional[str] = None
    details: Dict[str, Any] = {}
    availability_days: List[str] = []
    availability_time_slots: List[str] = []
    min_quantity: int = 1
    max_quantity: Optional[int] = None
    delivery_available: bool = False
    pickup_available: bool = True
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    seller_id: str
    product_id: str
    quantity: int
    total_price: float
    delivery_method: str
    delivery_fee: float = 0.0
    scheduled_date: str
    scheduled_time: str
    status: str = "pending"
    buyer_address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_charge: float = 0.0

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    sender_id: str
    receiver_id: str
    message: str
    photo: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    store_id: str
    buyer_id: str
    rating: int
    comment: str
    photos: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    transaction_type: str
    amount: float
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    code: str

class GoogleAuthRequest(BaseModel):
    session_id: str

class StoreCreate(BaseModel):
    store_name: str
    address: str
    latitude: float
    longitude: float
    categories: List[str]

class ProductCreate(BaseModel):
    category: str
    title: str
    description: str
    price: float
    photos: List[str]
    product_type: str
    is_veg: bool = True
    spice_level: Optional[str] = None
    details: Dict[str, Any]
    availability_days: List[str]
    availability_time_slots: List[str] = []
    min_quantity: int = 1
    max_quantity: Optional[int] = None
    delivery_available: bool = False
    pickup_available: bool = True

class OrderCreate(BaseModel):
    product_id: str
    quantity: int
    delivery_method: str
    scheduled_date: str
    scheduled_time: str
    buyer_address: Optional[str] = None
    buyer_phone: Optional[str] = None

class ChatMessageCreate(BaseModel):
    order_id: str
    receiver_id: str
    message: str
    photo: Optional[str] = None

class ReviewCreate(BaseModel):
    order_id: str
    rating: int
    comment: str
    photos: List[str] = []

class FSSAIUpload(BaseModel):
    image_base64: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    token = None
    if session_token:
        token = session_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@api_router.post("/auth/send-otp")
async def send_otp(req: OTPRequest):
    if not twilio_client or not TWILIO_VERIFY_SERVICE or TWILIO_VERIFY_SERVICE.startswith('your_'):
        return {"success": True, "message": "OTP sent (mocked)"}
    try:
        verification = twilio_client.verify.services(TWILIO_VERIFY_SERVICE).verifications.create(to=req.phone, channel="sms")
        return {"success": True, "status": verification.status}
    except Exception as e:
        logger.error(f"Twilio error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to send OTP: {str(e)}")

@api_router.post("/auth/verify-otp")
async def verify_otp(req: OTPVerify):
    if not twilio_client or not TWILIO_VERIFY_SERVICE or TWILIO_VERIFY_SERVICE.startswith('your_'):
        if req.code == "123456":
            user_doc = await db.users.find_one({"phone": req.phone}, {"_id": 0})
            if not user_doc:
                user = User(phone=req.phone, name=f"User {req.phone[-4:]}", auth_method="phone")
                user_dict = user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                if user_dict.get('subscription_expires_at'):
                    user_dict['subscription_expires_at'] = user_dict['subscription_expires_at'].isoformat()
                await db.users.insert_one(user_dict)
                user_doc = user_dict
            token = create_access_token({"sub": user_doc["id"]})
            return {"success": True, "token": token, "user": user_doc}
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    try:
        check = twilio_client.verify.services(TWILIO_VERIFY_SERVICE).verification_checks.create(to=req.phone, code=req.code)
        if check.status == "approved":
            user_doc = await db.users.find_one({"phone": req.phone}, {"_id": 0})
            if not user_doc:
                user = User(phone=req.phone, name=f"User {req.phone[-4:]}", auth_method="phone")
                user_dict = user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                if user_dict.get('subscription_expires_at'):
                    user_dict['subscription_expires_at'] = user_dict['subscription_expires_at'].isoformat()
                await db.users.insert_one(user_dict)
                user_doc = user_dict
            token = create_access_token({"sub": user_doc["id"]})
            return {"success": True, "token": token, "user": user_doc}
        raise HTTPException(status_code=400, detail="Invalid OTP")
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

@api_router.post("/auth/google")
async def google_auth(req: GoogleAuthRequest):
    async with httpx.AsyncClient() as http_client:
        try:
            logger.info(f"Google auth attempt with session ID: {req.session_id}")
            response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": req.session_id},
                timeout=10.0
            )
            logger.info(f"Emergent auth response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Invalid session response: {response.text}")
                raise HTTPException(status_code=400, detail=f"Invalid session ID. Status: {response.status_code}")
            
            data = response.json()
            logger.info(f"User data from Emergent: {data.get('email')}")
            
            if not data.get("email"):
                raise HTTPException(status_code=400, detail="No email returned from Google")
            
            user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
            if not user_doc:
                user = User(
                    email=data["email"], 
                    name=data.get("name", "User"), 
                    profile_picture=data.get("picture"), 
                    auth_method="google"
                )
                user_dict = user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                if user_dict.get('subscription_expires_at'):
                    user_dict['subscription_expires_at'] = user_dict['subscription_expires_at'].isoformat()
                await db.users.insert_one(user_dict)
                user_doc = user_dict
                logger.info(f"Created new user: {user_doc['id']}")
            
            token = create_access_token({"sub": user_doc["id"]})
            logger.info(f"Login successful for user: {user_doc['id']}")
            return {"success": True, "token": token, "user": user_doc}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Google auth error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

@api_router.post("/auth/facebook")
async def facebook_auth(access_token: str):
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(
                "https://graph.facebook.com/me",
                params={"fields": "id,name,email,picture", "access_token": access_token}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Facebook token")
            data = response.json()
            email = data.get("email")
            if not email:
                raise HTTPException(status_code=400, detail="Email not available from Facebook")
            user_doc = await db.users.find_one({"email": email}, {"_id": 0})
            if not user_doc:
                user = User(email=email, name=data["name"], profile_picture=data.get("picture", {}).get("data", {}).get("url"), auth_method="facebook")
                user_dict = user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                if user_dict.get('subscription_expires_at'):
                    user_dict['subscription_expires_at'] = user_dict['subscription_expires_at'].isoformat()
                await db.users.insert_one(user_dict)
                user_doc = user_dict
            token = create_access_token({"sub": user_doc["id"]})
            return {"success": True, "token": token, "user": user_doc}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Facebook auth error: {str(e)}")
            raise HTTPException(status_code=400, detail="Facebook authentication failed")

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/stores")
async def create_store(store_data: StoreCreate, current_user: User = Depends(get_current_user)):
    existing_store = await db.stores.find_one({"user_id": current_user.id}, {"_id": 0})
    if existing_store:
        raise HTTPException(status_code=400, detail="Store already exists")
    
    store = Store(
        user_id=current_user.id,
        store_name=store_data.store_name,
        address=store_data.address,
        location={"latitude": store_data.latitude, "longitude": store_data.longitude},
        categories=store_data.categories
    )
    store_dict = store.model_dump()
    store_dict['created_at'] = store_dict['created_at'].isoformat()
    await db.stores.insert_one(store_dict)
    
    await db.users.update_one({"id": current_user.id}, {"$set": {"is_seller": True}})
    
    return store

@api_router.get("/stores/me")
async def get_my_store(current_user: User = Depends(get_current_user)):
    store = await db.stores.find_one({"user_id": current_user.id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@api_router.get("/stores/{store_id}")
async def get_store(store_id: str):
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@api_router.put("/stores/me")
async def update_my_store(store_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    store = await db.stores.find_one({"user_id": current_user.id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    allowed_fields = ["store_photo", "address", "categories", "location"]
    update_data = {k: v for k, v in store_data.items() if k in allowed_fields}
    
    if update_data:
        await db.stores.update_one({"id": store["id"]}, {"$set": update_data})
    
    return {"success": True}

@api_router.post("/fssai/upload")
async def upload_fssai(data: FSSAIUpload, current_user: User = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="FSSAI verification not configured")
    
    store = await db.stores.find_one({"user_id": current_user.id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"fssai_{store['id']}",
            system_message="You are an FSSAI certificate verification assistant. Extract license number, business name, and validity from the certificate image."
        ).with_model("openai", "gpt-5.1")
        
        message = UserMessage(
            text="Extract FSSAI license number, business name, and expiry date from this certificate. Respond in JSON format: {\"license_number\": \"\", \"business_name\": \"\", \"expiry_date\": \"\"}",
            file_contents=[]
        )
        
        response = await chat.send_message(message)
        
        import json
        verification_data = json.loads(response)
        
        await db.stores.update_one(
            {"id": store["id"]},
            {"$set": {
                "fssai_license": verification_data.get("license_number"),
                "fssai_verified": True
            }}
        )
        
        return {"success": True, "verification_data": verification_data}
    except Exception as e:
        logger.error(f"FSSAI verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@api_router.post("/products")
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    store = await db.stores.find_one({"user_id": current_user.id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    product = Product(
        seller_id=current_user.id,
        store_id=store["id"],
        **product_data.model_dump()
    )
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    await db.products.insert_one(product_dict)
    
    return product

@api_router.get("/products")
async def get_products(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    categories: Optional[str] = None,
    radius_km: float = 2.0,
    exclude_seller_id: Optional[str] = None,
    search: Optional[str] = None
):
    query = {"active": True}
    if exclude_seller_id:
        query["seller_id"] = {"$ne": exclude_seller_id}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    if latitude and longitude:
        products_with_distance = []
        for product in products:
            store = await db.stores.find_one({"id": product["store_id"]}, {"_id": 0})
            if store and store.get("location"):
                distance = calculate_distance(
                    latitude, longitude,
                    store["location"]["latitude"],
                    store["location"]["longitude"]
                )
                if distance <= radius_km:
                    product["distance"] = round(distance, 2)
                    product["store_name"] = store.get("store_name")
                    product["store_rating"] = store.get("rating", 0)
                    products_with_distance.append(product)
        products = sorted(products_with_distance, key=lambda x: x["distance"])
    
    if categories:
        cat_list = categories.split(",")
        products = [p for p in products if p["category"] in cat_list]
    
    return products

@api_router.get("/products/my")
async def get_my_products(current_user: User = Depends(get_current_user)):
    products = await db.products.find({"seller_id": current_user.id}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["buyer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order["status"] not in ["pending", "accepted"]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    # Calculate cancellation charge
    cancellation_charge = 0.0
    if order["status"] == "accepted":
        cancellation_charge = 50.0
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancellation_charge": cancellation_charge
        }}
    )
    
    return {"success": True, "cancellation_charge": cancellation_charge}

    products = await db.products.find({"seller_id": current_user.id}, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id, "seller_id": current_user.id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one({"id": product_id}, {"$set": product_data.model_dump()})
    return {"success": True}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id, "seller_id": current_user.id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one({"id": product_id}, {"$set": {"active": False}})
    return {"success": True}

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": order_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    delivery_fee = 30.0 if order_data.delivery_method == "delivery" else 0.0
    total_price = (product["price"] * order_data.quantity) + delivery_fee
    
    # Calculate expiry time (1 hour from now)
    now = datetime.now(timezone.utc)
    current_hour = now.hour
    
    # If after 9 PM, expires next morning at 10 AM
    if current_hour >= 21:
        next_morning = now.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
        expires_at = next_morning
    else:
        # Expires 1 hour from now, but not after 9 PM
        one_hour_later = now + timedelta(hours=1)
        if one_hour_later.hour >= 21:
            expires_at = now.replace(hour=21, minute=0, second=0, microsecond=0)
        else:
            expires_at = one_hour_later
    
    order = Order(
        buyer_id=current_user.id,
        seller_id=product["seller_id"],
        product_id=order_data.product_id,
        quantity=order_data.quantity,
        total_price=total_price,
        delivery_method=order_data.delivery_method,
        delivery_fee=delivery_fee,
        scheduled_date=order_data.scheduled_date,
        scheduled_time=order_data.scheduled_time,
        buyer_address=order_data.buyer_address,
        expires_at=expires_at
    )
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    if order_dict.get('accepted_at'):
        order_dict['accepted_at'] = order_dict['accepted_at'].isoformat()
    if order_dict.get('completed_at'):
        order_dict['completed_at'] = order_dict['completed_at'].isoformat()
    if order_dict.get('expires_at'):
        order_dict['expires_at'] = order_dict['expires_at'].isoformat()
    if order_dict.get('cancelled_at'):
        order_dict['cancelled_at'] = order_dict['cancelled_at'].isoformat()
    await db.orders.insert_one(order_dict)
    
    return order

@api_router.get("/orders/my")
async def get_my_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"buyer_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Auto-expire pending orders
    now = datetime.now(timezone.utc)
    for order in orders:
        if order["status"] == "pending" and order.get("expires_at"):
            expires_at = datetime.fromisoformat(order["expires_at"].replace('Z', '+00:00'))
            if now > expires_at:
                await db.orders.update_one(
                    {"id": order["id"]},
                    {"$set": {"status": "expired"}}
                )
                order["status"] = "expired"
    
    return orders

@api_router.get("/orders/seller")
async def get_seller_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"seller_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Auto-expire pending orders
    now = datetime.now(timezone.utc)
    for order in orders:
        if order["status"] == "pending" and order.get("expires_at"):
            expires_at = datetime.fromisoformat(order["expires_at"].replace('Z', '+00:00'))
            if now > expires_at:
                await db.orders.update_one(
                    {"id": order["id"]},
                    {"$set": {"status": "expired"}}
                )
                order["status"] = "expired"
    
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["seller_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {"status": status}
    if status == "accepted":
        update_data["accepted_at"] = datetime.now(timezone.utc).isoformat()
    elif status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    return {"success": True}

@api_router.post("/chat/messages")
async def send_message(msg_data: ChatMessageCreate, current_user: User = Depends(get_current_user)):
    message = ChatMessage(
        order_id=msg_data.order_id,
        sender_id=current_user.id,
        receiver_id=msg_data.receiver_id,
        message=msg_data.message,
        photo=msg_data.photo
    )
    msg_dict = message.model_dump()
    msg_dict['timestamp'] = msg_dict['timestamp'].isoformat()
    await db.chat_messages.insert_one(msg_dict)
    return message

@api_router.get("/chat/messages/{order_id}")
async def get_messages(order_id: str, current_user: User = Depends(get_current_user)):
    messages = await db.chat_messages.find({"order_id": order_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return messages

@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": review_data.order_id, "buyer_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    product = await db.products.find_one({"id": order["product_id"]}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    review = Review(
        order_id=review_data.order_id,
        store_id=product["store_id"],
        buyer_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
        photos=review_data.photos
    )
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    await db.reviews.insert_one(review_dict)
    
    reviews = await db.reviews.find({"store_id": product["store_id"]}, {"_id": 0}).to_list(1000)
    avg_rating = sum([r["rating"] for r in reviews]) / len(reviews) if reviews else 0
    await db.stores.update_one(
        {"id": product["store_id"]},
        {"$set": {"rating": round(avg_rating, 1), "total_reviews": len(reviews)}}
    )
    
    return review

@api_router.get("/reviews/store/{store_id}")
async def get_store_reviews(store_id: str):
    reviews = await db.reviews.find({"store_id": store_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reviews

@api_router.post("/wallet/transactions")
async def create_transaction(transaction_type: str, amount: float, description: str, current_user: User = Depends(get_current_user)):
    transaction = Transaction(
        user_id=current_user.id,
        transaction_type=transaction_type,
        amount=amount,
        description=description
    )
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.transactions.insert_one(trans_dict)
    return transaction

@api_router.get("/wallet/transactions/my")
async def get_my_transactions(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return transactions

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
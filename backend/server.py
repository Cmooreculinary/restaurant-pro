from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import json
from datetime import datetime, timezone, timedelta
import httpx
import stripe
import anthropic
import bcrypt
import hashlib
import hmac

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
if "*" in CORS_ORIGINS:
    raise RuntimeError("CORS_ORIGINS must contain explicit origins")

app = FastAPI(title="Restaurateur Pro API")
api_router = APIRouter(prefix="/api")

# ==================== BUSINESS PROFILE MODELS ====================

class ConceptBasics(BaseModel):
    restaurant_name: str = ""
    concept_type: str = ""  # fine_dining, casual, fast_casual, qsr, cafe, bar
    cuisine_types: List[str] = []
    tagline: str = ""
    description: str = ""
    unique_selling_points: List[str] = []

class LocationInfo(BaseModel):
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = "USA"
    coordinates: Dict[str, float] = {"lat": 0, "lng": 0}
    square_footage: int = 0
    seating_capacity: int = 0
    has_patio: bool = False
    patio_seats: int = 0
    parking_spaces: int = 0

class FinancialInfo(BaseModel):
    total_budget: float = 0
    construction_budget: float = 0
    equipment_budget: float = 0
    working_capital: float = 0
    funding_sources: List[str] = []
    target_revenue_monthly: float = 0
    target_food_cost_percent: float = 30
    target_labor_cost_percent: float = 30

class OperationalInfo(BaseModel):
    target_open_date: str = ""
    operating_hours: Dict[str, Dict[str, str]] = {}
    service_types: List[str] = []  # dine_in, takeout, delivery, catering
    pos_system: str = ""
    reservation_system: str = ""
    delivery_partners: List[str] = []

class MenuInfo(BaseModel):
    price_range: str = ""  # $, $$, $$$, $$$$
    signature_dishes: List[Dict[str, Any]] = []
    dietary_options: List[str] = []  # vegetarian, vegan, gluten_free, etc.
    beverage_program: str = ""  # full_bar, beer_wine, non_alcoholic

class TeamInfo(BaseModel):
    owner_name: str = ""
    owner_experience: str = ""
    key_positions_needed: List[str] = []
    total_staff_needed: int = 0
    management_structure: str = ""

class BrandingInfo(BaseModel):
    brand_colors: List[str] = []
    brand_voice: str = ""  # formal, casual, playful, sophisticated
    target_demographic: str = ""
    target_age_range: str = ""
    social_media_handles: Dict[str, str] = {}
    website_url: str = ""

class BusinessProfile(BaseModel):
    profile_id: str = Field(default_factory=lambda: f"bp_{uuid.uuid4().hex[:12]}")
    user_id: str
    concept: ConceptBasics = Field(default_factory=ConceptBasics)
    location: LocationInfo = Field(default_factory=LocationInfo)
    financial: FinancialInfo = Field(default_factory=FinancialInfo)
    operational: OperationalInfo = Field(default_factory=OperationalInfo)
    menu: MenuInfo = Field(default_factory=MenuInfo)
    team: TeamInfo = Field(default_factory=TeamInfo)
    branding: BrandingInfo = Field(default_factory=BrandingInfo)
    onboarding_completed: bool = False
    onboarding_step: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BusinessProfileUpdate(BaseModel):
    section: str
    data: Dict[str, Any]

# ==================== USER MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    onboarding_completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== PROJECT MODELS ====================

class Project(BaseModel):
    project_id: str = Field(default_factory=lambda: f"proj_{uuid.uuid4().hex[:12]}")
    user_id: str
    profile_id: str  # Links to BusinessProfile
    name: str
    phase: str = "concept"
    completion: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: f"TSK-{uuid.uuid4().hex[:8].upper()}")
    project_id: str
    user_id: str
    title: str
    description: str = ""
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[str] = None
    category: str = "general"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[str] = None
    category: str = "general"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None

class TeamMember(BaseModel):
    member_id: str = Field(default_factory=lambda: f"mem_{uuid.uuid4().hex[:8]}")
    profile_id: str
    user_id: str
    name: str
    role: str
    email: str = ""
    phone: str = ""
    avatar_color: str = "purple"
    status: str = "active"
    hire_date: Optional[str] = None
    notes: str = ""

class TeamMemberCreate(BaseModel):
    name: str
    role: str
    email: str = ""
    phone: str = ""
    avatar_color: str = "purple"
    hire_date: Optional[str] = None
    notes: str = ""

class BudgetItem(BaseModel):
    budget_id: str = Field(default_factory=lambda: f"bgt_{uuid.uuid4().hex[:8]}")
    profile_id: str
    user_id: str
    category: str
    subcategory: str = ""
    planned: float
    spent: float = 0
    notes: str = ""

class BudgetItemCreate(BaseModel):
    category: str
    subcategory: str = ""
    planned: float
    spent: float = 0
    notes: str = ""

class Equipment(BaseModel):
    equipment_id: str = Field(default_factory=lambda: f"EQ-{uuid.uuid4().hex[:6].upper()}")
    profile_id: str
    user_id: str
    name: str
    category: str = ""
    specs: str
    vendor: str = ""
    cost: float = 0
    status: str = "pending"
    notes: str = ""

class EquipmentCreate(BaseModel):
    name: str
    category: str = ""
    specs: str
    vendor: str = ""
    cost: float = 0
    status: str = "pending"
    notes: str = ""

class Permit(BaseModel):
    permit_id: str = Field(default_factory=lambda: f"pmt_{uuid.uuid4().hex[:8]}")
    profile_id: str
    user_id: str
    name: str
    issuing_authority: str = ""
    status: str = "pending"
    submitted_date: Optional[str] = None
    approved_date: Optional[str] = None
    expiry_date: Optional[str] = None
    cost: float = 0
    notes: str = ""

class PermitCreate(BaseModel):
    name: str
    issuing_authority: str = ""
    status: str = "pending"
    submitted_date: Optional[str] = None
    cost: float = 0
    notes: str = ""

class Vendor(BaseModel):
    vendor_id: str = Field(default_factory=lambda: f"vnd_{uuid.uuid4().hex[:8]}")
    profile_id: str
    user_id: str
    name: str
    category: str
    contact_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    payment_terms: str = ""
    status: str = "active"
    notes: str = ""

class VendorCreate(BaseModel):
    name: str
    category: str
    contact_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    payment_terms: str = ""
    notes: str = ""

class MenuItem(BaseModel):
    menu_item_id: str = Field(default_factory=lambda: f"mnu_{uuid.uuid4().hex[:8]}")
    profile_id: str
    user_id: str
    name: str
    description: str = ""
    category: str
    cost: float
    price: float
    dietary_tags: List[str] = []
    is_signature: bool = False
    is_active: bool = True

class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    category: str
    cost: float
    price: float
    dietary_tags: List[str] = []
    is_signature: bool = False

class LeaseClause(BaseModel):
    clause_id: str = Field(default_factory=lambda: f"cls_{uuid.uuid4().hex[:8]}")
    profile_id: str
    user_id: str
    title: str
    original_text: str = ""
    proposed_text: str = ""
    status: str = "reviewing"
    priority: str = "medium"
    notes: str = ""

class HiringCandidate(BaseModel):
    candidate_id: str = Field(default_factory=lambda: f"cnd_{uuid.uuid4().hex[:8]}")
    profile_id: str
    user_id: str
    name: str
    position: str
    email: str = ""
    phone: str = ""
    stage: str = "application"
    resume_notes: str = ""
    interview_notes: str = ""
    salary_expectation: float = 0
    start_date: Optional[str] = None

class HiringCandidateCreate(BaseModel):
    name: str
    position: str
    email: str = ""
    phone: str = ""
    stage: str = "application"
    resume_notes: str = ""
    salary_expectation: float = 0

class Unit(BaseModel):
    unit_id: str = Field(default_factory=lambda: f"unit_{uuid.uuid4().hex[:8]}")
    user_id: str
    profile_id: str
    name: str
    location: str
    status: str = "active"
    monthly_revenue: float = 0
    open_date: Optional[str] = None

class Notification(BaseModel):
    notification_id: str = Field(default_factory=lambda: f"ntf_{uuid.uuid4().hex[:8]}")
    user_id: str
    title: str
    message: str
    type: str = "info"
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIAnalysisRequest(BaseModel):
    analysis_type: str
    content: str
    context: Optional[Dict[str, Any]] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Extract and validate user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_user_profile(user: User) -> dict:
    """Get or create user's business profile"""
    profile = await db.business_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        new_profile = BusinessProfile(user_id=user.user_id)
        doc = new_profile.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.business_profiles.insert_one(doc)
        profile = doc
        profile.pop("_id", None)
    return profile

# ==================== AUTH ENDPOINTS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if stored_hash.startswith("$2"):
        try:
            return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
        except ValueError:
            return False
    legacy_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, stored_hash)

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

@api_router.post("/auth/register")
async def register(data: RegisterRequest, response: Response):
    """Register a new user with email and password"""
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    if len(data.password) < 12:
        raise HTTPException(status_code=400, detail="Password must be at least 12 characters")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    password_hash = hash_password(data.password)
    
    new_user = {
        "user_id": user_id,
        "email": data.email.lower(),
        "name": data.name or data.email.split("@")[0],
        "password_hash": password_hash,
        "picture": None,
        "onboarding_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    
    # Create business profile
    new_profile = BusinessProfile(user_id=user_id)
    profile_doc = new_profile.model_dump()
    profile_doc["created_at"] = profile_doc["created_at"].isoformat()
    profile_doc["updated_at"] = profile_doc["updated_at"].isoformat()
    await db.business_profiles.insert_one(profile_doc)
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_response = {k: v for k, v in new_user.items() if k != "password_hash"}
    return user_response

@api_router.post("/auth/login")
async def login(data: LoginRequest, response: Response):
    """Login with email and password"""
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    stored_hash = user.get("password_hash", "")
    if not verify_password(data.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not stored_hash.startswith("$2"):
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"password_hash": hash_password(data.password)}},
        )
    
    user_id = user["user_id"]
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    return user_response

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user with profile status"""
    profile = await get_user_profile(user)
    return {
        **user.model_dump(),
        "profile_id": profile.get("profile_id"),
        "onboarding_completed": profile.get("onboarding_completed", False),
        "onboarding_step": profile.get("onboarding_step", 0)
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== BUSINESS PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    """Get user's complete business profile"""
    profile = await get_user_profile(user)
    return profile

@api_router.put("/profile")
async def update_profile(data: BusinessProfileUpdate, user: User = Depends(get_current_user)):
    """Update a section of the business profile"""
    profile = await get_user_profile(user)
    
    valid_sections = ["concept", "location", "financial", "operational", "menu", "team", "branding"]
    if data.section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"Invalid section. Must be one of: {valid_sections}")
    
    update_data = {
        f"{data.section}": data.data,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.business_profiles.update_one(
        {"profile_id": profile["profile_id"]},
        {"$set": update_data}
    )
    
    updated_profile = await db.business_profiles.find_one({"profile_id": profile["profile_id"]}, {"_id": 0})
    return updated_profile

@api_router.put("/profile/onboarding-step")
async def update_onboarding_step(data: dict, user: User = Depends(get_current_user)):
    """Update onboarding progress"""
    profile = await get_user_profile(user)
    
    step = data.get("step", 0)
    completed = data.get("completed", False)
    
    update_data = {
        "onboarding_step": step,
        "onboarding_completed": completed,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.business_profiles.update_one(
        {"profile_id": profile["profile_id"]},
        {"$set": update_data}
    )
    
    if completed:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"onboarding_completed": True}}
        )
    
    return {"step": step, "completed": completed}

@api_router.get("/profile/summary")
async def get_profile_summary(user: User = Depends(get_current_user)):
    """Get a summary of key business data for dashboards"""
    profile = await get_user_profile(user)
    
    # Get counts
    team_count = await db.team_members.count_documents({"profile_id": profile["profile_id"]})
    menu_count = await db.menu_items.count_documents({"profile_id": profile["profile_id"]})
    vendor_count = await db.vendors.count_documents({"profile_id": profile["profile_id"]})
    equipment_count = await db.equipment.count_documents({"profile_id": profile["profile_id"]})
    permit_count = await db.permits.count_documents({"profile_id": profile["profile_id"]})
    
    # Calculate budget totals
    budget_items = await db.budget_items.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    total_planned = sum(item.get("planned", 0) for item in budget_items)
    total_spent = sum(item.get("spent", 0) for item in budget_items)
    
    return {
        "profile_id": profile["profile_id"],
        "restaurant_name": profile.get("concept", {}).get("restaurant_name", ""),
        "concept_type": profile.get("concept", {}).get("concept_type", ""),
        "location": f"{profile.get('location', {}).get('city', '')}, {profile.get('location', {}).get('state', '')}",
        "address": profile.get("location", {}).get("address", ""),
        "total_budget": profile.get("financial", {}).get("total_budget", 0),
        "budget_spent": total_spent,
        "budget_planned": total_planned,
        "team_count": team_count,
        "menu_count": menu_count,
        "vendor_count": vendor_count,
        "equipment_count": equipment_count,
        "permit_count": permit_count,
        "target_open_date": profile.get("operational", {}).get("target_open_date", ""),
        "onboarding_completed": profile.get("onboarding_completed", False)
    }

# ==================== TEAM ENDPOINTS ====================

@api_router.get("/team")
async def get_team(user: User = Depends(get_current_user)):
    """Get all team members"""
    profile = await get_user_profile(user)
    members = await db.team_members.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    return members

@api_router.post("/team")
async def add_team_member(data: TeamMemberCreate, user: User = Depends(get_current_user)):
    """Add a new team member"""
    profile = await get_user_profile(user)
    member = TeamMember(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        **data.model_dump()
    )
    doc = member.model_dump()
    await db.team_members.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/team/{member_id}")
async def update_team_member(member_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a team member"""
    data.pop("_id", None)
    data.pop("member_id", None)
    data.pop("profile_id", None)
    data.pop("user_id", None)
    
    await db.team_members.update_one(
        {"member_id": member_id, "user_id": user.user_id},
        {"$set": data}
    )
    member = await db.team_members.find_one({"member_id": member_id}, {"_id": 0})
    return member

@api_router.delete("/team/{member_id}")
async def delete_team_member(member_id: str, user: User = Depends(get_current_user)):
    """Delete a team member"""
    await db.team_members.delete_one({"member_id": member_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== BUDGET ENDPOINTS ====================

@api_router.get("/budget")
async def get_budget(user: User = Depends(get_current_user)):
    """Get all budget items"""
    profile = await get_user_profile(user)
    items = await db.budget_items.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/budget")
async def create_budget_item(data: BudgetItemCreate, user: User = Depends(get_current_user)):
    """Create a new budget item"""
    profile = await get_user_profile(user)
    item = BudgetItem(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        **data.model_dump()
    )
    doc = item.model_dump()
    await db.budget_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/budget/{budget_id}")
async def update_budget_item(budget_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a budget item"""
    data.pop("_id", None)
    data.pop("budget_id", None)
    await db.budget_items.update_one(
        {"budget_id": budget_id, "user_id": user.user_id},
        {"$set": data}
    )
    item = await db.budget_items.find_one({"budget_id": budget_id}, {"_id": 0})
    return item

@api_router.delete("/budget/{budget_id}")
async def delete_budget_item(budget_id: str, user: User = Depends(get_current_user)):
    """Delete a budget item"""
    await db.budget_items.delete_one({"budget_id": budget_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== EQUIPMENT ENDPOINTS ====================

@api_router.get("/equipment")
async def get_equipment(user: User = Depends(get_current_user)):
    """Get all equipment"""
    profile = await get_user_profile(user)
    items = await db.equipment.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/equipment")
async def add_equipment(data: EquipmentCreate, user: User = Depends(get_current_user)):
    """Add new equipment"""
    profile = await get_user_profile(user)
    equipment = Equipment(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        **data.model_dump()
    )
    doc = equipment.model_dump()
    await db.equipment.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/equipment/{equipment_id}")
async def update_equipment(equipment_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update equipment"""
    data.pop("_id", None)
    data.pop("equipment_id", None)
    await db.equipment.update_one(
        {"equipment_id": equipment_id, "user_id": user.user_id},
        {"$set": data}
    )
    item = await db.equipment.find_one({"equipment_id": equipment_id}, {"_id": 0})
    return item

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, user: User = Depends(get_current_user)):
    """Delete equipment"""
    await db.equipment.delete_one({"equipment_id": equipment_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== PERMITS ENDPOINTS ====================

@api_router.get("/permits")
async def get_permits(user: User = Depends(get_current_user)):
    """Get all permits"""
    profile = await get_user_profile(user)
    permits = await db.permits.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    return permits

@api_router.post("/permits")
async def add_permit(data: PermitCreate, user: User = Depends(get_current_user)):
    """Add a new permit"""
    profile = await get_user_profile(user)
    permit = Permit(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        **data.model_dump()
    )
    doc = permit.model_dump()
    await db.permits.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/permits/{permit_id}")
async def update_permit(permit_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a permit"""
    data.pop("_id", None)
    data.pop("permit_id", None)
    await db.permits.update_one(
        {"permit_id": permit_id, "user_id": user.user_id},
        {"$set": data}
    )
    permit = await db.permits.find_one({"permit_id": permit_id}, {"_id": 0})
    return permit

@api_router.delete("/permits/{permit_id}")
async def delete_permit(permit_id: str, user: User = Depends(get_current_user)):
    """Delete a permit"""
    await db.permits.delete_one({"permit_id": permit_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== VENDORS ENDPOINTS ====================

@api_router.get("/vendors")
async def get_vendors(user: User = Depends(get_current_user)):
    """Get all vendors"""
    profile = await get_user_profile(user)
    vendors = await db.vendors.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    return vendors

@api_router.post("/vendors")
async def add_vendor(data: VendorCreate, user: User = Depends(get_current_user)):
    """Add a new vendor"""
    profile = await get_user_profile(user)
    vendor = Vendor(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        **data.model_dump()
    )
    doc = vendor.model_dump()
    await db.vendors.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a vendor"""
    data.pop("_id", None)
    data.pop("vendor_id", None)
    await db.vendors.update_one(
        {"vendor_id": vendor_id, "user_id": user.user_id},
        {"$set": data}
    )
    vendor = await db.vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    return vendor

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, user: User = Depends(get_current_user)):
    """Delete a vendor"""
    await db.vendors.delete_one({"vendor_id": vendor_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== MENU ITEMS ENDPOINTS ====================

@api_router.get("/menu-items")
async def get_menu_items(user: User = Depends(get_current_user)):
    """Get all menu items"""
    profile = await get_user_profile(user)
    items = await db.menu_items.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(200)
    return items

@api_router.post("/menu-items")
async def add_menu_item(data: MenuItemCreate, user: User = Depends(get_current_user)):
    """Add a new menu item"""
    profile = await get_user_profile(user)
    item = MenuItem(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        **data.model_dump()
    )
    doc = item.model_dump()
    await db.menu_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/menu-items/{menu_item_id}")
async def update_menu_item(menu_item_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a menu item"""
    data.pop("_id", None)
    data.pop("menu_item_id", None)
    await db.menu_items.update_one(
        {"menu_item_id": menu_item_id, "user_id": user.user_id},
        {"$set": data}
    )
    item = await db.menu_items.find_one({"menu_item_id": menu_item_id}, {"_id": 0})
    return item

@api_router.delete("/menu-items/{menu_item_id}")
async def delete_menu_item(menu_item_id: str, user: User = Depends(get_current_user)):
    """Delete a menu item"""
    await db.menu_items.delete_one({"menu_item_id": menu_item_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== HIRING CANDIDATES ENDPOINTS ====================

@api_router.get("/candidates")
async def get_candidates(user: User = Depends(get_current_user)):
    """Get all hiring candidates"""
    profile = await get_user_profile(user)
    candidates = await db.candidates.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    return candidates

@api_router.post("/candidates")
async def add_candidate(data: HiringCandidateCreate, user: User = Depends(get_current_user)):
    """Add a new candidate"""
    profile = await get_user_profile(user)
    candidate = HiringCandidate(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        **data.model_dump()
    )
    doc = candidate.model_dump()
    await db.candidates.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/candidates/{candidate_id}")
async def update_candidate(candidate_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a candidate"""
    data.pop("_id", None)
    data.pop("candidate_id", None)
    await db.candidates.update_one(
        {"candidate_id": candidate_id, "user_id": user.user_id},
        {"$set": data}
    )
    candidate = await db.candidates.find_one({"candidate_id": candidate_id}, {"_id": 0})
    return candidate

@api_router.delete("/candidates/{candidate_id}")
async def delete_candidate(candidate_id: str, user: User = Depends(get_current_user)):
    """Delete a candidate"""
    await db.candidates.delete_one({"candidate_id": candidate_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== LEASE CLAUSES ENDPOINTS ====================

@api_router.get("/lease-clauses")
async def get_lease_clauses(user: User = Depends(get_current_user)):
    """Get all lease clauses"""
    profile = await get_user_profile(user)
    clauses = await db.lease_clauses.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    return clauses

@api_router.post("/lease-clauses")
async def add_lease_clause(data: dict, user: User = Depends(get_current_user)):
    """Add a new lease clause"""
    profile = await get_user_profile(user)
    clause = LeaseClause(
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        title=data["title"],
        original_text=data.get("original_text", ""),
        proposed_text=data.get("proposed_text", ""),
        status=data.get("status", "reviewing"),
        priority=data.get("priority", "medium"),
        notes=data.get("notes", "")
    )
    doc = clause.model_dump()
    await db.lease_clauses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/lease-clauses/{clause_id}")
async def update_lease_clause(clause_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a lease clause"""
    data.pop("_id", None)
    data.pop("clause_id", None)
    await db.lease_clauses.update_one(
        {"clause_id": clause_id, "user_id": user.user_id},
        {"$set": data}
    )
    clause = await db.lease_clauses.find_one({"clause_id": clause_id}, {"_id": 0})
    return clause

@api_router.delete("/lease-clauses/{clause_id}")
async def delete_lease_clause(clause_id: str, user: User = Depends(get_current_user)):
    """Delete a lease clause"""
    await db.lease_clauses.delete_one({"clause_id": clause_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== TASKS ENDPOINTS ====================

@api_router.get("/tasks")
async def get_tasks(user: User = Depends(get_current_user)):
    """Get all tasks"""
    tasks = await db.tasks.find({"user_id": user.user_id}, {"_id": 0}).to_list(200)
    return tasks

@api_router.post("/tasks")
async def create_task(data: TaskCreate, user: User = Depends(get_current_user)):
    """Create a new task"""
    task = Task(
        project_id=data.project_id,
        user_id=user.user_id,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=data.due_date,
        category=data.category
    )
    doc = task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a task"""
    data.pop("_id", None)
    data.pop("task_id", None)
    await db.tasks.update_one(
        {"task_id": task_id, "user_id": user.user_id},
        {"$set": data}
    )
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    """Delete a task"""
    await db.tasks.delete_one({"task_id": task_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== UNITS ENDPOINTS ====================

@api_router.get("/units")
async def get_units(user: User = Depends(get_current_user)):
    """Get all units"""
    units = await db.units.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return units

@api_router.post("/units")
async def add_unit(data: dict, user: User = Depends(get_current_user)):
    """Add a new unit"""
    profile = await get_user_profile(user)
    unit = Unit(
        user_id=user.user_id,
        profile_id=profile["profile_id"],
        name=data["name"],
        location=data["location"],
        status=data.get("status", "active"),
        monthly_revenue=data.get("monthly_revenue", 0),
        open_date=data.get("open_date")
    )
    doc = unit.model_dump()
    await db.units.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/units/{unit_id}")
async def update_unit(unit_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a unit"""
    data.pop("_id", None)
    data.pop("unit_id", None)
    await db.units.update_one(
        {"unit_id": unit_id, "user_id": user.user_id},
        {"$set": data}
    )
    unit = await db.units.find_one({"unit_id": unit_id}, {"_id": 0})
    return unit

@api_router.delete("/units/{unit_id}")
async def delete_unit(unit_id: str, user: User = Depends(get_current_user)):
    """Delete a unit"""
    await db.units.delete_one({"unit_id": unit_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== NOTIFICATIONS ENDPOINTS ====================

@api_router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user)):
    """Get notifications"""
    notifications = await db.notifications.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.post("/notifications/read")
async def mark_notifications_read(user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

# ==================== AI ANALYSIS ====================

@api_router.post("/ai/analyze")
async def ai_analysis(data: AIAnalysisRequest, user: User = Depends(get_current_user)):
    """AI-powered analysis"""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    profile = await get_user_profile(user)

    system_messages = {
        "lease": f"You are an expert restaurant lease analyst. The restaurant is called '{profile.get('concept', {}).get('restaurant_name', 'the restaurant')}', a {profile.get('concept', {}).get('concept_type', '')} concept. Analyze lease terms and identify potential issues, favorable clauses, and negotiation points. Provide actionable recommendations.",
        "menu": f"You are a restaurant menu engineering expert. The restaurant is '{profile.get('concept', {}).get('restaurant_name', 'the restaurant')}', targeting a {profile.get('menu', {}).get('price_range', '')} price point. Analyze menu items for profitability, pricing strategy, and cost optimization. Provide specific recommendations.",
        "cost": f"You are a restaurant cost analyst. Target food cost is {profile.get('financial', {}).get('target_food_cost_percent', 30)}%. Calculate food costs, suggest pricing, and identify opportunities for cost reduction while maintaining quality.",
        "site": f"You are a restaurant site analysis expert. The concept is a {profile.get('concept', {}).get('concept_type', '')} restaurant. Evaluate location potential based on demographics, foot traffic, competition, and market conditions.",
        "business": f"You are a restaurant business consultant. The restaurant is '{profile.get('concept', {}).get('restaurant_name', 'the restaurant')}' with a total budget of ${profile.get('financial', {}).get('total_budget', 0):,.0f}. Provide strategic advice."
    }

    system_message = system_messages.get(data.analysis_type, "You are a helpful restaurant business assistant.")

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        system=system_message,
        messages=[{"role": "user", "content": data.content}],
    )
    return {"analysis": message.content[0].text.strip(), "type": data.analysis_type}

@api_router.post("/ai/cost-calculator")
async def ai_cost_calculator(data: dict, user: User = Depends(get_current_user)):
    """AI-powered recipe cost calculator"""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    profile = await get_user_profile(user)
    target_food_cost = profile.get("financial", {}).get("target_food_cost_percent", 30)
    ingredients = data.get("ingredients", "")
    servings = data.get("servings", 1)

    system = f"""You are a restaurant cost calculator. The target food cost percentage is {target_food_cost}%. Given ingredient costs and quantities, calculate:
1. Total recipe cost
2. Cost per serving
3. Suggested menu price (targeting {target_food_cost}% food cost)
4. Profit margin analysis
Respond in a structured format."""

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": f"Calculate costs for this recipe:\n{ingredients}\nNumber of servings: {servings}"}],
    )
    return {"calculation": message.content[0].text.strip()}

# ==================== SITE DEMOGRAPHICS ====================

@api_router.get("/site/demographics")
async def get_site_demographics(lat: float = 40.7128, lng: float = -74.0060, user: User = Depends(get_current_user)):
    """Get demographics for a location"""
    import random
    
    profile = await get_user_profile(user)
    profile_lat = profile.get("location", {}).get("coordinates", {}).get("lat", lat)
    profile_lng = profile.get("location", {}).get("coordinates", {}).get("lng", lng)
    
    if profile_lat != 0:
        lat = profile_lat
    if profile_lng != 0:
        lng = profile_lng
    
    base_foot_traffic = 12500
    variation = random.randint(-500, 500)
    
    return {
        "foot_traffic": {
            "daily": base_foot_traffic + variation,
            "trend": "+8.2%",
            "peak_hours": "12pm - 2pm, 6pm - 9pm"
        },
        "competition": {
            "count": random.randint(18, 24),
            "density": "medium",
            "nearest_competitor": "0.3 mi"
        },
        "income": {
            "median": 78500 + random.randint(-2000, 2000),
            "bracket": "$75k-$100k",
            "trend": "+4.1%"
        },
        "walkability": {
            "score": random.randint(85, 95),
            "grade": "A",
            "transit_score": random.randint(80, 90)
        },
        "population": {
            "density": 28500,
            "growth": "+2.3%",
            "age_median": 34
        }
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Restaurateur Pro API", "version": "2.0", "status": "operational"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== STRIPE SUBSCRIPTIONS ====================

SUBSCRIPTION_PLANS = {
    "single_unit": {
        "name": "Single Unit",
        "price": 14.00,
        "price_id": "price_1TEsmoHAM0vSVVVHU5WvspOt",
        "features": [
            "1 Restaurant Project",
            "Command Center Access",
            "Site Strategist",
            "Ground Up Module",
            "Ops Launchpad",
            "Email Support"
        ]
    },
    "multi_unit": {
        "name": "Multi-Unit",
        "price": 18.00,
        "price_id": "price_1TEsogHAM0vSVVVHFPc8kY5T",
        "features": [
            "Unlimited Restaurant Projects",
            "All Single Unit Features",
            "Expansion Toolkit",
            "Lease Negotiation Module",
            "AI-Powered Analysis",
            "Priority Support",
            "Franchise Readiness Tools"
        ]
    }
}

class SubscriptionRequest(BaseModel):
    plan_id: str
    origin_url: str

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": plan_id,
                "name": plan["name"],
                "price": plan["price"],
                "features": plan["features"],
                "has_price_id": plan["price_id"] is not None
            }
            for plan_id, plan in SUBSCRIPTION_PLANS.items()
        ]
    }

@api_router.post("/subscriptions/checkout")
async def create_subscription_checkout(data: SubscriptionRequest, request: Request, user: User = Depends(get_current_user)):
    """Create a Stripe checkout session"""
    if data.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    plan = SUBSCRIPTION_PLANS[data.plan_id]
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    stripe.api_key = stripe_api_key
    success_url = f"{data.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/pricing"

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": plan["price_id"], "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email,
            metadata={
                "user_id": user.user_id,
                "user_email": user.email,
                "plan_id": data.plan_id,
                "plan_name": plan["name"],
            },
        )

        await db.payment_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "session_id": session.id,
            "user_id": user.user_id,
            "user_email": user.email,
            "plan_id": data.plan_id,
            "plan_name": plan["name"],
            "amount": plan["price"],
            "currency": "usd",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        return {"url": session.url, "session_id": session.id}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/status/{session_id}")
async def get_subscription_status(session_id: str, user: User = Depends(get_current_user)):
    """Check payment status"""
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    stripe.api_key = stripe_api_key

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_status = session.payment_status
        status_val = session.status

        existing = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})

        if existing and existing.get("payment_status") != "paid" and payment_status == "paid":
            await db.users.update_one(
                {"user_id": user.user_id},
                {"$set": {
                    "subscription_plan": existing.get("plan_id"),
                    "subscription_status": "active",
                    "subscription_updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )

        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": payment_status,
                "status": status_val,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )

        return {
            "status": status_val,
            "payment_status": payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency,
        }

    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/my-subscription")
async def get_my_subscription(user: User = Depends(get_current_user)):
    """Get current subscription"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {
        "plan": user_doc.get("subscription_plan"),
        "status": user_doc.get("subscription_status", "none"),
        "updated_at": user_doc.get("subscription_updated_at")
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    stripe.api_key = stripe_api_key
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhook is not configured")
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    try:
        event = stripe.Webhook.construct_event(body, signature, webhook_secret)
    except (stripe.error.SignatureVerificationError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        session_id = data.get("id")
        payment_status = data.get("payment_status", "paid")
        if session_id:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": payment_status,
                    "webhook_event": event_type,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )

    return {"received": True}

# ==================== MIDDLEWARE & STARTUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type", "Stripe-Signature"],
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

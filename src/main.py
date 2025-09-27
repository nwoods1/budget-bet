from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
import re

# ----------------------------
# Mongo connection + DB handles
# ----------------------------
try:
    client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    db = client["hackathon"]

    users_col = db["users"]
    groups_col = db["groups"]
    bets_col = db["bets"]  # for later
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    print("💡 Make sure MongoDB is running on localhost:27017")

# ----------------------------
# FastAPI app + CORS
# ----------------------------
app = FastAPI(title="BudgetBet API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # CRA/Next dev
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Pydantic models
# ----------------------------
USERNAME_RE = re.compile(r"^[a-zA-Z0-9._-]{3,20}$")

class UserCreate(BaseModel):
    email: str
    username: str = Field(..., description="3–20 chars: letters, numbers, dot, underscore, dash")
    photoURL: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    username: str
    usernameLower: str
    photoURL: Optional[str] = None

class GroupCreate(BaseModel):
    name: str
    ownerId: str  # FE passes the current auth user id (ObjectId string)

class GroupOut(BaseModel):
    id: str
    name: str
    ownerId: str
    members: List[dict]  # [{ userId, role, joinedAt }]

class AddMemberByUsername(BaseModel):
    username: str  # we'll lower it server-side

# ----------------------------
# Helpers
# ----------------------------
def to_object_id(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="Invalid ObjectId")
    return ObjectId(id_str)

def user_doc_to_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        email=doc["email"],
        username=doc["username"],
        usernameLower=doc["usernameLower"],
        photoURL=doc.get("photoURL"),
    )

def group_doc_to_out(doc: dict) -> GroupOut:
    return GroupOut(
        id=str(doc["_id"]),
        name=doc["name"],
        ownerId=str(doc["ownerId"]),
        members=[{
            "userId": str(m["userId"]),
            "role": m["role"],
            "joinedAt": m.get("joinedAt")
        } for m in doc.get("members", [])]
    )

# ----------------------------
# Startup: verify DB and create indexes
# ----------------------------

from typing import List

@app.get("/users/search")
async def search_users(q: str) -> List[dict]:
    """
    Case-insensitive prefix search on usernameLower.
    Example: /users/search?q=nat
    """
    cursor = users_col.find(
        {"usernameLower": {"$regex": f"^{q.lower()}"}},
        {"username": 1, "usernameLower": 1}
    ).limit(10)
    results = []
    async for doc in cursor:
        results.append({"id": str(doc["_id"]), "username": doc["username"], "usernameLower": doc["usernameLower"]})
    return results



@app.on_event("startup")
async def startup_event():
    try:
        await client.admin.command('ping')
        print("✅ MongoDB connection verified!")

        # Unique usernameLower & email for users
        await users_col.create_index("usernameLower", unique=True, name="uniq_usernameLower")
        await users_col.create_index("email", unique=True, name="uniq_email")

        # Useful group indexes
        await groups_col.create_index("ownerId", name="idx_ownerId")
        await groups_col.create_index("members.userId", name="idx_members_userId")

        # Bets (later)
        await bets_col.create_index("groupId", name="idx_bets_groupId")
        await bets_col.create_index("status", name="idx_bets_status")
        await bets_col.create_index([("groupId", 1), ("status", 1)], name="idx_bets_group_status")

    except Exception as e:
        print(f"❌ Startup error: {e}")

# ----------------------------
# Health + root
# ----------------------------
@app.get("/")
async def root():
    return {"message": "BudgetBet API running. See /docs"}

@app.get("/health")
async def health_check():
    try:
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}

# ----------------------------
# USERS
# ----------------------------
@app.post("/users", response_model=UserOut)
async def create_user(user: UserCreate):
    uname = user.username.strip()
    if not USERNAME_RE.match(uname):
        raise HTTPException(status_code=400, detail="Invalid username format")
    doc = {
        "email": user.email.strip().lower(),
        "username": uname,
        "usernameLower": uname.lower(),
        "photoURL": user.photoURL or None,
    }
    try:
        result = await users_col.insert_one(doc)
        created = await users_col.find_one({"_id": result.inserted_id})
        return user_doc_to_out(created)
    except Exception as e:
        # duplicate key errs become 409s
        msg = str(e)
        if "duplicate key error" in msg or "E11000" in msg:
            raise HTTPException(status_code=409, detail="Username or email already in use")
        raise HTTPException(status_code=500, detail=f"DB error: {msg}")

@app.get("/users", response_model=List[UserOut])
async def list_users():
    out = []
    async for u in users_col.find({}).limit(50):
        out.append(user_doc_to_out(u))
    return out

@app.get("/users/by-username/{username}", response_model=UserOut)
async def get_user_by_username(username: str):
    doc = await users_col.find_one({"usernameLower": username.lower()})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_out(doc)

# ----------------------------
# GROUPS
# ----------------------------
@app.post("/groups", response_model=GroupOut)
async def create_group(payload: GroupCreate):
    owner_oid = to_object_id(payload.ownerId)
    owner = await users_col.find_one({"_id": owner_oid})
    if not owner:
        raise HTTPException(status_code=404, detail="Owner user not found")

    group = {
        "name": payload.name.strip(),
        "ownerId": owner_oid,
        "members": [
            {"userId": owner_oid, "role": "owner"}  # joinedAt optional for now
        ],
    }
    try:
        res = await groups_col.insert_one(group)
        new_doc = await groups_col.find_one({"_id": res.inserted_id})
        return group_doc_to_out(new_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

@app.get("/groups", response_model=List[GroupOut])
async def list_my_groups(memberId: Optional[str] = None):
    """
    If memberId is provided, returns groups where that user is a member.
    Otherwise returns up to 50 groups.
    """
    q = {}
    if memberId:
        q = {"members.userId": to_object_id(memberId)}

    out = []
    async for g in groups_col.find(q).limit(50):
        out.append(group_doc_to_out(g))
    return out

@app.post("/groups/{groupId}/members", response_model=GroupOut)
async def add_member_by_username(groupId: str, payload: AddMemberByUsername):
    gid = to_object_id(groupId)
    username_lower = payload.username.strip().lower()

    # Resolve user by username
    user = await users_col.find_one({"usernameLower": username_lower})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Make sure group exists
    group = await groups_col.find_one({"_id": gid})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # If already a member, return group unchanged
    already = any(str(m["userId"]) == str(user["_id"]) for m in group.get("members", []))
    if already:
        # Return normalized group payload
        return group_doc_to_out(group)

    # Add member
    try:
        await groups_col.update_one(
            {"_id": gid},
            {"$push": {"members": {"userId": user["_id"], "role": "member"}}}
        )
        updated = await groups_col.find_one({"_id": gid})
        return group_doc_to_out(updated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

# ----------------------------
# BETS (stub for later)
# ----------------------------
# You will add:
# - POST /bets              { groupId, title, capCents, startDate, endDate, createdBy }
# - POST /bets/{id}/accept  (participant acceptance)
# - GET  /bets/{id}
# - GET  /bets?groupId=...&status=ACTIVE

from datetime import datetime, date
from typing import List, Optional

from bson import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from pymongo import ReturnDocument

MONGO_URI = "mongodb://localhost:27017"
DATABASE_NAME = "hackathon"

try:
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DATABASE_NAME]
    users_collection = db["users"]
    groups_collection = db["groups"]
    bets_collection = db["bets"]
    transactions_collection = db["transactions"]
    print("✅ Connected to MongoDB successfully!")
except Exception as exc:  # pragma: no cover - startup log
    print(f"❌ Failed to connect to MongoDB: {exc}")
    print("💡 Make sure MongoDB is running on localhost:27017")
    raise


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value):  # pragma: no cover - validation helper
        if isinstance(value, ObjectId):
            return value
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid objectid")
        return ObjectId(value)


class UserBase(BaseModel):
    auth_id: str = Field(..., description="Firebase auth identifier")
    email: EmailStr
    username: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserResponse(UserBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True


class UserPublic(BaseModel):
    auth_id: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class GroupCreate(BaseModel):
    name: str
    owner_auth_id: str
    member_usernames: List[str] = []


class GroupMemberAdd(BaseModel):
    username: str


class GroupResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    owner_auth_id: str
    members: List[UserPublic]
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True


class BetCreate(BaseModel):
    group_id: PyObjectId
    created_by: str
    title: str
    description: Optional[str] = None
    budget_limit: float
    deadline: date


class BetAccept(BaseModel):
    auth_id: str


class TransactionCreate(BaseModel):
    auth_id: str
    amount: float
    merchant: str
    category: Optional[str] = None
    occurred_on: date


class BetParticipant(BaseModel):
    auth_id: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    accepted: bool = False
    spending: float = 0.0


class TransactionResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    bet_id: PyObjectId
    auth_id: str
    amount: float
    merchant: str
    category: Optional[str] = None
    occurred_on: date
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True


class BetResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    group_id: PyObjectId
    created_by: str
    title: str
    description: Optional[str] = None
    budget_limit: float
    deadline: date
    status: str
    participants: List[BetParticipant]
    winner_auth_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    activated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    transactions: List[TransactionResponse] = []

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True


class DashboardResponse(BaseModel):
    user: UserPublic
    groups: List[GroupResponse]
    active_bets: List[BetResponse]
    completed_bets: List[BetResponse]


app = FastAPI(title="Budget Bet API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def fetch_user(auth_id: str) -> Optional[dict]:
    return await users_collection.find_one({"auth_id": auth_id})


def serialize_user(document: dict) -> UserResponse:
    return UserResponse.parse_obj(document)


async def build_public_user(auth_id: str) -> UserPublic:
    record = await fetch_user(auth_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"User {auth_id} not found")
    return UserPublic(
        auth_id=record["auth_id"],
        username=record.get("username"),
        display_name=record.get("display_name"),
        photo_url=record.get("photo_url"),
    )


async def build_members(member_ids: List[str]) -> List[UserPublic]:
    members: List[UserPublic] = []
    for auth_id in member_ids:
        try:
            members.append(await build_public_user(auth_id))
        except HTTPException:
            continue
    return members


def normalize_username(username: Optional[str]) -> Optional[str]:
    return username.strip() if username else None


@app.on_event("startup")
async def startup_event() -> None:
    await client.admin.command("ismaster")


@app.post("/api/users/sync", response_model=UserResponse)
async def sync_user(payload: UserBase):
    username = normalize_username(payload.username)
    existing_username = None
    if username:
        username_lower = username.lower()
        existing_username = await users_collection.find_one(
            {"username_lower": username_lower, "auth_id": {"$ne": payload.auth_id}}
        )
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")

    now = datetime.utcnow()
    document = payload.dict()
    if username:
        document["username"] = username
        document["username_lower"] = username.lower()

    document["display_name"] = payload.display_name or payload.username or payload.email.split("@")[0]
    document["updated_at"] = now

    existing = await fetch_user(payload.auth_id)
    if existing:
        await users_collection.update_one({"_id": existing["_id"]}, {"$set": document})
        existing.update(document)
        return serialize_user(existing)

    document["created_at"] = now
    result = await users_collection.insert_one(document)
    new_user = await users_collection.find_one({"_id": result.inserted_id})
    return serialize_user(new_user)


@app.get("/api/users/{auth_id}", response_model=UserResponse)
async def get_user(auth_id: str):
    record = await fetch_user(auth_id)
    if not record:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(record)


@app.patch("/api/users/{auth_id}", response_model=UserResponse)
async def update_user(auth_id: str, payload: UserUpdate):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    if "username" in updates:
        username = normalize_username(updates["username"])
        if not username:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        duplicate = await users_collection.find_one(
            {"username_lower": username.lower(), "auth_id": {"$ne": auth_id}}
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Username already taken")
        updates["username"] = username
        updates["username_lower"] = username.lower()

    updates["updated_at"] = datetime.utcnow()

    document = await users_collection.find_one_and_update(
        {"auth_id": auth_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not document:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(document)


@app.get("/api/users/search", response_model=List[UserPublic])
async def search_users(query: str):
    if len(query.strip()) < 2:
        return []
    cursor = users_collection.find(
        {"username_lower": {"$regex": f"^{query.lower()}"}}
    ).limit(10)
    results = []
    async for record in cursor:
        results.append(
            UserPublic(
                auth_id=record["auth_id"],
                username=record.get("username"),
                display_name=record.get("display_name"),
                photo_url=record.get("photo_url"),
            )
        )
    return results


@app.post("/api/groups", response_model=GroupResponse)
async def create_group(payload: GroupCreate):
    owner = await fetch_user(payload.owner_auth_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    member_ids = {payload.owner_auth_id}
    for username in payload.member_usernames:
        user = await users_collection.find_one({"username_lower": username.strip().lower()})
        if not user:
            raise HTTPException(status_code=404, detail=f"User {username} not found")
        member_ids.add(user["auth_id"])

    now = datetime.utcnow()
    document = {
        "name": payload.name.strip(),
        "owner_auth_id": payload.owner_auth_id,
        "member_auth_ids": sorted(member_ids),
        "created_at": now,
        "updated_at": now,
    }
    result = await groups_collection.insert_one(document)
    created = await groups_collection.find_one({"_id": result.inserted_id})
    members = await build_members(created["member_auth_ids"])
    return GroupResponse(
        _id=created["_id"],
        name=created["name"],
        owner_auth_id=created["owner_auth_id"],
        members=members,
        created_at=created["created_at"],
        updated_at=created["updated_at"],
    )


@app.get("/api/groups", response_model=List[GroupResponse])
async def list_groups(auth_id: str):
    cursor = groups_collection.find({"member_auth_ids": auth_id}).sort("updated_at", -1)
    groups: List[GroupResponse] = []
    async for record in cursor:
        members = await build_members(record["member_auth_ids"])
        groups.append(
            GroupResponse(
                _id=record["_id"],
                name=record["name"],
                owner_auth_id=record["owner_auth_id"],
                members=members,
                created_at=record["created_at"],
                updated_at=record["updated_at"],
            )
        )
    return groups


@app.get("/api/groups/{group_id}", response_model=GroupResponse)
async def get_group(group_id: str):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")
    record = await groups_collection.find_one({"_id": ObjectId(group_id)})
    if not record:
        raise HTTPException(status_code=404, detail="Group not found")
    members = await build_members(record["member_auth_ids"])
    return GroupResponse(
        _id=record["_id"],
        name=record["name"],
        owner_auth_id=record["owner_auth_id"],
        members=members,
        created_at=record["created_at"],
        updated_at=record["updated_at"],
    )


@app.post("/api/groups/{group_id}/members", response_model=GroupResponse)
async def add_group_member(group_id: str, payload: GroupMemberAdd):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")
    username = payload.username.strip().lower()
    user = await users_collection.find_one({"username_lower": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    document = await groups_collection.find_one_and_update(
        {"_id": ObjectId(group_id)},
        {
            "$addToSet": {"member_auth_ids": user["auth_id"]},
            "$set": {"updated_at": datetime.utcnow()},
        },
        return_document=ReturnDocument.AFTER,
    )
    if not document:
        raise HTTPException(status_code=404, detail="Group not found")
    members = await build_members(document["member_auth_ids"])
    return GroupResponse(
        _id=document["_id"],
        name=document["name"],
        owner_auth_id=document["owner_auth_id"],
        members=members,
        created_at=document["created_at"],
        updated_at=document["updated_at"],
    )


@app.post("/api/bets", response_model=BetResponse)
async def create_bet(payload: BetCreate):
    group = await groups_collection.find_one({"_id": payload.group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if payload.created_by not in group["member_auth_ids"]:
        raise HTTPException(status_code=403, detail="Creator must be group member")

    participants: List[BetParticipant] = []
    for auth_id in group["member_auth_ids"]:
        public = await build_public_user(auth_id)
        participants.append(
            BetParticipant(
                auth_id=auth_id,
                username=public.username,
                display_name=public.display_name,
                photo_url=public.photo_url,
                accepted=auth_id == payload.created_by,
                spending=0.0,
            )
        )

    document = {
        "group_id": payload.group_id,
        "created_by": payload.created_by,
        "title": payload.title,
        "description": payload.description,
        "budget_limit": payload.budget_limit,
        "deadline": payload.deadline,
        "status": "pending",
        "participants": [participant.dict() for participant in participants],
        "winner_auth_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "activated_at": None,
        "completed_at": None,
    }

    if len(participants) == 1:
        document["status"] = "active"
        document["activated_at"] = datetime.utcnow()

    result = await bets_collection.insert_one(document)
    created = await bets_collection.find_one({"_id": result.inserted_id})
    transactions = []
    return BetResponse(
        _id=created["_id"],
        group_id=created["group_id"],
        created_by=created["created_by"],
        title=created["title"],
        description=created.get("description"),
        budget_limit=created["budget_limit"],
        deadline=created["deadline"],
        status=created["status"],
        participants=[BetParticipant(**participant) for participant in created["participants"]],
        winner_auth_id=created.get("winner_auth_id"),
        created_at=created["created_at"],
        updated_at=created["updated_at"],
        activated_at=created.get("activated_at"),
        completed_at=created.get("completed_at"),
        transactions=transactions,
    )


async def get_bet_document(bet_id: str) -> dict:
    if not ObjectId.is_valid(bet_id):
        raise HTTPException(status_code=400, detail="Invalid bet id")
    bet = await bets_collection.find_one({"_id": ObjectId(bet_id)})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet


async def aggregate_transactions(bet_id: ObjectId) -> List[TransactionResponse]:
    cursor = transactions_collection.find({"bet_id": bet_id}).sort("occurred_on", 1)
    items: List[TransactionResponse] = []
    async for record in cursor:
        items.append(
            TransactionResponse(
                _id=record["_id"],
                bet_id=record["bet_id"],
                auth_id=record["auth_id"],
                amount=record["amount"],
                merchant=record["merchant"],
                category=record.get("category"),
                occurred_on=record["occurred_on"],
                created_at=record["created_at"],
            )
        )
    return items


async def calculate_status(bet: dict) -> dict:
    participants = [BetParticipant(**participant) for participant in bet["participants"]]
    accepted = all(participant.accepted for participant in participants)
    if bet["status"] == "pending" and accepted:
        bet["status"] = "active"
        bet["activated_at"] = datetime.utcnow()
    return bet


@app.get("/api/bets/{bet_id}", response_model=BetResponse)
async def get_bet(bet_id: str):
    bet = await get_bet_document(bet_id)
    bet = await calculate_status(bet)
    if bet["status"] == "active":
        await bets_collection.update_one(
            {"_id": bet["_id"]},
            {"$set": {"status": bet["status"], "activated_at": bet["activated_at"], "updated_at": datetime.utcnow()}},
        )
    transactions = await aggregate_transactions(bet["_id"])
    return BetResponse(
        _id=bet["_id"],
        group_id=bet["group_id"],
        created_by=bet["created_by"],
        title=bet["title"],
        description=bet.get("description"),
        budget_limit=bet["budget_limit"],
        deadline=bet["deadline"],
        status=bet["status"],
        participants=[BetParticipant(**participant) for participant in bet["participants"]],
        winner_auth_id=bet.get("winner_auth_id"),
        created_at=bet["created_at"],
        updated_at=bet["updated_at"],
        activated_at=bet.get("activated_at"),
        completed_at=bet.get("completed_at"),
        transactions=transactions,
    )


@app.get("/api/groups/{group_id}/bets", response_model=List[BetResponse])
async def list_group_bets(group_id: str):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")
    cursor = bets_collection.find({"group_id": ObjectId(group_id)}).sort("created_at", -1)
    bets: List[BetResponse] = []
    async for record in cursor:
        transactions = await aggregate_transactions(record["_id"])
        bets.append(
            BetResponse(
                _id=record["_id"],
                group_id=record["group_id"],
                created_by=record["created_by"],
                title=record["title"],
                description=record.get("description"),
                budget_limit=record["budget_limit"],
                deadline=record["deadline"],
                status=record["status"],
                participants=[BetParticipant(**participant) for participant in record["participants"]],
                winner_auth_id=record.get("winner_auth_id"),
                created_at=record["created_at"],
                updated_at=record["updated_at"],
                activated_at=record.get("activated_at"),
                completed_at=record.get("completed_at"),
                transactions=transactions,
            )
        )
    return bets


@app.post("/api/bets/{bet_id}/accept", response_model=BetResponse)
async def accept_bet(bet_id: str, payload: BetAccept):
    bet = await get_bet_document(bet_id)
    updated = False
    for participant in bet["participants"]:
        if participant["auth_id"] == payload.auth_id:
            participant["accepted"] = True
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Participant not found")

    bet = await calculate_status(bet)
    bet["updated_at"] = datetime.utcnow()
    await bets_collection.update_one(
        {"_id": bet["_id"]},
        {
            "$set": {
                "participants": bet["participants"],
                "status": bet["status"],
                "activated_at": bet.get("activated_at"),
                "updated_at": bet["updated_at"],
            }
        },
    )
    transactions = await aggregate_transactions(bet["_id"])
    return BetResponse(
        _id=bet["_id"],
        group_id=bet["group_id"],
        created_by=bet["created_by"],
        title=bet["title"],
        description=bet.get("description"),
        budget_limit=bet["budget_limit"],
        deadline=bet["deadline"],
        status=bet["status"],
        participants=[BetParticipant(**participant) for participant in bet["participants"]],
        winner_auth_id=bet.get("winner_auth_id"),
        created_at=bet["created_at"],
        updated_at=bet["updated_at"],
        activated_at=bet.get("activated_at"),
        completed_at=bet.get("completed_at"),
        transactions=transactions,
    )


@app.post("/api/bets/{bet_id}/transactions", response_model=BetResponse)
async def add_transaction(bet_id: str, payload: TransactionCreate):
    bet = await get_bet_document(bet_id)
    if bet["status"] not in {"active", "pending"}:
        raise HTTPException(status_code=400, detail="Bet is not active")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    participant = None
    for item in bet["participants"]:
        if item["auth_id"] == payload.auth_id:
            participant = item
            break
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not part of this bet")

    transaction_doc = {
        "bet_id": bet["_id"],
        "auth_id": payload.auth_id,
        "amount": payload.amount,
        "merchant": payload.merchant,
        "category": payload.category,
        "occurred_on": payload.occurred_on,
        "created_at": datetime.utcnow(),
    }

    await transactions_collection.insert_one(transaction_doc)
    participant["spending"] = round(participant.get("spending", 0.0) + payload.amount, 2)
    bet["updated_at"] = datetime.utcnow()
    await bets_collection.update_one(
        {"_id": bet["_id"]},
        {
            "$set": {
                "participants": bet["participants"],
                "updated_at": bet["updated_at"],
            }
        },
    )

    transactions = await aggregate_transactions(bet["_id"])
    return BetResponse(
        _id=bet["_id"],
        group_id=bet["group_id"],
        created_by=bet["created_by"],
        title=bet["title"],
        description=bet.get("description"),
        budget_limit=bet["budget_limit"],
        deadline=bet["deadline"],
        status=bet["status"],
        participants=[BetParticipant(**participant) for participant in bet["participants"]],
        winner_auth_id=bet.get("winner_auth_id"),
        created_at=bet["created_at"],
        updated_at=bet["updated_at"],
        activated_at=bet.get("activated_at"),
        completed_at=bet.get("completed_at"),
        transactions=transactions,
    )


@app.post("/api/bets/{bet_id}/finalize", response_model=BetResponse)
async def finalize_bet(bet_id: str):
    bet = await get_bet_document(bet_id)
    if bet["status"] == "completed":
        return await get_bet(bet_id)

    transactions = await aggregate_transactions(bet["_id"])

    if not transactions:
        for participant in bet["participants"]:
            participant["spending"] = participant.get("spending", 0.0)
    else:
        spending_map = {}
        for transaction in transactions:
            spending_map.setdefault(transaction.auth_id, 0.0)
            spending_map[transaction.auth_id] += transaction.amount
        for participant in bet["participants"]:
            participant["spending"] = round(spending_map.get(participant["auth_id"], 0.0), 2)

    winner_auth_id = min(
        bet["participants"],
        key=lambda participant: participant.get("spending", 0.0),
    )["auth_id"]

    bet["status"] = "completed"
    bet["winner_auth_id"] = winner_auth_id
    bet["completed_at"] = datetime.utcnow()
    bet["updated_at"] = datetime.utcnow()

    await bets_collection.update_one(
        {"_id": bet["_id"]},
        {
            "$set": {
                "participants": bet["participants"],
                "status": bet["status"],
                "winner_auth_id": bet["winner_auth_id"],
                "completed_at": bet["completed_at"],
                "updated_at": bet["updated_at"],
            }
        },
    )

    return BetResponse(
        _id=bet["_id"],
        group_id=bet["group_id"],
        created_by=bet["created_by"],
        title=bet["title"],
        description=bet.get("description"),
        budget_limit=bet["budget_limit"],
        deadline=bet["deadline"],
        status=bet["status"],
        participants=[BetParticipant(**participant) for participant in bet["participants"]],
        winner_auth_id=bet.get("winner_auth_id"),
        created_at=bet["created_at"],
        updated_at=bet["updated_at"],
        activated_at=bet.get("activated_at"),
        completed_at=bet.get("completed_at"),
        transactions=transactions,
    )


@app.get("/api/dashboard/{auth_id}", response_model=DashboardResponse)
async def dashboard(auth_id: str):
    user_public = await build_public_user(auth_id)
    groups = await list_groups(auth_id)

    active_cursor = bets_collection.find(
        {"participants.auth_id": auth_id, "status": {"$in": ["pending", "active"]}}
    ).sort("deadline", 1)

    active_bets: List[BetResponse] = []
    async for record in active_cursor:
        transactions = await aggregate_transactions(record["_id"])
        active_bets.append(
            BetResponse(
                _id=record["_id"],
                group_id=record["group_id"],
                created_by=record["created_by"],
                title=record["title"],
                description=record.get("description"),
                budget_limit=record["budget_limit"],
                deadline=record["deadline"],
                status=record["status"],
                participants=[BetParticipant(**participant) for participant in record["participants"]],
                winner_auth_id=record.get("winner_auth_id"),
                created_at=record["created_at"],
                updated_at=record["updated_at"],
                activated_at=record.get("activated_at"),
                completed_at=record.get("completed_at"),
                transactions=transactions,
            )
        )

    completed_cursor = bets_collection.find(
        {"participants.auth_id": auth_id, "status": "completed"}
    ).sort("completed_at", -1)

    completed_bets: List[BetResponse] = []
    async for record in completed_cursor:
        transactions = await aggregate_transactions(record["_id"])
        completed_bets.append(
            BetResponse(
                _id=record["_id"],
                group_id=record["group_id"],
                created_by=record["created_by"],
                title=record["title"],
                description=record.get("description"),
                budget_limit=record["budget_limit"],
                deadline=record["deadline"],
                status=record["status"],
                participants=[BetParticipant(**participant) for participant in record["participants"]],
                winner_auth_id=record.get("winner_auth_id"),
                created_at=record["created_at"],
                updated_at=record["updated_at"],
                activated_at=record.get("activated_at"),
                completed_at=record.get("completed_at"),
                transactions=transactions,
            )
        )

    return DashboardResponse(
        user=user_public,
        groups=groups,
        active_bets=active_bets,
        completed_bets=completed_bets,
    )


@app.get("/api/plaid/transactions/{auth_id}", response_model=List[TransactionResponse])
async def plaid_transactions(auth_id: str):
    cursor = transactions_collection.find({"auth_id": auth_id}).sort("occurred_on", -1)
    transactions: List[TransactionResponse] = []
    async for record in cursor:
        transactions.append(
            TransactionResponse(
                _id=record["_id"],
                bet_id=record["bet_id"],
                auth_id=record["auth_id"],
                amount=record["amount"],
                merchant=record["merchant"],
                category=record.get("category"),
                occurred_on=record["occurred_on"],
                created_at=record["created_at"],
            )
        )
    return transactions


@app.get("/")
async def root():
    return {"message": "Budget Bet API is running", "docs": "/docs"}


@app.get("/health")
async def health_check():
    try:
        await client.admin.command("ismaster")
        return {"status": "healthy", "database": "connected"}
    except Exception:  # pragma: no cover - network error path
        return {"status": "unhealthy", "database": "disconnected"}


if __name__ == "__main__":  # pragma: no cover - manual execution
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

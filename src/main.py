from __future__ import annotations

import asyncio
import os
import re
from datetime import date, datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from schemas import (
    AddMemberByUsername,
    BetCreate,
    BetOut,
    BetStatus,
    GroupCreate,
    GroupOut,
    PlaidLinkTokenCreate,
    PlaidLinkTokenOut,
    PlaidPublicTokenExchange,
    PlaidTransactionsOut,
    UserCreate,
    UserOut,
)

try:
    from plaid import ApiClient, Configuration, Environment
    from plaid.api import plaid_api
    from plaid.model.country_code import CountryCode
    from plaid.model.item_public_token_exchange_request import (
        ItemPublicTokenExchangeRequest,
    )
    from plaid.model.link_token_create_request import LinkTokenCreateRequest
    from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
    from plaid.model.products import Products
    from plaid.model.transactions_get_request import TransactionsGetRequest
    from plaid.model.transactions_get_request_options import (
        TransactionsGetRequestOptions,
    )
except Exception as plaid_import_error:  # pragma: no cover - plaid optional during dev
    plaid_api = None
    ApiClient = None
    Configuration = None
    Environment = None
    LinkTokenCreateRequest = None
    LinkTokenCreateRequestUser = None
    ItemPublicTokenExchangeRequest = None
    TransactionsGetRequest = None
    TransactionsGetRequestOptions = None
    print(f"⚠️ Plaid SDK not available: {plaid_import_error}")


MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGODB_DB", "hackathon")

USERNAME_RE = re.compile(r"^[a-zA-Z0-9._-]{3,20}$")

# ----------------------------
# Mongo connection + DB handles
# ----------------------------
try:
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DB]

    users_col = db["users"]
    groups_col = db["groups"]
    bets_col = db["bets"]
    plaid_items_col = db["plaid_items"]
    print("✅ Connected to MongoDB successfully!")
except Exception as e:  # pragma: no cover - connection failure logged only
    print(f"❌ Failed to connect to MongoDB: {e}")
    print("💡 Make sure MongoDB is running and credentials are correct.")

# ----------------------------
# FastAPI app + CORS
# ----------------------------
app = FastAPI(title="BudgetBet API", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------
# Plaid client setup
# ----------------------------
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox").lower()

plaid_client = None
if all([plaid_api, ApiClient, Configuration, Environment]) and PLAID_CLIENT_ID and PLAID_SECRET:
    env = {
        "sandbox": Environment.Sandbox,
        "development": Environment.Development,
        "production": Environment.Production,
    }.get(PLAID_ENV, Environment.Sandbox)

    configuration = Configuration(
        host=env,
        api_key={
            "clientId": PLAID_CLIENT_ID,
            "secret": PLAID_SECRET,
        },
    )
    api_client = ApiClient(configuration)
    plaid_client = plaid_api.PlaidApi(api_client)
else:
    print("ℹ️ Plaid client not configured. Set PLAID_CLIENT_ID and PLAID_SECRET to enable it.")


# ----------------------------
# Helpers
# ----------------------------

def to_object_id(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="Invalid ObjectId")
    return ObjectId(id_str)


def user_doc_to_out(doc: dict) -> UserOut:
    payload = {
        "_id": doc["_id"],
        "email": doc["email"],
        "username": doc["username"],
        "usernameLower": doc["usernameLower"],
        "photoURL": doc.get("photoURL"),
        "firebaseUid": doc.get("firebaseUid"),
    }
    return UserOut.model_validate(payload)


def group_doc_to_out(doc: dict) -> GroupOut:
    payload = {
        "_id": doc["_id"],
        "name": doc["name"],
        "ownerId": doc["ownerId"],
        "members": [
            {
                "userId": member["userId"],
                "role": member.get("role", "member"),
                "joinedAt": member.get("joinedAt"),
            }
            for member in doc.get("members", [])
        ],
    }
    return GroupOut.model_validate(payload)


def bet_doc_to_out(doc: dict) -> BetOut:
    payload = {
        "_id": doc["_id"],
        "groupId": doc["groupId"],
        "createdBy": doc["createdBy"],
        "title": doc["title"],
        "totalBudget": doc["totalBudget"],
        "startDate": doc["startDate"],
        "endDate": doc["endDate"],
        "status": doc.get("status", BetStatus.planned.value),
        "meta": doc.get("meta", {}),
        "participantIds": doc.get("participantIds", []),
        "createdAt": doc.get("createdAt", datetime.utcnow()),
        "updatedAt": doc.get("updatedAt", datetime.utcnow()),
    }
    return BetOut.model_validate(payload)


async def plaid_call(func, request):
    if plaid_client is None:
        raise HTTPException(status_code=503, detail="Plaid integration is not configured")
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(None, lambda: func(request))
    if hasattr(response, "to_dict"):
        return response.to_dict()
    return response


# ----------------------------
# Startup: verify DB and create indexes
# ----------------------------


@app.on_event("startup")
async def startup_event():
    try:
        await client.admin.command("ping")
        print("✅ MongoDB connection verified!")

        # Unique usernameLower & email for users
        await users_col.create_index("usernameLower", unique=True, name="uniq_usernameLower")
        await users_col.create_index("email", unique=True, name="uniq_email")
        await users_col.create_index(
            "firebaseUid", unique=True, sparse=True, name="uniq_firebaseUid"
        )

        # Useful group indexes
        await groups_col.create_index("ownerId", name="idx_ownerId")
        await groups_col.create_index("members.userId", name="idx_members_userId")

        # Bets
        await bets_col.create_index("groupId", name="idx_bets_groupId")
        await bets_col.create_index("status", name="idx_bets_status")
        await bets_col.create_index(
            [("groupId", 1), ("status", 1)], name="idx_bets_group_status"
        )

        # Plaid items
        await plaid_items_col.create_index("userId", name="idx_plaid_userId")
        await plaid_items_col.create_index(
            "itemId", unique=True, sparse=True, name="uniq_plaid_itemId"
        )

    except Exception as e:  # pragma: no cover - startup log only
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
        await client.admin.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}


# ----------------------------
# USERS
# ----------------------------


@app.get("/users/search")
async def search_users(q: str) -> List[dict]:
    """Case-insensitive prefix search on usernameLower."""

    cursor = (
        users_col.find(
            {"usernameLower": {"$regex": f"^{q.lower()}"}},
            {"username": 1, "usernameLower": 1},
        ).limit(10)
        if q
        else []
    )

    results: List[dict] = []
    if cursor:
        async for doc in cursor:
            results.append(
                {
                    "id": str(doc["_id"]),
                    "username": doc["username"],
                    "usernameLower": doc["usernameLower"],
                }
            )
    return results


@app.post("/users", response_model=UserOut)
async def create_user(user: UserCreate):
    uname = user.username.strip()
    if not USERNAME_RE.match(uname):
        raise HTTPException(status_code=400, detail="Invalid username format")

    doc = {
        "email": user.email.strip().lower(),
        "username": uname,
        "usernameLower": uname.lower(),
        "photoURL": user.photo_url or None,
        "firebaseUid": user.firebase_uid,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    try:
        result = await users_col.insert_one(doc)
        created = await users_col.find_one({"_id": result.inserted_id})
        return user_doc_to_out(created)
    except Exception as e:
        msg = str(e)
        if "duplicate key error" in msg or "E11000" in msg:
            raise HTTPException(status_code=409, detail="Username or email already in use")
        raise HTTPException(status_code=500, detail=f"DB error: {msg}")


@app.get("/users", response_model=List[UserOut])
async def list_users():
    out: List[UserOut] = []
    async for u in users_col.find({}).limit(50):
        out.append(user_doc_to_out(u))
    return out


@app.get("/users/by-username/{username}", response_model=UserOut)
async def get_user_by_username(username: str):
    doc = await users_col.find_one({"usernameLower": username.lower()})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_out(doc)


@app.get("/users/by-email/{email}", response_model=UserOut)
async def get_user_by_email(email: str):
    doc = await users_col.find_one({"email": email.strip().lower()})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_out(doc)


# ----------------------------
# GROUPS
# ----------------------------


@app.post("/groups", response_model=GroupOut)
async def create_group(payload: GroupCreate):
    owner = await users_col.find_one({"_id": payload.owner_id})
    if not owner:
        raise HTTPException(status_code=404, detail="Owner user not found")

    group_doc = {
        "name": payload.name.strip(),
        "ownerId": payload.owner_id,
        "members": [
            {
                "userId": payload.owner_id,
                "role": "owner",
                "joinedAt": datetime.utcnow(),
            }
        ],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    try:
        res = await groups_col.insert_one(group_doc)
        new_doc = await groups_col.find_one({"_id": res.inserted_id})
        return group_doc_to_out(new_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")


@app.get("/groups", response_model=List[GroupOut])
async def list_groups(memberId: Optional[str] = None):
    q = {}
    if memberId:
        q = {"members.userId": to_object_id(memberId)}

    out: List[GroupOut] = []
    async for g in groups_col.find(q).limit(50):
        out.append(group_doc_to_out(g))
    return out


@app.get("/groups/{group_id}", response_model=GroupOut)
async def get_group(group_id: str):
    doc = await groups_col.find_one({"_id": to_object_id(group_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")
    return group_doc_to_out(doc)


@app.post("/groups/{group_id}/members", response_model=GroupOut)
async def add_member_by_username(group_id: str, payload: AddMemberByUsername):
    gid = to_object_id(group_id)
    username_lower = payload.username.strip().lower()

    user = await users_col.find_one({"usernameLower": username_lower})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    group = await groups_col.find_one({"_id": gid})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    already = any(member["userId"] == user["_id"] for member in group.get("members", []))
    if already:
        return group_doc_to_out(group)

    try:
        await groups_col.update_one(
            {"_id": gid},
            {
                "$push": {
                    "members": {
                        "userId": user["_id"],
                        "role": "member",
                        "joinedAt": datetime.utcnow(),
                    }
                },
                "$set": {"updatedAt": datetime.utcnow()},
            },
        )
        updated = await groups_col.find_one({"_id": gid})
        return group_doc_to_out(updated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")


# ----------------------------
# BETS
# ----------------------------


@app.post("/bets", response_model=BetOut)
async def create_bet(payload: BetCreate):
    if payload.end_date <= payload.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    group = await groups_col.find_one({"_id": payload.group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    member_ids = {member["userId"] for member in group.get("members", [])}
    if payload.created_by not in member_ids:
        raise HTTPException(status_code=403, detail="Creator must be a group member")

    participant_ids = set(payload.participant_ids or member_ids)
    participant_ids.add(payload.created_by)

    # Ensure every participant belongs to the group
    if not participant_ids.issubset(member_ids):
        raise HTTPException(status_code=400, detail="All participants must belong to the group")

    bet_doc = {
        "groupId": payload.group_id,
        "createdBy": payload.created_by,
        "title": payload.title.strip(),
        "totalBudget": payload.total_budget,
        "startDate": payload.start_date,
        "endDate": payload.end_date,
        "status": payload.status.value,
        "meta": payload.meta,
        "participantIds": list(participant_ids),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await bets_col.insert_one(bet_doc)
    new_doc = await bets_col.find_one({"_id": result.inserted_id})
    return bet_doc_to_out(new_doc)


@app.get("/bets", response_model=List[BetOut])
async def list_bets(
    groupId: Optional[str] = Query(default=None),
    status: Optional[BetStatus] = Query(default=None),
):
    query = {}
    if groupId:
        query["groupId"] = to_object_id(groupId)
    if status:
        query["status"] = status.value

    out: List[BetOut] = []
    async for doc in bets_col.find(query).sort("createdAt", -1).limit(100):
        out.append(bet_doc_to_out(doc))
    return out


@app.get("/bets/{bet_id}", response_model=BetOut)
async def get_bet(bet_id: str):
    doc = await bets_col.find_one({"_id": to_object_id(bet_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet_doc_to_out(doc)


# ----------------------------
# PLAID
# ----------------------------


@app.post("/plaid/link-token", response_model=PlaidLinkTokenOut)
async def create_link_token(payload: PlaidLinkTokenCreate):
    user = await users_col.find_one({"_id": payload.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if plaid_client is None:
        raise HTTPException(status_code=503, detail="Plaid integration is not configured")

    request = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="BudgetBet",
        language="en",
        country_codes=[CountryCode("US")],
        user=LinkTokenCreateRequestUser(client_user_id=str(payload.user_id)),
    )
    data = await plaid_call(plaid_client.link_token_create, request)
    return PlaidLinkTokenOut.model_validate(data)


@app.post("/plaid/exchange")
async def exchange_public_token(payload: PlaidPublicTokenExchange):
    if plaid_client is None:
        raise HTTPException(status_code=503, detail="Plaid integration is not configured")

    request = ItemPublicTokenExchangeRequest(public_token=payload.public_token)
    data = await plaid_call(plaid_client.item_public_token_exchange, request)
    access_token = data.get("access_token")
    item_id = data.get("item_id")

    if not access_token or not item_id:
        raise HTTPException(status_code=500, detail="Missing access token from Plaid response")

    await plaid_items_col.update_one(
        {"userId": payload.user_id, "itemId": item_id},
        {
            "$set": {
                "accessToken": access_token,
                "institutionName": payload.institution_name,
                "updatedAt": datetime.utcnow(),
            },
            "$setOnInsert": {
                "userId": payload.user_id,
                "itemId": item_id,
                "createdAt": datetime.utcnow(),
            },
        },
        upsert=True,
    )

    return {"itemId": item_id}


@app.get("/plaid/transactions", response_model=PlaidTransactionsOut)
async def plaid_transactions(
    userId: str,
    startDate: date,
    endDate: date,
    cursor: Optional[str] = Query(default=None),
):
    if plaid_client is None:
        raise HTTPException(status_code=503, detail="Plaid integration is not configured")

    user_oid = to_object_id(userId)
    items = []
    async for item in plaid_items_col.find({"userId": user_oid}):
        items.append(item)

    if not items:
        return PlaidTransactionsOut(transactions=[], nextCursor=None)

    transactions: List[dict] = []
    next_cursor_value: Optional[str] = None
    for item in items:
        request = TransactionsGetRequest(
            access_token=item["accessToken"],
            start_date=startDate.isoformat(),
            end_date=endDate.isoformat(),
            options=TransactionsGetRequestOptions(count=100, offset=0),
        )
        data = await plaid_call(plaid_client.transactions_get, request)
        transactions.extend(data.get("transactions", []))
        next_cursor_value = data.get("next_cursor") or next_cursor_value

    return PlaidTransactionsOut(transactions=transactions, nextCursor=next_cursor_value)

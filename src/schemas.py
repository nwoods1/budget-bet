from __future__ import annotations

from datetime import datetime, date
from enum import Enum
from typing import Dict, List, Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field, constr


class PyObjectId(ObjectId):
    """Pydantic-compatible ObjectId."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    email: EmailStr
    username: constr(min_length=3, max_length=20)
    photo_url: Optional[str] = Field(default=None, alias="photoURL")
    firebase_uid: Optional[str] = Field(default=None, alias="firebaseUid")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


class UserOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    email: EmailStr
    username: str
    username_lower: str = Field(alias="usernameLower")
    photo_url: Optional[str] = Field(default=None, alias="photoURL")
    firebase_uid: Optional[str] = Field(default=None, alias="firebaseUid")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


# ---------------------------------------------------------------------------
# Group schemas
# ---------------------------------------------------------------------------


class GroupMember(BaseModel):
    user_id: PyObjectId = Field(alias="userId")
    role: str
    joined_at: Optional[datetime] = Field(default=None, alias="joinedAt")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


class GroupCreate(BaseModel):
    name: str
    owner_id: PyObjectId = Field(alias="ownerId")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


class GroupOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    owner_id: PyObjectId = Field(alias="ownerId")
    members: List[GroupMember] = []

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


class AddMemberByUsername(BaseModel):
    username: str


# ---------------------------------------------------------------------------
# Bet schemas
# ---------------------------------------------------------------------------


class BetStatus(str, Enum):
    planned = "planned"
    active = "active"
    finished = "finished"
    cancelled = "cancelled"


class BetCreate(BaseModel):
    group_id: PyObjectId = Field(alias="groupId")
    created_by: PyObjectId = Field(alias="createdBy")
    title: str
    total_budget: float = Field(alias="totalBudget", gt=0)
    start_date: datetime = Field(alias="startDate")
    end_date: datetime = Field(alias="endDate")
    status: BetStatus = BetStatus.planned
    meta: Dict[str, str] = Field(default_factory=dict)
    participant_ids: List[PyObjectId] = Field(default_factory=list, alias="participantIds")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


class BetOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    group_id: PyObjectId = Field(alias="groupId")
    created_by: PyObjectId = Field(alias="createdBy")
    title: str
    total_budget: float = Field(alias="totalBudget")
    start_date: datetime = Field(alias="startDate")
    end_date: datetime = Field(alias="endDate")
    status: BetStatus
    meta: Dict[str, str] = Field(default_factory=dict)
    participant_ids: List[PyObjectId] = Field(default_factory=list, alias="participantIds")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


# ---------------------------------------------------------------------------
# Plaid schemas
# ---------------------------------------------------------------------------


class PlaidLinkTokenCreate(BaseModel):
    user_id: PyObjectId = Field(alias="userId")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


class PlaidLinkTokenOut(BaseModel):
    link_token: str = Field(alias="linkToken")
    expiration: datetime


class PlaidPublicTokenExchange(BaseModel):
    user_id: PyObjectId = Field(alias="userId")
    public_token: str = Field(alias="publicToken")
    institution_name: Optional[str] = Field(default=None, alias="institutionName")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )


class PlaidTransactionsOut(BaseModel):
    transactions: List[Dict[str, object]]
    next_cursor: Optional[str] = Field(default=None, alias="nextCursor")


class PlaidTransactionsRequest(BaseModel):
    user_id: PyObjectId = Field(alias="userId")
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
    )

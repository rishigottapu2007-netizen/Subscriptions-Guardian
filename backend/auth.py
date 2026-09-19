import sqlite3
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash


router = APIRouter(prefix="/api/auth", tags=["Authentication"])

DB_PATH = "users.db"

password_hash = PasswordHash.recommended()


# -----------------------------
# Database setup
# -----------------------------

def get_db():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()


init_db()


# -----------------------------
# Request models
# -----------------------------

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# -----------------------------
# Helper functions
# -----------------------------

def get_user_by_email(email):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    return user


def create_session(user_id):
    token = secrets.token_urlsafe(32)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO sessions (token, user_id, created_at)
        VALUES (?, ?, ?)
        """,
        (
            token,
            user_id,
            datetime.now(timezone.utc).isoformat()
        )
    )

    conn.commit()
    conn.close()

    return token


def get_user_from_token(token):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT users.id, users.email, users.password_hash
        FROM users
        JOIN sessions ON users.id = sessions.user_id
        WHERE sessions.token = ?
        """,
        (token,)
    )

    user = cursor.fetchone()

    conn.close()

    return user


# -----------------------------
# Sign Up
# -----------------------------

@router.post("/signup")
def signup(req: SignUpRequest):

    existing_user = get_user_by_email(req.email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    hashed_password = password_hash.hash(req.password)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO users (email, password_hash, created_at)
        VALUES (?, ?, ?)
        """,
        (
            req.email,
            hashed_password,
            datetime.now(timezone.utc).isoformat()
        )
    )

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Account created successfully."
    }


# -----------------------------
# Sign In
# -----------------------------

@router.post("/signin")
def signin(req: SignInRequest):

    user = get_user_by_email(req.email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    user_id, email, stored_hash = user

    if not password_hash.verify(req.password, stored_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    token = create_session(user_id)

    return {
        "success": True,
        "message": "Signed in successfully.",
        "token": token,
        "email": email
    }


# -----------------------------
# Change Password
# -----------------------------

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    authorization: str = Header(None)
):

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    token = authorization.replace("Bearer ", "")

    user = get_user_from_token(token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )

    user_id, email, stored_hash = user

    if not password_hash.verify(req.current_password, stored_hash):
        raise HTTPException(
            status_code=401,
            detail="Current password is incorrect."
        )

    new_hash = password_hash.hash(req.new_password)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
        """,
        (new_hash, user_id)
    )

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Password updated successfully."
    }


# -----------------------------
# Forgot Password
# -----------------------------

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):

    # We intentionally return the same message
    # whether the email exists or not.
    # This prevents exposing which emails have accounts.

    return {
        "success": True,
        "message": (
            "If an account exists for this email, "
            "password reset instructions will be sent."
        )
    }
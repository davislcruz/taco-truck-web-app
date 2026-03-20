"""
Authentication utilities
"""
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.config import SECRET_KEY, SESSION_EXPIRE_DAYS

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_session_token(user_id: int, role: str) -> str:
    """Create a session JWT token"""
    expire = datetime.utcnow() + timedelta(days=SESSION_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_session_token(token: str) -> Optional[dict]:
    """Decode and validate a session token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None

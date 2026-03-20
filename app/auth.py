"""
Authentication utilities
"""
from datetime import datetime, timedelta
from typing import Optional
import base64
import hashlib
import hmac
import secrets

from jose import JWTError, jwt

from app.config import SECRET_KEY, SESSION_EXPIRE_DAYS


# =============================================================================
# PASSWORD HASHING (PBKDF2-HMAC-SHA256)
# Format: pbkdf2_sha256$iterations$salt_b64$hash_b64
# =============================================================================

PBKDF2_ITERATIONS = 210_000


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
        dklen=32,
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(dk).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${hash_b64}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify a plain password against stored PBKDF2 hash."""
    try:
        algorithm, iterations_str, salt_b64, hash_b64 = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False

        iterations = int(iterations_str)
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected = base64.b64decode(hash_b64.encode("ascii"))

        computed = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            iterations,
            dklen=len(expected),
        )
        return hmac.compare_digest(computed, expected)
    except Exception:
        return False


# =============================================================================
# SESSION TOKENS
# =============================================================================

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

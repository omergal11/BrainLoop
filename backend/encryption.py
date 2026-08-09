"""
Field-level encryption for sensitive user data (e.g. email addresses).

Two primitives are used:

- Fernet (AES-128-CBC + HMAC, from the `cryptography` package) for
  reversible, authenticated encryption of values stored in the database.
  Encryption is randomized (a fresh IV each time), so the same plaintext
  produces a different ciphertext every time it's encrypted.

- HMAC-SHA256 for a deterministic, one-way "lookup hash". Because Fernet
  ciphertext is randomized, an encrypted column can't be searched with a
  plain `WHERE email = %s` query. We additionally store a deterministic
  hash of the normalized plaintext (e.g. in an `email_hash` column) that
  IS safe to index and compare for equality/uniqueness checks, without
  revealing the plaintext or being reversible on its own.

Required environment variables:
- FIELD_ENCRYPTION_KEY: a Fernet key, e.g. generate with
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
- FIELD_HASH_KEY: a random hex secret for the HMAC lookup hash, e.g.
    python -c "import secrets; print(secrets.token_hex(32))"

Both keys must stay stable across deployments - rotating them without a
migration will make previously encrypted/hashed data unreadable/unmatchable.
"""
import os
import hmac
import hashlib
import base64
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

_FERNET_KEY = os.getenv("FIELD_ENCRYPTION_KEY")
_HASH_KEY = os.getenv("FIELD_HASH_KEY")

if not _FERNET_KEY:
    raise RuntimeError(
        "FIELD_ENCRYPTION_KEY is not set. Generate one with:\n"
        '  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"\n'
        "and set it as an environment variable before starting the server."
    )
if not _HASH_KEY:
    raise RuntimeError(
        "FIELD_HASH_KEY is not set. Generate one with:\n"
        '  python -c "import secrets; print(secrets.token_hex(32))"\n'
        "and set it as an environment variable before starting the server."
    )

_fernet = Fernet(_FERNET_KEY.encode() if isinstance(_FERNET_KEY, str) else _FERNET_KEY)
_hash_key_bytes = bytes.fromhex(_HASH_KEY)


def encrypt_field(value: Optional[str]) -> Optional[str]:
    """Encrypt a plaintext string for storage. Returns None if value is None."""
    if value is None:
        return None
    return _fernet.encrypt(value.encode()).decode()


def decrypt_field(token: Optional[str]) -> Optional[str]:
    """Decrypt a value previously produced by encrypt_field. Returns None if token is None."""
    if token is None:
        return None
    try:
        return _fernet.decrypt(token.encode()).decode()
    except InvalidToken as e:
        raise ValueError("Could not decrypt field - invalid token or wrong FIELD_ENCRYPTION_KEY") from e


def hash_for_lookup(value: Optional[str]) -> Optional[str]:
    """
    Deterministic HMAC-SHA256 hash of a normalized value, used as a
    searchable/indexable stand-in for an encrypted column (e.g. checking
    email uniqueness) without storing plaintext or relying on comparing
    randomized ciphertext.
    """
    if value is None:
        return None
    normalized = value.strip().lower()
    digest = hmac.new(_hash_key_bytes, normalized.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode()

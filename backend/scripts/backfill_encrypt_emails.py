"""
One-time backfill: encrypts any plaintext emails left over from before the
email-encryption migration, and populates email_hash for each row.

Usage (run once, after applying db/migration_encrypt_email.sql and setting
FIELD_ENCRYPTION_KEY / FIELD_HASH_KEY in the environment):

    cd backend
    python scripts/backfill_encrypt_emails.py

Safe to re-run: rows whose email is already a valid Fernet token (i.e.
decrypts successfully) are skipped.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_connection
from encryption import encrypt_field, decrypt_field, hash_for_lookup


def already_encrypted(value: str) -> bool:
    if value is None:
        return True
    try:
        decrypt_field(value)
        return True
    except ValueError:
        return False


def main():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, email FROM users")
    rows = cursor.fetchall()

    updated = 0
    for row in rows:
        user_id = row["user_id"]
        email = row["email"]
        if email is None or already_encrypted(email):
            continue

        encrypted = encrypt_field(email)
        email_hash = hash_for_lookup(email)
        cursor.execute(
            "UPDATE users SET email = %s, email_hash = %s WHERE user_id = %s",
            (encrypted, email_hash, user_id),
        )
        updated += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Backfilled {updated} row(s). {len(rows) - updated} were already encrypted or empty.")


if __name__ == "__main__":
    main()

"""
Tests for authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from dependencies import hash_password, verify_password

# Note: These tests require a running database
# For full test suite, set up test database or use mocking


def test_password_hashing():
    """Test password hashing and verification"""
    password = "test_password_123"
    hashed = hash_password(password)
    
    # Hashed password should be different from original
    assert hashed != password
    assert len(hashed) > 50  # bcrypt hashes are long
    
    # Verification should work
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_password_hashing_different_hashes():
    """Test that same password produces different hashes (salt)"""
    password = "test_password_123"
    hashed1 = hash_password(password)
    hashed2 = hash_password(password)
    
    # Different hashes due to salt, but both verify correctly
    assert hashed1 != hashed2
    assert verify_password(password, hashed1) is True
    assert verify_password(password, hashed2) is True

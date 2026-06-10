# backend/tests/test_auth.py

import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
import jwt

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from auth import get_current_user, get_optional_user, _decode_token

def test_decode_token_success():
    with patch("auth._jwks_client.get_signing_key_from_jwt") as mock_get_key, \
         patch("jwt.decode") as mock_decode:
        
        mock_key = MagicMock()
        mock_key.key = "secret_key"
        mock_get_key.return_value = mock_key
        
        mock_decode.return_value = {"sub": "user123", "email": "test@example.com"}
        
        result = _decode_token("fake_token")
        assert result["sub"] == "user123"
        assert result["email"] == "test@example.com"
        mock_decode.assert_called_once_with(
            "fake_token",
            "secret_key",
            algorithms=["ES256"],
            audience="authenticated",
        )

def test_decode_token_expired():
    with patch("auth._jwks_client.get_signing_key_from_jwt") as mock_get_key, \
         patch("jwt.decode", side_effect=jwt.ExpiredSignatureError):
        
        mock_key = MagicMock()
        mock_get_key.return_value = mock_key
        
        with pytest.raises(HTTPException) as exc_info:
            _decode_token("expired_token")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Token expired"

def test_decode_token_invalid():
    with patch("auth._jwks_client.get_signing_key_from_jwt") as mock_get_key, \
         patch("jwt.decode", side_effect=jwt.InvalidTokenError):
        
        mock_key = MagicMock()
        mock_get_key.return_value = mock_key
        
        with pytest.raises(HTTPException) as exc_info:
            _decode_token("invalid_token")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid token"

def test_get_current_user():
    with patch("auth._decode_token") as mock_decode:
        mock_decode.return_value = {"sub": "user123"}
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token123")
        user = get_current_user(credentials)
        assert user["sub"] == "user123"
        mock_decode.assert_called_once_with("token123")

def test_get_optional_user_none():
    user = get_optional_user(None)
    assert user is None

def test_get_optional_user_valid():
    with patch("auth._decode_token") as mock_decode:
        mock_decode.return_value = {"sub": "user123"}
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token123")
        user = get_optional_user(credentials)
        assert user["sub"] == "user123"

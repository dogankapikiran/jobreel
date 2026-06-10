# backend/tests/test_interaction_router.py

import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from main import app
from core.database import DatabaseRepository
from auth import get_current_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_overrides():
    # Set up mock user for dependency overrides
    app.dependency_overrides[get_current_user] = lambda: {"sub": "user123"}
    yield
    # Clean up overrides after test
    app.dependency_overrides.clear()

def test_post_interaction_save_success():
    mock_db_repo = AsyncMock(spec=DatabaseRepository)
    mock_db_repo.has_saved_job.return_value = False
    mock_db_repo.insert_interaction.return_value = None
    
    app.state.db_repo = mock_db_repo
    
    payload = {
        "action": "save",
        "job_id": "job_999",
        "job_title": "Product Analyst",
        "job_company": "Big Tech Corp",
        "job_url": "https://example.com/job"
    }
    response = client.post("/api/interactions", json=payload)
    
    assert response.status_code == 200
    assert response.json() == {"success": True}
    mock_db_repo.has_saved_job.assert_called_once_with("user123", "job_999")
    mock_db_repo.insert_interaction.assert_called_once()

def test_post_interaction_invalid_action():
    payload = {
        "action": "invalid_action_name",
        "job_id": "job_999"
    }
    response = client.post("/api/interactions", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Geçersiz aksiyon"

def test_get_saved_success():
    mock_db_repo = AsyncMock(spec=DatabaseRepository)
    mock_db_repo.get_saved_jobs.return_value = [{"job_id": "job_1"}, {"job_id": "job_2"}]
    
    app.state.db_repo = mock_db_repo
    
    response = client.get("/api/saved")
    assert response.status_code == 200
    assert response.json() == [{"job_id": "job_1"}, {"job_id": "job_2"}]
    mock_db_repo.get_saved_jobs.assert_called_once_with("user123")

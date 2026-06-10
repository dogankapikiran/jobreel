# backend/tests/test_feed_router.py

import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from main import app
from services.job_service import JobService
from auth import get_optional_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def cleanup_overrides():
    yield
    app.dependency_overrides.clear()

def test_feed_success():
    # Create a mock JobService
    mock_job_service = AsyncMock(spec=JobService)
    mock_job_service.get_feed.return_value = {
        "jobs": [
            {"id": "job123", "title": "Developer", "company": "Acme Corp", "score": 90}
        ],
        "total": 1,
        "page": 1,
        "pages": 1
    }
    
    # Bind the mock job service to the app state
    app.state.job_service = mock_job_service
    
    app.dependency_overrides[get_optional_user] = lambda: None
    
    response = client.get("/api/feed?location=Istanbul&keyword=Developer")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["jobs"]) == 1
    assert data["jobs"][0]["id"] == "job123"
    
    # Verify get_feed was called with correct parameters
    mock_job_service.get_feed.assert_called_once_with(
        location="Istanbul",
        keyword="Developer",
        sectors="",
        work_type="any",
        seniority="",
        page=1,
        user=None
    )

def test_feed_error():
    mock_job_service = AsyncMock(spec=JobService)
    mock_job_service.get_feed.side_effect = Exception("Database connection error")
    
    app.state.job_service = mock_job_service
    
    app.dependency_overrides[get_optional_user] = lambda: {"sub": "user123"}
    
    response = client.get("/api/feed")
    assert response.status_code == 500
    assert response.json()["detail"] == "Internal Server Error"

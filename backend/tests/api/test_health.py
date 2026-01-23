import shutil

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slideia.api.routes import router
from slideia.core.config import settings


@pytest.fixture
def test_downloads_dir(tmp_path):
    test_dir = tmp_path / "downloads_test"
    test_dir.mkdir()
    orig_dir = settings.DOWNLOADS_DIR
    settings.DOWNLOADS_DIR = test_dir
    yield test_dir
    # Cleanup and restore
    settings.DOWNLOADS_DIR = orig_dir
    shutil.rmtree(test_dir, ignore_errors=True)


@pytest.fixture
def client(test_downloads_dir):
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_health_check_ok(client, test_downloads_dir):
    """Health check returns status ok and pptx files."""
    pptx1 = test_downloads_dir / "file1.pptx"
    pptx2 = test_downloads_dir / "file2.pptx"
    pptx1.write_bytes(b"dummy")
    pptx2.write_bytes(b"dummy")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["downloads_exists"] is True
    assert set(data["pptx_files"]) == {"file1.pptx", "file2.pptx"}
    assert data["file_count"] == 2


def test_health_check_empty_dir(client, test_downloads_dir):
    """Health check returns ok with empty pptx list if no files."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["downloads_exists"] is True
    assert data["pptx_files"] == []
    assert data["file_count"] == 0


def test_health_check_missing_dir(client, test_downloads_dir):
    """Health check returns ok and downloads_exists False if dir missing."""
    # Remove the test directory
    shutil.rmtree(test_downloads_dir)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["downloads_exists"] is False
    assert data["pptx_files"] == []
    assert data["file_count"] == 0

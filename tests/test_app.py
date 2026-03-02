import copy
import pytest
from fastapi.testclient import TestClient
from src import app as app_module

client = TestClient(app_module.app)

# capture original activity state
INITIAL_ACTIVITIES = copy.deepcopy(app_module.activities)

@pytest.fixture(autouse=True)
def reset_db():
    # restore global dictionary before each test
    app_module.activities = copy.deepcopy(INITIAL_ACTIVITIES)
    yield


def test_root_redirect():
    # disable automatic redirects so we can inspect the initial response
    resp = client.get("/", follow_redirects=False)
    assert resp.status_code in (307, 308)
    assert resp.headers["location"] == "/static/index.html"


def test_get_activities_returns_initial_dict():
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert resp.json() == INITIAL_ACTIVITIES


def test_signup_success():
    resp = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": "new@mergington.edu"},
    )
    assert resp.status_code == 200
    assert "Signed up new@mergington.edu" in resp.json()["message"]
    assert "new@mergington.edu" in app_module.activities["Chess Club"]["participants"]


def test_signup_nonexistent_activity():
    resp = client.post(
        "/activities/Nonexistent/signup",
        params={"email": "foo@mergington.edu"},
    )
    assert resp.status_code == 404


def test_signup_duplicate_email():
    resp = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": "michael@mergington.edu"},
    )
    assert resp.status_code == 400


def test_remove_participant_success():
    resp = client.delete(
        "/activities/Chess%20Club/participants",
        params={"email": "michael@mergington.edu"},
    )
    assert resp.status_code == 200
    assert "michael@mergington.edu" not in app_module.activities["Chess Club"]["participants"]


def test_remove_participant_nonexistent_activity():
    resp = client.delete(
        "/activities/Nonexistent/participants",
        params={"email": "foo@mergington.edu"},
    )
    assert resp.status_code == 404


def test_remove_participant_not_signed_up():
    resp = client.delete(
        "/activities/Chess%20Club/participants",
        params={"email": "absent@mergington.edu"},
    )
    assert resp.status_code == 404

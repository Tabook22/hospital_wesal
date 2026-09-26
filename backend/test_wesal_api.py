import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["hospital"] == "Sultan Qaboos Hospital"

def test_login():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "wesal123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"

def test_patients_and_capacity():
    res = client.get("/api/patients")
    assert res.status_code == 200
    patients = res.json()
    assert len(patients) == 20

    # Test patient capacity
    p1 = patients[0]
    res_cap = client.get(f"/api/patients/{p1['id']}/capacity")
    assert res_cap.status_code == 200
    cap_data = res_cap.json()
    assert cap_data["max_concurrent_visitors"] == 2

def test_visit_creation_and_qr():
    # Register a new visitor for patient 2
    res_pat = client.get("/api/patients")
    p2 = res_pat.json()[1] # Salim Said

    visit_payload = {
        "patient_id": p2["id"],
        "full_name": "Nasser Abdullah Al-Hinai",
        "civil_id": "88776655",
        "mobile_number": "96892223344",
        "visitor_type": "VISITOR",
        "relationship_to_patient": "Friend",
        "duration_minutes": 2
    }
    res_visit = client.post("/api/visits", json=visit_payload)
    assert res_visit.status_code == 200
    visit_data = res_visit.json()
    assert visit_data["status"] == "REGISTERED"
    assert visit_data["pass_obj"] is not None
    pass_obj = visit_data["pass_obj"]
    assert pass_obj["secure_token"].startswith("WES-TK-")
    assert pass_obj["qr_image_base64"].startswith("data:image/png;base64,")

    token = pass_obj["secure_token"]

    # 1. Scan at Main Entrance CP-01 -> Should be GRANTED
    res_scan1 = client.post("/api/gate/scan", json={"token": token, "checkpoint_code": "CP-01"})
    assert res_scan1.status_code == 200
    scan1_data = res_scan1.json()
    assert scan1_data["result"] == "GRANTED"
    assert scan1_data["status"] == "ACTIVE"

    # 2. Scan at wrong ward gate CP-05 (ICU Gate) -> Should be DENIED because patient is in Medical Ward A
    res_scan_wrong = client.post("/api/gate/scan", json={"token": token, "checkpoint_code": "CP-05"})
    assert res_scan_wrong.status_code == 200
    scan_wrong_data = res_scan_wrong.json()
    assert scan_wrong_data["result"] == "DENIED"
    assert "NOT AUTHORIZED FOR THIS AREA" in scan_wrong_data["reason"]

    # 3. Scan at authorized ward gate CP-02 (Medical Ward A) -> Should be GRANTED
    res_scan_ward = client.post("/api/gate/scan", json={"token": token, "checkpoint_code": "CP-02"})
    assert res_scan_ward.status_code == 200
    scan_ward_data = res_scan_ward.json()
    assert scan_ward_data["result"] == "GRANTED"

    # 4. Scan at Exit Gate CP-07 -> Should be GRANTED and Checked Out
    res_exit = client.post("/api/gate/scan", json={"token": token, "checkpoint_code": "CP-07"})
    assert res_exit.status_code == 200
    exit_data = res_exit.json()
    assert exit_data["result"] == "GRANTED"
    assert exit_data["is_checkout"] is True
    assert exit_data["status"] == "CHECKED_OUT"

    # 5. Scan AGAIN after checkout at CP-01 -> Should be DENIED because PASS ALREADY USED
    res_reuse = client.post("/api/gate/scan", json={"token": token, "checkpoint_code": "CP-01"})
    assert res_reuse.status_code == 200
    reuse_data = res_reuse.json()
    assert reuse_data["result"] == "DENIED"
    assert "PASS ALREADY USED" in reuse_data["reason"]

def test_dashboard_and_reports():
    res_dash = client.get("/api/dashboard/live")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert "kpis" in dash_data
    assert dash_data["kpis"]["visitors_today"] >= 1

    res_rep = client.get("/api/reports/current")
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert "visitors" in rep_data

if __name__ == "__main__":
    print("Running tests...")
    test_health()
    test_login()
    test_patients_and_capacity()
    test_visit_creation_and_qr()
    test_dashboard_and_reports()
    print("ALL TESTS PASSED SUCCESSFULLY!")

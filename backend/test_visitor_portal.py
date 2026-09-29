import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_visitor_flow():
    print("\n--- 1. Testing Visitor Login ---")
    login_res = client.post("/api/auth/login", json={"username": "visitor", "password": "wesal123"})
    assert login_res.status_code == 200, f"Visitor login failed: {login_res.text}"
    token_data = login_res.json()
    assert token_data["role"] == "VISITOR"
    visitor_token = token_data["access_token"]
    print("Visitor login successful! Token received.")

    print("\n--- 2. Testing New Visitor Registration ---")
    reg_username = "omar_visitor_test"
    reg_res = client.post("/api/visitor/auth/register", json={
        "full_name": "Omar Bin Said Al-Kindi",
        "username": reg_username,
        "password": "password123",
        "mobile_number": "+968 9876 5432",
        "civil_id": "99887766"
    })
    # If already registered, status might be 400 or 200
    if reg_res.status_code == 200:
        new_token_data = reg_res.json()
        assert new_token_data["role"] == "VISITOR"
        active_token = new_token_data["access_token"]
        print("Registration successful!")
    else:
        # Log in with this user
        login_res2 = client.post("/api/auth/login", json={"username": reg_username, "password": "password123"})
        assert login_res2.status_code == 200
        active_token = login_res2.json()["access_token"]
        print("User already existed, logged in successfully!")

    headers = {"Authorization": f"Bearer {active_token}"}

    print("\n--- 3. Testing Patient Search for Visitors ---")
    search_res = client.get("/api/visitor/patients/search?q=Salim", headers=headers)
    assert search_res.status_code == 200, f"Search failed: {search_res.text}"
    patients = search_res.json()
    assert len(patients) > 0, "No patients found"
    target_patient = patients[0]
    print(f"Found patient: {target_patient['full_name']} | Ward: {target_patient['ward_name']} | Room: {target_patient['room_number']}")
    print(f"Bedside capacity: {target_patient['current_concurrent_visitors']}/{target_patient['max_concurrent_visitors']} | Can admit: {target_patient['can_admit_visitor']}")

    print("\n--- 4. Testing Visit Pass Booking ---")
    book_res = client.post("/api/visitor/passes/book", headers=headers, json={
        "patient_id": target_patient["id"],
        "visitor_type": "VISITOR",
        "duration_minutes": 20
    })
    assert book_res.status_code == 200, f"Booking failed: {book_res.text}"
    pass_detail = book_res.json()
    assert "pass_code" in pass_detail
    assert "qr_image_base64" in pass_detail
    assert pass_detail["qr_image_base64"].startswith("data:image/png;base64,")
    print(f"Pass booked successfully! Pass Code: {pass_detail['pass_code']} | Token: {pass_detail['secure_token']}")

    print("\n--- 5. Testing Visitor My-Passes Listing ---")
    my_passes_res = client.get("/api/visitor/my-passes", headers=headers)
    assert my_passes_res.status_code == 200
    my_passes = my_passes_res.json()
    assert len(my_passes) > 0
    print(f"Found {len(my_passes)} passes for active visitor.")

    print("\n=== ALL VISITOR PORTAL BACKEND TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_visitor_flow()

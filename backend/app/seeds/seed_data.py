import sys
import os
from datetime import datetime, timedelta

# Ensure parent path in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.hospital import Ward, Room, Checkpoint
from app.models.patient import Patient
from app.models.visitor import Visitor
from app.models.visit import Visit, VisitorPass
from app.models.scan import ScanEvent
from app.models.notification import Notification
from app.models.policy import VisitPolicy
from app.models.audit import AuditLog
from app.models.incident import StaffIncident
from app.services.qr_service import generate_qr_base64


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    existing_user = db.query(User).first()
    if existing_user:
        # Ensure demo visitor account exists even on already seeded databases
        visitor_user = db.query(User).filter(User.username == "visitor").first()
        if not visitor_user:
            pw_hash = get_password_hash("wesal123")
            demo_visitor = User(
                username="visitor",
                hashed_password=pw_hash,
                full_name="Ahmed Al-Harthi",
                role="VISITOR",
                is_active=True
            )
            db.add(demo_visitor)
            
            # Also ensure matching visitor profile exists
            vis_profile = db.query(Visitor).filter(Visitor.civil_id == "71829304").first()
            if not vis_profile:
                vis_profile = Visitor(
                    full_name="Ahmed Al-Harthi",
                    civil_id="71829304",
                    mobile_number="+968 9123 4567",
                    visitor_type="VISITOR",
                    created_at=datetime.utcnow()
                )
                db.add(vis_profile)
            db.commit()
            print("Added demo visitor user to existing database.")
            
        # Ensure visitation categories are set on patients
        patients_list = db.query(Patient).all()
        for p in patients_list:
            if p.hospital_number in ["P00051", "P00052", "P00053"]:
                p.visitation_category = "PROHIBITED"
            elif p.hospital_number in ["P00021", "P00024", "P00041", "P00042", "P00061"]:
                p.visitation_category = "LIMITED"
            else:
                p.visitation_category = "ALLOWED"

        # Ensure demo staff incidents exist
        if db.query(StaffIncident).count() == 0:
            sample_incidents = [
                StaffIncident(
                    incident_number="INC-2026-0001",
                    reporter_name="مريم الكثيري (تمريض)",
                    reporter_role="NURSE",
                    category="OVERCROWDING",
                    severity="URGENT",
                    ward_name="Medical Ward A",
                    location_details="غرفة 201 — سرير B",
                    patient_name="سالم سعيد الشنفري",
                    title="تكدس زوار عند سرير المريض وتجاوز الطاقة الاستيعابية",
                    description="يوجد حالياً أكثر من 5 زوار متجمعين حول المريض في نفس الوقت مما يعيق عمل التمريض وإعطاء الأدوية، والحد الأقصى هو زائران فقط.",
                    suggested_action="إرسال الأمن أو الاستقبال لتوجيه باقي الزوار إلى صالة الانتظار وتنظيم الدخول بالتناوب.",
                    status="OPEN",
                    created_at=datetime.utcnow() - timedelta(minutes=18)
                ),
                StaffIncident(
                    incident_number="INC-2026-0002",
                    reporter_name="فاطمة المعشني (مشرفة جناح)",
                    reporter_role="WARD_SUPERVISOR",
                    category="NOISE_DISTURBANCE",
                    severity="HIGH",
                    ward_name="Pediatric Ward",
                    location_details="ممر الأطفال الشرقي — أمام غرفة 104",
                    title="أطفال يصدرون أصواتاً مرتفعة وضوضاء بالممر",
                    description="مجموعة أطفال مرافقين لزوار يركضون ويصدرون أصواتاً عالية تسبب إزعاجاً وقلقاً للأطفال المنومين في فترة الراحة.",
                    suggested_action="تنبيه أولياء الأمور بلباقة للالتزام بهدوء المستشفى أو مرافقة الأطفال إلى منطقة الانتظار الخارجية.",
                    status="DISPATCHED",
                    admin_notes="تم توجيه دورية الأمن للموقع والتواصل مع العائلة لتهدئة الموقف.",
                    resolved_by="مشرف الأمن والسلامة",
                    created_at=datetime.utcnow() - timedelta(minutes=42)
                ),
                StaffIncident(
                    incident_number="INC-2026-0003",
                    reporter_name="د. خالد العمري (طبيب مقيم)",
                    reporter_role="DOCTOR",
                    category="UNAUTHORIZED_AREA",
                    severity="URGENT",
                    ward_name="Intensive Care Unit (ICU)",
                    location_details="بوابة العناية المركزة الداخلية",
                    title="زائر متواجد داخل قسم العناية المركزة بدون تصريح معتمد",
                    description="تمت ملاحظة زائر داخل ممر العناية المركزة دون حمل بطاقة تصريح إلكترونية معتمدة للقسم. هذا يعرض المرضى لمخاطر العدوى.",
                    suggested_action="مرافقة الزائر فوراً إلى خارج القسم وتوجيهه لمكتب الاستقبال.",
                    status="RESOLVED",
                    admin_notes="تمت مرافقة الزائر للخارج وإرشاده لإصدار تصريح رسمي حسب البروتوكول الطبي.",
                    resolved_by="إدارة الاستقبال",
                    resolved_at=datetime.utcnow() - timedelta(minutes=10),
                    created_at=datetime.utcnow() - timedelta(hours=1, minutes=15)
                )
            ]
            db.add_all(sample_incidents)
            print("Seeded sample staff incidents successfully.")

        db.commit()

        print("Database already contains records. Skipping full seed.")
        db.close()
        return


    print("Seeding Sultan Qaboos Hospital demo database...")

    # 1. Users
    pw_hash = get_password_hash("wesal123")
    users = [
        User(username="admin", hashed_password=pw_hash, full_name="Dr. Hamad Al-Harthy", role="ADMIN"),
        User(username="reception", hashed_password=pw_hash, full_name="Fatima Al-Mashani", role="RECEPTION"),
        User(username="security", hashed_password=pw_hash, full_name="Sultan Al-Rawas", role="SECURITY"),
        User(username="management", hashed_password=pw_hash, full_name="Director Talal Al-Balooshi", role="MANAGEMENT"),
        User(username="visitor", hashed_password=pw_hash, full_name="Ahmed Al-Harthi", role="VISITOR")
    ]
    db.add_all(users)
    db.commit()

    # 2. Visit Policy
    policy = VisitPolicy(
        visiting_start="17:00",
        visiting_end="19:00",
        default_duration_minutes=20,
        warning_threshold_minutes=5,
        max_concurrent_per_patient=2,
        max_daily_per_patient=6,
        companions_allowed=1,
        demo_mode_enabled=True,
        demo_duration_minutes=2
    )
    db.add(policy)
    db.commit()

    # 3. Wards
    ward_med_a = Ward(code="MED-A", name="Medical Ward A", floor="Level 2", max_visitors_capacity=20)
    ward_med_b = Ward(code="MED-B", name="Medical Ward B", floor="Level 3", max_visitors_capacity=20)
    ward_surg = Ward(code="SURG", name="Surgical Ward", floor="Level 4", max_visitors_capacity=15)
    ward_icu = Ward(code="ICU", name="Intensive Care Unit (ICU)", floor="Level 1", max_visitors_capacity=8)
    ward_ped = Ward(code="PED", name="Pediatric Ward", floor="Level 1", max_visitors_capacity=16)

    db.add_all([ward_med_a, ward_med_b, ward_surg, ward_icu, ward_ped])
    db.commit()

    # 4. Rooms
    rooms_data = [
        (ward_med_a.id, ["Room 201", "Room 202", "Room 203", "Room 204", "Room 205"]),
        (ward_med_b.id, ["Room 301", "Room 302", "Room 303", "Room 304"]),
        (ward_surg.id, ["Room 401", "Room 402", "Room 403"]),
        (ward_icu.id, ["ICU-01", "ICU-02", "ICU-03", "ICU-04"]),
        (ward_ped.id, ["Room 101", "Room 102", "Room 103"])
    ]

    all_rooms = []
    for ward_id, room_numbers in rooms_data:
        for r_num in room_numbers:
            all_rooms.append(Room(ward_id=ward_id, room_number=r_num, max_beds=2))
    db.add_all(all_rooms)
    db.commit()

    # 5. Checkpoints
    checkpoints = [
        Checkpoint(code="CP-01", name="Main Entrance Smart Gate", ward_id=None, checkpoint_type="ENTRY_GATE"),
        Checkpoint(code="CP-02", name="Medical Ward A Gate", ward_id=ward_med_a.id, checkpoint_type="WARD_CHECKPOINT"),
        Checkpoint(code="CP-03", name="Medical Ward B Gate", ward_id=ward_med_b.id, checkpoint_type="WARD_CHECKPOINT"),
        Checkpoint(code="CP-04", name="Surgical Ward Gate", ward_id=ward_surg.id, checkpoint_type="WARD_CHECKPOINT"),
        Checkpoint(code="CP-05", name="ICU Security Gate", ward_id=ward_icu.id, checkpoint_type="WARD_CHECKPOINT"),
        Checkpoint(code="CP-06", name="Pediatric Ward Gate", ward_id=ward_ped.id, checkpoint_type="WARD_CHECKPOINT"),
        Checkpoint(code="CP-07", name="Exit Smart Gate", ward_id=None, checkpoint_type="EXIT_GATE")
    ]
    db.add_all(checkpoints)
    db.commit()

    # 6. Patients (20 Fictional Patients)
    patient_defs = [
        ("P00021", "Ahmed Mohammed Al-Hakim", "78291044", "Male", ward_med_a.id, "Room 201", "Bed A"),
        ("P00022", "Salim Said Al-Shanfari", "81920193", "Male", ward_med_a.id, "Room 201", "Bed B"),
        ("P00023", "Maryam Bint Salim Al-Kathiri", "91029384", "Female", ward_med_a.id, "Room 202", "Bed A"),
        ("P00024", "Khalid Nasser Al-Amri", "67182930", "Male", ward_med_a.id, "Room 203", "Bed A"),
        ("P00025", "Fatima Ali Al-Ghafri", "90182736", "Female", ward_med_a.id, "Room 205", "Bed B"),

        ("P00031", "Saeed Bakhit Al-Mahri", "71283940", "Male", ward_med_b.id, "Room 301", "Bed A"),
        ("P00032", "Zahra Musallam Al-Rawas", "82910482", "Female", ward_med_b.id, "Room 301", "Bed B"),
        ("P00033", "Abdullah Khalfan Al-Farsi", "93820194", "Male", ward_med_b.id, "Room 302", "Bed A"),
        ("P00034", "Mona Hassan Al-Barwani", "84920184", "Female", ward_med_b.id, "Room 303", "Bed A"),

        ("P00041", "Yousef Ibrahim Al-Balushi", "75920183", "Male", ward_surg.id, "Room 401", "Bed A"),
        ("P00042", "Hanan Tariq Al-Zadjali", "89201827", "Female", ward_surg.id, "Room 401", "Bed B"),
        ("P00043", "Nasser Hilal Al-Habsi", "90182938", "Male", ward_surg.id, "Room 402", "Bed A"),
        ("P00044", "Asma Sulaiman Al-Hinai", "78192039", "Female", ward_surg.id, "Room 403", "Bed A"),

        ("P00051", "Hamad Salem Al-Shuhri", "69182039", "Male", ward_icu.id, "ICU-01", "Bed 1"),
        ("P00052", "Aisha Juma Al-Washahi", "89201928", "Female", ward_icu.id, "ICU-02", "Bed 1"),
        ("P00053", "Omar Khalfan Al-Siyabi", "90182749", "Male", ward_icu.id, "ICU-03", "Bed 1"),

        ("P00061", "Salma Bint Ahmed Al-Yafai", "99182930", "Female", ward_ped.id, "Room 101", "Bed A"),
        ("P00062", "Fahad Saud Al-Busaidi", "98201948", "Male", ward_ped.id, "Room 102", "Bed A"),
        ("P00063", "Reem Rashid Al-Saadi", "97291038", "Female", ward_ped.id, "Room 102", "Bed B"),
        ("P00064", "Majid Sultan Al-Kindi", "96182930", "Male", ward_ped.id, "Room 103", "Bed A"),
    ]

    patients = []
    for h_no, name, cid, gender, w_id, r_num, bed in patient_defs:
        # lookup room
        room = db.query(Room).filter(Room.ward_id == w_id, Room.room_number == r_num).first()
        r_id = room.id if room else all_rooms[0].id
        patients.append(Patient(
            hospital_number=h_no,
            full_name=name,
            civil_id=cid,
            gender=gender,
            ward_id=w_id,
            room_id=r_id,
            bed=bed,
            admission_status="ADMITTED",
            admission_date=datetime.utcnow() - timedelta(days=2),
            max_concurrent_visitors=2,
            max_daily_visitors=6
        ))
    db.add_all(patients)
    db.commit()

    # 7. Seed Sample Visitors and Visits
    now = datetime.utcnow()

    # Visitor 1: Mohammed Ali (OVERDUE by 7 minutes to demonstrate overdue alert)
    v1 = Visitor(
        full_name="Mohammed Ali Al-Mashani",
        civil_id="10928374",
        mobile_number="96891234567",
        visitor_type="VISITOR",
        relationship_to_patient="Brother",
        notes="Visiting brother after surgery"
    )
    db.add(v1)
    db.commit()

    p1 = patients[0] # Ahmed Mohammed
    visit1 = Visit(
        visit_number="VIS-2026-000101",
        patient_id=p1.id,
        visitor_id=v1.id,
        ward_id=p1.ward_id,
        service_type="PATIENT_VISIT",
        status="OVERDUE",
        registered_at=now - timedelta(minutes=28),
        valid_from=now - timedelta(minutes=30),
        valid_until=now + timedelta(hours=2),
        max_duration_minutes=20,
        check_in_at=now - timedelta(minutes=27),
        expected_exit_at=now - timedelta(minutes=7),
        last_checkpoint_id=checkpoints[1].id, # CP-02 Med Ward A
        last_checkpoint_name=checkpoints[1].name,
        last_activity_at=now - timedelta(minutes=24)
    )
    db.add(visit1)
    db.commit()

    t1 = "WES-TK-DEMO-00101"
    pass1 = VisitorPass(
        visit_id=visit1.id,
        pass_code="WES-000101",
        secure_token=t1,
        qr_payload=t1,
        qr_image_base64=generate_qr_base64(t1),
        status="ACTIVE",
        generated_at=visit1.registered_at
    )
    db.add(pass1)
    db.commit()

    # Scan events for V1
    db.add(ScanEvent(pass_id=pass1.id, visit_id=visit1.id, checkpoint_id=checkpoints[0].id, scan_time=now - timedelta(minutes=27), result="GRANTED"))
    db.add(ScanEvent(pass_id=pass1.id, visit_id=visit1.id, checkpoint_id=checkpoints[1].id, scan_time=now - timedelta(minutes=24), result="GRANTED"))

    # Alert for V1
    db.add(Notification(
        visit_id=visit1.id,
        recipient_name=v1.full_name,
        mobile_number=v1.mobile_number,
        message=f"Dear {v1.full_name},\nyour authorized visiting period has ended. Please proceed immediately to the hospital exit gate (CP-07).\nThank you.\nWesal – Sultan Qaboos Hospital",
        notification_type="OVERDUE",
        status="SENT",
        sent_at=now - timedelta(minutes=7)
    ))

    # Visitor 2: Said Salim (ENDING_SOON, 4 minutes left)
    v2 = Visitor(
        full_name="Said Salim Al-Kathiri",
        civil_id="29182049",
        mobile_number="96898765432",
        visitor_type="VISITOR",
        relationship_to_patient="Cousin"
    )
    db.add(v2)
    db.commit()

    p2 = patients[2] # Maryam Bint Salim
    visit2 = Visit(
        visit_number="VIS-2026-000102",
        patient_id=p2.id,
        visitor_id=v2.id,
        ward_id=p2.ward_id,
        service_type="PATIENT_VISIT",
        status="ENDING_SOON",
        registered_at=now - timedelta(minutes=16),
        valid_from=now - timedelta(minutes=20),
        valid_until=now + timedelta(hours=2),
        max_duration_minutes=20,
        check_in_at=now - timedelta(minutes=16),
        expected_exit_at=now + timedelta(minutes=4),
        last_checkpoint_id=checkpoints[1].id,
        last_checkpoint_name=checkpoints[1].name,
        last_activity_at=now - timedelta(minutes=14)
    )
    db.add(visit2)
    db.commit()

    t2 = "WES-TK-DEMO-00102"
    pass2 = VisitorPass(
        visit_id=visit2.id,
        pass_code="WES-000102",
        secure_token=t2,
        qr_payload=t2,
        qr_image_base64=generate_qr_base64(t2),
        status="ACTIVE",
        generated_at=visit2.registered_at
    )
    db.add(pass2)
    db.commit()

    db.add(ScanEvent(pass_id=pass2.id, visit_id=visit2.id, checkpoint_id=checkpoints[0].id, scan_time=now - timedelta(minutes=16), result="GRANTED"))
    db.add(ScanEvent(pass_id=pass2.id, visit_id=visit2.id, checkpoint_id=checkpoints[1].id, scan_time=now - timedelta(minutes=14), result="GRANTED"))
    db.add(Notification(
        visit_id=visit2.id,
        recipient_name=v2.full_name,
        mobile_number=v2.mobile_number,
        message=f"Dear {v2.full_name},\nyour visiting period at Sultan Qaboos Hospital will end in 5 minutes. Please prepare to leave the ward.\nWesal – Sultan Qaboos Hospital",
        notification_type="WARNING_5MIN",
        status="SENT",
        sent_at=now - timedelta(minutes=1)
    ))

    # Visitor 3: Tariq Hilal (ACTIVE, 15 minutes left, Companion)
    v3 = Visitor(
        full_name="Tariq Hilal Al-Balushi",
        civil_id="39102948",
        mobile_number="96895551234",
        visitor_type="COMPANION",
        relationship_to_patient="Father"
    )
    db.add(v3)
    db.commit()

    p3 = patients[9] # Yousef Ibrahim (Surgical)
    visit3 = Visit(
        visit_number="VIS-2026-000103",
        patient_id=p3.id,
        visitor_id=v3.id,
        ward_id=p3.ward_id,
        service_type="COMPANION_ACCESS",
        status="ACTIVE",
        registered_at=now - timedelta(minutes=5),
        valid_from=now - timedelta(minutes=10),
        valid_until=now + timedelta(hours=3),
        max_duration_minutes=20,
        check_in_at=now - timedelta(minutes=5),
        expected_exit_at=now + timedelta(minutes=15),
        last_checkpoint_id=checkpoints[3].id, # CP-04 Surgical Ward
        last_checkpoint_name=checkpoints[3].name,
        last_activity_at=now - timedelta(minutes=3)
    )
    db.add(visit3)
    db.commit()

    t3 = "WES-TK-DEMO-00103"
    pass3 = VisitorPass(
        visit_id=visit3.id,
        pass_code="WES-000103",
        secure_token=t3,
        qr_payload=t3,
        qr_image_base64=generate_qr_base64(t3),
        status="ACTIVE",
        generated_at=visit3.registered_at
    )
    db.add(pass3)
    db.commit()

    db.add(ScanEvent(pass_id=pass3.id, visit_id=visit3.id, checkpoint_id=checkpoints[0].id, scan_time=now - timedelta(minutes=5), result="GRANTED"))
    db.add(ScanEvent(pass_id=pass3.id, visit_id=visit3.id, checkpoint_id=checkpoints[3].id, scan_time=now - timedelta(minutes=3), result="GRANTED"))

    # Visitor 4: Checked Out visitor
    v4 = Visitor(
        full_name="Aisha Nasser Al-Hadhrami",
        civil_id="49201948",
        mobile_number="96894445566",
        visitor_type="VISITOR",
        relationship_to_patient="Sister"
    )
    db.add(v4)
    db.commit()

    visit4 = Visit(
        visit_number="VIS-2026-000104",
        patient_id=patients[3].id,
        visitor_id=v4.id,
        ward_id=patients[3].ward_id,
        service_type="PATIENT_VISIT",
        status="CHECKED_OUT",
        registered_at=now - timedelta(minutes=50),
        valid_from=now - timedelta(hours=1),
        valid_until=now + timedelta(hours=2),
        max_duration_minutes=20,
        check_in_at=now - timedelta(minutes=45),
        expected_exit_at=now - timedelta(minutes=25),
        checked_out_at=now - timedelta(minutes=23),
        last_checkpoint_id=checkpoints[6].id, # Exit Gate
        last_checkpoint_name=checkpoints[6].name,
        last_activity_at=now - timedelta(minutes=23)
    )
    db.add(visit4)
    db.commit()

    t4 = "WES-TK-DEMO-00104"
    pass4 = VisitorPass(
        visit_id=visit4.id,
        pass_code="WES-000104",
        secure_token=t4,
        qr_payload=t4,
        qr_image_base64=generate_qr_base64(t4),
        status="USED",
        generated_at=visit4.registered_at
    )
    db.add(pass4)
    db.commit()

    db.add(ScanEvent(pass_id=pass4.id, visit_id=visit4.id, checkpoint_id=checkpoints[0].id, scan_time=now - timedelta(minutes=45), result="GRANTED"))
    db.add(ScanEvent(pass_id=pass4.id, visit_id=visit4.id, checkpoint_id=checkpoints[6].id, scan_time=now - timedelta(minutes=23), result="GRANTED"))

    # Sample Denied Scan Events (to show realistic stats in dashboard)
    db.add(ScanEvent(
        checkpoint_id=checkpoints[0].id,
        scan_time=now - timedelta(minutes=40),
        result="DENIED",
        denial_reason="MAXIMUM VISITOR CAPACITY REACHED"
    ))
    db.add(ScanEvent(
        checkpoint_id=checkpoints[4].id, # ICU Gate
        scan_time=now - timedelta(minutes=15),
        result="DENIED",
        denial_reason="NOT AUTHORIZED FOR THIS AREA"
    ))

    # Audit Logs
    db.add(AuditLog(
        action="SYSTEM_INIT",
        username="SYSTEM",
        entity_type="SYSTEM",
        details_json='{"status": "initialized", "hospital": "Sultan Qaboos Hospital"}'
    ))
    db.add(AuditLog(
        action="LOGIN",
        username="admin",
        entity_type="USER",
        entity_id="1",
        details_json='{"role": "ADMIN"}'
    ))

    db.commit()
    db.close()
    print("Seeding completed successfully! 20 patients, 7 checkpoints, 4 users, and active visits created.")

if __name__ == "__main__":
    seed_database()

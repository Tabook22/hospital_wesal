import os
import sqlite3

db_path = os.path.join(os.path.dirname(__file__), 'wesal.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()
queries = [
    "ALTER TABLE patients ADD COLUMN visitation_category VARCHAR(20) DEFAULT 'ALLOWED'",
    "ALTER TABLE visits ADD COLUMN visitor_relationship VARCHAR(50)",
    "ALTER TABLE visits ADD COLUMN rejection_reason VARCHAR(255)"
]
for q in queries:
    try:
        cur.execute(q)
        print("Success:", q)
    except sqlite3.OperationalError as e:
        print("Notice:", e)
conn.commit()
conn.close()
print("Migration completed.")

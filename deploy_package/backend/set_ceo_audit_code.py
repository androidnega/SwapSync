import sqlite3
import random

conn = sqlite3.connect('swapsync.db')
cursor = conn.cursor()

# Get all CEOs
cursor.execute("SELECT id, username, full_name FROM users WHERE role = 'ceo'")
ceos = cursor.fetchall()

print("Generating audit codes for CEOs...\n")

for ceo_id, username, full_name in ceos:
    audit_code = str(random.randint(100000, 999999))
    cursor.execute("UPDATE users SET audit_code = ? WHERE id = ?", (audit_code, ceo_id))
    print(f"✅ {full_name} ({username})")
    print(f"   Audit Code: {audit_code}\n")

conn.commit()
conn.close()

print("="*60)
print("🎊 Audit codes generated!")
print("="*60)
print("\nCEOs can now share these codes with System Admin for auditing.")


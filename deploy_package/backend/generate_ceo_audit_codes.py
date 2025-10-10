"""
Generate audit codes for all CEOs
"""
from app.models.user import User, UserRole
from app.core.database import SessionLocal

db = SessionLocal()

# Find all CEOs
ceos = db.query(User).filter(User.role == UserRole.CEO).all()

print(f"Found {len(ceos)} CEO(s)\n")
print("Generating audit codes...\n")

for ceo in ceos:
    # Generate new audit code
    ceo.audit_code = User.generate_audit_code()
    
    print(f"✅ CEO: {ceo.full_name} ({ceo.username})")
    print(f"   Audit Code: {ceo.audit_code}")
    print(f"   Email: {ceo.email}\n")

db.commit()

print("="*60)
print("🎊 All CEO audit codes generated!")
print("="*60)
print("\nCEOs can share their audit code with System Admin")
print("for audit purposes when needed.")

db.close()


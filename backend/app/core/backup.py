"""
Database backup and restore utilities
"""
import shutil
import os
from datetime import datetime
from pathlib import Path
import json
from typing import Dict, List


def get_backup_directory() -> Path:
    """Get or create the backup directory"""
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    return backup_dir


def create_backup(db_path: str = "swapsync.db") -> Dict[str, str]:
    """
    Create a backup of the database
    Returns dict with backup info
    """
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database file not found: {db_path}")
    
    # Create backup directory
    backup_dir = get_backup_directory()
    
    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"swapsync_backup_{timestamp}.db"
    backup_path = backup_dir / backup_filename
    
    # Copy database file
    shutil.copy2(db_path, backup_path)
    
    # Get file sizes
    original_size = os.path.getsize(db_path)
    backup_size = os.path.getsize(backup_path)
    
    return {
        "success": True,
        "backup_filename": backup_filename,
        "backup_path": str(backup_path),
        "original_size": original_size,
        "backup_size": backup_size,
        "timestamp": timestamp,
        "created_at": datetime.now().isoformat()
    }


def restore_backup(backup_filename: str, db_path: str = "swapsync.db") -> Dict[str, str]:
    """
    Restore database from a backup file
    WARNING: This will overwrite the current database!
    """
    backup_dir = get_backup_directory()
    backup_path = backup_dir / backup_filename
    
    if not backup_path.exists():
        raise FileNotFoundError(f"Backup file not found: {backup_filename}")
    
    # Create a safety backup of current database before restoring
    if os.path.exists(db_path):
        safety_backup = f"swapsync_before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        safety_path = backup_dir / safety_backup
        shutil.copy2(db_path, safety_path)
    
    # Restore the backup
    shutil.copy2(backup_path, db_path)
    
    return {
        "success": True,
        "restored_from": backup_filename,
        "database_path": db_path,
        "restored_at": datetime.now().isoformat()
    }


def list_backups() -> List[Dict[str, str]]:
    """
    List all available backups
    """
    backup_dir = get_backup_directory()
    backups = []
    
    for backup_file in sorted(backup_dir.glob("swapsync_backup_*.db"), reverse=True):
        file_stats = backup_file.stat()
        backups.append({
            "filename": backup_file.name,
            "size": file_stats.st_size,
            "size_mb": round(file_stats.st_size / (1024 * 1024), 2),
            "created_at": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
            "path": str(backup_file)
        })
    
    return backups


def delete_backup(backup_filename: str) -> Dict[str, str]:
    """
    Delete a specific backup file
    """
    backup_dir = get_backup_directory()
    backup_path = backup_dir / backup_filename
    
    if not backup_path.exists():
        raise FileNotFoundError(f"Backup file not found: {backup_filename}")
    
    # Security check: only allow deleting backup files
    if not backup_filename.startswith("swapsync_backup_"):
        raise ValueError("Invalid backup filename")
    
    os.remove(backup_path)
    
    return {
        "success": True,
        "deleted": backup_filename,
        "deleted_at": datetime.now().isoformat()
    }


def export_data_json(db_session) -> Dict:
    """
    Export all data to JSON format
    """
    from app.models.customer import Customer
    from app.models.phone import Phone
    from app.models.swap import Swap
    from app.models.sale import Sale
    from app.models.repair import Repair
    
    # Query all data
    customers = db_session.query(Customer).all()
    phones = db_session.query(Phone).all()
    swaps = db_session.query(Swap).all()
    sales = db_session.query(Sale).all()
    repairs = db_session.query(Repair).all()
    
    # Convert to dictionaries
    export_data = {
        "export_date": datetime.now().isoformat(),
        "database_version": "1.0",
        "customers": [
            {
                "id": c.id,
                "full_name": c.full_name,
                "phone_number": c.phone_number,
                "email": c.email,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in customers
        ],
        "phones": [
            {
                "id": p.id,
                "brand": p.brand,
                "model": p.model,
                "condition": p.condition,
                "value": p.value,
                "is_available": p.is_available,
                "added_at": p.added_at.isoformat() if p.added_at else None
            }
            for p in phones
        ],
        "swaps": [
            {
                "id": s.id,
                "customer_id": s.customer_id,
                "given_phone_description": s.given_phone_description,
                "given_phone_value": s.given_phone_value,
                "new_phone_id": s.new_phone_id,
                "balance_paid": s.balance_paid,
                "resale_status": s.resale_status.value if s.resale_status else None,
                "resale_value": s.resale_value,
                "profit_or_loss": s.profit_or_loss,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in swaps
        ],
        "sales": [
            {
                "id": s.id,
                "customer_id": s.customer_id,
                "phone_id": s.phone_id,
                "sale_price": s.sale_price,
                "profit": s.profit,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in sales
        ],
        "repairs": [
            {
                "id": r.id,
                "customer_id": r.customer_id,
                "phone_description": r.phone_description,
                "issue": r.issue,
                "cost": r.cost,
                "status": r.status.value if r.status else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None
            }
            for r in repairs
        ],
        "summary": {
            "total_customers": len(customers),
            "total_phones": len(phones),
            "total_swaps": len(swaps),
            "total_sales": len(sales),
            "total_repairs": len(repairs)
        }
    }
    
    return export_data


def save_export_to_file(data: Dict, filename: str = None) -> str:
    """
    Save exported data to a JSON file
    """
    export_dir = Path("exports")
    export_dir.mkdir(exist_ok=True)
    
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"swapsync_export_{timestamp}.json"
    
    export_path = export_dir / filename
    
    with open(export_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return str(export_path)


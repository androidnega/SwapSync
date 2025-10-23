"""
Tests for Phone Deletion with Dependency Checks
Tests the fix for 500 error when deleting phones with related records
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.phone import Phone
from app.models.sale import Sale
from app.models.swap import Swap
from app.models.repair import Repair
from app.models.pending_resale import PendingResale, TransactionType
from app.models.customer import Customer


def test_delete_phone_with_no_dependencies_success(client: TestClient, db: Session, auth_headers_manager):
    """Test deleting a phone with no related records succeeds"""
    # Create phone with no dependencies
    phone = Phone(
        brand="Apple",
        model="iPhone 13",
        condition="New",
        value=800.00,
        is_available=True
    )
    db.add(phone)
    db.commit()
    
    response = client.delete(
        f"/phones/{phone.id}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 204
    
    # Verify phone is deleted
    deleted_phone = db.query(Phone).filter(Phone.id == phone.id).first()
    assert deleted_phone is None


def test_delete_phone_with_sale_returns_409(client: TestClient, db: Session, auth_headers_manager):
    """Test deleting phone with sales returns 409 Conflict"""
    # Create phone
    phone = Phone(
        brand="Samsung",
        model="Galaxy S21",
        condition="New",
        value=700.00
    )
    db.add(phone)
    
    customer = Customer(
        full_name="Test Customer",
        phone_number="+233123456789"
    )
    db.add(customer)
    db.commit()
    
    # Create sale for this phone
    sale = Sale(
        customer_id=customer.id,
        phone_id=phone.id,
        original_price=700.00,
        amount_paid=700.00
    )
    db.add(sale)
    db.commit()
    
    response = client.delete(
        f"/phones/{phone.id}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 409
    assert "sale" in response.json()["detail"].lower()
    assert "Cannot delete phone" in response.json()["detail"]


def test_delete_phone_with_swap_returns_409(client: TestClient, db: Session, auth_headers_manager):
    """Test deleting phone with swaps returns 409 Conflict"""
    # Create phone
    phone = Phone(
        brand="Google",
        model="Pixel 6",
        condition="New",
        value=600.00
    )
    db.add(phone)
    
    customer = Customer(
        full_name="Test Customer",
        phone_number="+233123456789"
    )
    db.add(customer)
    db.commit()
    
    # Create swap for this phone
    swap = Swap(
        customer_id=customer.id,
        new_phone_id=phone.id,
        given_phone_description="iPhone 11",
        given_phone_value=400.00,
        balance_paid=200.00,
        final_price=600.00
    )
    db.add(swap)
    db.commit()
    
    response = client.delete(
        f"/phones/{phone.id}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 409
    assert "swap" in response.json()["detail"].lower()


def test_delete_phone_with_repair_returns_409(client: TestClient, db: Session, auth_headers_manager):
    """Test deleting phone with repairs returns 409 Conflict"""
    # Create phone
    phone = Phone(
        brand="OnePlus",
        model="9 Pro",
        condition="Used",
        value=500.00
    )
    db.add(phone)
    
    customer = Customer(
        full_name="Test Customer",
        phone_number="+233123456789"
    )
    db.add(customer)
    db.commit()
    
    # Create repair for this phone
    repair = Repair(
        customer_id=customer.id,
        phone_id=phone.id,
        phone_description="OnePlus 9 Pro",
        issue_description="Screen broken",
        cost=150.00
    )
    db.add(repair)
    db.commit()
    
    response = client.delete(
        f"/phones/{phone.id}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 409
    assert "repair" in response.json()["detail"].lower()


def test_delete_phone_with_pending_resale_returns_409(client: TestClient, db: Session, auth_headers_manager):
    """Test deleting phone with pending resales returns 409 Conflict"""
    # Create phone
    phone = Phone(
        brand="Xiaomi",
        model="Mi 11",
        condition="New",
        value=450.00
    )
    db.add(phone)
    
    customer = Customer(
        full_name="Test Customer",
        phone_number="+233123456789"
    )
    db.add(customer)
    db.commit()
    
    # Create pending resale
    resale = PendingResale(
        sold_phone_id=phone.id,
        sold_phone_brand="Xiaomi",
        sold_phone_model="Mi 11",
        sold_phone_value=450.00,
        transaction_type=TransactionType.DIRECT_SALE,
        customer_id=customer.id,
        attending_staff_id=1,
        final_price=450.00
    )
    db.add(resale)
    db.commit()
    
    response = client.delete(
        f"/phones/{phone.id}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 409
    assert "resale" in response.json()["detail"].lower()


def test_delete_phone_returns_clear_error_message(client: TestClient, db: Session, auth_headers_manager):
    """Test that error message is clear and actionable"""
    # Create phone with multiple dependencies
    phone = Phone(
        brand="Apple",
        model="iPhone 12",
        condition="New",
        value=750.00
    )
    db.add(phone)
    
    customer = Customer(
        full_name="Test Customer",
        phone_number="+233123456789"
    )
    db.add(customer)
    db.commit()
    
    # Add multiple dependencies
    sale = Sale(
        customer_id=customer.id,
        phone_id=phone.id,
        original_price=750.00,
        amount_paid=750.00
    )
    swap = Swap(
        customer_id=customer.id,
        new_phone_id=phone.id,
        given_phone_description="iPhone 11",
        given_phone_value=500.00,
        balance_paid=250.00,
        final_price=750.00
    )
    db.add_all([sale, swap])
    db.commit()
    
    response = client.delete(
        f"/phones/{phone.id}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 409
    detail = response.json()["detail"]
    
    # Verify message is descriptive
    assert "Cannot delete phone" in detail
    assert "sale" in detail.lower()
    assert "swap" in detail.lower()
    assert "Archive" in detail or "remove" in detail.lower()


def test_bulk_delete_phones_skips_with_dependencies(client: TestClient, db: Session, auth_headers_manager):
    """Test bulk delete skips phones with dependencies"""
    # Create two phones: one with dependency, one without
    phone1 = Phone(brand="Apple", model="iPhone 13", condition="New", value=800.00)
    phone2 = Phone(brand="Samsung", model="Galaxy S21", condition="New", value=700.00)
    db.add_all([phone1, phone2])
    
    customer = Customer(full_name="Test", phone_number="+233123456789")
    db.add(customer)
    db.commit()
    
    # Add sale for phone1 only
    sale = Sale(
        customer_id=customer.id,
        phone_id=phone1.id,
        original_price=800.00,
        amount_paid=800.00
    )
    db.add(sale)
    db.commit()
    
    response = client.post(
        "/phones/bulk-delete",
        json={"phone_ids": [phone1.id, phone2.id]},
        headers=auth_headers_manager
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["summary"]["deleted"] == 1  # Only phone2 deleted
    assert data["summary"]["skipped"] == 1  # phone1 skipped
    assert len(data["skipped_phones"]) == 1
    assert "related records" in data["skipped_phones"][0]["reason"]


def test_delete_phone_unauthorized(client: TestClient, auth_headers_shopkeeper):
    """Test that only managers can delete phones"""
    response = client.delete(
        "/phones/1",
        headers=auth_headers_shopkeeper
    )
    
    assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


"""
Tests for Repair Items (Repair Sales) Functionality
Tests unified inventory system with repairs
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.repair import Repair
from app.models.repair_sale import RepairSale
from app.models.customer import Customer
from app.models.user import User, UserRole


def test_add_repair_item_success(client: TestClient, db: Session, auth_headers_repairer):
    """Test successfully adding a product to a repair"""
    # Create test data
    customer = Customer(
        full_name="Test Customer",
        phone_number="+233123456789"
    )
    db.add(customer)
    
    product = Product(
        name="iPhone Battery",
        cost_price=20.00,
        selling_price=30.00,
        quantity=50,
        category_id=1
    )
    db.add(product)
    
    repair = Repair(
        customer_id=1,
        phone_description="iPhone 12",
        issue_description="Battery replacement needed",
        service_cost=50.00,
        items_cost=0.00,
        cost=50.00
    )
    db.add(repair)
    db.commit()
    
    # Add item to repair
    response = client.post(
        f"/repairs/{repair.id}/items",
        json={
            "product_id": product.id,
            "quantity": 2,
            "unit_price": 30.00
        },
        headers=auth_headers_repairer
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["success"] == True
    assert data["repair_sale"]["quantity"] == 2
    assert data["repair_sale"]["profit"] == 20.00  # (30-20) * 2
    assert data["updated_stock"] == 48  # 50 - 2
    assert data["updated_repair_cost"] == 110.00  # 50 + (30*2)


def test_add_repair_item_insufficient_stock(client: TestClient, db: Session, auth_headers_repairer):
    """Test adding item with insufficient stock returns error"""
    # Create product with low stock
    product = Product(
        name="Screen",
        cost_price=100.00,
        selling_price=150.00,
        quantity=1,  # Only 1 in stock
        category_id=1
    )
    db.add(product)
    db.commit()
    
    response = client.post(
        f"/repairs/1/items",
        json={
            "product_id": product.id,
            "quantity": 5  # Request more than available
        },
        headers=auth_headers_repairer
    )
    
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]


def test_add_repair_item_uses_default_price(client: TestClient, db: Session, auth_headers_repairer):
    """Test that unit_price defaults to product selling_price if not provided"""
    product = Product(
        name="Cable",
        cost_price=5.00,
        selling_price=10.00,
        quantity=100,
        category_id=1
    )
    db.add(product)
    db.commit()
    
    response = client.post(
        f"/repairs/1/items",
        json={
            "product_id": product.id,
            "quantity": 1
            # unit_price NOT provided
        },
        headers=auth_headers_repairer
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["repair_sale"]["unit_price"] == 10.00  # Used selling_price


def test_get_repair_items(client: TestClient, db: Session, auth_headers):
    """Test retrieving items used in a repair"""
    # Create repair with items
    repair_sale = RepairSale(
        repair_id=1,
        product_id=1,
        repairer_id=1,
        quantity=3,
        unit_price=25.00,
        cost_price=15.00,
        profit=30.00  # (25-15) * 3
    )
    db.add(repair_sale)
    db.commit()
    
    response = client.get(
        f"/repairs/1/items",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["repair_id"] == 1
    assert len(data["items"]) >= 1
    assert data["total_profit"] >= 30.00


def test_remove_repair_item_restores_stock(client: TestClient, db: Session, auth_headers_manager):
    """Test that removing item restores stock"""
    # Create product with initial stock
    product = Product(
        name="Part",
        cost_price=10.00,
        selling_price=20.00,
        quantity=40,  # Initial stock
        category_id=1
    )
    db.add(product)
    
    # Create repair sale (simulates item already added)
    repair_sale = RepairSale(
        repair_id=1,
        product_id=product.id,
        repairer_id=1,
        quantity=5,
        unit_price=20.00,
        cost_price=10.00,
        profit=50.00
    )
    db.add(repair_sale)
    db.commit()
    
    initial_stock = product.quantity
    
    # Remove item
    response = client.delete(
        f"/repairs/1/items/{repair_sale.id}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 204
    
    # Verify stock restored
    db.refresh(product)
    assert product.quantity == initial_stock + 5


def test_repair_item_unauthorized(client: TestClient, auth_headers_shopkeeper):
    """Test that shopkeepers cannot add repair items"""
    response = client.post(
        "/repairs/1/items",
        json={
            "product_id": 1,
            "quantity": 1
        },
        headers=auth_headers_shopkeeper
    )
    
    assert response.status_code == 403


def test_concurrent_stock_updates(client: TestClient, db: Session, auth_headers_repairer):
    """Test that concurrent requests handle stock correctly"""
    # This would require threading/asyncio testing
    # Placeholder for future implementation
    pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


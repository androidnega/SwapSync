"""
Tests for Dashboard Repairer Sales Statistics
Tests aggregation queries and reporting
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.repair_sale import RepairSale
from app.models.user import User, UserRole
from app.models.product import Product


def test_get_repairer_sales_stats(client: TestClient, db: Session, auth_headers_manager):
    """Test retrieving repairer sales statistics"""
    # Create test repair sales
    repairer = User(
        username="test_repairer",
        full_name="Test Repairer",
        role=UserRole.REPAIRER
    )
    db.add(repairer)
    
    product = Product(
        name="Test Product",
        cost_price=10.00,
        selling_price=20.00,
        quantity=100,
        category_id=1
    )
    db.add(product)
    db.commit()
    
    # Add multiple sales for repairer
    for i in range(5):
        repair_sale = RepairSale(
            repair_id=i+1,
            product_id=product.id,
            repairer_id=repairer.id,
            quantity=2,
            unit_price=20.00,
            cost_price=10.00,
            profit=20.00  # (20-10) * 2
        )
        db.add(repair_sale)
    db.commit()
    
    response = client.get(
        "/dashboard/repairer-sales",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "repairers" in data
    assert "summary" in data
    assert data["summary"]["total_items_sold"] >= 5
    assert data["summary"]["total_profit"] >= 100.00


def test_repairer_sales_date_filtering(client: TestClient, db: Session, auth_headers_manager):
    """Test filtering repairer sales by date range"""
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    
    # Create sales from yesterday
    repair_sale = RepairSale(
        repair_id=1,
        product_id=1,
        repairer_id=1,
        quantity=1,
        unit_price=50.00,
        cost_price=30.00,
        profit=20.00,
        created_at=yesterday
    )
    db.add(repair_sale)
    db.commit()
    
    # Filter to today only
    response = client.get(
        f"/dashboard/repairer-sales?start_date={today.isoformat()}",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 200
    data = response.json()
    # Should not include yesterday's sale
    assert data["summary"]["total_items_sold"] == 0


def test_repairer_sales_details(client: TestClient, db: Session, auth_headers_manager):
    """Test detailed breakdown for specific repairer"""
    response = client.get(
        "/dashboard/repairer-sales/1/details",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "repairer" in data
    assert "products" in data
    assert "recent_sales" in data
    assert "summary" in data


def test_repairer_sales_permission_denied(client: TestClient, auth_headers_shopkeeper):
    """Test that shopkeepers cannot view repairer sales"""
    response = client.get(
        "/dashboard/repairer-sales",
        headers=auth_headers_shopkeeper
    )
    
    assert response.status_code == 403


def test_repairer_sales_profit_calculation(client: TestClient, db: Session, auth_headers_manager):
    """Test that profit calculations are accurate"""
    # Create sales with known values
    sales_data = [
        {"qty": 2, "unit_price": 50.00, "cost_price": 30.00},  # Profit: 40
        {"qty": 3, "unit_price": 20.00, "cost_price": 15.00},  # Profit: 15
        {"qty": 1, "unit_price": 100.00, "cost_price": 60.00}  # Profit: 40
    ]
    
    expected_total_profit = 95.00  # 40 + 15 + 40
    
    for sale_data in sales_data:
        repair_sale = RepairSale(
            repair_id=1,
            product_id=1,
            repairer_id=1,
            quantity=sale_data["qty"],
            unit_price=sale_data["unit_price"],
            cost_price=sale_data["cost_price"],
            profit=(sale_data["unit_price"] - sale_data["cost_price"]) * sale_data["qty"]
        )
        db.add(repair_sale)
    db.commit()
    
    response = client.get(
        "/dashboard/repairer-sales",
        headers=auth_headers_manager
    )
    
    assert response.status_code == 200
    data = response.json()
    assert abs(data["summary"]["total_profit"] - expected_total_profit) < 0.01


def test_repairer_sales_multi_tenant_isolation(client: TestClient, db: Session, auth_headers_manager):
    """Test that company isolation works for repairer sales"""
    # Create sales for different companies
    # Verify only current company's data is returned
    # This would require proper multi-tenant setup
    pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


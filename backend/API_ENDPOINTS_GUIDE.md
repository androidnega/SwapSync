# API Endpoints Guide - Repair Items & Repairer Sales

## 🔧 Repair Items Management

### Add Item to Repair
`POST /api/repairs/{repair_id}/items`

**Description:** Add a product from inventory to a repair. Automatically deducts stock and records sale.

**Authorization:** Repairer, Shopkeeper

**Path Parameters:**
- `repair_id` (integer): ID of the repair

**Request Body:**
```json
{
  "product_id": 100,
  "quantity": 2,
  "unit_price": 30.00,  // Optional, defaults to product.selling_price
  "notes": "Replaced with original Apple battery"  // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Added 2x iPhone Battery to repair",
  "repair_sale": {
    "id": 45,
    "product_id": 100,
    "product_name": "iPhone Battery",
    "quantity": 2,
    "unit_price": 30.00,
    "cost_price": 20.00,
    "profit": 20.00,
    "total_price": 60.00,
    "total_cost": 40.00
  },
  "updated_stock": 48,
  "updated_repair_cost": 160.00
}
```

**Error Responses:**
- `400 Bad Request` - Insufficient stock
  ```json
  {
    "detail": "Insufficient stock for iPhone Battery. Available: 1, Requested: 2"
  }
  ```
- `403 Forbidden` - Unauthorized role
- `404 Not Found` - Repair or product not found

---

### Get Repair Items
`GET /api/repairs/{repair_id}/items`

**Description:** List all items used in a specific repair

**Authorization:** Any authenticated user

**Path Parameters:**
- `repair_id` (integer): ID of the repair

**Success Response (200):**
```json
{
  "repair_id": 12,
  "items": [
    {
      "id": 45,
      "product_id": 100,
      "product_name": "iPhone Battery",
      "product_sku": "BAT-IP12",
      "quantity": 2,
      "unit_price": 30.00,
      "cost_price": 20.00,
      "total_price": 60.00,
      "total_cost": 40.00,
      "profit": 20.00,
      "repairer_id": 5,
      "repairer_name": "john_repairer",
      "notes": "Original Apple battery",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total_items": 1,
  "total_value": 60.00,
  "total_profit": 20.00
}
```

---

### Remove Item from Repair
`DELETE /api/repairs/{repair_id}/items/{item_id}`

**Description:** Remove an item from repair and restore stock

**Authorization:** Manager, CEO, Repairer

**Path Parameters:**
- `repair_id` (integer): ID of the repair
- `item_id` (integer): ID of the repair_sale record

**Success Response (204):**
No content returned

**Effect:**
- Restores `product.quantity` by the item's quantity
- Reduces `repair.items_cost` by item's total price
- Recalculates `repair.cost = service_cost + items_cost`
- Deletes the repair_sale record

---

## 📊 Dashboard - Repairer Sales Statistics

### Get All Repairers Sales Stats
`GET /api/dashboard/repairer-sales`

**Description:** View sales performance metrics for all repairers

**Authorization:** Manager, CEO, Admin

**Query Parameters:**
- `start_date` (string, optional): ISO datetime (e.g., `2025-01-01T00:00:00Z`)
- `end_date` (string, optional): ISO datetime (e.g., `2025-01-31T23:59:59Z`)
- `repairer_id` (integer, optional): Filter by specific repairer

**Success Response (200):**
```json
{
  "repairers": [
    {
      "repairer_id": 5,
      "repairer_name": "john_repairer",
      "repairer_full_name": "John Smith",
      "items_sold_count": 45,
      "total_quantity": 120,
      "gross_sales": 3500.00,
      "total_cost": 2100.00,
      "profit": 1400.00,
      "profit_margin": 40.00
    },
    {
      "repairer_id": 7,
      "repairer_name": "jane_tech",
      "repairer_full_name": "Jane Doe",
      "items_sold_count": 32,
      "total_quantity": 85,
      "gross_sales": 2800.00,
      "total_cost": 1800.00,
      "profit": 1000.00,
      "profit_margin": 35.71
    }
  ],
  "summary": {
    "total_repairers": 2,
    "total_items_sold": 77,
    "total_quantity": 205,
    "total_sales": 6300.00,
    "total_cost": 3900.00,
    "total_profit": 2400.00,
    "overall_margin": 38.10
  },
  "filters_applied": {
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-01-31T23:59:59Z",
    "repairer_id": null
  }
}
```

**Example Usage:**
```bash
# All repairers, all time
curl -X GET "http://api.digitstec.store/api/dashboard/repairer-sales" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Specific repairer, date range
curl -X GET "http://api.digitstec.store/api/dashboard/repairer-sales?repairer_id=5&start_date=2025-01-01T00:00:00Z&end_date=2025-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Repairer Sales Details
`GET /api/dashboard/repairer-sales/{repairer_id}/details`

**Description:** Detailed product-level breakdown of items sold by a specific repairer

**Authorization:** Manager, CEO, Admin

**Path Parameters:**
- `repairer_id` (integer): ID of the repairer

**Query Parameters:**
- `start_date` (string, optional): ISO datetime
- `end_date` (string, optional): ISO datetime

**Success Response (200):**
```json
{
  "repairer": {
    "id": 5,
    "username": "john_repairer",
    "full_name": "John Smith",
    "role": "repairer"
  },
  "products": [
    {
      "product_id": 100,
      "product_name": "iPhone 12 Battery",
      "product_sku": "BAT-IP12",
      "sales_count": 15,
      "total_quantity": 30,
      "gross_sales": 900.00,
      "total_cost": 600.00,
      "profit": 300.00,
      "profit_margin": 33.33
    },
    {
      "product_id": 101,
      "product_name": "iPhone 12 Screen",
      "product_sku": "SCR-IP12",
      "sales_count": 8,
      "total_quantity": 10,
      "gross_sales": 1200.00,
      "total_cost": 800.00,
      "profit": 400.00,
      "profit_margin": 33.33
    }
  ],
  "recent_sales": [
    {
      "id": 45,
      "repair_id": 12,
      "repair_description": "iPhone 12 screen replacement",
      "product_id": 100,
      "product_name": "iPhone 12 Battery",
      "quantity": 2,
      "unit_price": 30.00,
      "total_price": 60.00,
      "profit": 20.00,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "unique_products": 2,
    "total_sales": 2100.00,
    "total_profit": 700.00
  }
}
```

**Error Responses:**
- `403 Forbidden` - Repairer not in same company (multi-tenant isolation)
- `404 Not Found` - Repairer not found

---

## 🔄 Integration Examples

### Frontend: Add Item to Repair
```typescript
const addItemToRepair = async (repairId: number, productId: number, quantity: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/repairs/${repairId}/items`,
      {
        product_id: productId,
        quantity: quantity
      },
      {
        headers: { Authorization: `Bearer ${getToken()}` }
      }
    );
    
    console.log('Item added:', response.data);
    // Update UI with new stock levels and repair cost
    
  } catch (error) {
    if (error.response?.status === 400) {
      alert(error.response.data.detail); // "Insufficient stock..."
    }
  }
};
```

### Frontend: Fetch Repairer Stats
```typescript
const fetchRepairerStats = async (startDate?: string, endDate?: string) => {
  try {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await axios.get(
      `${API_URL}/dashboard/repairer-sales`,
      {
        params,
        headers: { Authorization: `Bearer ${getToken()}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch repairer stats:', error);
  }
};
```

---

## 🗂️ Database Schema Reference

### repair_sales Table
```sql
CREATE TABLE repair_sales (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    repairer_id INTEGER NOT NULL REFERENCES users(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL,
    profit NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_repair_sales_repair_id ON repair_sales(repair_id);
CREATE INDEX idx_repair_sales_product_id ON repair_sales(product_id);
CREATE INDEX idx_repair_sales_repairer_id ON repair_sales(repairer_id);
CREATE INDEX idx_repair_sales_created_at ON repair_sales(created_at);
```

---

## ⚡ Performance Notes

- Repairer sales queries are optimized with indexed columns
- Dashboard endpoints use aggregation at DB level (no N+1 queries)
- Stock updates are transactional to prevent race conditions
- Company isolation applied via `get_company_user_ids()` filter

---

## 🔒 Permissions Summary

| Endpoint | Repairer | Shopkeeper | Manager | Admin |
|----------|----------|------------|---------|-------|
| POST /repairs/{id}/items | ✅ | ✅ | ✅ | ✅ |
| GET /repairs/{id}/items | ✅ | ✅ | ✅ | ✅ |
| DELETE /repairs/{id}/items/{item_id} | ✅ | ❌ | ✅ | ✅ |
| GET /dashboard/repairer-sales | ❌ | ❌ | ✅ | ✅ |
| GET /dashboard/repairer-sales/{id}/details | ❌ | ❌ | ✅ | ✅ |


# Test Suite Documentation

## Overview
Comprehensive tests for SwapSync features implemented in this sprint.

## Test Files

### 1. test_repair_items.py
**Purpose:** Tests unified inventory system with repairs

**Coverage:**
- ✅ Add product to repair with stock deduction
- ✅ Insufficient stock error handling
- ✅ Default unit price from product
- ✅ Get repair items list
- ✅ Remove item restores stock
- ✅ Authorization checks
- 🔄 Concurrent stock updates (placeholder)

**Run:**
```bash
pytest tests/test_repair_items.py -v
```

### 2. test_dashboard_repairer_sales.py
**Purpose:** Tests dashboard reporting and aggregation

**Coverage:**
- ✅ Get repairer sales statistics
- ✅ Date range filtering
- ✅ Per-repairer detailed breakdown
- ✅ Permission checks
- ✅ Profit calculation accuracy
- 🔄 Multi-tenant isolation (placeholder)

**Run:**
```bash
pytest tests/test_dashboard_repairer_sales.py -v
```

### 3. test_phone_deletion.py
**Purpose:** Tests phone deletion with dependency checks (500 error fix)

**Coverage:**
- ✅ Delete phone with no dependencies
- ✅ Delete with sales returns 409
- ✅ Delete with swaps returns 409
- ✅ Delete with repairs returns 409
- ✅ Delete with pending resales returns 409
- ✅ Clear error messages
- ✅ Bulk delete skips dependencies
- ✅ Authorization checks

**Run:**
```bash
pytest tests/test_phone_deletion.py -v
```

## Running All Tests

### Run All New Tests
```bash
pytest tests/test_repair_items.py tests/test_dashboard_repairer_sales.py tests/test_phone_deletion.py -v
```

### Run with Coverage
```bash
pytest tests/ --cov=app --cov-report=html
```

### Run Specific Test
```bash
pytest tests/test_repair_items.py::test_add_repair_item_success -v
```

## Test Configuration

### Required Fixtures
These tests require the following fixtures (define in `conftest.py`):

```python
@pytest.fixture
def client():
    """FastAPI test client"""
    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)

@pytest.fixture
def db():
    """Database session"""
    # Your database setup
    pass

@pytest.fixture
def auth_headers_manager():
    """Auth headers for manager role"""
    # Your auth token generation
    pass

@pytest.fixture
def auth_headers_repairer():
    """Auth headers for repairer role"""
    pass

@pytest.fixture
def auth_headers_shopkeeper():
    """Auth headers for shopkeeper role"""
    pass
```

## Test Data Setup

### Before Running Tests
1. Ensure test database is set up
2. Run migrations:
   ```bash
   python migrate_add_repair_sales_table.py
   ```
3. Create test users with different roles
4. Seed minimal test data (categories, etc.)

## Expected Results

### All Tests Passing
```
test_repair_items.py ............................ 6 passed
test_dashboard_repairer_sales.py ................ 5 passed  
test_phone_deletion.py .......................... 9 passed

================= 20 passed in 3.45s =================
```

## Integration Tests

### Manual Integration Testing

#### Test 1: End-to-End Repair with Items
```bash
# 1. Create repair
POST /repairs/
{
  "customer_id": 1,
  "phone_description": "iPhone 12",
  "issue_description": "Screen broken",
  "service_cost": 50.00
}

# 2. Add item to repair
POST /repairs/{id}/items
{
  "product_id": 10,
  "quantity": 2
}

# Expected:
# - Stock decreases by 2
# - Repair cost increases
# - repair_sale record created
```

#### Test 2: Manager Dashboard Stats
```bash
# 1. Add items to repairs as different repairers
# 2. View dashboard
GET /dashboard/repairer-sales

# Expected:
# - Shows all repairers
# - Accurate profit calculations
# - Proper date filtering
```

#### Test 3: Phone Deletion with Dependencies
```bash
# 1. Try deleting phone with sale
DELETE /phones/{id}

# Expected:
# - HTTP 409 Conflict
# - Clear error message listing dependencies
```

## Performance Tests

### Load Testing (Optional)
```bash
# Install locust
pip install locust

# Create locustfile.py for load testing repair items endpoints
locust -f tests/locustfile.py --host=http://localhost:8000
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: pytest tests/ -v --cov=app
```

## Known Issues & Limitations

1. **Concurrent Stock Updates Test:** Placeholder - requires threading/asyncio
2. **Multi-tenant Isolation Test:** Placeholder - requires full multi-tenant setup
3. **Frontend Tests:** Not included - manual testing recommended

## Future Enhancements

- [ ] Add E2E tests with Playwright/Cypress
- [ ] Add API contract tests
- [ ] Add performance benchmarks
- [ ] Add security penetration tests
- [ ] Add load/stress tests

## Troubleshooting

### Tests Fail: "Table does not exist"
**Solution:** Run migration first
```bash
python migrate_add_repair_sales_table.py
```

### Tests Fail: "User not authenticated"
**Solution:** Check auth fixtures return valid tokens

### Tests Timeout
**Solution:** Increase timeout in pytest.ini
```ini
[pytest]
timeout = 300
```

## Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** Critical paths covered
- **E2E Tests:** Happy paths covered

## Contact

For test issues or questions, check the implementation docs:
- `IMPLEMENTATION_SUMMARY.md`
- `API_ENDPOINTS_GUIDE.md`
- `QUICK_START.md`


# Phone Product Creation 422 Error - Troubleshooting Guide

## Issue
When adding a phone as a product, getting:
```
❌ Error: Validation error
api.digitstec.store/api/products/phone:1 Failed to load resource: the server responded with a status of 422 ()
```

## Root Cause
422 Validation Error means the Pydantic schema validation is failing. The endpoint `/api/products/phone` requires:

### Required Fields (PhoneProductCreate schema):
- `name` (string) - Phone name
- `imei` (string) - IMEI number **REQUIRED**
- `category_id` (integer) - Category ID
- `brand` (string, optional) - Phone brand
- `cost_price` (float > 0) - Cost price
- `selling_price` (float > 0) - Selling price
- `phone_condition` (string) - **REQUIRED**: "New", "Used", or "Refurbished"
- `quantity` (integer) - Default 1 for phones
- `is_phone` (boolean) - Default true
- `is_swappable` (boolean) - Default true
- `phone_status` (string) - Default "AVAILABLE"

### Optional Fields:
- `sku` (string) - SKU code
- `barcode` (string) - Barcode
- `discount_price` (float) - Discount price
- `min_stock_level` (integer) - Default 1
- `description` (string) - Description
- `specs` (object) - General specs
- `phone_specs` (object) - Phone-specific specs
- `condition` (string) - Default "New"

## Solution

### Frontend Fix (Already Implemented in Products.tsx):
The frontend has client-side validation that checks:
```typescript
// Validation for phone products
if (formData.is_phone) {
  if (!formData.imei || !formData.phone_condition || !formData.phone_specs) {
    alert("Please fill in all required phone specifications");
    return;
  }
}
```

### Backend Endpoint:
```python
@router.post("/phone", response_model=ProductResponse)
def create_phone_product(
    phone_product: PhoneProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Creates phone with all required fields
    # Validates IMEI uniqueness
    # Validates SKU uniqueness
    # Sets is_phone=True automatically
```

## Debugging Steps

### 1. Check Request Payload
Open browser DevTools > Network tab and inspect the POST request to `/api/products/phone`:
```json
{
  "name": "iPhone 13 Pro",
  "imei": "123456789012345",
  "category_id": 1,
  "brand": "Apple",
  "cost_price": 800.00,
  "selling_price": 1000.00,
  "phone_condition": "New",  // ← Must be present!
  "quantity": 1,
  "is_phone": true,
  "is_swappable": true,
  "phone_specs": {  // ← Should be present
    "storage": "128GB",
    "color": "Blue",
    "ram": "6GB"
  }
}
```

### 2. Common Issues

**Missing `phone_condition`:**
```json
❌ { "phone_condition": null }  // Will fail validation
✅ { "phone_condition": "New" }  // Correct
```

**Missing `imei`:**
```json
❌ { "imei": "" }  // Will fail validation
✅ { "imei": "123456789012345" }  // Correct
```

**Invalid `phone_condition` value:**
```json
❌ { "phone_condition": "Like New" }  // Not in allowed values
✅ { "phone_condition": "New" }  // Correct (New, Used, or Refurbished)
```

### 3. Frontend Form Check
Ensure the phone form includes:
```typescript
<select name="phone_condition" required>
  <option value="New">New</option>
  <option value="Used">Used</option>
  <option value="Refurbished">Refurbished</option>
</select>

<input name="imei" type="text" required />

<textarea name="phone_specs" required />
```

## Quick Fix

If the error persists, try:

1. **Clear browser cache**
2. **Hard refresh** (Ctrl+Shift+R)
3. **Check console** for JavaScript errors
4. **Verify all required fields** are filled
5. **Test with minimal data:**
```bash
curl -X POST "https://api.digitstec.store/api/products/phone" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Phone",
    "imei": "123456789012345",
    "category_id": 1,
    "brand": "Test",
    "cost_price": 100.00,
    "selling_price": 150.00,
    "phone_condition": "New",
    "quantity": 1
  }'
```

## Contact
If the issue persists after following these steps, please provide:
- The exact request payload from Network tab
- The full error response
- Screenshots of the form with filled data


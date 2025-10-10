# 🔧 SwapSync Enhancement Implementation Guide

**For Cursor AI Execution**  
**Date:** October 9, 2025  
**Status:** Ready for Implementation

---

## 📋 OVERVIEW

This guide provides step-by-step instructions for implementing the remaining 2% of features identified in the checklist validation report. All enhancements are optional but will bring the system to 100% checklist completion.

---

## 🎯 ENHANCEMENT PRIORITY LIST

### **Priority 1: Quick Wins** ⚡ (1-2 hours)
1. ✅ Add `current_owner_id` to Phone model
2. ✅ Add staff filter to Reports UI
3. ✅ Update phone status on repair completion

### **Priority 2: Medium Enhancements** 📊 (3-5 hours)
4. ✅ Add PDF invoice export
5. ✅ Add IMEI barcode display/scanning prep

### **Priority 3: Advanced Features** 🚀 (5+ hours)
6. ✅ Automated test suite (pytest + Jest)
7. ✅ Phone photos upload feature
8. ✅ Multi-shop support foundation

---

## 1️⃣ ADD CURRENT_OWNER_ID TO PHONE MODEL

### **Purpose:**
Track who currently owns each phone (customer or shop)

### **Implementation:**

#### **Step 1: Update Phone Model**
**File:** `swapsync-backend/app/models/phone.py`

```python
# Add after line 30 (after 'value' field):
current_owner_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
current_owner_type = Column(String, default="shop")  # 'shop', 'customer', 'repair'

# Add relationship after line 35:
current_owner = relationship("Customer", foreign_keys=[current_owner_id])
```

#### **Step 2: Create Migration**
**File:** `swapsync-backend/migrate_add_owner.py`

```python
"""
Add current_owner_id to phones table
"""
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./swapsync.db"
engine = create_engine(DATABASE_URL)

# Add columns to phones table
with engine.connect() as conn:
    conn.execute("ALTER TABLE phones ADD COLUMN current_owner_id INTEGER")
    conn.execute("ALTER TABLE phones ADD COLUMN current_owner_type VARCHAR DEFAULT 'shop'")
    conn.commit()

print("✅ Migration complete: current_owner_id added to phones")
```

#### **Step 3: Update Swap/Sale Logic**
**File:** `swapsync-backend/app/api/routes/swap_routes.py`

```python
# When creating a swap, update the new phone's owner:
new_phone.current_owner_id = customer_id
new_phone.current_owner_type = "customer"

# If trade-in phone is in inventory, mark it as shop-owned:
if trade_in_phone:
    trade_in_phone.current_owner_id = None
    trade_in_phone.current_owner_type = "shop"
```

**File:** `swapsync-backend/app/api/routes/sale_routes.py`

```python
# When creating a sale, update phone owner:
phone.current_owner_id = customer_id
phone.current_owner_type = "customer"
```

---

## 2️⃣ ADD STAFF FILTER TO REPORTS UI

### **Purpose:**
Allow filtering reports by staff member (which Shop Keeper/Repairer made the transaction)

### **Implementation:**

#### **Step 1: Update Reports API**
**File:** `swapsync-backend/app/api/routes/reports_routes.py`

```python
# Add to sales-swaps endpoint (around line 30):
@router.get("/sales-swaps", dependencies=[Depends(require_role(["shop_keeper", "ceo", "super_admin"]))])
async def get_sales_swaps_report(
    start_date: str = None,
    end_date: str = None,
    transaction_type: str = "all",
    staff_id: int = None,  # NEW PARAMETER
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Add filter logic:
    if staff_id:
        sales_query = sales_query.join(Invoice).filter(Invoice.staff_id == staff_id)
        swaps_query = swaps_query.join(Invoice).filter(Invoice.staff_id == staff_id)
```

#### **Step 2: Update Reports Frontend**
**File:** `swapsync-frontend/src/pages/Reports.tsx`

```typescript
// Add state for staff filter (around line 20):
const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
const [staffList, setStaffList] = useState<any[]>([]);

// Fetch staff list on mount:
useEffect(() => {
  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/staff/list');
      setStaffList(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };
  fetchStaff();
}, []);

// Add to filter section (around line 150):
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Filter by Staff
  </label>
  <select
    value={selectedStaff || ''}
    onChange={(e) => setSelectedStaff(e.target.value ? Number(e.target.value) : null)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">All Staff</option>
    {staffList.map(staff => (
      <option key={staff.id} value={staff.id}>
        {staff.full_name} ({staff.role})
      </option>
    ))}
  </select>
</div>

// Update fetchTransactions to include staff_id:
const params: any = {
  start_date: startDate,
  end_date: endDate,
  transaction_type: transactionType,
  staff_id: selectedStaff,  // NEW
};
```

---

## 3️⃣ UPDATE PHONE STATUS ON REPAIR COMPLETION

### **Purpose:**
Automatically change phone status from UNDER_REPAIR back to AVAILABLE when repair is completed

### **Implementation:**

#### **File:** `swapsync-backend/app/api/routes/repair_routes.py`

```python
# Update the repair update endpoint (around line 80):
@router.put("/{repair_id}")
async def update_repair(
    repair_id: int,
    repair_update: RepairUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ... existing code ...
    
    # NEW: Update linked phone status
    if repair.phone_id and repair_update.status == "Completed":
        phone = db.query(Phone).filter(Phone.id == repair.phone_id).first()
        if phone:
            phone.status = PhoneStatus.AVAILABLE
            db.commit()
    
    # NEW: When status is "Delivered", mark as no longer under repair
    if repair_update.status == "Delivered" and repair.phone_id:
        phone = db.query(Phone).filter(Phone.id == repair.phone_id).first()
        if phone and phone.status == PhoneStatus.UNDER_REPAIR:
            phone.status = PhoneStatus.AVAILABLE
            db.commit()
```

---

## 4️⃣ ADD PDF INVOICE EXPORT

### **Purpose:**
Generate printable PDF invoices for swaps and sales

### **Implementation:**

#### **Step 1: Install Dependencies**
**File:** `swapsync-backend/requirements.txt`

```text
# Add these lines:
reportlab==4.0.7
PyPDF2==3.0.1
```

Run: `pip install reportlab PyPDF2`

#### **Step 2: Create PDF Generator**
**File:** `swapsync-backend/app/core/pdf_generator.py`

```python
"""
PDF Invoice Generator
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO
from datetime import datetime


def generate_invoice_pdf(invoice_data: dict) -> BytesIO:
    """
    Generate a PDF invoice from invoice data
    
    Args:
        invoice_data: Dictionary with invoice details
    
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Header
    story.append(Paragraph("SWAPSYNC", title_style))
    story.append(Paragraph("Phone Shop Management", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Invoice Number and Date
    invoice_info = [
        ['Invoice Number:', invoice_data['invoice_number']],
        ['Date:', invoice_data['date']],
        ['Transaction Type:', invoice_data['transaction']['type']],
    ]
    
    info_table = Table(invoice_info, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Customer Information
    story.append(Paragraph("Customer Information", styles['Heading2']))
    customer_info = [
        ['Name:', invoice_data['customer']['name']],
        ['Phone:', invoice_data['customer']['phone']],
        ['Customer ID:', str(invoice_data['customer']['id'])],
    ]
    
    customer_table = Table(customer_info, colWidths=[2*inch, 3*inch])
    customer_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(customer_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Items/Products
    story.append(Paragraph("Transaction Details", styles['Heading2']))
    
    # Pricing breakdown
    pricing_data = [
        ['Description', 'Amount'],
        ['Original Price', f"GH¢{invoice_data['pricing']['original_price']:.2f}"],
    ]
    
    if invoice_data['pricing']['cash_added'] > 0:
        pricing_data.append(['Cash Added', f"GH¢{invoice_data['pricing']['cash_added']:.2f}"])
    
    if invoice_data['pricing']['discount'] > 0:
        pricing_data.append(['Discount', f"-GH¢{invoice_data['pricing']['discount']:.2f}"])
    
    pricing_data.append(['Final Amount', f"GH¢{invoice_data['pricing']['final_amount']:.2f}"])
    
    pricing_table = Table(pricing_data, colWidths=[4*inch, 2*inch])
    pricing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 12),
        ('FONT', (0, 1), (-1, -2), 'Helvetica', 10),
        ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
    ]))
    story.append(pricing_table)
    story.append(Spacer(1, 0.5*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph("Thank you for your business!", footer_style))
    story.append(Paragraph("SwapSync - Phone Shop Management System", footer_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_invoice_pdf_endpoint(invoice_number: str, db) -> BytesIO:
    """
    Generate PDF for a specific invoice number
    """
    from app.core.invoice_generator import get_invoice_by_number, format_invoice_data
    
    invoice = get_invoice_by_number(db, invoice_number)
    if not invoice:
        raise ValueError(f"Invoice {invoice_number} not found")
    
    invoice_data = format_invoice_data(invoice)
    return generate_invoice_pdf(invoice_data)
```

#### **Step 3: Add PDF Route**
**File:** `swapsync-backend/app/api/routes/invoice_routes.py`

```python
from fastapi.responses import StreamingResponse
from app.core.pdf_generator import generate_invoice_pdf_endpoint

# Add this endpoint:
@router.get("/{invoice_number}/pdf")
async def download_invoice_pdf(
    invoice_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download invoice as PDF"""
    try:
        pdf_buffer = generate_invoice_pdf_endpoint(invoice_number, db)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{invoice_number}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

#### **Step 4: Add PDF Button to Frontend**
**File:** `swapsync-frontend/src/components/InvoiceModal.tsx`

```typescript
// Add PDF download function (around line 50):
const downloadPDF = async () => {
  try {
    const response = await api.get(
      `/api/invoices/${invoice.invoice_number}/pdf`,
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${invoice.invoice_number}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Failed to download PDF');
  }
};

// Add button next to Print button (around line 200):
<button
  onClick={downloadPDF}
  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-2"
>
  📄 Download PDF
</button>
```

---

## 5️⃣ ADD IMEI BARCODE DISPLAY

### **Purpose:**
Display IMEI as scannable barcode for easy inventory management

### **Implementation:**

#### **Step 1: Install Barcode Library (Frontend)**
**Terminal:**
```bash
cd swapsync-frontend
npm install react-barcode
```

#### **Step 2: Create Barcode Component**
**File:** `swapsync-frontend/src/components/PhoneBarcode.tsx`

```typescript
import React from 'react';
import Barcode from 'react-barcode';

interface PhoneBarcodeProps {
  imei: string;
  showValue?: boolean;
  width?: number;
  height?: number;
}

const PhoneBarcode: React.FC<PhoneBarcodeProps> = ({
  imei,
  showValue = true,
  width = 2,
  height = 50,
}) => {
  if (!imei) {
    return <div className="text-gray-400 text-sm">No IMEI</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <Barcode
        value={imei}
        width={width}
        height={height}
        displayValue={showValue}
        format="CODE128"
      />
    </div>
  );
};

export default PhoneBarcode;
```

#### **Step 3: Use in Phone Pages**
**File:** `swapsync-frontend/src/pages/Phones.tsx`

```typescript
import PhoneBarcode from '../components/PhoneBarcode';

// In the phone list/details view:
{phone.imei && (
  <div className="mt-2">
    <PhoneBarcode imei={phone.imei} />
  </div>
)}
```

---

## 6️⃣ AUTOMATED TEST SUITE

### **Purpose:**
Add automated tests to ensure system reliability

### **Backend Tests (pytest)**

#### **Step 1: Install pytest**
```bash
cd swapsync-backend
pip install pytest pytest-cov httpx
```

#### **Step 2: Create Test Structure**
```
swapsync-backend/
  tests/
    __init__.py
    conftest.py
    test_auth.py
    test_customers.py
    test_swaps.py
    test_sales.py
    test_repairs.py
```

#### **File:** `swapsync-backend/tests/conftest.py`
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

#### **File:** `swapsync-backend/tests/test_customers.py`
```python
def test_create_customer(client, db):
    response = client.post(
        "/api/customers/",
        json={
            "full_name": "Test Customer",
            "phone_number": "0241234567",
            "email": "test@example.com"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Test Customer"
    assert "id" in data

def test_duplicate_phone_number(client, db):
    # Create first customer
    client.post("/api/customers/", json={
        "full_name": "Customer 1",
        "phone_number": "0241234567"
    })
    
    # Try to create duplicate
    response = client.post("/api/customers/", json={
        "full_name": "Customer 2",
        "phone_number": "0241234567"
    })
    assert response.status_code == 400
```

### **Frontend Tests (Jest + RTL)**

#### **File:** `swapsync-frontend/src/components/__tests__/DashboardCard.test.tsx`
```typescript
import { render, screen } from '@testing-library/react';
import DashboardCard from '../DashboardCard';

describe('DashboardCard', () => {
  it('renders title and value correctly', () => {
    render(
      <DashboardCard
        title="Total Sales"
        value={150}
        icon="📊"
        color="blue"
      />
    );
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });
});
```

---

## 7️⃣ PHONE PHOTOS UPLOAD

### **Purpose:**
Allow uploading photos for phones in inventory

### **Implementation:**

#### **Step 1: Update Phone Model**
**File:** `swapsync-backend/app/models/phone.py`

```python
# Add field:
photo_url = Column(String, nullable=True)  # Path to uploaded photo
```

#### **Step 2: Create Upload Endpoint**
**File:** `swapsync-backend/app/api/routes/phone_routes.py`

```python
from fastapi import UploadFile, File
import shutil
from pathlib import Path

UPLOAD_DIR = Path("uploads/phones")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/{phone_id}/upload-photo")
async def upload_phone_photo(
    phone_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload photo for a phone"""
    phone = db.query(Phone).filter(Phone.id == phone_id).first()
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    
    # Save file
    file_extension = file.filename.split(".")[-1]
    filename = f"phone_{phone_id}.{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update phone record
    phone.photo_url = f"/uploads/phones/{filename}"
    db.commit()
    
    return {"message": "Photo uploaded successfully", "photo_url": phone.photo_url}
```

#### **Step 3: Add Upload UI**
**File:** `swapsync-frontend/src/pages/Phones.tsx`

```typescript
const handlePhotoUpload = async (phoneId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    await api.post(`/api/phones/${phoneId}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    alert('Photo uploaded successfully!');
    fetchPhones(); // Refresh list
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload photo');
  }
};

// In the phone form/card:
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    if (e.target.files?.[0]) {
      handlePhotoUpload(phone.id, e.target.files[0]);
    }
  }}
  className="mt-2"
/>

{phone.photo_url && (
  <img
    src={`http://localhost:8000${phone.photo_url}`}
    alt={phone.model}
    className="w-32 h-32 object-cover rounded"
  />
)}
```

---

## 8️⃣ MULTI-SHOP SUPPORT FOUNDATION

### **Purpose:**
Prepare system for managing multiple shop locations

### **Implementation:**

#### **Step 1: Create Shop Model**
**File:** `swapsync-backend/app/models/shop.py`

```python
"""
Shop Model - For multi-location support
"""
from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Shop(Base):
    """Shop location model"""
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
```

#### **Step 2: Link Users to Shops**
**File:** `swapsync-backend/app/models/user.py`

```python
# Add field:
shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)

# Add relationship:
shop = relationship("Shop", backref="staff")
```

#### **Step 3: Add Shop Filter to Queries**
All transaction endpoints would need to filter by `current_user.shop_id` when querying data.

---

## 🧪 TESTING CHECKLIST

After implementing each enhancement:

### **1. Current Owner Tracking:**
- [ ] Create swap → Verify new phone owner is customer
- [ ] Create sale → Verify phone owner is customer
- [ ] Trade-in received → Verify owner is shop

### **2. Staff Filter:**
- [ ] Open Reports page
- [ ] Select specific staff member
- [ ] Verify only their transactions show

### **3. Repair Status Updates:**
- [ ] Create repair with phone linked
- [ ] Mark as "Completed"
- [ ] Verify phone status changes to AVAILABLE

### **4. PDF Export:**
- [ ] Open any invoice
- [ ] Click "Download PDF"
- [ ] Verify PDF downloads and displays correctly

### **5. IMEI Barcode:**
- [ ] View phone with IMEI
- [ ] Verify barcode displays
- [ ] Scan with barcode reader (if available)

### **6. Automated Tests:**
- [ ] Run `pytest` in backend
- [ ] Run `npm test` in frontend
- [ ] All tests pass

### **7. Phone Photos:**
- [ ] Upload photo for a phone
- [ ] Verify photo displays in phone list
- [ ] Verify photo persists after refresh

---

## 📝 IMPLEMENTATION ORDER

For Cursor AI to implement all at once:

```
1. Quick Wins (Priority 1) - 2 hours
   ├── Add current_owner_id to Phone model
   ├── Update swap/sale logic for ownership
   ├── Add staff filter to Reports UI
   └── Update phone status on repair completion

2. Medium Enhancements (Priority 2) - 4 hours
   ├── Install reportlab
   ├── Create PDF generator
   ├── Add PDF endpoint
   ├── Add PDF button to frontend
   └── Install react-barcode and create barcode component

3. Advanced Features (Priority 3) - 6+ hours
   ├── Set up pytest structure
   ├── Write 10+ backend tests
   ├── Set up Jest/RTL
   ├── Write 10+ frontend tests
   ├── Add photo upload backend
   ├── Add photo upload frontend
   └── Create Shop model foundation

Total Estimated Time: 12-15 hours
```

---

## 🎯 SUCCESS CRITERIA

All enhancements complete when:

✅ Phone ownership tracked on all transactions  
✅ Reports can filter by staff member  
✅ Repair completion updates phone status  
✅ PDF invoices can be downloaded  
✅ IMEI barcodes display on phones  
✅ 20+ automated tests pass  
✅ Photos can be uploaded for phones  
✅ Multi-shop foundation in place  

---

## 🚀 READY FOR CURSOR AI

This guide is ready for Cursor AI to execute. Each section includes:
- Clear purpose statement
- Exact file locations
- Complete code snippets
- Testing instructions

**Status:** ✅ Ready for Implementation  
**Estimated Completion:** 12-15 hours  
**Priority:** Optional (system is already production-ready)

---

**Implementation Date:** Pending  
**Created:** October 9, 2025  
**System Version:** 1.0.0 → 1.1.0 (after enhancements)


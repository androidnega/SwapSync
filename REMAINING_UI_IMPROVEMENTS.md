# 🎨 Remaining UI Improvements

## ✅ Completed
1. **Manager swap recording disabled** - Managers can only view, not record swaps

## 📝 Remaining Tasks

### 1. Swap View Modal - Show Both Phones (2-Column Layout)
**Location**: Components where swaps are viewed
**Changes Needed**:
- Display sold phone and incoming phone side-by-side
- Use 2-column grid layout (responsive)
- Keep modal height reasonable
- Show: Brand, Model, Value, Condition for both phones

### 2. Pending Resales Page Improvements
**Location**: `frontend/src/pages/PendingResales.tsx`

#### A. Stats Cards - Simplify Design
**Current**: Colorful cards with gradients and colored borders
**Required**: 
```tsx
// Remove: border-l-4 border-yellow-500, colored backgrounds
// Add: Simple white cards with subtle borders, no colors
<div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
  <p className="text-sm text-gray-600 mb-1">Pending Resale</p>
  <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
</div>
```

#### B. Show Inventory Items as Cards
**Current**: Shows "No pending resales" even when data exists
**Required**:
- Display incoming phones from swaps as purchasable items
- Each card shows:
  - **Sold Phone** (what customer got): Brand, Model, Value
  - **Incoming Phone** (what shop received): Brand, Model, Condition, Value
  - **Swapped phone is AVAILABLE FOR PURCHASE** badge
  - Transaction details
- Use responsive 2-column card layout (not table)
- Badge: "Available for Purchase" in prominent position

#### C. Card Design Example
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Left: Sold Phone */}
    <div className="border-r border-gray-200 pr-4">
      <h4 className="text-xs font-semibold text-gray-500 mb-2">SOLD PHONE</h4>
      <p className="font-bold">{sold_brand} {sold_model}</p>
      <p className="text-sm text-gray-600">₵{sold_value}</p>
    </div>
    
    {/* Right: Incoming Phone (Available) */}
    <div>
      <h4 className="text-xs font-semibold text-gray-500 mb-2">INCOMING PHONE</h4>
      <p className="font-bold">{incoming_brand} {incoming_model}</p>
      <p className="text-sm text-gray-600">{condition}</p>
      <p className="text-sm text-gray-900">₵{incoming_value}</p>
      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
        Available for Purchase
      </span>
    </div>
  </div>
</div>
```

### 3. Customer Details Modal - Compact Layout
**Location**: `frontend/src/pages/Customers.tsx` (View Modal)
**Current Issue**: Modal too long/tall
**Required**:
- Change from single column to 2-column grid
- Reduce vertical spacing
- Group related fields
- Example structure:
```tsx
<div className="grid grid-cols-2 gap-x-6 gap-y-3">
  <div>
    <label className="text-xs text-gray-500">Full Name</label>
    <p className="font-medium">{name}</p>
  </div>
  <div>
    <label className="text-xs text-gray-500">Phone</label>
    <p className="font-medium">{phone}</p>
  </div>
  // ... more fields in 2 columns
</div>
```

## 🎯 Implementation Priority
1. **URGENT**: Pending Resales stats cards (simple white, no colors)
2. **URGENT**: Pending Resales show inventory items with both phone details
3. **HIGH**: Customer Details modal 2-column compact layout
4. **MEDIUM**: Swap view modal 2-column layout

## 📐 Design Guidelines
- **No gradients** - Use solid colors only
- **Minimal colors** - Primarily grays, white backgrounds
- **Compact spacing** - Reduce padding/margins
- **2-column layouts** - For better space utilization
- **Clear hierarchy** - Use font sizes and weights for emphasis
- **Responsive** - Stack to single column on mobile

## 🔍 Files to Modify
1. `frontend/src/pages/PendingResales.tsx` - Stats + inventory cards
2. `frontend/src/pages/Customers.tsx` - Customer details modal
3. Swap view modals (wherever swaps are displayed in detail)


# ✅ Sold Items - Profit Card Added

## 🎯 What Changed

Added a **Profit Card** to the Sold Items page that shows profit for daily, weekly, and monthly views.

---

## 📊 New Profit Card

### Features:
- ✅ Shows **Total Profit** for selected period (daily/weekly/monthly)
- ✅ Displays **Profit Margin %** 
- ✅ **Manager-only** visibility (shopkeepers cannot see profit)
- ✅ **Color-coded**: Green for profit, Red for loss
- ✅ **Soft green gradient** background to stand out

---

## 🎨 Card Design

### Visual Appearance:
```
┌──────────────────────────────┐
│ 💚 Soft green gradient bg    │
│                              │
│ Total Profit                 │
│ ₵450.00 (green if positive)  │
│ 15.2% margin                 │
└──────────────────────────────┘
```

### Styling:
- **Background**: Gradient from green-50 to emerald-50
- **Border**: Green-200 (soft green border)
- **Label**: Green-700 text (medium green)
- **Value**: Green-700 for profit, Red-600 for loss
- **Margin**: Green-600 text (shows profit margin %)

---

## 🔒 Permissions

### For Managers (manager/ceo):
- ✅ **Can see profit card**
- Shows total profit for selected period
- Shows profit margin percentage
- Updates when changing daily/weekly/monthly view

### For Shopkeepers (shop_keeper):
- ❌ **Cannot see profit card**
- Profit information is hidden (business sensitive)
- Only see: Sales count, Items sold, Revenue, Discounts

---

## 📋 Stats Cards Layout

### Shopkeeper View (4 cards):
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Sales │ Items Sold  │   Revenue   │  Discounts  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Manager View (5 cards):
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Sales │ Items Sold  │   Revenue   │  Discounts  │   Profit    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
                                                          └──> New! 💚
```

---

## 🧮 Profit Calculation

### Formula:
```
Profit = Total Revenue - (Cost Price × Quantity)
Profit Margin % = (Profit / Revenue) × 100
```

### Example:
```
Product: iPhone Case
Quantity: 10
Cost Price: ₵30 each
Selling Price: ₵50 each
Revenue: ₵500
Cost: ₵300
Profit: ₵200
Margin: 40%
```

---

## 📱 Responsive Design

### Mobile (1 column):
```
┌─────────────┐
│ Total Sales │
├─────────────┤
│ Items Sold  │
├─────────────┤
│   Revenue   │
├─────────────┤
│  Discounts  │
├─────────────┤ ← Only for managers
│   Profit    │
└─────────────┘
```

### Tablet (2 columns):
```
┌─────────────┬─────────────┐
│ Total Sales │ Items Sold  │
├─────────────┼─────────────┤
│   Revenue   │  Discounts  │
├─────────────┴─────────────┤ ← Manager only
│          Profit            │
└───────────────────────────┘
```

### Desktop (5 columns for managers):
```
All 5 cards in one row
```

---

## 🔧 Technical Details

### Changes Made:

1. **Interface Update** (Line 8-22):
   - Added `profit: number` to ProductSale interface

2. **State Management** (Line 35):
   - Added `userRole` state to track user role

3. **User Role Fetch** (Line 42-53):
   - Updated to fetch and store user role

4. **Profit Calculation** (Line 108):
   - Added: `const totalProfit = filteredSales.reduce(...)`

5. **Profit Card** (Line 407-417):
   - New card with conditional rendering
   - Shows profit and margin percentage
   - Green gradient background
   - Manager-only visibility

6. **Grid Layout** (Line 389):
   - Dynamic grid: 4 columns for shopkeeper, 5 for manager
   - Responsive breakpoints maintained

---

## ✨ Features

### 1. **Dynamic Color**
```tsx
{totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}
```
- Profit: Green text ✅
- Loss: Red text ⚠️

### 2. **Profit Margin**
```tsx
{((totalProfit / totalRevenue) * 100).toFixed(1)}% margin
```
- Shows percentage of revenue that is profit
- Helps manager understand profitability
- Example: "15.2% margin"

### 3. **Period-Aware**
- **Daily**: Shows profit for selected day
- **Weekly**: Shows profit for selected week
- **Monthly**: Shows profit for selected month
- Updates automatically when changing view type

---

## 🧪 Testing

### Test as Manager:
1. ✅ Login as manager
2. ✅ Go to Sold Items page
3. ✅ Should see **5 cards** (including Profit)
4. ✅ Profit card has green gradient
5. ✅ Shows profit amount and margin %
6. ✅ Changes view (daily/weekly/monthly)
7. ✅ Profit updates accordingly

### Test as Shopkeeper:
1. ✅ Login as shopkeeper
2. ✅ Go to Sold Items page
3. ✅ Should see **4 cards** (NO Profit card)
4. ✅ Profit information hidden

---

## 📊 Example Outputs

### High Profit (Good):
```
Total Profit
₵450.00
15.2% margin
```

### Low Profit (Warning):
```
Total Profit
₵45.00
2.1% margin
```

### Loss (Alert):
```
Total Profit
-₵120.00 (red text)
-5.5% margin
```

---

## ✅ Summary

**Added:**
- ✅ New Profit card for managers
- ✅ Profit margin percentage display
- ✅ Role-based visibility
- ✅ Soft green gradient design
- ✅ Dynamic color based on profit/loss

**Permissions:**
- 👨‍💼 Manager: Can see profit
- 👨‍💻 Shopkeeper: Cannot see profit

**Updates:**
- Daily view → Daily profit
- Weekly view → Weekly profit
- Monthly view → Monthly profit

---

**Date:** October 10, 2025  
**Status:** ✅ COMPLETE  
**File:** `frontend/src/pages/SoldItems.tsx`


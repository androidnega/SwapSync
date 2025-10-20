-- EMERGENCY: Clear all POS sales data
-- Copy and paste this ENTIRE script into Railway PostgreSQL Query tab
-- This handles all foreign key constraints properly

BEGIN;

-- Delete child records first (pos_sale_items references pos_sales)
DELETE FROM pos_sale_items;

-- Delete parent records (pos_sales)
DELETE FROM pos_sales;

-- Delete product_sales records
DELETE FROM product_sales;

-- Delete stock movements for POS sales
DELETE FROM stock_movements WHERE reference_type = 'pos_sale';

COMMIT;

-- Verify deletion
SELECT 'POS Sales:' as table_name, COUNT(*) as remaining FROM pos_sales
UNION ALL
SELECT 'POS Items:', COUNT(*) FROM pos_sale_items
UNION ALL
SELECT 'Product Sales:', COUNT(*) FROM product_sales
UNION ALL
SELECT 'Stock Movements:', COUNT(*) FROM stock_movements WHERE reference_type = 'pos_sale';



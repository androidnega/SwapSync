-- URGENT FIX: Make customer_id nullable in product_sales table
-- This allows walk-in customers without customer records in POS sales
-- 
-- To run this on Railway:
-- 1. Go to Railway dashboard
-- 2. Click on your PostgreSQL database
-- 3. Click "Connect" -> "Postgres"
-- 4. Run this SQL command:

ALTER TABLE product_sales ALTER COLUMN customer_id DROP NOT NULL;

-- Expected output: ALTER TABLE
-- This will allow NULL values in customer_id column

-- To verify it worked, run:
-- SELECT column_name, is_nullable FROM information_schema.columns 
-- WHERE table_name='product_sales' AND column_name='customer_id';
-- Expected: is_nullable = 'YES'


-- Make customer_id nullable in product_sales table
ALTER TABLE product_sales ALTER COLUMN customer_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name='product_sales' AND column_name='customer_id';


-- Check if Walk-In Customer exists
SELECT id, full_name, phone_number, email, created_at 
FROM customers 
WHERE full_name = 'Walk-In Customer' OR phone_number = '0000000000';


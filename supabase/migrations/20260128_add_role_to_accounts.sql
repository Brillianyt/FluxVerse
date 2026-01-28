-- Add role column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Comment: 'user' or 'admin'

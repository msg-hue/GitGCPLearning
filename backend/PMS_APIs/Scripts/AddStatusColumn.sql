-- Add status column to property table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'property' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE property ADD COLUMN status VARCHAR(50) DEFAULT 'Available';
    END IF;
END $$;


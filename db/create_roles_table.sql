-- Create roles table for Property Management System
-- This table stores role information for user permissions
-- Structure matches database.txt schema pattern

CREATE TABLE IF NOT EXISTS roles (
    roleid VARCHAR(10) PRIMARY KEY,
    rolename VARCHAR(100) NOT NULL,
    description TEXT,
    isactive BOOLEAN DEFAULT true,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default roles
INSERT INTO roles (roleid, rolename, description, isactive) VALUES
    ('1000', 'Admin', 'Administrator with full system access', true),
    ('1001', 'Manager', 'Manager with property management access', true),
    ('1002', 'User', 'Standard user with limited access', true),
    ('1003', 'Viewer', 'Read-only access', true)
ON CONFLICT (roleid) DO NOTHING;

-- Create index on rolename for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_rolename ON roles(rolename);

-- Add comment to table
COMMENT ON TABLE roles IS 'Stores role information for user permissions in the Property Management System';


# PowerShell script to dump PostgreSQL schema
$connectionString = "Host=ep-square-grass-a4rx8w2f-pooler.us-east-1.aws.neon.tech;Port=5432;Database=neondb;Username=neondb_owner;Password=npg_sUvuZSVno8p0;SSL Mode=Require;Trust Server Certificate=true"

# SQL query to get all table schemas
$query = @"
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"@

Write-Host "Connecting to database..."
Write-Host "Note: This requires psql or a PostgreSQL client to be installed."
Write-Host ""
Write-Host "Connection string:"
Write-Host $connectionString


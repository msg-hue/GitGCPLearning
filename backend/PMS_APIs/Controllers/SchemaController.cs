using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS_APIs.Data;
using System.Data;
using System.Text;
using Npgsql;

namespace PMS_APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SchemaController : ControllerBase
    {
        private readonly PmsDbContext _context;
        private readonly IConfiguration _configuration;

        public SchemaController(PmsDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("seed-properties")]
        public async Task<ActionResult> SeedProperties()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using var conn = new NpgsqlConnection(connectionString);
                await conn.OpenAsync();

                // Detect actual column names in property table
                var propertyCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (var colsCmd = conn.CreateCommand())
                {
                    colsCmd.CommandText = @"
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                        AND table_name = 'property'";
                    using var reader = await colsCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var name = Convert.ToString(reader[0]);
                        if (!string.IsNullOrEmpty(name)) propertyCols.Add(name);
                    }
                }

                // Resolve column names
                var colPropertyId = propertyCols.Contains("propertyid") ? "propertyid" : "property_id";
                var colProjectId = propertyCols.Contains("projectid") ? "projectid" : "project_id";
                var colPlotNo = propertyCols.Contains("plotno") ? "plotno" : (propertyCols.Contains("plot_no") ? "plot_no" : null);
                var colBlock = propertyCols.Contains("block") ? "block" : null;
                var colSize = propertyCols.Contains("size") ? "size" : null;
                var colPropertyType = propertyCols.Contains("propertytype") ? "propertytype" : (propertyCols.Contains("property_type") ? "property_type" : null);
                var colStatus = propertyCols.Contains("status") ? "status" : null;
                var colStreet = propertyCols.Contains("street") ? "street" : null;
                var colCreatedAt = propertyCols.Contains("createdat") ? "createdat" : (propertyCols.Contains("created_at") ? "created_at" : null);

                // Check if properties exist
                using (var checkCmd = conn.CreateCommand())
                {
                    var statusFilter = !string.IsNullOrEmpty(colStatus) ? $"WHERE {colStatus} = 'Available'" : "";
                    checkCmd.CommandText = $"SELECT COUNT(*) FROM property {statusFilter}";
                    var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                    
                    if (count >= 5)
                    {
                        return Ok(new { message = $"Found {count} available properties. No seeding needed.", count });
                    }
                }

                // Insert properties to reach 5 total
                var properties = new[]
                {
                    new { PropertyId = "PROP000001", ProjectId = "PROJ001", PlotNo = "A-101", Block = "A", Size = "5 Marla", PropertyType = "Residential", Status = "Available", Street = "Main Street" },
                    new { PropertyId = "PROP000002", ProjectId = "PROJ001", PlotNo = "A-102", Block = "A", Size = "10 Marla", PropertyType = "Residential", Status = "Available", Street = "Main Street" },
                    new { PropertyId = "PROP000003", ProjectId = "PROJ001", PlotNo = "B-201", Block = "B", Size = "5 Marla", PropertyType = "Residential", Status = "Available", Street = "Park Avenue" },
                    new { PropertyId = "PROP000004", ProjectId = "PROJ001", PlotNo = "B-202", Block = "B", Size = "1 Kanal", PropertyType = "Residential", Status = "Available", Street = "Park Avenue" },
                    new { PropertyId = "PROP000005", ProjectId = "PROJ001", PlotNo = "C-301", Block = "C", Size = "10 Marla", PropertyType = "Residential", Status = "Available", Street = "Garden Road" }
                };

                int inserted = 0;
                foreach (var prop in properties)
                {
                    using (var insertCmd = conn.CreateCommand())
                    {
                        // Build column list dynamically
                        var columns = new List<string> { colPropertyId };
                        var values = new List<string> { "@propertyid" };
                        var parameters = new List<NpgsqlParameter> { new NpgsqlParameter("@propertyid", prop.PropertyId) };

                        if (!string.IsNullOrEmpty(colProjectId))
                        {
                            columns.Add(colProjectId);
                            values.Add("@projectid");
                            parameters.Add(new NpgsqlParameter("@projectid", prop.ProjectId ?? (object)DBNull.Value));
                        }
                        if (!string.IsNullOrEmpty(colPlotNo))
                        {
                            columns.Add(colPlotNo);
                            values.Add("@plotno");
                            parameters.Add(new NpgsqlParameter("@plotno", prop.PlotNo ?? (object)DBNull.Value));
                        }
                        if (!string.IsNullOrEmpty(colBlock))
                        {
                            columns.Add(colBlock);
                            values.Add("@block");
                            parameters.Add(new NpgsqlParameter("@block", prop.Block ?? (object)DBNull.Value));
                        }
                        if (!string.IsNullOrEmpty(colSize))
                        {
                            columns.Add(colSize);
                            values.Add("@size");
                            parameters.Add(new NpgsqlParameter("@size", prop.Size ?? (object)DBNull.Value));
                        }
                        if (!string.IsNullOrEmpty(colPropertyType))
                        {
                            columns.Add(colPropertyType);
                            values.Add("@propertytype");
                            parameters.Add(new NpgsqlParameter("@propertytype", prop.PropertyType ?? (object)DBNull.Value));
                        }
                        if (!string.IsNullOrEmpty(colStatus))
                        {
                            columns.Add(colStatus);
                            values.Add("@status");
                            parameters.Add(new NpgsqlParameter("@status", prop.Status));
                        }
                        if (!string.IsNullOrEmpty(colStreet))
                        {
                            columns.Add(colStreet);
                            values.Add("@street");
                            parameters.Add(new NpgsqlParameter("@street", prop.Street ?? (object)DBNull.Value));
                        }
                        if (!string.IsNullOrEmpty(colCreatedAt))
                        {
                            columns.Add(colCreatedAt);
                            values.Add("CURRENT_TIMESTAMP");
                        }

                        insertCmd.CommandText = $@"
                            INSERT INTO property ({string.Join(", ", columns)})
                            VALUES ({string.Join(", ", values)})
                            ON CONFLICT ({colPropertyId}) DO NOTHING";
                        
                        foreach (var param in parameters)
                        {
                            insertCmd.Parameters.Add(param);
                        }
                        
                        var rowsAffected = await insertCmd.ExecuteNonQueryAsync();
                        if (rowsAffected > 0) inserted++;
                    }
                }

                // Get final count
                int finalCount = 0;
                using (var countCmd = conn.CreateCommand())
                {
                    var statusFilter = !string.IsNullOrEmpty(colStatus) ? $"WHERE {colStatus} = 'Available'" : "";
                    countCmd.CommandText = $"SELECT COUNT(*) FROM property {statusFilter}";
                    finalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
                }

                return Ok(new { message = $"Inserted {inserted} properties. Total available: {finalCount}", inserted, total = finalCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error seeding properties: {ex.Message}");
            }
        }

        [HttpGet("dump")]
        [Produces("text/plain")]
        public async Task<ActionResult> DumpSchema()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                var schema = await DumpSchemaAsync(connectionString!);
                return Content(schema, "text/plain");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error dumping schema: {ex.Message}");
            }
        }

        private async Task<string> DumpSchemaAsync(string connectionString)
        {
            var sb = new StringBuilder();
            sb.AppendLine("-- ===========================================================");
            sb.AppendLine("-- Property Management System - Neon Database Schema");
            sb.AppendLine($"-- Generated on: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine("-- Database: neondb (PostgreSQL on Neon)");
            sb.AppendLine("-- ===========================================================");
            sb.AppendLine();

            await using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync();

            // Get all tables
            var tablesQuery = @"
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            ";

            var tables = new List<string>();
            try
            {
                await using (var cmd = new NpgsqlCommand(tablesQuery, conn))
                await using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        tables.Add(reader.GetString(0));
                    }
                }
            }
            catch (Exception ex)
            {
                sb.AppendLine($"-- Error getting tables: {ex.Message}");
                return sb.ToString();
            }

            if (tables.Count == 0)
            {
                sb.AppendLine("-- No tables found in database");
                return sb.ToString();
            }

            // For each table, get its structure
            foreach (var tableName in tables)
            {
                sb.AppendLine($"CREATE TABLE {tableName} (");

                var columnsQuery = @"
                    SELECT 
                        c.column_name,
                        c.data_type,
                        c.character_maximum_length,
                        c.numeric_precision,
                        c.numeric_scale,
                        c.is_nullable,
                        c.column_default,
                        c.ordinal_position
                    FROM information_schema.columns c
                    WHERE c.table_name = @tableName
                    AND c.table_schema = 'public'
                    ORDER BY c.ordinal_position;
                ";

                var columns = new List<string>();
                await using (var cmd = new NpgsqlCommand(columnsQuery, conn))
                {
                    cmd.Parameters.AddWithValue("tableName", tableName);
                    await using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var colName = reader.GetString(0);
                            var dataType = reader.GetString(1);
                            
                            int? maxLength = null;
                            if (!reader.IsDBNull(2))
                            {
                                var val = reader.GetValue(2);
                                if (val is int i) maxLength = i;
                                else if (int.TryParse(val?.ToString(), out var parsed)) maxLength = parsed;
                            }
                            
                            int? precision = null;
                            if (!reader.IsDBNull(4))
                            {
                                var val = reader.GetValue(4);
                                if (val is int i) precision = i;
                                else if (int.TryParse(val?.ToString(), out var parsed)) precision = parsed;
                            }
                            
                            int? scale = null;
                            if (!reader.IsDBNull(5))
                            {
                                var val = reader.GetValue(5);
                                if (val is int i) scale = i;
                                else if (int.TryParse(val?.ToString(), out var parsed)) scale = parsed;
                            }
                            
                            var isNullable = reader.GetString(6) == "YES";
                            var defaultValue = reader.IsDBNull(7) ? null : reader.GetString(7);

                            var colDef = $"    {colName,-20} ";

                            // Map PostgreSQL types to SQL types
                            string sqlType;
                            switch (dataType.ToLower())
                            {
                                case "character varying":
                                case "varchar":
                                    sqlType = maxLength.HasValue ? $"VARCHAR({maxLength.Value})" : "VARCHAR";
                                    break;
                                case "character":
                                case "char":
                                    sqlType = maxLength.HasValue ? $"CHAR({maxLength.Value})" : "CHAR";
                                    break;
                                case "numeric":
                                    if (precision.HasValue && scale.HasValue)
                                        sqlType = $"NUMERIC({precision.Value},{scale.Value})";
                                    else if (precision.HasValue)
                                        sqlType = $"NUMERIC({precision.Value})";
                                    else
                                        sqlType = "NUMERIC";
                                    break;
                                case "integer":
                                    sqlType = "INTEGER";
                                    break;
                                case "bigint":
                                    sqlType = "BIGINT";
                                    break;
                                case "boolean":
                                    sqlType = "BOOLEAN";
                                    break;
                                case "timestamp without time zone":
                                case "timestamp":
                                    sqlType = "TIMESTAMP";
                                    break;
                                case "date":
                                    sqlType = "DATE";
                                    break;
                                case "text":
                                    sqlType = "TEXT";
                                    break;
                                case "serial":
                                    sqlType = "SERIAL";
                                    break;
                                default:
                                    sqlType = dataType.ToUpper();
                                    break;
                            }

                            colDef += sqlType;

                            if (!isNullable && !colName.EndsWith("id") && dataType != "serial")
                            {
                                colDef += " NOT NULL";
                            }

                            if (!string.IsNullOrEmpty(defaultValue))
                            {
                                // Clean up default values
                                var cleanDefault = defaultValue.Trim();
                                if (cleanDefault.StartsWith("nextval("))
                                {
                                    // Skip serial defaults
                                }
                                else if (cleanDefault.Contains("::"))
                                {
                                    cleanDefault = cleanDefault.Split("::")[0].Trim();
                                }
                                // Remove quotes if present
                                if (cleanDefault.StartsWith("'") && cleanDefault.EndsWith("'"))
                                {
                                    cleanDefault = cleanDefault.Substring(1, cleanDefault.Length - 2);
                                }
                                colDef += $" DEFAULT {cleanDefault}";
                            }

                            columns.Add(colDef);
                        }
                    }
                }

                // Get primary keys
                var pkQuery = @"
                    SELECT column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage ku
                        ON tc.constraint_name = ku.constraint_name
                    WHERE tc.table_name = @tableName
                    AND tc.constraint_type = 'PRIMARY KEY'
                    ORDER BY ku.ordinal_position;
                ";

                var primaryKeys = new List<string>();
                await using (var pkCmd = new NpgsqlCommand(pkQuery, conn))
                {
                    pkCmd.Parameters.AddWithValue("tableName", tableName);
                    await using (var reader = await pkCmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            primaryKeys.Add(reader.GetString(0));
                        }
                    }
                }

                if (primaryKeys.Count > 0)
                {
                    if (primaryKeys.Count == 1)
                    {
                        // Find the column and mark it as PRIMARY KEY
                        for (int i = 0; i < columns.Count; i++)
                        {
                            if (columns[i].TrimStart().StartsWith(primaryKeys[0]))
                            {
                                columns[i] = columns[i].TrimEnd() + " PRIMARY KEY";
                                break;
                            }
                        }
                    }
                    else
                    {
                        columns.Add($"    PRIMARY KEY ({string.Join(", ", primaryKeys)})");
                    }
                }

                // Get foreign keys
                var fkQuery = @"
                    SELECT 
                        ku.column_name,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS ku
                        ON tc.constraint_name = ku.constraint_name
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND ku.table_name = @tableName;
                ";

                await using (var fkCmd = new NpgsqlCommand(fkQuery, conn))
                {
                    fkCmd.Parameters.AddWithValue("tableName", tableName);
                    await using (var reader = await fkCmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var colName = reader.GetString(0);
                            var refTable = reader.GetString(1);
                            var refCol = reader.GetString(2);
                            
                            // Find the column and add REFERENCES
                            for (int i = 0; i < columns.Count; i++)
                            {
                                if (columns[i].TrimStart().StartsWith(colName))
                                {
                                    columns[i] = columns[i].TrimEnd() + $" REFERENCES {refTable}({refCol})";
                                    break;
                                }
                            }
                        }
                    }
                }

                sb.AppendLine(string.Join(",\n", columns));
                sb.AppendLine(");");
                sb.AppendLine();

                // Get indexes
                var indexQuery = @"
                    SELECT 
                        i.indexname,
                        i.indexdef
                    FROM pg_indexes i
                    WHERE i.schemaname = 'public'
                    AND i.tablename = @tableName
                    AND i.indexname NOT LIKE '%_pkey'
                    ORDER BY i.indexname;
                ";

                var indexes = new List<string>();
                await using (var idxCmd = new NpgsqlCommand(indexQuery, conn))
                {
                    idxCmd.Parameters.AddWithValue("tableName", tableName);
                    await using (var reader = await idxCmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var idxName = reader.GetString(0);
                            var idxDef = reader.GetString(1);
                            // Extract just the CREATE INDEX statement
                            if (idxDef.Contains("CREATE"))
                            {
                                indexes.Add($"-- {idxDef}");
                            }
                            else
                            {
                                indexes.Add($"CREATE INDEX IF NOT EXISTS {idxName} ON {tableName} ({idxDef});");
                            }
                        }
                    }
                }

                if (indexes.Count > 0)
                {
                    sb.AppendLine("-- Indexes");
                    foreach (var idx in indexes)
                    {
                        sb.AppendLine(idx);
                    }
                    sb.AppendLine();
                }

                // Get unique constraints (excluding primary keys)
                var uniqueQuery = @"
                    SELECT 
                        tc.constraint_name,
                        string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as constraint_columns
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage ku
                        ON tc.constraint_name = ku.constraint_name
                    WHERE tc.table_name = @tableName
                    AND tc.constraint_type = 'UNIQUE'
                    AND tc.constraint_name NOT LIKE '%_pkey'
                    GROUP BY tc.constraint_name;
                ";

                await using (var uniqueCmd = new NpgsqlCommand(uniqueQuery, conn))
                {
                    uniqueCmd.Parameters.AddWithValue("tableName", tableName);
                    await using (var reader = await uniqueCmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var constraintName = reader.GetString(0);
                            var constraintColumns = reader.GetString(1);
                            sb.AppendLine($"ALTER TABLE {tableName} ADD CONSTRAINT {constraintName} UNIQUE ({constraintColumns});");
                        }
                    }
                }

                // Get check constraints
                var checkQuery = @"
                    SELECT 
                        tc.constraint_name,
                        cc.check_clause
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.check_constraints cc
                        ON tc.constraint_name = cc.constraint_name
                    WHERE tc.table_name = @tableName
                    AND tc.constraint_type = 'CHECK';
                ";

                await using (var checkCmd = new NpgsqlCommand(checkQuery, conn))
                {
                    checkCmd.Parameters.AddWithValue("tableName", tableName);
                    await using (var reader = await checkCmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var constraintName = reader.GetString(0);
                            var checkClause = reader.GetString(1);
                            sb.AppendLine($"ALTER TABLE {tableName} ADD CONSTRAINT {constraintName} CHECK ({checkClause});");
                        }
                    }
                }

                if (indexes.Count > 0 || await HasConstraints(conn, tableName))
                {
                    sb.AppendLine();
                }
            }

            return sb.ToString();
        }

        private async Task<bool> HasConstraints(NpgsqlConnection conn, string tableName)
        {
            var query = @"
                SELECT COUNT(*)
                FROM information_schema.table_constraints
                WHERE table_name = @tableName
                AND constraint_type IN ('UNIQUE', 'CHECK')
                AND constraint_name NOT LIKE '%_pkey';
            ";
            await using var cmd = new NpgsqlCommand(query, conn);
            cmd.Parameters.AddWithValue("tableName", tableName);
            var count = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(count) > 0;
        }
    }
}


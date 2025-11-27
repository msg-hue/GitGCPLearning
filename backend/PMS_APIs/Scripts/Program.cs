using System;
using System.Data;
using System.Text;
using Npgsql;

namespace SchemaDump
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var connectionString = "Host=ep-square-grass-a4rx8w2f-pooler.us-east-1.aws.neon.tech;Port=5432;Database=neondb;Username=neondb_owner;Password=npg_sUvuZSVno8p0;SSL Mode=Require;Trust Server Certificate=true";
            
            var outputPath = args.Length > 0 ? args[0] : "../../../db/database.txt";

            Console.WriteLine("Connecting to database...");
            var schema = await DumpSchemaAsync(connectionString);
            
            Console.WriteLine($"Writing schema to: {outputPath}");
            await File.WriteAllTextAsync(outputPath, schema);
            
            Console.WriteLine("Schema dump completed!");
        }

        static async Task<string> DumpSchemaAsync(string connectionString)
        {
            var sb = new StringBuilder();
            sb.AppendLine("connection string:");
            sb.AppendLine("psql 'postgresql://neondb_owner:npg_sUvuZSVno8p0@ep-square-grass-a4rx8w2f-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'");
            sb.AppendLine();
            sb.AppendLine("-- ===========================================================");
            sb.AppendLine($"-- Neon schema snapshot (queried via SchemaDump on {DateTime.Now:yyyy-MM-dd})");
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
                AND table_name NOT LIKE '__%'
                ORDER BY table_name;
            ";

            var tables = new List<string>();
            await using (var cmd = new NpgsqlCommand(tablesQuery, conn))
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tables.Add(reader.GetString(0));
                }
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
                            var maxLength = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2);
                            var precision = reader.IsDBNull(4) ? (int?)null : reader.GetInt32(4);
                            var scale = reader.IsDBNull(5) ? (int?)null : reader.GetInt32(5);
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
                                var cleanDefault = defaultValue;
                                if (cleanDefault.StartsWith("nextval("))
                                {
                                    // Skip serial defaults
                                }
                                else if (cleanDefault.Contains("::"))
                                {
                                    cleanDefault = cleanDefault.Split("::")[0].Trim();
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

                var foreignKeys = new List<string>();
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
            }

            return sb.ToString();
        }
    }
}


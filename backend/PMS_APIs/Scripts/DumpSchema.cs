using System;
using System.Data;
using System.Text;
using Npgsql;

namespace PMS_APIs.Scripts
{
    public class SchemaDumper
    {
        public static async Task<string> DumpSchemaAsync(string connectionString)
        {
            var sb = new StringBuilder();
            sb.AppendLine("connection string:");
            sb.AppendLine($"psql 'postgresql://neondb_owner:npg_sUvuZSVno8p0@ep-square-grass-a4rx8w2f-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'");
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
                        column_name,
                        data_type,
                        character_maximum_length,
                        numeric_precision,
                        numeric_scale,
                        is_nullable,
                        column_default,
                        CASE 
                            WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
                            WHEN fk.column_name IS NOT NULL THEN 'REFERENCES ' || fk.foreign_table_name || '(' || fk.foreign_column_name || ')'
                            ELSE ''
                        END as constraints
                    FROM information_schema.columns c
                    LEFT JOIN (
                        SELECT ku.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage ku
                            ON tc.constraint_name = ku.constraint_name
                        WHERE tc.constraint_type = 'PRIMARY KEY'
                        AND ku.table_name = @tableName
                    ) pk ON c.column_name = pk.column_name
                    LEFT JOIN (
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
                        AND ku.table_name = @tableName
                    ) fk ON c.column_name = fk.column_name
                    WHERE c.table_name = @tableName
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
                            var constraints = reader.IsDBNull(8) ? null : reader.GetString(8);

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

                            if (!string.IsNullOrEmpty(constraints))
                            {
                                colDef += $" {constraints}";
                            }
                            else if (!isNullable && string.IsNullOrEmpty(constraints))
                            {
                                colDef += " NOT NULL";
                            }

                            if (!string.IsNullOrEmpty(defaultValue))
                            {
                                colDef += $" DEFAULT {defaultValue}";
                            }

                            columns.Add(colDef);
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


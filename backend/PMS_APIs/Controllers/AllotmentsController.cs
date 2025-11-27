using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS_APIs.Data;
using PMS_APIs.Models;
using System.Data;
using Npgsql;

namespace PMS_APIs.Controllers
{
    /// <summary>
    /// API Controller for managing allotments in the Property Management System
    /// Provides CRUD operations for allotment data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AllotmentsController : ControllerBase
    {
        private readonly PmsDbContext _context;

        public AllotmentsController(PmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all allotments with optional filtering and pagination
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 10)</param>
        /// <param name="customerId">Filter by customer ID</param>
        /// <param name="status">Filter by allotment status</param>
        /// <returns>List of allotments</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Allotment>>> GetAllotments(
            int page = 1,
            int pageSize = 10,
            string? customerId = null,
            string? status = null)
        {
            var query = _context.Allotments
                .Include(a => a.Customer)
                .Include(a => a.Property)
                .AsQueryable();

            if (!string.IsNullOrEmpty(customerId))
            {
                query = query.Where(a => a.CustomerId == customerId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            var totalCount = await query.CountAsync();
            var allotments = await query
                .OrderByDescending(a => a.AllotmentDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                data = allotments,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Get a specific allotment by ID
        /// </summary>
        /// <param name="id">Allotment ID</param>
        /// <returns>Allotment details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Allotment>> GetAllotment(string id)
        {
            var allotment = await _context.Allotments
                .Include(a => a.Customer)
                .Include(a => a.Property)
                .FirstOrDefaultAsync(a => a.AllotmentId == id);

            if (allotment == null)
            {
                return NotFound(new { message = "Allotment not found" });
            }

            return Ok(allotment);
        }

        /// <summary>
        /// Search customer by ID and check if un-allotted
        /// </summary>
        /// <param name="customerId">Customer ID to search</param>
        /// <returns>Customer details and allotment status</returns>
        [HttpGet("search-customer/{customerId}")]
        public async Task<ActionResult> SearchCustomer(string customerId)
        {
            try
            {
                // Use raw SQL to ensure we get actual data from database
                var conn = _context.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open)
                {
                    await conn.OpenAsync();
                }

                // Detect actual column names in customers table
                var customerCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (var colsCmd = conn.CreateCommand())
                {
                    colsCmd.CommandText = @"
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                        AND table_name = 'customers'";
                    using var reader = await colsCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var name = Convert.ToString(reader[0]);
                        if (!string.IsNullOrEmpty(name)) customerCols.Add(name);
                    }
                }

                // Resolve column names
                var colCustomerId = customerCols.Contains("customerid") ? "customerid" : "customer_id";
                var colFullName = customerCols.Contains("fullname") ? "fullname" : (customerCols.Contains("full_name") ? "full_name" : null);
                var colPhone = customerCols.Contains("phone") ? "phone" : null;
                var colEmail = customerCols.Contains("email") ? "email" : null;
                var colCnic = customerCols.Contains("cnic") ? "cnic" : null;

                // Fetch customer data using raw SQL
                string? fetchedCustomerId = null;
                string? fetchedFullName = null;
                string? fetchedPhone = null;
                string? fetchedEmail = null;
                string? fetchedCnic = null;
                
                using (var customerCmd = conn.CreateCommand())
                {
                    customerCmd.CommandText = $@"
                        SELECT 
                            {colCustomerId} AS customer_id,
                            {(colFullName != null ? colFullName : "NULL")} AS full_name,
                            {(colPhone != null ? colPhone : "NULL")} AS phone,
                            {(colEmail != null ? colEmail : "NULL")} AS email,
                            {(colCnic != null ? colCnic : "NULL")} AS cnic
                        FROM customers
                        WHERE {colCustomerId} = @customerId
                        LIMIT 1";
                    var param = new NpgsqlParameter("@customerId", customerId);
                    customerCmd.Parameters.Add(param);
                    using var reader = await customerCmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        fetchedCustomerId = reader.IsDBNull(0) ? null : Convert.ToString(reader[0]);
                        fetchedFullName = reader.IsDBNull(1) ? null : Convert.ToString(reader[1]);
                        fetchedPhone = reader.IsDBNull(2) ? null : Convert.ToString(reader[2]);
                        fetchedEmail = reader.IsDBNull(3) ? null : Convert.ToString(reader[3]);
                        fetchedCnic = reader.IsDBNull(4) ? null : Convert.ToString(reader[4]);
                    }
                }

                if (string.IsNullOrEmpty(fetchedCustomerId))
                {
                    return NotFound(new { message = "Customer not found", isUnAllotted = false });
                }

                // Detect actual table and column names
                bool hasAllotmentsTable = false;
                string allotmentTableName = "allotment";
                string allotmentCustomerIdCol = "customerid";
                string? allotmentStatusCol = "status"; // Will be set to null if column doesn't exist
                string allotmentIdCol = "allotmentid";
                string allotmentPropertyIdCol = "propertyid";
                string allotmentDateCol = "allotmentdate";

                // Check if allotment or allotments table exists
                using (var checkTableCmd = conn.CreateCommand())
                {
                    checkTableCmd.CommandText = @"
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = current_schema() 
                        AND table_name IN ('allotment', 'allotments')";
                    using var reader = await checkTableCmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        hasAllotmentsTable = true;
                        allotmentTableName = reader.GetString(0);
                    }
                }

                // Detect column names for allotment table
                var allotmentCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                if (hasAllotmentsTable)
                {
                    using (var colsCmd = conn.CreateCommand())
                    {
                        // First, get ALL columns from the allotment table
                        colsCmd.CommandText = $@"
                            SELECT column_name
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                            AND table_name = '{allotmentTableName}'";
                        using var reader = await colsCmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            var name = Convert.ToString(reader[0]);
                            if (!string.IsNullOrEmpty(name)) allotmentCols.Add(name);
                        }
                    }

                    // Resolve actual column names - check what exists
                    if (allotmentCols.Contains("customer_id"))
                        allotmentCustomerIdCol = "customer_id";
                    else if (allotmentCols.Contains("customerid"))
                        allotmentCustomerIdCol = "customerid";
                    
                    if (allotmentCols.Contains("allotment_id"))
                        allotmentIdCol = "allotment_id";
                    else if (allotmentCols.Contains("allotmentid"))
                        allotmentIdCol = "allotmentid";
                    
                    if (allotmentCols.Contains("property_id"))
                        allotmentPropertyIdCol = "property_id";
                    else if (allotmentCols.Contains("propertyid"))
                        allotmentPropertyIdCol = "propertyid";
                    
                    if (allotmentCols.Contains("allotment_date"))
                        allotmentDateCol = "allotment_date";
                    else if (allotmentCols.Contains("allotmentdate"))
                        allotmentDateCol = "allotmentdate";
                    
                    // Check if status column exists - only set if it actually exists
                    if (allotmentCols.Contains("status"))
                    {
                        allotmentStatusCol = "status";
                    }
                    else
                    {
                        allotmentStatusCol = null; // No status column, will query without status filter
                    }
                }

                // Check for existing active allotment using raw SQL
                object? existingAllotment = null;
                if (hasAllotmentsTable)
                {
                    using (var allotCmd = conn.CreateCommand())
                    {
                        // Build WHERE clause - only include status filter if status column exists
                        var whereClause = $"{allotmentCustomerIdCol} = @customerId";
                        
                        // Only add status filter if the column was detected
                        if (!string.IsNullOrEmpty(allotmentStatusCol) && allotmentCols.Contains("status"))
                        {
                            whereClause += $" AND {allotmentStatusCol} = 'Active'";
                        }
                        
                        allotCmd.CommandText = $@"
                            SELECT {allotmentIdCol}, {allotmentPropertyIdCol}, {allotmentDateCol}
                            FROM {allotmentTableName}
                            WHERE {whereClause}
                            LIMIT 1";
                        var allotParam = new NpgsqlParameter("@customerId", customerId);
                        allotCmd.Parameters.Add(allotParam);
                        using var reader = await allotCmd.ExecuteReaderAsync();
                        if (await reader.ReadAsync())
                        {
                            existingAllotment = new
                            {
                                AllotmentId = reader.IsDBNull(0) ? null : reader.GetString(0),
                                PropertyId = reader.IsDBNull(1) ? null : reader.GetString(1),
                                AllotmentDate = reader.IsDBNull(2) ? null : (DateTime?)reader.GetDateTime(2)
                            };
                        }
                    }
                }

                var isUnAllotted = existingAllotment == null;

                return Ok(new
                {
                    customer = new
                    {
                        CustomerId = fetchedCustomerId,
                        FullName = fetchedFullName,
                        Phone = fetchedPhone,
                        Email = fetchedEmail,
                        Cnic = fetchedCnic
                    },
                    isUnAllotted,
                    existingAllotment,
                    message = isUnAllotted ? "Customer is available for allotment" : "Customer already has an active allotment"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error searching customer", error = ex.Message });
            }
        }

        /// <summary>
        /// Get available (un-allotted) properties
        /// </summary>
        /// <param name="projectId">Optional filter by project ID</param>
        /// <returns>List of available properties</returns>
        [HttpGet("available-properties")]
        public async Task<ActionResult> GetAvailableProperties(string? projectId = null)
        {
            var query = _context.Properties
                .Where(p => p.Status == "Available")
                .AsQueryable();

            if (!string.IsNullOrEmpty(projectId))
            {
                query = query.Where(p => p.ProjectId == projectId);
            }

            var properties = await query
                .OrderBy(p => p.PropertyId)
                .ToListAsync();

            // Get project names separately
            var projectIds = properties.Select(p => p.ProjectId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            var projects = await _context.Projects
                .Where(pr => projectIds.Contains(pr.ProjectId))
                .ToDictionaryAsync(pr => pr.ProjectId, pr => pr.ProjectName);

            var result = properties.Select(p => new
            {
                p.PropertyId,
                PropertyName = p.PlotNo ?? p.PropertyId,
                p.ProjectId,
                ProjectName = !string.IsNullOrEmpty(p.ProjectId) && projects.ContainsKey(p.ProjectId) ? projects[p.ProjectId] : null,
                p.Size,
                Price = (decimal?)null, // Price field doesn't exist in Property model
                Location = p.Street ?? string.Empty,
                p.Status
            }).ToList();

            return Ok(new
            {
                data = result,
                count = result.Count
            });
        }

        /// <summary>
        /// Create a new allotment
        /// </summary>
        /// <param name="allotment">Allotment data</param>
        /// <returns>Created allotment</returns>
        [HttpPost]
        public async Task<ActionResult<Allotment>> PostAllotment(Allotment allotment)
        {
            try
            {
                // Validate customer exists
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == allotment.CustomerId);
                if (customer == null)
                {
                    return BadRequest(new { message = "Customer not found" });
                }

                // Use raw SQL to check for existing allotment to avoid column name issues
                var conn = _context.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open)
                {
                    await conn.OpenAsync();
                }

                // Detect allotment table and column names
                bool hasAllotmentsTable = false;
                string allotmentTableName = "allotment";
                string allotmentCustomerIdCol = "customerid";
                string? allotmentStatusCol = null;
                string allotmentIdCol = "allotmentid";

                // Check if allotment or allotments table exists
                using (var checkTableCmd = conn.CreateCommand())
                {
                    checkTableCmd.CommandText = @"
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = current_schema() 
                        AND table_name IN ('allotment', 'allotments')";
                    using var reader = await checkTableCmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        hasAllotmentsTable = true;
                        allotmentTableName = reader.GetString(0);
                    }
                }

                // Check for existing active allotment using raw SQL
                bool hasExistingAllotment = false;
                if (hasAllotmentsTable)
                {
                    // Detect column names
                    var allotmentCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    using (var colsCmd = conn.CreateCommand())
                    {
                        colsCmd.CommandText = $@"
                            SELECT column_name
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                            AND table_name = '{allotmentTableName}'
                            AND column_name IN (
                                'customer_id', 'customerid',
                                'allotment_id', 'allotmentid',
                                'status'
                            )";
                        using var reader = await colsCmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            var name = Convert.ToString(reader[0]);
                            if (!string.IsNullOrEmpty(name)) allotmentCols.Add(name);
                        }
                    }

                    allotmentCustomerIdCol = allotmentCols.Contains("customer_id") ? "customer_id" : "customerid";
                    allotmentIdCol = allotmentCols.Contains("allotment_id") ? "allotment_id" : "allotmentid";
                    allotmentStatusCol = allotmentCols.Contains("status") ? "status" : null;

                    // Check for existing active allotment
                    using (var checkCmd = conn.CreateCommand())
                    {
                        var whereClause = $"{allotmentCustomerIdCol} = @customerId";
                        if (!string.IsNullOrEmpty(allotmentStatusCol))
                        {
                            whereClause += $" AND {allotmentStatusCol} = 'Active'";
                        }
                        checkCmd.CommandText = $@"
                            SELECT COUNT(*) 
                            FROM {allotmentTableName}
                            WHERE {whereClause}";
                        var param = new NpgsqlParameter("@customerId", allotment.CustomerId);
                        checkCmd.Parameters.Add(param);
                        var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                        hasExistingAllotment = count > 0;
                    }
                }

                if (hasExistingAllotment)
                {
                    return BadRequest(new { message = "Customer already has an active allotment. Only one property per customer is allowed." });
                }

                // Validate property exists and is available
                var property = await _context.Properties.FindAsync(allotment.PropertyId);
                if (property == null)
                {
                    return BadRequest(new { message = "Property not found" });
                }

                if (property.Status != "Available")
                {
                    return BadRequest(new { message = "Property is not available for allotment" });
                }

                // Generate allotment ID if not provided
                if (string.IsNullOrEmpty(allotment.AllotmentId))
                {
                    allotment.AllotmentId = await GenerateAllotmentId();
                }

                // Don't set CreatedAt here - it will be handled in raw SQL
                allotment.AllotmentDate = allotment.AllotmentDate ?? DateTime.UtcNow;
                // Status will be set in raw SQL insert, don't set it here to avoid EF Core tracking issues

                // Use raw SQL to insert allotment to avoid column name issues
                if (hasAllotmentsTable)
                {
                    // Detect all column names for insert
                    var insertCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    using (var colsCmd = conn.CreateCommand())
                    {
                        colsCmd.CommandText = $@"
                            SELECT column_name
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                            AND table_name = '{allotmentTableName}'";
                        using var reader = await colsCmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            var name = Convert.ToString(reader[0]);
                            if (!string.IsNullOrEmpty(name)) insertCols.Add(name);
                        }
                    }

                    // Build insert statement dynamically
                    var columns = new List<string>();
                    var values = new List<string>();
                    var parameters = new List<NpgsqlParameter>();

                    if (insertCols.Contains(allotmentIdCol))
                    {
                        columns.Add(allotmentIdCol);
                        values.Add($"@{allotmentIdCol}");
                        parameters.Add(new NpgsqlParameter($"@{allotmentIdCol}", allotment.AllotmentId));
                    }

                    if (insertCols.Contains(allotmentCustomerIdCol))
                    {
                        columns.Add(allotmentCustomerIdCol);
                        values.Add($"@{allotmentCustomerIdCol}");
                        parameters.Add(new NpgsqlParameter($"@{allotmentCustomerIdCol}", allotment.CustomerId ?? (object)DBNull.Value));
                    }

                    var colPropertyId = insertCols.Contains("property_id") ? "property_id" : "propertyid";
                    if (insertCols.Contains(colPropertyId))
                    {
                        columns.Add(colPropertyId);
                        values.Add($"@{colPropertyId}");
                        parameters.Add(new NpgsqlParameter($"@{colPropertyId}", allotment.PropertyId ?? (object)DBNull.Value));
                    }

                    var colAllotmentDate = insertCols.Contains("allotment_date") ? "allotment_date" : "allotmentdate";
                    if (insertCols.Contains(colAllotmentDate))
                    {
                        columns.Add(colAllotmentDate);
                        values.Add($"@{colAllotmentDate}");
                        parameters.Add(new NpgsqlParameter($"@{colAllotmentDate}", allotment.AllotmentDate ?? (object)DBNull.Value));
                    }

                    // Only include status if the column exists and we have a status value
                    if (!string.IsNullOrEmpty(allotmentStatusCol) && insertCols.Contains(allotmentStatusCol))
                    {
                        columns.Add(allotmentStatusCol);
                        values.Add($"@{allotmentStatusCol}");
                        // Use "Active" as default status if not set
                        var statusValue = !string.IsNullOrEmpty(allotment.Status) ? allotment.Status : "Active";
                        parameters.Add(new NpgsqlParameter($"@{allotmentStatusCol}", statusValue));
                    }

                    var colCreatedAt = insertCols.Contains("created_at") ? "created_at" : "createdat";
                    if (insertCols.Contains(colCreatedAt))
                    {
                        columns.Add(colCreatedAt);
                        values.Add("CURRENT_TIMESTAMP");
                    }

                    // Only include allotment_letter_no if the column exists
                    var colAllotmentLetterNo = insertCols.Contains("allotment_letter_no") ? "allotment_letter_no" : 
                                               (insertCols.Contains("allotmentletterno") ? "allotmentletterno" : null);
                    if (!string.IsNullOrEmpty(colAllotmentLetterNo) && !string.IsNullOrEmpty(allotment.AllotmentLetterNo))
                    {
                        columns.Add(colAllotmentLetterNo);
                        values.Add($"@{colAllotmentLetterNo}");
                        parameters.Add(new NpgsqlParameter($"@{colAllotmentLetterNo}", allotment.AllotmentLetterNo));
                    }

                    using (var insertCmd = conn.CreateCommand())
                    {
                        insertCmd.CommandText = $@"
                            INSERT INTO {allotmentTableName} ({string.Join(", ", columns)})
                            VALUES ({string.Join(", ", values)})";
                        foreach (var param in parameters)
                        {
                            insertCmd.Parameters.Add(param);
                        }
                        await insertCmd.ExecuteNonQueryAsync();
                    }

                    // Update property status to Allotted using raw SQL
                    var propCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    using (var propColsCmd = conn.CreateCommand())
                    {
                        propColsCmd.CommandText = @"
                            SELECT column_name
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                            AND table_name = 'property'";
                        using var reader = await propColsCmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            var name = Convert.ToString(reader[0]);
                            if (!string.IsNullOrEmpty(name)) propCols.Add(name);
                        }
                    }

                    var propIdCol = propCols.Contains("propertyid") ? "propertyid" : "property_id";
                    var propStatusCol = propCols.Contains("status") ? "status" : null;
                    
                    if (!string.IsNullOrEmpty(propStatusCol))
                    {
                        using (var updatePropCmd = conn.CreateCommand())
                        {
                            updatePropCmd.CommandText = $@"
                                UPDATE property 
                                SET {propStatusCol} = 'Allotted'
                                WHERE {propIdCol} = @propertyId";
                            var propParam = new NpgsqlParameter("@propertyId", allotment.PropertyId);
                            updatePropCmd.Parameters.Add(propParam);
                            await updatePropCmd.ExecuteNonQueryAsync();
                        }
                    }
                }
                else
                {
                    // Fallback to EF Core if table doesn't exist (shouldn't happen)
                    _context.Allotments.Add(allotment);
                    property.Status = "Allotted";
                    await _context.SaveChangesAsync();
                }

                // Return success response
                return Ok(new
                {
                    message = "Allotment created successfully",
                    allotmentId = allotment.AllotmentId,
                    customerId = allotment.CustomerId,
                    propertyId = allotment.PropertyId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating allotment", error = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing allotment
        /// </summary>
        /// <param name="id">Allotment ID</param>
        /// <param name="allotment">Updated allotment data</param>
        /// <returns>Updated allotment</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAllotment(string id, Allotment allotment)
        {
            if (id != allotment.AllotmentId)
            {
                return BadRequest(new { message = "Allotment ID mismatch" });
            }

            var existingAllotment = await _context.Allotments.FindAsync(id);
            if (existingAllotment == null)
            {
                return NotFound(new { message = "Allotment not found" });
            }

            // Update properties
            existingAllotment.AllotmentDate = allotment.AllotmentDate;
            existingAllotment.AllotmentLetterNo = allotment.AllotmentLetterNo;
            existingAllotment.Status = allotment.Status;
            existingAllotment.Remarks = allotment.Remarks;
            existingAllotment.PossessionDate = allotment.PossessionDate;
            existingAllotment.CompletionDate = allotment.CompletionDate;
            existingAllotment.BallotingDate = allotment.BallotingDate;
            existingAllotment.BallotNo = allotment.BallotNo;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(existingAllotment);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AllotmentExists(id))
                {
                    return NotFound(new { message = "Allotment not found" });
                }
                throw;
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error updating allotment", error = ex.Message });
            }
        }

        /// <summary>
        /// Cancel an allotment
        /// </summary>
        /// <param name="id">Allotment ID</param>
        /// <param name="reason">Cancellation reason</param>
        /// <returns>Success message</returns>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelAllotment(string id, [FromBody] CancellationRequest request)
        {
            var allotment = await _context.Allotments
                .Include(a => a.Property)
                .FirstOrDefaultAsync(a => a.AllotmentId == id);

            if (allotment == null)
            {
                return NotFound(new { message = "Allotment not found" });
            }

            if (allotment.Status == "Cancelled")
            {
                return BadRequest(new { message = "Allotment is already cancelled" });
            }

            // Update allotment status
            allotment.Status = "Cancelled";
            allotment.Remarks = request.Reason;

            // Make property available again
            if (allotment.Property != null)
            {
                allotment.Property.Status = "Available";
                allotment.Property.UpdatedAt = DateTime.UtcNow;
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Allotment cancelled successfully" });
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error cancelling allotment", error = ex.Message });
            }
        }

        /// <summary>
        /// Get allotment statistics
        /// </summary>
        /// <returns>Allotment statistics</returns>
        [HttpGet("statistics")]
        public async Task<ActionResult> GetAllotmentStatistics()
        {
            var totalAllotments = await _context.Allotments.CountAsync();
            var activeAllotments = await _context.Allotments.CountAsync(a => a.Status == "Active");
            var cancelledAllotments = await _context.Allotments.CountAsync(a => a.Status == "Cancelled");
            var completedAllotments = await _context.Allotments.CountAsync(a => a.Status == "Completed");

            var monthlyAllotments = await _context.Allotments
                .Where(a => a.AllotmentDate.HasValue)
                .GroupBy(a => new { a.AllotmentDate!.Value.Year, a.AllotmentDate!.Value.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Year)
                .ThenByDescending(x => x.Month)
                .Take(12)
                .ToListAsync();

            return Ok(new
            {
                totalAllotments,
                activeAllotments,
                cancelledAllotments,
                completedAllotments,
                monthlyAllotments
            });
        }

        private bool AllotmentExists(string id)
        {
            return _context.Allotments.Any(e => e.AllotmentId == id);
        }

        private async Task<string> GenerateAllotmentId()
        {
            var lastAllotment = await _context.Allotments
                .OrderByDescending(a => a.AllotmentId)
                .FirstOrDefaultAsync();

            if (lastAllotment == null)
            {
                return "ALL0000001";
            }

            var lastIdNumber = int.Parse(lastAllotment.AllotmentId.Substring(3));
            var newIdNumber = lastIdNumber + 1;
            return $"ALL{newIdNumber:D7}";
        }
    }

    /// <summary>
    /// Request model for allotment cancellation
    /// </summary>
    public class CancellationRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}
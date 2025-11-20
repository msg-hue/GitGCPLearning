using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Data;
using PMS_APIs.Data;
using PMS_APIs.Models;

namespace PMS_APIs.Controllers
{
    /// <summary>
    /// API Controller for managing properties in the Property Management System
    /// Provides CRUD operations for property data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class PropertiesController : ControllerBase
    {
        private readonly PmsDbContext _context;

        public PropertiesController(PmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all properties with optional filtering and pagination
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 10)</param>
        /// <param name="search">Search term for filtering</param>
        /// <param name="status">Filter by status</param>
        /// <param name="projectName">Filter by project name</param>
        /// <param name="size">Filter by size</param>
        /// <returns>List of properties</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Property>>> GetProperties(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            string? status = null,
            string? projectName = null,
            string? size = null)
        {
            try
            {
                var query = _context.Properties.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p =>
                        (p.ProjectId != null && p.ProjectId.Contains(search)) ||
                        (p.Block != null && p.Block.Contains(search)) ||
                        (p.PlotNo != null && p.PlotNo.Contains(search)) ||
                        (p.PropertyId != null && p.PropertyId.Contains(search)) ||
                        (p.Size != null && p.Size.Contains(search)));
                }

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(p => p.Status == status);
                }

                if (!string.IsNullOrEmpty(projectName))
                {
                    query = query.Where(p => p.ProjectId == projectName);
                }

                if (!string.IsNullOrEmpty(size))
                {
                    query = query.Where(p => p.Size == size);
                }

                var totalCount = await query.CountAsync();
                var properties = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    data = properties,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving properties", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific property by ID
        /// </summary>
        /// <param name="id">Property ID</param>
        /// <returns>Property details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Property>> GetProperty(string id)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Allotments)
                        .ThenInclude(a => a.Customer)
                    .FirstOrDefaultAsync(p => p.PropertyId == id);

                if (property == null)
                {
                    return NotFound(new { message = "Property not found" });
                }

                return Ok(property);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving property", error = ex.Message });
            }
        }

        /// <summary>
        /// Create a new property
        /// </summary>
        /// <param name="property">Property data</param>
        /// <returns>Created property</returns>
        [HttpPost]
        public async Task<ActionResult<Property>> PostProperty(Property property)
        {
            // Generate property ID if not provided
            if (string.IsNullOrEmpty(property.PropertyId))
            {
                property.PropertyId = await GeneratePropertyId();
            }

            property.CreatedAt = DateTime.UtcNow;
            property.Status = "Available";

            _context.Properties.Add(property);

            try
            {
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetProperty), new { id = property.PropertyId }, property);
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error creating property", error = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing property
        /// </summary>
        /// <param name="id">Property ID</param>
        /// <param name="property">Updated property data</param>
        /// <returns>Updated property</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProperty(string id, Property property)
        {
            if (id != property.PropertyId)
            {
                return BadRequest(new { message = "Property ID mismatch" });
            }

            var existingProperty = await _context.Properties.FindAsync(id);
            if (existingProperty == null)
            {
                return NotFound(new { message = "Property not found" });
            }

            // Update properties - matching actual database schema
            existingProperty.ProjectId = property.ProjectId;
            existingProperty.PlotNo = property.PlotNo;
            existingProperty.Street = property.Street;
            existingProperty.PlotType = property.PlotType;
            existingProperty.Block = property.Block;
            existingProperty.PropertyType = property.PropertyType;
            existingProperty.Size = property.Size;
            existingProperty.Status = property.Status;
            existingProperty.AdditionalInfo = property.AdditionalInfo;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(existingProperty);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PropertyExists(id))
                {
                    return NotFound(new { message = "Property not found" });
                }
                throw;
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error updating property", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a property
        /// </summary>
        /// <param name="id">Property ID</param>
        /// <returns>Success message</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(string id)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null)
            {
                return NotFound(new { message = "Property not found" });
            }

            // Check if property has allotments
            var hasAllotments = await _context.Allotments.AnyAsync(a => a.PropertyId == id);
            if (hasAllotments)
            {
                return BadRequest(new { message = "Cannot delete property with existing allotments" });
            }

            _context.Properties.Remove(property);

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Property deleted successfully" });
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error deleting property", error = ex.Message });
            }
        }

        /// <summary>
        /// Get available properties for allotment
        /// </summary>
        /// <returns>Available properties</returns>
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<Property>>> GetAvailableProperties()
        {
            var availableProperties = await _context.Properties
                .Where(p => p.Status == "Available")
                .OrderBy(p => p.ProjectId)
                .ThenBy(p => p.Block)
                .ThenBy(p => p.PlotNo)
                .ToListAsync();

            return Ok(availableProperties);
        }

        /// <summary>
        /// Get property statistics
        /// </summary>
        /// <returns>Property statistics</returns>
        [HttpGet("statistics")]
        public async Task<ActionResult> GetPropertyStatistics()
        {
            try
            {
                var conn = _context.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open)
                {
                    await conn.OpenAsync();
                }

                // Check if status column exists
                bool statusColumnExists = false;
                using (var checkCmd = conn.CreateCommand())
                {
                    checkCmd.CommandText = @"
                        SELECT EXISTS (
                            SELECT 1 
                            FROM information_schema.columns 
                            WHERE table_schema = 'public' 
                            AND table_name = 'property' 
                            AND column_name = 'status'
                        )";
                    statusColumnExists = Convert.ToBoolean(await checkCmd.ExecuteScalarAsync());
                }

                // Get summary statistics using raw SQL to avoid type mapping issues
                int totalProperties = 0;
                int availableProperties = 0;
                int allottedProperties = 0;
                int soldProperties = 0;

                using (var statsCmd = conn.CreateCommand())
                {
                    if (statusColumnExists)
                    {
                        statsCmd.CommandText = @"SELECT 
                                                    COUNT(*) as total,
                                                    COUNT(*) FILTER (WHERE status = 'Available') as available,
                                                    COUNT(*) FILTER (WHERE status = 'Allotted') as allotted,
                                                    COUNT(*) FILTER (WHERE status = 'Sold') as sold
                                                  FROM property";
                    }
                    else
                    {
                        statsCmd.CommandText = @"SELECT 
                                                    COUNT(*) as total,
                                                    COUNT(*) as available,
                                                    0 as allotted,
                                                    0 as sold
                                                  FROM property";
                    }
                    using var reader = await statsCmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        totalProperties = Convert.ToInt32(reader["total"]);
                        availableProperties = Convert.ToInt32(reader["available"]);
                        allottedProperties = Convert.ToInt32(reader["allotted"]);
                        soldProperties = Convert.ToInt32(reader["sold"]);
                    }
                }

                // Get project statistics using raw SQL
                var projectStats = new List<object>();
                using (var projectStatsCmd = conn.CreateCommand())
                {
                    if (statusColumnExists)
                    {
                        projectStatsCmd.CommandText = @"SELECT 
                                                            projectid::text as projectid,
                                                            COUNT(*) as total,
                                                            COUNT(*) FILTER (WHERE status = 'Available') as available,
                                                            COUNT(*) FILTER (WHERE status = 'Allotted') as allotted,
                                                            COUNT(*) FILTER (WHERE status = 'Sold') as sold
                                                         FROM property
                                                         WHERE projectid IS NOT NULL
                                                         GROUP BY projectid";
                    }
                    else
                    {
                        projectStatsCmd.CommandText = @"SELECT 
                                                            projectid::text as projectid,
                                                            COUNT(*) as total,
                                                            COUNT(*) as available,
                                                            0 as allotted,
                                                            0 as sold
                                                         FROM property
                                                         WHERE projectid IS NOT NULL
                                                         GROUP BY projectid";
                    }
                    using var reader = await projectStatsCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        projectStats.Add(new
                        {
                            ProjectId = reader["projectid"]?.ToString(),
                            TotalProperties = Convert.ToInt32(reader["total"]),
                            AvailableProperties = Convert.ToInt32(reader["available"]),
                            AllottedProperties = Convert.ToInt32(reader["allotted"]),
                            SoldProperties = Convert.ToInt32(reader["sold"])
                        });
                    }
                }

                return Ok(new
                {
                    totalProperties,
                    availableProperties,
                    allottedProperties,
                    soldProperties,
                    projectStats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving property statistics", error = ex.Message });
            }
        }

        /// <summary>
        /// Get inventory status report grouped by project and status
        /// </summary>
        /// <returns>Inventory status report with project-wise breakdown and property details</returns>
        [HttpGet("inventory-status")]
        [AllowAnonymous]
        public async Task<ActionResult> GetInventoryStatus()
        {
            try
            {
                var conn = _context.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open)
                {
                    await conn.OpenAsync();
                }

                // Get all projects (without loading navigation properties to avoid status column issues)
                // Note: projects table doesn't have status column, so we exclude it
                var projects = await _context.Projects
                    .AsNoTracking()
                    .Select(p => new Project
                    {
                        ProjectId = p.ProjectId,
                        ProjectName = p.ProjectName,
                        Type = p.Type,
                        Location = p.Location,
                        Description = p.Description,
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                // Get summary statistics using raw SQL
                int totalProperties = 0;
                int availableProperties = 0;
                int allottedProperties = 0;
                int soldProperties = 0;

                // Check if status column exists
                bool statusColumnExists = false;
                using (var checkCmd = conn.CreateCommand())
                {
                    checkCmd.CommandText = @"
                        SELECT EXISTS (
                            SELECT 1 
                            FROM information_schema.columns 
                            WHERE table_schema = 'public' 
                            AND table_name = 'property' 
                            AND column_name = 'status'
                        )";
                    statusColumnExists = Convert.ToBoolean(await checkCmd.ExecuteScalarAsync());
                }

                using (var statsCmd = conn.CreateCommand())
                {
                    if (statusColumnExists)
                    {
                        statsCmd.CommandText = @"SELECT 
                                                    COUNT(*) as total,
                                                    COUNT(*) FILTER (WHERE status = 'Available') as available,
                                                    COUNT(*) FILTER (WHERE status = 'Allotted') as allotted,
                                                    COUNT(*) FILTER (WHERE status = 'Sold') as sold
                                                  FROM property";
                    }
                    else
                    {
                        statsCmd.CommandText = @"SELECT 
                                                    COUNT(*) as total,
                                                    COUNT(*) as available,
                                                    0 as allotted,
                                                    0 as sold
                                                  FROM property";
                    }
                    using var reader = await statsCmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        totalProperties = Convert.ToInt32(reader["total"]);
                        availableProperties = Convert.ToInt32(reader["available"]);
                        allottedProperties = Convert.ToInt32(reader["allotted"]);
                        soldProperties = Convert.ToInt32(reader["sold"]);
                    }
                }

                // Get all properties with their details using raw SQL - matching actual database schema
                // Explicitly cast all columns to avoid type conversion issues
                var allProperties = new List<Property>();
                using (var propsCmd = conn.CreateCommand())
                {
                    if (statusColumnExists)
                    {
                        propsCmd.CommandText = @"SELECT 
                                                    propertyid::text as propertyid, 
                                                    projectid::text as projectid, 
                                                    plotno::text as plotno, 
                                                    street::text as street, 
                                                    plottype::text as plottype, 
                                                    block::text as block, 
                                                    propertytype::text as propertytype, 
                                                    size::text as size, 
                                                    status::text as status, 
                                                    createdat::timestamp as createdat, 
                                                    additionalinfo::text as additionalinfo
                                                 FROM property
                                                 ORDER BY projectid, block, plotno";
                    }
                    else
                    {
                        propsCmd.CommandText = @"SELECT 
                                                    propertyid::text as propertyid, 
                                                    projectid::text as projectid, 
                                                    plotno::text as plotno, 
                                                    street::text as street, 
                                                    plottype::text as plottype, 
                                                    block::text as block, 
                                                    propertytype::text as propertytype, 
                                                    size::text as size, 
                                                    'Available'::text as status, 
                                                    createdat::timestamp as createdat, 
                                                    additionalinfo::text as additionalinfo
                                                 FROM property
                                                 ORDER BY projectid, block, plotno";
                    }
                    using var reader = await propsCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var prop = new Property
                        {
                            PropertyId = reader["propertyid"]?.ToString() ?? string.Empty,
                            ProjectId = reader["projectid"]?.ToString(),
                            PlotNo = reader["plotno"]?.ToString(),
                            Street = reader["street"]?.ToString(),
                            PlotType = reader["plottype"]?.ToString(),
                            Block = reader["block"]?.ToString(),
                            PropertyType = reader["propertytype"]?.ToString(),
                            Size = reader["size"]?.ToString(),
                            Status = reader["status"]?.ToString() ?? "Available",
                            CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.UtcNow,
                            AdditionalInfo = reader["additionalinfo"]?.ToString()
                        };

                        allProperties.Add(prop);
                    }
                }

                // Get project-wise inventory breakdown
                var projectInventory = new List<object>();

                foreach (var project in projects)
                {
                    // Get properties for this project by matching project ID
                    var projectProperties = allProperties
                        .Where(p => p.ProjectId == project.ProjectId)
                        .ToList();

                    var total = projectProperties.Count;
                    var available = projectProperties.Count(p => p.Status == "Available");
                    var allotted = projectProperties.Count(p => p.Status == "Allotted");
                    var sold = projectProperties.Count(p => p.Status == "Sold");
                    var utilizationRate = total > 0 ? Math.Round((double)(allotted + sold) / total * 100, 1) : 0;

                    projectInventory.Add(new
                    {
                        projectId = project.ProjectId,
                        projectName = project.ProjectName ?? string.Empty,
                        type = project.Type ?? string.Empty,
                        location = project.Location ?? string.Empty,
                        total = total,
                        available = available,
                        allotted = allotted,
                        sold = sold,
                        utilizationRate = utilizationRate
                    });
                }

                // Map properties to match frontend expectations
                var propertyList = allProperties.Select(p => new
                {
                    propertyId = p.PropertyId,
                    projectId = p.ProjectId,
                    plotNo = p.PlotNo,
                    street = p.Street,
                    plotType = p.PlotType,
                    block = p.Block,
                    propertyType = p.PropertyType,
                    size = p.Size,
                    status = p.Status,
                    createdAt = p.CreatedAt,
                    additionalInfo = p.AdditionalInfo
                }).ToList();

                return Ok(new
                {
                    summary = new
                    {
                        totalProperties,
                        availableProperties,
                        allottedProperties,
                        soldProperties
                    },
                    projects = projectInventory,
                    properties = propertyList
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving inventory status", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        private bool PropertyExists(string id)
        {
            return _context.Properties.Any(e => e.PropertyId == id);
        }

        private async Task<string> GeneratePropertyId()
        {
            var lastProperty = await _context.Properties
                .OrderByDescending(p => p.PropertyId)
                .FirstOrDefaultAsync();

            if (lastProperty == null)
            {
                return "PROP000001";
            }

            var lastIdNumber = int.Parse(lastProperty.PropertyId.Substring(4));
            var newIdNumber = lastIdNumber + 1;
            return $"PROP{newIdNumber:D6}";
        }
    }
}
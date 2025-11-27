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
    /// API Controller for managing projects in the Property Management System
    /// Provides CRUD operations for project data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly PmsDbContext _context;

        public ProjectsController(PmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all projects with optional filtering and pagination
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 10)</param>
        /// <param name="search">Search term for filtering</param>
        /// <param name="type">Filter by project type</param>
        /// <param name="location">Filter by location</param>
        /// <returns>List of projects</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            string? type = null,
            string? location = null)
        {
            try
            {
                var query = _context.Projects.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p =>
                        (p.ProjectId != null && p.ProjectId.Contains(search)) ||
                        (p.ProjectName != null && p.ProjectName.Contains(search)) ||
                        (p.Type != null && p.Type.Contains(search)) ||
                        (p.Location != null && p.Location.Contains(search)) ||
                        (p.Description != null && p.Description.Contains(search)));
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(p => p.Type == type);
                }

                if (!string.IsNullOrEmpty(location))
                {
                    query = query.Where(p => p.Location != null && p.Location.Contains(location));
                }

                var totalCount = await query.CountAsync();
                var projects = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    data = projects,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving projects", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific project by ID
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <returns>Project details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(string id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Properties)
                    .Include(p => p.PaymentPlans)
                    .FirstOrDefaultAsync(p => p.ProjectId == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                return Ok(project);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving project", error = ex.Message });
            }
        }

        /// <summary>
        /// Create a new project
        /// </summary>
        /// <param name="project">Project data</param>
        /// <returns>Created project</returns>
        [HttpPost]
        public async Task<ActionResult<Project>> PostProject(Project project)
        {
            // Generate project ID if not provided
            if (string.IsNullOrEmpty(project.ProjectId))
            {
                project.ProjectId = await GenerateProjectId();
            }

            project.CreatedAt = DateTime.UtcNow;

            _context.Projects.Add(project);

            try
            {
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetProject), new { id = project.ProjectId }, project);
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error creating project", error = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing project
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <param name="project">Updated project data</param>
        /// <returns>Updated project</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(string id, Project project)
        {
            if (id != project.ProjectId)
            {
                return BadRequest(new { message = "Project ID mismatch" });
            }

            var existingProject = await _context.Projects.FindAsync(id);
            if (existingProject == null)
            {
                return NotFound(new { message = "Project not found" });
            }

            // Update properties - matching actual database schema
            existingProject.ProjectName = project.ProjectName;
            existingProject.Type = project.Type;
            existingProject.Location = project.Location;
            existingProject.Description = project.Description;
            existingProject.Status = project.Status;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(existingProject);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProjectExists(id))
                {
                    return NotFound(new { message = "Project not found" });
                }
                throw;
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error updating project", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a project
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <returns>Success message</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(string id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound(new { message = "Project not found" });
            }

            // Check if project has properties
            var hasProperties = await _context.Properties.AnyAsync(p => p.ProjectId == id);
            if (hasProperties)
            {
                return BadRequest(new { message = "Cannot delete project with existing properties" });
            }

            // Check if project has payment plans
            var hasPaymentPlans = await _context.PaymentPlans.AnyAsync(pp => pp.ProjectId == id);
            if (hasPaymentPlans)
            {
                return BadRequest(new { message = "Cannot delete project with existing payment plans" });
            }

            _context.Projects.Remove(project);

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Project deleted successfully" });
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error deleting project", error = ex.Message });
            }
        }

        /// <summary>
        /// Get project statistics
        /// </summary>
        /// <returns>Project statistics</returns>
        [HttpGet("statistics")]
        public async Task<ActionResult> GetProjectStatistics()
        {
            try
            {
                var conn = _context.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open)
                {
                    await conn.OpenAsync();
                }

                // Get total projects count
                int totalProjects = await _context.Projects.CountAsync();

                // Check if status column exists in property table
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

                // Get projects with property counts using raw SQL
                var projectStats = new List<object>();
                using (var projectStatsCmd = conn.CreateCommand())
                {
                    if (statusColumnExists)
                    {
                        projectStatsCmd.CommandText = @"SELECT 
                                                            p.projectid::text as projectid,
                                                            p.projectname::text as projectname,
                                                            p.type::text as type,
                                                            p.location::text as location,
                                                            COUNT(prop.propertyid) as totalproperties,
                                                            COUNT(prop.propertyid) FILTER (WHERE prop.status = 'Available') as availableproperties,
                                                            COUNT(prop.propertyid) FILTER (WHERE prop.status = 'Allotted') as allottedproperties,
                                                            COUNT(prop.propertyid) FILTER (WHERE prop.status = 'Sold') as soldproperties
                                                         FROM projects p
                                                         LEFT JOIN property prop ON p.projectid = prop.projectid
                                                         GROUP BY p.projectid, p.projectname, p.type, p.location
                                                         ORDER BY p.projectname";
                    }
                    else
                    {
                        projectStatsCmd.CommandText = @"SELECT 
                                                            p.projectid::text as projectid,
                                                            p.projectname::text as projectname,
                                                            p.type::text as type,
                                                            p.location::text as location,
                                                            COUNT(prop.propertyid) as totalproperties,
                                                            COUNT(prop.propertyid) as availableproperties,
                                                            0 as allottedproperties,
                                                            0 as soldproperties
                                                         FROM projects p
                                                         LEFT JOIN property prop ON p.projectid = prop.projectid
                                                         GROUP BY p.projectid, p.projectname, p.type, p.location
                                                         ORDER BY p.projectname";
                    }
                    using var reader = await projectStatsCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var totalProps = Convert.ToInt32(reader["totalproperties"]);
                        var available = Convert.ToInt32(reader["availableproperties"]);
                        var allotted = Convert.ToInt32(reader["allottedproperties"]);
                        var sold = Convert.ToInt32(reader["soldproperties"]);
                        var utilizationRate = totalProps > 0 ? Math.Round((double)(allotted + sold) / totalProps * 100, 1) : 0;

                        projectStats.Add(new
                        {
                            ProjectId = reader["projectid"]?.ToString(),
                            ProjectName = reader["projectname"]?.ToString(),
                            Type = reader["type"]?.ToString(),
                            Location = reader["location"]?.ToString(),
                            TotalProperties = totalProps,
                            AvailableProperties = available,
                            AllottedProperties = allotted,
                            SoldProperties = sold,
                            UtilizationRate = utilizationRate
                        });
                    }
                }

                return Ok(new
                {
                    totalProjects,
                    projectStats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving project statistics", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all projects (simplified list for dropdowns)
        /// </summary>
        /// <returns>List of all projects</returns>
        [HttpGet("list")]
        public async Task<ActionResult<IEnumerable<object>>> GetProjectsList()
        {
            try
            {
                var projects = await _context.Projects
                    .OrderBy(p => p.ProjectName)
                    .Select(p => new
                    {
                        projectId = p.ProjectId,
                        projectName = p.ProjectName,
                        type = p.Type,
                        location = p.Location
                    })
                    .ToListAsync();

                return Ok(projects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving projects list", error = ex.Message });
            }
        }

        private bool ProjectExists(string id)
        {
            return _context.Projects.Any(e => e.ProjectId == id);
        }

        private async Task<string> GenerateProjectId()
        {
            var lastProject = await _context.Projects
                .OrderByDescending(p => p.ProjectId)
                .FirstOrDefaultAsync();

            if (lastProject == null)
            {
                return "PROJ000001";
            }

            // Extract numeric part from project ID (assuming format like PROJ000001)
            var lastIdNumber = 0;
            if (lastProject.ProjectId.Length >= 4)
            {
                var numericPart = lastProject.ProjectId.Substring(4);
                if (int.TryParse(numericPart, out lastIdNumber))
                {
                    var newIdNumber = lastIdNumber + 1;
                    return $"PROJ{newIdNumber:D6}";
                }
            }

            // Fallback: generate based on count
            var count = await _context.Projects.CountAsync();
            return $"PROJ{(count + 1):D6}";
        }
    }
}


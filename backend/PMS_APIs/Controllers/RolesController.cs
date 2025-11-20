using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS_APIs.Data;
using PMS_APIs.Models;

namespace PMS_APIs.Controllers
{
    /// <summary>
    /// API Controller for managing roles in the Property Management System
    /// Provides read operations for role data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly PmsDbContext _context;

        public RolesController(PmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all active roles
        /// </summary>
        /// <param name="includeInactive">Include inactive roles (default: false)</param>
        /// <returns>List of roles</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetRoles(bool includeInactive = false)
        {
            try
            {
                Console.WriteLine($"[RolesController] GetRoles called - includeInactive: {includeInactive}");
                
                // First, try to get total count without filtering
                var totalCount = await _context.Roles.CountAsync();
                Console.WriteLine($"[RolesController] Total roles in database: {totalCount}");
                
                var query = _context.Roles.AsQueryable();

                if (!includeInactive)
                {
                    var activeCount = await _context.Roles.Where(r => r.IsActive).CountAsync();
                    Console.WriteLine($"[RolesController] Active roles count: {activeCount}");
                    query = query.Where(r => r.IsActive);
                }

                var roles = await query
                    .OrderBy(r => r.RoleName)
                    .Select(r => new
                    {
                        RoleId = r.RoleId,
                        RoleName = r.RoleName,
                        Description = r.Description,
                        IsActive = r.IsActive
                    })
                    .ToListAsync();

                Console.WriteLine($"[RolesController] Found {roles.Count} roles");
                if (roles.Count > 0)
                {
                    Console.WriteLine($"[RolesController] First role: RoleId={roles[0].RoleId}, RoleName={roles[0].RoleName}, IsActive={roles[0].IsActive}");
                }
                
                // Return the array directly, not wrapped
                return Ok(roles);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RolesController] Exception: {ex.Message}");
                Console.WriteLine($"[RolesController] InnerException: {ex.InnerException?.Message}");
                
                // If table doesn't exist (PostgreSQL error 42P01), return empty array
                if (ex.Message.Contains("does not exist") || ex.Message.Contains("42P01") || 
                    ex.InnerException?.Message?.Contains("42P01") == true ||
                    ex.Message.Contains("relation") && ex.Message.Contains("does not exist"))
                {
                    Console.WriteLine("[RolesController] Roles table does not exist yet. Returning empty array.");
                    return Ok(new List<object>());
                }
                return StatusCode(500, new { message = "Error retrieving roles", error = ex.Message, innerException = ex.InnerException?.Message });
            }
        }

        /// <summary>
        /// Get a specific role by ID
        /// </summary>
        /// <param name="id">Role ID</param>
        /// <returns>Role details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetRole(string id)
        {
            try
            {
                var role = await _context.Roles.FindAsync(id);

                if (role == null)
                {
                    return NotFound(new { message = "Role not found" });
                }

                return Ok(new
                {
                    RoleId = role.RoleId,
                    RoleName = role.RoleName,
                    Description = role.Description,
                    IsActive = role.IsActive,
                    CreatedAt = role.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving role", error = ex.Message });
            }
        }
    }
}


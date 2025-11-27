using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS_APIs.Data;
using PMS_APIs.DTOs;
using PMS_APIs.Models;
using System.Security.Cryptography;
using System.Text;

namespace PMS_APIs.Controllers
{
    /// <summary>
    /// API Controller for managing users in the Property Management System
    /// Provides CRUD operations for user data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly PmsDbContext _context;

        public UsersController(PmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all users with optional filtering and pagination
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 10)</param>
        /// <param name="search">Search term for filtering</param>
        /// <param name="isActive">Filter by active status</param>
        /// <param name="roleId">Filter by role ID</param>
        /// <returns>List of users</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            bool? isActive = null,
            string? roleId = null)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u => 
                        u.FullName.Contains(search) || 
                        u.Email.Contains(search) ||
                        u.UserId.Contains(search));
                }

                if (isActive.HasValue)
                {
                    query = query.Where(u => u.IsActive == isActive.Value);
                }

                if (!string.IsNullOrEmpty(roleId))
                {
                    query = query.Where(u => u.RoleId == roleId);
                }

                var totalCount = await query.CountAsync();

                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new UserDto
                    {
                        UserId = u.UserId,
                        FullName = u.FullName,
                        Email = u.Email,
                        RoleId = u.RoleId,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    data = users,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving users", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific user by ID
        /// </summary>
        /// <param name="id">User ID</param>
        /// <returns>User details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(string id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var userDto = new UserDto
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    Email = user.Email,
                    RoleId = user.RoleId,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving user", error = ex.Message });
            }
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        /// <param name="createUserDto">User data</param>
        /// <returns>Created user</returns>
        [HttpPost]
        public async Task<ActionResult<UserDto>> PostUser([FromBody] CreateUserDto? createUserDto)
        {
            try
            {
                // Check if DTO is null
                if (createUserDto == null)
                {
                    return BadRequest(new { message = "Request body is null or invalid", receivedBody = "null" });
                }

                // Log received data for debugging
                Console.WriteLine($"[UsersController] Received CreateUserDto - FullName: '{createUserDto.FullName}', Email: '{createUserDto.Email}', HasPassword: {!string.IsNullOrEmpty(createUserDto.Password)}, RoleId: '{createUserDto.RoleId}', IsActive: {createUserDto.IsActive}");

                // Validate input
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .Select(x => new { 
                            Field = x.Key, 
                            Errors = x.Value?.Errors.Select(e => e.ErrorMessage).ToList(),
                            AttemptedValue = x.Value?.AttemptedValue
                        })
                        .ToList();
                    Console.WriteLine($"[UsersController] ModelState validation failed: {System.Text.Json.JsonSerializer.Serialize(errors)}");
                    return BadRequest(new { message = "Invalid input data", errors = errors });
                }

                // Additional validation
                if (string.IsNullOrWhiteSpace(createUserDto.FullName))
                {
                    return BadRequest(new { message = "Full name is required" });
                }

                if (string.IsNullOrWhiteSpace(createUserDto.Email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                if (string.IsNullOrWhiteSpace(createUserDto.Password))
                {
                    return BadRequest(new { message = "Password is required" });
                }

                // Check if user with email already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == createUserDto.Email.Trim().ToLower());

                if (existingUser != null)
                {
                    return Conflict(new { message = "User with this email already exists" });
                }

                // Generate unique user ID
                string userId = await GenerateUniqueUserId();

                // Hash password
                string passwordHash = HashPassword(createUserDto.Password);

                // Normalize RoleId - convert empty string to null
                string? roleId = string.IsNullOrWhiteSpace(createUserDto.RoleId) ? null : createUserDto.RoleId.Trim();

                var user = new User
                {
                    UserId = userId,
                    FullName = createUserDto.FullName.Trim(),
                    Email = createUserDto.Email.Trim().ToLower(),
                    PasswordHash = passwordHash,
                    RoleId = roleId,
                    IsActive = createUserDto.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var userDto = new UserDto
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    Email = user.Email,
                    RoleId = user.RoleId,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt
                };

                return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, userDto);
            }
            catch (DbUpdateException ex)
            {
                // Get more detailed error information
                var innerException = ex.InnerException?.Message ?? ex.Message;
                Console.WriteLine($"[UsersController] DbUpdateException: {ex.Message}");
                Console.WriteLine($"[UsersController] InnerException: {innerException}");
                
                var errorDetails = new
                {
                    message = "Error creating user",
                    error = ex.Message,
                    innerException = innerException,
                    // Only include stack trace in development
                    stackTrace = ex.StackTrace
                };
                return BadRequest(errorDetails);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UsersController] Exception: {ex.Message}");
                Console.WriteLine($"[UsersController] InnerException: {ex.InnerException?.Message}");
                return StatusCode(500, new { 
                    message = "Error creating user", 
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Update an existing user
        /// </summary>
        /// <param name="id">User ID</param>
        /// <param name="updateUserDto">Updated user data</param>
        /// <returns>Updated user</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(string id, [FromBody] UpdateUserDto updateUserDto)
        {
            try
            {
                if (id != updateUserDto.UserId)
                {
                    return BadRequest(new { message = "User ID mismatch" });
                }

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Check if email is being changed and if new email already exists
                if (user.Email.ToLower() != updateUserDto.Email.ToLower())
                {
                    var emailExists = await _context.Users
                        .AnyAsync(u => u.Email.ToLower() == updateUserDto.Email.ToLower() && u.UserId != id);
                    if (emailExists)
                    {
                        return Conflict(new { message = "User with this email already exists" });
                    }
                }

                // Update user properties
                user.FullName = updateUserDto.FullName;
                user.Email = updateUserDto.Email;
                user.RoleId = updateUserDto.RoleId;
                user.IsActive = updateUserDto.IsActive;

                // Update password only if provided
                if (!string.IsNullOrEmpty(updateUserDto.Password))
                {
                    user.PasswordHash = HashPassword(updateUserDto.Password);
                }

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!UserExists(id))
                    {
                        return NotFound(new { message = "User not found" });
                    }
                    throw;
                }

                var userDto = new UserDto
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    Email = user.Email,
                    RoleId = user.RoleId,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating user", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a user
        /// </summary>
        /// <param name="id">User ID</param>
        /// <returns>No content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
            }
        }

        /// <summary>
        /// Generate a unique user ID
        /// Format: U + 6 digits = 7 characters total (within 10 char limit)
        /// </summary>
        private async Task<string> GenerateUniqueUserId()
        {
            string userId;
            int attempts = 0;
            const int maxAttempts = 100;
            
            do
            {
                var random = new Random();
                // Generate U + 6 digits = 7 characters (e.g., U123456)
                userId = $"U{random.Next(100000, 999999)}";
                attempts++;
                
                if (attempts > maxAttempts)
                {
                    throw new Exception("Unable to generate unique user ID after multiple attempts");
                }
            } while (await _context.Users.AnyAsync(u => u.UserId == userId));

            // Ensure userId is exactly 7 characters and doesn't exceed 10
            if (userId.Length > 10)
            {
                userId = userId.Substring(0, 10);
            }

            return userId;
        }

        /// <summary>
        /// Hash a password using SHA256
        /// </summary>
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        /// <summary>
        /// Check if a user exists
        /// </summary>
        private bool UserExists(string id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }
    }
}


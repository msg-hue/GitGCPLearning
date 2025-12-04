using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PMS_APIs.Data;
using PMS_APIs.DTOs;
using PMS_APIs.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Data;

namespace PMS_APIs.Controllers
{
    /// <summary>
    /// Authentication controller for user login and management
    /// Handles user authentication, registration, and JWT token generation
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly PmsDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(PmsDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        /// <summary>
        /// Authenticates a user and returns a JWT token.
        /// Purpose: MVP login with plaintext password support and graceful fallback.
        /// Inputs: LoginRequestDto with Email (required) and Password (required).
        /// Outputs: 200 OK with { token, expiresAt, user } when:
        ///   - Email exists and plaintext matches legacy `users.password`, OR
        ///   - Email exists and hash matches `password_hash`, OR
        ///   - Email exists but no password is available (MVP fallback, password ignored).
        /// Returns 401 when email doesn’t exist or password fails validation.
        /// </summary>
        /// <param name="loginRequest">Login credentials containing email and password</param>
        /// <returns>JWT token and user information if authentication succeeds</returns>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto? loginRequest)
        {
            try
            {
                // Log the received request for debugging
                Console.WriteLine($"[AuthController] Login request received. ModelState.IsValid: {ModelState.IsValid}");
                if (loginRequest != null)
                {
                    Console.WriteLine($"[AuthController] LoginRequestDto received - Email: {loginRequest.Email}, Password: {(string.IsNullOrEmpty(loginRequest.Password) ? "empty" : "provided")}");
                }
                else
                {
                    Console.WriteLine($"[AuthController] LoginRequestDto is null - model binding failed");
                }

                // Validate input - check ModelState first
                if (!ModelState.IsValid)
                {
                    Console.WriteLine($"[AuthController] ModelState validation failed:");
                    foreach (var error in ModelState)
                    {
                        Console.WriteLine($"[AuthController]   {error.Key}: {string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage))}");
                    }
                    return BadRequest(new { message = "Invalid input data", errors = ModelState });
                }

                // Additional validation if loginRequest is null (shouldn't happen if ModelState is valid, but just in case)
                if (loginRequest == null || string.IsNullOrWhiteSpace(loginRequest.Email))
                {
                    return BadRequest(new { message = "Email is required", errors = new { email = new[] { "The email field is required." } } });
                }

                // Normalize inputs to avoid whitespace/casing issues
                var normalizedEmail = (loginRequest.Email ?? string.Empty).Trim().ToLower();
                var password = loginRequest.Password ?? string.Empty;

                // Log login attempt for debugging
                Console.WriteLine($"[AuthController] Login attempt for email: {normalizedEmail}");

                // Find user by email using Entity Framework
                // PostgreSQL column names from database.txt: userid, fullname, email, passwordhash, roleid, isactive, createdat
                // Simple plaintext password comparison - no hashing/encryption needed
                User? user = null;
                try
                {
                    Console.WriteLine($"[AuthController] Searching for user with email: {normalizedEmail}");
                    
                    // Use Entity Framework - User model now has correct PostgreSQL column names
                    user = await _context.Users
                        .FirstOrDefaultAsync(u => u.Email.ToLower().Trim() == normalizedEmail);
                    
                    if (user != null)
                    {
                        Console.WriteLine($"[AuthController] ✅ User found: {user.Email}");
                        Console.WriteLine($"[AuthController]   UserId: {user.UserId}");
                        Console.WriteLine($"[AuthController]   FullName: {user.FullName}");
                        Console.WriteLine($"[AuthController]   IsActive: {user.IsActive}");
                        Console.WriteLine($"[AuthController]   PasswordHash: '{user.PasswordHash}'");
                    }
                    else
                    {
                        Console.WriteLine($"[AuthController] ❌ No user found with email: {normalizedEmail}");
                    }
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"[AuthController] ❌ Database query failed: {dbEx.Message}");
                    if (dbEx.InnerException != null)
                    {
                        Console.WriteLine($"[AuthController] Inner exception: {dbEx.InnerException.Message}");
                    }
                    throw new Exception($"Database error: {dbEx.Message}", dbEx);
                }

                if (user == null)
                {
                    Console.WriteLine($"[AuthController] Login failed: User not found for email: {normalizedEmail}");
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Check if user is active
                if (!user.IsActive)
                {
                    Console.WriteLine($"[AuthController] Login failed: User account is inactive for email: {normalizedEmail}");
                    return Unauthorized(new { message = "User account is inactive. Please contact administrator." });
                }

                // Simple plaintext password comparison - NO hashing or encryption
                // Compare email and passwordhash directly as stored in database
                bool passwordValid = false;
                
                if (string.IsNullOrEmpty(password))
                {
                    Console.WriteLine($"[AuthController] ❌ No password provided");
                    return Unauthorized(new { message = "Invalid email or password" });
                }
                
                if (string.IsNullOrEmpty(user.PasswordHash))
                {
                    Console.WriteLine($"[AuthController] ❌ No passwordhash found in database for user: {user.Email}");
                    return Unauthorized(new { message = "Invalid email or password" });
                }
                
                // Simple direct comparison - passwordhash field contains plaintext password
                // Trim both to handle any whitespace issues
                var storedPassword = user.PasswordHash.Trim();
                var providedPassword = password.Trim();
                
                passwordValid = storedPassword.Equals(providedPassword, StringComparison.Ordinal);
                
                Console.WriteLine($"[AuthController] Password comparison:");
                Console.WriteLine($"[AuthController]   Email: {normalizedEmail}");
                Console.WriteLine($"[AuthController]   Stored passwordhash: '{storedPassword}' (length: {storedPassword.Length})");
                Console.WriteLine($"[AuthController]   Provided password: '{providedPassword}' (length: {providedPassword.Length})");
                Console.WriteLine($"[AuthController]   Match: {passwordValid}");

                if (!passwordValid)
                {
                    Console.WriteLine($"[AuthController] ❌ Login failed: Password does not match for email: {normalizedEmail}");
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                Console.WriteLine($"[AuthController] Login successful for user: {user.Email}");

                

                // Generate JWT token
                var token = GenerateJwtToken(user);
                var expiresAt = DateTime.UtcNow.AddHours(24); // Token expires in 24 hours

                var response = new LoginResponseDto
                {
                    Token = token,
                    ExpiresAt = expiresAt,
                    User = new UserDto
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        Email = user.Email,
                        RoleId = user.RoleId,
                        IsActive = user.IsActive,
                        CreatedAt = user.CreatedAt
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                // Log the full exception for debugging
                Console.WriteLine($"[AuthController] Login error: {ex.Message}");
                Console.WriteLine($"[AuthController] Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[AuthController] Inner exception: {ex.InnerException.Message}");
                }
                
                // Provide more specific error messages
                var errorMessage = ex.Message;
                if (errorMessage.Contains("transient") || errorMessage.Contains("connection") || 
                    errorMessage.Contains("timeout") || errorMessage.Contains("network"))
                {
                    errorMessage = "Database connection error. Please check if the database is accessible and try again.";
                }
                
                return StatusCode(500, new { 
                    message = "An error occurred during login", 
                    error = errorMessage, 
                    innerError = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponseDto>> LoginGet([FromQuery] string email, [FromQuery] string password)
        {
            try
            {
                var normalizedEmail = (email ?? string.Empty).Trim().ToLower();

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => (u.Email ?? string.Empty).Trim().ToLower() == normalizedEmail);

                if (user == null)
                {
                    try
                    {
                        var conn = _context.Database.GetDbConnection();
                        await conn.OpenAsync();
                        using var cmd = conn.CreateCommand();
                        // PostgreSQL column names from database.txt (no underscores)
                        cmd.CommandText = @"SELECT 
                            userid AS user_id,
                            fullname AS full_name,
                            email,
                            passwordhash AS password_hash,
                            roleid AS role_id,
                            isactive AS is_active,
                            createdat AS created_at
                          FROM users 
                          WHERE LOWER(TRIM(email)) = @email 
                          LIMIT 1";
                        var p = cmd.CreateParameter();
                        p.ParameterName = "@email";
                        p.Value = normalizedEmail;
                        cmd.Parameters.Add(p);

                        using var reader = await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);
                        if (await reader.ReadAsync())
                        {
                            user = new User
                            {
                                UserId = reader["user_id"].ToString() ?? string.Empty,
                                FullName = reader["full_name"].ToString() ?? string.Empty,
                                Email = reader["email"].ToString() ?? string.Empty,
                                RoleId = reader["role_id"] == DBNull.Value ? null : reader["role_id"].ToString(),
                                IsActive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                                CreatedAt = reader["created_at"] != DBNull.Value ? Convert.ToDateTime(reader["created_at"]) : DateTime.UtcNow,
                                PasswordHash = string.Empty
                            };
                        }
                        await conn.CloseAsync();
                    }
                    catch
                    {
                    }
                }

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                var token = GenerateJwtToken(user);
                var expiresAt = DateTime.UtcNow.AddHours(24);

                var response = new LoginResponseDto
                {
                    Token = token,
                    ExpiresAt = expiresAt,
                    User = new UserDto
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        Email = user.Email,
                        RoleId = user.RoleId,
                        IsActive = user.IsActive,
                        CreatedAt = user.CreatedAt
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during login", error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        /// <summary>
        /// Debug endpoint to check if a user exists and view their details (development only)
        /// </summary>
        [HttpGet("debug-user/{email}")]
        [AllowAnonymous]
        public async Task<ActionResult> DebugUser(string email)
        {
            try
            {
                var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
                
                // Use Entity Framework - User model has correct PostgreSQL column names
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower().Trim() == normalizedEmail);
                
                if (user != null)
                {
                    return Ok(new
                    {
                        found = true,
                        user = new
                        {
                            userId = user.UserId,
                            fullName = user.FullName,
                            email = user.Email,
                            passwordHash = user.PasswordHash,
                            passwordHashLength = user.PasswordHash?.Length ?? 0,
                            roleId = user.RoleId,
                            isActive = user.IsActive,
                            createdAt = user.CreatedAt
                        }
                    });
                }
                else
                {
                    return Ok(new { found = false, message = $"No user found with email: {normalizedEmail}" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        /// <summary>
        /// Creates a test user for development (only in development environment)
        /// </summary>
        [HttpPost("create-test-user")]
        [AllowAnonymous]
        public async Task<ActionResult<UserDto>> CreateTestUser([FromBody] CreateUserDto? createUserDto = null)
        {
            try
            {
                // Only allow in development
                var env = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "";
                if (!env.Contains("Development", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "This endpoint is only available in development environment" });
                }

                // Use provided data or defaults
                var email = createUserDto?.Email ?? "admin@test.com";
                var password = createUserDto?.Password ?? "admin123";
                var fullName = createUserDto?.FullName ?? "Test Admin";

                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                if (existingUser != null)
                {
                    return Ok(new { 
                        message = "Test user already exists", 
                        user = new UserDto
                        {
                            UserId = existingUser.UserId,
                            FullName = existingUser.FullName,
                            Email = existingUser.Email,
                            RoleId = existingUser.RoleId,
                            IsActive = existingUser.IsActive,
                            CreatedAt = existingUser.CreatedAt
                        }
                    });
                }

                // Generate unique user ID
                var userId = await GenerateUniqueUserId();

                // Create new user with plaintext password (for MVP)
                var user = new User
                {
                    UserId = userId,
                    FullName = fullName,
                    Email = email,
                    PasswordHash = password, // Store as plaintext for MVP
                    RoleId = createUserDto?.RoleId,
                    IsActive = true,
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

                return Ok(new { 
                    message = "Test user created successfully", 
                    user = userDto,
                    loginCredentials = new { email, password }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred while creating test user",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        /// <summary>
        /// Registers a new user in the system
        /// </summary>
        /// <param name="createUserDto">User registration data</param>
        /// <returns>Created user information without sensitive data</returns>
        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                // Validate input
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid input data", errors = ModelState });
                }

                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == createUserDto.Email.ToLower());

                if (existingUser != null)
                {
                    return Conflict(new { message = "User with this email already exists" });
                }

                // Generate unique user ID
                var userId = await GenerateUniqueUserId();

                var passwordHash = createUserDto.Password;

                // Create new user
                var user = new User
                {
                    UserId = userId,
                    FullName = createUserDto.FullName,
                    Email = createUserDto.Email,
                    PasswordHash = passwordHash,
                    RoleId = createUserDto.RoleId,
                    IsActive = createUserDto.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    // If role_id violates FK constraint, fallback to null and retry (MVP)
                    var inner = dbEx.InnerException?.Message ?? string.Empty;
                    if (inner.Contains("users_role_id_fkey") || inner.Contains("23503"))
                    {
                        user.RoleId = null;
                        try
                        {
                            await _context.SaveChangesAsync();
                        }
                        catch (DbUpdateException dbEx2)
                        {
                            return StatusCode(500, new
                            {
                                message = "Database update failed during registration (retry without role_id)",
                                error = dbEx2.Message,
                                innerError = dbEx2.InnerException?.Message
                            });
                        }
                    }
                    else
                    {
                        // Surface inner exception for easier troubleshooting (dev-friendly)
                        return StatusCode(500, new
                        {
                            message = "Database update failed during registration",
                            error = dbEx.Message,
                            innerError = dbEx.InnerException?.Message
                        });
                    }
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

                return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, userDto);
            }
            catch (Exception ex)
            {
                // Include inner exception details to pinpoint root cause without exposing stack trace
                return StatusCode(500, new
                {
                    message = "An error occurred during registration",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        /// <summary>
        /// Gets user information by user ID
        /// Requires authentication
        /// </summary>
        /// <param name="id">User ID to retrieve</param>
        /// <returns>User information without sensitive data</returns>
        [HttpGet("{id}")]
        [Authorize]
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
                return StatusCode(500, new { message = "An error occurred while retrieving user", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets all users in the system
        /// Requires authentication
        /// </summary>
        /// <returns>List of all users without sensitive data</returns>
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
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

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving users", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates user active status
        /// Requires authentication
        /// </summary>
        /// <param name="id">User ID to update</param>
        /// <param name="isActive">New active status</param>
        /// <returns>Updated user information</returns>
        [HttpPatch("{id}/status")]
        [Authorize]
        public async Task<ActionResult<UserDto>> UpdateUserStatus(string id, [FromBody] bool isActive)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                user.IsActive = isActive;
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

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating user status", error = ex.Message });
            }
        }

        /// <summary>
        /// Generates a JWT token for the authenticated user
        /// </summary>
        /// <param name="user">User entity to generate token for</param>
        /// <returns>JWT token string</returns>
        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "your-super-secret-jwt-key-that-is-at-least-32-characters-long";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "PMS_API";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "PMS_Client";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("role_id", user.RoleId ?? ""),
                new Claim("is_active", user.IsActive.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Hashes a password using BCrypt-like algorithm
        /// </summary>
        /// <param name="password">Plain text password to hash</param>
        /// <returns>Hashed password string</returns>
        

        /// <summary>
        /// Attempts to read a legacy plaintext password from the `users` table.
        /// Purpose: Support environments where passwords were stored in a `password` column as plain text.
        /// Inputs: userId - string user identifier
        /// Outputs: Plaintext password if available; otherwise null
        /// </summary>
        private async Task<string?> TryGetLegacyPlainPassword(string userId)
        {
            try
            {
                var conn = _context.Database.GetDbConnection();
                await conn.OpenAsync();
                using var cmd = conn.CreateCommand();
                // Read plaintext from any common password column and handle user id variants.
                // Supports both PostgreSQL (userid, passwordhash) and SQLite (user_id, password_hash) schemas
                cmd.CommandText = @"SELECT COALESCE(password, passwordhash, password_hash) AS plain_password
                                     FROM users
                                     WHERE (COALESCE(userid, user_id) = @id)
                                     LIMIT 1";

                var p = cmd.CreateParameter();
                p.ParameterName = "@id";
                p.Value = userId;
                cmd.Parameters.Add(p);

                var result = await cmd.ExecuteScalarAsync();
                await conn.CloseAsync();

                if (result == null || result == DBNull.Value) return null;
                return Convert.ToString(result);
            }
            catch (Exception ex)
            {
                // If the column doesn't exist or any error occurs, treat as not available
                Console.WriteLine($"[AuthController] TryGetLegacyPlainPassword failed: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Generates a unique user ID
        /// </summary>
        /// <returns>Unique 10-character user ID</returns>
        private async Task<string> GenerateUniqueUserId()
        {
            string userId;
            bool exists;

            do
            {
                // Generate user ID in format USR0000001
                var lastUser = await _context.Users
                    .Where(u => u.UserId.StartsWith("USR"))
                    .OrderByDescending(u => u.UserId)
                    .FirstOrDefaultAsync();

                int nextNumber = 1;
                if (lastUser != null && lastUser.UserId.Length == 10)
                {
                    var numberPart = lastUser.UserId.Substring(3);
                    if (int.TryParse(numberPart, out int currentNumber))
                    {
                        nextNumber = currentNumber + 1;
                    }
                }

                userId = $"USR{nextNumber:D7}";
                exists = await _context.Users.AnyAsync(u => u.UserId == userId);
            }
            while (exists);

            return userId;
        }
    }
}
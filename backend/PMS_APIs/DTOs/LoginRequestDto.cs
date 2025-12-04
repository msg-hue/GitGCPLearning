using System.ComponentModel.DataAnnotations;

namespace PMS_APIs.DTOs
{
    /// <summary>
    /// Data Transfer Object for user login requests
    /// Contains the credentials required for user authentication
    /// </summary>
    public class LoginRequestDto
    {
        /// <summary>
        /// User's email address for login
        /// Must be a valid email format
        /// Accepts both "email" (camelCase) and "Email" (PascalCase) from JSON
        /// </summary>
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [System.Text.Json.Serialization.JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// User's password for authentication (optional for MVP)
        /// If provided, must be at least 4 characters long.
        /// Accepts both "password" (camelCase) and "Password" (PascalCase) from JSON
        /// </summary>
        // Accept 4+ chars to support existing seed data (e.g., "1234").
        // For production, prefer 8+ with complexity requirements and required password.
        [MinLength(4, ErrorMessage = "Password must be at least 4 characters long")]
        [System.Text.Json.Serialization.JsonPropertyName("password")]
        public string? Password { get; set; }
    }
}
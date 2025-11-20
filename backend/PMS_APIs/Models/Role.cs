using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMS_APIs.Models
{
    /// <summary>
    /// Represents a role in the Property Management System
    /// Contains role information for user permissions
    /// </summary>
    [Table("roles")]
    public class Role
    {
        /// <summary>
        /// Unique identifier for the role (10 characters)
        /// Primary key for the roles table
        /// </summary>
        [Key]
        [Column("roleid")]
        [StringLength(10)]
        public string RoleId { get; set; } = string.Empty;

        /// <summary>
        /// Name of the role
        /// Maximum length of 100 characters
        /// </summary>
        [Column("rolename")]
        [StringLength(100)]
        [Required]
        public string RoleName { get; set; } = string.Empty;

        /// <summary>
        /// Description of the role
        /// </summary>
        [Column("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Indicates whether the role is active
        /// Default value is true
        /// </summary>
        [Column("isactive")]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Timestamp when the role was created
        /// Automatically set to current timestamp on creation
        /// </summary>
        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}


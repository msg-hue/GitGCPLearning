using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMS_APIs.Models
{
    /// <summary>
    /// Represents a project in the Property Management System
    /// Maps to the 'projects' table in the database
    /// </summary>
    [Table("projects")]
    public class Project
    {
        [Key]
        [Column("projectid")]
        [StringLength(10)]
        public string ProjectId { get; set; } = string.Empty;

        [Column("projectname")]
        [StringLength(150)]
        public string? ProjectName { get; set; }

        [Column("type")]
        [StringLength(50)]
        public string? Type { get; set; }

        [Column("location")]
        [StringLength(255)]
        public string? Location { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [NotMapped]
        [StringLength(50)]
        public string? Status { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Property> Properties { get; set; } = new List<Property>();
        public ICollection<PaymentPlan> PaymentPlans { get; set; } = new List<PaymentPlan>();
    }
}


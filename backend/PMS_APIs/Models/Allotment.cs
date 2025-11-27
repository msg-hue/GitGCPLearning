using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMS_APIs.Models
{
    /// <summary>
    /// Represents an allotment record in the Property Management System
    /// </summary>
    [Table("allotment")]
    public class Allotment
    {
        [Key]
        [Column("allotmentid")]
        [StringLength(10)]
        public string AllotmentId { get; set; } = string.Empty;

        [Column("customerid")]
        [StringLength(10)]
        public string? CustomerId { get; set; }

        [Column("propertyid")]
        [StringLength(10)]
        public string? PropertyId { get; set; }

        [Column("allotmentdate")]
        public DateTime? AllotmentDate { get; set; }

        [NotMapped] // Mark as NotMapped to avoid EF Core trying to query this column
        [StringLength(50)]
        public string? AllotmentLetterNo { get; set; }

        [NotMapped] // Mark as NotMapped - handle dynamically based on actual column name
        [StringLength(50)]
        public string Status { get; set; } = "Active";

        [NotMapped] // Mark as NotMapped - handle dynamically based on actual column name
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped] // Mark as NotMapped - optional field that may not exist
        [StringLength(100)]
        public string? CreatedBy { get; set; }

        [NotMapped] // Mark as NotMapped - optional field that may not exist
        public string? Remarks { get; set; }

        [NotMapped] // Mark as NotMapped - optional field that may not exist
        public DateOnly? PossessionDate { get; set; }

        [NotMapped] // Mark as NotMapped - optional field that may not exist
        public DateOnly? CompletionDate { get; set; }

        [NotMapped] // Mark as NotMapped - optional field that may not exist
        public DateOnly? BallotingDate { get; set; }

        [NotMapped] // Mark as NotMapped - optional field that may not exist
        [StringLength(50)]
        public string? BallotNo { get; set; }

        // Navigation properties
        [ForeignKey("CustomerId")]
        public Customer? Customer { get; set; }

        [ForeignKey("PropertyId")]
        public Property? Property { get; set; }
    }
}
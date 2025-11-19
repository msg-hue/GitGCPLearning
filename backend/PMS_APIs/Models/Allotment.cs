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

        [Column("allotment_letter_no")]
        [StringLength(50)]
        public string? AllotmentLetterNo { get; set; }

        [Column("status")]
        [StringLength(50)]
        public string Status { get; set; } = "Active";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("created_by")]
        [StringLength(100)]
        public string? CreatedBy { get; set; }

        [Column("remarks")]
        public string? Remarks { get; set; }

        [Column("possession_date")]
        public DateOnly? PossessionDate { get; set; }

        [Column("completion_date")]
        public DateOnly? CompletionDate { get; set; }

        [Column("balloting_date")]
        public DateOnly? BallotingDate { get; set; }

        [Column("ballot_no")]
        [StringLength(50)]
        public string? BallotNo { get; set; }

        // Navigation properties
        [ForeignKey("CustomerId")]
        public Customer? Customer { get; set; }

        [ForeignKey("PropertyId")]
        public Property? Property { get; set; }
    }
}
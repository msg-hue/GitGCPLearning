using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PMS_APIs.Models
{
    /// <summary>
    /// Represents a payment transaction in the Property Management System
    /// </summary>
    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("paymentid")]
        [StringLength(10)]
        public string PaymentId { get; set; } = string.Empty;

        [Column("scheduleid")]
        [StringLength(10)]
        public string? ScheduleId { get; set; }

        [Column("customerid")]
        [StringLength(10)]
        public string? CustomerId { get; set; }

        [Column("paymentdate")]
        public DateTime? PaymentDate { get; set; }

        [Column("amount")]
        [Precision(18, 2)]
        public decimal? Amount { get; set; }

        [Column("method")]
        [StringLength(50)]
        public string? Method { get; set; }

        [Column("referenceno")]
        [StringLength(100)]
        public string? ReferenceNo { get; set; }

        [Column("status")]
        [StringLength(250)]
        public string Status { get; set; } = "Pending";

        [Column("remarks")]
        [StringLength(255)]
        public string? Remarks { get; set; }

        // Navigation properties
        [ForeignKey("CustomerId")]
        public Customer? Customer { get; set; }
    }
}
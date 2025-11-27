using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMS_APIs.Models
{
    /// <summary>
    /// Represents a customer in the Property Management System
    /// </summary>
    [Table("customers")]
    public class Customer
    {
        [Key]
        [Column("customerid")]
        [StringLength(10)]
        public string CustomerId { get; set; } = string.Empty;

        [Column("regid")]
        [StringLength(10)]
        public string? RegId { get; set; }

        [Column("planid")]
        [StringLength(10)]
        public string? PlanId { get; set; }

        [Column("fullname")]
        [StringLength(150)]
        public string? FullName { get; set; }

        [Column("fathername")]
        [StringLength(150)]
        public string? FatherName { get; set; }

        [Column("cnic")]
        [StringLength(50)]
        public string? Cnic { get; set; }

        [Column("passportno")]
        [StringLength(50)]
        public string? PassportNo { get; set; }

        [Column("dob")]
        public DateOnly? Dob { get; set; }

        [Column("gender")]
        [StringLength(20)]
        public string? Gender { get; set; }

        [Column("phone")]
        [StringLength(50)]
        public string? Phone { get; set; }

        [Column("email")]
        [StringLength(150)]
        public string? Email { get; set; }

        [Column("mailingaddress")]
        [StringLength(255)]
        public string? MailingAddress { get; set; }

        [Column("permanentaddress")]
        [StringLength(255)]
        public string? PermanentAddress { get; set; }

        [Column("city")]
        [StringLength(100)]
        public string? City { get; set; }

        [Column("country")]
        [StringLength(100)]
        public string? Country { get; set; }

        [Column("subproject")]
        [StringLength(100)]
        public string? SubProject { get; set; }

        [Column("registeredsize")]
        [StringLength(50)]
        public string? RegisteredSize { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("status")]
        [StringLength(50)]
        public string Status { get; set; } = "Active";

        [Column("nomineename")]
        [StringLength(100)]
        public string? NomineeName { get; set; }

        [Column("nomineeid")]
        [StringLength(50)]
        public string? NomineeId { get; set; }

        [Column("nomineerelation")]
        [StringLength(50)]
        public string? NomineeRelation { get; set; }

        [Column("additionalinfo")]
        public string? AdditionalInfo { get; set; }

        [Column("allotmentstatus")]
        [StringLength(50)]
        public string? AllotmentStatus { get; set; }

        // Navigation properties
        public Registration? Registration { get; set; }
        public PaymentPlan? PaymentPlan { get; set; }
        public ICollection<Allotment> Allotments { get; set; } = new List<Allotment>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<CustomerLog> CustomerLogs { get; set; } = new List<CustomerLog>();
        public ICollection<Penalty> Penalties { get; set; } = new List<Penalty>();
        public ICollection<Waiver> Waivers { get; set; } = new List<Waiver>();
        public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
        public ICollection<Transfer> TransfersFrom { get; set; } = new List<Transfer>();
        public ICollection<Transfer> TransfersTo { get; set; } = new List<Transfer>();
        public ICollection<Ndc> Ndcs { get; set; } = new List<Ndc>();
        public ICollection<Possession> Possessions { get; set; } = new List<Possession>();
    }
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PMS_APIs.Models
{
    /// <summary>
    /// Represents a property in the Property Management System
    /// Maps to the 'property' table in the database
    /// </summary>
    [Table("property")]
    public class Property
    {
        [Key]
        [Column("propertyid")]
        [StringLength(10)]
        public string PropertyId { get; set; } = string.Empty;

        [Column("projectid")]
        [StringLength(10)]
        public string? ProjectId { get; set; }

        [Column("plotno")]
        [StringLength(50)]
        public string? PlotNo { get; set; }

        [Column("street")]
        [StringLength(50)]
        public string? Street { get; set; }

        [Column("plottype")]
        [StringLength(50)]
        public string? PlotType { get; set; }

        [Column("block")]
        [StringLength(50)]
        public string? Block { get; set; }

        [Column("propertytype")]
        [StringLength(50)]
        public string? PropertyType { get; set; }

        [Column("size")]
        [StringLength(50)]
        public string? Size { get; set; }

        [Column("status")]
        [StringLength(50)]
        public string Status { get; set; } = "Available";

        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public DateTime? UpdatedAt { get; set; }

        [Column("additionalinfo")]
        public string? AdditionalInfo { get; set; }

        // Navigation properties
        public ICollection<Allotment> Allotments { get; set; } = new List<Allotment>();
        public ICollection<Transfer> Transfers { get; set; } = new List<Transfer>();
        public ICollection<Possession> Possessions { get; set; } = new List<Possession>();
    }
}
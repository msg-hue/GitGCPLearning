using System.ComponentModel.DataAnnotations;

namespace PMS_APIs.Models
{
    /// <summary>
    /// Account Record DTO for payment plan account statements
    /// Purpose: Structured response containing payment plan details with all related schedule entries
    /// </summary>
    public class AccountRecord
    {
        /// <summary>
        /// Payment Plan Information
        /// </summary>
        public string PlanId { get; set; } = string.Empty;
        public string? PlanName { get; set; }
        public string? ProjectId { get; set; }
        public decimal? TotalAmount { get; set; }
        public int? DurationMonths { get; set; }
        public string? Frequency { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Schedule Entries - All payment schedule rows for this plan
        /// </summary>
        public List<ScheduleEntry> ScheduleEntries { get; set; } = new List<ScheduleEntry>();

        /// <summary>
        /// Account Summary
        /// </summary>
        public AccountSummary Summary { get; set; } = new AccountSummary();
    }

    /// <summary>
    /// Individual schedule entry from paymentschedule table
    /// </summary>
    public class ScheduleEntry
    {
        public string ScheduleId { get; set; } = string.Empty;
        public string? PaymentDescription { get; set; }
        public int? InstallmentNo { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? DueAmount { get; set; }
        public bool? SurchargeApplied { get; set; }
        public decimal? SurchargeRate { get; set; }
        public string? Description { get; set; }
        
        /// <summary>
        /// Calculated total amount including surcharge if applicable
        /// </summary>
        public decimal? TotalDueAmount
        {
            get
            {
                if (DueAmount == null) return null;
                if (SurchargeApplied == true && SurchargeRate.HasValue)
                {
                    return DueAmount + (DueAmount * SurchargeRate.Value / 100);
                }
                return DueAmount;
            }
        }
    }

    /// <summary>
    /// Account summary statistics
    /// </summary>
    public class AccountSummary
    {
        public int TotalSchedules { get; set; }
        public decimal? TotalDueAmount { get; set; }
        public decimal? TotalSurchargeAmount { get; set; }
        public decimal? GrandTotal { get; set; }
        public DateTime? FirstDueDate { get; set; }
        public DateTime? LastDueDate { get; set; }
        public int? PendingSchedules { get; set; }
        public int? OverdueSchedules { get; set; }
    }
}


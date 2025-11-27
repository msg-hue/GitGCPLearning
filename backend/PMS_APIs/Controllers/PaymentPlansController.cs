using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS_APIs.Data;
using PMS_APIs.Models;

namespace PMS_APIs.Controllers
{
    /// <summary>
    /// API Controller for managing payment plans in the Property Management System
    /// Provides CRUD operations for payment plan data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentPlansController : ControllerBase
    {
        private readonly PmsDbContext _context;

        public PaymentPlansController(PmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all payment plans with optional filtering and pagination.
        /// Inputs: page (default 1), pageSize (default 10), projectId optional, frequency optional.
        /// Outputs: paginated list with totalCount, page, pageSize, totalPages.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentPlan>>> GetPaymentPlans(
            int page = 1,
            int pageSize = 10,
            string? projectId = null,
            string? frequency = null)
        {
            var query = _context.PaymentPlans
                .AsQueryable();

            if (!string.IsNullOrEmpty(projectId))
            {
                query = query.Where(pp => pp.ProjectId == projectId);
            }

            if (!string.IsNullOrEmpty(frequency))
            {
                query = query.Where(pp => pp.Frequency == frequency);
            }

            var totalCount = await query.CountAsync();
            var paymentPlans = await query
                .OrderByDescending(pp => pp.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                data = paymentPlans,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Get a specific payment plan by ID
        /// </summary>
        /// <param name="id">Payment plan ID</param>
        /// <returns>Payment plan details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentPlan>> GetPaymentPlan(string id)
        {
            var paymentPlan = await _context.PaymentPlans
                .FirstOrDefaultAsync(pp => pp.PlanId == id);

            if (paymentPlan == null)
            {
                return NotFound(new { message = "Payment plan not found" });
            }

            return Ok(paymentPlan);
        }

        /// <summary>
        /// Create a new payment plan.
        /// Inputs: PaymentPlan payload aligned to payment_plan schema.
        /// Outputs: 201 with created entity or 400 on error.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<PaymentPlan>> PostPaymentPlan(PaymentPlan paymentPlan)
        {
            // Generate payment plan ID if not provided
            if (string.IsNullOrEmpty(paymentPlan.PlanId))
            {
                paymentPlan.PlanId = await GeneratePaymentPlanId();
            }

            paymentPlan.CreatedAt = DateTime.UtcNow;

            _context.PaymentPlans.Add(paymentPlan);

            try
            {
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetPaymentPlan), new { id = paymentPlan.PlanId }, paymentPlan);
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error creating payment plan", error = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing payment plan.
        /// Inputs: id path param, PaymentPlan payload fields present in schema.
        /// Outputs: 200 with updated entity or error codes.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymentPlan(string id, PaymentPlan paymentPlan)
        {
            if (id != paymentPlan.PlanId)
            {
                return BadRequest(new { message = "Payment plan ID mismatch" });
            }

            var existingPaymentPlan = await _context.PaymentPlans.FindAsync(id);
            if (existingPaymentPlan == null)
            {
                return NotFound(new { message = "Payment plan not found" });
            }

            // Update properties aligned with the current schema
            existingPaymentPlan.ProjectId = paymentPlan.ProjectId;
            existingPaymentPlan.PlanName = paymentPlan.PlanName;
            existingPaymentPlan.TotalAmount = paymentPlan.TotalAmount;
            existingPaymentPlan.DurationMonths = paymentPlan.DurationMonths;
            existingPaymentPlan.Frequency = paymentPlan.Frequency;
            existingPaymentPlan.Description = paymentPlan.Description;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(existingPaymentPlan);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymentPlanExists(id))
                {
                    return NotFound(new { message = "Payment plan not found" });
                }
                throw;
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error updating payment plan", error = ex.Message });
            }
        }

        /// <summary>
        /// Update payment plan status.
        /// Purpose: Not supported because schema has no status column.
        /// Inputs: id, status request body.
        /// Outputs: 400 explaining unsupported operation.
        /// </summary>
        [HttpPost("{id}/status")]
        public IActionResult UpdatePaymentPlanStatus(string id, [FromBody] StatusUpdateRequest request)
        {
            return BadRequest(new { message = "Status field is not supported in current payment_plan schema." });
        }

        /// <summary>
        /// Get payment plan statistics.
        /// Outputs: totalPlans, averageTotalAmount, averageDurationMonths.
        /// </summary>
        [HttpGet("statistics")]
        public async Task<ActionResult> GetPaymentPlanStatistics()
        {
            var totalPlans = await _context.PaymentPlans.CountAsync();
            var averageTotalAmount = await _context.PaymentPlans
                .Where(pp => pp.TotalAmount.HasValue)
                .AverageAsync(pp => pp.TotalAmount!.Value);

            var averageDurationMonths = await _context.PaymentPlans
                .Where(pp => pp.DurationMonths.HasValue)
                .AverageAsync(pp => pp.DurationMonths!.Value);

            return Ok(new
            {
                totalPlans,
                averageTotalAmount,
                averageDurationMonths
            });
        }

        /// <summary>
        /// Get overdue payment plans.
        /// Definition: plans created more than 30 days ago (simple heuristic).
        /// </summary>
        [HttpGet("overdue")]
        public async Task<ActionResult> GetOverduePaymentPlans()
        {
            var currentDate = DateTime.UtcNow.Date;
            
            // Since PaymentPlan doesn't have status, EndDate or RemainingAmount,
            // return plans created more than 30 days ago.
            var overduePlans = await _context.PaymentPlans
                .Where(pp => pp.CreatedAt < currentDate.AddDays(-30))
                .OrderBy(pp => pp.CreatedAt)
                .ToListAsync();

            return Ok(overduePlans);
        }

        /// <summary>
        /// Get account record for a payment plan by planid
        /// Purpose: Retrieve payment plan with all related payment schedule entries
        /// Inputs: planid (path parameter)
        /// Outputs: AccountRecord containing plan details, all schedule entries, and account summary
        /// </summary>
        [HttpGet("{planid}/account-record")]
        public async Task<ActionResult<AccountRecord>> GetAccountRecord(string planid)
        {
            try
            {
                var normalizedPlanId = planid?.Trim() ?? string.Empty;
                
                // Get payment plan
                var paymentPlan = await _context.PaymentPlans
                    .FirstOrDefaultAsync(pp => pp.PlanId != null && pp.PlanId.Trim() == normalizedPlanId);

                if (paymentPlan == null)
                {
                    return NotFound(new { message = "Payment plan not found" });
                }

                // Get all payment schedules for this plan
                var schedules = await _context.PaymentSchedules
                    .Where(s => s.PlanId != null && s.PlanId.Trim() == normalizedPlanId)
                    .OrderBy(s => s.DueDate)
                    .ThenBy(s => s.InstallmentNo)
                    .ToListAsync();

                // Build schedule entries
                var scheduleEntries = schedules.Select(s => new ScheduleEntry
                {
                    ScheduleId = s.ScheduleId ?? string.Empty,
                    PaymentDescription = s.PaymentDescription,
                    InstallmentNo = s.InstallmentNo,
                    DueDate = s.DueDate,
                    DueAmount = s.Amount,
                    SurchargeApplied = s.SurchargeApplied,
                    SurchargeRate = s.SurchargeRate,
                    Description = s.Description
                }).ToList();

                // Calculate account summary
                var currentDate = DateTime.UtcNow;
                var totalDueAmount = scheduleEntries
                    .Where(s => s.DueAmount.HasValue)
                    .Sum(s => s.DueAmount!.Value);

                var totalSurchargeAmount = scheduleEntries
                    .Where(s => s.SurchargeApplied == true && s.SurchargeRate.HasValue && s.DueAmount.HasValue)
                    .Sum(s => s.DueAmount!.Value * s.SurchargeRate!.Value / 100);

                var grandTotal = totalDueAmount + totalSurchargeAmount;

                var dueDates = scheduleEntries
                    .Where(s => s.DueDate.HasValue)
                    .Select(s => s.DueDate!.Value)
                    .ToList();

                var pendingSchedules = scheduleEntries
                    .Count(s => s.DueDate.HasValue && s.DueDate.Value > currentDate);

                var overdueSchedules = scheduleEntries
                    .Count(s => s.DueDate.HasValue && s.DueDate.Value < currentDate);

                var summary = new AccountSummary
                {
                    TotalSchedules = scheduleEntries.Count,
                    TotalDueAmount = totalDueAmount > 0 ? totalDueAmount : null,
                    TotalSurchargeAmount = totalSurchargeAmount > 0 ? totalSurchargeAmount : null,
                    GrandTotal = grandTotal > 0 ? grandTotal : null,
                    FirstDueDate = dueDates.Any() ? dueDates.Min() : null,
                    LastDueDate = dueDates.Any() ? dueDates.Max() : null,
                    PendingSchedules = pendingSchedules,
                    OverdueSchedules = overdueSchedules
                };

                // Build account record
                var accountRecord = new AccountRecord
                {
                    PlanId = paymentPlan.PlanId,
                    PlanName = paymentPlan.PlanName,
                    ProjectId = paymentPlan.ProjectId,
                    TotalAmount = paymentPlan.TotalAmount,
                    DurationMonths = paymentPlan.DurationMonths,
                    Frequency = paymentPlan.Frequency,
                    Description = paymentPlan.Description,
                    CreatedAt = paymentPlan.CreatedAt,
                    ScheduleEntries = scheduleEntries,
                    Summary = summary
                };

                return Ok(accountRecord);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving account record", error = ex.Message });
            }
        }

        private bool PaymentPlanExists(string id)
        {
            return _context.PaymentPlans.Any(e => e.PlanId == id);
        }

        private async Task<string> GeneratePaymentPlanId()
        {
            var lastPaymentPlan = await _context.PaymentPlans
                .OrderByDescending(pp => pp.PlanId)
                .FirstOrDefaultAsync();

            if (lastPaymentPlan == null)
            {
                return "PP0000001";
            }

            var lastIdNumber = int.Parse(lastPaymentPlan.PlanId.Substring(2));
            var newIdNumber = lastIdNumber + 1;
            return $"PP{newIdNumber:D7}";
        }
    }

    /// <summary>
    /// Request model for status update
    /// </summary>
    public class StatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
    }

    /// <summary>
    /// Request model for payment recording
    /// </summary>
    public class PaymentRecordRequest
    {
        public decimal Amount { get; set; }
        public string? Remarks { get; set; }
    }
}
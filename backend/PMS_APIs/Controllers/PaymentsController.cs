using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS_APIs.Data;
using PMS_APIs.Models;

namespace PMS_APIs.Controllers
{
    /// <summary>
    /// API Controller for managing payments in the Property Management System
    /// Provides CRUD operations for payment data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly PmsDbContext _context;

        public PaymentsController(PmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all payments with optional filtering and pagination
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 10)</param>
        /// <param name="customerId">Filter by customer ID</param>
        /// <param name="status">Filter by payment status</param>
        /// <param name="fromDate">Filter from date</param>
        /// <param name="toDate">Filter to date</param>
        /// <returns>List of payments</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments(
            int page = 1,
            int pageSize = 10,
            string? customerId = null,
            string? status = null,
            DateOnly? fromDate = null,
            DateOnly? toDate = null)
        {
            try
            {
                var query = _context.Payments
                    .Include(p => p.Customer)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(customerId))
                {
                    // Normalize customerId for comparison (trim before query)
                    var normalizedCustomerId = customerId.Trim();
                    query = query.Where(p => p.CustomerId == normalizedCustomerId);
                }

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(p => p.Status == status);
                }

                if (fromDate.HasValue)
                {
                    var from = fromDate.Value.ToDateTime(TimeOnly.MinValue);
                    query = query.Where(p => p.PaymentDate >= from);
                }

                if (toDate.HasValue)
                {
                    var to = toDate.Value.ToDateTime(TimeOnly.MaxValue);
                    query = query.Where(p => p.PaymentDate <= to);
                }

                var totalCount = await query.CountAsync();
                var payments = await query
                    .OrderByDescending(p => p.PaymentDate ?? DateTime.MinValue)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    data = payments,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine($"[GetPayments Error] {ex.Message}");
                Console.WriteLine($"[GetPayments Error] Stack: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[GetPayments Error] Inner: {ex.InnerException.Message}");
                }

                // Return JSON error instead of HTML
                return StatusCode(500, new
                {
                    message = "Error retrieving payments",
                    error = ex.Message,
                    details = ex.InnerException?.Message ?? ""
                });
            }
        }

        /// <summary>
        /// Get a specific payment by ID
        /// </summary>
        /// <param name="id">Payment ID</param>
        /// <returns>Payment details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(string id)
        {
            var payment = await _context.Payments
                .Include(p => p.Customer)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            return Ok(payment);
        }

        /// <summary>
        /// Create a new payment
        /// </summary>
        /// <param name="payment">Payment data</param>
        /// <returns>Created payment</returns>
        [HttpPost]
        public async Task<ActionResult<Payment>> PostPayment(Payment payment)
        {
            // Normalize and validate CustomerId if provided
            if (!string.IsNullOrWhiteSpace(payment.CustomerId))
            {
                // Trim CustomerId
                var customerId = payment.CustomerId.Trim();
                if (customerId.Length > 10)
                {
                    return BadRequest(new { message = "Invalid Customer ID", error = "Customer ID must be 10 characters or less" });
                }
                
                // Check if customer exists
                var customerExists = await _context.Customers
                    .AnyAsync(c => c.CustomerId == customerId);
                if (!customerExists)
                {
                    return BadRequest(new { message = "Customer not found", error = $"Customer ID '{customerId}' does not exist" });
                }
                
                // Set the normalized CustomerId and clear navigation property to avoid loading issues
                payment.CustomerId = customerId;
                payment.Customer = null; // Don't try to load navigation property during insert
            }

            // Normalize and validate ScheduleId if provided
            if (!string.IsNullOrWhiteSpace(payment.ScheduleId))
            {
                var scheduleId = payment.ScheduleId.Trim();
                if (scheduleId.Length > 10)
                {
                    return BadRequest(new { message = "Invalid Schedule ID", error = "Schedule ID must be 10 characters or less" });
                }
                
                var scheduleExists = await _context.PaymentSchedules
                    .AnyAsync(s => s.ScheduleId == scheduleId);
                if (!scheduleExists)
                {
                    return BadRequest(new { message = "Payment schedule not found", error = $"Schedule ID '{scheduleId}' does not exist" });
                }
                
                payment.ScheduleId = scheduleId;
            }
            else
            {
                // Explicitly set to null if empty
                payment.ScheduleId = null;
            }

            // Generate payment ID if not provided
            if (string.IsNullOrEmpty(payment.PaymentId))
            {
                payment.PaymentId = await GeneratePaymentId();
            }
            else
            {
                // Ensure PaymentId is trimmed and valid length
                payment.PaymentId = payment.PaymentId.Trim();
                if (payment.PaymentId.Length > 10)
                {
                    return BadRequest(new { message = "Invalid Payment ID", error = "Payment ID must be 10 characters or less" });
                }
            }
            
            // Ensure PaymentId is exactly 10 characters (CHAR(10) constraint)
            if (payment.PaymentId.Length < 10)
            {
                payment.PaymentId = payment.PaymentId.PadRight(10);
            }
            else if (payment.PaymentId.Length > 10)
            {
                payment.PaymentId = payment.PaymentId.Substring(0, 10);
            }

            if (!payment.PaymentDate.HasValue)
            {
                payment.PaymentDate = DateTime.UtcNow;
            }
            if (string.IsNullOrWhiteSpace(payment.Status))
            {
                payment.Status = "Pending";
            }

            _context.Payments.Add(payment);

            try
            {
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetPayment), new { id = payment.PaymentId }, payment);
            }
            catch (DbUpdateException ex)
            {
                // Extract the most detailed error message
                var innerEx = ex.InnerException;
                var errorDetails = ex.Message;
                var innerMessage = innerEx?.Message ?? "";
                
                // Navigate through inner exceptions to find the root cause
                while (innerEx?.InnerException != null)
                {
                    innerEx = innerEx.InnerException;
                    innerMessage = innerEx.Message;
                }
                
                // Combine messages for better debugging
                var fullError = string.IsNullOrEmpty(innerMessage) 
                    ? errorDetails 
                    : $"{errorDetails} | Inner: {innerMessage}";
                
                // Log for server-side debugging
                Console.WriteLine($"[Payment Creation Error] {fullError}");
                if (innerEx != null)
                {
                    Console.WriteLine($"[Payment Creation Error] Stack: {innerEx.StackTrace}");
                }
                
                return BadRequest(new { 
                    message = "Error creating payment", 
                    error = fullError,
                    details = innerMessage,
                    innerException = innerEx?.GetType().Name ?? "None"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Payment Creation Error] {ex.Message}");
                Console.WriteLine($"[Payment Creation Error] Stack: {ex.StackTrace}");
                return BadRequest(new { 
                    message = "Error creating payment", 
                    error = ex.Message,
                    details = ex.InnerException?.Message ?? ""
                });
            }
        }

        /// <summary>
        /// Update an existing payment
        /// </summary>
        /// <param name="id">Payment ID</param>
        /// <param name="payment">Updated payment data</param>
        /// <returns>Updated payment</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPayment(string id, Payment payment)
        {
            // Normalize and validate the ID
            var normalizedId = id?.Trim() ?? "";
            var normalizedPaymentId = payment.PaymentId?.Trim() ?? "";
            
            if (normalizedId != normalizedPaymentId)
            {
                return BadRequest(new { message = "Payment ID mismatch", error = $"URL ID '{normalizedId}' does not match payment ID '{normalizedPaymentId}'" });
            }

            var existingPayment = await _context.Payments.FindAsync(normalizedId);
            if (existingPayment == null)
            {
                return NotFound(new { message = "Payment not found", error = $"Payment with ID '{normalizedId}' does not exist" });
            }

            // Normalize and validate CustomerId if provided
            if (!string.IsNullOrWhiteSpace(payment.CustomerId))
            {
                var customerId = payment.CustomerId.Trim();
                if (customerId.Length > 10)
                {
                    return BadRequest(new { message = "Invalid Customer ID", error = "Customer ID must be 10 characters or less" });
                }
                
                // Check if customer exists
                var customerExists = await _context.Customers
                    .AnyAsync(c => c.CustomerId == customerId);
                if (!customerExists)
                {
                    return BadRequest(new { message = "Customer not found", error = $"Customer ID '{customerId}' does not exist" });
                }
                
                existingPayment.CustomerId = customerId;
            }
            else
            {
                existingPayment.CustomerId = null;
            }

            // Normalize and validate ScheduleId if provided
            if (!string.IsNullOrWhiteSpace(payment.ScheduleId))
            {
                var scheduleId = payment.ScheduleId.Trim();
                if (scheduleId.Length > 10)
                {
                    return BadRequest(new { message = "Invalid Schedule ID", error = "Schedule ID must be 10 characters or less" });
                }
                
                var scheduleExists = await _context.PaymentSchedules
                    .AnyAsync(s => s.ScheduleId == scheduleId);
                if (!scheduleExists)
                {
                    return BadRequest(new { message = "Payment schedule not found", error = $"Schedule ID '{scheduleId}' does not exist" });
                }
                
                existingPayment.ScheduleId = scheduleId;
            }
            else
            {
                existingPayment.ScheduleId = null;
            }

            // Update other properties
            existingPayment.Amount = payment.Amount;
            existingPayment.PaymentDate = payment.PaymentDate;
            existingPayment.Method = payment.Method;
            existingPayment.ReferenceNo = payment.ReferenceNo;
            existingPayment.Status = payment.Status ?? "Pending";
            existingPayment.Remarks = payment.Remarks;
            
            // Clear navigation property to avoid loading issues
            existingPayment.Customer = null;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(existingPayment);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!PaymentExists(normalizedId))
                {
                    return NotFound(new { message = "Payment not found", error = "Payment was deleted by another user" });
                }
                
                // Log and return detailed error
                Console.WriteLine($"[Payment Update Concurrency Error] {ex.Message}");
                return BadRequest(new { 
                    message = "Concurrency conflict", 
                    error = "The payment was modified by another user. Please refresh and try again.",
                    details = ex.Message
                });
            }
            catch (DbUpdateException ex)
            {
                // Extract the most detailed error message
                var innerEx = ex.InnerException;
                var errorDetails = ex.Message;
                var innerMessage = innerEx?.Message ?? "";
                
                // Navigate through inner exceptions to find the root cause
                while (innerEx?.InnerException != null)
                {
                    innerEx = innerEx.InnerException;
                    innerMessage = innerEx.Message;
                }
                
                // Combine messages for better debugging
                var fullError = string.IsNullOrEmpty(innerMessage) 
                    ? errorDetails 
                    : $"{errorDetails} | Inner: {innerMessage}";
                
                // Log for server-side debugging
                Console.WriteLine($"[Payment Update Error] {fullError}");
                if (innerEx != null)
                {
                    Console.WriteLine($"[Payment Update Error] Stack: {innerEx.StackTrace}");
                }
                
                return BadRequest(new { 
                    message = "Error updating payment", 
                    error = fullError,
                    details = innerMessage,
                    innerException = innerEx?.GetType().Name ?? "None"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Payment Update Error] {ex.Message}");
                Console.WriteLine($"[Payment Update Error] Stack: {ex.StackTrace}");
                return BadRequest(new { 
                    message = "Error updating payment", 
                    error = ex.Message,
                    details = ex.InnerException?.Message ?? ""
                });
            }
        }

        /// <summary>
        /// Delete a payment
        /// </summary>
        /// <param name="id">Payment ID</param>
        /// <returns>Success message</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(string id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            // Only allow deletion of pending payments
            _context.Payments.Remove(payment);

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Payment deleted successfully" });
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error deleting payment", error = ex.Message });
            }
        }

        /// <summary>
        /// Verify a payment
        /// </summary>
        /// <param name="id">Payment ID</param>
        /// <param name="verificationData">Verification details</param>
        /// <returns>Verified payment</returns>
        [HttpPost("{id}/verify")]
        public async Task<IActionResult> VerifyPayment(string id, [FromBody] VerificationRequest verificationData)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            if (payment.Status != "Pending")
            {
                return BadRequest(new { message = "Payment is already verified or processed" });
            }

            payment.Status = "Verified";
            if (!string.IsNullOrWhiteSpace(verificationData.Remarks))
            {
                payment.Remarks = verificationData.Remarks;
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(payment);
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = "Error verifying payment", error = ex.Message });
            }
        }

        /// <summary>
        /// Get payment statistics
        /// </summary>
        /// <returns>Payment statistics</returns>
        [HttpGet("statistics")]
        public async Task<ActionResult> GetPaymentStatistics()
        {
            var totalPayments = await _context.Payments.CountAsync();
            var totalAmount = await _context.Payments.SumAsync(p => p.Amount ?? 0);
            var pendingPayments = await _context.Payments.CountAsync(p => p.Status == "Pending");
            var verifiedPayments = await _context.Payments.CountAsync(p => p.Status == "Verified");

            var monthlyStats = await _context.Payments
                .Where(p => p.PaymentDate.HasValue)
                .GroupBy(p => new { p.PaymentDate!.Value.Year, p.PaymentDate!.Value.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.Amount ?? 0)
                })
                .OrderByDescending(x => x.Year)
                .ThenByDescending(x => x.Month)
                .Take(12)
                .ToListAsync();

            return Ok(new
            {
                totalPayments,
                totalAmount,
                pendingPayments,
                verifiedPayments,
                monthlyStats
            });
        }

        private bool PaymentExists(string id)
        {
            return _context.Payments.Any(e => e.PaymentId == id);
        }

        private async Task<string> GeneratePaymentId()
        {
            var lastPayment = await _context.Payments
                .OrderByDescending(p => p.PaymentId)
                .FirstOrDefaultAsync();

            if (lastPayment == null)
            {
                return "PAY0000001"; // Exactly 10 characters
            }

            // Extract numeric part and increment
            var lastIdStr = lastPayment.PaymentId.Trim();
            if (lastIdStr.Length >= 3 && lastIdStr.StartsWith("PAY", StringComparison.OrdinalIgnoreCase))
            {
                var numericPart = lastIdStr.Substring(3).TrimStart('0');
                if (int.TryParse(numericPart, out var lastIdNumber))
                {
                    var newIdNumber = lastIdNumber + 1;
                    // Format as PAY + 7 digits = exactly 10 characters
                    var newId = $"PAY{newIdNumber:D7}";
                    if (newId.Length > 10)
                    {
                        // If it exceeds 10 chars, use last 10 characters
                        newId = newId.Substring(newId.Length - 10);
                    }
                    return newId;
                }
            }
            
            // Fallback: generate based on count
            var count = await _context.Payments.CountAsync();
            return $"PAY{(count + 1):D7}".Substring(0, Math.Min(10, $"PAY{(count + 1):D7}".Length));
        }
    }

    /// <summary>
    /// Request model for payment verification
    /// </summary>
    public class VerificationRequest
    {
        public string VerifiedBy { get; set; } = string.Empty;
        public string? Remarks { get; set; }
    }
}
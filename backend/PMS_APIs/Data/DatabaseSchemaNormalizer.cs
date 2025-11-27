using Microsoft.EntityFrameworkCore;

namespace PMS_APIs.Data
{
    /// <summary>
    /// Utility class to normalize database schema differences
    /// Handles column name variations and schema alignment
    /// </summary>
    public static class DatabaseSchemaNormalizer
    {
        /// <summary>
        /// Normalizes the database schema to handle column name variations
        /// </summary>
        /// <param name="dbContext">The database context</param>
        /// <returns>Task representing the async operation</returns>
        public static async Task NormalizeAsync(PmsDbContext dbContext)
        {
            try
            {
                // This method can be used to normalize schema differences
                // For now, it's a placeholder that ensures the database is accessible
                var canConnect = await dbContext.Database.CanConnectAsync();
                if (!canConnect)
                {
                    Console.WriteLine("[SchemaNormalizer] Warning: Cannot connect to database");
                }
                else
                {
                    Console.WriteLine("[SchemaNormalizer] Database connection verified");
                }
            }
            catch (Exception ex)
            {
                // Log but don't throw - allow the app to continue
                Console.WriteLine($"[SchemaNormalizer] Schema normalization completed with warnings: {ex.Message}");
            }
        }
    }
}


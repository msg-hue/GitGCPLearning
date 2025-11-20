using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PMS_APIs.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Add API Controllers with JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Allow case-insensitive property matching (accepts both camelCase and PascalCase)
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Keep PascalCase for JSON (matches C# DTOs)
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        // Allow reading comments and trailing commas
        options.JsonSerializerOptions.ReadCommentHandling = System.Text.Json.JsonCommentHandling.Skip;
        options.JsonSerializerOptions.AllowTrailingCommas = true;
    });

// Add Swagger/OpenAPI support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo 
    { 
        Title = "Property Management System API", 
        Version = "v1",
        Description = "API for Property Management System with JWT Authentication"
    });
    
    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Add Entity Framework with configurable provider (Postgres or Sqlite)
// Purpose: Allow switching between Neon Postgres and local SQLite for development.
// Inputs: appsettings (ConnectionStrings:DefaultConnection), DatabaseProvider ("Postgres"|"Sqlite")
// Outputs: Registers PmsDbContext with the chosen provider.
var dbProvider = builder.Configuration["DatabaseProvider"] ?? "Postgres";
var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.Equals(dbProvider, "Sqlite", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddDbContext<PmsDbContext>(options => options.UseSqlite(defaultConn));
}
else
{
    builder.Services.AddDbContext<PmsDbContext>(options => options.UseNpgsql(defaultConn));
}

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your-super-secret-jwt-key-that-is-at-least-32-characters-long";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PMS_API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PMS_Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// Add Authorization
builder.Services.AddAuthorization();

// Add CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        // Allow specific origins: frontend on same domain and localhost for development
        policy
            .WithOrigins(
                "http://34.31.174.65",           // Production frontend
                "https://34.31.174.65",         // Production frontend (HTTPS)
                "http://localhost:3001",         // Local development
                "http://localhost:3000",         // Alternative local port
                "http://127.0.0.1:3001",         // Localhost IP
                "http://127.0.0.1:3000"          // Localhost IP alternative
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetPreflightMaxAge(TimeSpan.FromSeconds(3600)); // Cache preflight for 1 hour
        
        // Explicitly set exposed headers if needed
        policy.WithExposedHeaders("Content-Disposition", "Content-Length", "X-Total-Count");
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Custom exception handler for API routes to return JSON instead of HTML
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        // If it's an API route, return JSON error
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            var errorResponse = new
            {
                message = "An error occurred while processing your request",
                error = ex.Message,
                details = ex.InnerException?.Message ?? ""
            };
            await context.Response.WriteAsJsonAsync(errorResponse);
            return;
        }
        throw; // Re-throw for non-API routes to use default handler
    }
});

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Use CORS - Must be VERY early in pipeline for preflight OPTIONS requests
// This must come before any other middleware that might handle requests
app.UseCors("ReactApp");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Property Management System API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Use Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// ========== ADD THESE MINIMAL API ENDPOINTS ==========
// Add health check endpoint
app.MapGet("/health", () => "Healthy");

// Add root endpoint
app.MapGet("/", () => "PMS Backend API is running! - Available endpoints: /health, /swagger, /api");

// Add API root endpoint
app.MapGet("/api", () => new { 
    message = "Property Management System API", 
    version = "v1",
    endpoints = new {
        health = "/health",
        swagger = "/swagger",
        customers = "/api/customers",
        registrations = "/api/registrations",
        properties = "/api/properties"
    }
});

// Add a simple test endpoint
app.MapGet("/api/test", () => new { message = "PMS API is working correctly!" });

// Temporary endpoint to test roles (remove after RolesController is working)
app.MapGet("/api/roles-test", async (PmsDbContext db) => {
    try {
        var count = await db.Roles.CountAsync();
        return Results.Ok(new { message = "Roles table accessible", count = count });
    } catch (Exception ex) {
        return Results.Ok(new { message = "Error accessing roles", error = ex.Message });
    }
}).RequireAuthorization();
// ========== END OF ADDED ENDPOINTS ==========

// Map API controllers
app.MapControllers();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Apply pending EF Core migrations on startup BEFORE running the app
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<PMS_APIs.Data.PmsDbContext>();
    db.Database.Migrate();
    await PMS_APIs.Data.DatabaseSchemaNormalizer.NormalizeAsync(db);
    Console.WriteLine("[Startup] Database migrations applied successfully");
}
catch (Exception ex)
{
    Console.WriteLine($"[Startup] Database migration failed: {ex.Message}");
}

app.Run();

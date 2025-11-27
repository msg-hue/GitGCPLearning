# FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# WORKDIR /app

# FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
# WORKDIR /src
# COPY . .
# RUN dotnet restore
# RUN dotnet build -c Release -o /app/build

# FROM build AS publish
# RUN dotnet publish -c Release -o /app/publish

# FROM base AS final
# WORKDIR /app
# COPY --from=publish /app/publish .
# ENV ASPNETCORE_URLS=http://+:8080
# EXPOSE 8080
# ENTRYPOINT ["dotnet", "PMS_APIs.dll"]


# ===== Base Runtime Image =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app


# ===== Build Image =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project file
COPY *.sln .
COPY PMS_APIs/*.csproj PMS_APIs/

# Restore dependencies
RUN dotnet restore

# Copy the rest of the source
COPY . .

# Build
RUN dotnet build PMS_APIs/PMS_APIs.csproj -c Release -o /app/build


# ===== Publish Image =====
FROM build AS publish
RUN dotnet publish PMS_APIs/PMS_APIs.csproj -c Release -o /app/publish


# ===== Final Runtime Image =====
FROM base AS final
WORKDIR /app

COPY --from=publish /app/publish .

# Force Kestrel to listen on port 8080 inside container
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "PMS_APIs.dll"]
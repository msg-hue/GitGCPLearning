@echo off
REM -----------------------------
REM Set your Cloud Run service URL
REM -----------------------------
set SERVICE_URL=https://pms-apis-514572873477.us-central1.run.app

REM -----------------------------
REM Fetch fresh identity token
REM -----------------------------
for /f %%i in ('gcloud auth print-identity-token') do set TOKEN=%%i

REM -----------------------------
REM Call your endpoint
REM Replace /health with any API endpoint
REM -----------------------------
curl -H "Authorization: Bearer %TOKEN%" %SERVICE_URL%/health

REM -----------------------------
REM Example: call another endpoint
REM -----------------------------
REM curl -H "Authorization: Bearer %TOKEN%" %SERVICE_URL%/api/users

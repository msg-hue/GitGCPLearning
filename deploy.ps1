# PMS Deployment Script for Google Cloud VM
# Based on cloud.txt configuration

$VM_IP = "34.31.174.65"
$SSH_USER = "msg"
$INSTANCE = "instance-20251113-145915"
$ZONE = "us-central1-a"
$GCLOUD_PATH = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

# Frontend deployment paths
$FRONTEND_BUILD = "frontend\build"
$FRONTEND_DEPLOY = "/var/www/pms-frontend/"

# Backend deployment paths
$BACKEND_PUBLISH = "backend\PMS_APIs\publish"
$BACKEND_DEPLOY = "/home/msg/pms-api-2/publish/"
$SERVICE_NAME = "pms-api-2.service"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PMS Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Deploy Frontend
Write-Host "Step 1: Deploying Frontend..." -ForegroundColor Green
Write-Host "Copying frontend build files to server..." -ForegroundColor Yellow

& $GCLOUD_PATH compute scp --recurse --zone=$ZONE "$FRONTEND_BUILD\*" "${SSH_USER}@${INSTANCE}:/tmp/pms-frontend-build/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend files copied successfully!" -ForegroundColor Green
    
    # Move files to deployment directory
    Write-Host "Moving files to deployment directory..." -ForegroundColor Yellow
    & $GCLOUD_PATH compute ssh --zone=$ZONE "${SSH_USER}@${INSTANCE}" --command="sudo rm -rf $FRONTEND_DEPLOY* && sudo cp -r /tmp/pms-frontend-build/* $FRONTEND_DEPLOY && sudo chown -R www-data:www-data $FRONTEND_DEPLOY && rm -rf /tmp/pms-frontend-build"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error deploying frontend files" -ForegroundColor Red
    }
} else {
    Write-Host "Error copying frontend files" -ForegroundColor Red
}

Write-Host ""

# Step 2: Deploy Backend
Write-Host "Step 2: Deploying Backend..." -ForegroundColor Green
Write-Host "Copying backend publish files to server..." -ForegroundColor Yellow

& $GCLOUD_PATH compute scp --recurse --zone=$ZONE "$BACKEND_PUBLISH\*" "${SSH_USER}@${INSTANCE}:/tmp/pms-api-build/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend files copied successfully!" -ForegroundColor Green
    
    # Move files to deployment directory
    Write-Host "Moving files to deployment directory..." -ForegroundColor Yellow
    & $GCLOUD_PATH compute ssh --zone=$ZONE "${SSH_USER}@${INSTANCE}" --command="rm -rf $BACKEND_DEPLOY* && cp -r /tmp/pms-api-build/* $BACKEND_DEPLOY && rm -rf /tmp/pms-api-build"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend files deployed successfully!" -ForegroundColor Green
        
        # Restart service
        Write-Host "Restarting backend service..." -ForegroundColor Yellow
        & $GCLOUD_PATH compute ssh --zone=$ZONE "${SSH_USER}@${INSTANCE}" --command="sudo systemctl restart $SERVICE_NAME"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Backend service restarted!" -ForegroundColor Green
        } else {
            Write-Host "Error restarting service" -ForegroundColor Red
        }
    } else {
        Write-Host "Error deploying backend files" -ForegroundColor Red
    }
} else {
    Write-Host "Error copying backend files" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend URL: http://$VM_IP" -ForegroundColor Green
Write-Host "Backend API URL: http://$VM_IP:5002" -ForegroundColor Green
Write-Host ""
Write-Host "Check service status:" -ForegroundColor Yellow
Write-Host "  gcloud compute ssh --zone=$ZONE ${SSH_USER}@${INSTANCE} --command='sudo systemctl status $SERVICE_NAME'" -ForegroundColor Gray


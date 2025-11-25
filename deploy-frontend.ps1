# Frontend Deployment Script for Google Cloud VM
# Based on cloud.txt configuration

$VM_IP = "34.31.174.65"
$SSH_USER = "msg"
$INSTANCE = "instance-20251113-145915"
$ZONE = "us-central1-a"
$GCLOUD_PATH = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

# Frontend deployment paths
$FRONTEND_BUILD = "frontend\build"
$FRONTEND_DEPLOY = "/var/www/pms-frontend/"
$NGINX_CONFIG = "frontend\nginx-server.conf"
$NGINX_SITE_CONFIG = "/etc/nginx/sites-available/pms-frontend"
$NGINX_SITE_ENABLED = "/etc/nginx/sites-enabled/pms-frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PMS Frontend Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if frontend build exists
Write-Host "Step 1: Checking frontend build..." -ForegroundColor Yellow
if (-not (Test-Path "$FRONTEND_BUILD\index.html")) {
    Write-Host "Frontend build not found!" -ForegroundColor Red
    Write-Host "Building frontend now..." -ForegroundColor Yellow
    cd frontend
    npm run build
    cd ..
    if (-not (Test-Path "$FRONTEND_BUILD\index.html")) {
        Write-Host "Build failed! Please check errors above." -ForegroundColor Red
        exit 1
    }
}
Write-Host "Frontend build found" -ForegroundColor Green
Write-Host ""

# Step 2: Copy files to server
Write-Host "Step 2: Copying frontend build files to server..." -ForegroundColor Yellow
Write-Host "This will require authentication. Please enter your password when prompted." -ForegroundColor Cyan
Write-Host ""

# Create temporary directory on server first
& $GCLOUD_PATH compute ssh --zone=$ZONE "${SSH_USER}@${INSTANCE}" --command="mkdir -p /tmp/pms-frontend-build"

& $GCLOUD_PATH compute scp --recurse --zone=$ZONE "$FRONTEND_BUILD\*" "${SSH_USER}@${INSTANCE}:/tmp/pms-frontend-build/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend files copied successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Step 3: Move files to deployment directory
    Write-Host "Step 3: Moving files to deployment directory..." -ForegroundColor Yellow
    & $GCLOUD_PATH compute ssh --zone=$ZONE "${SSH_USER}@${INSTANCE}" --command="sudo rm -rf $FRONTEND_DEPLOY* && sudo cp -r /tmp/pms-frontend-build/* $FRONTEND_DEPLOY && sudo chown -R www-data:www-data $FRONTEND_DEPLOY && rm -rf /tmp/pms-frontend-build"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend files deployed successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Step 4: Deploy and apply nginx configuration
        Write-Host "Step 4: Deploying nginx configuration..." -ForegroundColor Yellow
        if (Test-Path $NGINX_CONFIG) {
            & $GCLOUD_PATH compute scp --zone=$ZONE "$NGINX_CONFIG" "${SSH_USER}@${INSTANCE}:/tmp/pms-frontend-nginx.conf"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Nginx config copied. Applying configuration..." -ForegroundColor Yellow
                # Deploy nginx config - try sites-available/sites-enabled structure first
                $nginxCommand = "sudo cp /tmp/pms-frontend-nginx.conf $NGINX_SITE_CONFIG 2>/dev/null || sudo cp /tmp/pms-frontend-nginx.conf /etc/nginx/conf.d/pms-frontend.conf; if [ -d /etc/nginx/sites-enabled ]; then sudo ln -sf $NGINX_SITE_CONFIG $NGINX_SITE_ENABLED; fi; sudo nginx -t && sudo systemctl reload nginx && rm /tmp/pms-frontend-nginx.conf"
                & $GCLOUD_PATH compute ssh --zone=$ZONE "${SSH_USER}@${INSTANCE}" --command=$nginxCommand
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Nginx configuration applied successfully!" -ForegroundColor Green
                } else {
                    Write-Host "Warning: Nginx configuration may have issues. Please check manually." -ForegroundColor Yellow
                    Write-Host "You may need to manually configure nginx with the try_files directive:" -ForegroundColor Yellow
                    Write-Host "  location / { try_files `$uri `$uri/ /index.html; }" -ForegroundColor Cyan
                }
            } else {
                Write-Host "Warning: Could not copy nginx config. Please configure nginx manually." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Warning: Nginx config file not found. Please configure nginx manually." -ForegroundColor Yellow
            Write-Host "Add this to your nginx config: location / { try_files `$uri `$uri/ /index.html; }" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Deployment Complete!" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Frontend URL: http://$VM_IP" -ForegroundColor Green
        Write-Host ""
        Write-Host "The frontend should be accessible at the URL above." -ForegroundColor Yellow
        Write-Host "Client-side routing should now work correctly!" -ForegroundColor Green
    } else {
        Write-Host "Error deploying frontend files" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Yellow
    }
} else {
    Write-Host "Error copying frontend files" -ForegroundColor Red
    Write-Host "Please check your authentication and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To authenticate, run: gcloud auth login" -ForegroundColor Cyan
}

#!/bin/bash
set -e

echo "========================================="
echo " Deployment Started"
echo "========================================="

echo ">>> Switching to project directory..."
cd ~/apps/pms

echo ">>> Stopping containers"
docker-compose down

echo ">>> Building Docker images (backend publish happens inside Dockerfile)..."
docker-compose build

echo ">>> Restarting containers..."
docker-compose up -d --remove-orphans

echo "========================================="
echo " Deployment Completed Successfully"
echo "========================================="




# #!/bin/bash

# echo "----- Publishing .NET project -----"
# dotnet publish -c Release -o publish
# echo "----- Restarting service -----"
# echo "----- Deployment completed successfully -----"




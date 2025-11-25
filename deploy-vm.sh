#!/bin/bash

CONFIG="./deploy.env.json"

VM_IP=$(jq -r '.VM_IP' $CONFIG)
SSH_USERNAME=$(jq -r '.SSH_USERNAME' $CONFIG)
DEPLOY_PATH=$(jq -r '.DEPLOY_PATH' $CONFIG)
SERVICE_FILE=$(jq -r '.SERVICE_FILE' $CONFIG)
PROJECT_NAME=$(jq -r '.PROJECT_NAME' $CONFIG)
PORT=$(jq -r '.PORT' $CONFIG)

echo "----- Publishing .NET project -----"
dotnet publish -c Release -o publish

echo "----- Copying to VM -----"
ssh $SSH_USERNAME@$VM_IP "sudo mkdir -p $DEPLOY_PATH"

scp -r ./publish/* $SSH_USERNAME@$VM_IP:$DEPLOY_PATH/

echo "----- Restarting service -----"
ssh $SSH_USERNAME@$VM_IP "sudo systemctl restart $SERVICE_FILE"

echo "----- Deployment completed successfully -----"

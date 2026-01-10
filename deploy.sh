#!/bin/bash
# Deploy script for Cheetos server

SERVER_USER="missola" # Adjust if needed
SERVER_IP="10.70.23.152" # Ensure this resolves or use IP
SERVER_PATH="/home/$SERVER_USER/gt7-saas"

echo "Deploying to $SERVER_IP..."

# 1. Copy files to server (excluding heavy folders)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' \
  ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH

# 2. SSH into server and rebuild/restart
ssh $SERVER_USER@$SERVER_IP << 'EOF'
  cd ~/gt7-saas
  docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
  echo "Deployment complete!"
EOF

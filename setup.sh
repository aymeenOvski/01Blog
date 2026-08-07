#!/bin/bash

echo "🚀 Starting 01Blog Development Setup..."

# 1. Update system packages
echo "📦 Updating package index..."
sudo apt-get update -y

# 2. Install Docker & dependencies if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Allow running docker without sudo
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker is already installed."
fi

# 3. Pull light Docker images needed for development
echo "📥 Pulling lightweight Docker images..."
sudo docker pull postgres:16-alpine
sudo docker pull node:20-alpine

echo "🎉 All tools and base images are ready!"
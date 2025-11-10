#!/bin/bash
set -e

echo "🧹 Cleaning up old containers and images..."
docker stop n8n-picsart 2>/dev/null || true
docker rm n8n-picsart 2>/dev/null || true
docker rmi picsart-n8n-nodes 2>/dev/null || true

echo "🔨 Building TypeScript..."
pnpm run build

echo "🐳 Building Docker image..."
docker build -t picsart-n8n-nodes .

echo "🚀 Starting n8n with Picsart nodes..."
docker run -it --rm --name n8n-picsart -p 5678:5678 picsart-n8n-nodes
#!/bin/bash
set -e

cd /root/.openclaw/workspace/MAIN-SITE

echo "[deploy] Pulling latest code..."
git pull origin main

echo "[deploy] Installing dependencies..."
npm install --production

echo "[deploy] Building..."
npm run build

echo "[deploy] Restarting PM2..."
pm2 restart website

echo "[deploy] Done."

#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "========================================"
echo "  Ajandam Desktop Build"
echo "========================================"

# 1) Frontend build
echo "[1/4] Frontend derleniyor..."
cd "$SCRIPT_DIR/client"
npm run build
echo "Frontend build OK."

# 2) Copy frontend to backend wwwroot
echo "[2/4] Frontend dosyalari backend'e kopyalaniyor..."
cd "$SCRIPT_DIR/api/Ajandam.API"
rm -rf wwwroot
mkdir -p wwwroot
cp -r "$SCRIPT_DIR/client/dist/"* wwwroot/
echo "Kopyalama OK."

# 3) Backend publish
echo "[3/4] Backend derleniyor (self-contained)..."
cd "$SCRIPT_DIR/api"
dotnet publish Ajandam.API/Ajandam.API.csproj -c Release -r win-x64 --self-contained true -o publish /p:PublishSingleFile=false
echo "Backend publish OK."

# 4) Electron package
echo "[4/4] Electron ile paketleniyor..."
cd "$SCRIPT_DIR/electron"
npm run build
echo ""
echo "========================================"
echo "  Build tamamlandi!"
echo "  Installer: electron/dist/"
echo "========================================"

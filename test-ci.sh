#!/bin/bash
set -e

echo "🧪 Testing CI/CD Pipeline Locally"
echo "=================================="
echo ""

echo "📦 Step 1: Installing dependencies..."
pnpm install

echo ""
echo "🔍 Step 2: Running linter..."
npm run lint

echo ""
echo "🔨 Step 3: Building package..."
npm run build

echo ""
echo "📦 Step 4: Packing package..."
npm pack
PACKAGE_FILE=$(ls picsart-n8n-nodes-picsart-creative-apis-*.tgz | head -1)
echo "Package file: $PACKAGE_FILE"

echo ""
echo "🔬 Step 5: Scanning community package..."
npx @n8n/scan-community-package "$PACKAGE_FILE"

echo ""
echo "✅ All checks passed!"
echo "Package is ready for publishing: $PACKAGE_FILE"

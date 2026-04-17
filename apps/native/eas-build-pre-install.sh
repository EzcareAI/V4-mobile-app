#!/usr/bin/env bash

# EAS Build pre-install hook for monorepo
# This ensures workspace dependencies are installed correctly

set -e

echo "🔧 EAS Build Pre-Install Hook Starting..."
echo "📍 Initial working directory: $(pwd)"
echo "📍 Listing current directory:"
ls -la | head -10 || true

# Try to navigate to monorepo root
# EAS Build should upload parent directories, but let's check
if [ -d "../.." ] && [ -f "../../package.json" ]; then
  echo "📍 Found root package.json, navigating..."
  cd "../.."
  echo "📍 Now in: $(pwd)"
elif [ -d ".." ] && [ -f "../package.json" ]; then
  echo "📍 Found parent package.json, navigating..."
  cd ".."
  echo "📍 Now in: $(pwd)"
fi

# Check if we found the monorepo root
if [ -f "package.json" ] && [ -d "packages" ] && [ -d "apps" ]; then
  echo "✅ Monorepo root detected!"
  echo "📍 Installing workspace dependencies..."
  
  # Try Bun first (project uses Bun), then npm as fallback
  if command -v bun &> /dev/null; then
    echo "📦 Using Bun (project's package manager)..."
    bun install || {
      echo "⚠️  bun install failed, trying without frozen lockfile..."
      bun install --no-frozen-lockfile || bun install
    }
  elif command -v npm &> /dev/null; then
    echo "📦 Bun not found, using npm..."
    npm install || {
      echo "⚠️  npm install failed, trying with workspaces flag..."
      npm install --workspaces --include-workspace-root || npm install
    }
  else
    echo "❌ No package manager found!"
    exit 1
  fi
  
  echo "✅ Dependencies installed"
else
  echo "⚠️  Monorepo root not found"
  echo "📍 Current directory: $(pwd)"
  echo "📍 Contents:"
  ls -la | head -10 || true
  
  # If we're still in apps/native, try installing there
  if [ -f "package.json" ]; then
    echo "📍 Installing dependencies in current directory..."
    npm install || bun install || true
  fi
fi

echo "✅ Pre-install hook completed successfully"

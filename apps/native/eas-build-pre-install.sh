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

  # ── Shim: metro-cache/private/stores → metro-cache/src/stores ──
  # uniwind's compiled metro plugin requires 'metro-cache/private/stores/FileStore'
  # but metro-cache 0.83+ moved it to 'src/stores/'. Create a symlink so the
  # require resolves correctly on EAS build servers.
  echo "🔧 Patching metro-cache private/stores path for uniwind..."
  for mc_dir in node_modules/.bun/metro-cache@*/node_modules/metro-cache; do
    if [ -d "$mc_dir/src/stores" ] && [ ! -d "$mc_dir/private/stores" ]; then
      mkdir -p "$mc_dir/private"
      ln -s "../src/stores" "$mc_dir/private/stores"
      echo "  ✅ Patched: $mc_dir/private/stores → src/stores"
    fi
  done
  # Also patch the hoisted metro-cache if it exists at node_modules/metro-cache
  if [ -d "node_modules/metro-cache/src/stores" ] && [ ! -d "node_modules/metro-cache/private/stores" ]; then
    mkdir -p "node_modules/metro-cache/private"
    ln -s "../src/stores" "node_modules/metro-cache/private/stores"
    echo "  ✅ Patched: node_modules/metro-cache/private/stores → src/stores"
  fi
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

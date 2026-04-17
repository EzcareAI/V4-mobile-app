#!/usr/bin/env bash

# EAS Build post-install hook
# Runs AFTER dependencies are installed, BEFORE bundling

set -e

echo "🔧 EAS Build Post-Install Hook Starting..."
echo "📍 Working directory: $(pwd)"

# ── Shim: metro-cache/private/stores → metro-cache/src/stores ──
# uniwind's compiled metro plugin requires 'metro-cache/private/stores/FileStore'
# but metro-cache 0.83+ moved it to 'src/stores/'. Create a symlink so the
# require resolves correctly during the Bundle JavaScript phase.

# Navigate to monorepo root where node_modules lives
ROOT_DIR="$(pwd)"
if [ -d "../.." ] && [ -f "../../package.json" ] && [ -d "../../node_modules" ]; then
  ROOT_DIR="$(cd ../.. && pwd)"
elif [ -d ".." ] && [ -f "../package.json" ] && [ -d "../node_modules" ]; then
  ROOT_DIR="$(cd .. && pwd)"
fi

echo "📍 Patching metro-cache in: $ROOT_DIR"

# Patch all metro-cache versions in bun's hoisted structure
patched=0
for mc_dir in "$ROOT_DIR"/node_modules/.bun/metro-cache@*/node_modules/metro-cache; do
  if [ -d "$mc_dir/src/stores" ] && [ ! -d "$mc_dir/private/stores" ]; then
    mkdir -p "$mc_dir/private"
    ln -sf "../src/stores" "$mc_dir/private/stores"
    echo "  ✅ Patched: $mc_dir"
    patched=$((patched + 1))
  fi
done

# Also patch hoisted metro-cache at root node_modules
if [ -d "$ROOT_DIR/node_modules/metro-cache/src/stores" ] && [ ! -d "$ROOT_DIR/node_modules/metro-cache/private/stores" ]; then
  mkdir -p "$ROOT_DIR/node_modules/metro-cache/private"
  ln -sf "../src/stores" "$ROOT_DIR/node_modules/metro-cache/private/stores"
  echo "  ✅ Patched: $ROOT_DIR/node_modules/metro-cache"
  patched=$((patched + 1))
fi

# Also check apps/native/node_modules if it exists
if [ -d "node_modules/metro-cache/src/stores" ] && [ ! -d "node_modules/metro-cache/private/stores" ]; then
  mkdir -p "node_modules/metro-cache/private"
  ln -sf "../src/stores" "node_modules/metro-cache/private/stores"
  echo "  ✅ Patched: $(pwd)/node_modules/metro-cache"
  patched=$((patched + 1))
fi

if [ "$patched" -eq 0 ]; then
  echo "⚠️  No metro-cache directories found to patch. Listing node_modules structure:"
  find "$ROOT_DIR/node_modules" -maxdepth 4 -name "metro-cache" -type d 2>/dev/null || true
  # Try a broader search and patch
  find "$ROOT_DIR/node_modules" -path "*/metro-cache/src/stores" -type d 2>/dev/null | while read stores_dir; do
    mc_dir="$(dirname "$(dirname "$stores_dir")")"
    if [ ! -d "$mc_dir/private/stores" ]; then
      mkdir -p "$mc_dir/private"
      ln -sf "../src/stores" "$mc_dir/private/stores"
      echo "  ✅ Patched (fallback): $mc_dir"
    fi
  done
fi

echo "✅ Post-install hook completed ($patched directories patched)"

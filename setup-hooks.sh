#!/bin/bash

echo ""
echo "🔧 Setting up Git pre-push hook..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HOOK_SOURCE=".githooks/pre-push"
HOOK_DEST=".git/hooks/pre-push"

# Check if source hook exists
if [ ! -f "$HOOK_SOURCE" ]; then
    echo "❌ Error: Hook source file not found at $HOOK_SOURCE"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy the hook
echo "📋 Copying pre-push hook to .git/hooks/..."
cp "$HOOK_SOURCE" "$HOOK_DEST"

# Make it executable
chmod +x "$HOOK_DEST"

echo "✅ Pre-push hook installed successfully!"
echo ""
echo "ℹ️  The hook will run automatically before every push."
echo ""
echo "What it does:"
echo "  1. Stashes uncommitted changes"
echo "  2. Pulls latest from origin/master"
echo "  3. Builds the project (npm run build)"
echo "  4. Restores stashed changes"
echo "  5. Allows push only if build succeeds"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

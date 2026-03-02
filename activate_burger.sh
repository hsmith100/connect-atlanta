#!/bin/bash
# Build-A-Server Burger AI Agent Activation Script
# Generated for: connect
# Stack: Nextjs + Fastapi + Postgresql
# Type: Custom Build

set -e  # Exit on error

# Check if script has execute permissions
if [ ! -x "$0" ]; then
    echo "❌ Script is not executable!"
    echo "🔧 Auto-fixing permissions..."
    chmod +x "$0"
    if [ -x "$0" ]; then
        echo "✅ Execute permissions added successfully!"
        echo "🚀 Continuing with activation..."
    else
        echo "❌ Failed to set execute permissions"
        echo "💡 Please run manually: chmod +x activate_burger.sh"
        echo "📝 Then run: bash activate_burger.sh"
        exit 1
    fi
fi

# Validate required files exist
echo "🔍 Validating repository structure..."

if [ ! -f "./ai_devguide_and_readme/custom_build_ai_instructions.md" ]; then
    echo "❌ Error: Required AI instructions file not found!"
    echo "📝 Expected: ./ai_devguide_and_readme/custom_build_ai_instructions.md"
    echo "💡 Please ensure you're in the correct repository directory"
    exit 1
fi

if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.local.yml" ]; then
    echo "❌ Error: No Docker Compose file found!"
    echo "📝 Expected: docker-compose.yml or docker-compose.local.yml"
    echo "💡 This repository may be incomplete"
    exit 1
fi

echo "✅ Repository structure validated"
echo ""
echo "🤖 ==============================================="
echo "🍔 Server Burger AI Agent Activation"
echo "🤖 ==============================================="
echo ""
echo "Your connect DEVELOPMENT ENVIRONMENT is ready!"
echo ""
echo "🎯 IMPORTANT: Focus on THIS repository only!"
echo "- Ignore any other running Docker containers"
echo "- Work within this project directory context"
echo "- Follow the documentation for THIS specific setup"
echo ""
echo "Stack: Nextjs + Fastapi + Postgresql"

echo ""
echo "🎯 CONTEXT: This is a CUSTOM BUILD - focus on helping develop new features in this professional environment"
echo ""
echo "Please read the following file and commit its contents to memory:"
echo "📖 ./ai_devguide_and_readme/custom_build_ai_instructions.md"
echo ""
echo "After reading, focus on helping with THIS repository's development environment:"
echo "1. Confirm you understand THIS repository's architecture"
echo "2. Help set up THIS project's Docker environment (ignore other containers)"
echo "3. Be ready to assist with development tasks for THIS specific stack"

echo ""
echo "🚀 Ready to build something amazing with THIS project!"
echo "🤖 ==============================================="
echo ""
echo "✅ AI Agent activation complete! Your assistant is now ready to help with connect development."

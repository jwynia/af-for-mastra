#!/bin/bash

# Initialize a new git repository for the mastra-af-letta package

echo "🚀 Initializing mastra-af-letta repository..."

# Initialize git if not already done
if [ ! -d .git ]; then
    git init
    echo "✅ Git repository initialized"
else
    echo "ℹ️  Git repository already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run initial build
echo "🔨 Building package..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo "✨ Repository initialization complete!"
echo ""
echo "Next steps:"
echo "1. Update package.json with your author information"
echo "2. Update LICENSE with your copyright information"
echo "3. Create a GitHub repository and push your code"
echo "4. Publish to npm with: npm publish"
echo ""
echo "Remember to update the repository URL in package.json!"
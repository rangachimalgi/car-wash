#!/bin/bash
echo "🧹 Cleaning node_modules and caches..."

# Remove node_modules
rm -rf node_modules

# Remove package-lock.json (optional, but helps with fresh install)
# rm -f package-lock.json

# Clear npm cache
npm cache clean --force

# Clear Expo cache
npx expo start --clear

echo "✅ Cleanup complete! Now run: npm install"

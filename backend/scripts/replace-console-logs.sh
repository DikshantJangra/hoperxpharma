#!/bin/bash

# Script to replace console.log/error/warn with Winston logger
# Usage: ./replace-console-logs.sh

set -e

BACKEND_SRC="/Users/dikshantjangra/Desktop/hoperxpharma/backend/src"

echo "🔍 Finding files with console statements..."
FILES=$(cd "$BACKEND_SRC" && grep -rl "console\." controllers/ services/ repositories/ 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "✅ No console statements found!"
  exit 0
fi

echo "📝 Found console statements in $(echo "$FILES" | wc -l | tr -d ' ') files"
echo ""

# Process each file
for file in $FILES; do
  FULL_PATH="$BACKEND_SRC/$file"
  
  if [ ! -f "$FULL_PATH" ]; then
    continue
  fi
  
  echo "Processing: $file"
  
  # Check if logger is already imported
  if ! grep -q "const logger = require.*logger" "$FULL_PATH"; then
    # Find the right place to add import (after other requires)
    if grep -q "^const.*require" "$FULL_PATH"; then
      # Add after last require statement
      sed -i '' "/^const.*require/a\\
const logger = require('../../config/logger');
" "$FULL_PATH"
    else
      # Add at the top
      sed -i '' "1i\\
const logger = require('../../config/logger');\\

" "$FULL_PATH"
    fi
  fi
  
  # Replace console.log with logger.info
  sed -i '' 's/console\.log(/logger.info(/g' "$FULL_PATH"
  
  # Replace console.error with logger.error
  sed -i '' 's/console\.error(/logger.error(/g' "$FULL_PATH"
  
  # Replace console.warn with logger.warn  
  sed -i '' 's/console\.warn(/logger.warn(/g' "$FULL_PATH"
  
  # Replace console.debug with logger.debug
  sed -i '' 's/console\.debug(/logger.debug(/g' "$FULL_PATH"
  
done

echo ""
echo "✅ Replacement complete!"
echo ""
echo "📊 Verification:"
cd "$BACKEND_SRC"
REMAINING=$(grep -r "console\." controllers/ services/ repositories/ 2>/dev/null | wc -l | tr -d ' ')
echo "Remaining console statements in controllers/services/repositories: $REMAINING"

if [ "$REMAINING" -eq "0" ]; then
  echo "🎉 All console statements replaced!"
else
  echo "⚠️  Some console statements remain (may be in comments or strings)"
fi

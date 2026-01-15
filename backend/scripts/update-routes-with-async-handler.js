#!/usr/bin/env node
/**
 * Script to update route files with asyncHandler wrapper
 * 
 * This script:
 * 1. Adds asyncHandler import if missing
 * 2. Wraps async route handlers with asyncHandler
 * 3. Removes try-catch-next blocks
 */

const fs = require('fs');
const path = require('path');

const routeFiles = [
  'backend/src/routes/v1/medicines.search.routes.js',
  'backend/src/routes/v1/medicines.overlay.routes.js',
  'backend/src/routes/v1/medicines.ingest.routes.js',
  'backend/src/routes/v1/medicines.images.routes.js',
];

function updateRouteFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found, skipping`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add asyncHandler import if missing
  if (!content.includes('asyncHandler')) {
    content = content.replace(
      /const ApiError = require\('\.\.\/\.\.\/utils\/ApiError'\);/,
      `const ApiError = require('../../utils/ApiError');\nconst { asyncHandler } = require('../../middlewares/errorHandler');`
    );
    modified = true;
    console.log('  ✓ Added asyncHandler import');
  }

  // Pattern to match async route handlers with try-catch
  const routePattern = /router\.(get|post|put|delete|patch)\(([^,]+),\s*(?:([^,]+),\s*)?async \(req, res, next\) => \{\s*try \{([\s\S]*?)\} catch \(error\) \{\s*next\(error\);\s*\}\s*\}\);/g;

  let match;
  let replacements = 0;
  
  while ((match = routePattern.exec(content)) !== null) {
    const [fullMatch, method, path, middleware, body] = match;
    
    // Build the replacement
    const middlewareStr = middleware ? `${middleware}, ` : '';
    const replacement = `router.${method}(${path}, ${middlewareStr}asyncHandler(async (req, res) => {${body}}));`;
    
    content = content.replace(fullMatch, replacement);
    replacements++;
    modified = true;
  }

  if (replacements > 0) {
    console.log(`  ✓ Wrapped ${replacements} route handlers with asyncHandler`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ File updated successfully`);
  } else {
    console.log(`  ℹ️  No changes needed`);
  }
}

console.log('🚀 Updating route files with asyncHandler...\n');

routeFiles.forEach(updateRouteFile);

console.log('\n✅ All route files processed!\n');

#!/usr/bin/env node
/**
 * Updates Service Worker version with current timestamp
 * This ensures the service worker cache updates on every build
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');
const timestamp = Date.now().toString();

console.log('Updating Service Worker version...');
console.log('Timestamp:', timestamp);

try {
  let content = fs.readFileSync(swPath, 'utf8');

  // Replace placeholder with actual timestamp
  content = content.replace('{{BUILD_TIMESTAMP}}', timestamp);

  fs.writeFileSync(swPath, content, 'utf8');

  console.log('✅ Service Worker version updated successfully');
  console.log('Cache version will be: v2-' + timestamp);
} catch (error) {
  console.error('❌ Failed to update Service Worker version:', error.message);
  process.exit(1);
}

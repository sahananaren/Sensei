const fs = require('fs');
const path = require('path');

// Read the current app.config.js
const configPath = path.join(__dirname, '..', 'app.config.js');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract current version code
const versionCodeMatch = configContent.match(/versionCode:\s*(\d+)/);
const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1]) : 14;

// Increment version code
const newVersionCode = currentVersionCode + 1;

// Replace version code in the file
const updatedContent = configContent.replace(
  /versionCode:\s*\d+/,
  `versionCode: ${newVersionCode}`
);

// Write back to file
fs.writeFileSync(configPath, updatedContent);

console.log(`✅ Version code updated from ${currentVersionCode} to ${newVersionCode}`); 
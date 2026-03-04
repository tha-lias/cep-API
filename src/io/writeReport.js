const fs = require('fs');
const path = require('path');

function writeReport(report, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
}

module.exports = { writeReport };

const fs = require('fs');
const path = require('path');

function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv(data, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const headers = ['postId', 'title', 'authorName', 'authorEmail', 'cep', 'city', 'state'];
  const headerLine = headers.join(',');

  const lines = data.map((item) =>
    headers.map((h) => escapeCsvField(item[h])).join(',')
  );

  const csv = [headerLine, ...lines].join('\n');
  fs.writeFileSync(filePath, csv, 'utf-8');
}

module.exports = { writeCsv, escapeCsvField };

#!/usr/bin/env node
const https = require('https');

const url = process.env.BACKEND_URL || 'https://hoperxpharma.onrender.com';

https.get(`${url}/api/v1/health`, (res) => {
  console.log(`Status: ${res.statusCode}`);
  process.exit(res.statusCode === 200 ? 0 : 1);
}).on('error', (err) => {
  console.error('Backend is DOWN:', err.message);
  process.exit(1);
});

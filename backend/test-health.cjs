// Quick health check test
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

console.log('Testing backend health endpoint...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Backend is working');
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log('❌ Backend is not working');
  console.log('Error:', err.message);
  console.log('Make sure the backend server is running: npm run dev');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Request timed out');
  req.destroy();
  process.exit(1);
});

req.end();

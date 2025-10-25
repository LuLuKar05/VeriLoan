// Minimal test server
import express from 'express';

const app = express();
const PORT = 8000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', test: true });
});

const server = app.listen(PORT, () => {
  console.log(`Test server listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

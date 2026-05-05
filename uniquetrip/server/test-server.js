// Minimal test server
const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', message: 'Test server running!' });
});

const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`✅ Test server listening on port ${PORT}`);
    console.log(`   Process ID: ${process.pid}`);
    console.log(`   Try: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    process.exit(1);
});

// Keep alive
console.log('Server script running...');

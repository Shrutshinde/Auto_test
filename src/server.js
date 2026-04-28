const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Endpoint to run tests
app.post('/api/run-tests', (req, res) => {
    const { urls, apis } = req.body;
    
    // Build arguments for cli.js
    const args = [path.join(__dirname, 'cli.js')];
    
    if (urls && urls.length > 0) {
        args.push('--url', ...urls);
    }
    
    if (apis && apis.length > 0) {
        apis.forEach(api => {
            args.push('--api', api.endpoint);
            if (api.method) args.push('--methods', api.method);
            if (api.body) args.push('--body', api.body);
        });
    }

    // Set up SSE for real-time console output
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const child = spawn('node', args, {
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env }
    });

    child.stdout.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message: data.toString() })}\n\n`);
    });

    child.stderr.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: data.toString() })}\n\n`);
    });

    child.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 AutoTest Dashboard running at: http://localhost:${PORT}\n`);
});

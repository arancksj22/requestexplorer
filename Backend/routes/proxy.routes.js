const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// Proxy endpoint to handle external API requests
router.all('/', async (req, res) => {
  console.log('🔵 Proxy received request:', {
    url: req.body.url,
    method: req.body.method,
    headers: req.body.headers
  });
  
  try {
    const { url, method, headers, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Parse URL
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    console.log('Making external request to:', url);

    // Prepare request options
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method || 'GET',
      headers: headers || {}
    };

    // Remove host header to avoid conflicts
    delete options.headers['host'];
    delete options.headers['Host'];

    const startTime = Date.now();

    // Make the request
    const proxyReq = httpModule.request(options, (proxyRes) => {
      const chunks = [];
      
      proxyRes.on('data', (chunk) => {
        chunks.push(chunk);
      });

      proxyRes.on('end', () => {
        const duration = Date.now() - startTime;
        const responseBody = Buffer.concat(chunks).toString('utf8');
        
        // Try to parse as JSON, otherwise send as text
        let parsedBody;
        try {
          parsedBody = JSON.parse(responseBody);
        } catch (e) {
          parsedBody = responseBody;
        }

        console.log('External API responded with status:', proxyRes.statusCode);
        
        // Send response back to client
        res.status(proxyRes.statusCode).json({
          status: proxyRes.statusCode,
          statusText: proxyRes.statusMessage,
          headers: proxyRes.headers,
          body: parsedBody,
          duration: duration,
          timestamp: Date.now()
        });
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).json({ 
        error: 'Request failed',
        message: error.message,
        timestamp: Date.now()
      });
    });

    // Send body if present
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      proxyReq.write(bodyString);
    }

    proxyReq.end();

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request',
      message: error.message 
    });
  }
});

module.exports = router;

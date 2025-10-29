const express = require('express');
const cors = require('cors');
require('dotenv').config();

const database = require('./services/database.service');
const authRoutes = require('./routes/auth.routes');
const historyRoutes = require('./routes/history.routes');
const requestsRoutes = require('./routes/requests.routes');
const proxyRoutes = require('./routes/proxy.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await database.initialize();
    await database.cleanExpiredSessions();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });

    // Clean expired sessions every hour
    setInterval(async () => {
      const count = await database.cleanExpiredSessions();
      console.log(`Cleaned ${count} expired sessions`);
    }, 60 * 60 * 1000);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

startServer();

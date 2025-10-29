const express = require('express');
const router = express.Router();
const historyService = require('../services/history.service');
const { authenticateToken } = require('../middleware/auth.middleware');

// Optional authentication - use guest user (id: 1) if not authenticated
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // Use guest user
    req.user = { userId: 1 };
    return next();
  }
  // If token provided, validate it
  authenticateToken(req, res, next);
};

// Save request to history
router.post('/', optionalAuth, async (req, res) => {
  try {
    console.log('Saving history:', req.body);
    
    // Map frontend field names to backend expected names
    const requestData = {
      url: req.body.url,
      method: req.body.method,
      status: req.body.statusCode || req.body.status,
      durationMs: req.body.durationMs || req.body.duration,
      timestamp: req.body.timestamp || req.body.ts || Date.now()
    };
    
    const result = await historyService.saveRequest(req.user.userId, requestData);
    console.log('History saved:', result);
    res.json(result);
  } catch (error) {
    console.error('Save history error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get request history
router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('Fetching history for user:', req.user.userId);
    const options = {
      limit: parseInt(req.query.limit) || 1000,
      offset: parseInt(req.query.offset) || 0
    };
    const history = await historyService.getHistory(req.user.userId, options);
    console.log('Returning', history.length, 'history entries');
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get filtered history
router.get('/filter', optionalAuth, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate ? parseInt(req.query.startDate) : undefined,
      endDate: req.query.endDate ? parseInt(req.query.endDate) : undefined,
      method: req.query.method,
      minStatus: req.query.minStatus ? parseInt(req.query.minStatus) : undefined,
      maxStatus: req.query.maxStatus ? parseInt(req.query.maxStatus) : undefined
    };
    const history = await historyService.getFilteredHistory(req.user.userId, filters);
    res.json(history);
  } catch (error) {
    console.error('Filter history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get history analytics
router.get('/analytics', optionalAuth, async (req, res) => {
  try {
    const startDate = req.query.startDate ? parseInt(req.query.startDate) : 0;
    const analytics = await historyService.getAnalytics(req.user.userId, startDate);
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear history
router.delete('/', optionalAuth, async (req, res) => {
  try {
    const result = await historyService.clearHistory(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete specific history entry
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const historyId = parseInt(req.params.id);
    const result = await historyService.deleteEntry(req.user.userId, historyId);
    res.json(result);
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;

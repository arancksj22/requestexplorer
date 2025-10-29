const express = require('express');
const router = express.Router();
const database = require('../services/database.service');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Save a request
router.post('/', async (req, res) => {
  try {
    const { name, url, method, headers, body, folder } = req.body;

    if (!name || !url || !method) {
      return res.status(400).json({ error: 'Name, URL, and method are required' });
    }

    const result = await database.saveRequest(
      req.user.userId,
      name,
      url,
      method,
      headers,
      body,
      folder
    );

    res.status(201).json({ success: true, requestId: result.requestId });
  } catch (error) {
    console.error('Save request error:', error);
    res.status(500).json({ error: 'Failed to save request' });
  }
});

// Get all saved requests
router.get('/', async (req, res) => {
  try {
    const folder = req.query.folder;
    const requests = await database.getSavedRequests(req.user.userId, folder);
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get single saved request
router.get('/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await database.getSavedRequest(req.user.userId, requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Update saved request
router.put('/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const updates = req.body;

    const result = await database.updateSavedRequest(req.user.userId, requestId, updates);

    if (!result) {
      return res.status(404).json({ error: 'Request not found or no changes made' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Delete saved request
router.delete('/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const result = await database.deleteSavedRequest(req.user.userId, requestId);

    if (!result) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// Get user folders
router.get('/folders/list', async (req, res) => {
  try {
    const folders = await database.getUserFolders(req.user.userId);
    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

module.exports = router;

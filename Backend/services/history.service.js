const database = require('./database.service');

class HistoryService {
  // Save request to history
  async saveRequest(userId, requestData) {
    const { url, method, status, durationMs, timestamp } = requestData;

    if (!url || !method || status === undefined || !durationMs || !timestamp) {
      throw new Error('Missing required fields');
    }

    const result = await database.saveRequestHistory(
      userId,
      url,
      method,
      status,
      durationMs,
      timestamp
    );

    return {
      success: true,
      historyId: result.historyId
    };
  }

  // Get request history
  async getHistory(userId, options = {}) {
    const limit = options.limit || 1000;
    const offset = options.offset || 0;

    try {
      console.log('Getting history for user:', userId, 'options:', options);
      const history = await database.getRequestHistory(userId, limit, offset);
      console.log('Retrieved', history.length, 'history entries');
      return history;
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  }

  // Get filtered history
  async getFilteredHistory(userId, filters) {
    const history = await database.getFilteredHistory(userId, filters);
    return history;
  }

  // Get analytics
  async getAnalytics(userId, startDate = 0) {
    const analytics = await database.getHistoryAnalytics(userId, startDate);
    
    // Process analytics data
    const summary = {
      totalRequests: 0,
      successRate: 0,
      errorRate: 0,
      avgDuration: 0,
      byMethod: {}
    };

    analytics.forEach(row => {
      summary.totalRequests += parseInt(row.totalRequests);
      summary.byMethod[row.method] = {
        total: parseInt(row.totalRequests),
        success: parseInt(row.successCount),
        errors: parseInt(row.errorCount),
        avgDuration: parseFloat(row.avgDuration),
        minDuration: parseInt(row.minDuration),
        maxDuration: parseInt(row.maxDuration)
      };
    });

    if (summary.totalRequests > 0) {
      const totalSuccess = analytics.reduce((sum, row) => sum + parseInt(row.successCount), 0);
      const totalErrors = analytics.reduce((sum, row) => sum + parseInt(row.errorCount), 0);
      const avgDurations = analytics.map(row => parseFloat(row.avgDuration));
      
      summary.successRate = (totalSuccess / summary.totalRequests) * 100;
      summary.errorRate = (totalErrors / summary.totalRequests) * 100;
      summary.avgDuration = avgDurations.reduce((a, b) => a + b, 0) / avgDurations.length;
    }

    return summary;
  }

  // Clear history
  async clearHistory(userId) {
    await database.clearHistory(userId);
    return {
      success: true,
      message: 'History cleared successfully'
    };
  }

  // Delete specific entry
  async deleteEntry(userId, historyId) {
    const deleted = await database.deleteHistoryEntry(userId, historyId);
    
    if (!deleted) {
      throw new Error('History entry not found');
    }

    return {
      success: true,
      message: 'History entry deleted'
    };
  }
}

const historyService = new HistoryService();
module.exports = historyService;

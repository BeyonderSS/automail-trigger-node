const express = require('express');
const processPendingLoops = require('../service/processPendingLoops');
const router = express.Router();

// API endpoint to process a specific loop by ID
router.post('/process-loop/:loopId', async (req, res) => {
  const { loopId } = req.params;

  if (!loopId) {
    return res.status(400).json({ error: 'Loop ID is required' });
  }

  try {
    console.log(`[API] Triggering email processing for loop ${loopId}`);
    await processPendingLoops(loopId);
    return res.status(200).json({ success: true, message: `Emails for loop ${loopId} are being processed.` });
  } catch (error) {
    console.error(`[API ERROR] Failed to process loop ${loopId}:`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Optional: Endpoint to process all in-progress loops
router.post('/process-all-loops', async (req, res) => {
  try {
    console.log(`[API] Triggering email processing for all in-progress loops`);
    await processPendingLoops(); // No loopId = process all
    return res.status(200).json({ success: true, message: `All in-progress loops are being processed.` });
  } catch (error) {
    console.error(`[API ERROR] Failed to process loops:`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

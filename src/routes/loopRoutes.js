const express = require('express');
const router = express.Router();
const processPendingLoops = require('../service/processPendingLoops');

// API endpoint to start processing a specific loop by ID
router.post('/process-loop/:loopId', async (req, res) => {
  const { loopId } = req.params;

  if (!loopId) {
    return res.status(400).json({ error: 'Loop ID is required' });
  }

  try {
    console.log(`[API] Triggering email processing for loop ${loopId}`);
    
    // Start the service in the background
    processPendingLoops(loopId).catch((error) => {
      console.error(`[Background Service Error] Failed to process loop ${loopId}:`, error.message);
    });

    // Respond immediately without waiting for the service to finish
    return res.status(200).json({
      success: true,
      message: `Processing for loop ${loopId} has started. It may take some time to complete.`
    });
  } catch (error) {
    console.error(`[API ERROR] Failed to trigger processing for loop ${loopId}:`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Optional: Endpoint to process all in-progress loops
router.post('/process-all-loops', async (req, res) => {
  try {
    console.log(`[API] Triggering email processing for all in-progress loops`);
    
    // Start the service in the background
    processPendingLoops().catch((error) => {
      console.error(`[Background Service Error] Failed to process all loops:`, error.message);
    });

    // Respond immediately without waiting for the service to finish
    return res.status(200).json({
      success: true,
      message: `Processing for all in-progress loops has started. It may take some time to complete.`
    });
  } catch (error) {
    console.error(`[API ERROR] Failed to trigger processing for all loops:`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

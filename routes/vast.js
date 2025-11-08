const express = require('express');
const router = express.Router();
const {
    saveVastEvent,
    getVastEvents,
    getVastStats,
    healthCheck
} = require('../controllers/vastController');

router.post('/event', saveVastEvent);
router.get('/event', saveVastEvent);
router.get('/events', getVastEvents);
router.get('/stats', getVastStats);
router.get('/health', healthCheck);

module.exports = router;
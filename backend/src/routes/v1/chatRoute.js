const express = require('express');
const chatController = require('../../controllers/chatController');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists

const router = express.Router();

router.post('/prompt/send', chatController.sendPrompt);

module.exports = router;

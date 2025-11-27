const httpStatus = require('http-status');
const asyncHandler = require('../middlewares/asyncHandler');
const chatService = require('../services/chatService');

const sendPrompt = asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Please send a valid prompt' });
    }

    const response = await chatService.chatWithGemini(prompt);
    res.status(httpStatus.OK).json({ response });
});

module.exports = {
    sendPrompt
};

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/MessageController');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// Get chat history between two users
router.get('/history/:userId/:receiverId', auth, messageController.getChatHistory);

// Delete a message
router.delete('/:messageId/:userId', auth, messageController.deleteMessage);

// Get recent chats for a user
router.get('/recent/:userId', auth, messageController.getRecentChats);

module.exports = router;

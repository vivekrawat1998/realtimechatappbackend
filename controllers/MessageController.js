const messageModel = require("../Models/Message");
const userModel = require("../Models/Usermodal");

// Get chat history between two users
exports.getChatHistory = async (req, res) => {
    try {
        const { userId, receiverId } = req.params;
        
        const messages = await messageModel.find({
            $or: [
                { sender: userId, receiver: receiverId },
                { sender: receiverId, receiver: userId }
            ]
        })
        .sort({ timestamp: 1 })
        .populate('sender', 'fullname')
        .populate('receiver', 'fullname')
        .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'fullname' }
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId, userId } = req.params;
        
        const message = await messageModel.findOne({
            _id: messageId,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({ message: 'Message not found or unauthorized' });
        }

        await messageModel.findByIdAndDelete(messageId);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message' });
    }
};

// Get all recent chats for a user
exports.getRecentChats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const recentMessages = await messageModel.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            }
        ]);

        // Populate user details
        const populatedChats = await userModel.populate(recentMessages, {
            path: '_id',
            select: 'fullname email'
        });

        res.status(200).json(populatedChats);
    } catch (error) {
        console.error('Error fetching recent chats:', error);
        res.status(500).json({ message: 'Error fetching recent chats' });
    }
};

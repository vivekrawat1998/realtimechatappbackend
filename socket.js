const socketIo = require('socket.io');
const userModel = require('./Models/Usermodal');
const messageModel = require('./Models/Message');

let io;
const onlineUsers = new Map(); // Add this to track online users

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Handle user joining
        socket.on('join', async (data) => {
            const { userId } = data;
            
            try {
                // Find user from database to get full user details
                const user = await userModel.findById(userId);
                if (user) {
                    // Store user's online status with full details
                    onlineUsers.set(userId, {
                        socketId: socket.id,
                        userId: userId,
                        username: user.fullname, // Use fullname from database
                        email: user.email
                    });

                    // Update user's socket ID in database
                    await userModel.findByIdAndUpdate(userId, { 
                        socketId: socket.id,
                        isOnline: true 
                    });

                    // Broadcast updated online users list
                    const onlineUsersList = Array.from(onlineUsers.values());
                    io.emit('onlineUsers', onlineUsersList);
                }
            } catch (error) {
                console.error('Error in join event:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            // Find user by socket ID
            for (const [userId, userData] of onlineUsers.entries()) {
                if (userData.socketId === socket.id) {
                    onlineUsers.delete(userId);
                    // Update user's online status in database
                    await userModel.findByIdAndUpdate(userId, { 
                        isOnline: false,
                        lastSeen: new Date()
                    });
                    break;
                }
            }
            // Broadcast updated online users list
            const onlineUsersList = Array.from(onlineUsers.values());
            io.emit('onlineUsers', onlineUsersList);
        });

        socket.on('send-message', async (messageData) => {
            console.log('Received message data:', messageData);
            const { senderId, receiverId, content, media } = messageData;
            
            try {
                // Create the message
                const newMessage = await messageModel.create({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    media,
                    status: 'Sent',  // Add initial status
                    readAt: null     // Add read timestamp
                });

                // Find receiver's socket ID
                const receiverUser = await userModel.findById(receiverId);
                const senderUser = await userModel.findById(senderId);
                
                // Send to receiver if online
                if (receiverUser && receiverUser.socketId) {
                    io.to(receiverUser.socketId).emit('receive-message', {
                        message: {
                            sender: senderId,
                            receiver: receiverId,
                            content,
                            createdAt: new Date(),
                            _id: newMessage._id
                        }
                    });
                }

                // Send confirmation to sender
                socket.emit('message-sent', {
                    success: true,
                    messageId: newMessage._id
                });

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

        // Add new event for fetching reply thread
        socket.on('fetch-reply-thread', async ({ messageId }) => {
            try {
                const message = await messageModel.findById(messageId)
                    .populate('replies')
                    .populate('replyTo');
                
                socket.emit('reply-thread', {
                    originalMessage: message,
                    replies: message.replies
                });
            } catch (error) {
                console.error('Error fetching reply thread:', error);
                socket.emit('message-error', { error: 'Failed to fetch reply thread' });
            }
        });
        

        socket.on('message-read', async ({ messageId, readerId }) => {
            try {
                const message = await messageModel.findByIdAndUpdate(
                    messageId,
                    { 
                        status: 'Read',
                        readAt: new Date()
                    },
                    { new: true }
                );
                
                // Notify sender that message was read
                const senderSocket = onlineUsers.get(message.sender.toString());
                if (senderSocket) {
                    io.to(senderSocket.socketId).emit('message-status-update', {
                        messageId,
                        status: 'Read',
                        readAt: message.readAt
                    });
                }
            } catch (error) {
                console.error('Error updating message status:', error);
            }
        });

        socket.on('sendMessage', async (messageData) => {
            const { content, to, from, media } = messageData;
            
            try {
                // Create new message in database
                const newMessage = await messageModel.create({
                    sender: from,
                    receiver: to,
                    content: content,
                    media: media, // Add media field
                    timestamp: new Date()
                });

                // Get receiver's socket id from onlineUsers
                const receiverSocketData = onlineUsers.get(to);
                
                if (receiverSocketData) {
                    // Send to receiver
                    io.to(receiverSocketData.socketId).emit('receiveMessage', {
                        content,
                        from,
                        to,
                        media, // Include media in the emitted message
                        messageId: newMessage._id,
                        timestamp: newMessage.timestamp
                    });
                }

                // Send back to sender for confirmation
                socket.emit('messageSent', {
                    content,
                    to,
                    media, // Include media in the confirmation
                    messageId: newMessage._id,
                    timestamp: newMessage.timestamp
                });

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };
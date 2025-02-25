const socketIo = require('socket.io');
const userModel = require('./Models/Usermodal');
const messageModel = require('./Models/Message');

let io;
const onlineUsers = new Map(); 

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join', async (data) => {
            const { userId } = data;
            
            try {
                const user = await userModel.findById(userId);
                if (user) {
                    onlineUsers.set(userId, {
                        socketId: socket.id,
                        userId: userId,
                        username: user.fullname, 
                        email: user.email
                    });

                    await userModel.findByIdAndUpdate(userId, { 
                        socketId: socket.id,
                        isOnline: true 
                    });

                    const onlineUsersList = Array.from(onlineUsers.values());
                    io.emit('onlineUsers', onlineUsersList);
                }
            } catch (error) {
                console.error('Error in join event:', error);
            }
        });

        socket.on('disconnect', async () => {
            for (const [userId, userData] of onlineUsers.entries()) {
                if (userData.socketId === socket.id) {
                    onlineUsers.delete(userId);
                    await userModel.findByIdAndUpdate(userId, { 
                        isOnline: false,
                        lastSeen: new Date()
                    });
                    break;
                }
            }
            const onlineUsersList = Array.from(onlineUsers.values());
            io.emit('onlineUsers', onlineUsersList);
        });

        socket.on('send-message', async (messageData) => {
            console.log('Received message data:', messageData);
            const { senderId, receiverId, content, media } = messageData;
            
            try {
                const newMessage = await messageModel.create({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    media,
                    status: 'Sent',  
                    readAt: null    
                });

                const receiverUser = await userModel.findById(receiverId);
                const senderUser = await userModel.findById(senderId);
                
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

                socket.emit('message-sent', {
                    success: true,
                    messageId: newMessage._id
                });

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

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
                const newMessage = await messageModel.create({
                    sender: from,
                    receiver: to,
                    content: content,
                    media: media, 
                    timestamp: new Date()
                });

                const receiverSocketData = onlineUsers.get(to);
                
                if (receiverSocketData) {
                    io.to(receiverSocketData.socketId).emit('receiveMessage', {
                        content,
                        from,
                        to,
                        media, 
                        messageId: newMessage._id,
                        timestamp: newMessage.timestamp
                    });
                }

                socket.emit('messageSent', {
                    content,
                    to,
                    media, 
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
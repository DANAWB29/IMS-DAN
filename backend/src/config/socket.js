'use strict';

const { Server } = require('socket.io');
const env = require('./env');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: env.FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // Join user's personal room using their userId
        socket.on('join', (userId) => {
            socket.join(`user:${userId}`);
            logger.info(`Socket ${socket.id} joined room user:${userId}`);
        });

        // Join admin broadcast room
        socket.on('joinAdmin', () => {
            socket.join('admin');
            logger.info(`Socket ${socket.id} joined admin room`);
        });

        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized. Call initSocket first.');
    return io;
};

// Send notification to specific user
const sendToUser = (userId, event, data) => {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
};

// Broadcast to all admins
const sendToAdmins = (event, data) => {
    if (!io) return;
    io.to('admin').emit(event, data);
};

// Broadcast to everyone
const broadcast = (event, data) => {
    if (!io) return;
    io.emit(event, data);
};

module.exports = { initSocket, getIO, sendToUser, sendToAdmins, broadcast };

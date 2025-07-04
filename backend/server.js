require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const logRoutes = require('./routes/logs');
const { setupSocket } = require('./socket/socketHandlers');
 

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

const allowedOrigins = [
  'https://collaborative-todo-board-2eaq.vercel.app',
  'http://localhost:3000'
];

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);

// Socket.IO setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});
setupSocket(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeSocketHandlers } = require('./sockets');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

// Initialize Socket.IO event handlers
initializeSocketHandlers(io);

// API route to create a room
app.post('/api/createRoom', (req, res) => {
  try {
    const roomManager = require('./roomManager');
    const room = roomManager.createRoom();
    res.status(201).json({ success: true, roomCode: room.code });
  } catch (error) {
    console.error('Error creating room via API:', error);
    res.status(500).json({ success: false, error: 'Failed to create room' });
  }
});

// Basic API route
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
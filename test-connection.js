const { io } = require('socket.io-client');

console.log('Testing Socket.IO connection to server...');

// Connect to the Socket.IO server
const socket = io('http://localhost:3001');

// Set up event listeners
socket.on('connect', () => {
  console.log('Connected to server successfully!');
  console.log('Socket ID:', socket.id);
  
  // Send a test message
  console.log('Sending a test message...');
  socket.emit('message', { text: 'Hello from test script!' });
  
  // Disconnect after 3 seconds
  setTimeout(() => {
    console.log('Test completed. Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('message', (message) => {
  console.log('Received message:', message);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  process.exit(1);
});

// Set a timeout for the connection attempt
setTimeout(() => {
  if (!socket.connected) {
    console.error('Failed to connect to server within timeout period');
    process.exit(1);
  }
}, 5000); 

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle new connections
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Broadcast client count
  io.emit('clients-total', io.engine.clientsCount);

  // Handle message
  socket.on('message', (data) => {
    socket.broadcast.emit('chat-message', data);
  });

  // Handle file message
  socket.on('file-message', (data) => {
    socket.broadcast.emit('file-message', data); // Broadcast the file data to others
  });

  // Handle typing feedback
  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    io.emit('clients-total', io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));



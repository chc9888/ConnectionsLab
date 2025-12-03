const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve static files (your HTML, CSS, JS)
app.use(express.static('public'));

// Store connected users and their instruments
let users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // When a user selects an instrument
    socket.on('selectInstrument', (instrument) => {
        users[socket.id] = { instrument: instrument };
        console.log(`User ${socket.id} selected ${instrument}`);
        
        // Send updated user list to everyone
        io.emit('updateUsers', users);
    });
    
    // When a user plays a note
    socket.on('playNote', (data) => {
        // Broadcast to all other clients (not sender)
        socket.broadcast.emit('remotePlayNote', {
            userId: socket.id,
            instrument: data.instrument,
            note: data.note,
            volume: data.volume,
            zone: data.zone
        });
    });
    
    // When a user stops a note
    socket.on('stopNote', (data) => {
        socket.broadcast.emit('remoteStopNote', {
            userId: socket.id,
            instrument: data.instrument,
            note: data.note
        });
    });
    
    // When user disconnects
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete users[socket.id];
        io.emit('updateUsers', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
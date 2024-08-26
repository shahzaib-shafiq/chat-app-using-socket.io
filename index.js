const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
//WORKING CHAT SOCKETS
const app = express();
const server = createServer(app);
//const io = new Server(server);


//This feature will temporarily store all the events that are sent by the server and will try to restore the state of a client when it reconnects:
const io = new Server(server, {
    connectionStateRecovery: {}
});

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// io.on('connection', (socket) => {
//     console.log('a user connected');
// });

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });
});


//In order to send an event to everyone, Socket.IO gives us the io.emit() method.
// io.emit('hello', 'world');


//If you want to send a message to everyone except for a certain emitting socket, we have the broadcast flag for emitting from that socket:
io.on('connection', (socket) => {
    socket.broadcast.emit('hi');
});

// io.on('connection', (socket) => {
//     socket.on('chat message', (msg) => {
//         io.emit('chat message', msg);
//     });
// });


// In this case, for the sake of simplicity we’ll send the message to everyone, including the sender

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});


server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
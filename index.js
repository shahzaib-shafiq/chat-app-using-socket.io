// const express = require('express');
// const { createServer } = require('node:http');
// const { join } = require('node:path');
// const { Server } = require('socket.io');
// //WORKING CHAT SOCKETS
// const app = express();
// const server = createServer(app);
// //const io = new Server(server);


// //This feature will temporarily store all the events that are sent by the server and will try to restore the state of a client when it reconnects:
// const io = new Server(server, {
//     connectionStateRecovery: {}
// });

// const sqlite3 = require('sqlite3');
// const { open } = require('sqlite');


// app.get('/', (req, res) => {
//     res.sendFile(join(__dirname, 'index.html'));
// });

// // io.on('connection', (socket) => {
// //     console.log('a user connected');
// // });

// io.on('connection', (socket) => {
//     console.log('a user connected');
//     socket.on('disconnect', () => {
//         console.log('user disconnected');
//     });
// });

// io.on('connection', (socket) => {
//     socket.on('chat message', (msg) => {
//         console.log('message: ' + msg);
//     });
// });


// //In order to send an event to everyone, Socket.IO gives us the io.emit() method.
// // io.emit('hello', 'world');


// //If you want to send a message to everyone except for a certain emitting socket, we have the broadcast flag for emitting from that socket:
// io.on('connection', (socket) => {
//     socket.broadcast.emit('hi');
// });

// // io.on('connection', (socket) => {
// //     socket.on('chat message', (msg) => {
// //         io.emit('chat message', msg);
// //     });
// // });


// // In this case, for the sake of simplicity we’ll send the message to everyone, including the sender

// io.on('connection', (socket) => {
//     socket.on('chat message', (msg) => {
//         io.emit('chat message', msg);
//     });
// });


// server.listen(3000, () => {
//     console.log('server running at http://localhost:3000');
// });

const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function main() {
    // open the database file
    const db = await open({
        filename: 'chat.db',
        driver: sqlite3.Database
    });

    // create our 'messages' table (you can ignore the 'client_offset' column for now)
    await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
  `);

    const app = express();
    const server = createServer(app);
    const io = new Server(server, {
        connectionStateRecovery: {}
    });

    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, 'index.html'));
    });

    // io.on('connection', (socket) => {
    //     socket.on('chat message', async (msg) => {
    //         let result;
    //         try {
    //             // store the message in the database
    //             result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
    //         } catch (e) {
    //             // TODO handle the failure
    //             return;
    //         }
    //         // include the offset with the message
    //         io.emit('chat message', msg, result.lastID);
    //     });
    // });


    io.on('connection', async (socket) => {
        socket.on('chat message', async (msg) => {
            let result;
            try {
                result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
            } catch (e) {
                // TODO handle the failure
                return;
            }
            io.emit('chat message', msg, result.lastID);
        });

        if (!socket.recovered) {
            // if the connection state recovery was not successful
            try {
                await db.each('SELECT id, content FROM messages WHERE id > ?',
                    [socket.handshake.auth.serverOffset || 0],
                    (_err, row) => {
                        socket.emit('chat message', row.content, row.id);
                    }
                )
            } catch (e) {
                // something went wrong
            }
        }
    });

    server.listen(3000, () => {
        console.log('server running at http://localhost:3000');
    });
}

main();
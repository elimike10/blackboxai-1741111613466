const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('.'));

// Store connected players with timestamps
const players = new Map();

// Cleanup inactive players every minute
setInterval(() => {
    const now = Date.now();
    for (const [id, player] of players.entries()) {
        if (now - player.lastUpdate > 10000) { // Remove if inactive for 10 seconds
            players.delete(id);
            io.emit('playerLeave', id);
        }
    }
}, 60000);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle player join
    socket.on('playerJoin', (playerData) => {
        console.log('Player joined:', socket.id);
        players.set(socket.id, {
            id: socket.id,
            x: playerData.x,
            y: playerData.y,
            health: playerData.health,
            lastUpdate: Date.now()
        });

        // Send existing players to the new player
        const existingPlayers = Array.from(players.values());
        socket.emit('existingPlayers', existingPlayers);

        // Broadcast new player to all other players
        socket.broadcast.emit('playerJoined', players.get(socket.id));
    });

    // Handle player updates
    socket.on('playerUpdate', (playerData) => {
        if (players.has(socket.id)) {
            players.set(socket.id, {
                ...players.get(socket.id),
                ...playerData,
                lastUpdate: Date.now()
            });
            socket.broadcast.emit('playerUpdate', {
                id: socket.id,
                ...playerData
            });
        }
    });

    // Handle shooting events
    socket.on('shootEvent', (data) => {
        socket.broadcast.emit('shootEvent', {
            id: socket.id,
            ...data
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        players.delete(socket.id);
        io.emit('playerLeave', socket.id);
    });
});

const PORT = process.env.PORT || 3001;  // Changed to port 3001

// Error handling for server startup
const startServer = () => {
    try {
        http.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        }).on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
                setTimeout(() => {
                    http.listen(PORT + 1, () => {
                        console.log(`Server running on port ${PORT + 1}`);
                    });
                }, 1000);
            } else {
                console.error('Server error:', error);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();

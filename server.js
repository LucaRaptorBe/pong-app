const { createServer } = require('http');
const { Server } = require('socket.io');

// Stocker les rooms actives
const rooms = new Map();

// Route de santé pour Render
const httpServer = createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Pong Socket.IO Server',
      activeRooms: rooms.size
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Configuration CORS pour production et développement
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.FRONTEND_URL // URL de production
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Créer une room (hôte)
  socket.on('create-room', (callback) => {
    const roomCode = generateRoomCode();
    socket.join(roomCode);

    rooms.set(roomCode, {
      host: socket.id,
      guest: null,
      ready: false,
      augmentSelection: {
        hostSelected: false,
        guestSelected: false
      }
    });

    console.log(`🎮 Room ${roomCode} created by ${socket.id}`);
    callback({ success: true, roomCode });
  });

  // Rejoindre une room (invité)
  socket.on('join-room', (roomCode, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.guest) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    socket.join(roomCode);
    room.guest = socket.id;
    room.ready = true;

    console.log(`🎮 ${socket.id} joined room ${roomCode}`);

    // Notifier l'hôte que quelqu'un a rejoint
    io.to(room.host).emit('player-joined', { guestId: socket.id });

    callback({ success: true, roomCode, isHost: false });
  });

  // Relayer les mouvements de paddle
  socket.on('paddle-move', (data) => {
    socket.broadcast.to(data.roomCode).emit('paddle-move', {
      y: data.y,
      isHost: data.isHost
    });
  });

  // Relayer l'état du jeu (seulement l'hôte)
  socket.on('game-state', (data) => {
    socket.broadcast.to(data.roomCode).emit('game-state', data.state);
  });

  // Démarrer le jeu
  socket.on('start-game', (roomCode) => {
    io.to(roomCode).emit('start-game');
  });

  // Démarrer un nouveau round
  socket.on('start-round', (roomCode) => {
    io.to(roomCode).emit('start-round');
  });

  // Game over
  socket.on('game-over', (data) => {
    io.to(data.roomCode).emit('game-over', {
      winner: data.winner,
      score1: data.score1,
      score2: data.score2
    });
  });

  // Gérer les sélections d'augments
  socket.on('augment-selected', (data) => {
    const room = rooms.get(data.roomCode);
    if (!room) return;

    // Enregistrer qui a sélectionné
    if (data.isHost) {
      room.augmentSelection.hostSelected = true;
    } else {
      room.augmentSelection.guestSelected = true;
    }

    // Envoyer la sélection à l'adversaire
    socket.broadcast.to(data.roomCode).emit('augment-selected', {
      augment: data.augment,
      isHost: data.isHost
    });

    // Si les deux ont sélectionné, notifier tout le monde de continuer
    if (room.augmentSelection.hostSelected && room.augmentSelection.guestSelected) {
      io.to(data.roomCode).emit('both-players-selected');
      // Reset pour le prochain round
      room.augmentSelection.hostSelected = false;
      room.augmentSelection.guestSelected = false;
    }
  });

  // Gérer les sélections de sorts
  socket.on('ability-selected', (data) => {
    const room = rooms.get(data.roomCode);
    if (!room) return;

    // Enregistrer qui a sélectionné
    if (data.isHost) {
      room.augmentSelection.hostSelected = true;
    } else {
      room.augmentSelection.guestSelected = true;
    }

    // Envoyer la sélection à l'adversaire
    socket.broadcast.to(data.roomCode).emit('ability-selected', {
      ability: data.ability,
      isHost: data.isHost
    });

    // Si les deux ont sélectionné, notifier tout le monde de continuer
    if (room.augmentSelection.hostSelected && room.augmentSelection.guestSelected) {
      io.to(data.roomCode).emit('both-players-selected');
      // Reset pour le prochain round
      room.augmentSelection.hostSelected = false;
      room.augmentSelection.guestSelected = false;
    }
  });

  // Relayer les activations de sorts
  socket.on('ability-activated', (data) => {
    socket.broadcast.to(data.roomCode).emit('ability-activated', {
      key: data.key,
      isHost: data.isHost,
      timestamp: data.timestamp
    });
  });

  // Relayer la demande d'affichage de l'écran de sélection d'augments
  socket.on('show-augment-selection', (data) => {
    socket.broadcast.to(data.roomCode).emit('show-augment-selection', {
      totalScore: data.totalScore
    });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);

    // Nettoyer les rooms
    rooms.forEach((room, roomCode) => {
      if (room.host === socket.id || room.guest === socket.id) {
        io.to(roomCode).emit('player-disconnected');
        rooms.delete(roomCode);
        console.log(`🗑️  Room ${roomCode} deleted`);
      }
    });
  });
});

// Générer un code de room aléatoire
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Socket.IO server running on port', PORT);
  console.log('🎮 Ready for multiplayer Pong!');
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
});

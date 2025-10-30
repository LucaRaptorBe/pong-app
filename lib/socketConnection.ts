import { io, Socket } from 'socket.io-client';

export interface GameMessage {
  type: 'paddle-move' | 'game-state' | 'player-joined' | 'start-game' | 'start-round' | 'game-over' | 'player-disconnected' | 'augment-selected' | 'ability-selected' | 'ability-activated' | 'show-augment-selection' | 'both-players-selected';
  payload: any;
}

export class SocketConnectionManager {
  private socket: Socket | null = null;
  private roomCode: string | null = null;
  private onMessageCallback: ((message: GameMessage) => void) | null = null;

  // Initialiser la connexion au serveur Socket.IO
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Utiliser l'URL de production si définie, sinon localhost
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
        console.log('🔌 Connecting to Socket.IO server:', socketUrl);

        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to Socket.IO server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('⚠️ Disconnected from server');
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'player-disconnected',
              payload: {}
            });
          }
        });

        // Écouter les événements du serveur
        this.socket.on('player-joined', (data) => {
          console.log('👋 Player joined:', data);
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'player-joined',
              payload: data
            });
          }
        });

        this.socket.on('paddle-move', (data) => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'paddle-move',
              payload: data
            });
          }
        });

        this.socket.on('game-state', (state) => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'game-state',
              payload: state
            });
          }
        });

        this.socket.on('start-game', () => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'start-game',
              payload: {}
            });
          }
        });

        this.socket.on('start-round', () => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'start-round',
              payload: {}
            });
          }
        });

        this.socket.on('game-over', (data) => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'game-over',
              payload: data
            });
          }
        });

        this.socket.on('player-disconnected', () => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'player-disconnected',
              payload: {}
            });
          }
        });

        // Écouter les événements d'augments
        this.socket.on('augment-selected', (data) => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'augment-selected',
              payload: data
            });
          }
        });

        this.socket.on('ability-selected', (data) => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'ability-selected',
              payload: data
            });
          }
        });

        this.socket.on('ability-activated', (data) => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'ability-activated',
              payload: data
            });
          }
        });

        this.socket.on('show-augment-selection', (data) => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'show-augment-selection',
              payload: data
            });
          }
        });

        this.socket.on('both-players-selected', () => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'both-players-selected',
              payload: {}
            });
          }
        });

      } catch (err) {
        console.error('❌ Failed to initialize socket:', err);
        reject(err);
      }
    });
  }

  // Créer une room (hôte)
  createRoom(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('create-room', (response: any) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          console.log('🎮 Room created:', this.roomCode);
          resolve(response.roomCode);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }

  // Rejoindre une room (invité)
  joinRoom(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('join-room', roomCode, (response: any) => {
        if (response.success) {
          this.roomCode = roomCode;
          console.log('🎮 Joined room:', roomCode);
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  // Envoyer un mouvement de paddle
  sendPaddleMove(y: number, isHost: boolean) {
    if (this.socket && this.roomCode) {
      this.socket.emit('paddle-move', {
        roomCode: this.roomCode,
        y,
        isHost
      });
    }
  }

  // Envoyer l'état du jeu (hôte seulement)
  sendGameState(state: any) {
    if (this.socket && this.roomCode) {
      this.socket.emit('game-state', {
        roomCode: this.roomCode,
        state
      });
    }
  }

  // Démarrer le jeu
  startGame() {
    if (this.socket && this.roomCode) {
      this.socket.emit('start-game', this.roomCode);
    }
  }

  // Démarrer un nouveau round
  startRound() {
    if (this.socket && this.roomCode) {
      this.socket.emit('start-round', this.roomCode);
    }
  }

  // Game over
  sendGameOver(winner: string, score1: number, score2: number) {
    if (this.socket && this.roomCode) {
      this.socket.emit('game-over', {
        roomCode: this.roomCode,
        winner,
        score1,
        score2
      });
    }
  }

  // Envoyer un message générique (pour les augments)
  sendMessage(message: GameMessage) {
    if (this.socket && this.roomCode) {
      this.socket.emit(message.type, {
        roomCode: this.roomCode,
        ...message.payload
      });
    }
  }

  // Écouter les messages
  onMessage(callback: (message: GameMessage) => void) {
    this.onMessageCallback = callback;
  }

  // Déconnexion
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.roomCode = null;
  }

  // Vérifier si connecté
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

// Générer un code de salle (pour compatibilité)
export const generateRoomCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

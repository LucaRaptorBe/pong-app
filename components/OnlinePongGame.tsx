'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SocketConnectionManager, GameMessage } from '@/lib/socketConnection';
import {
  generateStarfield,
  updateStars,
  drawStarfield,
  createScoreParticles,
  updateParticles,
  drawParticles,
  SPACE_COLORS,
  type Star,
  type Particle,
} from '@/lib/spaceEffects';

interface OnlinePongGameProps {
  roomCode: string;
  isHost: boolean;
  onLeaveGame: () => void;
}

interface GameState {
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  paddle1Y: number;
  paddle2Y: number;
  score1: number;
  score2: number;
}

export default function OnlinePongGame({ roomCode, isHost, onLeaveGame }: OnlinePongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [bothPlayersReady, setBothPlayersReady] = useState(false); // Les 2 joueurs sont dans le lobby
  const [gameStarted, setGameStarted] = useState(false); // La partie a démarré avec ESPACE
  const [roundInProgress, setRoundInProgress] = useState(false); // Un round est en cours
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Initialisation...');
  const [actualRoomCode, setActualRoomCode] = useState<string>(roomCode);
  const socketManagerRef = useRef<SocketConnectionManager | null>(null);

  const gameStateRef = useRef<GameState>({
    ballX: 500,
    ballY: 300,
    ballSpeedX: 3,
    ballSpeedY: 3,
    paddle1Y: 250,
    paddle2Y: 250,
    score1: 0,
    score2: 0,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const myPaddleY = useRef<number>(250);
  const starsRef = useRef<Star[][]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Canvas dimensions
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 600;
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 100;
  const BALL_SIZE = 10;
  const PADDLE_SPEED = 8;
  const WINNING_SCORE = 5;

  // Sound generation
  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        return;
      }
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  // Reset ball position
  const resetBall = useCallback(() => {
    const state = gameStateRef.current;
    state.ballX = CANVAS_WIDTH / 2;
    state.ballY = CANVAS_HEIGHT / 2;
    state.ballSpeedX = 3 * (Math.random() > 0.5 ? 1 : -1);
    state.ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Initialize starfield
  useEffect(() => {
    if (canvasRef.current && starsRef.current.length === 0) {
      starsRef.current = generateStarfield(CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Draw functions
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Clear canvas with deep space background
    ctx.fillStyle = SPACE_COLORS.DEEP_BLACK;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw animated starfield
    updateStars(starsRef.current, CANVAS_HEIGHT);
    drawStarfield(ctx, starsRef.current);

    // Draw center line with space theme
    ctx.strokeStyle = SPACE_COLORS.DEEP_VIOLET;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles with themed colors (cyan vs magenta)
    ctx.shadowBlur = 15;
    ctx.shadowColor = SPACE_COLORS.CYAN;
    ctx.fillStyle = SPACE_COLORS.CYAN;
    ctx.fillRect(10, state.paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.shadowColor = SPACE_COLORS.MAGENTA;
    ctx.fillStyle = SPACE_COLORS.MAGENTA;
    ctx.fillRect(CANVAS_WIDTH - 20, state.paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.shadowColor = SPACE_COLORS.STAR_WHITE;
    ctx.shadowBlur = 10;
    ctx.fillStyle = SPACE_COLORS.STAR_WHITE;
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw and update particles
    particlesRef.current = updateParticles(particlesRef.current);
    drawParticles(ctx, particlesRef.current);

    // Draw scores with themed colors
    ctx.fillStyle = SPACE_COLORS.CYAN;
    ctx.font = 'bold 48px Arial';
    ctx.shadowBlur = 10;
    ctx.shadowColor = SPACE_COLORS.CYAN;
    ctx.fillText(state.score1.toString(), CANVAS_WIDTH / 4, 60);

    ctx.fillStyle = SPACE_COLORS.MAGENTA;
    ctx.shadowColor = SPACE_COLORS.MAGENTA;
    ctx.fillText(state.score2.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    // Draw "VOUS" indicator
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 16px Arial';
    if (isHost) {
      ctx.fillText('VOUS', 40, 30);
    } else {
      ctx.fillText('VOUS', CANVAS_WIDTH - 80, 30);
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE, isHost]);

  // Host-only: Game logic
  const update = useCallback(() => {
    if (!isHost || gameOver || !roundInProgress) return;

    const state = gameStateRef.current;

    // Move ball
    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;

    // Ball collision with top/bottom
    if (state.ballY - BALL_SIZE < 0 || state.ballY + BALL_SIZE > CANVAS_HEIGHT) {
      state.ballSpeedY = -state.ballSpeedY;
      playSound(200, 0.1);
    }

    // Ball collision with paddle 1
    if (
      state.ballX - BALL_SIZE < 20 &&
      state.ballY > state.paddle1Y &&
      state.ballY < state.paddle1Y + PADDLE_HEIGHT
    ) {
      state.ballSpeedX = Math.abs(state.ballSpeedX) * 1.05;
      const deltaY = state.ballY - (state.paddle1Y + PADDLE_HEIGHT / 2);
      state.ballSpeedY = deltaY * 0.2;
      playSound(300, 0.1);
    }

    // Ball collision with paddle 2
    if (
      state.ballX + BALL_SIZE > CANVAS_WIDTH - 20 &&
      state.ballY > state.paddle2Y &&
      state.ballY < state.paddle2Y + PADDLE_HEIGHT
    ) {
      state.ballSpeedX = -Math.abs(state.ballSpeedX) * 1.05;
      const deltaY = state.ballY - (state.paddle2Y + PADDLE_HEIGHT / 2);
      state.ballSpeedY = deltaY * 0.2;
      playSound(300, 0.1);
    }

    // Ball out of bounds - scoring
    if (state.ballX < 0) {
      state.score2++;
      playSound(150, 0.3);
      // Create particle explosion for player 2 score (magenta)
      const particles = createScoreParticles(CANVAS_WIDTH - 100, CANVAS_HEIGHT / 2, SPACE_COLORS.MAGENTA);
      particlesRef.current.push(...particles);
      setRoundInProgress(false); // Pause pour attendre ESPACE

      if (state.score2 >= WINNING_SCORE) {
        setGameOver(true);
        setWinner('Joueur 2');
        playSound(500, 0.5);

        // Notify opponent
        if (socketManagerRef.current) {
          socketManagerRef.current.sendGameOver('Joueur 2', state.score1, state.score2);
        }
      }
    }
    if (state.ballX > CANVAS_WIDTH) {
      state.score1++;
      playSound(150, 0.3);
      // Create particle explosion for player 1 score (cyan)
      const particles = createScoreParticles(100, CANVAS_HEIGHT / 2, SPACE_COLORS.CYAN);
      particlesRef.current.push(...particles);
      setRoundInProgress(false); // Pause pour attendre ESPACE

      if (state.score1 >= WINNING_SCORE) {
        setGameOver(true);
        setWinner('Joueur 1');
        playSound(500, 0.5);

        // Notify opponent
        if (socketManagerRef.current) {
          socketManagerRef.current.sendGameOver('Joueur 1', state.score1, state.score2);
        }
      }
    }

    // Broadcast game state to opponent (only host sends full state)
    if (socketManagerRef.current) {
      socketManagerRef.current.sendGameState(state);
    }
  }, [isHost, gameOver, roundInProgress, resetBall, playSound, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, BALL_SIZE, WINNING_SCORE]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (isHost) {
      update();
    }
    draw();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [isHost, update, draw]);

  // Handle paddle movement
  useEffect(() => {
    const interval = setInterval(() => {
      let newY = myPaddleY.current;
      let moved = false;

      if (keysPressed.current.has('w') && newY > 0) {
        newY -= PADDLE_SPEED;
        moved = true;
      }
      if (keysPressed.current.has('s') && newY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        newY += PADDLE_SPEED;
        moved = true;
      }
      if (keysPressed.current.has('arrowup') && newY > 0) {
        newY -= PADDLE_SPEED;
        moved = true;
      }
      if (keysPressed.current.has('arrowdown') && newY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        newY += PADDLE_SPEED;
        moved = true;
      }

      if (moved) {
        myPaddleY.current = newY;

        // Update local state
        if (isHost) {
          gameStateRef.current.paddle1Y = newY;
        } else {
          gameStateRef.current.paddle2Y = newY;
        }

        // Send to opponent via Socket.IO
        if (socketManagerRef.current) {
          socketManagerRef.current.sendPaddleMove(newY, isHost);
        }
      }
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [isHost, CANVAS_HEIGHT, PADDLE_HEIGHT, PADDLE_SPEED]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Gérer ESPACE pour démarrer/relancer
      if (key === ' ') {
        e.preventDefault(); // Empêcher le scroll

        // Si les 2 joueurs sont prêts mais la partie n'a pas démarré
        if (bothPlayersReady && !gameStarted && isHost) {
          setGameStarted(true);
          setRoundInProgress(true);
          resetBall();
          // Notifier l'adversaire
          if (socketManagerRef.current) {
            socketManagerRef.current.startGame();
          }
        }
        // Si un round est terminé (après un score)
        else if (gameStarted && !roundInProgress && !gameOver && isHost) {
          setRoundInProgress(true);
          resetBall();
          // Notifier l'adversaire
          if (socketManagerRef.current) {
            socketManagerRef.current.startRound();
          }
        }
        return; // Ne pas ajouter espace aux touches pressées
      }

      keysPressed.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [bothPlayersReady, gameStarted, roundInProgress, gameOver, isHost, resetBall]);

  // Socket.IO setup
  useEffect(() => {
    const socketManager = new SocketConnectionManager();
    socketManagerRef.current = socketManager;

    const initializeSocket = async () => {
      try {
        // Connexion au serveur Socket.IO
        setConnectionStatus('Connexion au serveur...');
        await socketManager.connect();

        // Setup message handler
        socketManager.onMessage((message: GameMessage) => {
          switch (message.type) {
            case 'player-joined':
              setOpponentConnected(true);
              setBothPlayersReady(true);
              setConnectionStatus('Adversaire connecté ! Appuyez sur ESPACE pour commencer.');
              break;

            case 'start-game':
              setGameStarted(true);
              setRoundInProgress(true);
              break;

            case 'start-round':
              setRoundInProgress(true);
              resetBall();
              break;

            case 'paddle-move':
              // Update opponent paddle
              if (message.payload.isHost !== isHost) {
                if (message.payload.isHost) {
                  gameStateRef.current.paddle1Y = message.payload.y;
                } else {
                  gameStateRef.current.paddle2Y = message.payload.y;
                }
              }
              break;

            case 'game-state':
              // Only clients receive full game state from host
              if (!isHost) {
                gameStateRef.current = { ...gameStateRef.current, ...message.payload };
              }
              break;

            case 'game-over':
              setGameOver(true);
              setWinner(message.payload.winner);
              gameStateRef.current.score1 = message.payload.score1;
              gameStateRef.current.score2 = message.payload.score2;
              playSound(500, 0.5);
              break;

            case 'player-disconnected':
              setOpponentConnected(false);
              setConnectionStatus('❌ Votre adversaire a quitté la partie');
              setBothPlayersReady(false);
              setGameStarted(false);
              setRoundInProgress(false);
              break;
          }
        });

        // Créer ou rejoindre la room
        if (isHost) {
          setConnectionStatus('Création de la partie...');
          const generatedCode = await socketManager.createRoom();
          setActualRoomCode(generatedCode);
          setConnectionStatus('Salle créée ! En attente d\'un adversaire...');
          console.log('🔑 Share this code with your opponent:', generatedCode);
        } else {
          setConnectionStatus('Connexion à la partie...');
          await socketManager.joinRoom(roomCode);
          setOpponentConnected(true);
          setBothPlayersReady(true);
          setConnectionStatus('Connecté ! En attente du démarrage...');
        }

      } catch (err: any) {
        console.error('Failed to initialize socket:', err);

        let errorMessage = '❌ Erreur de connexion. ';
        if (err.message && err.message.includes('Room not found')) {
          errorMessage = "❌ Salle introuvable. Vérifiez le code.";
        } else if (err.message && err.message.includes('Room is full')) {
          errorMessage = "❌ Cette salle est pleine.";
        } else {
          errorMessage = '❌ ' + (err.message || 'Impossible de se connecter au serveur.');
        }

        setConnectionStatus(errorMessage);
      }
    };

    initializeSocket();

    return () => {
      socketManager.disconnect();
    };
  }, [roomCode, isHost, playSound, resetBall]);

  // Start game loop
  useEffect(() => {
    if (gameStarted && opponentConnected) {
      gameLoop();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, opponentConnected, gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-space-nebula p-4">
      <div className="mb-4 flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold text-cyan-glow animate-float">PONG ONLINE</h1>
        <div className="flex flex-col items-center gap-2">
          {isHost ? (
            <div className="flex flex-col items-center space-card p-4 rounded-lg">
              <span className="text-xs text-purple-haze mb-1">Partagez ce code avec votre adversaire:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-cyan font-mono bg-black/50 px-3 py-2 rounded border border-cyan shadow-[0_0_10px_rgba(0,255,255,0.3)]" style={{textShadow: '0 0 8px rgba(0, 255, 255, 0.6)'}}>{actualRoomCode}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(actualRoomCode);
                    // Pas d'alerte, juste changer le texte du bouton temporairement
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Copié!';
                    setTimeout(() => {
                      btn.textContent = originalText;
                    }, 2000);
                  }}
                  className="hologram-button-secondary px-3 py-2 rounded text-sm"
                  title="Copier le code"
                >
                  📋 Copier
                </button>
              </div>
            </div>
          ) : (
            <span className="text-sm text-purple-haze">Connexion en cours...</span>
          )}
          <span className={`text-sm ${opponentConnected ? 'text-cyan text-space-glow' : 'text-electric-blue text-space-glow'}`}>
            {opponentConnected ? '● Connecté' : `○ ${connectionStatus}`}
          </span>
        </div>
      </div>

      {/* Écran de lobby - avant le début de la partie */}
      {!gameStarted && (
        <div className="absolute z-10 space-card-glow p-8 rounded-lg text-center max-w-2xl w-full">
          <h2 className="text-3xl text-cyan-glow mb-6">🎮 LOBBY</h2>

          {/* Statut de connexion */}
          <div className="mb-6">
            {connectionStatus.includes('❌') || connectionStatus.includes('Erreur') || connectionStatus.includes('Impossible') ? (
              <div className="bg-red-900/30 border border-red-600/50 rounded p-4 mb-4">
                <p className="text-red-300 font-bold mb-2">⚠️ Erreur</p>
                <p className="text-red-200 text-sm">{connectionStatus}</p>
                <p className="text-purple-haze text-xs mt-2">Cliquez sur "Quitter la partie" pour revenir au menu</p>
              </div>
            ) : !bothPlayersReady ? (
              <div className="animate-pulse text-electric-blue text-lg">⏳ En attente...</div>
            ) : null}
          </div>

          {/* Affichage des 2 joueurs */}
          <div className="flex justify-around items-center gap-8 mb-6">
            {/* Joueur 1 (Hôte) */}
            <div className="flex flex-col items-center bg-black/30 p-6 rounded-lg border-2 border-cyan/50 flex-1">
              <div className="text-6xl mb-3">🎮</div>
              <h3 className="text-xl font-bold text-cyan text-space-glow mb-2">Joueur 1 (Hôte)</h3>
              <p className="text-purple-haze text-sm mb-2">Raquette gauche (cyan)</p>
              <p className="text-white text-sm">Contrôles: W / S ou ↑ / ↓</p>
              <div className="mt-3">
                {isHost ? (
                  <span className="text-cyan font-bold text-space-glow">● Vous</span>
                ) : opponentConnected ? (
                  <span className="text-cyan text-space-glow">● Connecté</span>
                ) : (
                  <span className="text-gray-500">○ En attente</span>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="text-4xl font-bold text-electric-blue-glow">VS</div>

            {/* Joueur 2 (Client) */}
            <div className="flex flex-col items-center bg-black/30 p-6 rounded-lg border-2 border-magenta/50 flex-1">
              <div className="text-6xl mb-3">🎮</div>
              <h3 className="text-xl font-bold text-magenta text-space-glow mb-2">Joueur 2</h3>
              <p className="text-purple-haze text-sm mb-2">Raquette droite (magenta)</p>
              <p className="text-white text-sm">Contrôles: W / S ou ↑ / ↓</p>
              <div className="mt-3">
                {!isHost ? (
                  <span className="text-magenta font-bold text-space-glow">● Vous</span>
                ) : opponentConnected ? (
                  <span className="text-magenta text-space-glow">● Connecté</span>
                ) : (
                  <span className="text-gray-500">○ En attente</span>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          {bothPlayersReady && isHost && (
            <div className="bg-electric-blue/10 border border-electric-blue/50 rounded p-4 mb-4">
              <p className="text-electric-blue-glow font-bold text-lg mb-2">
                🎯 Appuyez sur ESPACE pour commencer !
              </p>
              <p className="text-cyan text-sm">
                (Seulement l'hôte peut démarrer la partie)
              </p>
            </div>
          )}

          {bothPlayersReady && !isHost && (
            <div className="bg-magenta/10 border border-magenta/50 rounded p-4 mb-4">
              <p className="text-magenta-glow text-sm">
                En attente que l'hôte démarre la partie...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Message après un score (round terminé) */}
      {gameStarted && !roundInProgress && !gameOver && (
        <div className="absolute z-10 space-card-glow p-6 rounded-lg text-center">
          <h3 className="text-2xl text-electric-blue-glow mb-3">⚡ Point marqué !</h3>
          <p className="text-xl text-cyan-glow mb-4">
            Score: {gameStateRef.current.score1} - {gameStateRef.current.score2}
          </p>
          {isHost ? (
            <p className="text-magenta text-sm">
              Appuyez sur ESPACE pour continuer
            </p>
          ) : (
            <p className="text-purple-haze text-sm">
              En attente de l'hôte...
            </p>
          )}
        </div>
      )}

      {/* Écran de fin de partie */}
      {gameOver && (
        <div className="absolute z-10 space-card-glow p-8 rounded-lg text-center border-4 border-electric-blue">
          <h2 className="text-5xl text-cyan-glow mb-4">
            🏆 {winner === 'Joueur 1' ? (isHost ? 'VICTOIRE!' : 'DÉFAITE') : (isHost ? 'DÉFAITE' : 'VICTOIRE!')}
          </h2>
          <p className="text-3xl text-magenta-glow mb-2">
            {winner === 'Joueur 1' ? (isHost ? 'Vous gagnez!' : 'Vous perdez!') : (isHost ? 'Vous perdez!' : 'Vous gagnez!')}
          </p>
          <p className="text-2xl text-purple-haze mb-6">
            Score final: {gameStateRef.current.score1} - {gameStateRef.current.score2}
          </p>
          <button
            onClick={onLeaveGame}
            className="hologram-button-primary px-8 py-3 rounded text-xl font-bold"
          >
            Retour au menu
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={`border-4 border-electric-blue rounded shadow-[0_0_30px_rgba(0,149,255,0.5)] ${!gameStarted ? 'opacity-0' : 'opacity-100'} transition-opacity`}
      />

      <div className="mt-4 text-purple-haze text-sm text-center">
        <p>
          {isHost ? 'Vous: W/S' : 'Vous: ↑/↓'} |
          <span className="text-cyan mx-2">Vous êtes {isHost ? 'à gauche (cyan)' : 'à droite (magenta)'}</span>
        </p>
      </div>

      <button
        onClick={onLeaveGame}
        className="mt-4 hologram-button-tertiary px-6 py-2 rounded"
      >
        Quitter la partie
      </button>
    </div>
  );
}

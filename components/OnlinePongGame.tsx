'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  const gameStateRef = useRef<GameState>({
    ballX: 400,
    ballY: 300,
    ballSpeedX: 5,
    ballSpeedY: 5,
    paddle1Y: 250,
    paddle2Y: 250,
    score1: 0,
    score2: 0,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const myPaddleY = useRef<number>(250);

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
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
    state.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
    state.ballSpeedY = 5 * (Math.random() > 0.5 ? 1 : -1);
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Draw functions
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(10, 10, 10, 0.2)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles with glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = isHost ? '#00ff00' : '#ff00ff';
    ctx.fillStyle = isHost ? '#00ff00' : '#ff00ff';
    ctx.fillRect(10, state.paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.shadowColor = isHost ? '#ff00ff' : '#00ff00';
    ctx.fillStyle = isHost ? '#ff00ff' : '#00ff00';
    ctx.fillRect(CANVAS_WIDTH - 20, state.paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball with glow
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw scores
    ctx.fillStyle = isHost ? '#00ff00' : '#ff00ff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(state.score1.toString(), CANVAS_WIDTH / 4, 60);

    ctx.fillStyle = isHost ? '#ff00ff' : '#00ff00';
    ctx.fillText(state.score2.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    // Draw "VOUS" indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 16px Arial';
    if (isHost) {
      ctx.fillText('VOUS', 40, 30);
    } else {
      ctx.fillText('VOUS', CANVAS_WIDTH - 80, 30);
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE, isHost]);

  // Host-only: Game logic
  const update = useCallback(() => {
    if (!isHost || gameOver) return;

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
      resetBall();

      if (state.score2 >= WINNING_SCORE) {
        setGameOver(true);
        setWinner('Joueur 2');
        playSound(500, 0.5);
      }
    }
    if (state.ballX > CANVAS_WIDTH) {
      state.score1++;
      playSound(150, 0.3);
      resetBall();

      if (state.score1 >= WINNING_SCORE) {
        setGameOver(true);
        setWinner('Joueur 1');
        playSound(500, 0.5);
      }
    }

    // Broadcast game state to opponent
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'game-state',
        payload: state,
      });
    }
  }, [isHost, gameOver, resetBall, playSound, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, BALL_SIZE, WINNING_SCORE]);

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

        // Send to opponent
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'paddle-move',
            payload: { y: newY, isHost },
          });
        }
      }
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [isHost, CANVAS_HEIGHT, PADDLE_HEIGHT]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
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
  }, []);

  // Supabase Realtime setup
  useEffect(() => {
    const channel = supabase.channel(`game-${roomCode}`, {
      config: {
        broadcast: { ack: false },
      },
    });

    channel
      .on('broadcast', { event: 'player-joined' }, () => {
        setOpponentConnected(true);
        setGameStarted(true);
      })
      .on('broadcast', { event: 'paddle-move' }, ({ payload }) => {
        if (payload.isHost !== isHost) {
          // Update opponent paddle
          if (payload.isHost) {
            gameStateRef.current.paddle1Y = payload.y;
          } else {
            gameStateRef.current.paddle2Y = payload.y;
          }
        }
      })
      .on('broadcast', { event: 'game-state' }, ({ payload }) => {
        if (!isHost) {
          // Only clients receive full game state
          gameStateRef.current = { ...gameStateRef.current, ...payload };
        }
      })
      .on('broadcast', { event: 'player-left' }, () => {
        setOpponentConnected(false);
        alert('Votre adversaire a quitté la partie');
        onLeaveGame();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence
          channel.send({
            type: 'broadcast',
            event: 'player-joined',
            payload: { isHost },
          });

          // Start game after short delay for both players to connect
          setTimeout(() => {
            setOpponentConnected(true);
            setGameStarted(true);
          }, 1000);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.send({
        type: 'broadcast',
        event: 'player-left',
        payload: { isHost },
      });
      supabase.removeChannel(channel);
    };
  }, [roomCode, isHost, onLeaveGame]);

  // Start game loop
  useEffect(() => {
    if (gameStarted && opponentConnected && !gameOver) {
      if (isHost) {
        resetBall();
      }
      gameLoop();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, opponentConnected, gameOver, gameLoop, isHost, resetBall]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="mb-4 flex items-center gap-4">
        <h1 className="text-4xl font-bold text-white">PONG ONLINE</h1>
        <span className="text-gray-400">|</span>
        <span className="text-xl text-blue-400 font-mono">{roomCode}</span>
        <span className="text-gray-400">|</span>
        <span className={`text-sm ${opponentConnected ? 'text-green-400' : 'text-yellow-400'}`}>
          {opponentConnected ? '● Connecté' : '○ En attente...'}
        </span>
      </div>

      {!gameStarted && (
        <div className="absolute z-10 bg-black/80 p-8 rounded-lg text-center">
          <h2 className="text-3xl text-white mb-4">En attente de l'adversaire...</h2>
          <div className="animate-pulse text-yellow-400">⏳</div>
        </div>
      )}

      {gameOver && (
        <div className="absolute z-10 bg-black/80 p-8 rounded-lg text-center">
          <h2 className="text-4xl text-white mb-4">
            🏆 {winner === 'Joueur 1' ? (isHost ? 'Vous gagnez!' : 'Vous perdez!') : (isHost ? 'Vous perdez!' : 'Vous gagnez!')}
          </h2>
          <p className="text-2xl text-gray-300 mb-6">
            Score: {gameStateRef.current.score1} - {gameStateRef.current.score2}
          </p>
          <button
            onClick={onLeaveGame}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded text-xl font-bold"
          >
            Retour au lobby
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-white rounded shadow-2xl"
      />

      <div className="mt-4 text-gray-400 text-sm text-center">
        <p>
          {isHost ? 'Vous: W/S' : 'Vous: ↑/↓'} |
          <span className="text-white mx-2">Vous êtes {isHost ? 'à gauche (vert)' : 'à droite (rose)'}</span>
        </p>
      </div>

      <button
        onClick={onLeaveGame}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition"
      >
        Quitter la partie
      </button>
    </div>
  );
}

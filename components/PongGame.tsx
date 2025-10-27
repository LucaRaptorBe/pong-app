'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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

interface Settings {
  ballSpeed: number;
  paddleSpeed: number;
  winningScore: number;
}

interface PongGameProps {
  onBackToMenu?: () => void;
}

export default function PongGame({ onBackToMenu }: PongGameProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    ballSpeed: 5,
    paddleSpeed: 8,
    winningScore: 5,
  });

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

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 100;
  const BALL_SIZE = 10;

  // Sound generation
  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    state.ballSpeedX = settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    state.ballSpeedY = settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
  }, [settings.ballSpeed, CANVAS_WIDTH, CANVAS_HEIGHT]);

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
    ctx.shadowColor = '#00ff00';
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, state.paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(CANVAS_WIDTH - 20, state.paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball with glow
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw scores
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(state.score1.toString(), CANVAS_WIDTH / 4, 60);

    ctx.fillStyle = '#ff00ff';
    ctx.fillText(state.score2.toString(), (CANVAS_WIDTH * 3) / 4, 60);
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE]);

  // Game logic
  const update = useCallback(() => {
    if (gamePaused || gameOver) return;

    const state = gameStateRef.current;

    // Move paddles
    if (keysPressed.current.has('w') && state.paddle1Y > 0) {
      state.paddle1Y -= settings.paddleSpeed;
    }
    if (keysPressed.current.has('s') && state.paddle1Y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      state.paddle1Y += settings.paddleSpeed;
    }
    if (keysPressed.current.has('arrowup') && state.paddle2Y > 0) {
      state.paddle2Y -= settings.paddleSpeed;
    }
    if (keysPressed.current.has('arrowdown') && state.paddle2Y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      state.paddle2Y += settings.paddleSpeed;
    }

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

      if (state.score2 >= settings.winningScore) {
        setGameOver(true);
        setWinner('Joueur 2');
        playSound(500, 0.5);
      }
    }
    if (state.ballX > CANVAS_WIDTH) {
      state.score1++;
      playSound(150, 0.3);
      resetBall();

      if (state.score1 >= settings.winningScore) {
        setGameOver(true);
        setWinner('Joueur 1');
        playSound(500, 0.5);
      }
    }
  }, [gamePaused, gameOver, settings, resetBall, playSound, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, BALL_SIZE]);

  // Game loop
  const gameLoop = useCallback(() => {
    update();
    draw();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);

      if (key === ' ' && gameStarted && !gameOver) {
        e.preventDefault();
        setGamePaused((prev) => !prev);
      }
      if (key === 'escape') {
        setShowSettings((prev) => !prev);
      }
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
  }, [gameStarted, gameOver]);

  // Start game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoop();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, gameOver, gameLoop]);

  const startGame = () => {
    resetBall();
    gameStateRef.current.score1 = 0;
    gameStateRef.current.score2 = 0;
    gameStateRef.current.paddle1Y = 250;
    gameStateRef.current.paddle2Y = 250;
    setGameStarted(true);
    setGameOver(false);
    setGamePaused(false);
    setWinner('');
  };

  const restartGame = () => {
    startGame();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <h1 className="text-4xl font-bold text-white mb-4">PONG</h1>

      {!gameStarted && !gameOver && (
        <div className="absolute z-10 bg-black/80 p-8 rounded-lg text-center">
          <h2 className="text-3xl text-white mb-4">Bienvenue!</h2>
          <div className="text-left text-gray-300 mb-6 space-y-2">
            <p><span className="text-green-400">Joueur 1:</span> W (haut) / S (bas)</p>
            <p><span className="text-pink-400">Joueur 2:</span> ↑ (haut) / ↓ (bas)</p>
            <p><span className="text-yellow-400">Pause:</span> Espace</p>
            <p><span className="text-blue-400">Paramètres:</span> Echap</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mb-3 block w-full"
          >
            ⚙️ Paramètres
          </button>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded text-xl font-bold w-full"
          >
            Commencer
          </button>
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded mt-3 w-full"
            >
              ← Retour au menu
            </button>
          )}
        </div>
      )}

      {gamePaused && (
        <div className="absolute z-10 bg-black/80 p-8 rounded-lg">
          <h2 className="text-3xl text-white">PAUSE</h2>
          <p className="text-gray-300 mt-2">Appuyez sur Espace pour continuer</p>
        </div>
      )}

      {gameOver && (
        <div className="absolute z-10 bg-black/80 p-8 rounded-lg text-center">
          <h2 className="text-4xl text-white mb-4">🏆 {winner} gagne!</h2>
          <p className="text-2xl text-gray-300 mb-6">
            Score: {gameStateRef.current.score1} - {gameStateRef.current.score2}
          </p>
          <button
            onClick={restartGame}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded text-xl font-bold"
          >
            Rejouer
          </button>
        </div>
      )}

      {showSettings && (
        <div className="absolute z-20 bg-black/95 p-8 rounded-lg text-center border-2 border-white">
          <h2 className="text-2xl text-white mb-4">⚙️ Paramètres</h2>
          <div className="space-y-4 text-left">
            <div>
              <label className="text-white block mb-2">
                Vitesse de la balle: {settings.ballSpeed}
              </label>
              <input
                type="range"
                min="3"
                max="10"
                value={settings.ballSpeed}
                onChange={(e) => setSettings({ ...settings, ballSpeed: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white block mb-2">
                Vitesse des raquettes: {settings.paddleSpeed}
              </label>
              <input
                type="range"
                min="5"
                max="15"
                value={settings.paddleSpeed}
                onChange={(e) => setSettings({ ...settings, paddleSpeed: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white block mb-2">
                Score pour gagner: {settings.winningScore}
              </label>
              <input
                type="range"
                min="3"
                max="15"
                value={settings.winningScore}
                onChange={(e) => setSettings({ ...settings, winningScore: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mt-6"
          >
            Fermer
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
        <p>Joueur 1: W/S | Joueur 2: ↑/↓ | Pause: Espace | Paramètres: Echap</p>
      </div>
    </div>
  );
}

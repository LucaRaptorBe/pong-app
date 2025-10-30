'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
    ballSpeed: 3,
    paddleSpeed: 8,
    winningScore: 5,
  });

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
  const starsRef = useRef<Star[][]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Canvas dimensions
  const CANVAS_WIDTH = 1000;
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

    ctx.shadowBlur = 0;
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
      // Create particle explosion for player 2 score (magenta)
      const particles = createScoreParticles(CANVAS_WIDTH - 100, CANVAS_HEIGHT / 2, SPACE_COLORS.MAGENTA);
      particlesRef.current.push(...particles);
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
      // Create particle explosion for player 1 score (cyan)
      const particles = createScoreParticles(100, CANVAS_HEIGHT / 2, SPACE_COLORS.CYAN);
      particlesRef.current.push(...particles);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-space-nebula p-4">
      <h1 className="text-4xl font-bold text-cyan-glow mb-4 animate-float">PONG</h1>

      {!gameStarted && !gameOver && (
        <div className="absolute z-10 space-card p-8 rounded-lg text-center">
          <h2 className="text-3xl text-cyan-glow mb-4">Bienvenue!</h2>
          <div className="text-left text-gray-300 mb-6 space-y-2">
            <p><span className="text-cyan text-space-glow">Joueur 1:</span> W (haut) / S (bas)</p>
            <p><span className="text-magenta text-space-glow">Joueur 2:</span> ↑ (haut) / ↓ (bas)</p>
            <p><span className="text-electric-blue text-space-glow">Pause:</span> Espace</p>
            <p><span className="text-purple-haze text-space-glow">Paramètres:</span> Echap</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="hologram-button-secondary px-6 py-2 rounded mb-3 block w-full"
          >
            ⚙️ Paramètres
          </button>
          <button
            onClick={startGame}
            className="hologram-button-primary px-8 py-3 rounded text-xl font-bold w-full"
          >
            Commencer
          </button>
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="hologram-button-tertiary px-6 py-2 rounded mt-3 w-full"
            >
              ← Retour au menu
            </button>
          )}
        </div>
      )}

      {gamePaused && (
        <div className="absolute z-10 space-card-glow p-8 rounded-lg">
          <h2 className="text-3xl text-electric-blue-glow">PAUSE</h2>
          <p className="text-purple-haze mt-2">Appuyez sur Espace pour continuer</p>
        </div>
      )}

      {gameOver && (
        <div className="absolute z-10 space-card-glow p-8 rounded-lg text-center">
          <h2 className="text-4xl text-cyan-glow mb-4">🏆 {winner} gagne!</h2>
          <p className="text-2xl text-magenta-glow mb-6">
            Score: {gameStateRef.current.score1} - {gameStateRef.current.score2}
          </p>
          <button
            onClick={restartGame}
            className="hologram-button-primary px-8 py-3 rounded text-xl font-bold"
          >
            Rejouer
          </button>
        </div>
      )}

      {showSettings && (
        <div className="absolute z-20 space-card-glow p-8 rounded-lg text-center">
          <h2 className="text-2xl text-electric-blue-glow mb-4">⚙️ Paramètres</h2>
          <div className="space-y-4 text-left">
            <div>
              <label className="text-cyan block mb-2 text-space-glow">
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
              <label className="text-magenta block mb-2 text-space-glow">
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
              <label className="text-purple-haze block mb-2 text-space-glow">
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
            className="hologram-button-secondary px-6 py-2 rounded mt-6"
          >
            Fermer
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-electric-blue rounded shadow-[0_0_30px_rgba(0,149,255,0.5)]"
      />

      <div className="mt-4 text-purple-haze text-sm text-center">
        <p>Joueur 1: W/S | Joueur 2: ↑/↓ | Pause: Espace | Paramètres: Echap</p>
      </div>
    </div>
  );
}

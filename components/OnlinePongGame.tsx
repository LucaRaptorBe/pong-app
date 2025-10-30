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
import {
  type Augment,
  type Ability,
  type ActiveAbility,
  type PlayerAugments,
  getRandomAugments,
  getRandomAbilities,
  calculateAugmentEffects,
  isAbilityReady,
  isAbilityEffectActive,
} from '@/lib/augments';
import AugmentSelection from './AugmentSelection';
import AbilityHUD from './AbilityHUD';
import { GAME_CONFIG } from '@/lib/gameConfig';

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

  // Augments system states
  const [showAugmentSelection, setShowAugmentSelection] = useState(false);
  const [showAbilitySelection, setShowAbilitySelection] = useState(false);
  const [availableAugments, setAvailableAugments] = useState<Augment[]>([]);
  const [availableAbilities, setAvailableAbilities] = useState<Ability[]>([]);
  const [waitingForOpponentSelection, setWaitingForOpponentSelection] = useState(false);

  // Player augments
  const [player1Augments, setPlayer1Augments] = useState<PlayerAugments>({
    passiveAugments: [],
    abilities: {},
  });
  const [player2Augments, setPlayer2Augments] = useState<PlayerAugments>({
    passiveAugments: [],
    abilities: {},
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

  // Augment selection functions
  const showAugmentSelectionScreen = useCallback(() => {
    // Au premier point, proposer des sorts
    const totalScore = gameStateRef.current.score1 + gameStateRef.current.score2;

    if (totalScore === 1) {
      // Premier point: sélection de sort
      const abilities = getRandomAbilities(2); // 2 sorts au choix
      setAvailableAbilities(abilities);
      setShowAbilitySelection(true);
    } else {
      // Points suivants: sélection d'augment passif
      const myAugments = isHost ? player1Augments : player2Augments;
      const usedIds = myAugments.passiveAugments.map(a => a.id);
      const augments = getRandomAugments(3, usedIds); // 3 augments au choix
      setAvailableAugments(augments);
      setShowAugmentSelection(true);
    }
  }, [isHost, player1Augments, player2Augments]);

  const handleSelectAugment = useCallback((augment: Augment) => {
    if (isHost) {
      setPlayer1Augments(prev => ({
        ...prev,
        passiveAugments: [...prev.passiveAugments, augment],
      }));
    } else {
      setPlayer2Augments(prev => ({
        ...prev,
        passiveAugments: [...prev.passiveAugments, augment],
      }));
    }

    setShowAugmentSelection(false);
    setWaitingForOpponentSelection(true);

    // Envoyer la sélection à l'adversaire
    if (socketManagerRef.current) {
      socketManagerRef.current.sendMessage({
        type: 'augment-selected',
        payload: { augment, isHost },
      });
    }
  }, [isHost]);

  const handleSelectAbility = useCallback((ability: Ability) => {
    const activeAbility: ActiveAbility = {
      ability,
      lastUsed: 0,
      isActive: false,
    };

    if (isHost) {
      setPlayer1Augments(prev => ({
        ...prev,
        abilities: { ...prev.abilities, [ability.key]: activeAbility },
      }));
    } else {
      setPlayer2Augments(prev => ({
        ...prev,
        abilities: { ...prev.abilities, [ability.key]: activeAbility },
      }));
    }

    setShowAbilitySelection(false);
    setWaitingForOpponentSelection(true);

    // Envoyer la sélection à l'adversaire
    if (socketManagerRef.current) {
      socketManagerRef.current.sendMessage({
        type: 'ability-selected',
        payload: { ability, isHost },
      });
    }
  }, [isHost]);

  const handleAbilityActivation = useCallback((key: 'q' | 'e' | 'r') => {
    if (!gameStarted || !roundInProgress || gameOver) return;

    const myAugments = isHost ? player1Augments : player2Augments;
    const activeAbility = myAugments.abilities[key];

    if (!activeAbility || !isAbilityReady(activeAbility, Date.now())) return;

    // Activer le sort
    const updatedAbility: ActiveAbility = {
      ...activeAbility,
      lastUsed: Date.now(),
      isActive: true,
      activatedAt: Date.now(),
    };

    if (isHost) {
      setPlayer1Augments(prev => ({
        ...prev,
        abilities: { ...prev.abilities, [key]: updatedAbility },
      }));
    } else {
      setPlayer2Augments(prev => ({
        ...prev,
        abilities: { ...prev.abilities, [key]: updatedAbility },
      }));
    }

    // Envoyer l'activation à l'adversaire
    if (socketManagerRef.current) {
      socketManagerRef.current.sendMessage({
        type: 'ability-activated',
        payload: { key, isHost, timestamp: Date.now() },
      });
    }

    // Son d'activation
    playSound(400, 0.2);
  }, [isHost, player1Augments, player2Augments, gameStarted, roundInProgress, gameOver, playSound]);

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

    // Calculate paddle heights with augments if enabled
    let paddle1Height = PADDLE_HEIGHT;
    let paddle2Height = PADDLE_HEIGHT;

    if (GAME_CONFIG.AUGMENTS_ENABLED) {
      const player1Effects = calculateAugmentEffects(player1Augments.passiveAugments);
      const player2Effects = calculateAugmentEffects(player2Augments.passiveAugments);
      paddle1Height = PADDLE_HEIGHT * player1Effects.paddleHeightMultiplier!;
      paddle2Height = PADDLE_HEIGHT * player2Effects.paddleHeightMultiplier!;
    }

    // Draw paddles with themed colors (cyan vs magenta)
    ctx.shadowBlur = 15;
    ctx.shadowColor = SPACE_COLORS.CYAN;
    ctx.fillStyle = SPACE_COLORS.CYAN;
    ctx.fillRect(10, state.paddle1Y, PADDLE_WIDTH, paddle1Height);

    ctx.shadowColor = SPACE_COLORS.MAGENTA;
    ctx.fillStyle = SPACE_COLORS.MAGENTA;
    ctx.fillRect(CANVAS_WIDTH - 20, state.paddle2Y, PADDLE_WIDTH, paddle2Height);

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
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE, isHost, player1Augments, player2Augments]);

  // Host-only: Game logic
  const update = useCallback(() => {
    if (!isHost || gameOver || !roundInProgress) return;

    const state = gameStateRef.current;
    const currentTime = Date.now();

    let ballSpeedMultiplier = 1;

    // Apply augment effects only if enabled
    if (GAME_CONFIG.AUGMENTS_ENABLED) {
      // Calculate augment effects
      const player1Effects = calculateAugmentEffects(player1Augments.passiveAugments);
      const player2Effects = calculateAugmentEffects(player2Augments.passiveAugments);

      // Check for active ability effects
      const player1TimeShield = player1Augments.abilities.q && isAbilityEffectActive(player1Augments.abilities.q, currentTime);
      const player2TimeShield = player2Augments.abilities.q && isAbilityEffectActive(player2Augments.abilities.q, currentTime);
      const player1Freeze = player1Augments.abilities.r &&
        isAbilityEffectActive(player1Augments.abilities.r, currentTime) &&
        player1Augments.abilities.r.ability.effect.type === 'freeze_ball';
      const player2Freeze = player2Augments.abilities.r &&
        isAbilityEffectActive(player2Augments.abilities.r, currentTime) &&
        player2Augments.abilities.r.ability.effect.type === 'freeze_ball';

      // If ball is frozen, don't move it
      if (player1Freeze || player2Freeze) {
        ballSpeedMultiplier = 0;
      } else {
        // Time shield slows ball in player's side
        if (state.ballX < CANVAS_WIDTH / 2 && player1TimeShield) {
          ballSpeedMultiplier *= 0.4;
        } else if (state.ballX > CANVAS_WIDTH / 2 && player2TimeShield) {
          ballSpeedMultiplier *= 0.4;
        }

        // Augment effects: ball speed in different sides
        if (state.ballX < CANVAS_WIDTH / 2) {
          // Ball in player 1's side
          ballSpeedMultiplier *= player1Effects.ballSpeedInOwnSide!;
          ballSpeedMultiplier *= player2Effects.ballSpeedInOpponentSide!;
        } else {
          // Ball in player 2's side
          ballSpeedMultiplier *= player2Effects.ballSpeedInOwnSide!;
          ballSpeedMultiplier *= player1Effects.ballSpeedInOpponentSide!;
        }
      }
    }

    // Move ball
    state.ballX += state.ballSpeedX * ballSpeedMultiplier;
    state.ballY += state.ballSpeedY * ballSpeedMultiplier;

    // Ball collision with top/bottom
    if (state.ballY - BALL_SIZE < 0 || state.ballY + BALL_SIZE > CANVAS_HEIGHT) {
      state.ballSpeedY = -state.ballSpeedY;
      playSound(200, 0.1);
    }

    // Calculate paddle heights and speed modifiers
    let paddle1Height = PADDLE_HEIGHT;
    let paddle2Height = PADDLE_HEIGHT;
    let speedIncrease1 = 1.05;
    let speedIncrease2 = 1.05;

    if (GAME_CONFIG.AUGMENTS_ENABLED) {
      const player1Effects = calculateAugmentEffects(player1Augments.passiveAugments);
      const player2Effects = calculateAugmentEffects(player2Augments.passiveAugments);
      paddle1Height = PADDLE_HEIGHT * player1Effects.paddleHeightMultiplier!;
      paddle2Height = PADDLE_HEIGHT * player2Effects.paddleHeightMultiplier!;
      speedIncrease1 = 1.05 * (player1Effects.ballSpeedOnHit || 1);
      speedIncrease2 = 1.05 * (player2Effects.ballSpeedOnHit || 1);
    }

    // Ball collision with paddle 1
    if (
      state.ballX - BALL_SIZE < 20 &&
      state.ballY > state.paddle1Y &&
      state.ballY < state.paddle1Y + paddle1Height
    ) {
      state.ballSpeedX = Math.abs(state.ballSpeedX) * speedIncrease1;
      const deltaY = state.ballY - (state.paddle1Y + paddle1Height / 2);
      state.ballSpeedY = deltaY * 0.2;
      playSound(300, 0.1);
    }

    // Ball collision with paddle 2
    if (
      state.ballX + BALL_SIZE > CANVAS_WIDTH - 20 &&
      state.ballY > state.paddle2Y &&
      state.ballY < state.paddle2Y + paddle2Height
    ) {
      state.ballSpeedX = -Math.abs(state.ballSpeedX) * speedIncrease2;
      const deltaY = state.ballY - (state.paddle2Y + paddle2Height / 2);
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
      } else {
        // Show augment selection after scoring and notify opponent (only if enabled)
        if (GAME_CONFIG.AUGMENTS_ENABLED) {
          setTimeout(() => {
            showAugmentSelectionScreen();
            // Notify opponent to also show selection screen
            if (socketManagerRef.current) {
              socketManagerRef.current.sendMessage({
                type: 'show-augment-selection',
                payload: { totalScore: state.score1 + state.score2 },
              });
            }
          }, 500);
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
      } else {
        // Show augment selection after scoring and notify opponent (only if enabled)
        if (GAME_CONFIG.AUGMENTS_ENABLED) {
          setTimeout(() => {
            showAugmentSelectionScreen();
            // Notify opponent to also show selection screen
            if (socketManagerRef.current) {
              socketManagerRef.current.sendMessage({
                type: 'show-augment-selection',
                payload: { totalScore: state.score1 + state.score2 },
              });
            }
          }, 500);
        }
      }
    }

    // Broadcast game state to opponent (only host sends full state)
    if (socketManagerRef.current) {
      socketManagerRef.current.sendGameState(state);
    }
  }, [isHost, gameOver, roundInProgress, resetBall, playSound, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, BALL_SIZE, WINNING_SCORE, player1Augments, player2Augments, showAugmentSelectionScreen]);

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
      // Calculate paddle speed and height
      let paddleSpeed = PADDLE_SPEED;
      let paddleHeight = PADDLE_HEIGHT;

      if (GAME_CONFIG.AUGMENTS_ENABLED) {
        const myAugments = isHost ? player1Augments : player2Augments;
        const myEffects = calculateAugmentEffects(myAugments.passiveAugments);
        paddleSpeed = PADDLE_SPEED * myEffects.paddleSpeedMultiplier!;
        paddleHeight = PADDLE_HEIGHT * myEffects.paddleHeightMultiplier!;
      }

      let newY = myPaddleY.current;
      let moved = false;

      if (keysPressed.current.has('w') && newY > 0) {
        newY -= paddleSpeed;
        moved = true;
      }
      if (keysPressed.current.has('s') && newY < CANVAS_HEIGHT - paddleHeight) {
        newY += paddleSpeed;
        moved = true;
      }
      if (keysPressed.current.has('arrowup') && newY > 0) {
        newY -= paddleSpeed;
        moved = true;
      }
      if (keysPressed.current.has('arrowdown') && newY < CANVAS_HEIGHT - paddleHeight) {
        newY += paddleSpeed;
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
  }, [isHost, CANVAS_HEIGHT, PADDLE_HEIGHT, PADDLE_SPEED, player1Augments, player2Augments]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Gérer les touches de sort Q, E, R
      if (key === 'q' || key === 'e' || key === 'r') {
        e.preventDefault();
        handleAbilityActivation(key as 'q' | 'e' | 'r');
        return;
      }

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
        // Si un round est terminé (après un score) et que la sélection d'augments est terminée
        else if (gameStarted && !roundInProgress && !gameOver && isHost && !showAugmentSelection && !showAbilitySelection && !waitingForOpponentSelection) {
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
  }, [bothPlayersReady, gameStarted, roundInProgress, gameOver, isHost, resetBall, handleAbilityActivation, showAugmentSelection, showAbilitySelection, waitingForOpponentSelection]);

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

            case 'augment-selected':
              // L'adversaire a sélectionné un augment
              if (message.payload.isHost !== isHost) {
                if (message.payload.isHost) {
                  setPlayer1Augments(prev => ({
                    ...prev,
                    passiveAugments: [...prev.passiveAugments, message.payload.augment],
                  }));
                } else {
                  setPlayer2Augments(prev => ({
                    ...prev,
                    passiveAugments: [...prev.passiveAugments, message.payload.augment],
                  }));
                }
              }
              break;

            case 'ability-selected':
              // L'adversaire a sélectionné un sort
              if (message.payload.isHost !== isHost) {
                const activeAbility: ActiveAbility = {
                  ability: message.payload.ability,
                  lastUsed: 0,
                  isActive: false,
                };
                if (message.payload.isHost) {
                  setPlayer1Augments(prev => ({
                    ...prev,
                    abilities: { ...prev.abilities, [message.payload.ability.key]: activeAbility },
                  }));
                } else {
                  setPlayer2Augments(prev => ({
                    ...prev,
                    abilities: { ...prev.abilities, [message.payload.ability.key]: activeAbility },
                  }));
                }
              }
              break;

            case 'both-players-selected':
              // Les deux joueurs ont sélectionné, fermer les écrans
              setShowAugmentSelection(false);
              setShowAbilitySelection(false);
              setWaitingForOpponentSelection(false);
              break;

            case 'ability-activated':
              // L'adversaire a activé un sort
              if (message.payload.isHost !== isHost) {
                const key = message.payload.key as 'q' | 'e' | 'r';
                const updatedAbility: ActiveAbility = {
                  ability: message.payload.isHost ? player1Augments.abilities[key]?.ability! : player2Augments.abilities[key]?.ability!,
                  lastUsed: message.payload.timestamp,
                  isActive: true,
                  activatedAt: message.payload.timestamp,
                };
                if (message.payload.isHost) {
                  setPlayer1Augments(prev => ({
                    ...prev,
                    abilities: { ...prev.abilities, [key]: updatedAbility },
                  }));
                } else {
                  setPlayer2Augments(prev => ({
                    ...prev,
                    abilities: { ...prev.abilities, [key]: updatedAbility },
                  }));
                }
                playSound(400, 0.2);
              }
              break;

            case 'show-augment-selection':
              // L'hôte demande d'afficher l'écran de sélection d'augments
              const totalScore = message.payload.totalScore;
              if (totalScore === 1) {
                // Premier point: sélection de sort
                const abilities = getRandomAbilities(2);
                setAvailableAbilities(abilities);
                setShowAbilitySelection(true);
              } else {
                // Points suivants: sélection d'augment passif
                const myAugments = isHost ? player1Augments : player2Augments;
                const usedIds = myAugments.passiveAugments.map(a => a.id);
                const augments = getRandomAugments(3, usedIds);
                setAvailableAugments(augments);
                setShowAugmentSelection(true);
              }
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

      {/* Écran de sélection d'augments */}
      {GAME_CONFIG.AUGMENTS_ENABLED && (showAugmentSelection || showAbilitySelection || waitingForOpponentSelection) && (
        <AugmentSelection
          augments={availableAugments}
          abilities={availableAbilities}
          onSelectAugment={handleSelectAugment}
          onSelectAbility={handleSelectAbility}
          playerNumber={isHost ? 1 : 2}
          isYourTurn={!waitingForOpponentSelection}
          showAbilitySelection={showAbilitySelection}
        />
      )}

      {/* HUD des augments et sorts actifs */}
      {GAME_CONFIG.AUGMENTS_ENABLED && gameStarted && !gameOver && (
        <>
          <AbilityHUD
            augments={player1Augments.passiveAugments}
            abilities={player1Augments.abilities}
            isLeftSide={true}
          />
          <AbilityHUD
            augments={player2Augments.passiveAugments}
            abilities={player2Augments.abilities}
            isLeftSide={false}
          />
        </>
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

// Configuration globale du jeu
export const GAME_CONFIG = {
  // Système d'augments (à désactiver temporairement)
  AUGMENTS_ENABLED: false,

  // Autres paramètres de jeu
  WINNING_SCORE: 5,
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 600,
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 100,
  BALL_SIZE: 10,
  PADDLE_SPEED: 8,
  BALL_SPEED: 3,
} as const;

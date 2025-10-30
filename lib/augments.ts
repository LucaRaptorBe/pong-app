// Types pour le système d'augments et de sorts

export interface Augment {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'passive';
  rarity: 'common' | 'rare' | 'epic';
  effect: AugmentEffect;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  icon: string;
  key: 'q' | 'e' | 'r';
  cooldown: number; // en secondes
  duration?: number; // durée de l'effet en secondes (optionnel)
  effect: AbilityEffect;
}

export interface AugmentEffect {
  paddleHeightMultiplier?: number;
  paddleSpeedMultiplier?: number;
  ballSpeedInOpponentSide?: number;
  ballSpeedInOwnSide?: number;
  ballSpeedOnHit?: number;
}

export interface AbilityEffect {
  type: 'slow_ball' | 'dash' | 'freeze_ball' | 'split_ball';
  value?: number;
}

export interface ActiveAbility {
  ability: Ability;
  lastUsed: number; // timestamp
  isActive: boolean;
  activatedAt?: number;
}

export interface PlayerAugments {
  passiveAugments: Augment[];
  abilities: {
    q?: ActiveAbility;
    e?: ActiveAbility;
    r?: ActiveAbility;
  };
}

// Définition des augments passifs
export const PASSIVE_AUGMENTS: Augment[] = [
  {
    id: 'paddle_titan',
    name: 'Paddle Titan',
    description: 'Augmente la taille de votre raquette de 30%',
    icon: '🛡️',
    type: 'passive',
    rarity: 'common',
    effect: {
      paddleHeightMultiplier: 1.3,
    },
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Augmente votre vitesse de déplacement de 50%',
    icon: '⚡',
    type: 'passive',
    rarity: 'common',
    effect: {
      paddleSpeedMultiplier: 1.5,
    },
  },
  {
    id: 'chaos_ball',
    name: 'Chaos Ball',
    description: 'La balle dans le camp adverse va 30% plus vite',
    icon: '🔥',
    type: 'passive',
    rarity: 'rare',
    effect: {
      ballSpeedInOpponentSide: 1.3,
    },
  },
  {
    id: 'bouncy_castle',
    name: 'Bouncy Castle',
    description: 'La balle rebondit 20% plus fort sur votre raquette',
    icon: '💫',
    type: 'passive',
    rarity: 'common',
    effect: {
      ballSpeedOnHit: 1.2,
    },
  },
  {
    id: 'fortress',
    name: 'Fortress',
    description: 'Réduit la vitesse de la balle dans votre camp de 25%',
    icon: '🏰',
    type: 'passive',
    rarity: 'rare',
    effect: {
      ballSpeedInOwnSide: 0.75,
    },
  },
  {
    id: 'agile_warrior',
    name: 'Agile Warrior',
    description: '+25% vitesse de déplacement et +15% taille de raquette',
    icon: '🥷',
    type: 'passive',
    rarity: 'rare',
    effect: {
      paddleSpeedMultiplier: 1.25,
      paddleHeightMultiplier: 1.15,
    },
  },
  {
    id: 'wall_master',
    name: 'Wall Master',
    description: '+50% taille de raquette mais -20% vitesse',
    icon: '🧱',
    type: 'passive',
    rarity: 'epic',
    effect: {
      paddleHeightMultiplier: 1.5,
      paddleSpeedMultiplier: 0.8,
    },
  },
  {
    id: 'velocity_king',
    name: 'Velocity King',
    description: 'La balle accélère de 15% à chaque rebond sur votre raquette',
    icon: '🚀',
    type: 'passive',
    rarity: 'epic',
    effect: {
      ballSpeedOnHit: 1.15,
    },
  },
];

// Définition des sorts actifs
export const ACTIVE_ABILITIES: Ability[] = [
  {
    id: 'time_shield',
    name: 'Bouclier Temporel',
    description: 'Ralentit la balle de 60% pendant 2 secondes',
    icon: '🕐',
    key: 'q',
    cooldown: 15,
    duration: 2,
    effect: {
      type: 'slow_ball',
      value: 0.4, // multiplicateur de vitesse
    },
  },
  {
    id: 'dash',
    name: 'Dash',
    description: 'Téléporte votre raquette instantanément',
    icon: '💨',
    key: 'e',
    cooldown: 8,
    effect: {
      type: 'dash',
    },
  },
  {
    id: 'nova_freeze',
    name: 'Nova Freeze',
    description: 'Gèle la balle pendant 1.5 secondes',
    icon: '❄️',
    key: 'r',
    cooldown: 30,
    duration: 1.5,
    effect: {
      type: 'freeze_ball',
    },
  },
  {
    id: 'split_ball',
    name: 'Split Ball',
    description: 'Duplique la balle en 2 pendant 5 secondes',
    icon: '🌟',
    key: 'r',
    cooldown: 30,
    duration: 5,
    effect: {
      type: 'split_ball',
    },
  },
];

// Fonction pour obtenir des augments aléatoires
export function getRandomAugments(count: number, excludeIds: string[] = []): Augment[] {
  const available = PASSIVE_AUGMENTS.filter(aug => !excludeIds.includes(aug.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Fonction pour obtenir des sorts aléatoires
export function getRandomAbilities(count: number): Ability[] {
  const shuffled = [...ACTIVE_ABILITIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Fonction pour calculer les effets cumulés des augments
export function calculateAugmentEffects(augments: Augment[]): AugmentEffect {
  const combined: AugmentEffect = {
    paddleHeightMultiplier: 1,
    paddleSpeedMultiplier: 1,
    ballSpeedInOpponentSide: 1,
    ballSpeedInOwnSide: 1,
    ballSpeedOnHit: 1,
  };

  augments.forEach(aug => {
    if (aug.effect.paddleHeightMultiplier) {
      combined.paddleHeightMultiplier! *= aug.effect.paddleHeightMultiplier;
    }
    if (aug.effect.paddleSpeedMultiplier) {
      combined.paddleSpeedMultiplier! *= aug.effect.paddleSpeedMultiplier;
    }
    if (aug.effect.ballSpeedInOpponentSide) {
      combined.ballSpeedInOpponentSide! *= aug.effect.ballSpeedInOpponentSide;
    }
    if (aug.effect.ballSpeedInOwnSide) {
      combined.ballSpeedInOwnSide! *= aug.effect.ballSpeedInOwnSide;
    }
    if (aug.effect.ballSpeedOnHit) {
      combined.ballSpeedOnHit! *= aug.effect.ballSpeedOnHit;
    }
  });

  return combined;
}

// Fonction pour vérifier si un sort est disponible (cooldown terminé)
export function isAbilityReady(activeAbility: ActiveAbility | undefined, currentTime: number): boolean {
  if (!activeAbility || !activeAbility.ability) return false;
  const timeSinceLastUse = (currentTime - activeAbility.lastUsed) / 1000;
  return timeSinceLastUse >= activeAbility.ability.cooldown;
}

// Fonction pour obtenir le temps restant du cooldown
export function getRemainingCooldown(activeAbility: ActiveAbility | undefined, currentTime: number): number {
  if (!activeAbility || !activeAbility.ability) return 0;
  const timeSinceLastUse = (currentTime - activeAbility.lastUsed) / 1000;
  const remaining = activeAbility.ability.cooldown - timeSinceLastUse;
  return Math.max(0, remaining);
}

// Fonction pour vérifier si un effet de sort est encore actif
export function isAbilityEffectActive(activeAbility: ActiveAbility | undefined, currentTime: number): boolean {
  if (!activeAbility || !activeAbility.isActive || !activeAbility.activatedAt || !activeAbility.ability.duration) {
    return false;
  }
  const timeSinceActivation = (currentTime - activeAbility.activatedAt) / 1000;
  return timeSinceActivation < activeAbility.ability.duration;
}

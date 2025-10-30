/**
 * Space Effects Utilities
 * Shared functions for starfield animations, particle systems, and nebula effects
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  layer: 'far' | 'medium' | 'near';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface NebulaConfig {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
}

// ============================================================================
// STARFIELD GENERATION
// ============================================================================

/**
 * Generate a multi-layer starfield with parallax effect
 * @param width Canvas width
 * @param height Canvas height
 * @returns Array of 3 star layers [far, medium, near]
 */
export const generateStarfield = (
  width: number,
  height: number
): Star[][] => {
  const layers: Star[][] = [[], [], []];

  // Layer 0: Far stars (slow, small, dim)
  for (let i = 0; i < 150; i++) {
    layers[0].push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1,
      speed: 0.1 + Math.random() * 0.1, // 0.1-0.2
      opacity: 0.3 + Math.random() * 0.2, // 0.3-0.5
      layer: 'far',
    });
  }

  // Layer 1: Medium stars (medium speed, medium size/opacity)
  for (let i = 0; i < 100; i++) {
    layers[1].push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.5,
      speed: 0.3 + Math.random() * 0.2, // 0.3-0.5
      opacity: 0.5 + Math.random() * 0.2, // 0.5-0.7
      layer: 'medium',
    });
  }

  // Layer 2: Near stars (fast, large, bright)
  for (let i = 0; i < 50; i++) {
    layers[2].push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 2 + Math.random(), // 2-3px
      speed: 0.6 + Math.random() * 0.4, // 0.6-1.0
      opacity: 0.8 + Math.random() * 0.2, // 0.8-1.0
      layer: 'near',
    });
  }

  return layers;
};

// ============================================================================
// STARFIELD ANIMATION
// ============================================================================

/**
 * Update star positions (vertical scroll with wrap-around)
 * @param stars Array of star layers
 * @param height Canvas height
 */
export const updateStars = (stars: Star[][], height: number): void => {
  for (const layer of stars) {
    for (const star of layer) {
      star.y += star.speed;

      // Wrap around when star goes off bottom
      if (star.y > height) {
        star.y = 0;
      }
    }
  }
};

/**
 * Draw all stars on canvas
 * @param ctx Canvas 2D context
 * @param stars Array of star layers
 */
export const drawStarfield = (
  ctx: CanvasRenderingContext2D,
  stars: Star[][]
): void => {
  ctx.fillStyle = '#FFFFFF';

  // Draw each layer
  for (const layer of stars) {
    for (const star of layer) {
      ctx.globalAlpha = star.opacity;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  // Reset alpha
  ctx.globalAlpha = 1.0;
};

// ============================================================================
// PARTICLE SYSTEM (Score Effects)
// ============================================================================

/**
 * Create explosion particles for score events
 * @param x Center X position
 * @param y Center Y position
 * @param color Particle color (player color)
 * @returns Array of particles
 */
export const createScoreParticles = (
  x: number,
  y: number,
  color: string
): Particle[] => {
  const particles: Particle[] = [];
  const particleCount = 25;

  for (let i = 0; i < particleCount; i++) {
    // Random angle for radial explosion
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 2; // 2-4 pixels per frame

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60, // 1 second at 60fps
      maxLife: 60,
      color,
      size: 2 + Math.random() * 2, // 2-4px
    });
  }

  return particles;
};

/**
 * Update particle positions and remove dead particles
 * @param particles Array of particles
 * @returns Updated array with dead particles removed
 */
export const updateParticles = (particles: Particle[]): Particle[] => {
  const alive: Particle[] = [];

  for (const particle of particles) {
    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Optional: Add gravity
    particle.vy += 0.1;

    // Optional: Add friction
    particle.vx *= 0.98;
    particle.vy *= 0.98;

    // Decrease life
    particle.life--;

    // Keep if still alive
    if (particle.life > 0) {
      alive.push(particle);
    }
  }

  return alive;
};

/**
 * Draw active particles
 * @param ctx Canvas 2D context
 * @param particles Array of particles
 */
export const drawParticles = (
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void => {
  for (const particle of particles) {
    // Fade out based on remaining life
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;

    // Shrink size over time
    const currentSize = particle.size * alpha;

    ctx.fillStyle = particle.color;
    ctx.fillRect(
      particle.x - currentSize / 2,
      particle.y - currentSize / 2,
      currentSize,
      currentSize
    );
  }

  // Reset alpha
  ctx.globalAlpha = 1.0;
};

// ============================================================================
// NEBULA EFFECTS
// ============================================================================

/**
 * Create nebula configuration for canvas rendering
 * @param width Canvas width
 * @param height Canvas height
 * @returns Array of nebula configs
 */
export const createNebulaConfigs = (
  width: number,
  height: number
): NebulaConfig[] => {
  return [
    {
      x: width * 0.2,
      y: height * 0.3,
      radius: width * 0.4,
      color: '#6B2D9E', // Deep Violet
      opacity: 0.15,
    },
    {
      x: width * 0.8,
      y: height * 0.7,
      radius: width * 0.35,
      color: '#0095FF', // Electric Blue
      opacity: 0.12,
    },
    {
      x: width * 0.5,
      y: height * 0.5,
      radius: width * 0.5,
      color: '#9D4EDD', // Purple Haze
      opacity: 0.08,
    },
  ];
};

/**
 * Draw nebula fog effects on canvas
 * @param ctx Canvas 2D context
 * @param configs Array of nebula configurations
 */
export const drawNebula = (
  ctx: CanvasRenderingContext2D,
  configs: NebulaConfig[]
): void => {
  for (const config of configs) {
    const gradient = ctx.createRadialGradient(
      config.x,
      config.y,
      0,
      config.x,
      config.y,
      config.radius
    );

    // Create gradient from color to transparent
    gradient.addColorStop(0, `${config.color}${Math.floor(config.opacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `${config.color}${Math.floor(config.opacity * 0.5 * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Hex color to RGBA string
 * @param hex Hex color code
 * @param alpha Alpha value 0-1
 * @returns RGBA string
 */
export const hexToRGBA = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Space theme color constants
 */
export const SPACE_COLORS = {
  DEEP_BLACK: '#000000',
  STAR_WHITE: '#FFFFFF',
  CYAN: '#00FFFF',
  MAGENTA: '#FF00FF',
  DEEP_VIOLET: '#6B2D9E',
  ELECTRIC_BLUE: '#0095FF',
  PURPLE_HAZE: '#9D4EDD',
  DARK_INDIGO: '#1A0B2E',
};

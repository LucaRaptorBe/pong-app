'use client';

import { useEffect, useRef } from 'react';
import { generateStarfield, updateStars, drawStarfield, Star } from '@/lib/spaceEffects';

interface StarfieldBackgroundProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
}

/**
 * Animated starfield background component for menu screens
 * Uses canvas to render a parallax star field
 */
export default function StarfieldBackground({
  className = '',
  density = 'medium',
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[][]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Regenerate stars on resize
      const densityMultiplier = density === 'low' ? 0.5 : density === 'high' ? 1.5 : 1;
      starsRef.current = generateStarfield(
        canvas.width,
        canvas.height
      );

      // Adjust star count based on density
      if (density !== 'medium') {
        starsRef.current = starsRef.current.map(layer =>
          layer.slice(0, Math.floor(layer.length * densityMultiplier))
        );
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      updateStars(starsRef.current, canvas.height);
      drawStarfield(ctx, starsRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
}

'use client';

import { Augment, ActiveAbility, isAbilityReady, getRemainingCooldown, isAbilityEffectActive } from '@/lib/augments';
import { useEffect, useState } from 'react';

interface AbilityHUDProps {
  augments: Augment[];
  abilities: {
    q?: ActiveAbility;
    e?: ActiveAbility;
    r?: ActiveAbility;
  };
  isLeftSide: boolean; // true pour joueur 1 (gauche), false pour joueur 2 (droite)
}

export default function AbilityHUD({ augments, abilities, isLeftSide }: AbilityHUDProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time for cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100); // Update 10 times per second for smooth cooldown display

    return () => clearInterval(interval);
  }, []);

  const renderAbilitySlot = (key: 'q' | 'e' | 'r') => {
    const activeAbility = abilities[key];

    if (!activeAbility) {
      return (
        <div className="relative bg-black/50 border-2 border-gray-600/30 rounded-lg p-2 w-16 h-16 flex flex-col items-center justify-center opacity-50">
          <div className="text-xs text-gray-500 font-bold">{key.toUpperCase()}</div>
        </div>
      );
    }

    const ability = activeAbility.ability;
    const isReady = isAbilityReady(activeAbility, currentTime);
    const isActive = isAbilityEffectActive(activeAbility, currentTime);
    const remaining = getRemainingCooldown(activeAbility, currentTime);
    const cooldownPercent = isReady ? 0 : (remaining / ability.cooldown) * 100;

    return (
      <div className={`relative bg-black/70 border-2 rounded-lg p-2 w-16 h-16 flex flex-col items-center justify-center transition-all ${
        isActive ? 'border-electric-blue shadow-[0_0_20px_rgba(0,149,255,0.8)] animate-pulse' :
        isReady ? 'border-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]' :
        'border-gray-600/50'
      }`}>
        {/* Icône du sort */}
        <div className={`text-2xl ${isReady ? '' : 'opacity-40 grayscale'}`}>
          {ability.icon}
        </div>

        {/* Touche */}
        <div className={`text-[10px] font-bold ${isReady ? 'text-cyan' : 'text-gray-500'}`}>
          {key.toUpperCase()}
        </div>

        {/* Overlay de cooldown */}
        {!isReady && (
          <>
            <div
              className="absolute inset-0 bg-black/60 rounded-lg"
              style={{
                clipPath: `polygon(0 ${cooldownPercent}%, 100% ${cooldownPercent}%, 100% 100%, 0 100%)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
              {Math.ceil(remaining)}
            </div>
          </>
        )}

        {/* Indicateur d'effet actif */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-electric-blue rounded-full animate-ping" />
        )}
      </div>
    );
  };

  return (
    <div className={`absolute ${isLeftSide ? 'left-4' : 'right-4'} bottom-4 flex flex-col gap-3`}>
      {/* Augments actifs */}
      {augments.length > 0 && (
        <div className="bg-black/70 border-2 border-cyan/30 rounded-lg p-2 backdrop-blur-sm">
          <div className="text-xs text-cyan mb-1 font-bold">Augments</div>
          <div className="flex flex-col gap-1">
            {augments.map((augment, index) => (
              <div key={`${augment.id}-${index}`} className="flex items-center gap-2 text-xs">
                <span className="text-lg">{augment.icon}</span>
                <span className="text-gray-300 text-[10px]">{augment.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sorts actifs */}
      <div className="bg-black/70 border-2 border-magenta/30 rounded-lg p-2 backdrop-blur-sm">
        <div className="text-xs text-magenta mb-2 font-bold">Sorts</div>
        <div className="flex gap-2">
          {renderAbilitySlot('q')}
          {renderAbilitySlot('e')}
          {renderAbilitySlot('r')}
        </div>
      </div>
    </div>
  );
}

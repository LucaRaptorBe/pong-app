'use client';

import { Augment, Ability } from '@/lib/augments';

interface AugmentSelectionProps {
  augments: Augment[];
  abilities: Ability[];
  onSelectAugment: (augment: Augment) => void;
  onSelectAbility: (ability: Ability) => void;
  playerNumber: number;
  isYourTurn: boolean;
  showAbilitySelection: boolean; // true pour le premier choix (sorts), false ensuite (augments)
}

export default function AugmentSelection({
  augments,
  abilities,
  onSelectAugment,
  onSelectAbility,
  playerNumber,
  isYourTurn,
  showAbilitySelection,
}: AugmentSelectionProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-cyan/50 bg-cyan/5 hover:bg-cyan/10';
      case 'rare':
        return 'border-electric-blue/50 bg-electric-blue/5 hover:bg-electric-blue/10';
      case 'epic':
        return 'border-magenta/50 bg-magenta/5 hover:bg-magenta/10';
      default:
        return 'border-cyan/50 bg-cyan/5 hover:bg-cyan/10';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-cyan';
      case 'rare':
        return 'text-electric-blue';
      case 'epic':
        return 'text-magenta';
      default:
        return 'text-cyan';
    }
  };

  if (!isYourTurn) {
    return (
      <div className="absolute z-20 inset-0 flex items-center justify-center bg-black/70">
        <div className="space-card-glow p-8 rounded-lg text-center">
          <div className="animate-pulse text-purple-haze text-xl">
            ⏳ En attente de la sélection de l'adversaire...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute z-20 inset-0 flex items-center justify-center bg-black/80">
      <div className="space-card-glow p-8 rounded-lg max-w-4xl w-full mx-4">
        <h2 className="text-3xl text-cyan-glow mb-2 text-center">
          {showAbilitySelection ? '⚔️ Choisissez votre Sort' : '✨ Choisissez votre Augment'}
        </h2>
        <p className="text-center text-purple-haze mb-6">
          {showAbilitySelection
            ? 'Sélectionnez un sort que vous pourrez activer pendant la partie'
            : 'Sélectionnez un augment passif pour améliorer vos capacités'
          }
        </p>

        {showAbilitySelection ? (
          // Affichage des sorts
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {abilities.map((ability) => (
              <button
                key={ability.id}
                onClick={() => onSelectAbility(ability)}
                className={`border-2 rounded-lg p-6 transition-all duration-200 transform hover:scale-105 text-left ${getRarityColor('epic')}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{ability.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-magenta-glow">{ability.name}</h3>
                      <span className="text-xs bg-black/50 px-2 py-1 rounded text-electric-blue border border-electric-blue/30">
                        Touche {ability.key.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{ability.description}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-cyan">⏱️ Cooldown: {ability.cooldown}s</span>
                      {ability.duration && (
                        <span className="text-electric-blue">⌛ Durée: {ability.duration}s</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Affichage des augments
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {augments.map((augment) => (
              <button
                key={augment.id}
                onClick={() => onSelectAugment(augment)}
                className={`border-2 rounded-lg p-6 transition-all duration-200 transform hover:scale-105 ${getRarityColor(augment.rarity)}`}
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{augment.icon}</div>
                  <h3 className={`text-lg font-bold mb-2 ${getRarityGlow(augment.rarity)} text-space-glow`}>
                    {augment.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">{augment.description}</p>
                  <span className={`text-xs px-2 py-1 rounded ${getRarityGlow(augment.rarity)} bg-black/50 border border-current`}>
                    {augment.rarity.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-purple-haze">
          Cliquez sur une carte pour faire votre choix
        </div>
      </div>
    </div>
  );
}

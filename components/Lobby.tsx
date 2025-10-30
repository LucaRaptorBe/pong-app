'use client';

import { useState } from 'react';
import { generateRoomCode } from '@/lib/socketConnection';
import StarfieldBackground from '@/components/StarfieldBackground';

interface LobbyProps {
  onCreateRoom: () => void; // Plus besoin de passer le code
  onJoinRoom: (roomCode: string) => void;
  onBackToMenu: () => void;
}

export default function Lobby({ onCreateRoom, onJoinRoom, onBackToMenu }: LobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    // Lancer directement la création, sans passer par l'écran intermédiaire
    onCreateRoom();
  };

  const handleJoinRoom = () => {
    if (roomCode.trim().length > 0) {
      onJoinRoom(roomCode.trim());
    } else {
      setError('Veuillez entrer un code valide');
    }
  };

  // Plus utilisé car on ne passe plus par l'écran intermédiaire

  return (
    <>
      <StarfieldBackground density="medium" />
      <div className="flex flex-col items-center justify-center min-h-screen bg-space-nebula p-4">
        <h1 className="text-5xl font-bold text-cyan-glow mb-2 animate-float">PONG ONLINE</h1>
        <p className="text-magenta-glow mb-8">Multiplayer Mode</p>

        {mode === 'select' && (
          <div className="space-card p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl text-cyan mb-6 text-center text-space-glow">Mode multijoueur</h2>

            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                className="hologram-button-primary w-full px-6 py-4 rounded text-xl font-bold flex items-center justify-center gap-3"
              >
                <span>🎮</span>
                <span>Créer une partie</span>
              </button>

              <button
                onClick={() => setMode('join')}
                className="hologram-button-secondary w-full px-6 py-4 rounded text-xl font-bold flex items-center justify-center gap-3"
              >
                <span>🔗</span>
                <span>Rejoindre une partie</span>
              </button>

              <button
                onClick={onBackToMenu}
                className="hologram-button-tertiary w-full px-6 py-3 rounded flex items-center justify-center gap-2"
              >
                <span>←</span>
                <span>Retour au menu</span>
              </button>
            </div>
          </div>
        )}


        {mode === 'join' && (
          <div className="space-card-glow p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl text-magenta mb-6 text-center text-space-glow">Rejoindre une partie</h2>

            <div className="mb-6">
              <label className="text-cyan block mb-2 text-space-glow">
                Entrez le code de la partie :
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-black/50 text-white text-3xl font-bold text-center p-4 rounded border-2 border-magenta focus:border-magenta focus:outline-none uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,255,0.3)] focus:shadow-[0_0_20px_rgba(255,0,255,0.5)]"
                style={{ textShadow: '0 0 8px rgba(255, 0, 255, 0.6)' }}
              />
              {error && (
                <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
              )}
              <p className="text-purple-haze text-xs mt-2 text-center">
                Code à 6 caractères fourni par l'hôte
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleJoinRoom}
                disabled={roomCode.trim().length === 0}
                className="hologram-button-secondary w-full px-6 py-3 rounded font-bold"
              >
                Rejoindre
              </button>

              <button
                onClick={() => setMode('select')}
                className="hologram-button-tertiary w-full px-6 py-2 rounded"
              >
                Retour
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-purple-haze text-sm text-center max-w-md">
          <p>💡 Astuce : Les deux joueurs doivent être connectés en même temps</p>
        </div>
      </div>
    </>
  );
}

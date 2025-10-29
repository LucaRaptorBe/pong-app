'use client';

import { useState } from 'react';
import { generateRoomCode } from '@/lib/socketConnection';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <h1 className="text-5xl font-bold text-white mb-8">PONG ONLINE</h1>

      {mode === 'select' && (
        <div className="bg-gray-900 p-8 rounded-lg border-2 border-white/20 max-w-md w-full">
          <h2 className="text-2xl text-white mb-6 text-center">Mode multijoueur</h2>

          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded text-xl font-bold transition"
            >
              🎮 Créer une partie
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded text-xl font-bold transition"
            >
              🔗 Rejoindre une partie
            </button>

            <button
              onClick={onBackToMenu}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded transition"
            >
              ← Retour au menu
            </button>
          </div>
        </div>
      )}


      {mode === 'join' && (
        <div className="bg-gray-900 p-8 rounded-lg border-2 border-blue-500 max-w-md w-full">
          <h2 className="text-2xl text-white mb-6 text-center">Rejoindre une partie</h2>

          <div className="mb-6">
            <label className="text-gray-300 block mb-2">
              Entrez le code PeerJS complet :
            </label>
            <textarea
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
                setError('');
              }}
              placeholder="7b3f1d2e-8c9a-4e5f-b6d7-a1b2c3d4e5f6"
              rows={3}
              className="w-full bg-black/50 text-white text-sm font-mono text-center p-4 rounded border-2 border-blue-400 focus:border-blue-300 focus:outline-none resize-none"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
            )}
            <p className="text-gray-500 text-xs mt-2 text-center">
              Copiez/collez le code complet fourni par l'hôte
            </p>
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={roomCode.trim().length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded font-bold transition"
          >
            Rejoindre
          </button>

          <button
            onClick={() => setMode('select')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded mt-3 transition"
          >
            Retour
          </button>
        </div>
      )}

      <div className="mt-8 text-gray-500 text-sm text-center max-w-md">
        <p>💡 Astuce : Les deux joueurs doivent être connectés en même temps</p>
      </div>
    </div>
  );
}

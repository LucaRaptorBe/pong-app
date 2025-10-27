'use client';

import { useState } from 'react';
import { generateRoomCode } from '@/lib/supabase';

interface LobbyProps {
  onCreateRoom: (roomCode: string) => void;
  onJoinRoom: (roomCode: string) => void;
  onBackToMenu: () => void;
}

export default function Lobby({ onCreateRoom, onJoinRoom, onBackToMenu }: LobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setGeneratedCode(code);
    setMode('create');
  };

  const handleStartGame = () => {
    if (generatedCode) {
      onCreateRoom(generatedCode);
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.length === 6) {
      onJoinRoom(roomCode.toUpperCase());
    } else {
      setError('Le code doit contenir 6 caractères');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copié dans le presse-papier !');
  };

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

      {mode === 'create' && (
        <div className="bg-gray-900 p-8 rounded-lg border-2 border-green-500 max-w-md w-full">
          <h2 className="text-2xl text-white mb-4 text-center">Partie créée !</h2>

          <div className="bg-black/50 p-6 rounded mb-6">
            <p className="text-gray-400 text-sm mb-2 text-center">Code de la salle :</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-mono font-bold text-green-400 tracking-wider">
                {generatedCode}
              </p>
              <button
                onClick={copyToClipboard}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition"
                title="Copier le code"
              >
                📋
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 text-center mb-2">
              Partagez ce code avec votre adversaire
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-pulse text-yellow-400 text-center">
                ⏳ En attente d'un joueur...
              </div>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold transition"
          >
            Commencer la partie
          </button>

          <button
            onClick={() => setMode('select')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded mt-3 transition"
          >
            Annuler
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="bg-gray-900 p-8 rounded-lg border-2 border-blue-500 max-w-md w-full">
          <h2 className="text-2xl text-white mb-6 text-center">Rejoindre une partie</h2>

          <div className="mb-6">
            <label className="text-gray-300 block mb-2">
              Entrez le code de la salle :
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError('');
              }}
              maxLength={6}
              placeholder="ABC123"
              className="w-full bg-black/50 text-white text-2xl font-mono font-bold text-center p-4 rounded border-2 border-blue-400 focus:border-blue-300 focus:outline-none tracking-wider"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
            )}
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={roomCode.length !== 6}
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

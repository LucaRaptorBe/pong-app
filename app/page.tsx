'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PongGame from '@/components/PongGame';

const Lobby = dynamic(() => import('@/components/Lobby'), { ssr: false });
const OnlinePongGame = dynamic(() => import('@/components/OnlinePongGame'), { ssr: false });

type GameMode = 'menu' | 'local' | 'online-lobby' | 'online-game';

export default function Home() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);

  const handleCreateRoom = (code: string) => {
    setRoomCode(code);
    setIsHost(true);
    setMode('online-game');
  };

  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
    setIsHost(false);
    setMode('online-game');
  };

  const handleLeaveGame = () => {
    setMode('menu');
    setRoomCode('');
    setIsHost(false);
  };

  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <h1 className="text-6xl font-bold text-white mb-2">PONG</h1>
        <p className="text-gray-400 mb-12">Jeu classique pour 2 joueurs</p>

        <div className="bg-gray-900 p-8 rounded-lg border-2 border-white/20 max-w-md w-full space-y-4">
          <button
            onClick={() => setMode('local')}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded text-xl font-bold transition flex items-center justify-center gap-3"
          >
            <span>🎮</span>
            <span>Mode Local</span>
          </button>

          <button
            onClick={() => setMode('online-lobby')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded text-xl font-bold transition flex items-center justify-center gap-3"
          >
            <span>🌐</span>
            <span>Mode En Ligne</span>
          </button>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center mb-2">
              <strong className="text-white">Mode Local :</strong> 2 joueurs sur le même ordinateur
            </p>
            <p className="text-gray-400 text-sm text-center">
              <strong className="text-white">Mode En Ligne :</strong> Jouez contre quelqu'un d'autre via Internet
            </p>
          </div>
        </div>

        <div className="mt-8 text-gray-500 text-xs text-center">
          <p>Créé avec Next.js + Supabase</p>
        </div>
      </div>
    );
  }

  if (mode === 'local') {
    return <PongGame onBackToMenu={handleLeaveGame} />;
  }

  if (mode === 'online-lobby') {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onBackToMenu={handleLeaveGame}
      />
    );
  }

  if (mode === 'online-game') {
    return (
      <OnlinePongGame
        roomCode={roomCode}
        isHost={isHost}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  return null;
}

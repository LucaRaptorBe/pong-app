'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PongGame from '@/components/PongGame';
import StarfieldBackground from '@/components/StarfieldBackground';

const Lobby = dynamic(() => import('@/components/Lobby'), { ssr: false });
const OnlinePongGame = dynamic(() => import('@/components/OnlinePongGame'), { ssr: false });

type GameMode = 'menu' | 'local' | 'online-lobby' | 'online-game';

export default function Home() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);

  const handleCreateRoom = () => {
    // Générer un placeholder, le vrai code sera généré par PeerJS
    setRoomCode('generating...');
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
      <>
        <StarfieldBackground density="medium" />
        <div className="flex flex-col items-center justify-center min-h-screen bg-space-nebula p-4">
          <h1 className="text-6xl font-bold text-white mb-2 text-cyan-glow animate-float">PONG</h1>
          <p className="text-gray-300 mb-12 text-space-glow">Deep Space Edition</p>

          <div className="space-card p-8 rounded-lg max-w-md w-full space-y-4">
            <button
              onClick={() => setMode('local')}
              className="hologram-button-primary w-full px-8 py-4 rounded text-xl flex items-center justify-center gap-3"
            >
              <span>🎮</span>
              <span>Mode Local</span>
            </button>

            <button
              onClick={() => setMode('online-lobby')}
              className="hologram-button-secondary w-full px-8 py-4 rounded text-xl flex items-center justify-center gap-3"
            >
              <span>🌐</span>
              <span>Mode En Ligne</span>
            </button>

            <div className="pt-4 border-t border-cyan/30">
              <p className="text-gray-300 text-sm text-center mb-2">
                <strong className="text-cyan">Mode Local :</strong> 2 joueurs sur le même ordinateur
              </p>
              <p className="text-gray-300 text-sm text-center">
                <strong className="text-magenta">Mode En Ligne :</strong> Jouez contre quelqu'un via Internet
              </p>
            </div>
          </div>

        </div>
      </>
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

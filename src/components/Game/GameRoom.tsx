
import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import QuestionDisplay from './QuestionDisplay';
import GameTimer from './GameTimer';
import GameStatus from './GameStatus';
import { Check, Copy, XCircle } from 'lucide-react';
import { toast } from "sonner";
import GameLeaderboard from './GameLeaderboard';
import LiveGameDashboard from './LiveGameDashboard';

const GameRoom = () => {
  const { 
    roomCode, 
    isGameActive, 
    gameStartCountdown, 
    readyUp,
    players,
    currentQuestionIndex,
    questions,
    gameElapsedTime,
    endGame,
    isHost,
    endRoom,
  } = useGame();
  
  const { user } = useAuth();
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    if (!roomCode) return;
    
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied to clipboard!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadyUp = () => {
    if (!user?.id) return;
    readyUp(user.id);
    console.log("Player ready:", user.id);
  };

  const currentPlayer = players.find(player => player.id === user?.id);

  const handleGameComplete = () => {
    endGame();
    setShowResults(true);
  };

  const handleEndRoom = () => {
    if (window.confirm('End this room for every player? This cannot be undone.')) endRoom();
  };

  // Current game state UI
  if (showResults || (isGameActive === false && currentQuestionIndex > 0)) {
    return <GameLeaderboard onPlayAgain={() => window.location.reload()} />;
  }

  if (isGameActive) {
    return (
      <div className="game-container max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
              <h2 className="text-2xl font-bold text-white">Live Treasure Hunt</h2>
            </div>
            <p className="text-white/70">Question {currentQuestionIndex + 1} of {questions.length} · {players.length} hunters in this room</p>
          </div>
          <div className="flex items-center gap-3">
            <GameTimer />
            {isHost && <button onClick={handleEndRoom} className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"><XCircle size={15} /> <span className="hidden sm:inline">End room</span></button>}
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <QuestionDisplay onComplete={handleGameComplete} />
          <LiveGameDashboard />
        </div>
      </div>
    );
  }

  if (gameStartCountdown < 10) {
    return (
      <div className="game-card text-center py-12 animate-fade-in">
        <h2 className="text-4xl font-bold text-game-gold mb-8">Game Starting In</h2>
        <div className="text-6xl font-bold text-white animate-pulse-glow mb-8">
          {gameStartCountdown}
        </div>
        <p className="text-white/70">Get ready to find the treasure!</p>
      </div>
    );
  }

  return (
    <div className="game-card animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Game Room</h2>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <div className="bg-white/10 rounded-lg px-3 py-1 flex items-center">
            <span className="text-white/70 mr-2">Room Code:</span>
            <span className="font-mono font-bold text-game-gold">{roomCode}</span>
            <button 
              onClick={copyRoomCode} 
              className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Copy room code"
            >
              {copied ? (
                <Check className="text-green-500" size={16} />
              ) : (
                <Copy className="text-white/70" size={16} />
              )}
            </button>
          </div>
          {isHost && <button onClick={handleEndRoom} className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"><XCircle size={15} /> End room</button>}
        </div>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <GameStatus />
      </div>
      
      <div className="flex flex-col items-center">
        <Button 
          onClick={handleReadyUp} 
          className={`game-button w-full ${currentPlayer?.isReady ? 'bg-green-600 hover:bg-green-700' : ''}`} 
          disabled={currentPlayer?.isReady === true}
        >
          {currentPlayer?.isReady ? 'Ready!' : 'Ready Up'}
        </Button>
        
        <p className="text-white/60 text-sm mt-4 text-center">
          Waiting for all players to be ready. The game will start automatically once everyone is ready.
        </p>
      </div>
    </div>
  );
};

export default GameRoom;

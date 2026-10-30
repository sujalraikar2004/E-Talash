
import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface GameLeaderboardProps {
  onPlayAgain: () => void;
}

const GameLeaderboard = ({ onPlayAgain }: GameLeaderboardProps) => {
  const { players, gameElapsedTime, solvedQuestionIds, questions, isHost, endRoom } = useGame();
  const { user } = useAuth();

  const handleEndRoom = () => {
    if (window.confirm('End this room for every player? This cannot be undone.')) endRoom();
  };

  // Format seconds to minutes:seconds
  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return "Not completed";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-card animate-fade-in">
      <div className="flex items-center justify-center mb-6">
        <Trophy className="text-game-gold mr-2" size={32} />
        <h2 className="text-3xl font-bold text-white">Hunt Results</h2>
      </div>
      
      <div className="bg-white/10 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/70">Total Time:</span>
          <span className="text-white font-bold">{gameElapsedTime} seconds</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Questions Completed:</span>
          <span className="text-white font-bold">{Math.min(solvedQuestionIds.length, questions.length)} / {questions.length}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-game-gold mb-4">Leaderboard</h3>
      
      <div className="space-y-3 mb-6">
        {players
          .sort((a, b) => {
            // Sort by completion time (fastest first)
            const timeA = a.completionTime || Number.MAX_VALUE;
            const timeB = b.completionTime || Number.MAX_VALUE;
            return timeA - timeB;
          })
          .map((player, index) => (
            <div 
              key={player.id}
              className={`${index === 0 ? 'bg-game-gold/20 border border-game-gold' : 'bg-white/10'} p-3 rounded-lg flex justify-between items-center`}
            >
              <div className="flex items-center">
                <span 
                  className={`${index === 0 ? 'bg-game-gold text-game-dark' : 'bg-white/20'} w-6 h-6 rounded-full flex items-center justify-center font-bold mr-2`}
                >
                  {index + 1}
                </span>
                <span className="font-semibold">{player.username} {player.id === user?.id ? '(You)' : ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <Clock size={16} className="text-white/70 mr-1" />
                  <span className="text-white/90">{formatTime(player.completionTime)}</span>
                </div>
                <span className="font-bold">{player.score} pts</span>
              </div>
            </div>
          ))}
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onPlayAgain} className="game-button w-full">Play Again</Button>
        {isHost && <Button onClick={handleEndRoom} variant="outline" className="w-full border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"><XCircle size={16} className="mr-2" /> End Room</Button>}
      </div>
    </div>
  );
};

export default GameLeaderboard;

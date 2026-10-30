import { useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleDot,
  Clock3,
  Crown,
  Gauge,
  Signal,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';

const formatTime = (seconds: number | undefined) => {
  if (seconds === undefined) return '—';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

const LiveGameDashboard = () => {
  const { user } = useAuth();
  const { players, questions, solvedQuestionIds, gameElapsedTime, roomCode } = useGame();

  const rankedPlayers = useMemo(() => [...players].sort((first, second) => {
    if (first.completionTime !== undefined && second.completionTime === undefined) return -1;
    if (first.completionTime === undefined && second.completionTime !== undefined) return 1;
    if (first.score !== second.score) return second.score - first.score;
    return (second.solvedQuestionIds?.length || 0) - (first.solvedQuestionIds?.length || 0);
  }), [players]);

  const onlinePlayers = players.filter(player => player.connected !== false).length;
  const finishedPlayers = players.filter(player => player.completionTime !== undefined).length;
  const averageProgress = players.length
    ? Math.round(players.reduce((total, player) => total + Math.min(player.solvedQuestionIds?.length || 0, questions.length), 0) / players.length)
    : 0;
  const totalScore = players.reduce((total, player) => total + player.score, 0);
  const leader = rankedPlayers[0];

  return (
    <aside className="game-card h-fit space-y-5 lg:sticky lg:top-6" aria-label="Live game dashboard">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-game-gold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            Live dashboard
          </div>
          <h3 className="mt-2 text-xl font-bold text-white">Room {roomCode}</h3>
        </div>
        <Activity className="text-game-primary" size={22} aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/55"><Clock3 size={14} /> Elapsed</div>
          <p className="mt-1 font-mono text-xl font-bold text-white">{formatTime(gameElapsedTime)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/55"><Gauge size={14} /> Progress</div>
          <p className="mt-1 text-xl font-bold text-white">{Math.min(solvedQuestionIds.length, questions.length)}/{questions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/55"><Users size={14} /> Hunters online</div>
          <p className="mt-1 text-xl font-bold text-white">{onlinePlayers}<span className="text-sm font-normal text-white/40">/{players.length}</span></p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/55"><Trophy size={14} /> Total points</div>
          <p className="mt-1 text-xl font-bold text-game-gold">{totalScore}</p>
        </div>
      </div>

      <div className="rounded-xl border border-game-gold/20 bg-game-gold/10 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-game-gold">
          <Crown size={14} /> Current leader
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="truncate font-semibold text-white">{leader?.username || 'Waiting for hunters'}</span>
          <span className="whitespace-nowrap font-mono text-sm text-game-gold">{leader?.score || 0} pts</span>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-white">Live standings</h4>
          <span className="text-xs text-white/45">{averageProgress}% avg · {finishedPlayers} finished</span>
        </div>
        <div className="space-y-2">
          {rankedPlayers.map((player, index) => {
            const progress = questions.length ? Math.round(((player.solvedQuestionIds?.length || 0) / questions.length) * 100) : 0;
            const isCurrentUser = player.id === user?.id;
            const isFinished = player.completionTime !== undefined;
            const isOffline = player.connected === false;
            return (
              <div key={player.id} className={`rounded-xl border p-3 ${isCurrentUser ? 'border-game-primary/70 bg-game-primary/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-game-gold text-game-dark' : 'bg-white/15 text-white/70'}`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                    {player.username}{isCurrentUser ? ' (You)' : ''}
                  </span>
                  {isOffline ? <WifiOff className="text-white/35" size={14} /> : <Wifi className="text-green-400" size={14} />}
                  <span className="font-mono text-xs font-semibold text-game-gold">{player.score}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                  <span className="flex items-center gap-1">
                    {isFinished ? <CheckCircle2 className="text-green-400" size={13} /> : isOffline ? <WifiOff size={13} /> : <CircleDot className="text-game-primary" size={13} />}
                    {isFinished ? `Finished in ${formatTime(player.completionTime)}` : isOffline ? 'Offline — progress saved' : `${player.solvedQuestionIds?.length || 0}/${questions.length} solved`}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full transition-all duration-500 ${isFinished ? 'bg-green-400' : 'bg-gradient-to-r from-game-primary to-game-gold'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/45">
        <Signal size={15} className="mt-0.5 shrink-0 text-game-primary" />
        <span>Standings update live. Leaving the game saves your progress and your timer keeps running.</span>
      </div>
    </aside>
  );
};

export default LiveGameDashboard;

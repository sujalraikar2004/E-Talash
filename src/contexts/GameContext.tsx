import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { FINAL_QUESTION_ID, Question, REGULAR_QUESTION_COUNT, getQuestionsByIds, getRoomQuestions } from '@/data/questions';
import { useAuth } from './AuthContext';

interface Player {
  id: string;
  username: string;
  score: number;
  isReady: boolean;
  completionTime?: number;
  currentQuestionIndex: number;
  questionOrder?: number[];
  solvedQuestionIds?: number[];
  connected?: boolean;
}

interface GameContextType {
  isGameActive: boolean;
  activeQuestion: Question | null;
  currentQuestionIndex: number;
  players: Player[];
  timeRemaining: number;
  gameStartCountdown: number;
  gameElapsedTime: number;
  roomCode: string | null;
  isHost: boolean;
  questions: Question[];
  solvedQuestionIds: number[];
  socket: Socket | null;
  
  startGame: () => void;
  joinRoom: (code: string) => void;
  createRoom: () => void;
  submitAnswer: (answer: string) => boolean;
  endGame: () => void;
  resetGame: () => void;
  selectQuestion: (index: number) => void;
  readyUp: (playerId: string) => void;
  leaveRoom: () => void;
  endRoom: () => void;
  checkAllReady: () => boolean;
}

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL
  || (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : `http://${import.meta.env.VITE_MACHINE_IP || "localhost"}:3001`);

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [isGameActive, setIsGameActive] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [gameStartCountdown, setGameStartCountdown] = useState(10);
  const [gameElapsedTime, setGameElapsedTime] = useState(0);
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem('treasureHuntRoomCode'));
  const [hostId, setHostId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solvedQuestionIds, setSolvedQuestionIds] = useState<number[]>([]);
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const gameTimerRef = useRef<number | null>(null);
  const startGameRef = useRef<(startsAt: number, questionIndex?: number, questionOrder?: number[]) => void>(() => undefined);
  const countdownTimerRef = useRef<number | null>(null);
  const roomCodeRef = useRef(roomCode);
  const currentUserRef = useRef(user);
  const joinedRoomRef = useRef('');
  const playersRef = useRef(players);
  roomCodeRef.current = roomCode;
  currentUserRef.current = user;
  playersRef.current = players;

  const getPlayerQuestions = (questionOrder?: number[]) =>
    questionOrder?.length ? getQuestionsByIds(questionOrder) : getRoomQuestions(roomCodeRef.current || '');
  
  const checkAllReady = useCallback(() => {
    if (players.length === 0) return false;
    return players.every(player => player.isReady);
  }, [players]);
  
  const clearGameTimer = useCallback(() => {
    if (gameTimerRef.current !== null) {
      window.clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (!socket) {
      const newSocket = io(SOCKET_SERVER_URL);
      
      newSocket.on('connect', () => {
        console.log('Connected to game server');
      });
      
      newSocket.on('playerJoined', (newPlayer: Player) => {
        console.log('Player joined:', newPlayer);
        setPlayers(prevPlayers => {
          const playerExists = prevPlayers.some(p => p.id === newPlayer.id);
          if (playerExists) return prevPlayers;
          return [...prevPlayers, newPlayer];
        });
        toast.info(`${newPlayer.username} joined the room`);
      });
      
      newSocket.on('playerLeft', (playerId: string) => {
        console.log('Player left:', playerId);
        setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
      });

      newSocket.on('playerDisconnected', (playerId: string) => {
        setPlayers(prevPlayers => prevPlayers.map(player => player.id === playerId ? { ...player, connected: false } : player));
      });

      newSocket.on('playerReconnected', (player: Player) => {
        setPlayers(prevPlayers => prevPlayers.map(existing => existing.id === player.id ? player : existing));
      });
      
      newSocket.on('playerReady', (playerId: string) => {
        console.log('Player ready:', playerId);
        setPlayers(prevPlayers => 
          prevPlayers.map(p => 
            p.id === playerId ? { ...p, isReady: true } : p
          )
        );
      });
      
      newSocket.on('gameStart', ({ startsAt }: { startsAt: number }) => {
        console.log('Game starting from server event');
        startGameRef.current(startsAt);
      });
      
      newSocket.on('gameEnd', (finalPlayers: Player[]) => {
        setPlayers(finalPlayers);
        setIsGameActive(false); // Keep showing the leaderboard
      });

      newSocket.on('roomEnded', () => {
        clearGameTimer();
        joinedRoomRef.current = '';
        setRoomCode(null);
        setHostId(null);
        setPlayers([]);
        setQuestions([]);
        setActiveQuestion(null);
        setCurrentQuestionIndex(0);
        setIsGameActive(false);
        localStorage.removeItem('treasureHuntRoomCode');
        localStorage.removeItem('treasureHuntRoomUserId');
        toast.info('The room was ended by its creator');
      });
      
      newSocket.on('roomCreated', (code: string) => {
        setRoomCode(code);
      });
      
      newSocket.on('roomState', (roomData: { hostId?: string | null; players?: Player[]; phase?: string; gameStartedAt?: number | null }) => {
        console.log('Room state received:', roomData);
        setHostId(roomData.hostId || null);
        if (roomData.players) {
          setPlayers(roomData.players);
          const ownPlayer = roomData.players.find(player => player.id === currentUserRef.current?.id);
          const nextQuestions = getPlayerQuestions(ownPlayer?.questionOrder);
          setQuestions(nextQuestions);
          const nextIndex = ownPlayer?.currentQuestionIndex || 0;
          setSolvedQuestionIds(ownPlayer?.solvedQuestionIds || []);
          setCurrentQuestionIndex(nextIndex);
          setActiveQuestion(nextQuestions[nextIndex] || null);
          if ((roomData.phase === 'playing' || roomData.phase === 'countdown') && roomData.gameStartedAt) {
            startGameRef.current(roomData.gameStartedAt, nextIndex, ownPlayer?.questionOrder);
          } else if (roomData.phase === 'waiting') {
            clearGameTimer();
            setIsGameActive(false);
          }
        }
      });
      
      newSocket.on('updateScores', (updatedPlayers: Player[]) => {
        console.log('Updated player scores received:', updatedPlayers);
        setPlayers(updatedPlayers);
        const ownPlayer = updatedPlayers.find(player => player.id === currentUserRef.current?.id);
        if (ownPlayer) {
          setSolvedQuestionIds(ownPlayer.solvedQuestionIds || []);
        }
      });

      newSocket.on('gameReset', () => {
        clearGameTimer();
        setIsGameActive(false);
        setActiveQuestion(null);
        setCurrentQuestionIndex(0);
        setGameElapsedTime(0);
        setGameStartCountdown(10);
        setPlayers(prevPlayers => prevPlayers.map(player => ({ ...player, isReady: false, score: 0, completionTime: undefined, currentQuestionIndex: 0 })));
        setSolvedQuestionIds([]);
      });

      newSocket.on('error', ({ message }: { message?: string }) => {
        toast.error(message || 'Something went wrong');
      });
      
      setSocket(newSocket);
      
      return () => {
        clearGameTimer();
        newSocket.disconnect();
      };
    }
  // This bootstrap effect intentionally runs only when the provider mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearGameTimer]);
  
  useEffect(() => {
    return () => {
      clearGameTimer();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket, clearGameTimer]);

  useEffect(() => {
    const savedRoomUserId = localStorage.getItem('treasureHuntRoomUserId');
    if (user && savedRoomUserId && savedRoomUserId !== user.id) {
      setRoomCode(null);
      localStorage.removeItem('treasureHuntRoomCode');
      localStorage.removeItem('treasureHuntRoomUserId');
      return;
    }
    if (!socket || !user || !roomCode) return;
    const key = `${user.id}:${roomCode}`;
    if (joinedRoomRef.current === key) return;
    const join = () => {
      socket.emit('joinRoom', { roomCode, user: { id: user.id, username: user.username } });
      joinedRoomRef.current = key;
    };
    if (socket.connected) join();
    else socket.once('connect', join);
    return () => socket.off('connect', join);
  }, [socket, user, roomCode]);

  useEffect(() => {
    if (!user && joinedRoomRef.current && socket && roomCode) {
      socket.emit('pauseRoom', { roomCode });
      joinedRoomRef.current = '';
    }
  }, [user, socket, roomCode]);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = () => {
    if (!socket) return;
    
    const code = generateRoomCode();
    socket.emit('createRoom', { roomCode: code, user });
    setRoomCode(code);
    localStorage.setItem('treasureHuntRoomCode', code);
    if (user) localStorage.setItem('treasureHuntRoomUserId', user.id);
    joinedRoomRef.current = `${user?.id || ''}:${code}`;
    toast.success(`Room created! Code: ${code}`);
    return code;
  };

  const joinRoom = (code: string) => {
    if (!socket || !user) return;

    socket.emit('joinRoom', {
      roomCode: code.trim().toUpperCase(),
      user: { id: user.id, username: user.username },
    });
    setRoomCode(code.trim().toUpperCase());
    localStorage.setItem('treasureHuntRoomCode', code.trim().toUpperCase());
    localStorage.setItem('treasureHuntRoomUserId', user.id);
    joinedRoomRef.current = `${user.id}:${code.trim().toUpperCase()}`;
  };

  const startGame = useCallback((startsAt = Date.now() + 10000, resumeIndex = 0, questionOrder?: number[]) => {
    if (!socket) return;
    console.log('Starting game countdown');
    clearGameTimer();
    const currentPlayer = playersRef.current.find(player => player.id === currentUserRef.current?.id);
    const gameQuestions = getPlayerQuestions(questionOrder || currentPlayer?.questionOrder);
    setQuestions(gameQuestions);
    setCurrentQuestionIndex(resumeIndex);
    setActiveQuestion(gameQuestions[resumeIndex] || null);
    const activate = () => {
      setGameStartCountdown(0);
      setIsGameActive(true);
      setGameElapsedTime(Math.max(0, Math.floor((Date.now() - startsAt) / 1000)));
      gameTimerRef.current = window.setInterval(() => {
        setGameElapsedTime(Math.max(0, Math.floor((Date.now() - startsAt) / 1000)));
      }, 250);
    };
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((startsAt - Date.now()) / 1000));
      setGameStartCountdown(remaining);
      if (remaining === 0) {
        clearGameTimer();
        activate();
      }
    };
    updateCountdown();
    if (startsAt > Date.now()) countdownTimerRef.current = window.setInterval(updateCountdown, 250);
  }, [socket, clearGameTimer]);

  startGameRef.current = startGame;

  const submitAnswer = (answer: string): boolean => {
    if (!activeQuestion || !socket) return false;

    if (solvedQuestionIds.includes(activeQuestion.id)) {
      toast.info('This question is already solved. Choose another question.');
      return false;
    }
    
    const isCorrect = answer.toLowerCase().trim() === activeQuestion.answer.toLowerCase().trim();
    
    if (isCorrect) {
    socket.emit('correctAnswer', {
        roomCode, 
        questionIndex: currentQuestionIndex,
        questionId: activeQuestion.id,
        points: activeQuestion.points
      });
      
      const nextSolvedIds = [...new Set([...solvedQuestionIds, activeQuestion.id])];
      setSolvedQuestionIds(nextSolvedIds);
      if (activeQuestion.id === FINAL_QUESTION_ID) {
        toast.success("You've completed all questions!");
        socket.emit('completeGame', { roomCode });
        setIsGameActive(false);
      } else {
        const unsolvedRegularIndexes = questions
          .map((question, index) => ({ question, index }))
          .filter(({ question }) => question.id !== FINAL_QUESTION_ID && !nextSolvedIds.includes(question.id))
          .map(({ index }) => index);
        const nextIndex = unsolvedRegularIndexes.find(index => index > currentQuestionIndex)
          ?? unsolvedRegularIndexes[0]
          ?? questions.findIndex(question => question.id === FINAL_QUESTION_ID);
        if (nextIndex >= 0) {
          setCurrentQuestionIndex(nextIndex);
          setActiveQuestion(questions[nextIndex]);
          socket.emit('selectQuestion', { roomCode, questionIndex: nextIndex });
        }
        toast.success("Correct! Moving to the next unsolved question");
      }
    } else {
      toast.error("Incorrect answer. Try again!");
    }
    
    return isCorrect;
  };

  const selectQuestion = (index: number) => {
    const question = questions[index];
    const solvedRegularCount = solvedQuestionIds.filter(id => id !== FINAL_QUESTION_ID).length;
    if (!question || (question.id === FINAL_QUESTION_ID && solvedRegularCount < REGULAR_QUESTION_COUNT)) {
      toast.info('Solve all nine regular questions to unlock the final treasure');
      return;
    }
    setCurrentQuestionIndex(index);
    setActiveQuestion(question);
    socket?.emit('selectQuestion', { roomCode, questionIndex: index });
  };

  const endGame = () => {
    clearGameTimer();
    
    if (socket) {
      socket.emit('completeGame', { roomCode });
    }
    
    setIsGameActive(false);
    toast.success("Game completed! Check the leaderboard");
  };

  const resetGame = () => {
    clearGameTimer();
    
    if (socket) {
      socket.emit('resetGame', { roomCode });
    }
    
    setIsGameActive(false);
    setActiveQuestion(null);
    setCurrentQuestionIndex(0);
    setSolvedQuestionIds([]);
    setGameElapsedTime(0);
    setGameStartCountdown(10);
  };

  const readyUp = (playerId: string) => {
    if (!socket) return;
    
    socket.emit('playerReady', { roomCode, playerId });
    
    setPlayers(prevPlayers => 
      prevPlayers.map(p => 
        p.id === playerId ? { ...p, isReady: true } : p
      )
    );
    
    toast.info("You're ready to play!");
    
  };

  const leaveRoom = () => {
    clearGameTimer();
    
    if (socket) {
      socket.emit('leaveRoom', { roomCode });
    }
    joinedRoomRef.current = '';
    
    setRoomCode(null);
    setHostId(null);
    localStorage.removeItem('treasureHuntRoomCode');
    localStorage.removeItem('treasureHuntRoomUserId');
    setPlayers([]);
    setQuestions([]);
    setActiveQuestion(null);
    setCurrentQuestionIndex(0);
    setSolvedQuestionIds([]);
    setIsGameActive(false);
    setGameElapsedTime(0);
    setGameStartCountdown(10);
    toast.info("You've left the room");
  };

  const endRoom = () => {
    if (!socket || !roomCode || !user || user.id !== hostId) return;
    socket.emit('endRoom', { roomCode });
  };

  return (
    <GameContext.Provider
      value={{
        isGameActive,
        activeQuestion,
        currentQuestionIndex,
        players,
        timeRemaining,
        gameStartCountdown,
        gameElapsedTime,
        roomCode,
        isHost: Boolean(user && hostId === user.id),
        questions,
        solvedQuestionIds,
        socket,
        startGame,
        joinRoom,
        createRoom,
        submitAnswer,
        endGame,
        resetGame,
        selectQuestion,
        readyUp,
        leaveRoom,
        endRoom,
        checkAllReady,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

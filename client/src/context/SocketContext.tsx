import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
}

interface Room {
  code: string;
  players: Player[];
  gameStarted: boolean;
  hostId: string | null;
  createdAt: number;
}

interface Card {
  id: string;
  text: string;
  pick?: number;
}

interface GamePlayer {
  name: string;
  hand: Card[];
  score: number;
}

interface GameState {
  currentCzar: string;
  currentCzarName?: string; // Czar name property
  currentBlackCard: Card;
  submittedWhiteCards: any[]; // This is intentionally 'any' due to varying formats based on game phase
  players: { [key: string]: GamePlayer };
  whiteDeck: number; // Just the count for client
  blackDeck: number; // Just the count for client
  phase: 'waitingForPlayers' | 'cardSubmission' | 'czarSelection' | 'roundEnd';
  roundNumber: number;
  roundWinner?: string;
  winnerName?: string; // Winner's display name
  winningCardId?: string; // ID of the winning card
  winningCardText?: string; // Text content of the winning card
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: Message[];
  sendMessage: (text: string) => void;
  currentRoom: Room | null;
  gameState: GameState | null;
  createRoom: (playerName: string) => Promise<{ success: boolean; error?: string; room?: Room }>;
  joinRoom: (roomCode: string, playerName: string) => Promise<{ success: boolean; error?: string; room?: Room }>;
  leaveRoom: () => Promise<{ success: boolean; error?: string }>;
  startGame: () => Promise<{ success: boolean; error?: string }>;
  submitCard: (cardId: string) => Promise<{ success: boolean; error?: string }>;
  selectWinner: (playerId: string) => Promise<{ success: boolean; error?: string }>;
  nextRound: () => Promise<{ success: boolean; error?: string }>;
}

interface Message {
  text: string;
  from: string;
  timestamp?: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  messages: [],
  sendMessage: () => {},
  currentRoom: null,
  gameState: null,
  createRoom: async () => ({ success: false, error: 'Socket context not initialized' }),
  joinRoom: async () => ({ success: false, error: 'Socket context not initialized' }),
  leaveRoom: async () => ({ success: false, error: 'Socket context not initialized' }),
  startGame: async () => ({ success: false, error: 'Socket context not initialized' }),
  submitCard: async () => ({ success: false, error: 'Socket context not initialized' }),
  selectWinner: async () => ({ success: false, error: 'Socket context not initialized' }),
  nextRound: async () => ({ success: false, error: 'Socket context not initialized' }),
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socketInstance = io('http://localhost:3001');

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('message', (message: Message) => {
      console.log('Received message:', message);
      // If the message has a playerId instead of a name, try to get the name from the current room
      let displayName = message.from;
      if (currentRoom) {
        const player = currentRoom.players.find(p => p.id === message.from);
        if (player) {
          displayName = player.name;
        }
      }
      setMessages(prev => [...prev, { ...message, from: displayName, timestamp: Date.now() }]);
    });

    socketInstance.on('roomUpdate', (room: Room) => {
      console.log('Room updated:', room);
      setCurrentRoom(room);
    });

    socketInstance.on('gameStarted', (data) => {
      console.log('Game started event received:', data);
      // 更新currentRoom.gameStarted属性
      setCurrentRoom(prevRoom => {
        if (prevRoom) {
          console.log('Updating room gameStarted status to true');
          return { ...prevRoom, gameStarted: true };
        }
        return prevRoom;
      });
    });

    socketInstance.on('gameStateUpdate', (state: GameState) => {
      console.log('Game state updated:', state);
      // Safely update game state with proper validation
      if (state && typeof state === 'object') {
        setGameState(prevState => {
          // If we already have a state and are just updating phase, preserve other data
          if (prevState && state.phase !== prevState.phase) {
            console.log(`Phase transition: ${prevState.phase} -> ${state.phase}`);
          }
          return state;
        });
      }
    });

    socketInstance.on('phaseChange', (data: { 
      phase: string, 
      currentCzar?: string, 
      czarName?: string,
      winner?: string,
      winnerName?: string,
      winningCard?: string,
      winningCardText?: string
    }) => {
      console.log('Game phase changed:', data);
      
      // Update game state with phase information
      setGameState(prevState => {
        if (prevState) {
          const updates: any = {};
          
          // Add czar information if available
          if (data.currentCzar && data.czarName) {
            updates.currentCzarName = data.czarName;
          }
          
          // Add winner information if available
          if (data.phase === 'roundEnd' && data.winner) {
            updates.roundWinner = data.winner;
            updates.winnerName = data.winnerName;
            updates.winningCardId = data.winningCard;
            updates.winningCardText = data.winningCardText;
          }
          
          return {
            ...prevState,
            ...updates,
            phase: data.phase
          };
        }
        return prevState;
      });
    });

    // Save the socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Function to send a message
  const sendMessage = (text: string) => {
    if (socket && isConnected) {
      const message = { text };
      socket.emit('message', message);
      
      // Get the current player's name from the room
      let playerName = 'me';
      if (currentRoom) {
        const player = currentRoom.players.find(p => p.id === socket.id);
        if (player) {
          playerName = player.name;
        }
      }
      
      setMessages(prev => [...prev, { ...message, from: playerName, timestamp: Date.now() }]);
    }
  };

  // Function to create a room
  const createRoom = (playerName: string): Promise<{ success: boolean; error?: string; room?: Room }> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socket.emit('createRoom', { playerName }, (response: { success: boolean; error?: string; room?: Room }) => {
        if (response.success && response.room) {
          setCurrentRoom(response.room);
        }
        resolve(response);
      });
    });
  };

  // Function to join a room
  const joinRoom = (roomCode: string, playerName: string): Promise<{ success: boolean; error?: string; room?: Room }> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socket.emit('joinRoom', { roomCode, playerName }, (response: { success: boolean; error?: string; room?: Room }) => {
        if (response.success && response.room) {
          setCurrentRoom(response.room);
        }
        resolve(response);
      });
    });
  };

  // Function to leave a room
  const leaveRoom = (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      if (!currentRoom) {
        resolve({ success: false, error: 'Not in a room' });
        return;
      }

      socket.emit('leaveRoom', {}, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setCurrentRoom(null);
          setGameState(null);
        }
        resolve(response);
      });
    });
  };

  // Function to start the game
  const startGame = (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        console.error('Cannot start game: Socket not connected');
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      if (!currentRoom) {
        console.error('Cannot start game: Not in a room');
        resolve({ success: false, error: 'Not in a room' });
        return;
      }

      // Add timeout to prevent hanging if server doesn't respond
      const timeout = setTimeout(() => {
        console.error('Start game request timed out');
        resolve({ success: false, error: 'Request timed out. Please try again.' });
      }, 5000); // 5 seconds timeout

      console.log('Emitting startGame event');
      socket.emit('startGame', {}, (response: { success: boolean; error?: string }) => {
        clearTimeout(timeout);
        console.log('Received startGame response:', response);
        resolve(response);
      });
    });
  };

  // Function to submit a card
  const submitCard = (cardId: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      if (!gameState) {
        resolve({ success: false, error: 'Game not started' });
        return;
      }

      socket.emit('submitCard', { cardId }, (response: { success: boolean; error?: string }) => {
        resolve(response);
      });
    });
  };

  // Function to select a winner (for Card Czar)
  const selectWinner = (playerId: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      if (!gameState) {
        resolve({ success: false, error: 'Game not started' });
        return;
      }

      socket.emit('selectWinner', { playerId }, (response: { success: boolean; error?: string }) => {
        resolve(response);
      });
    });
  };

  // Function to start the next round
  const nextRound = (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      if (!gameState) {
        resolve({ success: false, error: 'Game not started' });
        return;
      }

      socket.emit('nextRound', {}, (response: { success: boolean; error?: string }) => {
        resolve(response);
      });
    });
  };

  const value = {
    socket,
    isConnected,
    messages,
    sendMessage,
    currentRoom,
    gameState,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submitCard,
    selectWinner,
    nextRound
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 
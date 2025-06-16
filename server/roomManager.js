/**
 * Room Manager Module
 * Handles room creation, joining, and management
 */

// Store active rooms in memory
const rooms = new Map();

/**
 * Generate a random 4-digit room code
 * @returns {string} 4-digit room code
 */
const generateRoomCode = () => {
  // Generate a random number between 1000 and 9999
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  
  // If code already exists, generate a new one
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  
  return code;
};

/**
 * Create a new room
 * @returns {Object} The created room object
 */
const createRoom = () => {
  const roomCode = generateRoomCode();
  
  const room = {
    code: roomCode,
    players: [],
    gameStarted: false,
    createdAt: Date.now(),
    hostId: null, // Will be set when the first player joins
  };
  
  rooms.set(roomCode, room);
  return room;
};

/**
 * Get a room by code
 * @param {string} roomCode - The room code to look up
 * @returns {Object|null} The room object or null if not found
 */
const getRoom = (roomCode) => {
  return rooms.get(roomCode) || null;
};

/**
 * Add a player to a room
 * @param {string} roomCode - The room code
 * @param {string} socketId - The player's socket ID
 * @param {string} playerName - The player's name
 * @returns {Object|null} The updated room object or null if room not found
 */
const addPlayerToRoom = (roomCode, socketId, playerName) => {
  const room = rooms.get(roomCode);
  
  if (!room) {
    return null;
  }
  
  // Check if player with same name already exists in the room
  const existingPlayerWithName = room.players.find(player => player.name === playerName);
  if (existingPlayerWithName) {
    return { error: 'Player with this name already exists in the room' };
  }
  
  // Check if player is already in the room (reconnecting)
  const existingPlayer = room.players.find(player => player.id === socketId);
  if (existingPlayer) {
    existingPlayer.name = playerName; // Update name if reconnecting
    return room;
  }
  
  // Add new player
  const newPlayer = {
    id: socketId,
    name: playerName,
    score: 0,
    isReady: false,
  };
  
  room.players.push(newPlayer);
  
  // Set the first player as host
  if (!room.hostId && room.players.length === 1) {
    room.hostId = socketId;
  }
  
  return room;
};

/**
 * Remove a player from a room
 * @param {string} socketId - The player's socket ID
 * @returns {Object|null} The updated room object or null if player not found in any room
 */
const removePlayerFromRoom = (socketId) => {
  let updatedRoom = null;
  
  // Find the room containing the player
  for (const [roomCode, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex(player => player.id === socketId);
    
    if (playerIndex !== -1) {
      // Remove the player
      room.players.splice(playerIndex, 1);
      updatedRoom = room;
      
      // If the room is empty, remove it
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        return null;
      }
      
      // If the host left, assign a new host
      if (room.hostId === socketId && room.players.length > 0) {
        room.hostId = room.players[0].id;
      }
      
      break;
    }
  }
  
  return updatedRoom;
};

/**
 * Get all active rooms
 * @returns {Array} Array of room objects
 */
const getAllRooms = () => {
  return Array.from(rooms.values());
};

/**
 * Find which room a player is in
 * @param {string} socketId - The player's socket ID
 * @returns {Object|null} The room object or null if player not found in any room
 */
const findPlayerRoom = (socketId) => {
  for (const room of rooms.values()) {
    const playerInRoom = room.players.find(player => player.id === socketId);
    if (playerInRoom) {
      return room;
    }
  }
  return null;
};

module.exports = {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  getAllRooms,
  findPlayerRoom
}; 
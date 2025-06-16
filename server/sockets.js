/**
 * Socket.IO event handlers for the Cards Against Humanity game
 */

const roomManager = require('./roomManager');
const gameLogic = require('./gameLogic');

/**
 * Initialize Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 */
const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Send a welcome message to the connected client
    socket.emit('message', { text: 'Welcome to the Card Game!', from: 'Server' });
    
    // Handle client messages
    socket.on('message', (data) => {
      console.log(`Message from ${socket.id}: ${data.text}`);
      
      // Get the room the player is in
      const room = roomManager.findPlayerRoom(socket.id);
      
      if (room) {
        // Find the player's name
        const player = room.players.find(p => p.id === socket.id);
        const playerName = player ? player.name : socket.id;
        
        // Broadcast the message to all clients in the room except the sender
        socket.to(room.code).emit('message', { ...data, from: playerName });
      } else {
        // If not in a room, broadcast to all clients except the sender
        socket.broadcast.emit('message', { ...data, from: socket.id });
      }
    });
    
    // Handle room creation
    socket.on('createRoom', (data, callback) => {
      try {
        const { playerName } = data;
        
        if (!playerName || playerName.trim() === '') {
          return callback({ success: false, error: 'Player name is required' });
        }
        
        const room = roomManager.createRoom();
        
        // Add the player to the room
        const updatedRoom = roomManager.addPlayerToRoom(room.code, socket.id, playerName);
        
        // Join the socket to the room
        socket.join(room.code);
        
        // Send room creation message to the player
        socket.emit('message', { 
          text: `You created room ${room.code}!`, 
          from: 'Server' 
        });
        
        // Send welcome message to the room creator
        socket.emit('message', { 
          text: `Welcome ${playerName} to the Card Game!`, 
          from: 'Server' 
        });
        
        // Notify the client
        callback({ success: true, room: updatedRoom });
        
        // Broadcast to all clients in the room that a new player has joined
        io.to(room.code).emit('roomUpdate', updatedRoom);
        
        console.log(`Room created: ${room.code} by ${playerName}`);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });
    
    // Handle joining a room
    socket.on('joinRoom', (data, callback) => {
      try {
        const { roomCode, playerName } = data;
        
        if (!roomCode || !playerName || roomCode.trim() === '' || playerName.trim() === '') {
          return callback({ success: false, error: 'Room code and player name are required' });
        }
        
        const room = roomManager.getRoom(roomCode);
        
        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }
        
        if (room.gameStarted) {
          return callback({ success: false, error: 'Game has already started' });
        }
        
        // Add the player to the room
        const updatedRoom = roomManager.addPlayerToRoom(roomCode, socket.id, playerName);
        
        if (updatedRoom && updatedRoom.error) {
          return callback({ success: false, error: updatedRoom.error });
        }
        
        // Join the socket to the room
        socket.join(roomCode);
        
        // Find the host name
        const hostPlayer = updatedRoom.players.find(p => p.id === updatedRoom.hostId);
        const hostName = hostPlayer ? hostPlayer.name : 'Unknown';
        
        // Send welcome message to the joining player
        socket.emit('message', { 
          text: `Welcome ${playerName} to the Card Game!`, 
          from: 'Server' 
        });
        
        // Broadcast to everyone in the room that a new player has joined
        socket.to(roomCode).emit('message', { 
          text: `${playerName} joined the room!`, 
          from: 'Server' 
        });
        
        // Notify the client
        callback({ success: true, room: updatedRoom });
        
        // Broadcast to all clients in the room that a new player has joined
        io.to(roomCode).emit('roomUpdate', updatedRoom);
        
        console.log(`Player ${playerName} joined room: ${roomCode}`);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });
    
    // Handle player leaving a room
    socket.on('leaveRoom', (data, callback) => {
      try {
        const room = roomManager.findPlayerRoom(socket.id);
        
        if (room) {
          // Find the player's name before removing them
          const player = room.players.find(p => p.id === socket.id);
          const playerName = player ? player.name : 'A player';
          
          // Remove the player from the room
          const updatedRoom = roomManager.removePlayerFromRoom(socket.id);
          
          // Leave the socket room
          socket.leave(room.code);
          
          // Notify the client
          if (callback) {
            callback({ success: true });
          }
          
          // If the room still exists, broadcast the update
          if (updatedRoom) {
            // Broadcast to everyone in the room that a player has left
            io.to(room.code).emit('message', { 
              text: `${playerName} left the room.`, 
              from: 'Server' 
            });
            
            io.to(room.code).emit('roomUpdate', updatedRoom);
          }
          
          console.log(`Player left room: ${room.code}`);
        } else if (callback) {
          callback({ success: false, error: 'Not in a room' });
        }
      } catch (error) {
        console.error('Error leaving room:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to leave room' });
        }
      }
    });
    
    // Handle game start
    socket.on('startGame', (data, callback) => {
      console.log(`Received startGame event from ${socket.id}`);
      try {
        const room = roomManager.findPlayerRoom(socket.id);
        
        if (!room) {
          console.log(`Player ${socket.id} is not in a room`);
          return callback({ success: false, error: 'Not in a room' });
        }
        
        // Check if the player is the host
        if (room.hostId !== socket.id) {
          console.log(`Player ${socket.id} is not the host of room ${room.code}`);
          return callback({ success: false, error: 'Only the host can start the game' });
        }
        
        // Check if there are enough players (at least 2)
        if (room.players.length < 2) {
          console.log(`Not enough players in room ${room.code}: ${room.players.length}`);
          return callback({ success: false, error: 'Need at least 2 players to start the game' });
        }
        
        console.log(`Initializing game state for room ${room.code}`);
        // Initialize game state
        const gameState = gameLogic.initializeGameState(room.players);
        
        // Update room with game state and mark as started
        room.gameState = gameState;
        room.gameStarted = true;
        
        // Find the host name
        const hostPlayer = room.players.find(p => p.id === room.hostId);
        const hostName = hostPlayer ? hostPlayer.name : 'The host';
        
        // Send game start message to the room
        io.to(room.code).emit('message', { 
          text: `${hostName} started the game!`, 
          from: 'Server' 
        });
        
        // Find the first Card Czar's name
        const czarPlayer = room.players.find(p => p.id === gameState.currentCzar);
        const czarName = czarPlayer ? czarPlayer.name : 'Unknown';
        
        // Send Card Czar announcement
        io.to(room.code).emit('message', { 
          text: `${czarName} is the Card Czar for round 1!`, 
          from: 'Server' 
        });
        
        // Notify the client
        console.log(`Game successfully started in room ${room.code}`);
        callback({ success: true });
        
        // Broadcast game start to all players in the room with updated room info
        io.to(room.code).emit('gameStarted', { roomCode: room.code, gameStarted: true });
        
        // Send each player their individual game state
        room.players.forEach(player => {
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            const playerGameState = gameLogic.prepareGameStateForClient(gameState, player.id);
            playerSocket.emit('gameStateUpdate', playerGameState);
            console.log(`Sent game state to player ${player.id}`);
          } else {
            console.log(`Could not find socket for player ${player.id}`);
          }
        });
        
        console.log(`Game started in room: ${room.code}`);
      } catch (error) {
        console.error('Error starting game:', error);
        callback({ success: false, error: 'Failed to start game: ' + error.message });
      }
    });
    
    // Handle card submission
    socket.on('submitCard', (data, callback) => {
      try {
        const { cardId } = data;
        const room = roomManager.findPlayerRoom(socket.id);
        
        if (!room || !room.gameState) {
          return callback({ success: false, error: 'Not in an active game' });
        }
        
        const gameState = room.gameState;
        
        // Check if the game is in the submission phase
        if (gameState.phase !== 'cardSubmission') {
          return callback({ success: false, error: 'Not in card submission phase' });
        }
        
        // Check if the player is the Card Czar (Czar doesn't submit cards)
        if (gameState.currentCzar === socket.id) {
          return callback({ success: false, error: 'Card Czar cannot submit cards' });
        }
        
        // Check if the player has already submitted a card
        const existingSubmission = gameState.submittedWhiteCards.find(
          submission => submission.playerId === socket.id
        );
        
        // Check if the card is in the player's hand
        const playerHand = gameState.players[socket.id]?.hand || [];
        const cardInHand = playerHand.some(card => card.id === cardId);
        
        if (!cardInHand) {
          return callback({ success: false, error: 'Card not in hand' });
        }
        
        // Find the player's name
        const player = room.players.find(p => p.id === socket.id);
        const playerName = player ? player.name : 'A player';
        
        // Update game state with the submitted card
        room.gameState = gameLogic.submitWhiteCard(gameState, socket.id, cardId);
        
        // Notify the client
        callback({ success: true });
        
        // Send card submission message to the room
        io.to(room.code).emit('message', { 
          text: `${playerName} submitted a card.`, 
          from: 'Server' 
        });
        
        // Send updated game state to all players
        room.players.forEach(player => {
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            const playerGameState = gameLogic.prepareGameStateForClient(room.gameState, player.id);
            playerSocket.emit('gameStateUpdate', playerGameState);
          }
        });
        
        // If all players have submitted, transition to czar selection phase
        if (room.gameState.phase === 'czarSelection') {
          // Find the Card Czar's name
          const czarPlayer = room.players.find(p => p.id === gameState.currentCzar);
          const czarName = czarPlayer ? czarPlayer.name : 'The Card Czar';
          
          // Send phase change message
          io.to(room.code).emit('message', { 
            text: `All cards submitted! ${czarName} is now choosing the winner.`, 
            from: 'Server' 
          });
          
          io.to(room.code).emit('phaseChange', { phase: 'czarSelection' });
        }
        
        console.log(`Player ${socket.id} submitted card ${cardId} in room ${room.code}`);
      } catch (error) {
        console.error('Error submitting card:', error);
        callback({ success: false, error: 'Failed to submit card' });
      }
    });
    
    // Handle Czar selection
    socket.on('selectWinner', (data, callback) => {
      try {
        const { playerId } = data;
        const room = roomManager.findPlayerRoom(socket.id);
        
        if (!room || !room.gameState) {
          return callback({ success: false, error: 'Not in an active game' });
        }
        
        const gameState = room.gameState;
        
        // Check if the game is in the czar selection phase
        if (gameState.phase !== 'czarSelection') {
          return callback({ success: false, error: 'Not in czar selection phase' });
        }
        
        // Check if the player is the Card Czar
        if (gameState.currentCzar !== socket.id) {
          return callback({ success: false, error: 'Only the Card Czar can select the winner' });
        }
        
        // Check if the selected player is valid
        const validSubmission = gameState.submittedWhiteCards.find(
          submission => submission.playerId === playerId
        );
        
        if (!validSubmission) {
          return callback({ success: false, error: 'Invalid player selection' });
        }
        
        // Update game state with the winner
        room.gameState = gameLogic.selectWinningCard(gameState, playerId);
        
        // Get winner information
        const winnerName = room.players.find(p => p.id === playerId)?.name || 'Unknown';
        const winningCard = validSubmission.cardId;
        
        // Find the winning card text
        let winningCardText = 'Winning Card';
        const playerHand = gameState.players[playerId]?.hand;
        if (playerHand) {
          const card = playerHand.find(c => c.id === winningCard);
          if (card && card.text) {
            winningCardText = card.text;
          }
        }
        
        // Notify the client
        callback({ success: true });
        
        // Send winner announcement message to the room
        io.to(room.code).emit('message', { 
          text: `${winnerName} wins this round!`, 
          from: 'Server' 
        });
        
        // Send updated game state to all players
        room.players.forEach(player => {
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            const playerGameState = gameLogic.prepareGameStateForClient(room.gameState, player.id);
            playerSocket.emit('gameStateUpdate', playerGameState);
          }
        });
        
        // Broadcast round end with winner information
        io.to(room.code).emit('phaseChange', { 
          phase: 'roundEnd',
          winner: playerId,
          winnerName: winnerName,
          winningCard: winningCard,
          winningCardText: winningCardText,
          blackCard: gameState.currentBlackCard
        });
        
        console.log(`Card Czar selected winner ${playerId} in room ${room.code}`);
      } catch (error) {
        console.error('Error selecting winner:', error);
        callback({ success: false, error: 'Failed to select winner' });
      }
    });
    
    // Handle next round
    socket.on('nextRound', (data, callback) => {
      try {
        const room = roomManager.findPlayerRoom(socket.id);
        
        if (!room || !room.gameState) {
          return callback({ success: false, error: 'Not in an active game' });
        }
        
        const gameState = room.gameState;
        
        // Check if the game is in the round end phase
        if (gameState.phase !== 'roundEnd') {
          return callback({ success: false, error: 'Not in round end phase' });
        }
        
        // Check if the player is the host
        if (room.hostId !== socket.id) {
          return callback({ success: false, error: 'Only the host can advance to the next round' });
        }
        
        // Update game state for the next round
        room.gameState = gameLogic.nextRound(gameState);
        
        // Find the host name
        const hostPlayer = room.players.find(p => p.id === room.hostId);
        const hostName = hostPlayer ? hostPlayer.name : 'The host';
        
        // Send next round message to the room
        io.to(room.code).emit('message', { 
          text: `${hostName} started round ${room.gameState.roundNumber}!`, 
          from: 'Server' 
        });
        
        // Find the new Card Czar's name
        const czarPlayer = room.players.find(p => p.id === room.gameState.currentCzar);
        const czarName = czarPlayer ? czarPlayer.name : 'Unknown';
        
        // Send Card Czar announcement
        io.to(room.code).emit('message', { 
          text: `${czarName} is the Card Czar for this round!`, 
          from: 'Server' 
        });
        
        // Notify the client
        callback({ success: true });
        
        // Send updated game state to all players
        room.players.forEach(player => {
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            const playerGameState = gameLogic.prepareGameStateForClient(room.gameState, player.id);
            playerSocket.emit('gameStateUpdate', playerGameState);
          }
        });
        
        // Broadcast phase change
        io.to(room.code).emit('phaseChange', { 
          phase: 'cardSubmission',
          roundNumber: room.gameState.roundNumber,
          currentCzar: room.gameState.currentCzar,
          czarName: room.players.find(p => p.id === room.gameState.currentCzar)?.name || 'Unknown'
        });
        
        console.log(`Starting round ${room.gameState.roundNumber} in room ${room.code}`);
      } catch (error) {
        console.error('Error starting next round:', error);
        callback({ success: false, error: 'Failed to start next round' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Handle player leaving rooms on disconnect
      const room = roomManager.findPlayerRoom(socket.id);
      if (room) {
        // Find the player's name before removing them
        const player = room.players.find(p => p.id === socket.id);
        const playerName = player ? player.name : 'A player';
        
        const updatedRoom = roomManager.removePlayerFromRoom(socket.id);
        
        // If the room still exists, broadcast the update
        if (updatedRoom) {
          // Send disconnect message to the room
          io.to(room.code).emit('message', { 
            text: `${playerName} disconnected from the game.`, 
            from: 'Server' 
          });
          
          io.to(room.code).emit('roomUpdate', updatedRoom);
          
          // If game was in progress, handle player leaving
          if (room.gameState) {
            // If the Card Czar left, move to the next round
            if (room.gameState.currentCzar === socket.id) {
              // Send Card Czar left message
              io.to(room.code).emit('message', { 
                text: `The Card Czar left! Moving to the next round.`, 
                from: 'Server' 
              });
              
              room.gameState = gameLogic.nextRound(room.gameState);
              
              // Find the new Card Czar's name
              const czarPlayer = updatedRoom.players.find(p => p.id === room.gameState.currentCzar);
              const czarName = czarPlayer ? czarPlayer.name : 'Unknown';
              
              // Send Card Czar announcement
              io.to(room.code).emit('message', { 
                text: `${czarName} is the new Card Czar!`, 
                from: 'Server' 
              });
              
              // Send updated game state to all remaining players
              updatedRoom.players.forEach(player => {
                const playerSocket = io.sockets.sockets.get(player.id);
                if (playerSocket) {
                  const playerGameState = gameLogic.prepareGameStateForClient(room.gameState, player.id);
                  playerSocket.emit('gameStateUpdate', playerGameState);
                }
              });
              
              // Broadcast phase change
              io.to(room.code).emit('phaseChange', { 
                phase: 'cardSubmission',
                roundNumber: room.gameState.roundNumber,
                currentCzar: room.gameState.currentCzar,
                czarName: updatedRoom.players.find(p => p.id === room.gameState.currentCzar)?.name || 'Unknown'
              });
            }
          }
        }
        
        console.log(`Player removed from room ${room.code} due to disconnect`);
      }
    });
  });
};

module.exports = {
  initializeSocketHandlers
}; 
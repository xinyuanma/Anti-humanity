/**
 * Game Logic for Cards Against Humanity
 * Contains functions for managing game state and card operations
 */

const { blackCards, whiteCards } = require('./cards');

/**
 * Shuffles a deck of cards using the Fisher-Yates (Knuth) shuffle algorithm
 * @param {Array} deck - The deck of cards to shuffle
 * @returns {Array} A new shuffled copy of the deck
 */
const shuffleDeck = (deck) => {
  // Create a copy of the deck to avoid modifying the original
  const shuffledDeck = [...deck];
  
  // Fisher-Yates (Knuth) shuffle algorithm
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements at indices i and j
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }
  
  return shuffledDeck;
};

/**
 * Deals initial cards to players (10 white cards each)
 * @param {Array} players - Array of player objects
 * @param {Array} whiteDeck - Deck of white cards to deal from
 * @returns {Object} Object containing updated players with hands and the remaining deck
 */
const dealInitialCards = (players, whiteDeck) => {
  // Make copies to avoid modifying the originals
  const updatedPlayers = JSON.parse(JSON.stringify(players));
  const remainingDeck = [...whiteDeck];
  
  // Deal 10 cards to each player
  for (const player of updatedPlayers) {
    // Initialize hand if it doesn't exist
    if (!player.hand) {
      player.hand = [];
    }
    
    // Deal cards until player has 10 cards
    while (player.hand.length < 10 && remainingDeck.length > 0) {
      player.hand.push(remainingDeck.pop());
    }
  }
  
  return {
    players: updatedPlayers,
    remainingDeck
  };
};

/**
 * Deals additional cards to a player to bring their hand back to 10 cards
 * @param {Object} player - The player object
 * @param {Array} whiteDeck - Deck of white cards to deal from
 * @returns {Object} Object containing the updated player and the remaining deck
 */
const replenishHand = (player, whiteDeck) => {
  // Make copies to avoid modifying the originals
  const updatedPlayer = JSON.parse(JSON.stringify(player));
  const remainingDeck = [...whiteDeck];
  
  // Initialize hand if it doesn't exist
  if (!updatedPlayer.hand) {
    updatedPlayer.hand = [];
  }
  
  // Deal cards until player has 10 cards
  while (updatedPlayer.hand.length < 10 && remainingDeck.length > 0) {
    updatedPlayer.hand.push(remainingDeck.pop());
  }
  
  return {
    player: updatedPlayer,
    remainingDeck
  };
};

/**
 * Selects a random black card from the deck
 * @param {Array} blackDeck - Deck of black cards
 * @returns {Object} The selected black card and the remaining deck
 */
const selectBlackCard = (blackDeck) => {
  // Make a copy of the deck
  const remainingDeck = [...blackDeck];
  
  // If deck is empty, return null
  if (remainingDeck.length === 0) {
    return { blackCard: null, remainingDeck };
  }
  
  // Select a random card
  const randomIndex = Math.floor(Math.random() * remainingDeck.length);
  const blackCard = remainingDeck[randomIndex];
  
  // Remove the selected card from the deck
  remainingDeck.splice(randomIndex, 1);
  
  return {
    blackCard,
    remainingDeck
  };
};

/**
 * Initializes a game state for a room
 * @param {Array} roomPlayers - Array of player objects in the room
 * @returns {Object} Initial game state
 */
const initializeGameState = (roomPlayers) => {
  // Shuffle the decks
  const shuffledBlackDeck = shuffleDeck(blackCards);
  const shuffledWhiteDeck = shuffleDeck(whiteCards);
  
  // Select the first black card
  const { blackCard, remainingDeck: remainingBlackDeck } = selectBlackCard(shuffledBlackDeck);
  
  // Create a players object with hands and scores
  const playersMap = {};
  let remainingWhiteDeck = [...shuffledWhiteDeck];
  
  for (const player of roomPlayers) {
    // Deal 10 cards to each player
    const { player: updatedPlayer, remainingDeck: updatedDeck } = replenishHand(
      { id: player.id, hand: [] },
      remainingWhiteDeck
    );
    
    playersMap[player.id] = {
      id: player.id, // Add player ID to the player data
      hand: updatedPlayer.hand,
      score: 0,
      name: player.name
    };
    
    remainingWhiteDeck = updatedDeck;
  }
  
  // Determine the first Card Czar (first player in the array)
  const currentCzar = roomPlayers.length > 0 ? roomPlayers[0].id : null;
  const currentCzarName = roomPlayers.length > 0 ? roomPlayers[0].name : 'Unknown';
  
  return {
    currentCzar,
    currentCzarName,
    currentBlackCard: blackCard,
    submittedWhiteCards: [],
    players: playersMap,
    whiteDeck: remainingWhiteDeck,
    blackDeck: remainingBlackDeck,
    playedBlackCards: [],
    playedWhiteCards: [],
    phase: 'cardSubmission',
    roundNumber: 1
  };
};

/**
 * Advances the game to the next round
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state for the next round
 */
const nextRound = (gameState) => {
  // Make a deep copy of the game state
  const updatedGameState = JSON.parse(JSON.stringify(gameState));
  
  // Move the current black card to played cards
  if (updatedGameState.currentBlackCard) {
    updatedGameState.playedBlackCards.push(updatedGameState.currentBlackCard);
  }
  
  // Move submitted white cards to played cards
  updatedGameState.submittedWhiteCards.forEach(submission => {
    const playerId = submission.playerId;
    const cardId = submission.cardId;
    
    // Find the card in the player's hand
    const playerHand = updatedGameState.players[playerId].hand;
    const cardIndex = playerHand.findIndex(card => card.id === cardId);
    
    if (cardIndex !== -1) {
      const card = playerHand[cardIndex];
      updatedGameState.playedWhiteCards.push(card);
    }
  });
  
  // Clear submitted cards
  updatedGameState.submittedWhiteCards = [];
  
  // Select a new black card
  const { blackCard, remainingDeck } = selectBlackCard(updatedGameState.blackDeck);
  updatedGameState.currentBlackCard = blackCard;
  updatedGameState.blackDeck = remainingDeck;
  
  // Rotate the Card Czar
  const playerIds = Object.keys(updatedGameState.players);
  if (playerIds.length > 0) {
    const currentCzarIndex = playerIds.indexOf(updatedGameState.currentCzar);
    const nextCzarIndex = (currentCzarIndex + 1) % playerIds.length;
    const nextCzarId = playerIds[nextCzarIndex];
    updatedGameState.currentCzar = nextCzarId;
    
    // Set the czar name
    const nextCzarData = updatedGameState.players[nextCzarId];
    if (nextCzarData && nextCzarData.name) {
      updatedGameState.currentCzarName = nextCzarData.name;
    } else {
      updatedGameState.currentCzarName = 'Unknown';
    }
  }
  
  // Replenish players' hands
  for (const playerId of playerIds) {
    // Skip the current czar as they don't need to submit cards
    if (playerId !== updatedGameState.currentCzar) {
      const player = updatedGameState.players[playerId];
      
      // Remove submitted cards from player's hand
      const submittedCardIds = updatedGameState.submittedWhiteCards
        .filter(submission => submission.playerId === playerId)
        .map(submission => submission.cardId);
      
      player.hand = player.hand.filter(card => !submittedCardIds.includes(card.id));
      
      // Replenish hand
      const { player: updatedPlayer, remainingDeck: updatedDeck } = replenishHand(
        { hand: player.hand },
        updatedGameState.whiteDeck
      );
      
      player.hand = updatedPlayer.hand;
      updatedGameState.whiteDeck = updatedDeck;
    }
  }
  
  // Update game phase and round number
  updatedGameState.phase = 'cardSubmission';
  updatedGameState.roundNumber += 1;
  
  return updatedGameState;
};

/**
 * Submits a white card for a player
 * @param {Object} gameState - Current game state
 * @param {string} playerId - ID of the player submitting the card
 * @param {string} cardId - ID of the card being submitted
 * @returns {Object} Updated game state with the submitted card
 */
const submitWhiteCard = (gameState, playerId, cardId) => {
  // Make a deep copy of the game state
  const updatedGameState = JSON.parse(JSON.stringify(gameState));
  
  // Check if the player has already submitted a card
  const existingSubmission = updatedGameState.submittedWhiteCards.find(
    submission => submission.playerId === playerId
  );
  
  if (existingSubmission) {
    // Replace the existing submission
    existingSubmission.cardId = cardId;
  } else {
    // Add a new submission
    updatedGameState.submittedWhiteCards.push({ playerId, cardId });
  }
  
  // Check if all players have submitted
  const nonCzarPlayerCount = Object.keys(updatedGameState.players).filter(
    id => id !== updatedGameState.currentCzar
  ).length;
  
  if (updatedGameState.submittedWhiteCards.length === nonCzarPlayerCount) {
    updatedGameState.phase = 'czarSelection';
  }
  
  return updatedGameState;
};

/**
 * Selects a winning card for the round
 * @param {Object} gameState - Current game state
 * @param {string} winningPlayerId - ID of the player who submitted the winning card
 * @returns {Object} Updated game state with the winner
 */
const selectWinningCard = (gameState, winningPlayerId) => {
  // Make a deep copy of the game state
  const updatedGameState = JSON.parse(JSON.stringify(gameState));
  
  // Increment the winning player's score
  if (updatedGameState.players[winningPlayerId]) {
    updatedGameState.players[winningPlayerId].score += 1;
  }
  
  // Update game phase
  updatedGameState.phase = 'roundEnd';
  updatedGameState.roundWinner = winningPlayerId;
  
  return updatedGameState;
};

/**
 * Prepares game state for client (removes sensitive information)
 * @param {Object} gameState - Full game state
 * @param {string} playerId - ID of the player requesting the state
 * @returns {Object} Sanitized game state for the client
 */
const prepareGameStateForClient = (gameState, playerId) => {
  if (!gameState) return null;
  
  // Make a deep copy of the game state
  const clientGameState = JSON.parse(JSON.stringify(gameState));
  
  // Only include the requesting player's hand
  const playerHands = {};
  for (const [pid, playerData] of Object.entries(clientGameState.players)) {
    if (pid === playerId) {
      playerHands[pid] = { 
        ...playerData,
        id: pid // Ensure ID is included
      };
    } else {
      // For other players, just include the hand size but not the actual cards
      playerHands[pid] = {
        ...playerData,
        id: pid, // Ensure ID is included
        hand: Array(playerData.hand.length).fill({ hidden: true })
      };
    }
  }
  
  clientGameState.players = playerHands;
  
  // Hide the white deck and black deck
  clientGameState.whiteDeck = clientGameState.whiteDeck.length;
  clientGameState.blackDeck = clientGameState.blackDeck.length;
  
  // During card submission, hide other players' submitted cards
  if (clientGameState.phase === 'cardSubmission') {
    // Show only if the player has submitted a card
    const playerSubmission = clientGameState.submittedWhiteCards.find(
      submission => submission.playerId === playerId
    );
    
    clientGameState.submittedWhiteCards = clientGameState.submittedWhiteCards.map(submission => {
      if (submission.playerId === playerId) {
        return submission;
      } else {
        return { playerId: submission.playerId, submitted: true };
      }
    });
  }
  
  // During czar selection, show all submitted cards but anonymize them
  if (clientGameState.phase === 'czarSelection') {
    // If player is czar, show all cards without player IDs
    if (playerId === clientGameState.currentCzar) {
      clientGameState.submittedWhiteCards = clientGameState.submittedWhiteCards.map(
        (submission, index) => {
          // Find the card text for the submission
          const playerData = gameState.players[submission.playerId];
          const cardText = playerData?.hand.find(card => card.id === submission.cardId)?.text || 'Card';
          
          return {
            submissionId: index,
            cardId: submission.cardId,
            playerId: submission.playerId, // Keep this for the server, but client shouldn't use it
            cardText: cardText // Add the card text for display
          };
        }
      );
    } else {
      // For non-czar players, show all cards and which one is theirs
      clientGameState.submittedWhiteCards = clientGameState.submittedWhiteCards.map(
        (submission, index) => {
          // Find the card text only for the player's own submission
          let cardText = null;
          if (submission.playerId === playerId) {
            const playerData = gameState.players[playerId];
            cardText = playerData?.hand.find(card => card.id === submission.cardId)?.text || null;
          }
          
          return {
            submissionId: index,
            cardId: submission.cardId,
            isOwnSubmission: submission.playerId === playerId,
            cardText: cardText // Add card text only for own submission
          };
        }
      );
    }
  }
  
  return clientGameState;
};

module.exports = {
  shuffleDeck,
  dealInitialCards,
  replenishHand,
  selectBlackCard,
  initializeGameState,
  nextRound,
  submitWhiteCard,
  selectWinningCard,
  prepareGameStateForClient
}; 
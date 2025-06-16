/**
 * Test script for game state management
 */

const { initializeGameState, nextRound, submitWhiteCard, selectWinningCard, prepareGameStateForClient } = require('./gameLogic');

// Test data
const testPlayers = [
  { id: 'p1', name: 'Player 1', score: 0 },
  { id: 'p2', name: 'Player 2', score: 0 },
  { id: 'p3', name: 'Player 3', score: 0 }
];

console.log('=== Cards Against Humanity Game State Management Test ===');

// Test initializing game state
console.log('\n1. Testing initializeGameState function:');
const gameState = initializeGameState(testPlayers);
console.log('Initial game state:', {
  currentCzar: gameState.currentCzar,
  currentBlackCard: gameState.currentBlackCard,
  phase: gameState.phase,
  roundNumber: gameState.roundNumber,
  playerCount: Object.keys(gameState.players).length,
  whiteDeckSize: gameState.whiteDeck.length,
  blackDeckSize: gameState.blackDeck.length
});

// Test player hands
console.log('\n2. Testing player hands:');
for (const [playerId, playerData] of Object.entries(gameState.players)) {
  console.log(`Player ${playerId} hand size:`, playerData.hand.length);
  console.log(`First card in hand:`, playerData.hand[0]);
}

// Test submitting white cards
console.log('\n3. Testing submitWhiteCard function:');
const player2Id = 'p2';
const player3Id = 'p3';
const player2CardId = gameState.players[player2Id].hand[0].id;
const player3CardId = gameState.players[player3Id].hand[0].id;

let updatedGameState = submitWhiteCard(gameState, player2Id, player2CardId);
console.log('After player 2 submits:', {
  submittedCount: updatedGameState.submittedWhiteCards.length,
  phase: updatedGameState.phase
});

updatedGameState = submitWhiteCard(updatedGameState, player3Id, player3CardId);
console.log('After player 3 submits:', {
  submittedCount: updatedGameState.submittedWhiteCards.length,
  phase: updatedGameState.phase
});

// Test selecting a winner
console.log('\n4. Testing selectWinningCard function:');
updatedGameState = selectWinningCard(updatedGameState, player2Id);
console.log('After selecting winner:', {
  phase: updatedGameState.phase,
  player2Score: updatedGameState.players[player2Id].score,
  player3Score: updatedGameState.players[player3Id].score
});

// Test next round
console.log('\n5. Testing nextRound function:');
updatedGameState = nextRound(updatedGameState);
console.log('After starting next round:', {
  currentCzar: updatedGameState.currentCzar,
  currentBlackCard: updatedGameState.currentBlackCard,
  phase: updatedGameState.phase,
  roundNumber: updatedGameState.roundNumber,
  submittedCount: updatedGameState.submittedWhiteCards.length,
  playedBlackCardsCount: updatedGameState.playedBlackCards.length
});

// Test preparing game state for client
console.log('\n6. Testing prepareGameStateForClient function:');
const player1GameState = prepareGameStateForClient(updatedGameState, 'p1');
console.log('Game state for player 1:', {
  canSeeOwnHand: Array.isArray(player1GameState.players['p1'].hand) && player1GameState.players['p1'].hand.length > 0 && !player1GameState.players['p1'].hand[0].hidden,
  canSeeOtherHands: Array.isArray(player1GameState.players['p2'].hand) && player1GameState.players['p2'].hand.length > 0 && !player1GameState.players['p2'].hand[0].hidden,
  whiteDeckIsNumber: typeof player1GameState.whiteDeck === 'number',
  blackDeckIsNumber: typeof player1GameState.blackDeck === 'number'
});

console.log('\n=== Test Complete ==='); 
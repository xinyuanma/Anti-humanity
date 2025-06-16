/**
 * Test script for game logic functions
 */

const { blackCards, whiteCards } = require('./cards');
const { shuffleDeck, dealInitialCards, replenishHand, selectBlackCard, initializeGame } = require('./gameLogic');

// Test data
const testPlayers = [
  { id: 'p1', name: 'Player 1', score: 0 },
  { id: 'p2', name: 'Player 2', score: 0 },
  { id: 'p3', name: 'Player 3', score: 0 }
];

console.log('=== Cards Against Humanity Game Logic Test ===');

// Test shuffleDeck
console.log('\n1. Testing shuffleDeck function:');
console.log('Original first 3 white cards:', whiteCards.slice(0, 3));
const shuffledWhiteDeck = shuffleDeck(whiteCards);
console.log('Shuffled first 3 white cards:', shuffledWhiteDeck.slice(0, 3));
console.log('Original deck length:', whiteCards.length);
console.log('Shuffled deck length:', shuffledWhiteDeck.length);

// Test dealInitialCards
console.log('\n2. Testing dealInitialCards function:');
const { players: playersWithCards, remainingDeck } = dealInitialCards(testPlayers, shuffledWhiteDeck);
console.log('Players with cards:', playersWithCards.map(p => ({ name: p.name, handSize: p.hand.length })));
console.log('Remaining deck size:', remainingDeck.length);
console.log('Player 1 first 3 cards:', playersWithCards[0].hand.slice(0, 3));

// Test replenishHand
console.log('\n3. Testing replenishHand function:');
const playerWithFewerCards = { ...playersWithCards[0], hand: playersWithCards[0].hand.slice(0, 5) };
console.log('Player with fewer cards hand size:', playerWithFewerCards.hand.length);
const { player: replenishedPlayer, remainingDeck: deckAfterReplenish } = replenishHand(playerWithFewerCards, remainingDeck);
console.log('Replenished player hand size:', replenishedPlayer.hand.length);
console.log('Remaining deck size after replenish:', deckAfterReplenish.length);

// Test selectBlackCard
console.log('\n4. Testing selectBlackCard function:');
const { blackCard, remainingDeck: remainingBlackDeck } = selectBlackCard(blackCards);
console.log('Selected black card:', blackCard);
console.log('Remaining black deck size:', remainingBlackDeck.length);

// Test initializeGame
console.log('\n5. Testing initializeGame function:');
const gameState = initializeGame(testPlayers);
console.log('Game state:', {
  playerCount: gameState.players.length,
  playerHandSizes: gameState.players.map(p => p.hand.length),
  currentBlackCard: gameState.currentBlackCard,
  cardCzarIndex: gameState.cardCzarIndex,
  gamePhase: gameState.gamePhase,
  roundNumber: gameState.roundNumber,
  whiteDeckSize: gameState.whiteDeck.length,
  blackDeckSize: gameState.blackDeck.length
});

console.log('\n=== Test Complete ==='); 
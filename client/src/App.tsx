import React, { useState, useEffect } from 'react';
import './App.css';
import { useSocket } from './context/SocketContext';
import RoomLobby from './components/RoomLobby';
import GameTable from './components/GameTable';

const App: React.FC = () => {
  const { isConnected, messages, sendMessage, currentRoom, gameState } = useSocket();
  const [messageText, setMessageText] = useState('');
  
  // 添加调试日志
  useEffect(() => {
    console.log('App: currentRoom updated:', currentRoom);
    if (currentRoom?.gameStarted) {
      console.log('App: Game should be starting! gameStarted =', currentRoom.gameStarted);
    }
  }, [currentRoom]);

  useEffect(() => {
    console.log('App: gameState updated:', gameState);
    if (gameState && currentRoom?.gameStarted) {
      console.log('App: Both gameState and gameStarted are true, game should be showing!');
    }
  }, [gameState, currentRoom?.gameStarted]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText('');
    }
  };

  // 确定是否显示游戏界面
  const shouldShowGame = Boolean(currentRoom?.gameStarted && gameState);
  
  console.log('App: shouldShowGame =', shouldShowGame, 
    '(gameStarted =', Boolean(currentRoom?.gameStarted), 
    ', gameState =', Boolean(gameState), ')');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cards Against Humanity</h1>
        <div className="connection-status">
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>
      
      <main>
        {shouldShowGame ? (
          <GameTable />
        ) : (
          <RoomLobby />
        )}
        
        {currentRoom && (
          <div className="chat-container">
            <h3>Room Chat</h3>
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.from === 'me' ? 'sent' : 'received'}`}>
                  <span className="message-from">{msg.from}: </span>
                  <span className="message-text">{msg.text}</span>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                disabled={!isConnected}
              />
              <button type="submit" disabled={!isConnected}>Send</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

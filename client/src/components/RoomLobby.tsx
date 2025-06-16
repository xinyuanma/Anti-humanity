import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './RoomLobby.css';

interface RoomLobbyProps {
  // Optional props if needed
}

const RoomLobby: React.FC<RoomLobbyProps> = () => {
  const { createRoom, joinRoom, currentRoom, startGame } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Reset error when inputs change
  useEffect(() => {
    setError(null);
  }, [playerName, roomCode]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('请输入你的名字');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createRoom(playerName);
    } catch (err) {
      setError('创建房间失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('请输入你的名字');
      return;
    }

    if (!roomCode.trim()) {
      setError('请输入房间代码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinRoom(roomCode, playerName);
    } catch (err) {
      setError('加入房间失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    setLoading(true);
    setError(null);
    console.log('Starting game...');

    try {
      const response = await startGame();
      console.log('Start game response:', response);
      
      if (!response.success) {
        setError(response.error || '启动游戏失败');
        console.error('Failed to start game:', response.error);
      }
    } catch (err) {
      console.error('Error starting game:', err);
      setError('启动游戏时发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleRules = () => {
    setShowRules(!showRules);
  };

  const renderGameRules = () => {
    return (
      <div className="game-rules">
        <h3>游戏规则</h3>
        <p>
          <strong>卡片对决</strong>是一个派对游戏，玩家使用白卡（答案）来回应黑卡（问题或填空）。
        </p>
        
        <h4>游戏流程：</h4>
        <ol>
          <li>每轮指定一名玩家为"卡牌之王"</li>
          <li>卡牌之王翻开一张黑卡</li>
          <li>其他玩家从手中选择一张白卡作为回应</li>
          <li>卡牌之王选择最有趣或最合适的白卡作为获胜者</li>
          <li>获胜者获得一分</li>
          <li>卡牌之王角色轮换到下一位玩家</li>
        </ol>
        
        <h4>角色：</h4>
        <ul>
          <li><strong>卡牌之王</strong>：选择获胜卡片，不参与提交白卡</li>
          <li><strong>普通玩家</strong>：提交白卡来回应黑卡</li>
          <li><strong>房主</strong>：可以开始游戏和下一轮</li>
        </ul>
        
        <button className="close-rules-btn" onClick={toggleRules}>关闭规则</button>
      </div>
    );
  };

  if (showRules) {
    return renderGameRules();
  }

  if (!currentRoom) {
    return (
      <div className="room-lobby">
        <h1>卡片对决</h1>
        <div className="game-description">
          一个有趣的派对游戏，使用白卡回应黑卡，由卡牌之王选择最佳答案！
        </div>
        
        <div className="lobby-form">
          <div className="form-group">
            <label htmlFor="playerName">你的名字</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入你的名字"
              disabled={loading}
            />
          </div>
          
          <div className="form-actions">
            <button 
              className="create-room-btn" 
              onClick={handleCreateRoom}
              disabled={loading}
            >
              {loading ? '创建中...' : '创建新房间'}
            </button>
            
            <div className="or-divider">或</div>
            
            <div className="form-group">
              <label htmlFor="roomCode">房间代码</label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="输入4位房间代码"
                disabled={loading}
              />
            </div>
            
            <button 
              className="join-room-btn" 
              onClick={handleJoinRoom}
              disabled={loading}
            >
              {loading ? '加入中...' : '加入房间'}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button className="rules-btn" onClick={toggleRules}>
            查看游戏规则
          </button>
        </div>
      </div>
    );
  }

  // If in a room
  return (
    <div className="room-lobby">
      <h1>房间：{currentRoom.code}</h1>
      
      <div className="room-info">
        <p>房主：{currentRoom.players.find(p => p.id === currentRoom.hostId)?.name}</p>
        <p>玩家数量：{currentRoom.players.length}</p>
      </div>
      
      <div className="players-list">
        <h2>玩家列表</h2>
        <ul>
          {currentRoom.players.map((player) => (
            <li key={player.id} className={player.id === currentRoom.hostId ? 'host' : ''}>
              {player.name} {player.id === currentRoom.hostId && '(房主)'}
            </li>
          ))}
        </ul>
      </div>
      
      {currentRoom.hostId === useSocket().socket?.id && (
        <div className="host-controls">
          <p className="host-info">你是房主！当有足够的玩家加入后，你可以开始游戏。</p>
          <button 
            className="start-game-btn" 
            onClick={handleStartGame}
            disabled={loading || currentRoom.players.length < 2}
          >
            {loading ? '启动中...' : '开始游戏'}
          </button>
          {currentRoom.players.length < 2 && (
            <p className="player-count-warning">需要至少2名玩家才能开始游戏</p>
          )}
        </div>
      )}
      
      {currentRoom.hostId !== useSocket().socket?.id && (
        <div className="player-waiting">
          <p>等待房主开始游戏...</p>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="room-code-display">
        <p>邀请朋友加入：</p>
        <div className="code-box">{currentRoom.code}</div>
      </div>
      
      <button className="rules-btn" onClick={toggleRules}>
        查看游戏规则
      </button>
    </div>
  );
};

export default RoomLobby; 
import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './GameTable.css';

interface Card {
  id: string;
  text: string;
  pick?: number;
  hidden?: boolean;
}

interface Player {
  name: string;
  score: number;
  hand: Card[];
}

interface GameTableProps {
  // Optional props if needed
}

const GameTable: React.FC<GameTableProps> = () => {
  const { socket, currentRoom, gameState, submitCard, selectWinner, nextRound } = useSocket();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset states when game state changes
  useEffect(() => {
    if (gameState?.phase) {
      setSelectedCardId(null);
      setSelectedSubmissionId(null);
      setError(null);
      setSuccess(null);
    }
  }, [gameState?.phase]);
  
  // Stabilize component during re-renders
  useEffect(() => {
    // Cleanup function to prevent memory leaks and race conditions
    return () => {
      setSubmitting(false);
      setSelecting(false);
      setAdvancing(false);
    };
  }, []);

  if (!currentRoom || !gameState) {
    return <div className="game-loading">游戏正在加载中，请稍候...</div>;
  }

  const playerId = socket?.id;
  const isCardCzar = playerId === gameState.currentCzar;
  const currentPhase = gameState.phase;
  const currentBlackCard = gameState.currentBlackCard;
  const playerData = gameState.players[playerId || ''];
  const isHost = currentRoom?.hostId === socket?.id;
  
  // Check if player has already submitted a card
  const hasSubmitted = gameState.submittedWhiteCards?.some(
    submission => submission.playerId === playerId || submission.isOwnSubmission
  );

  // Count how many players have submitted cards
  const submissionCount = gameState.submittedWhiteCards?.length || 0;
  const nonCzarPlayerCount = Object.keys(gameState.players).length - 1; // Total players minus Czar
  const remainingSubmissions = nonCzarPlayerCount - submissionCount;

  const handleCardSelect = (cardId: string) => {
    if (isCardCzar || currentPhase !== 'cardSubmission' || hasSubmitted) return;
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
  };

  const handleSubmitCard = async () => {
    if (!selectedCardId || !submitCard) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await submitCard(selectedCardId);
      
      if (response.success) {
        // Use a reference to avoid setting state on unmounted component
        const isMounted = true;
        setSuccess('卡片提交成功！');
        
        // Only clear success message if component is still mounted
        setTimeout(() => {
          if (isMounted) {
            setSuccess(null);
          }
        }, 3000);
      } else {
        setError(response.error || '提交卡片失败');
      }
    } catch (err) {
      setError('发生意外错误');
      console.error(err);
    } finally {
      // Only update state if we're still in submission phase
      if (gameState?.phase === 'cardSubmission') {
        setSubmitting(false);
      }
    }
  };

  const handleSubmissionSelect = (submissionId: number) => {
    if (!isCardCzar || currentPhase !== 'czarSelection') return;
    setSelectedSubmissionId(submissionId === selectedSubmissionId ? null : submissionId);
  };

  const handleSelectWinner = async () => {
    if (selectedSubmissionId === null || !selectWinner || !gameState?.submittedWhiteCards) return;
    
    const selectedSubmission = gameState.submittedWhiteCards[selectedSubmissionId];
    if (!selectedSubmission || !selectedSubmission.playerId) {
      setError('无效的选择');
      return;
    }

    setSelecting(true);
    setError(null);
    
    // Store the current phase to check later
    const currentPhaseWhenStarted = gameState.phase;
    
    try {
      const response = await selectWinner(selectedSubmission.playerId);
      
      if (response.success) {
        // Use a reference to avoid setting state on unmounted component
        const isMounted = true;
        setSuccess('获胜者已选择！');
        
        // Only clear success message if component is still mounted
        setTimeout(() => {
          if (isMounted) {
            setSuccess(null);
          }
        }, 3000);
      } else {
        setError(response.error || '选择获胜者失败');
      }
    } catch (err) {
      setError('发生意外错误');
      console.error(err);
    } finally {
      // Only update state if we're still in the same phase
      if (gameState?.phase === currentPhaseWhenStarted) {
        setSelecting(false);
      }
    }
  };

  const handleNextRound = async () => {
    if (!nextRound || currentPhase !== 'roundEnd' || !isHost) return;
    
    setAdvancing(true);
    setError(null);
    
    // Store the current phase to check later
    const currentPhaseWhenStarted = currentPhase;
    
    try {
      const response = await nextRound();
      
      if (response.success) {
        // Use a reference to avoid setting state on unmounted component
        const isMounted = true;
        setSuccess('开始下一轮！');
        
        // Only clear success message if component is still mounted
        setTimeout(() => {
          if (isMounted) {
            setSuccess(null);
          }
        }, 3000);
      } else {
        setError(response.error || '开始下一轮失败');
      }
    } catch (err) {
      setError('发生意外错误');
      console.error(err);
    } finally {
      // Only update state if we're still in the same phase
      if (gameState?.phase === currentPhaseWhenStarted) {
        setAdvancing(false);
      }
    }
  };

  const renderPlayerHand = () => {
    if (!playerData || !playerData.hand) return null;
    
    return (
      <div className="player-hand">
        <h3>你的手牌</h3>
        {currentPhase === 'cardSubmission' && !hasSubmitted && (
          <div className="player-instruction">
            请从你的手牌中选择一张白卡来回应黑卡的问题或填空。选择最有趣或最合适的卡片！
          </div>
        )}
        <div className="cards-container">
          {playerData.hand.map((card) => (
            <div 
              key={card.id} 
              className={`white-card ${selectedCardId === card.id ? 'selected' : ''} ${hasSubmitted || currentPhase !== 'cardSubmission' ? 'disabled' : ''}`}
              onClick={() => handleCardSelect(card.id)}
            >
              {card.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBlackCard = () => {
    if (!currentBlackCard) return null;
    
    return (
      <div className="black-card-container">
        <div className="black-card">
          <div className="card-text">{currentBlackCard.text}</div>
          <div className="card-pick">Pick: {currentBlackCard.pick}</div>
        </div>
      </div>
    );
  };

  const renderGameStatus = () => {
    // Find the Card Czar's name by looking through the current room players
    let czarName = gameState.currentCzarName || 'Unknown';
    
    if (czarName === 'Unknown' && currentRoom && gameState) {
      // First try to find the czar in the current room's players list
      const czarPlayer = currentRoom.players.find(player => player.id === gameState.currentCzar);
      if (czarPlayer) {
        czarName = czarPlayer.name;
      } else {
        // Fallback to game state players if not found in room
        const gameStatePlayer = Object.values(gameState.players).find(
          (player: any) => player.id === gameState.currentCzar
        );
        if (gameStatePlayer) {
          czarName = gameStatePlayer.name;
        }
      }
    }
    
    return (
      <div className="game-status">
        <div className="round-info">第 {gameState.roundNumber} 轮</div>
        <div className="phase-info">
          {currentPhase === 'cardSubmission' && `玩家提交卡片中 (${submissionCount}/${nonCzarPlayerCount})`}
          {currentPhase === 'czarSelection' && '卡牌之王正在选择获胜卡'}
          {currentPhase === 'roundEnd' && '本轮结束，准备下一轮'}
        </div>
        <div className="czar-info">
          卡牌之王: {czarName} {isCardCzar && '(你)'}
        </div>
      </div>
    );
  };

  const renderScoreboard = () => {
    const players = Object.entries(gameState.players).map(([id, data]) => ({
      id,
      name: data.name,
      score: data.score
    }));
    
    // Sort by score (highest first)
    players.sort((a, b) => b.score - a.score);
    
    return (
      <div className="scoreboard">
        <h3>得分榜</h3>
        <ul className="scoreboard-list">
          {players.map(player => (
            <li 
              key={player.id} 
              className={`scoreboard-item ${player.id === playerId ? 'current-player' : ''}`}
            >
              <span>{player.name} {player.id === playerId && '(你)'}</span>
              <span>{player.score}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSubmissions = () => {
    if (!gameState?.submittedWhiteCards || !Array.isArray(gameState.submittedWhiteCards) || gameState.submittedWhiteCards.length === 0) return null;
    
    // For Card Czar in selection phase
    if (isCardCzar && currentPhase === 'czarSelection') {
      return (
        <div className="submissions-container">
          <h3>选择获胜卡片</h3>
          <div className="player-instruction">
            作为卡牌之王，你的任务是选择最有趣或最合适的白卡作为获胜卡。点击一张卡片选择它，然后点击"确认选择"按钮。
          </div>
          <div className="cards-container">
            {gameState.submittedWhiteCards.map((submission: any, index: number) => (
              <div 
                key={submission.submissionId || index} 
                className={`white-card submission ${selectedSubmissionId === index ? 'selected' : ''}`}
                onClick={() => handleSubmissionSelect(index)}
              >
                {submission.cardId ? submission.cardText || 'Card' : 'Card'}
              </div>
            ))}
          </div>
          <button 
            className="select-winner-btn"
            disabled={selectedSubmissionId === null || selecting}
            onClick={handleSelectWinner}
          >
            {selecting ? '选择中...' : '确认选择'}
          </button>
        </div>
      );
    }
    
    // For round end phase - show winning card
    if (currentPhase === 'roundEnd' && gameState.roundWinner) {
      const winningSubmission = gameState.submittedWhiteCards.find(
        (s: any) => s.playerId === gameState.roundWinner
      );
      
      // Use the winner name and card text from game state if available
      const winnerName = gameState.winnerName || 
        gameState.players[gameState.roundWinner]?.name || 
        'Unknown';
      
      // Use the winning card text from multiple possible sources
      const winningCardText = gameState.winningCardText || 
        winningSubmission?.cardText || 
        (winningSubmission?.cardId && 
        gameState.players[gameState.roundWinner]?.hand.find((c: Card) => c.id === winningSubmission.cardId)?.text) || 
        'Winning Card';
      
      return (
        <div className="round-result">
          <h3>本轮获胜者: {winnerName}</h3>
          <div className="winning-combination">
            <div className="winning-prompt">
              <h4>获胜组合</h4>
              <div className="cards-display">
                <div className="black-card small">
                  <div className="card-text">{currentBlackCard.text}</div>
                </div>
                <div className="plus-symbol">+</div>
                <div className="white-card winner">
                  {winningCardText}
                </div>
              </div>
            </div>
          </div>
          {isHost && (
            <>
              <div className="player-instruction">
                作为房主，你可以点击"下一轮"按钮开始新的一轮游戏。
              </div>
              <button 
                className="next-round-btn"
                disabled={advancing}
                onClick={handleNextRound}
              >
                {advancing ? '开始中...' : '下一轮'}
              </button>
            </>
          )}
        </div>
      );
    }
    
    // For regular players or other phases
    if (currentPhase === 'czarSelection') {
      return (
        <div className="submissions-container">
          <h3>已提交的卡片</h3>
          <div className="player-instruction">
            所有玩家都已提交卡片。卡牌之王现在将选择获胜卡片。你可以看到自己提交的卡片，但其他玩家的卡片会保持匿名。
          </div>
          <div className="cards-container">
            {gameState.submittedWhiteCards.map((submission: any, index: number) => {
              // For other players, show if it's their submission
              if (submission.isOwnSubmission) {
                return (
                  <div key={submission.submissionId || index} className="white-card submission own-submission">
                    {submission.cardText || (submission.cardId && playerData.hand.find((c: Card) => c.id === submission.cardId)?.text) || '你的卡片'}
                  </div>
                );
              }
              
              // Otherwise show anonymous card
              return (
                <div key={submission.submissionId || index} className="white-card submission anonymous">
                  卡片 #{index + 1}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Safely determine current phase
  const safeRenderPhase = () => {
    if (!gameState || !currentPhase) {
      return <div className="loading-message">正在加载游戏状态...</div>;
    }
    
    return (
      <div className="game-table">
        {renderGameStatus()}
        
        <div className="table-center">
          {renderBlackCard()}
          
          {isCardCzar ? (
            <div className="czar-instructions">
              {currentPhase === 'cardSubmission' && `你是本轮的卡牌之王！请等待其他玩家提交卡片... (${submissionCount}/${nonCzarPlayerCount})`}
              {currentPhase === 'czarSelection' && '你是卡牌之王！请选择最有趣或最合适的白卡作为获胜卡！'}
              {currentPhase === 'roundEnd' && '准备好下一轮了吗？'}
            </div>
          ) : (
            <div className="player-actions">
              {currentPhase === 'cardSubmission' && !hasSubmitted && (
                <button 
                  className="submit-button" 
                  disabled={!selectedCardId || submitting}
                  onClick={handleSubmitCard}
                >
                  {submitting ? '提交中...' : '提交卡片'}
                </button>
              )}
              {currentPhase === 'cardSubmission' && hasSubmitted && (
                <div className="waiting-message">
                  已提交卡片！等待其他玩家... ({submissionCount}/{nonCzarPlayerCount})
                </div>
              )}
              {currentPhase === 'czarSelection' && (
                <div className="waiting-message">等待卡牌之王选择获胜卡...</div>
              )}
              {currentPhase === 'roundEnd' && !isHost && (
                <div className="waiting-message">本轮结束！等待房主开始下一轮...</div>
              )}
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
        
        {renderSubmissions()}
        
        {!isCardCzar && currentPhase !== 'roundEnd' && renderPlayerHand()}
        
        {renderScoreboard()}
      </div>
    );
  };
  
  return safeRenderPhase();
};

export default GameTable; 
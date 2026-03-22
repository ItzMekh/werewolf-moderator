import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import socket from '../socket.js';

const ROLE_EMOJIS = {
  werewolf: '🐺',
  seer: '👁️',
  bodyguard: '🛡️',
  villager: '👤'
};

const NIGHT_TURN_LABELS = {
  werewolf: 'night.werewolfTurn',
  bodyguard: 'night.bodyguardTurn',
  seer: 'night.seerTurn',
  done: 'night.allDone'
};

export default function ModeratorView() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();

  const [gamePhase, setGamePhase] = useState('roleReveal');
  const [nightSubPhase, setNightSubPhase] = useState(null);
  const [round, setRound] = useState(1);
  const [players, setPlayers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [nightActions, setNightActions] = useState([]);
  const [dayVotes, setDayVotes] = useState([]);
  const [allNightActionsIn, setAllNightActionsIn] = useState(false);
  const [allDayVotesIn, setAllDayVotesIn] = useState(false);
  const [nightResult, setNightResult] = useState(null);
  const [dayResult, setDayResult] = useState(null);
  const [seerResult, setSeerResult] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Lobby state (for play-again)
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [roleConfig, setRoleConfig] = useState({
    werewolf: 2,
    seer: 1,
    bodyguard: 1,
    villager: 3
  });
  const [lobbyError, setLobbyError] = useState('');
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    // Auto-rejoin on socket reconnect (server restart or network drop)
    const handleReconnect = () => {
      console.log('Moderator socket reconnected — attempting rejoin...');
      socket.emit('rejoin-moderator', { roomCode }, (response) => {
        if (response.success) {
          console.log('Moderator rejoin successful');
          setConnectionLost(false);

          if (response.gameState) {
            const gs = response.gameState;
            setGamePhase(gs.phase);
            setRound(gs.round);
            setNightSubPhase(gs.nightSubPhase);
            setPlayers(gs.players.map(p => ({ name: p.name, alive: p.alive, connected: p.connected })));
            setAllRoles(gs.players);
          } else if (response.lobbyInfo) {
            setGamePhase('lobby');
            setLobbyPlayers(response.lobbyInfo.players);
            if (response.lobbyInfo.roleConfig && Object.keys(response.lobbyInfo.roleConfig).length > 0) {
              setRoleConfig(response.lobbyInfo.roleConfig);
            }
          }
        } else {
          console.log('Moderator rejoin failed:', response.error);
          navigate('/');
        }
      });
    };

    const handleDisconnect = () => {
      setConnectionLost(true);
    };

    socket.on('connect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('game-started', (data) => {
      setGamePhase(data.phase);
      setRound(data.round);
      setPlayers(data.players);
    });

    socket.on('all-roles', (data) => {
      setAllRoles(data.players);
    });

    socket.on('night-started', (data) => {
      setGamePhase('night');
      setRound(data.round);
      setNightSubPhase(data.nightSubPhase);
      setNightActions([]);
      setAllNightActionsIn(false);
      setSeerResult(null);
    });

    socket.on('night-sub-phase-changed', (data) => {
      setNightSubPhase(data.nightSubPhase);
    });

    socket.on('night-action-received', (data) => {
      setNightActions(prev => [...prev, data]);
    });

    socket.on('all-night-actions-received', () => {
      setAllNightActionsIn(true);
    });

    socket.on('day-vote-received', (data) => {
      setDayVotes(prev => [...prev, data]);
    });

    socket.on('all-day-votes-received', () => {
      setAllDayVotesIn(true);
    });

    socket.on('seer-check-result', (data) => {
      setSeerResult(data);
    });

    socket.on('game-over', (data) => {
      setGameOver(data);
      setGamePhase('finished');
    });

    socket.on('player-disconnected', ({ players: updatedPlayers }) => {
      setPlayers(prev => prev.map(p => {
        const updated = updatedPlayers.find(u => u.name === p.name);
        return updated ? { ...p, connected: updated.connected, alive: updated.alive } : p;
      }));
      // Also update lobby players if in lobby
      setLobbyPlayers(updatedPlayers);
    });

    // Lobby events (for play-again phase)
    socket.on('player-joined', ({ players: updatedPlayers }) => {
      setLobbyPlayers(updatedPlayers);
    });

    socket.on('player-left', ({ players: updatedPlayers }) => {
      setLobbyPlayers(updatedPlayers);
    });

    socket.on('player-reconnected', ({ players: updatedPlayers }) => {
      setPlayers(prev => prev.map(p => {
        const updated = updatedPlayers.find(u => u.name === p.name);
        return updated ? { ...p, connected: updated.connected, alive: updated.alive } : p;
      }));
      setLobbyPlayers(updatedPlayers);
    });

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('game-started');
      socket.off('all-roles');
      socket.off('night-started');
      socket.off('night-sub-phase-changed');
      socket.off('night-action-received');
      socket.off('all-night-actions-received');
      socket.off('day-vote-received');
      socket.off('all-day-votes-received');
      socket.off('seer-check-result');
      socket.off('game-over');
      socket.off('player-disconnected');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('player-reconnected');
    };
  }, [roomCode, navigate]);

  const startNight = () => {
    socket.emit('start-night', { roomCode }, (response) => {
      if (response.success) {
        // State updated via socket events
      }
    });
  };

  const resolveNight = () => {
    socket.emit('resolve-night', { roomCode }, (response) => {
      if (response.success) {
        setNightResult(response.result);
        setShowResult(true);
        if (!response.gameOver) {
          setGamePhase('day');
          setNightSubPhase(null);
        }
        setNightActions([]);
        setAllNightActionsIn(false);
        setSeerResult(null);
      }
    });
  };

  const resolveDay = () => {
    socket.emit('resolve-day', { roomCode }, (response) => {
      if (response.success) {
        setDayResult(response.result);
        setShowResult(true);
        if (!response.gameOver) {
          setGamePhase('night');
          setRound(prev => prev + 1);
        }
        setDayVotes([]);
        setAllDayVotesIn(false);
      }
    });
  };

  const playAgain = () => {
    socket.emit('play-again', { roomCode }, (response) => {
      if (response.success) {
        // Reset all game state
        setGameOver(null);
        setGamePhase('lobby');
        setRound(1);
        setPlayers([]);
        setAllRoles([]);
        setNightActions([]);
        setDayVotes([]);
        setAllNightActionsIn(false);
        setAllDayVotesIn(false);
        setNightResult(null);
        setDayResult(null);
        setSeerResult(null);
        setShowResult(false);
        setNightSubPhase(null);
        setLobbyError('');
      } else {
        alert('❌ ไม่สามารถเริ่มเกมใหม่ได้: ' + response.error);
        navigate('/');
      }
    });
  };

  const endGame = () => {
    socket.emit('end-game', { roomCode }, (response) => {
      // ถ้าระบบตอบกลับมาว่าไม่มีห้องแล้ว ก็เด้งออกไปหน้าแรกเลย
      navigate('/');
    });
  };

  const dismissResult = () => {
    setShowResult(false);
    setNightResult(null);
    setDayResult(null);
  };

  // Lobby functions
  const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0);

  const updateRole = (role, delta) => {
    setRoleConfig(prev => {
      const updated = {
        ...prev,
        [role]: Math.max(role === 'werewolf' ? 1 : 0, prev[role] + delta)
      };
      socket.emit('update-role-config', { roomCode, roleConfig: updated });
      return updated;
    });
  };

  const startGame = () => {
    setLobbyError('');
    if (lobbyPlayers.length < 4) {
      setLobbyError(t('lobby.minPlayers'));
      return;
    }
    if (totalRoles !== lobbyPlayers.length) {
      setLobbyError(`Role count (${totalRoles}) must match player count (${lobbyPlayers.length})`);
      return;
    }

    socket.emit('start-game', { roomCode, roleConfig }, (response) => {
      if (response.success) {
        // game-started and all-roles events will update state
      } else {
        setLobbyError(response.error);
      }
    });
  };

  // Game Over Screen
  if (gameOver) {
    return (
      <div className="page moderator-page">
        <div className="game-over-screen">
          <h1>{t('gameOver.title')}</h1>
          <div className={`winner-banner ${gameOver.winner}`}>
            {gameOver.winner === 'village' ? '🏘️' : '🐺'}
            <h2>{gameOver.winner === 'village' ? t('gameOver.villageWin') : t('gameOver.werewolfWin')}</h2>
          </div>
          <p className="reason">{gameOver.reason}</p>

          <div className="card">
            <div className="player-roles-reveal">
              {gameOver.players.map((p, i) => (
                <div key={i} className={`player-reveal ${p.alive ? '' : 'dead'}`}>
                  <span className="emoji">{p.emoji}</span>
                  <span className="name">{p.name}</span>
                  <span className="role">{t(`roles.${p.role}`)}</span>
                  <span className={`status ${p.alive ? 'alive' : 'dead'}`}>
                    {p.alive ? '❤️' : '💀'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-primary btn-lg" onClick={playAgain}>
              🔄 {t('gameOver.playAgain')}
            </button>
            <button className="btn btn-secondary" onClick={endGame}>
              {t('gameOver.backToLobby')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page moderator-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      {/* Connection Lost Banner */}
      {connectionLost && (
        <div className="connection-lost-banner">
          ⚡ {lang === 'th' ? 'ขาดการเชื่อมต่อ... กำลังเชื่อมต่อใหม่' : 'Connection lost... Reconnecting'}
        </div>
      )}

      {/* Header */}
      <div className="mod-header">
        <div className="phase-badge">
          {gamePhase === 'night' ? '🌙' : gamePhase === 'roleReveal' ? '🎭' : gamePhase === 'lobby' ? '⏳' : '☀️'}
          <span>
            {gamePhase === 'night' ? t('game.night') :
             gamePhase === 'roleReveal' ? t('roleReveal.title') :
             gamePhase === 'lobby' ? t('lobby.roomCode') :
             t('game.day')}
          </span>
        </div>
        {gamePhase !== 'lobby' && <div className="round-badge">{t('game.round')} {round}</div>}
        <div className="room-badge">#{roomCode}</div>
      </div>

      {/* Night Sub-Phase Indicator */}
      {gamePhase === 'night' && nightSubPhase && (
        <div className="night-sub-phase-indicator">
          <span className="sub-phase-emoji">
            {nightSubPhase === 'done' ? '✅' : ROLE_EMOJIS[nightSubPhase] || '🌙'}
          </span>
          <span className="sub-phase-text">
            {t(NIGHT_TURN_LABELS[nightSubPhase] || 'night.sleeping')}
          </span>
        </div>
      )}

      {/* Result Overlay */}
      {showResult && (
        <div className="result-overlay" onClick={dismissResult}>
          <div className="result-card" onClick={e => e.stopPropagation()}>
            {nightResult && (
              <>
                <h2>🌙 {t('night.title')} - {t('game.round')} {round}</h2>
                {nightResult.killed ? (
                  <div className="death-announce">
                    <span className="skull">💀</span>
                    <p><strong>{nightResult.killed}</strong> {t('result.killed')}</p>
                  </div>
                ) : nightResult.protectedBy ? (
                  <div className="save-announce">
                    <span className="shield">🛡️</span>
                    <p>{t('result.protected')}</p>
                  </div>
                ) : (
                  <div className="safe-announce">
                    <p>{t('result.noOneDied')}</p>
                  </div>
                )}
              </>
            )}
            {dayResult && (
              <>
                <h2>☀️ {t('dayPhase.title')} - {t('game.round')} {round}</h2>
                {dayResult.eliminated ? (
                  <div className="death-announce">
                    <span className="skull">⚰️</span>
                    <p><strong>{dayResult.eliminated}</strong> {t('result.eliminated')}</p>
                  </div>
                ) : dayResult.tied ? (
                  <div className="safe-announce">
                    <p>{t('result.tied')}</p>
                  </div>
                ) : (
                  <div className="safe-announce">
                    <p>{t('result.noElimination')}</p>
                  </div>
                )}
                {dayResult.tally && Object.keys(dayResult.tally).length > 0 && (
                  <div className="vote-tally">
                    {Object.entries(dayResult.tally).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                      <div key={name} className="tally-row">
                        <span>{name}</span>
                        <span className="tally-count">{count} vote{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <button className="btn btn-primary" onClick={dismissResult}>{t('common.close')}</button>
          </div>
        </div>
      )}

      {/* ===== LOBBY PHASE (after play-again) ===== */}
      {gamePhase === 'lobby' && (
        <>
          {/* Players List */}
          <div className="card">
            <h2>{t('lobby.players')} ({lobbyPlayers.length})</h2>
            {lobbyPlayers.length === 0 ? (
              <p className="waiting-text">{t('lobby.waiting')}</p>
            ) : (
              <div className="player-list">
                {lobbyPlayers.map((p, i) => (
                  <div key={i} className="player-chip">
                    <span className="player-number">{i + 1}</span>
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Configuration */}
          <div className="card">
            <h2>{t('lobby.roleConfig')}</h2>
            <div className="role-config">
              {Object.entries(roleConfig).map(([role, count]) => (
                <div key={role} className="role-row">
                  <span className="role-emoji">{ROLE_EMOJIS[role]}</span>
                  <span className="role-name">{t(`roles.${role}`)}</span>
                  <div className="role-counter">
                    <button className="btn-counter" onClick={() => updateRole(role, -1)}>−</button>
                    <span className="count">{count}</span>
                    <button className="btn-counter" onClick={() => updateRole(role, 1)}>+</button>
                  </div>
                </div>
              ))}
              <div className="role-total">
                {t('lobby.total')}: {totalRoles} / {lobbyPlayers.length} {t('lobby.players').toLowerCase()}
              </div>
            </div>
          </div>

          {lobbyError && <div className="error-msg">{lobbyError}</div>}

          <button
            className="btn btn-primary btn-lg btn-start"
            onClick={startGame}
            disabled={lobbyPlayers.length < 4 || totalRoles !== lobbyPlayers.length}
          >
            🎮 {t('lobby.startGame')}
          </button>
        </>
      )}

      {/* Players Grid (during game) */}
      {gamePhase !== 'lobby' && (
        <div className="card">
          <h2>{t('lobby.players')}</h2>
          <div className="mod-player-grid">
            {allRoles.map((p, i) => {
              const playerState = players.find(pl => pl.name === p.name);
              const isAlive = playerState ? playerState.alive : true;
              return (
                <div key={i} className={`mod-player-card ${isAlive ? '' : 'dead'}`}>
                  <div className="player-emoji">{p.emoji}</div>
                  <div className="player-name">{p.name}</div>
                  <div className="player-role">{t(`roles.${p.role}`)}</div>
                  <div className={`player-status ${isAlive ? 'alive' : 'dead'}`}>
                    {isAlive ? '❤️' : '💀'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ROLE REVEAL PHASE ===== */}
      {gamePhase === 'roleReveal' && (
        <div className="card">
          <h2>🎭 {t('roleReveal.title')}</h2>
          <p className="mod-hint">{t('roleReveal.moderatorHint')}</p>
          <button
            className="btn btn-primary btn-lg btn-start"
            onClick={startNight}
          >
            🌙 {t('night.startNight')}
          </button>
        </div>
      )}

      {/* ===== NIGHT PHASE ACTIONS ===== */}
      {gamePhase === 'night' && (
        <div className="card">
          <h2>🌙 {t('moderator.nightActions')}</h2>
          <div className="actions-list">
            {nightActions.length === 0 ? (
              <p className="waiting-text">{t('night.waiting')}</p>
            ) : (
              nightActions.map((action, i) => (
                <div key={i} className="action-item">
                  <span className="action-role">{ROLE_EMOJIS[action.role]} {t(`roles.${action.role}`)}</span>
                  <span className="action-player">({action.player})</span>
                  <span className="action-arrow">→</span>
                  <span className="action-target">{action.target}</span>
                </div>
              ))
            )}
          </div>

          {seerResult && (
            <div className="seer-result-mod">
              <span>👁️ {t('roles.seer')}: {seerResult.target} = </span>
              <span className={`team-badge ${seerResult.team}`}>
                {ROLE_EMOJIS[seerResult.role]} {t(`roles.${seerResult.role}`)}
              </span>
            </div>
          )}

          {allNightActionsIn && (
            <div className="all-actions-alert">
              ✅ {t('night.allActionsIn')}
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            onClick={resolveNight}
            disabled={!allNightActionsIn && nightSubPhase !== 'done'}
          >
            🌅 {t('night.resolve')}
          </button>
        </div>
      )}

      {/* ===== DAY PHASE VOTES ===== */}
      {gamePhase === 'day' && (
        <div className="card">
          <h2>☀️ {t('moderator.dayVotes')}</h2>
          <div className="actions-list">
            {dayVotes.length === 0 ? (
              <p className="waiting-text">{t('night.waiting')}</p>
            ) : (
              dayVotes.map((vote, i) => (
                <div key={i} className="action-item">
                  <span className="action-player">{vote.voter}</span>
                  <span className="action-arrow">→</span>
                  <span className="action-target">{vote.target === 'skip' ? '⏭️ Skip' : vote.target}</span>
                </div>
              ))
            )}
          </div>

          {allDayVotesIn && (
            <div className="all-actions-alert">
              ✅ {t('dayPhase.allVotesIn')}
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            onClick={resolveDay}
          >
            ⚖️ {t('dayPhase.resolve')}
          </button>
        </div>
      )}

      {/* End Game Button (during game, not lobby) */}
      {gamePhase !== 'lobby' && (
        <button className="btn btn-danger" onClick={endGame}>
          {t('moderator.endGame')}
        </button>
      )}
    </div>
  );
}

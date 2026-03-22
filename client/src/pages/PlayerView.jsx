import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import socket from '../socket.js';

const ROLE_EMOJIS = {
  werewolf: '🐺',
  seer: '👁️',
  bodyguard: '🛡️',
  villager: '👤'
};

export default function PlayerView() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();

  const playerName = sessionStorage.getItem('playerName');

  const [role, setRole] = useState(null);
  const [roleEmoji, setRoleEmoji] = useState('');
  const [team, setTeam] = useState('');
  const [gamePhase, setGamePhase] = useState('waiting');
  const [nightSubPhase, setNightSubPhase] = useState(null);
  const [round, setRound] = useState(0);
  const [players, setPlayers] = useState([]);
  const [alive, setAlive] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [werewolfTeammates, setWerewolfTeammates] = useState([]);
  const [werewolfVotes, setWerewolfVotes] = useState({});
  const [seerResult, setSeerResult] = useState(null);
  const [nightResult, setNightResult] = useState(null);
  const [dayResult, setDayResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [voteCount, setVoteCount] = useState({ voted: 0, total: 0 });
  const [bodyguardError, setBodyguardError] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [roleConfig, setRoleConfig] = useState(null);

  // Press-and-hold timer for role peek
  const peekTimer = useRef(null);

  const startPeek = useCallback(() => {
    peekTimer.current = setTimeout(() => {
      setPeeking(true);
    }, 200);
  }, []);

  const stopPeek = useCallback(() => {
    if (peekTimer.current) {
      clearTimeout(peekTimer.current);
      peekTimer.current = null;
    }
    setPeeking(false);
  }, []);

  useEffect(() => {
    if (!playerName) {
      navigate('/join');
      return;
    }

    // Request lobby info (emit-based, no callback — uses lobby-info listener below)
    socket.emit('request-lobby-info', { roomCode });

    // Lobby info (sent by server on join or request-lobby-info)
    socket.on('lobby-info', (data) => {
      setLobbyPlayers(data.players);
      if (data.roleConfig && Object.keys(data.roleConfig).length > 0) {
        setRoleConfig(data.roleConfig);
      }
    });

    // Real-time player list updates
    socket.on('player-joined', ({ players: updatedPlayers }) => {
      setLobbyPlayers(updatedPlayers);
    });

    socket.on('player-left', ({ players: updatedPlayers }) => {
      setLobbyPlayers(updatedPlayers);
    });

    // Role config updates from moderator
    socket.on('role-config-updated', ({ roleConfig: newConfig }) => {
      setRoleConfig(newConfig);
    });

    socket.on('role-assigned', (data) => {
      setRole(data.role);
      setRoleEmoji(data.emoji);
      setTeam(data.team);
    });

    socket.on('werewolf-teammates', (data) => {
      setWerewolfTeammates(data.teammates);
    });

    socket.on('game-started', (data) => {
      setGamePhase(data.phase);
      setRound(data.round);
      setPlayers(data.players);
    });

    // Night phase events
    socket.on('night-started', (data) => {
      setGamePhase('night');
      setRound(data.round);
      setNightSubPhase(data.nightSubPhase);
      setActionSubmitted(false);
      setSelectedTarget(null);
      setWerewolfVotes({});
      setSeerResult(null);
      setBodyguardError('');
    });

    socket.on('night-sub-phase-changed', (data) => {
      setNightSubPhase(data.nightSubPhase);
      // Reset action state for new sub-phase
      setActionSubmitted(false);
      setSelectedTarget(null);
    });

    socket.on('werewolf-vote-update', (data) => {
      setWerewolfVotes(prev => ({ ...prev, [data.voter]: data.target }));
    });

    socket.on('seer-result', (data) => {
      setSeerResult(data);
    });

    socket.on('night-result', (data) => {
      setNightResult(data);
      setShowResult(true);
      setGamePhase(data.phase);
      setRound(data.round);
      setPlayers(data.players);
      setActionSubmitted(false);
      setSelectedTarget(null);
      setWerewolfVotes({});
      setNightSubPhase(null);
      setBodyguardError('');

      const me = data.players.find(p => p.name === playerName);
      if (me && !me.alive) setAlive(false);
    });

    socket.on('day-result', (data) => {
      setDayResult(data);
      setShowResult(true);
      setGamePhase(data.phase);
      setRound(data.round);
      setPlayers(data.players);
      setActionSubmitted(false);
      setSelectedTarget(null);
      setNightSubPhase(data.nightSubPhase || null);

      const me = data.players.find(p => p.name === playerName);
      if (me && !me.alive) setAlive(false);
    });

    socket.on('vote-count-update', (data) => {
      setVoteCount(data);
    });

    socket.on('game-over', (data) => {
      setGameOver(data);
      setGamePhase('finished');
    });

    // Game reset — back to lobby (play again)
    socket.on('game-reset', (data) => {
      setGameOver(null);
      setGamePhase('waiting');
      setRole(null);
      setRoleEmoji('');
      setTeam('');
      setRound(0);
      setPlayers([]);
      setAlive(true);
      setSelectedTarget(null);
      setActionSubmitted(false);
      setWerewolfTeammates([]);
      setWerewolfVotes({});
      setSeerResult(null);
      setNightResult(null);
      setDayResult(null);
      setShowResult(false);
      setPeeking(false);
      setVoteCount({ voted: 0, total: 0 });
      setNightSubPhase(null);
      setBodyguardError('');
      setLobbyPlayers(data.players);
      if (data.roleConfig) setRoleConfig(data.roleConfig);
    });

    // Game ended — go home
    socket.on('game-ended', () => {
      navigate('/');
    });

    socket.on('room-closed', () => {
      navigate('/');
    });

    return () => {
      socket.off('lobby-info');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('role-config-updated');
      socket.off('role-assigned');
      socket.off('werewolf-teammates');
      socket.off('game-started');
      socket.off('night-started');
      socket.off('night-sub-phase-changed');
      socket.off('werewolf-vote-update');
      socket.off('seer-result');
      socket.off('night-result');
      socket.off('day-result');
      socket.off('vote-count-update');
      socket.off('game-over');
      socket.off('game-reset');
      socket.off('game-ended');
      socket.off('room-closed');
    };
  }, [playerName, navigate, roomCode]);

  const submitNightAction = () => {
    if (!selectedTarget) return;

    let action;
    switch (role) {
      case 'werewolf': action = 'werewolf-kill'; break;
      case 'seer': action = 'seer-check'; break;
      case 'bodyguard': action = 'bodyguard-protect'; break;
      default: return;
    }

    socket.emit('night-action', { roomCode, action, target: selectedTarget }, (response) => {
      if (response.success) {
        if (role === 'werewolf') {
          // Werewolves can re-vote — don't lock them out
          setWerewolfVotes(prev => ({ ...prev, [playerName]: selectedTarget }));
        } else {
          setActionSubmitted(true);
        }
      } else {
        if (response.error && response.error.includes('Cannot protect the same person')) {
          setBodyguardError(t('night.cannotProtectSame'));
          setSelectedTarget(null);
        }
      }
    });
  };

  const submitDayVote = (target) => {
    socket.emit('day-vote', { roomCode, target }, (response) => {
      if (response.success) {
        setActionSubmitted(true);
        setSelectedTarget(target);
      }
    });
  };

  const getActionText = () => {
    switch (role) {
      case 'werewolf': return t('night.werewolfAction');
      case 'seer': return t('night.seerAction');
      case 'bodyguard': return t('night.bodyguardAction');
      default: return t('night.villagerWait');
    }
  };

  const getSelectablePlayers = () => {
    if (!role) return [];
    const alivePlayers = players.filter(p => p.alive);

    switch (role) {
      case 'werewolf':
        return alivePlayers.filter(p =>
          p.name !== playerName && !werewolfTeammates.includes(p.name)
        );
      case 'seer':
        return alivePlayers.filter(p => p.name !== playerName);
      case 'bodyguard':
        return alivePlayers; // Bodyguard CAN protect self
      default:
        return [];
    }
  };

  const dismissResult = () => {
    setShowResult(false);
    setNightResult(null);
    setDayResult(null);
  };

  // Calculate role probabilities
  const getRoleProbabilities = () => {
    if (!roleConfig) return [];
    const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0);
    if (totalRoles === 0) return [];

    return Object.entries(roleConfig)
      .filter(([, count]) => count > 0)
      .map(([roleName, count]) => ({
        role: roleName,
        count,
        emoji: ROLE_EMOJIS[roleName] || '👤',
        percent: Math.round((count / totalRoles) * 100)
      }));
  };

  // Check if it's this player's turn during night
  const isMyNightTurn = () => {
    if (gamePhase !== 'night' || !nightSubPhase || !role || !alive) return false;
    if (nightSubPhase === 'done') return false;
    return role === nightSubPhase;
  };

  const getNightSubPhaseText = () => {
    switch (nightSubPhase) {
      case 'werewolf': return t('night.werewolfTurn');
      case 'bodyguard': return t('night.bodyguardTurn');
      case 'seer': return t('night.seerTurn');
      case 'done': return t('night.allDone');
      default: return t('night.sleeping');
    }
  };

  // Check if all werewolves agree
  const getWerewolfConsensus = () => {
    const votes = Object.values(werewolfVotes);
    if (votes.length === 0) return { agreed: false, target: null };
    const allSame = votes.every(v => v === votes[0]);
    return { agreed: allSame, target: allSame ? votes[0] : null };
  };

  // Game Over Screen
  if (gameOver) {
    const myInfo = gameOver.players.find(p => p.name === playerName);
    const isWinner = myInfo && (
      (gameOver.winner === 'village' && myInfo.role !== 'werewolf') ||
      (gameOver.winner === 'werewolf' && myInfo.role === 'werewolf')
    );

    return (
      <div className="page player-page">
        <div className="game-over-screen">
          <h1>{t('gameOver.title')}</h1>
          <div className={`winner-banner ${gameOver.winner}`}>
            {gameOver.winner === 'village' ? '🏘️' : '🐺'}
            <h2>{gameOver.winner === 'village' ? t('gameOver.villageWin') : t('gameOver.werewolfWin')}</h2>
          </div>

          <div className={`personal-result ${isWinner ? 'win' : 'lose'}`}>
            <span>{isWinner ? '🎉' : '😢'}</span>
            <p>{isWinner ? 'You Win!' : 'You Lose!'}</p>
          </div>

          <div className="card">
            <div className="player-roles-reveal">
              {gameOver.players.map((p, i) => (
                <div key={i} className={`player-reveal ${p.alive ? '' : 'dead'} ${p.name === playerName ? 'is-me' : ''}`}>
                  <span className="emoji">{p.emoji}</span>
                  <span className="name">{p.name} {p.name === playerName ? `(${t('game.you')})` : ''}</span>
                  <span className="role">{t(`roles.${p.role}`)}</span>
                  <span className={`status ${p.alive ? 'alive' : 'dead'}`}>
                    {p.alive ? '❤️' : '💀'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="waiting-text" style={{ marginTop: '16px' }}>
            ⏳ {t('lobby.waitingModerator')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page player-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      {/* Player Info Bar */}
      <div className="player-info-bar">
        <span className="player-name-badge">👤 {playerName}</span>
        <div className="phase-badge">
          {gamePhase === 'night' ? '🌙' : gamePhase === 'day' ? '☀️' : gamePhase === 'roleReveal' ? '🎭' : '⏳'}
          <span>
            {gamePhase === 'night' ? t('game.night') :
             gamePhase === 'day' ? t('game.day') :
             gamePhase === 'roleReveal' ? t('roleReveal.title') : '...'}
          </span>
        </div>
        {round > 0 && <span className="round-badge">{t('game.round')} {round}</span>}
        {role && (
          <span className={`alive-badge ${alive ? 'alive' : 'dead'}`}>
            {alive ? '❤️' : '💀'}
          </span>
        )}
      </div>

      {/* Role Peek Card (press and hold) — hidden by default, revealed on peek */}
      {role && (gamePhase === 'roleReveal' || gamePhase === 'day' || gamePhase === 'night') && (
        <div
          className={`role-peek-card ${peeking ? 'peeking' : ''}`}
          onMouseDown={startPeek}
          onMouseUp={stopPeek}
          onMouseLeave={stopPeek}
          onTouchStart={startPeek}
          onTouchEnd={stopPeek}
          onTouchCancel={stopPeek}
        >
          <div className="role-peek-hidden">
            <span>🂠</span>
            <p>{t('roleReveal.peekHint')}</p>
          </div>
          <div className="role-peek-revealed">
            <span className="role-big-emoji">{roleEmoji}</span>
            <h2>{t(`roles.${role}`)}</h2>
            <span className={`team-label ${team}`}>
              {team === 'werewolf' ? '🐺 Werewolf Team' : '🏘️ Village Team'}
            </span>
          </div>
        </div>
      )}

      {/* Result Overlay */}
      {showResult && (
        <div className="result-overlay" onClick={dismissResult}>
          <div className="result-card" onClick={e => e.stopPropagation()}>
            {nightResult && (
              <>
                <h2>🌅 {t('dayPhase.title')}</h2>
                {nightResult.killed ? (
                  <div className="death-announce">
                    <span className="skull">💀</span>
                    <p><strong>{nightResult.killed}</strong> {t('result.killed')}</p>
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
                <h2>🌙 {t('night.title')}</h2>
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
              </>
            )}
            <button className="btn btn-primary" onClick={dismissResult}>{t('common.close')}</button>
          </div>
        </div>
      )}

      {/* Dead Player - Just Watch */}
      {!alive && gamePhase !== 'finished' && gamePhase !== 'waiting' && (
        <div className="card dead-card">
          <span className="skull-big">💀</span>
          <p>{t('game.dead')}</p>
        </div>
      )}

      {/* ===== ROLE REVEAL PHASE ===== */}
      {gamePhase === 'roleReveal' && alive && (
        <div className="card role-reveal-card">
          <div className="role-reveal-content">
            <span className="role-reveal-icon">🎭</span>
            <h2>{t('roleReveal.title')}</h2>
            <p>{t('roleReveal.peekHint')}</p>
            <p className="role-reveal-wait">{t('roleReveal.waitForNight')}</p>
          </div>
        </div>
      )}

      {/* ===== NIGHT PHASE ===== */}
      {gamePhase === 'night' && alive && (
        <>
          {/* Sleeping Screen (not your turn) */}
          {!isMyNightTurn() && (
            <div className="sleeping-screen">
              <div className="sleeping-content">
                <span className="sleeping-icon">😴</span>
                <h2>{t('night.sleeping')}</h2>
                <p className="night-sub-phase-text">{getNightSubPhaseText()}</p>
              </div>
            </div>
          )}

          {/* Active Night Action (your turn) */}
          {isMyNightTurn() && (
            <div className="card action-card night-active">
              <div className="turn-indicator">
                <span className="turn-emoji">{roleEmoji}</span>
                <h2>{getActionText()}</h2>
              </div>

              {/* Werewolf: always show target list (can re-vote) */}
              {role === 'werewolf' ? (
                <>
                  {werewolfTeammates.length > 0 && (
                    <div className="teammates-info">
                      <p>🐺 {werewolfTeammates.join(', ')}</p>
                    </div>
                  )}

                  {/* Show all werewolf votes */}
                  {Object.keys(werewolfVotes).length > 0 && (
                    <div className="wolf-votes">
                      {Object.entries(werewolfVotes).map(([voter, target]) => (
                        <div key={voter} className="wolf-vote-item">
                          <span>🐺 {voter}</span> → <span>{target}</span>
                        </div>
                      ))}
                      {(() => {
                        const { agreed } = getWerewolfConsensus();
                        return agreed ? (
                          <div className="wolf-consensus">✅ {t('night.actionSubmitted')}</div>
                        ) : (
                          <div className="wolf-no-consensus">⚠️ {t('night.waiting')}</div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="target-list">
                    {getSelectablePlayers().map((p, i) => (
                      <button
                        key={i}
                        className={`target-btn ${selectedTarget === p.name ? 'selected' : ''} ${werewolfVotes[playerName] === p.name ? 'voted' : ''}`}
                        onClick={() => setSelectedTarget(p.name)}
                      >
                        {p.name}
                        {werewolfVotes[playerName] === p.name && ' ✓'}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={submitNightAction}
                    disabled={!selectedTarget}
                  >
                    {werewolfVotes[playerName] ? t('common.confirm') + ' ↻' : t('common.confirm')}
                  </button>
                </>
              ) : actionSubmitted ? (
                /* Non-werewolf: show submitted state */
                <div className="action-submitted">
                  <span>✅</span>
                  <p>{t('night.actionSubmitted')}</p>
                  {seerResult && role === 'seer' && (
                    <div className={`seer-result team-${seerResult.team}`}>
                      <p>{seerResult.target}: <strong>{seerResult.emoji} {t(`roles.${seerResult.role}`)}</strong></p>
                      <span className={`team-badge ${seerResult.team}`}>
                        {seerResult.team === 'werewolf' ? '🐺' : '🏘️'} {seerResult.team}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-werewolf: show target selection */
                <>
                  {bodyguardError && (
                    <div className="error-msg">{bodyguardError}</div>
                  )}

                  <div className="target-list">
                    {getSelectablePlayers().map((p, i) => (
                      <button
                        key={i}
                        className={`target-btn ${selectedTarget === p.name ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedTarget(p.name);
                          setBodyguardError('');
                        }}
                      >
                        {p.name} {p.name === playerName ? `(${t('game.you')})` : ''}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={submitNightAction}
                    disabled={!selectedTarget}
                  >
                    {t('common.confirm')}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== DAY PHASE - Vote UI ===== */}
      {gamePhase === 'day' && alive && (
        <div className="card action-card">
          <h2>☀️ {t('dayPhase.vote')}</h2>
          <div className="vote-progress">
            {t('dayPhase.voteCount')}: {voteCount.voted}/{voteCount.total}
          </div>

          {actionSubmitted ? (
            <div className="action-submitted">
              <span>✅</span>
              <p>{t('night.actionSubmitted')}</p>
            </div>
          ) : (
            <>
              <div className="target-list">
                {players.filter(p => p.alive && p.name !== playerName).map((p, i) => (
                  <button
                    key={i}
                    className={`target-btn ${selectedTarget === p.name ? 'selected' : ''}`}
                    onClick={() => submitDayVote(p.name)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => submitDayVote('skip')}
              >
                ⏭️ {t('dayPhase.skip')}
              </button>
            </>
          )}
        </div>
      )}

      {/* ===== WAITING LOBBY ===== */}
      {gamePhase === 'waiting' && (
        <>
          {/* Player List */}
          <div className="card">
            <h2>{t('lobby.players')} ({lobbyPlayers.length})</h2>
            {lobbyPlayers.length === 0 ? (
              <div className="waiting-game">
                <span className="spin">🐺</span>
                <p>{t('lobby.waiting')}</p>
              </div>
            ) : (
              <div className="player-list">
                {lobbyPlayers.map((p, i) => (
                  <div key={i} className={`player-chip ${p.name === playerName ? 'is-me' : ''}`}>
                    <span className="player-number">{i + 1}</span>
                    {p.name} {p.name === playerName ? `(${t('game.you')})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Probabilities */}
          {roleConfig && (
            <div className="card">
              <h2>🎲 {t('lobby.roleProbability')}</h2>
              <div className="role-probability-list">
                {getRoleProbabilities().map(({ role: roleName, count, emoji, percent }) => (
                  <div key={roleName} className="role-prob-row">
                    <div className="role-prob-info">
                      <span className="role-emoji">{emoji}</span>
                      <span className="role-name">{t(`roles.${roleName}`)}</span>
                      <span className="role-count">x{count}</span>
                    </div>
                    <div className="role-prob-bar-container">
                      <div className="role-prob-bar">
                        <div
                          className={`role-prob-bar-fill ${roleName === 'werewolf' ? 'danger' : 'safe'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="role-prob-percent">{percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!roleConfig && (
            <div className="card">
              <div className="waiting-game">
                <span className="spin">🐺</span>
                <p>{t('lobby.waitingModerator')}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

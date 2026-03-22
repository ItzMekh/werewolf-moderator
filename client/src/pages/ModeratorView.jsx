import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import socket from '../socket.js';

const ROLE_EMOJIS = {
  werewolf: '🐺',
  seer: '👁️',
  doctor: '💊',
  bodyguard: '🛡️',
  villager: '👤'
};

const NIGHT_TURN_LABELS = {
  werewolf: 'night.werewolfTurn',
  bodyguard: 'night.bodyguardTurn',
  doctor: 'night.doctorTurn',
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

  useEffect(() => {
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
    });

    return () => {
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
    };
  }, []);

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

  const endGame = () => {
    socket.emit('end-game', { roomCode }, (response) => {
      if (response.success) {
        navigate('/');
      }
    });
  };

  const dismissResult = () => {
    setShowResult(false);
    setNightResult(null);
    setDayResult(null);
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

          <button className="btn btn-primary btn-lg" onClick={endGame}>
            {t('gameOver.backToLobby')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page moderator-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      {/* Header */}
      <div className="mod-header">
        <div className="phase-badge">
          {gamePhase === 'night' ? '🌙' : gamePhase === 'roleReveal' ? '🎭' : '☀️'}
          <span>
            {gamePhase === 'night' ? t('game.night') :
             gamePhase === 'roleReveal' ? t('roleReveal.title') :
             t('game.day')}
          </span>
        </div>
        <div className="round-badge">{t('game.round')} {round}</div>
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
                ) : nightResult.savedBy ? (
                  <div className="save-announce">
                    <span className="heart">💊</span>
                    <p>{t('result.saved')}</p>
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

      {/* Players Grid */}
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

      {/* End Game Button */}
      <button className="btn btn-danger" onClick={endGame}>
        {t('moderator.endGame')}
      </button>
    </div>
  );
}

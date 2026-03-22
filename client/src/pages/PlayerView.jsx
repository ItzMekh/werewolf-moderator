import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import socket from '../socket.js';

export default function PlayerView() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();

  const playerName = sessionStorage.getItem('playerName');

  const [role, setRole] = useState(null);
  const [roleEmoji, setRoleEmoji] = useState('');
  const [team, setTeam] = useState('');
  const [gamePhase, setGamePhase] = useState('waiting');
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
  const [showRole, setShowRole] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [voteCount, setVoteCount] = useState({ voted: 0, total: 0 });
  const [bodyguardError, setBodyguardError] = useState('');

  useEffect(() => {
    if (!playerName) {
      navigate('/join');
      return;
    }

    socket.on('role-assigned', (data) => {
      setRole(data.role);
      setRoleEmoji(data.emoji);
      setTeam(data.team);
      setShowRole(true);
    });

    socket.on('werewolf-teammates', (data) => {
      setWerewolfTeammates(data.teammates);
    });

    socket.on('game-started', (data) => {
      setGamePhase(data.phase);
      setRound(data.round);
      setPlayers(data.players);
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
      setBodyguardError('');

      // Check if this player died
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

    socket.on('game-ended', () => {
      navigate('/');
    });

    socket.on('room-closed', () => {
      navigate('/');
    });

    return () => {
      socket.off('role-assigned');
      socket.off('werewolf-teammates');
      socket.off('game-started');
      socket.off('werewolf-vote-update');
      socket.off('seer-result');
      socket.off('night-result');
      socket.off('day-result');
      socket.off('vote-count-update');
      socket.off('game-over');
      socket.off('game-ended');
      socket.off('room-closed');
    };
  }, [playerName, navigate]);

  const submitNightAction = () => {
    if (!selectedTarget) return;

    let action;
    switch (role) {
      case 'werewolf': action = 'werewolf-kill'; break;
      case 'seer': action = 'seer-check'; break;
      case 'doctor': action = 'doctor-save'; break;
      case 'bodyguard': action = 'bodyguard-protect'; break;
      default: return;
    }

    socket.emit('night-action', { roomCode, action, target: selectedTarget }, (response) => {
      if (response.success) {
        setActionSubmitted(true);
        if (role === 'werewolf') {
          setWerewolfVotes(prev => ({ ...prev, [playerName]: selectedTarget }));
        }
      } else {
        if (response.error.includes('Cannot protect the same person')) {
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
      case 'doctor': return t('night.doctorAction');
      case 'bodyguard': return t('night.bodyguardAction');
      default: return t('night.villagerWait');
    }
  };

  const getSelectablePlayers = () => {
    if (!role) return [];
    const alivePlayers = players.filter(p => p.alive);

    switch (role) {
      case 'werewolf':
        // Can't target other werewolves
        return alivePlayers.filter(p =>
          p.name !== playerName && !werewolfTeammates.includes(p.name)
        );
      case 'seer':
        return alivePlayers.filter(p => p.name !== playerName);
      case 'doctor':
        return alivePlayers; // Can save self
      case 'bodyguard':
        return alivePlayers.filter(p => p.name !== playerName); // Can't protect self
      default:
        return [];
    }
  };

  const dismissResult = () => {
    setShowResult(false);
    setNightResult(null);
    setDayResult(null);
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
        </div>
      </div>
    );
  }

  return (
    <div className="page player-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      {/* Role Card (tap to show/hide) */}
      {role && (
        <div className={`role-card ${showRole ? 'revealed' : ''}`} onClick={() => setShowRole(!showRole)}>
          <div className="role-card-inner">
            <div className="role-card-front">
              <span>🂠</span>
              <p>{t('game.yourRole')}</p>
            </div>
            <div className="role-card-back">
              <span className="role-big-emoji">{roleEmoji}</span>
              <h2>{t(`roles.${role}`)}</h2>
              <span className={`team-label ${team}`}>
                {team === 'werewolf' ? '🐺 Werewolf Team' : '🏘️ Village Team'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Player Info Bar */}
      <div className="player-info-bar">
        <span className="player-name-badge">👤 {playerName}</span>
        <div className="phase-badge">
          {gamePhase === 'night' ? '🌙' : gamePhase === 'day' ? '☀️' : '⏳'}
          <span>
            {gamePhase === 'night' ? t('game.night') :
             gamePhase === 'day' ? t('game.day') : '...'}
          </span>
        </div>
        {round > 0 && <span className="round-badge">{t('game.round')} {round}</span>}
        <span className={`alive-badge ${alive ? 'alive' : 'dead'}`}>
          {alive ? '❤️' : '💀'}
        </span>
      </div>

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
      {!alive && gamePhase !== 'finished' && (
        <div className="card dead-card">
          <span className="skull-big">💀</span>
          <p>{t('game.dead')}</p>
        </div>
      )}

      {/* Night Phase - Action UI */}
      {gamePhase === 'night' && alive && (
        <div className="card action-card">
          <h2>🌙 {getActionText()}</h2>

          {role === 'villager' ? (
            <div className="villager-wait">
              <span>😴</span>
              <p>{t('night.villagerWait')}</p>
            </div>
          ) : actionSubmitted ? (
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
            <>
              {/* Werewolf teammates info */}
              {role === 'werewolf' && werewolfTeammates.length > 0 && (
                <div className="teammates-info">
                  <p>🐺 {werewolfTeammates.join(', ')}</p>
                </div>
              )}

              {/* Werewolf vote tracking */}
              {role === 'werewolf' && Object.keys(werewolfVotes).length > 0 && (
                <div className="wolf-votes">
                  {Object.entries(werewolfVotes).map(([voter, target]) => (
                    <div key={voter} className="wolf-vote-item">
                      <span>🐺 {voter}</span> → <span>{target}</span>
                    </div>
                  ))}
                </div>
              )}

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
                    {p.name}
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

      {/* Day Phase - Vote UI */}
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

      {/* Waiting state */}
      {gamePhase === 'waiting' && (
        <div className="card">
          <div className="waiting-game">
            <span className="spin">🐺</span>
            <p>{t('lobby.waiting')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

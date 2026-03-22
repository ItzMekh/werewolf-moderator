import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import socket from '../socket.js';

const ROLE_EMOJIS = {
  werewolf: '🐺',
  seer: '👁️',
  bodyguard: '🛡️',
  villager: '👤'
};

export default function CreateRoom() {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();
  const [roomCode, setRoomCode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [roleConfig, setRoleConfig] = useState({
    werewolf: 2,
    seer: 1,
    bodyguard: 1,
    villager: 4
  });
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Create room on mount
    const timeout = setTimeout(() => {
      setError(t('create.connectionError') || 'Cannot connect to server. Please go back and try again.');
    }, 10000);

    socket.emit('create-room', (response) => {
      clearTimeout(timeout);
      if (response.success) {
        setRoomCode(response.roomCode);
        // Send initial role config so players joining immediately see it
        socket.emit('update-role-config', { roomCode: response.roomCode, roleConfig });
      }
    });

    socket.on('player-joined', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    socket.on('player-left', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off('player-joined');
      socket.off('player-left');
    };
  }, []);

  const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0);

  const updateRole = (role, delta) => {
    setRoleConfig(prev => {
      const updated = {
        ...prev,
        [role]: Math.max(role === 'werewolf' ? 1 : 0, prev[role] + delta)
      };
      // Broadcast to players in room
      if (roomCode) {
        socket.emit('update-role-config', { roomCode, roleConfig: updated });
      }
      return updated;
    });
  };

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startGame = () => {
    setError('');
    if (players.length < 4) {
      setError(t('lobby.minPlayers'));
      return;
    }
    if (totalRoles !== players.length) {
      setError(`Role count (${totalRoles}) must match player count (${players.length})`);
      return;
    }

    socket.emit('start-game', { roomCode, roleConfig }, (response) => {
      if (response.success) {
        navigate(`/moderator/${roomCode}`);
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="page create-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      <button className="btn-back" onClick={() => navigate('/')}>
        ← {t('create.back')}
      </button>

      <h1>{t('create.title')}</h1>

      {roomCode ? (
        <>
          {/* Room Code Display */}
          <div className="room-code-display">
            <span className="label">{t('lobby.roomCode')}</span>
            <div className="code-row">
              <span className="code">{roomCode}</span>
              <button className="btn-copy" onClick={copyCode}>
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>

          {/* Players List */}
          <div className="card">
            <h2>{t('lobby.players')} ({players.length})</h2>
            {players.length === 0 ? (
              <p className="waiting-text">{t('lobby.waiting')}</p>
            ) : (
              <div className="player-list">
                {players.map((p, i) => (
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
                {t('lobby.total')}: {totalRoles} / {players.length} {t('lobby.players').toLowerCase()}
              </div>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn btn-primary btn-lg btn-start"
            onClick={startGame}
            disabled={players.length < 4 || totalRoles !== players.length}
          >
            🎮 {t('lobby.startGame')}
          </button>
        </>
      ) : (
        <p>{t('create.creating')}</p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import socket from '../socket.js';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;

    setJoining(true);
    setError('');

    socket.emit('join-room', {
      roomCode: roomCode.trim(),
      playerName: playerName.trim()
    }, (response) => {
      setJoining(false);
      if (response.success) {
        // Store player name for later use
        sessionStorage.setItem('playerName', playerName.trim());
        sessionStorage.setItem('roomCode', roomCode.trim());
        navigate(`/play/${roomCode.trim()}`);
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="page join-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      <button className="btn-back" onClick={() => navigate('/')}>
        ← {t('join.back')}
      </button>

      <h1>{t('join.title')}</h1>

      <form className="card join-form" onSubmit={handleJoin}>
        <div className="form-group">
          <label>{t('join.roomCode')}</label>
          <input
            type="text"
            className="input"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            maxLength={4}
            inputMode="numeric"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>{t('join.playerName')}</label>
          <input
            type="text"
            className="input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
            placeholder={lang === 'th' ? 'ใส่ชื่อของคุณ' : 'Enter your name'}
            maxLength={20}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!roomCode.trim() || !playerName.trim() || joining}
        >
          {joining ? t('join.joining') : `🎯 ${t('join.join')}`}
        </button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import { reconnectSocket } from '../socket.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function Login() {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const res = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem('werewolf-token', data.token);
      localStorage.setItem('werewolf-user', JSON.stringify(data.player));

      // Reconnect socket with new token
      reconnectSocket();

      navigate('/');
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <div className="page login-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      <button className="btn-back" onClick={() => navigate('/')}>
        ← {t('create.back')}
      </button>

      <div className="hero" style={{ padding: '40px 0 30px' }}>
        <div className="wolf-icon" style={{ fontSize: '3.5rem' }}>🐺</div>
        <h1>{isRegister ? t('auth.register') : t('auth.login')}</h1>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('auth.username')}</label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 20))}
            placeholder={t('auth.usernamePlaceholder')}
            maxLength={20}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>{t('auth.password')}</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!username.trim() || !password.trim() || loading}
        >
          {loading
            ? '...'
            : isRegister ? t('auth.register') : t('auth.login')}
        </button>

        <button
          type="button"
          className="btn-switch-auth"
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
        >
          {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}
        </button>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';
import { reconnectSocket } from '../socket.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const ROLE_EMOJIS = {
  werewolf: '🐺',
  seer: '👁️',
  doctor: '💊',
  bodyguard: '🛡️',
  villager: '👤'
};

export default function Profile() {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('werewolf-user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('werewolf-token');
        const res = await fetch(`${SERVER_URL}/api/me/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data);
      } catch {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('werewolf-token');
    localStorage.removeItem('werewolf-user');
    reconnectSocket();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="page profile-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      <button className="btn-back" onClick={() => navigate('/')}>
        ← {t('create.back')}
      </button>

      <div className="profile-header">
        <div className="avatar">👤</div>
        <h1>{user.username}</h1>
      </div>

      {loading ? (
        <div className="card"><p className="waiting-text">Loading...</p></div>
      ) : error ? (
        <div className="error-msg">{error}</div>
      ) : stats ? (
        <>
          {/* Overall Stats */}
          <div className="card">
            <h2>{t('stats.overview')}</h2>
            <div className="stats-overview">
              <div className="stat-box">
                <span className="stat-number">{stats.totalGames}</span>
                <span className="stat-label">{t('stats.totalGames')}</span>
              </div>
              <div className="stat-box win">
                <span className="stat-number">{stats.totalWins}</span>
                <span className="stat-label">{t('stats.wins')}</span>
              </div>
              <div className="stat-box lose">
                <span className="stat-number">{stats.totalLosses}</span>
                <span className="stat-label">{t('stats.losses')}</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{stats.winRate}%</span>
                <span className="stat-label">{t('stats.winRate')}</span>
              </div>
            </div>
          </div>

          {/* Per-Role Stats */}
          <div className="card">
            <h2>{t('stats.byRole')}</h2>
            {Object.keys(stats.roles).length === 0 ? (
              <p className="waiting-text">{t('stats.noGames')}</p>
            ) : (
              <div className="role-stats-list">
                {Object.entries(stats.roles).map(([role, data]) => (
                  <div key={role} className="role-stat-row">
                    <div className="role-stat-info">
                      <span className="role-emoji">{ROLE_EMOJIS[role] || '👤'}</span>
                      <span className="role-name">{t(`roles.${role}`)}</span>
                    </div>
                    <div className="role-stat-numbers">
                      <span className="played">{data.played} {t('stats.played')}</span>
                      <span className="wins">{data.wins}W</span>
                      <span className="losses">{data.losses}L</span>
                      <div className="win-bar">
                        <div
                          className="win-bar-fill"
                          style={{ width: `${data.played > 0 ? (data.wins / data.played) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      <button className="btn btn-danger" onClick={handleLogout} style={{ marginTop: 16 }}>
        {t('auth.logout')}
      </button>
    </div>
  );
}

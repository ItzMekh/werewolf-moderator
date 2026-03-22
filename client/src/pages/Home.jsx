import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/index.jsx';

export default function Home() {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLanguage();

  const user = JSON.parse(localStorage.getItem('werewolf-user') || 'null');

  return (
    <div className="page home-page">
      <button className="lang-toggle" onClick={toggleLang}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>

      {/* Auth Bar */}
      <div className="auth-bar">
        {user ? (
          <button className="btn-auth" onClick={() => navigate('/profile')}>
            👤 {user.username}
          </button>
        ) : (
          <button className="btn-auth" onClick={() => navigate('/login')}>
            {t('auth.login')}
          </button>
        )}
      </div>

      <div className="hero">
        <div className="wolf-icon">🐺</div>
        <h1>{t('app.title')}</h1>
        <p className="subtitle">{t('app.subtitle')}</p>
      </div>

      <div className="home-buttons">
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')}>
          <span className="btn-icon">🎮</span>
          <div>
            <div className="btn-title">{t('home.createRoom')}</div>
            <div className="btn-desc">{t('home.createDesc')}</div>
          </div>
        </button>

        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/join')}>
          <span className="btn-icon">🎯</span>
          <div>
            <div className="btn-title">{t('home.joinRoom')}</div>
            <div className="btn-desc">{t('home.joinDesc')}</div>
          </div>
        </button>
      </div>

      {!user && (
        <p className="login-hint">{t('auth.loginHint')}</p>
      )}
    </div>
  );
}

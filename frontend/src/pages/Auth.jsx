import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import PasswordStrength from '../components/PasswordStrength';


const ease = [0.25, 0.46, 0.45, 0.94];


const IconEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconGithub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);


function Field({ icon, id, type = 'text', rightElement, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        border: '1px solid',
        borderColor: focused ? 'rgba(142,156,120,0.45)' : 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '0 14px',
        height: 48,
        background: 'rgba(255,255,255,0.02)',
        boxShadow: focused ? '0 0 0 3px rgba(142,156,120,0.08)' : 'none',
        transition: 'border-color .2s ease, box-shadow .2s ease',
      }}
    >
      <span style={{ display: 'flex', color: focused ? '#8E9C78' : '#666', transition: 'color .2s' }}>
        {icon}
      </span>
      <input
        id={id}
        type={type}
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontSize: 14,
          color: '#ececec',
          fontFamily: 'inherit',
          fontWeight: 450,
          letterSpacing: '-0.01em',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {rightElement}
    </div>
  );
}


const translations = {
  pt: {
    loginHead: "Entrar no",
    registerHead: "Criar conta no",
    loginSub: "Acesse sua conta para continuar.",
    registerSub: "É rápido e gratuito.",
    nameLabel: "Nome",
    namePlaceholder: "Seu nome",
    nameObj: "Digite seu nome",
    emailLabel: "E-mail",
    emailPlaceholder: "voce@email.com",
    passLabel: "Senha",
    passPlaceholder: "Sua senha",
    errOAuth: "Não foi possível entrar com o GitHub.",
    errAuth: "E-mail ou senha incorretos.",
    btnLoading: "Entrando…",
    btnLogin: "Entrar",
    btnRegister: "Criar conta",
    divider: "ou",
    githubBtn: "Continuar com GitHub",
    noAccount: "Não tem conta?",
    hasAccount: "Já tem conta?",
    btnSwToReg: "Criar agora",
    btnSwToLog: "Entrar",
  },
  en: {
    loginHead: "Sign in to",
    registerHead: "Create your account on",
    loginSub: "Access your account to continue.",
    registerSub: "Quick and free.",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    nameObj: "Name is required",
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    passLabel: "Password",
    passPlaceholder: "Your password",
    errOAuth: "Could not sign in with GitHub.",
    errAuth: "Wrong email or password.",
    btnLoading: "Loading…",
    btnLogin: "Sign in",
    btnRegister: "Create account",
    divider: "or",
    githubBtn: "Continue with GitHub",
    noAccount: "No account?",
    hasAccount: "Already have an account?",
    btnSwToReg: "Sign up",
    btnSwToLog: "Sign in",
  },
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'pt');
  const t = translations[lang] || translations.pt;

  useEffect(() => {
    if (user) navigate('/dashboard');
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError(t.errOAuth);
      window.history.replaceState({}, '', '/auth');
    }
  }, [user, navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) { setLoading(false); return setError(t.nameObj); }
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t.errAuth);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin(v => !v); setError(''); setName(''); };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes auth-spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4d4d4d; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px #0c0c0e inset !important;
          -webkit-text-fill-color: #ececec !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .auth-eye-btn:hover { color: #aaa !important; }
        .auth-github:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.14) !important; }
        .auth-switch:hover { color: #b1be9d !important; }
        .auth-back:hover { color: #ddd !important; background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.12) !important; }
      `}</style>

      <div style={s.bgGradient} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        style={s.card}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          className="auth-back"
          style={s.backBtn}
          aria-label={lang === 'pt' ? 'Voltar' : 'Back'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>{lang === 'pt' ? 'Voltar' : 'Back'}</span>
        </button>

        <div style={s.logoSection}>
          <img src="/devsboard2.png" alt="DevsBoard" style={s.logoImg} />
          <h1 style={s.brandTitle}>
            {isLogin ? t.loginHead : t.registerHead}{' '}
            <span style={s.brandAccent}>DevsBoard</span>
          </h1>
          <p style={s.brandSub}>{isLogin ? t.loginSub : t.registerSub}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={s.form}>
          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingBottom: 10 }}>
                  <Field
                    icon={<IconUser />}
                    id="f-name"
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            icon={<IconEmail />}
            id="f-email"
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Field
            icon={<IconLock />}
            id="f-password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t.passPlaceholder}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="auth-eye-btn"
                style={s.eyeBtn}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            }
          />

          {!isLogin && <PasswordStrength password={password} />}

          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={s.error}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading && (
              <span style={s.spinner} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </span>
            )}
            {loading ? t.btnLoading : isLogin ? t.btnLogin : t.btnRegister}
          </button>
        </form>

        <div style={s.divider}>
          <div style={s.divLine} />
          <span style={s.divText}>{t.divider}</span>
          <div style={s.divLine} />
        </div>

        <a
          href={`${import.meta.env.VITE_API_URL}/auth/github`}
          className="auth-github"
          style={s.btnGithub}
        >
          <IconGithub />
          <span>{t.githubBtn}</span>
        </a>

        <p style={s.switchRow}>
          {isLogin ? t.noAccount : t.hasAccount}{' '}
          <button type="button" onClick={switchMode} className="auth-switch" style={s.switchBtn}>
            {isLogin ? t.btnSwToReg : t.btnSwToLog}
          </button>
        </p>

        <div style={s.langRow}>
          <div style={s.langToggle} role="tablist" aria-label="Idioma">
            {['pt', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                role="tab"
                aria-selected={lang === code}
                onClick={() => { setLang(code); localStorage.setItem('lang', code); }}
                style={s.langOption}
              >
                {lang === code && (
                  <motion.span
                    layoutId="auth-lang-pill"
                    style={s.langPill}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span style={{ ...s.langLabel, color: lang === code ? '#ececec' : '#666' }}>
                  {code.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#070708',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    WebkitFontSmoothing: 'antialiased',
    position: 'relative',
    overflow: 'hidden',
  },

  bgGradient: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(142,156,120,0.07) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 400,
    background: 'rgba(14, 14, 16, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '36px 32px 28px',
  },

  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 28,
    gap: 12,
  },
  logoImg: {
    width: 44,
    height: 44,
    objectFit: 'contain',
    borderRadius: 11,
    padding: 5,
    background: '#fff',
  },
  brandTitle: {
    color: '#f0f0f0',
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
    margin: 0,
    marginTop: 4,
  },
  brandAccent: {
    color: '#8E9C78',
    fontWeight: 700,
  },
  brandSub: {
    color: '#777',
    fontSize: 13,
    margin: 0,
    lineHeight: 1.5,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
  },

  eyeBtn: {
    background: 'none',
    border: 'none',
    padding: 4,
    cursor: 'pointer',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color .2s',
  },

  btnPrimary: {
    width: '100%',
    height: 48,
    background: '#8E9C78',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    fontFamily: 'inherit',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity .2s, background .2s',
  },
  spinner: {
    display: 'inline-flex',
    animation: 'auth-spin 0.8s linear infinite',
  },

  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#ef4444',
    fontSize: 12.5,
    fontWeight: 500,
    background: 'rgba(239,68,68,0.07)',
    borderRadius: 10,
    padding: '9px 12px',
    border: '1px solid rgba(239,68,68,0.15)',
    marginTop: 2,
  },

  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  divLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.06)',
  },
  divText: {
    fontSize: 11,
    color: '#555',
    fontWeight: 500,
    letterSpacing: '0.06em',
  },

  btnGithub: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    width: '100%',
    height: 46,
    background: 'rgba(255,255,255,0.02)',
    color: '#d4d4d4',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    fontSize: 13.5,
    fontWeight: 500,
    textDecoration: 'none',
    fontFamily: 'inherit',
    marginBottom: 18,
    transition: 'background .2s, border-color .2s',
  },

  switchRow: {
    textAlign: 'center',
    fontSize: 13,
    color: '#777',
    margin: 0,
    lineHeight: 1.5,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#8E9C78',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'color .2s',
  },

  langRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  langToggle: {
    display: 'inline-flex',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  langOption: {
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: '5px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  langPill: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 999,
    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
  },
  langLabel: {
    position: 'relative',
    zIndex: 1,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    transition: 'color .2s',
  },

  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#999',
    padding: '6px 11px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
    transition: 'color .2s, background .2s, border-color .2s',
  },
};

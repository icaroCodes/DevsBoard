import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import PasswordStrength from '../components/PasswordStrength';


const fadeUp = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const itemVariant = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};


const IconEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconGithub = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function StarfieldDots() {
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const setupCanvas = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      generateDots();
    };

    const generateDots = () => {

      const area = w * h;
      const count = Math.min(Math.floor(area / 4000), 300);
      const dots = [];
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.2 + 0.4,
          baseAlpha: Math.random() * 0.35 + 0.08,
          twinkleSpeed: Math.random() * 0.008 + 0.002,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
      dotsRef.current = dots;
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    let time = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 1;

      dotsRef.current.forEach((d) => {

        const twinkle = Math.sin(time * d.twinkleSpeed + d.twinkleOffset);
        const alpha = d.baseAlpha + twinkle * 0.08;
        if (alpha <= 0) return;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 210, ${alpha})`;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', setupCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

function Field({ icon, id, label, rightElement, ...props }) {
  const [focused, setFocused] = useState(false);
  const hasValue = props.value && props.value.length > 0;

  return (
    <motion.div variants={itemVariant} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="auth-field-row" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1px solid',
        borderColor: focused ? 'rgba(142,156,120,0.5)' : 'rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '0 16px',
        height: 52,
        background: focused ? 'rgba(142,156,120,0.04)' : 'rgba(255,255,255,0.025)',
        boxShadow: focused
          ? '0 0 0 3px rgba(142,156,120,0.1), 0 4px 20px rgba(142,156,120,0.06)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          color: focused ? '#8E9C78' : hasValue ? '#888' : '#555',
          transition: 'color 0.3s ease',
        }}>
          {icon}
        </span>
        <input
          id={id}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 14.5,
            color: '#ececec',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 450,
            width: '100%',
            letterSpacing: '-0.01em',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {rightElement}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const translations = {
  pt: {
    backHome: "Voltar para o início",
    welcomeTitle: "Bem-vindo ao",
    createTitle: "Crie sua conta no",
    welcomeDesc: "Por favor, escolha uma das opções abaixo para continuar.",
    createDesc: "Preencha os campos abaixo para começar sua jornada.",
    back: "Voltar",
    loginHead: "Bem-vindo ao",
    registerHead: "Crie sua conta no",
    loginSub: "Por favor, escolha uma das opções abaixo para continuar.",
    registerSub: "Preencha os campos abaixo para começar sua jornada.",
    nameLabel: "Nome",
    namePlaceholder: "Seu nome completo",
    nameObj: "Por favor, digite seu nome",
    emailLabel: "E-mail",
    emailPlaceholder: "seu@email.com",
    passLabel: "Senha",
    passPlaceholder: "Sua senha secreta",
    errOAuth: "Não conseguimos entrar com o GitHub. Tente novamente.",
    errAuth: "E-mail ou senha incorretos",
    btnLoading: "Entrando…",
    btnLogin: "Acessar minha conta",
    btnRegister: "Criar minha conta",
    divider: "OU CONTINUE COM",
    githubBtn: "Continuar com GitHub",
    noAccount: "Ainda não tem conta? ",
    hasAccount: "Já tem uma conta? ",
    btnSwToReg: "Criar uma agora",
    btnSwToLog: "Fazer login",
  },
  en: {
    backHome: "Back to Home",
    welcomeTitle: "Welcome to",
    createTitle: "Create your",
    welcomeDesc: "Please choose one of the options below to continue.",
    createDesc: "Fill in the fields below to start your journey.",
    back: "Back",
    loginHead: "Welcome to",
    registerHead: "Create your account on",
    loginSub: "Please choose one of the options below to continue.",
    registerSub: "Fill in the fields below to start your journey.",
    nameLabel: "Name",
    namePlaceholder: "Your full name",
    nameObj: "Name is required",
    emailLabel: "Email",
    emailPlaceholder: "your@email.com",
    passLabel: "Password",
    passPlaceholder: "••••••••",
    errOAuth: "GitHub authentication error. Try again.",
    errAuth: "Authentication error",
    btnLoading: "Loading…",
    btnLogin: "Sign In",
    btnRegister: "Create Account",
    divider: "OR CONTINUE WITH",
    githubBtn: "Continue with GitHub",
    noAccount: "Don't have an account? ",
    hasAccount: "Already have an account? ",
    btnSwToReg: "Sign up",
    btnSwToLog: "Log in",
  }
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

  const [lang, setLang] = useState('pt');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const t = translations[lang] || translations['pt'];

  useEffect(() => {
    if (user) navigate('/dashboard');
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
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
      {/* Inline styles for autofill + mobile */}
      <style>{`
        input::placeholder { color: #555 !important; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #0c0c0e inset !important;
          -webkit-text-fill-color: #ececec !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        /* Shimmer keyframe for CTA button */
        @keyframes auth-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        /* Pulse glow for the accent ring */
        @keyframes auth-glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        /* Media Queries Removed - Same size everywhere */
      `}</style>

      {/* Background */}
      <StarfieldDots />

      {/* Subtle radial glow behind card */}
      <div style={s.radialGlow} />

      {/* Noise overlay */}
      <div style={s.noise} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={s.card}
        id="auth-card-new"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'register'}
            {...fadeUp}
            style={s.cardInner}
          >

            { }
            <motion.div
              id="auth-logo-section"
              style={s.logoSection}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div style={s.logoGlow}>
                <img
                  src="/devsboard2.png"
                  alt="DevsBoard"
                  id="auth-logo-img"
                  style={s.logoImg}
                />
              </div>
              <div style={s.brandText}>
                <span id="auth-brand-title" style={s.brandTitle}>
                  {isLogin ? t.loginHead : t.registerHead}{' '}
                  <span id="auth-brand-name" style={s.brandAccent}>DevsBoard</span>
                </span>
              </div>
              <p style={s.brandSub}>
                {isLogin ? t.loginSub : t.registerSub}
              </p>
            </motion.div>

            { }
            <motion.form
              id="auth-form"
              onSubmit={handleSubmit}
              noValidate
              style={s.form}
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              { }
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <Field
                      icon={<IconUser />}
                      id="f-name"
                      label={t.nameLabel}
                      type="text"
                      placeholder={t.namePlaceholder}
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field
                icon={<IconEmail />}
                id="f-email"
                label={t.emailLabel}
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <Field
                icon={<IconLock />}
                id="f-password"
                label={t.passLabel}
                type={showPassword ? "text" : "password"}
                placeholder={t.passPlaceholder}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={s.eyeBtn}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showPassword ? 'eye-off' : 'eye'}
                        initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
                        transition={{ duration: 0.15 }}
                        style={{ display: 'flex' }}
                      >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                }
              />

              { }
              <AnimatePresence>
                {!isLogin && <PasswordStrength password={password} />}
              </AnimatePresence>

              { }
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={s.errorWrap}
                  >
                    <div style={s.error}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              { }
              <motion.button
                variants={itemVariant}
                type="submit"
                id="btn-submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={s.btnPrimary}
              >
                <span style={s.btnShimmer} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={loading ? 'loading' : isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {loading && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'flex' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      </motion.span>
                    )}
                    {loading ? t.btnLoading : isLogin ? t.btnLogin : t.btnRegister}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.form>

            { }
            <motion.div
              id="auth-divider"
              style={s.divider}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <div style={s.divLine} />
              <span style={s.divText}>{t.divider}</span>
              <div style={s.divLine} />
            </motion.div>

            { }
            <motion.a
              href={`${import.meta.env.VITE_API_URL || '/api'}/auth/github`}
              id="btn-github"
              style={s.btnGithub}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.97 }}
            >
              <IconGithub />
              <span>{t.githubBtn}</span>
            </motion.a>

            { }
            <motion.p
              style={s.switchRow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              {isLogin ? t.noAccount : t.hasAccount}
              <button type="button" id="btn-switch" onClick={switchMode} style={s.switchBtn}>
                {isLogin ? t.btnSwToReg : t.btnSwToLog}
              </button>
            </motion.p>

          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#060608',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    WebkitFontSmoothing: 'antialiased',
    position: 'relative',
    overflow: 'hidden',
  },

  radialGlow: {
    position: 'fixed',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 700,
    height: 700,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(142,156,120,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  noise: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
    opacity: 0.04,
    zIndex: 1,
    mixBlendMode: 'overlay',
  },

  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: 440,
    background: 'rgba(12, 12, 14, 0.85)',
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: `
      0 0 0 1px rgba(255,255,255,0.03),
      0 24px 80px rgba(0,0,0,0.5),
      0 4px 20px rgba(0,0,0,0.3),
      0 0 120px rgba(142,156,120,0.03)
    `,
    padding: '40px 36px 36px',
    overflow: 'hidden',
  },

  cardInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },

  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 32,
    gap: 14,
  },
  logoGlow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 52,
    height: 52,
    objectFit: 'contain',
    borderRadius: 14,
    padding: 6,
    background: 'rgba(255,255,255,0.95)',
    boxShadow: '0 8px 32px rgba(142,156,120,0.2), 0 0 0 1px rgba(142,156,120,0.1)',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#f0f0f0',
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.4px',
    lineHeight: 1.3,
  },
  brandAccent: {
    color: '#8E9C78',
    fontWeight: 800,
  },
  brandSub: {
    color: '#777',
    fontSize: 13.5,
    margin: 0,
    lineHeight: 1.5,
    maxWidth: 300,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },

  eyeBtn: {
    background: 'none',
    border: 'none',
    padding: 6,
    cursor: 'pointer',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    transition: 'color 0.2s, background 0.2s',
  },

  btnPrimary: {
    width: '100%',
    height: 52,
    background: 'linear-gradient(135deg, #8E9C78 0%, #6B7A5A 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 14,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    fontFamily: '"Inter", sans-serif',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(142,156,120,0.2), 0 1px 3px rgba(0,0,0,0.2)',
    transition: 'box-shadow 0.3s ease',
  },
  btnShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
    animation: 'auth-shimmer 3s ease-in-out infinite',
    zIndex: 1,
  },

  errorWrap: {
    overflow: 'hidden',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#ef4444',
    fontSize: 12.5,
    fontWeight: 500,
    background: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    padding: '10px 14px',
    border: '1px solid rgba(239,68,68,0.15)',
  },

  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  divLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.06)',
  },
  divText: {
    fontSize: 11,
    color: '#555',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    letterSpacing: '0.08em',
  },

  btnGithub: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 50,
    background: 'rgba(255,255,255,0.03)',
    color: '#d4d4d4',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    fontSize: 14.5,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: '"Inter", sans-serif',
    marginBottom: 20,
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  switchRow: {
    textAlign: 'center',
    fontSize: 13.5,
    color: '#666',
    margin: 0,
    lineHeight: 1.5,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#8E9C78',
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    fontFamily: '"Inter", sans-serif',
    transition: 'color 0.2s',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(142,156,120,0.3)',
    textUnderlineOffset: 3,
  },
};
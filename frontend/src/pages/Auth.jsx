import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import PasswordStrength from '../components/PasswordStrength';

/* ─── Animation Variants ─────────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariant = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const panelVariant = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Icons ─────────────────────────────────────────────────────── */
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconGithub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── Input Component ────────────────────────────────────────────── */
function Field({ icon, id, label, rightElement, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div variants={itemVariant} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        ...s.field,
        borderColor: focused ? 'rgba(72,92,17,0.55)' : 'rgba(0,0,0,0.09)',
        background: focused ? '#fff' : '#f5f5f3',
        boxShadow: focused ? '0 0 0 3px rgba(72,92,17,0.10)' : 'none',
      }}>
        <span style={{ ...s.fieldIcon, color: focused ? 'rgb(72 92 17)' : '#aaa' }}>{icon}</span>
        <input
          id={id}
          style={s.fieldInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement && (
          <div style={s.fieldRight}>
            {rightElement}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithToken, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const err = params.get('error');
    if (err) { setError('Erro ao autenticar com GitHub. Tente novamente.'); window.history.replaceState({}, '', '/auth'); return; }
    if (token) {
      loginWithToken(token, {
        id: params.get('id'),
        name: params.get('name'),
        email: params.get('email'),
        avatar_url: params.get('avatar_url')
      });
      refreshUser(); // Garante que temos todos os dados frescos
      navigate('/dashboard');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) { await login(email, password); }
      else { if (!name.trim()) return setError('Nome é obrigatório'); await register(name, email, password); }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin(v => !v); setError(''); setName(''); };

  return (
    <div style={s.page}>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={s.card}
      >

        {/* ══ LEFT PANEL ══════════════════════════════════════════ */}
        <motion.div variants={panelVariant} initial="initial" animate="animate" style={s.left}>

          {/* Noise texture overlay */}
          <div style={s.noise} />

          {/* Back */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Link to="/" style={s.back}>
              <IconArrow />
              <span>Voltar para Home</span>
            </Link>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
            style={s.logoWrap}
          >
            <img src="/devsboard2.png" alt="DevsBoard" style={s.logoImg} />
            <span style={s.logoLabel}>DevsBoard</span>
          </motion.div>

          {/* Copy */}
          <motion.div
            style={s.leftCopy}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.h1 variants={itemVariant} style={s.leftH1}>
              {isLogin ? 'Bem vindo\nde volta.' : 'Crie sua\nconta.'}
            </motion.h1>
            <motion.p variants={itemVariant} style={s.leftP}>
              {isLogin
                ? 'Continue organizando seus projetos, finanças e tarefas em um único lugar.'
                : 'Comece agora a organizar tudo em um único lugar, de forma simples e eficaz.'}
            </motion.p>
          </motion.div>

          {/* Bottom dots */}
          <div style={s.dots}>
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                style={{ ...s.dot, ...(i === 0 ? s.dotActive : {}) }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
              />
            ))}
          </div>
        </motion.div>

        {/* ══ RIGHT PANEL ═════════════════════════════════════════ */}
        <div style={s.right}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              {...fadeUp}
              style={s.formArea}
            >

              {/* Header */}
              <motion.div variants={stagger} initial="initial" animate="animate" style={s.formHeader}>
                <motion.h2 variants={itemVariant} style={s.formTitle}>
                  {isLogin ? 'Faça seu login' : 'Crie sua conta'}
                </motion.h2>
                <motion.p variants={itemVariant} style={s.formSub}>
                  {isLogin ? 'Entre com seus dados para continuar' : 'Preencha seus dados para começar'}
                </motion.p>
              </motion.div>

              {/* Form */}
              <motion.form
                onSubmit={handleSubmit}
                noValidate
                style={s.form}
                variants={stagger}
                initial="initial"
                animate="animate"
              >
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Field
                        icon={<IconUser />} id="f-name" label="Nome"
                        type="text" placeholder="Seu nome completo"
                        value={name} onChange={e => setName(e.target.value)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field
                  icon={<IconEmail />} id="f-email" label="E-mail"
                  type="email" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
                <Field
                  icon={<IconLock />} id="f-password" label="Senha"
                  type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
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

                <AnimatePresence>
                  {!isLogin && (
                    <PasswordStrength password={password} />
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={s.error}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  variants={itemVariant}
                  type="submit"
                  id="btn-submit"
                  disabled={loading}
                  whileHover={{ scale: 1.015, opacity: 0.93 }}
                  whileTap={{ scale: 0.97 }}
                  style={s.btnPrimary}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={loading ? 'loading' : isLogin ? 'login' : 'register'}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      {loading ? 'Carregando…' : isLogin ? 'Entrar na Plataforma' : 'Criar minha conta'}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </motion.form>

              {/* Divider */}
              <motion.div
                style={s.divider}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              >
                <div style={s.divLine} />
                <span style={s.divText}>ou continue com</span>
                <div style={s.divLine} />
              </motion.div>

              {/* GitHub */}
              <motion.a
                href="http://localhost:3001/auth/github"
                id="btn-github"
                style={s.btnGithub}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                whileHover={{ scale: 1.015, background: '#222' }}
                whileTap={{ scale: 0.97 }}
              >
                <IconGithub />
                <span>Continue with GitHub</span>
              </motion.a>

              {/* Switch */}
              <motion.p
                style={s.switchRow}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              >
                {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                <button type="button" id="btn-switch" onClick={switchMode} style={s.switchBtn}>
                  {isLogin ? 'Cadastre-se.' : 'Entrar.'}
                </button>
              </motion.p>

            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#edecea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    WebkitFontSmoothing: 'antialiased',
  },

  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 880,
    minHeight: 540,
    borderRadius: 28,
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.13), 0 2px 12px rgba(0,0,0,0.07)',
  },

  /* Left */
  left: {
    flex: '0 0 40%',
    background: 'rgb(72 92 17)',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 36px',
    position: 'relative',
    overflow: 'hidden',
  },
  noise: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
    opacity: 0.04,
    zIndex: 0,
  },

  back: {
    position: 'relative', zIndex: 1,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
    fontSize: 12.5, fontWeight: 500, letterSpacing: '0.01em',
    marginBottom: 32, transition: 'color 0.2s',
  },

  logoWrap: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44,
  },
  logoImg: {
    width: 36, height: 36, objectFit: 'contain',
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    padding: 5,
  },
  logoLabel: {
    color: '#ffffff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px',
  },

  leftCopy: {
    position: 'relative', zIndex: 1, flex: 1,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  leftH1: {
    color: '#ffffff', fontSize: 32, fontWeight: 800,
    lineHeight: 1.15, letterSpacing: '-0.8px',
    margin: '0 0 16px', whiteSpace: 'pre-line',
  },
  leftP: {
    color: 'rgba(255,255,255,0.72)', fontSize: 13.5,
    lineHeight: 1.7, margin: 0, maxWidth: 240,
  },

  dots: {
    position: 'relative', zIndex: 1,
    display: 'flex', gap: 7, marginTop: 36,
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)',
  },
  dotActive: { background: '#ffffff' },

  /* Right */
  right: {
    flex: 1, background: '#fafaf8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '28px 44px',
  },
  formArea: {
    width: '100%', maxWidth: 360,
    display: 'flex', flexDirection: 'column', gap: 0,
  },

  formHeader: { marginBottom: 18 },
  formTitle: {
    fontSize: 22, fontWeight: 800, color: '#111',
    margin: '0 0 5px', letterSpacing: '-0.5px',
  },
  formSub: { fontSize: 13, color: '#888', margin: 0 },

  /* Form */
  form: {
    display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14,
  },
  field: {
    display: 'flex', alignItems: 'center', gap: 10,
    border: '1.5px solid rgba(0,0,0,0.09)', borderRadius: 11,
    padding: '0 14px', height: 44,
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  fieldIcon: {
    display: 'flex', alignItems: 'center', flexShrink: 0,
    transition: 'color 0.2s',
  },
  fieldInput: {
    flex: 1, border: 'none', background: 'transparent', outline: 'none',
    fontSize: 14, color: '#111', fontFamily: 'inherit',
    width: '100%',
  },
  fieldRight: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    padding: 6,
    cursor: 'pointer',
    color: '#aaa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    transition: 'color 0.2s, background 0.2s',
    "&:hover": {
      color: 'rgb(72 92 17)',
      background: 'rgba(72,92,17,0.05)',
    }
  },

  btnPrimary: {
    width: '100%', height: 44,
    background: '#0E363E', color: '#fff',
    border: 'none', borderRadius: 11,
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '-0.1px',
    fontFamily: 'inherit', marginTop: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
  },

  error: {
    color: '#c0392b', fontSize: 12.5,
    background: 'rgba(192,57,43,0.07)',
    borderRadius: 8, padding: '9px 12px',
    margin: '0', textAlign: 'center',
  },

  /* Divider */
  divider: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  divLine: { flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' },
  divText: { fontSize: 11.5, color: '#aaa', fontWeight: 500, whiteSpace: 'nowrap' },

  /* GitHub */
  btnGithub: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', height: 44, background: '#111', color: '#fff',
    borderRadius: 11, fontSize: 14, fontWeight: 600,
    textDecoration: 'none', cursor: 'pointer',
    fontFamily: 'inherit', marginBottom: 16,
    transition: 'background 0.2s',
  },

  switchRow: {
    textAlign: 'center', fontSize: 13, color: '#777', margin: 0,
  },
  switchBtn: {
    background: 'none', border: 'none', padding: 0,
    color: 'rgb(72 92 17)', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};

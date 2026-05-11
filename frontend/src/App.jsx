import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoadingSkeleton from './components/LoadingSkeleton';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Finances from './pages/Finances';
import Routines from './pages/Routines';
import Goals from './pages/Goals';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import ProjectDetail from './pages/ProjectDetail';
import Teams from './pages/Teams';
import Settings from './pages/Settings';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';
import NotFound from './pages/NotFound';
import PublicProfile from './pages/PublicProfile';
import InviteLink from './pages/InviteLink';
import Onboarding from './components/Onboarding';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmModalContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { ThemeProvider } from './contexts/ThemeContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // Render otimisticamente se já temos user hidratado do localStorage —
  // evita ficar travado no skeleton se o /settings estiver lento.
  if (user) {
    // Onboarding gate: usuários sem username não conseguem usar o app
    // até escolherem um (Phase 2). O /settings popula needs_onboarding;
    // até esse fetch responder, deixamos o app renderizar normalmente
    // (cache do localStorage não tem o campo).
    return (
      <>
        <Layout>{children}</Layout>
        {user.needs_onboarding === true && <Onboarding />}
      </>
    );
  }
  if (loading) return <LoadingSkeleton />;
  return <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  // Só redireciona se há token válido (não apenas user cached).
  // Sem token, sempre renderiza Landing/Auth imediatamente — nunca skeleton.
  const hasToken = !!localStorage.getItem('token');
  if (hasToken || user) return <Navigate to="/dashboard" replace />;
  return children;
}


export default function App() {
  useEffect(() => {
    let originalTitle = document.title;
    let titleInterval;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        originalTitle = document.title;
        let msg = '🚨 Já vai procrastinar? Volta aqui!! 🚨 ';
        titleInterval = setInterval(() => {
          msg = msg.substring(1) + msg.substring(0, 1);
          document.title = msg;
        }, 15);
      } else {
        if (titleInterval) clearInterval(titleInterval);
        document.title = originalTitle;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (titleInterval) clearInterval(titleInterval);
    };
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <AchievementProvider>
                <RealtimeProvider>
                  <Routes>
                    <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/finances" element={<ProtectedRoute><Finances /></ProtectedRoute>} />
                    <Route path="/routines" element={<ProtectedRoute><Routines /></ProtectedRoute>} />
                    <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                    <Route path="/projects/:slug" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                    <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/achievements/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                    <Route path="/invite/:token" element={<InviteLink />} />
                    <Route path="/:atUsername" element={<PublicProfile />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </RealtimeProvider>
              </AchievementProvider>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

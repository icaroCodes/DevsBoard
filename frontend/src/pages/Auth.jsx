import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// This page only exists as an OAuth callback handler.
// It processes ?code= (exchange) and ?error= params, then redirects.
// The actual login UI lives on the Landing page.

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { exchangeOAuthCode, user } = useAuth();
  const [processing, setProcessing] = useState(false);

  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (code && !processing) {
      setProcessing(true);
      handleExchangeCode(code);
    }
  }, [code]);

  const handleExchangeCode = async (code) => {
    try {
      await exchangeOAuthCode(code);
      const pending = sessionStorage.getItem('devsboard:pendingInvite');
      if (pending) {
        sessionStorage.removeItem('devsboard:pendingInvite');
        navigate(`/invite/${pending}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      navigate('/?login_error=auth_failed', { replace: true });
    }
  };

  // If there's an error from OAuth, redirect to landing with error
  if (error) {
    return <Navigate to={`/?login_error=${error}`} replace />;
  }

  // If no code param, just redirect to landing
  if (!code) {
    if (user) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // Show a minimal loading state while exchanging the code
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0A0A',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(255,255,255,0.1)',
          borderTopColor: '#8E9C78',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Autenticando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

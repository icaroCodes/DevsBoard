const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const activeTeam = JSON.parse(localStorage.getItem('activeTeam'));
  if (activeTeam) headers['x-team-id'] = activeTeam.id;

  return headers;
}

/**
 * API Wrapper Seguro e Resiliente
 * Implementa Transparent Token Refresh e Cookies HttpOnly
 */
export async function api(endpoint, options = {}, isRetry = false) {
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Essencial para enviar/receber cookies HttpOnly
    headers: { ...getHeaders(), ...options.headers },
  });

  // 1. Lógica de Refresh de Token Silencioso
  if (res.status === 401 && !isRetry) {
    const errorData = await res.json().catch(() => null);

    // Rotas de autenticação que intencionalmente retornam 401 (credenciais erradas)
    // não devem ser tratadas como "sessão expirada"
    const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
    if (isAuthRoute) {
      const errorMsg = errorData?.error || (errorData?.errors?.[0]?.message) || 'Credenciais inválidas';
      throw new Error(errorMsg);
    }

    if (errorData?.error === 'TOKEN_EXPIRED') {
      try {
        const refreshReq = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
        });

        if (refreshReq.ok) {
          const resJson = await refreshReq.json();
          if (resJson.token) {
            localStorage.setItem('token', resJson.token);
            localStorage.setItem('refreshToken', resJson.refreshToken);
          }
          return api(endpoint, options, true);
        }

        // Refresh request chegou ao servidor mas falhou (refresh token inválido/expirado)
        // → deslogar
      } catch (networkErr) {
        // Erro de REDE no refresh (ECONNRESET, ECONNREFUSED durante restart)
        // Não deslogar — é transitório. Lançar erro genérico.
        console.warn('[Refresh network error — keeping session]', networkErr.message);
        throw new Error('Erro de conexão. Tente novamente.');
      }
    }

    // 401 explícito sem TOKEN_EXPIRED, ou refresh token inválido → deslogar
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('activeTeam');
    if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
      window.location.href = '/auth';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  // Intercept 202 com change request (Fluxo de Aprovação de Membros)
  if (res.status === 202 && data?.is_change_request) {
    const err = new Error('CHANGE_REQUEST:' + (data.message || 'Pedido enviado.'));
    err.isChangeRequest = true;
    err.changeRequestData = data;
    throw err;
  }

  if (!res.ok) {
    const errorMsg = data?.error || (data?.errors && (data.errors[0]?.message || data.errors[0]?.msg)) || 'Erro na requisição';
    throw new Error(errorMsg);
  }

  // Sinaliza mutação bem-sucedida para o sistema de conquistas
  const method = (options?.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !endpoint.includes('/achievements')) {
    window.dispatchEvent(new CustomEvent('devsboard:mutation'));
  }

  return data;
}

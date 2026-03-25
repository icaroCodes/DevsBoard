const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  
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
    
    if (errorData?.error === 'TOKEN_EXPIRED') {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });

        if (refreshRes.ok) {
          return api(endpoint, options, true); // Tenta novamente com o novo token setado no cookie
        }
      } catch (err) {
        console.error('[Refresh Failed]', err);
      }
    }

    // Se falhar no refresh ou não for erro de expiração, limpa e desloga
    localStorage.removeItem('user');
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

  return data;
}

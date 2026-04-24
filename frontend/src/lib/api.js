const API_URL = import.meta.env.VITE_API_URL || '/api';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const activeTeam = JSON.parse(localStorage.getItem('activeTeam'));
  if (activeTeam) headers['x-team-id'] = activeTeam.id;

  return headers;
}


export async function api(endpoint, options = {}, isRetry = false) {
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include', 
    headers: { ...getHeaders(), ...options.headers },
  });

  
  if (res.status === 401 && !isRetry) {
    const errorData = await res.json().catch(() => null);

    
    
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

        
        
      } catch (networkErr) {
        
        
        console.warn('[Refresh network error — keeping session]', networkErr.message);
        throw new Error('Erro de conexão. Tente novamente.');
      }
    }

    
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

  
  const method = (options?.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !endpoint.includes('/achievements')) {
    window.dispatchEvent(new CustomEvent('devsboard:mutation'));
  }

  return data;
}

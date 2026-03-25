const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const activeTeam = JSON.parse(localStorage.getItem('activeTeam'));
  if (activeTeam) headers['X-Team-Id'] = activeTeam.id;
  
  return headers;
}

export async function api(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
    throw new Error('Não autorizado');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  // Intercept 202 com change request
  if (res.status === 202 && data?.is_change_request) {
    const err = new Error('CHANGE_REQUEST:' + (data.message || 'Pedido enviado.'));
    err.isChangeRequest = true;
    err.changeRequestData = data;
    throw err;
  }

  if (!res.ok) {
    const errorMsg = data?.error || (data?.errors && data.errors[0]?.msg) || 'Erro na requisição';
    throw new Error(errorMsg);
  }
  return data;
}

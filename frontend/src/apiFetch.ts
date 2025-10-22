// Pequeno helper baseado em fetch para chamar a API do backend
// Determina a base da API em ordem de prioridade:
// 1. REACT_APP_API_URL (arquivo .env ou variável de ambiente)
// 2. Se estiver rodando em localhost:3000 (CRA), usa o backend local em 127.0.0.1:8000
// 3. Caso contrário, usa proxy relativo ('/')
const envBase = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || '';
const devFallback = (window.location.hostname === 'localhost' && window.location.port === '3000') ? 'http://127.0.0.1:8000' : '';
const BASE = envBase || devFallback || '/';

type ReqMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function getToken(): string | null {
    return localStorage.getItem('access');
}

function setToken(token: string | null) {
    if (token) localStorage.setItem('access', token);
    else localStorage.removeItem('access');
}

function clearToken() {
    localStorage.removeItem('access');
}

async function request(path: string, method: ReqMethod = 'GET', body?: any): Promise<Response> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Se BASE for relativo '/', então `${BASE}${cleanPath}` resulta em '/api/...' (usa proxy do CRA)
    // Caso contrário usamos a URL completa
    const url = BASE === '/' ? cleanPath : `${BASE}${cleanPath}`;
    return fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
}

async function login(email: string, password: string) {
    return request('/api/login/', 'POST', { email, password });
}

async function register(data: any) {
    return request('/api/register/', 'POST', data);
}

export default { request, login, register, getToken, setToken, clearToken };

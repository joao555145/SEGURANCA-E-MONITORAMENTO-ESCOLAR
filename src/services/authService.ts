import type { SessionUser } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
const AUTH_TIMEOUT_MS = 15_000;

type ApiErrorPayload = { error?: { message?: unknown } };
type LoginPayload = {
  token?: unknown;
  expiresAt?: unknown;
  user?: {
    id?: unknown;
    username?: unknown;
    name?: unknown;
    email?: unknown;
    role?: unknown;
  };
};

export class AuthApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

export async function loginWithJazzSecurity(login: string, password: string): Promise<SessionUser> {
  if (!API_BASE_URL) {
    throw new AuthApiError('O endereço da API JazzSecurity não foi configurado. Defina VITE_API_BASE_URL.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: login.trim(), password }),
      signal: controller.signal,
    });

    let body: unknown;
    try {
      body = await response.json() as unknown;
    } catch {
      throw new AuthApiError('A API de autenticação retornou uma resposta inválida.', response.status);
    }

    if (!response.ok) {
      const payload = body as ApiErrorPayload;
      const message = typeof payload?.error?.message === 'string'
        ? payload.error.message
        : response.status === 401
          ? 'Usuário ou senha incorretos.'
          : 'Não foi possível validar as credenciais. Tente novamente.';
      throw new AuthApiError(message, response.status);
    }

    const payload = body as LoginPayload;
    const user = payload.user;
    if (
      typeof payload.token !== 'string' ||
      !payload.token ||
      typeof payload.expiresAt !== 'string' ||
      !Number.isFinite(Date.parse(payload.expiresAt)) ||
      !user ||
      typeof user.id !== 'number' ||
      (user.id !== 1 && user.id !== 2) ||
      typeof user.username !== 'string' ||
      typeof user.name !== 'string' ||
      typeof user.email !== 'string' ||
      user.role !== 'admin' ||
      Date.parse(payload.expiresAt) <= Date.now()
    ) {
      throw new AuthApiError('A API não retornou uma sessão administrativa válida.');
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: 'admin',
      accessToken: payload.token,
      expiresAt: payload.expiresAt,
    };
  } catch (error) {
    if (error instanceof AuthApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AuthApiError('A autenticação excedeu o limite de 15 segundos.');
    }
    throw new AuthApiError('Não foi possível conectar ao JazzSecurity. Confira a URL, o HTTPS/CORS e se a API está ativa.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

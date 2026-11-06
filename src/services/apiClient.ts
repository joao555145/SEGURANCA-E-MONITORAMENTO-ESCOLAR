const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 8_000;

export class ApiRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

export async function requestJson(path: '/leituras' | '/eventos' | '/sensores', accessToken: string): Promise<unknown> {
  if (!API_BASE_URL) {
    throw new ApiRequestError('VITE_API_BASE_URL não está configurada.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: 'application/json', Authorization: 'Bearer ' + accessToken };

    const response = await fetch(API_BASE_URL + path, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiRequestError(
        'A API retornou HTTP ' + response.status + ' ao consultar ' + path + '.',
        response.status,
      );
    }

    try {
      return await response.json() as unknown;
    } catch {
      throw new ApiRequestError('A API retornou JSON inválido em ' + path + '.');
    }
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiRequestError('A consulta ' + path + ' excedeu o tempo limite de 8 segundos.');
    }

    throw new ApiRequestError(
      'Não foi possível alcançar a API em ' + path + '. Confira a URL, o CORS e a disponibilidade do servidor.',
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

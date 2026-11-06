import type { ChatMessage } from '../types';
import { askAssistant as askMockAssistant } from './mockApi';

const API_BASE_URL = (
  import.meta.env.VITE_UMBRELLA_API_BASE_URL ??
  import.meta.env.VITE_UMBRELLIA_API_BASE_URL ??
  ''
).trim().replace(/\/+$/, '');
const CHAT_TIMEOUT_MS = 120_000;
const OWNER_STORAGE_KEY = 'new-security.umbrella.owner.v1';

type ApiRecord = Record<string, unknown>;

export interface UmbrellaChatSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string | null;
}

export interface UmbrellaChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface UmbrellaChatDetail extends UmbrellaChatSummary {
  messages: UmbrellaChatMessage[];
}

export class UmbrellAApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'UmbrellAApiError';
    this.status = status;
  }
}

export function isAdanStellaApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

function ownerId(): string {
  const key = OWNER_STORAGE_KEY;
  let value = localStorage.getItem(key);
  if (!value) {
    value = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : 'new-security-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem(key, value);
  }
  return value;
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function responseMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  }
  return fallback;
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new UmbrellAApiError('Defina VITE_UMBRELLA_API_BASE_URL com a origem alcançável do Adan-Stella.');
  }
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const response = await fetch(API_BASE_URL + '/api/umbrella' + path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Umbrella-Owner': ownerId(),
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
    let body: unknown = null;
    try { body = await response.json() as unknown; } catch { /* handled below */ }
    if (!response.ok) {
      throw new UmbrellAApiError(
        responseMessage(body, 'A API da UmbrellA respondeu com HTTP ' + response.status + '.'),
        response.status,
      );
    }
    return body as T;
  } catch (error) {
    if (error instanceof UmbrellAApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UmbrellAApiError('A UmbrellA excedeu o limite de 120 segundos para responder.');
    }
    throw new UmbrellAApiError(
      'Não foi possível alcançar o Adan-Stella. Verifique a URL, o HTTPS, o CORS e se a API está acessível a partir deste dispositivo.',
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function listUmbrellaChats(): Promise<UmbrellaChatSummary[]> {
  if (!isAdanStellaApiConfigured()) return [];
  const result = await requestJson<{ chats?: UmbrellaChatSummary[] }>('/chats', { method: 'GET' });
  return result.chats ?? [];
}

export function createUmbrellaChat(title = 'Nova conversa'): Promise<UmbrellaChatDetail> {
  return requestJson<UmbrellaChatDetail>('/chats', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function getUmbrellaChat(chatId: string): Promise<UmbrellaChatDetail> {
  return requestJson<UmbrellaChatDetail>('/chats/' + encodeURIComponent(chatId), { method: 'GET' });
}

export function deleteUmbrellaChat(chatId: string): Promise<{ deleted: boolean }> {
  return requestJson<{ deleted: boolean }>('/chats/' + encodeURIComponent(chatId), { method: 'DELETE' });
}

export async function askUmbrellA(
  question: string,
  history: ChatMessage[],
  conversationId?: string,
): Promise<ChatMessage> {
  if (!isAdanStellaApiConfigured()) return askMockAssistant(question);
  if (!conversationId) {
    throw new UmbrellAApiError('Crie ou selecione uma conversa antes de enviar a mensagem.');
  }

  const response = await requestJson<{ reply?: string }>('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: question,
      maxNewTokens: 160,
      conversationId,
      // O histórico persistente é carregado pelo Adan-Stella. Mantemos o campo
      // apenas para compatibilidade com clientes que ainda enviam contexto curto.
      history: history.slice(-4).map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  if (typeof response.reply !== 'string') {
    throw new UmbrellAApiError('O Adan-Stella retornou um formato de resposta inesperado.');
  }
  return {
    id: 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    role: 'assistant',
    content: response.reply.trim() || 'Não recebi conteúdo na resposta da UmbrellA.',
    createdAt: new Date().toISOString(),
  };
}

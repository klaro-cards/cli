import type { AuthToken, Story, CreateStoryInput, ListStoriesOptions } from './types.js';
import { trace } from './trace.js';
import { getProject } from './config.js';

const AUTH_API_URL = 'https://api.klaro.cards/v1';

export class KlaroApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'KlaroApiError';
  }
}

function buildHeaders(token?: string): Record<string, string> {
  const projectSubdomain = getProject() || 'app';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Klaro-Project-Subdomain': projectSubdomain,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string | undefined> {
  return {
    ...headers,
    Authorization: headers.Authorization ? '***' : undefined,
  };
}

async function doFetch<T>(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown,
  sanitizeBody?: (body: unknown) => unknown
): Promise<T> {
  const traceBody = sanitizeBody ? sanitizeBody(body) : body;
  trace('Request', { method, url, headers: sanitizeHeaders(headers), body: traceBody });

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `API error: ${response.status} ${response.statusText}`;
    let errorBody: unknown;
    try {
      errorBody = await response.json();
      const err = errorBody as { message?: string; error?: string };
      message = err.message || err.error || message;
    } catch {
      // Use default message
    }
    trace('Response Error', { status: response.status, body: errorBody });
    throw new KlaroApiError(response.status, message);
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  const result = text ? JSON.parse(text) as T : undefined as T;
  trace('Response', { status: response.status, body: result });
  return result;
}

export class KlaroApi {
  private baseUrl: string;
  private token?: string;

  constructor(subdomain: string, token?: string) {
    this.baseUrl = `https://${subdomain}.klaro.cards/api/v1`;
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = buildHeaders(this.token);
    return doFetch<T>(method, url, headers, body);
  }

  async login(email: string, password: string): Promise<AuthToken> {
    const subdomain = getProject() || 'app';
    const url = `${AUTH_API_URL}/auth/tokens/`;
    const body = {
      grant_type: subdomain == 'app' ? 'auto_login' : 'client_credentials',
      client_id: email,
      client_secret: password,
    };
    const headers = buildHeaders();

    const result = await doFetch<AuthToken>(
      'POST',
      url,
      headers,
      body,
      (b) => ({ ...(b as object), client_secret: '***' })
    );

    // Re-trace with sanitized token for security
    trace('Response (sanitized)', { access_token: '***', token_type: result.token_type, expires_in: result.expires_in });
    return result;
  }

  async getMe(): Promise<{ email: string; nickname?: string }> {
    const url = `${AUTH_API_URL}/auth/me`;
    const headers = buildHeaders(this.token);
    return doFetch<{ email: string; nickname?: string }>('GET', url, headers);
  }

  async logout(): Promise<void> {
    const url = `${AUTH_API_URL}/auth/tokens/self`;
    const headers = buildHeaders(this.token);
    await doFetch<void>('DELETE', url, headers);
  }

  async listStories(boardId: string, options?: ListStoriesOptions): Promise<Story[]> {
    const params = new URLSearchParams();
    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }
    const queryString = params.toString();
    const path = `/boards/${boardId}/stories${queryString ? `?${queryString}` : ''}`;
    return this.request<Story[]>('GET', path);
  }

  async createStory(boardId: string, input: CreateStoryInput): Promise<Story> {
    return this.request<Story>('POST', `/boards/${boardId}/stories`, input);
  }
}

export function createClient(subdomain: string, token?: string): KlaroApi {
  return new KlaroApi(subdomain, token);
}

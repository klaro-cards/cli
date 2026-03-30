import type { AuthToken, Story, CreateStoryInput, ListStoriesOptions, UpdateStoryInput, Project, Board, Dimension, CreateAttachmentInput, StoryAttachment, SeshatUploadResult } from './types.js';
import type { Connector } from './connector.js';
import { trace } from './trace.js';
import { getProject, getApiUrl } from './config.js';

export type { Connector } from './connector.js';

const DEFAULT_API_URL = 'https://api.klaro.cards';

export function projectBaseUrl(apiUrl: string, subdomain: string): string {
  const url = new URL(apiUrl);
  const hostParts = url.hostname.split('.');
  hostParts[0] = subdomain;
  return `${url.protocol}//${hostParts.join('.')}`;
}

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

export function buildHeaders(subdomain: string, token?: string, accept?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': accept || 'application/json',
    'X-Klaro-Project-Subdomain': subdomain,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export function sanitizeHeaders(headers: Record<string, string>): Record<string, string | undefined> {
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

export class KlaroApi implements Connector {
  private subdomain: string;
  private apiUrl: string;
  private baseUrl: string;
  private token?: string;

  constructor(subdomain: string, token?: string, apiUrl: string = DEFAULT_API_URL) {
    this.subdomain = subdomain;
    this.apiUrl = apiUrl;
    this.baseUrl = `${projectBaseUrl(apiUrl, subdomain)}/api/v1`;
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: unknown, accept?: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = buildHeaders(this.subdomain, this.token, accept);
    return doFetch<T>(method, url, headers, body);
  }

  async login(email: string, password: string): Promise<AuthToken> {
    const subdomain = getProject() || 'app';
    const url = `${this.apiUrl}/v1/auth/tokens/`;
    const body = {
      grant_type: subdomain == 'app' ? 'auto_login' : 'client_credentials',
      client_id: email,
      client_secret: password,
    };
    const headers = buildHeaders(subdomain);

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
    const url = `${this.apiUrl}/v1/auth/me`;
    const headers = buildHeaders(this.subdomain, this.token);
    return doFetch<{ email: string; nickname?: string }>('GET', url, headers);
  }

  async logout(): Promise<void> {
    const url = `${this.apiUrl}/v1/auth/tokens/self`;
    const headers = buildHeaders(this.subdomain, this.token);
    await doFetch<void>('DELETE', url, headers);
  }

  async listStories(boardId: string, options?: ListStoriesOptions): Promise<Story[]> {
    const params = new URLSearchParams();
    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }
    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        params.set(key, value);
      }
    }
    const queryString = params.toString();
    const path = `/boards/${boardId}/stories${queryString ? `?${queryString}` : ''}`;
    return this.request<Story[]>('GET', path);
  }

  async getStories(boardId: string, identifiers: number[]): Promise<Story[]> {
    const params = new URLSearchParams();
    for (const id of identifiers) {
      params.append('identifier[]', id.toString());
    }
    const path = `/boards/${boardId}/stories?${params.toString()}`;
    return this.request<Story[]>('GET', path, undefined, 'application/vnd+klaro.stories.medium+json');
  }

  async createStory(boardId: string, input: CreateStoryInput): Promise<Story> {
    return this.request<Story>('POST', `/boards/${boardId}/stories`, input);
  }

  async deleteStories(boardId: string, identifiers: number[]): Promise<void> {
    const body = { stories: identifiers.map(identifier => ({ identifier })) };
    await this.request<void>('DELETE', `/boards/${boardId}/stories`, body);
  }

  async updateStories(boardId: string, updates: UpdateStoryInput[]): Promise<Story[]> {
    const body = { patch: updates };
    return this.request<Story[]>('PATCH', `/boards/${boardId}/stories`, body);
  }

  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>('GET', '/my/projects/');
  }

  async listBoards(): Promise<Board[]> {
    return this.request<Board[]>('GET', '/my/boards/');
  }

  async getBoard(boardId: string): Promise<Board> {
    return this.request<Board>('GET', `/boards/${boardId}`);
  }

  async listDimensions(): Promise<Dimension[]> {
    return this.request<Dimension[]>('GET', '/dimensions/');
  }

  async uploadFile(fileBuffer: Buffer, filename: string): Promise<string> {
    const url = `${projectBaseUrl(this.apiUrl, this.subdomain)}/s/`;
    const form = new FormData();
    form.append(filename, new Blob([new Uint8Array(fileBuffer)]), filename);

    const headers: Record<string, string> = {
      'X-Klaro-Project-Subdomain': this.subdomain,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    trace('Request', { method: 'POST', url, headers: sanitizeHeaders(headers), body: `<file: ${filename}>` });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      trace('Response Error', { status: response.status, body: text });
      throw new KlaroApiError(response.status, `Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as SeshatUploadResult[];
    trace('Response', { status: response.status, body: result });

    const uploaded = result[0];
    const originalName = uploaded.originalname || uploaded.name;
    return `/s/${uploaded.name}?n=${encodeURIComponent(originalName)}`;
  }

  async createAttachment(storyId: string, input: CreateAttachmentInput): Promise<StoryAttachment> {
    return this.request<StoryAttachment>('POST', `/stories/${storyId}/attachments/`, input);
  }

  async listAttachments(storyId: string): Promise<StoryAttachment[]> {
    return this.request<StoryAttachment[]>('GET', `/stories/${storyId}/attachments/`);
  }

  async deleteAttachment(storyId: string, attachmentId: string): Promise<void> {
    await this.request<void>('DELETE', `/stories/${storyId}/attachments/${attachmentId}`);
  }

  async deleteSeshatFile(url: string): Promise<void> {
    const seshatUrl = `${projectBaseUrl(this.apiUrl, this.subdomain)}${url}`;
    const headers = buildHeaders(this.subdomain, this.token);
    await doFetch<void>('DELETE', seshatUrl, headers);
  }
}

export function createClient(subdomain: string, token?: string): Connector {
  return new KlaroApi(subdomain, token, getApiUrl());
}

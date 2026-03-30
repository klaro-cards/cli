import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KlaroApi, KlaroApiError, createClient, sanitizeHeaders, buildHeaders, projectBaseUrl } from '../src/lib/api.js';

vi.mock('../src/lib/config.js', () => ({
  getProject: vi.fn(() => undefined),
  getApiUrl: vi.fn(() => 'https://api.klaro.cards'),
}));

function mockResponse(ok: boolean, data: unknown, status = 200, statusText = 'OK') {
  const body = JSON.stringify(data);
  return {
    ok,
    status,
    statusText,
    json: async () => data,
    text: async () => body,
  };
}

describe('api', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('KlaroApi', () => {
    describe('login', () => {
      it('should successfully login and return token', async () => {
        mockFetch.mockResolvedValueOnce(
          mockResponse(true, { token_type: 'Bearer', access_token: 'test-token', expires_in: 432000 })
        );

        const api = new KlaroApi('test');
        const result = await api.login('user@example.com', 'password123');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.klaro.cards/v1/auth/tokens/',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'X-Klaro-Project-Subdomain': 'app',
            }),
            body: JSON.stringify({
              grant_type: 'auto_login',
              client_id: 'user@example.com',
              client_secret: 'password123',
            }),
          })
        );
        expect(result).toEqual({ token_type: 'Bearer', access_token: 'test-token', expires_in: 432000 });
      });

      it('should throw KlaroApiError on login failure', async () => {
        mockFetch.mockResolvedValue(
          mockResponse(false, { message: 'Invalid credentials' }, 401, 'Unauthorized')
        );

        const api = new KlaroApi('test');

        await expect(api.login('user@example.com', 'wrong')).rejects.toThrow(KlaroApiError);
        await expect(api.login('user@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
      });
    });

    describe('listStories', () => {
      it('should list stories from a board', async () => {
        const stories = [
          { id: 1, identifier: 'CARD-1', title: 'First card' },
          { id: 2, identifier: 'CARD-2', title: 'Second card' },
        ];
        mockFetch.mockResolvedValueOnce(mockResponse(true, stories));

        const api = new KlaroApi('myproject', 'token123');
        const result = await api.listStories('backlog');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://myproject.klaro.cards/api/v1/boards/backlog/stories',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer token123',
            }),
          })
        );
        expect(result).toEqual(stories);
      });

      it('should include limit parameter when specified', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(true, []));

        const api = new KlaroApi('myproject', 'token123');
        await api.listStories('backlog', { limit: 10 });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://myproject.klaro.cards/api/v1/boards/backlog/stories?limit=10',
          expect.any(Object)
        );
      });
    });

    describe('createStory', () => {
      it('should create a story', async () => {
        const newStory = { id: 1, identifier: 'CARD-1', title: 'New card' };
        mockFetch.mockResolvedValueOnce(mockResponse(true, newStory));

        const api = new KlaroApi('myproject', 'token123');
        const result = await api.createStory('backlog', {
          title: 'New card',
          progress: 'todo',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://myproject.klaro.cards/api/v1/boards/backlog/stories',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ title: 'New card', progress: 'todo' }),
          })
        );
        expect(result).toEqual(newStory);
      });
    });

    describe('deleteStories', () => {
      it('should delete a single story', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          statusText: 'No Content',
          json: async () => undefined,
          text: async () => '',
        });

        const api = new KlaroApi('myproject', 'token123');
        await api.deleteStories('backlog', [12]);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://myproject.klaro.cards/api/v1/boards/backlog/stories',
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({ stories: [{ identifier: 12 }] }),
          })
        );
      });

      it('should delete multiple stories', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          statusText: 'No Content',
          json: async () => undefined,
          text: async () => '',
        });

        const api = new KlaroApi('myproject', 'token123');
        await api.deleteStories('backlog', [12, 89, 187]);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://myproject.klaro.cards/api/v1/boards/backlog/stories',
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({
              stories: [
                { identifier: 12 },
                { identifier: 89 },
                { identifier: 187 },
              ],
            }),
          })
        );
      });
    });

    describe('error handling', () => {
      it('should handle API errors with message in response', async () => {
        mockFetch.mockResolvedValueOnce(
          mockResponse(false, { message: 'Board not found' }, 404, 'Not Found')
        );

        const api = new KlaroApi('myproject', 'token123');

        await expect(api.listStories('nonexistent')).rejects.toThrow('Board not found');
      });

      it('should handle API errors without message in response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => { throw new Error('Not JSON'); },
          text: async () => 'Not JSON',
        });

        const api = new KlaroApi('myproject', 'token123');

        await expect(api.listStories('board')).rejects.toThrow('API error: 500 Internal Server Error');
      });
    });
  });

  describe('createClient', () => {
    it('should create a KlaroApi instance', () => {
      const client = createClient('myproject', 'token');
      expect(client).toBeInstanceOf(KlaroApi);
    });
  });
});

describe('buildHeaders', () => {
  it('should build headers with subdomain and no token', () => {
    const headers = buildHeaders('myproject');

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
    expect(headers['X-Klaro-Project-Subdomain']).toBe('myproject');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('should build headers with subdomain and token', () => {
    const headers = buildHeaders('myproject', 'secret-token');

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
    expect(headers['X-Klaro-Project-Subdomain']).toBe('myproject');
    expect(headers['Authorization']).toBe('Bearer secret-token');
  });

  it('should use provided subdomain', () => {
    const headers = buildHeaders('another-project', 'token');

    expect(headers['X-Klaro-Project-Subdomain']).toBe('another-project');
  });
});

describe('sanitizeHeaders', () => {
  it('should mask Authorization header when present', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer secret-token-123',
    };
    const result = sanitizeHeaders(headers);

    expect(result['Content-Type']).toBe('application/json');
    expect(result['Authorization']).toBe('***');
  });

  it('should set Authorization to undefined when not present', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    const result = sanitizeHeaders(headers);

    expect(result['Content-Type']).toBe('application/json');
    expect(result['Accept']).toBe('application/json');
    expect(result['Authorization']).toBeUndefined();
  });

  it('should preserve all other headers', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Custom-Header': 'custom-value',
      'Authorization': 'Bearer token',
    };
    const result = sanitizeHeaders(headers);

    expect(result['Content-Type']).toBe('application/json');
    expect(result['Accept']).toBe('application/json');
    expect(result['X-Custom-Header']).toBe('custom-value');
    expect(result['Authorization']).toBe('***');
  });
});

describe('projectBaseUrl', () => {
  it('should derive project URL from default API URL', () => {
    expect(projectBaseUrl('https://api.klaro.cards', 'myproject'))
      .toBe('https://myproject.klaro.cards');
  });

  it('should work with http scheme', () => {
    expect(projectBaseUrl('http://api.klaro.devel', 'myproject'))
      .toBe('http://myproject.klaro.devel');
  });

  it('should work with staging URLs', () => {
    expect(projectBaseUrl('https://api.staging.klaro.cards', 'myproject'))
      .toBe('https://myproject.staging.klaro.cards');
  });

  it('should work with custom domain', () => {
    expect(projectBaseUrl('https://api.custom.example.com', 'myproject'))
      .toBe('https://myproject.custom.example.com');
  });
});

describe('KlaroApi with custom apiUrl', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should use custom API URL for project requests', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, [])
    );

    const api = new KlaroApi('myproject', 'token', 'http://api.klaro.devel');
    await api.listStories('backlog');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://myproject.klaro.devel/api/v1/boards/backlog/stories',
      expect.any(Object)
    );
  });

  it('should use custom API URL for auth requests', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, { token_type: 'Bearer', access_token: 'tok', expires_in: 432000 })
    );

    const api = new KlaroApi('test', undefined, 'http://api.klaro.devel');
    await api.login('user@example.com', 'pass');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://api.klaro.devel/v1/auth/tokens/',
      expect.any(Object)
    );
  });
});

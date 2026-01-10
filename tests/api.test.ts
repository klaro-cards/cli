import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KlaroApi, KlaroApiError, createClient } from '../src/lib/api.js';

vi.mock('../src/lib/config.js', () => ({
  getProject: vi.fn(() => undefined),
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

import { fetchAPI, adminHeaders } from './client';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── fetchAPI ──────────────────────────────────────────────────────────────────

describe('fetchAPI', () => {
  it('returns parsed JSON on a 200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });
    const result = await fetchAPI<{ data: string }>('/api/test');
    expect(result).toEqual({ data: 'test' });
  });

  it('always sets Content-Type: application/json', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await fetchAPI('/api/test');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('merges caller-provided headers without overwriting Content-Type', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await fetchAPI('/api/test', { headers: { 'x-admin-key': 'secret' } });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-admin-key': 'secret',
        }),
      }),
    );
  });

  it('throws with the server error message on a non-OK response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad Request' }),
    });
    await expect(fetchAPI('/api/test')).rejects.toThrow('Bad Request');
  });

  it('throws "HTTP <status>" when the error body has no message', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });
    await expect(fetchAPI('/api/test')).rejects.toThrow('HTTP 500');
  });

  it('passes through method and body from options', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await fetchAPI('/api/test', { method: 'POST', body: '{"key":"value"}' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ method: 'POST', body: '{"key":"value"}' }),
    );
  });
});

// ── adminHeaders ──────────────────────────────────────────────────────────────

describe('adminHeaders', () => {
  it('returns the x-admin-key header', () => {
    expect(adminHeaders('my-secret-key')).toEqual({ 'x-admin-key': 'my-secret-key' });
  });
});

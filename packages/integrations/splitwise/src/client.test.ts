import { describe, expect, it, vi } from 'vitest';
import { SplitwiseApiError, SplitwiseClient } from './client';

interface FetchCall {
  url: string;
  init: RequestInit;
}

/** Builds a fake `fetch` that returns `body` as JSON with the given status. */
function fakeFetch(body: unknown, status = 200) {
  const calls: FetchCall[] = [];
  const impl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  });
  return { impl, calls };
}

describe('SplitwiseClient', () => {
  it('sends a bearer auth header and the default base url', async () => {
    const { impl, calls } = fakeFetch({
      user: { id: 1, first_name: 'Jane', last_name: 'Doe', email: 'j@d.co' },
    });
    const client = new SplitwiseClient({
      apiKey: 'test-key',
      fetch: impl as unknown as typeof fetch,
    });

    const user = await client.getCurrentUser();

    expect(user.id).toBe(1);
    expect(calls[0].url).toBe(
      'https://secure.splitwise.com/api/v3.0/get_current_user',
    );
    const auth = (calls[0].init.headers as Record<string, string>).Authorization;
    expect(auth).toMatch(/^Bearer /);
    expect(auth).toContain('test-key');
  });

  it('honors a custom base url without a trailing slash', async () => {
    const { impl, calls } = fakeFetch({ groups: [] });
    const client = new SplitwiseClient({
      apiKey: 'k',
      baseUrl: 'https://example.test/api/v3.0/',
      fetch: impl as unknown as typeof fetch,
    });

    await client.getGroups();

    expect(calls[0].url).toBe('https://example.test/api/v3.0/get_groups');
  });

  it('returns groups from get_groups', async () => {
    const { impl } = fakeFetch({
      groups: [
        { id: 7, name: 'Phone bill', members: [{ id: 1 }, { id: 2 }] },
      ],
    });
    const client = new SplitwiseClient({
      apiKey: 'k',
      fetch: impl as unknown as typeof fetch,
    });

    const groups = await client.getGroups();

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ id: 7, name: 'Phone bill' });
    expect(groups[0].members).toHaveLength(2);
  });

  it('defaults to an empty array when get_groups omits groups', async () => {
    const { impl } = fakeFetch({});
    const client = new SplitwiseClient({
      apiKey: 'k',
      fetch: impl as unknown as typeof fetch,
    });

    await expect(client.getGroups()).resolves.toEqual([]);
  });

  it('returns friends from get_friends', async () => {
    const { impl } = fakeFetch({
      friends: [{ id: 3, first_name: 'Bob', last_name: 'Roe', email: 'b@r.co' }],
    });
    const client = new SplitwiseClient({
      apiKey: 'k',
      fetch: impl as unknown as typeof fetch,
    });

    const friends = await client.getFriends();

    expect(friends).toHaveLength(1);
    expect(friends[0]).toMatchObject({ id: 3, first_name: 'Bob' });
  });

  it('throws SplitwiseApiError on a non-OK response', async () => {
    const { impl } = fakeFetch({ error: 'Invalid API request' }, 401);
    const client = new SplitwiseClient({
      apiKey: 'bad',
      fetch: impl as unknown as typeof fetch,
    });

    await expect(client.getCurrentUser()).rejects.toBeInstanceOf(
      SplitwiseApiError,
    );
  });

  it('surfaces validation errors returned with HTTP 200 on create_expense', async () => {
    const { impl } = fakeFetch({
      expenses: [],
      errors: { base: ['Something went wrong'] },
    });
    const client = new SplitwiseClient({
      apiKey: 'k',
      fetch: impl as unknown as typeof fetch,
    });

    await expect(
      client.createExpense({
        cost: '10.00',
        description: 'Test',
        currencyCode: 'USD',
        groupId: 0,
        users: [],
      }),
    ).rejects.toThrow(/Something went wrong/);
  });

  it('posts to delete_expense/{id} and resolves on success', async () => {
    const { impl, calls } = fakeFetch({ success: true, errors: {} });
    const client = new SplitwiseClient({
      apiKey: 'k',
      fetch: impl as unknown as typeof fetch,
    });

    await expect(client.deleteExpense(42)).resolves.toBeUndefined();

    expect(calls[0].url).toBe(
      'https://secure.splitwise.com/api/v3.0/delete_expense/42',
    );
    expect(calls[0].init.method).toBe('POST');
  });

  it('throws SplitwiseApiError when delete_expense reports success: false', async () => {
    const { impl } = fakeFetch({
      success: false,
      errors: { base: ['Invalid API Request: record not found'] },
    });
    const client = new SplitwiseClient({
      apiKey: 'k',
      fetch: impl as unknown as typeof fetch,
    });

    await expect(client.deleteExpense(7)).rejects.toThrow(/record not found/);
  });

  it('rejects a non-positive expense id without calling fetch', async () => {
    const { impl, calls } = fakeFetch({ success: true });
    const client = new SplitwiseClient({
      apiKey: 'k',
      fetch: impl as unknown as typeof fetch,
    });

    await expect(client.deleteExpense(0)).rejects.toThrow(/Invalid Splitwise/);
    expect(calls).toHaveLength(0);
  });
});

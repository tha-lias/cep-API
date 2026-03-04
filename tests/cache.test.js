const { enrichWithCep, buildUserMap } = require('../src/services/enrichment');

describe('cache de CEP', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('não deve chamar ViaCEP repetidamente para o mesmo CEP', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ localidade: 'São Paulo', uf: 'SP' }),
    });

    const posts = [
      { id: 100, title: 'Post A', userId: 1 },
      { id: 99, title: 'Post B', userId: 1 },
    ];
    const users = [{ id: 1, name: 'User 1', email: 'user1@test.com' }];
    const userMap = buildUserMap(users);
    const config = { timeoutMs: 5000, concurrency: 5 };

    const { results, stats } = await enrichWithCep(posts, userMap, config);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(stats.cacheHits).toBe(1);
    expect(results[0].city).toBe('São Paulo');
    expect(results[1].city).toBe('São Paulo');
  });
});

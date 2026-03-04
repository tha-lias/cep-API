const { enrichWithCep, buildUserMap } = require('../src/services/enrichment');

describe('fallback city/state=null quando ViaCEP falha', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('deve retornar city e state como null quando ViaCEP falha', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const posts = [{ id: 1, title: 'Post 1', userId: 1 }];
    const users = [{ id: 1, name: 'User 1', email: 'user1@test.com' }];
    const userMap = buildUserMap(users);
    const config = { timeoutMs: 5000, concurrency: 5 };

    const { results } = await enrichWithCep(posts, userMap, config);

    expect(results[0].city).toBeNull();
    expect(results[0].state).toBeNull();
    expect(results[0].authorName).toBe('User 1');
    expect(results[0].postId).toBe(1);
  });
});

const { withRetry } = require('../src/utils/retry');

describe('withRetry', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('deve retornar o resultado na primeira tentativa se não houver erro', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('deve retentrar em erro transitório e retornar o resultado', async () => {
    const err500 = new Error('Server error');
    err500.status = 500;

    const fn = jest.fn()
      .mockRejectedValueOnce(err500)
      .mockRejectedValueOnce(err500)
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('deve lançar erro se exceder máximo de retentativas', async () => {
    const err500 = new Error('Server error');
    err500.status = 500;

    const fn = jest.fn().mockRejectedValue(err500);

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })
    ).rejects.toThrow('Server error');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('não deve retentar em erro não transitório', async () => {
    const err404 = new Error('Not found');
    err404.status = 404;

    const fn = jest.fn().mockRejectedValue(err404);

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 10 })
    ).rejects.toThrow('Not found');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

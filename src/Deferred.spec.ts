import Deferred from './Deferred';

describe('Deferred', () => {
  it('resolves', async () => {
    const d = new Deferred();
    expect(await d.resolve(123)).toBe(123);
  });

  it('rejects', async () => {
    const d = new Deferred();
    await expect(d.reject(new Error())).rejects.toThrow();
  });
});

import Deferred from '../src/Deferred';

describe('Deferred', () => {
  it('resolves', async () => {
    const d = new Deferred();
    expect(await d.resolve(123)).toBe(123);
  });

  it('rejects', async () => {
    const d = new Deferred();
    expect(await d.reject('123')).toBe('123');
  });
});

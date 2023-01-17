import wrapRequest from './wrapRequest';

describe('wrapRequest', () => {
  const counter = () => {
    let n = 0;
    return (f: (a: any) => void): void => {
      n += 1;
      Promise.resolve().then(() => f(n));
    };
  };
  const result = (value: any, done = false) => ({ value, done });

  it('wraps and is iterable', async () => {
    const w = wrapRequest(counter());
    expect(await w.next()).toEqual(result(1));
    expect(await w.next()).toEqual(result(2));
    expect(w[Symbol.asyncIterator]()).toBe(w);
    expect(await Promise.all([w.next(), w.next()])).toEqual([result(3), result(3)]);
  });

  it('is cancelable', async () => {
    const w = wrapRequest(counter());
    await expect(w.return(123)).resolves.toEqual(result(123, true));
  });

  // TODO rename
  it('is cancelable 2', async () => {
    let a = 0;
    const w = wrapRequest(counter(), () => {
      a += 1;
    });
    w.return();
    expect(a).toBe(1);
    await expect(w.next()).resolves.toEqual({ value: undefined, done: true });
  });

  it('rejects on cancel', async () => {
    const w = wrapRequest(counter(), () => {});
    const r = w.next();
    w.return();
    await expect(r).rejects.toThrow();
  });
});

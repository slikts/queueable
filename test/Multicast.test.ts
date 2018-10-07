import Multicast from '../src/Multicast';

describe('Multicast', () => {
  it('constructs', () => {
    expect(new Multicast()).toBeInstanceOf(Multicast);
  });

  it('pushes one fater pulling', async () => {
    const q = new Multicast<number>();
    const it = q[Symbol.asyncIterator]();
    const z = it.next();
    q.push(1);
    expect((await z).value).toBe(1);
  });

  it('pushes one before pulling', async () => {
    const q = new Multicast<number>();
    const it = q[Symbol.asyncIterator]();
    q.push(1);
    const z = it.next();
    it.next();
    expect((await z).value).toBe(1);
  });

  it('can be closed', async () => {
    const q = new Multicast<number>();
    const it = q[Symbol.asyncIterator]();
    it.return && it.return();
    expect(await it.next()).toEqual({ done: true, value: undefined });
  });

  it('can be pushed and then closed', async () => {
    const q = new Multicast<number>();
    const it = q[Symbol.asyncIterator]();
    q.push(1);
    expect(await it.next()).toEqual({ done: false, value: 1 });
    expect(await (it.return && it.return())).toEqual({ done: true, value: undefined });
    expect(await it.next()).toEqual({ done: true, value: undefined });
  });

  it('can be set up', async () => {
    let c = 0;
    const q = new Multicast<number>();
    q.onStart = () => void (c += 1);
    q[Symbol.asyncIterator]();
    expect(c).toBe(1);
    q[Symbol.asyncIterator]();
    expect(c).toBe(1);
  });

  it('can be torn down', async () => {
    let c = 0;
    const q = new Multicast<number>();
    q.onStart = () => void (c += 1);
    q.onStop = () => void (c -= 1);
    const it = q[Symbol.asyncIterator]();
    expect(c).toBe(1);
    it.return && it.return();
    expect(c).toBe(0);
  });
});

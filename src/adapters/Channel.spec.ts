import Channel from './Channel';

const id = (x: any) => x;
const take = async <A>(a: AsyncIterator<A>, n: number) =>
  (await Promise.all(Array.from(Array(n), () => a.next()))).map(({ value }) => value);

describe('Channel', () => {
  it('constructs', () => {
    expect(new Channel()).toBeInstanceOf(Channel);
  });

  it('can balance pull after push', async () => {
    const c = new Channel<number>();
    const ns = [1, 2, 3];
    ns.forEach((n) => c.push(n));
    const ps = ns.map(() => c.next());
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns);
  });

  it('works with for-await-of', async () => {
    const c = new Channel<number>();
    c.push(1);
    c.push(2);
    c.push(3);
    c.push(undefined!, true);
    const r = [];
    for await (const x of c) {
      r.push(x);
    }
    expect(r).toEqual([1, 2, 3]);
  });

  it('can balance push after pull', async () => {
    const c = new Channel<number>();
    const ns = [1, 2, 3];
    const ps = ns.map(() => c.next());
    ns.forEach((n) => c.push(n));
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns);
  });

  it('can be wrapped', async () => {
    const c = new Channel();
    const ns = [1, 2, 3];
    ns.forEach((n) => c.push(n));
    expect(await take(c.wrap(), 3)).toEqual(ns);
  });

  it('wrapper return calls back', async () => {
    const c = new Channel();
    const ns = [1, 2, 3];
    ns.forEach((n) => c.push(n).catch(id));
    const fn = jest.fn();
    const it = c.wrap(fn);
    it.next().catch(id);
    await (it.return && it.return());
    expect(fn.mock.calls.length).toBe(1);
  });

  it('retrurns closed if pushed when closed', async () => {
    const c = new Channel();
    c.return();
    await expect(c.push(123)).resolves.toEqual({ done: true, value: undefined });
  });

  it('can be closed', async () => {
    const c = new Channel();
    expect(await c.return()).toEqual({ value: undefined, done: true });
    expect(await c.return(123)).toEqual({ value: 123, done: true });
  });

  it(`can't be wrapped if closed`, async () => {
    const c = new Channel();
    c.return();
    expect(() => c.wrap()).toThrow();
  });

  it(`wrapped balancer returns itself`, async () => {
    const c = new Channel().wrap();
    expect(c[Symbol.asyncIterator]()).toBe(c);
  });

  it('wrapper can be closed', async () => {
    const c = new Channel().wrap();
    expect(await c.return()).toEqual({ value: undefined, done: true });
    expect(await c.return(123)).toEqual({ value: 123, done: true });
  });

  it(`resolves unpushed to done`, async () => {
    const c = new Channel();
    const p = c.next();
    c.return();
    await expect(p).resolves.toEqual({ done: true, value: undefined });
  });

  it(`push and pull are symmetrical`, async () => {
    const c = new Channel();
    const p1 = c.next();
    const p2 = c.push(1);
    expect(p1).toBe(p2);
    expect(await p1).toBe(await p2);
  });

  describe('bounds', () => {
    it('sets bounds', async () => {
      const c = new Channel(1);
      c.push(1);
      c.push(2);
      await expect(c.next()).resolves.toMatchObject({ value: 2 });
    });

    it('is unbounded by default', async () => {
      const c = new Channel();
      c.push(1);
      c.push(2);
      await expect(c.next()).resolves.toMatchObject({ value: 1 });
    });
  });
});

describe('CSP', () => {
  const Delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const makeLog = <A>() => {
    const logged: A[] = [];
    const log = (x: A) => void logged.push(x);
    return { logged, log };
  };

  interface Ball {
    hits: number;
  }

  it('supports the ping-pong example', async () => {
    const { logged, log } = makeLog();
    const player = async (name: string, table: Channel<Ball>) => {
      for await (const ball of table) {
        ball.hits += 1;
        log(`${name} ${ball.hits}`);
        await Delay(100);
        await table.push(ball);
      }
      log(`${name}: table's gone`);
    };

    const table = new Channel<Ball>();

    const players = Promise.all([player('ping', table), player('pong', table)]);

    await table.push({ hits: 0 });
    await Delay(300);
    await table.return();
    await players;
    expect(logged).toEqual([
      'ping 1',
      'pong 2',
      'ping 3',
      "pong: table's gone",
      "ping: table's gone",
    ]);
  });
});

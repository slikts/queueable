import Channel from '../src/adapters/Channel';

const id = (x: any) => x;
const take = async <A>(a: AsyncIterator<A>, n: number) =>
  (await Promise.all(Array.from(Array(n), (_, i) => a.next()))).map(({ value }) => value);

describe('Channel', () => {
  it('constructs', () => {
    expect(new Channel()).toBeInstanceOf(Channel);
  });

  it('can balance pull after push', async () => {
    const b = new Channel<number>();
    const ns = [1, 2, 3];
    ns.forEach(n => b.push(n));
    const ps = ns.map(() => b.next());
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns);
  });

  it('works with for-await-of', async () => {
    const b = new Channel<number>();
    b.push(1);
    b.push(2);
    b.push(3);
    b.push(undefined!, true);
    const r = [];
    for await (const x of b) {
      r.push(x);
    }
    expect(r).toEqual([1, 2, 3]);
  });

  it('can balance push after pull', async () => {
    const b = new Channel<number>();
    const ns = [1, 2, 3];
    const ps = ns.map(() => b.next());
    ns.forEach(n => b.push(n));
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns);
  });

  it('can be wrapped', async () => {
    const b = new Channel();
    const ns = [1, 2, 3];
    ns.forEach(n => b.push(n));
    expect(await take(b.wrap(), 3)).toEqual(ns);
  });

  it('wrapper return calls back', async () => {
    const b = new Channel();
    const ns = [1, 2, 3];
    ns.forEach(n => b.push(n).catch(id));
    let a = 0;
    const it = b.wrap(() => {
      a = 1;
    });
    it.next().catch(id);
    await (it.return && it.return());
    expect(a).toBe(1);
  });

  it('retrurns closed if pushed when closed', () => {
    const b = new Channel();
    b.return();
    expect(b.push(123)).resolves.toEqual({ done: true, value: undefined });
  });

  it('can be closed', async () => {
    const b = new Channel();
    expect(await b.return()).toEqual({ value: undefined, done: true });
    expect(await b.return(123)).toEqual({ value: 123, done: true });
  });

  it(`can't be wrapped if closed`, async () => {
    const b = new Channel();
    b.return();
    expect(() => b.wrap()).toThrow();
  });

  it(`wrapped balancer returns itself`, async () => {
    const b = new Channel().wrap();
    expect(b[Symbol.asyncIterator]()).toBe(b);
  });

  it(`resolves unpushed to done`, async () => {
    const b = new Channel();
    const p = b.next();
    b.return();
    await expect(p).resolves.toEqual({ done: true, value: undefined });
  });

  it(`push and pull are symmetrical`, async () => {
    const b = new Channel();
    const p1 = b.next();
    const p2 = b.push(1);
    expect(p1).toBe(p2);
    expect(await p1).toBe(await p2);
  });
});

describe('CSP', async () => {
  const Delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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

    player('ping', table);
    player('pong', table);

    await table.push({ hits: 0 });
    await Delay(300);
    await table.return();
    await Delay(0);
    expect(logged).toEqual([
      'ping 1',
      'pong 2',
      'ping 3',
      "pong: table's gone",
      "ping: table's gone",
    ]);
  });
});

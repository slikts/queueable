import Balancer from '../src/Balancer';

const id = (x: any) => x;
const take = async <A>(a: AsyncIterator<A>, n: number) =>
  (await Promise.all(Array.from(Array(n), (_, i) => a.next()))).map(({ value }) => value);

describe('Balancer', () => {
  it('constructs', () => {
    expect(new Balancer()).toBeInstanceOf(Balancer);
  });

  it('can balance pull after push', async () => {
    const b = new Balancer<number>();
    const ns = [1, 2, 3];
    ns.forEach(n => b.push(n));
    const ps = ns.map(() => b.next());
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns);
  });

  it('works with for-await-of', async () => {
    const b = new Balancer<number>();
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
    const b = new Balancer<number>();
    const ns = [1, 2, 3];
    const ps = ns.map(() => b.next());
    ns.forEach(n => b.push(n));
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns);
  });

  it('can be wrapped', async () => {
    const b = new Balancer();
    const ns = [1, 2, 3];
    ns.forEach(n => b.push(n));
    expect(await take(b.wrap(), 3)).toEqual(ns);
  });

  it('wrapper return calls back', async () => {
    const b = new Balancer();
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

  it('throws if pushed when closed', () => {
    const b = new Balancer();
    b.return();
    expect(() => void b.push(123)).toThrow();
  });

  it('can be closed', async () => {
    const b = new Balancer();
    expect(await b.return()).toEqual({ value: undefined, done: true });
    expect(await b.return(123)).toEqual({ value: 123, done: true });
  });

  it(`can't be wrapped if closed`, async () => {
    const b = new Balancer();
    b.return();
    expect(() => b.wrap()).toThrow();
  });

  it(`wrapped balancer returns itself`, async () => {
    const b = new Balancer().wrap();
    expect(b[Symbol.asyncIterator]()).toBe(b);
  });

  it(`rejects unpushed`, async () => {
    const b = new Balancer();
    const p = b.next();
    b.return();
    await expect(p).rejects.toThrowError();
  });

  it(`push and pull are symmetrical`, async () => {
    const b = new Balancer();
    const p1 = b.next();
    const p2 = b.push(1);
    expect(p1).toBe(p2);
    expect(await p1).toBe(await p2);
  });
});

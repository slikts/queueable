import Mono from '../src/Mono';

const value = (value: any) => ({ value, done: false });

describe('Mono', () => {
  it('constructs', () => {
    expect(new Mono()).toBeInstanceOf(Mono);
  });

  it('gets values', async () => {
    const m = new Mono();
    m.push(1);
    expect(await m.next()).toEqual(value(1));
    expect(await m.next()).toEqual(value(1));
    m.push(2);
    expect(await m.next()).toEqual(value(2));
  });

  it('wraps', async () => {
    const m = new Mono();
    const w = m.wrap();
    m.push(1);
    expect(await w.next()).toEqual(value(1));
    expect(await w.next()).toEqual(value(1));
  });

  it('closes', async () => {
    const m = new Mono();
    m.return();
    expect(await m.next()).toEqual({ value: undefined, done: true });
    expect(() => void m.push(1)).toThrow();
  });

  it('closes resolved', async () => {
    const m = new Mono();
    m.push(1);
    expect(await m.return()).toEqual({ value: undefined, done: true });
  });

  it('iterates', () => {
    const m = new Mono();
    expect(m[Symbol.asyncIterator]()).toBe(m);
    const w = m.wrap();
    expect(w[Symbol.asyncIterator]()).toBe(w);
  });

  it('closes wrapped', () => {
    const m = new Mono();
    let a = 0;
    const w = m.wrap(() => {
      a = 1;
    });
    w.return();
    expect(a).toBe(1);
  });

  it('closes wrapped alt', async () => {
    const m = new Mono();
    const w = m.wrap();
    expect(await w.return(123)).toEqual({ value: 123, done: true });
  });
});

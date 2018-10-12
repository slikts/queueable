import { wrapRequest } from '../src/from';
import LastResult from '../src/adapters/LastResult';
import Balancer from '../src/adapters/Balancer';

describe('Mono.fromDom', () => {
  it('handles listeners', async () => {
    const it = LastResult.fromDom('click', ({
      addEventListener(type: any, listener: any) {
        listener(1);
        listener(2);
      },
    } as any) as EventTarget);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 2 },
      { done, value: 2 },
    ]);
  });

  it('unregisters listeners', async () => {
    let a = 0;
    const it = LastResult.fromDom('click', ({
      addEventListener() {},
      removeEventListener() {
        a = 1;
      },
    } as any) as EventTarget);
    // it.next().catch();
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});

describe('Balancer', () => {
  it('fromDom', async () => {
    const it = Balancer.fromDom('click', ({
      addEventListener(type: any, listener: any) {
        listener(1);
        listener(2);
      },
    } as any) as EventTarget);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 2 },
    ]);
  });

  it('fromEmitter', async () => {
    const it = Balancer.fromEmitter('click', ({
      addListener(type: any, listener: any) {
        Promise.resolve().then(() => {
          listener(1);
          listener(2);
        });
      },
    } as any) as NodeJS.EventEmitter);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 2 },
    ]);
  });
});

describe('Mono.fromEmitter', () => {
  it('handles emitters', async () => {
    const it = LastResult.fromEmitter('click', ({
      addListener(type: any, listener: any) {
        Promise.resolve().then(() => {
          listener(1);
          listener(2);
        });
      },
    } as any) as NodeJS.EventEmitter);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 1 },
    ]);
  });

  it('unregisters listeners', async () => {
    let a = 0;
    const it = LastResult.fromEmitter('click', ({
      addListener() {},
      removeListener() {
        a = 1;
      },
    } as any) as NodeJS.EventEmitter);
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});

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

  it('is cancelable', () => {
    const w = wrapRequest(counter());
    expect(w.return(123)).resolves.toEqual(result(123, true));
  });

  it('is cancelable', () => {
    let a = 0;
    const w = wrapRequest(counter(), () => {
      a += 1;
    });
    w.return();
    expect(a).toBe(1);
    expect(w.next()).resolves.toEqual({ value: undefined, done: true });
  });

  it('rejects on cancel', () => {
    let a = 0;
    const w = wrapRequest(counter(), () => {
      a += 1;
    });
    const r = w.next();
    w.return();
    expect(r).rejects.toThrowError();
  });
});

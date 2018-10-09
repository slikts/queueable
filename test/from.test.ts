import { fromDom, fromEmitter } from '../src/from';

describe('fromDom', () => {
  it('handles listeners', async () => {
    const it = fromDom('click', ({
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
    const it = fromDom('click', ({
      addEventListener() {},
      removeEventListener() {
        a = 1;
      },
    } as any) as EventTarget);
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});

describe('fromEmitter', () => {
  it('handles emitters', async () => {
    const it = fromEmitter('click', ({
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

  it('unregisters listeners', async () => {
    let a = 0;
    const it = fromEmitter('click', ({
      addListener() {},
      removeListener() {
        a = 1;
      },
    } as any) as NodeJS.EventEmitter);
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});

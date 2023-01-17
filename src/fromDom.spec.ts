import LastResult from './adapters/LastResult';
import Channel from './adapters/Channel';

describe('LastResult.fromDom', () => {
  it('handles listeners', async () => {
    const it = LastResult.fromDom('click', {
      addEventListener(type: any, listener: any) {
        listener(1);
        listener(2);
      },
    } as any as EventTarget);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 2 },
      { done, value: 2 },
    ]);
  });

  it('unregisters listeners', async () => {
    let a = 0;
    const it = LastResult.fromDom('click', {
      addEventListener() {},
      removeEventListener() {
        a = 1;
      },
    } as any as EventTarget);
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});

describe('Channel.fromDom', () => {
  it('handles listeners', async () => {
    const it = Channel.fromDom('click', {
      addEventListener(type: any, listener: any) {
        listener(1);
        listener(2);
      },
    } as any as EventTarget);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 2 },
    ]);
  });
});
